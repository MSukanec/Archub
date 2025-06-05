import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Upload, Loader2, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/ui/UserAvatar';
import { supabase } from '@/lib/supabase';

interface AvatarUploadProps {
  currentUser?: {
    avatar_url?: string | null;
    avatar_source?: string | null;
    first_name?: string;
    last_name?: string;
  };
}

export default function AvatarUpload({ currentUser }: AvatarUploadProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string>('');

  // Get Google avatar URL from Supabase auth and sync to database if needed
  useEffect(() => {
    async function fetchAndSyncGoogleAvatar() {
      if (!user?.id || !currentUser) return;
      
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.user_metadata?.avatar_url) {
          setGoogleAvatarUrl(authUser.user_metadata.avatar_url);
          
          // If user doesn't have avatar_source set and has Google avatar, sync it
          if (!currentUser.avatar_source && authUser.user_metadata.avatar_url) {
            await supabase
              .from('users')
              .update({
                avatar_url: authUser.user_metadata.avatar_url,
                avatar_source: 'google'
              })
              .eq('auth_id', user.id);
          }
        }
      } catch (error) {
        console.error('Error fetching Google avatar:', error);
      }
    }

    fetchAndSyncGoogleAvatar();
  }, [user?.id, currentUser]);



  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB
        throw new Error('El archivo no puede ser mayor a 2MB');
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Solo se permiten archivos PNG, JPG y JPEG');
      }

      setUploading(true);

      // First, ensure the avatars bucket exists and is public
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const avatarBucket = buckets?.find(bucket => bucket.name === 'avatars');
        
        if (!avatarBucket) {
          console.log('Creating avatars bucket...');
          const { error: createError } = await supabase.storage.createBucket('avatars', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
            fileSizeLimit: 2097152 // 2MB
          });
          
          if (createError) {
            console.error('Bucket creation error:', createError);
            throw new Error('Error al crear el bucket de avatares');
          }
        }
      } catch (bucketError) {
        console.error('Bucket check/creation error:', bucketError);
        // Continue with upload attempt
      }

      // Upload to Supabase Storage
      const fileName = `${user.id}/avatar.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Replace existing file
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Error al subir la imagen');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user record in database
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          avatar_url: publicUrl,
          avatar_source: 'custom'
        })
        .eq('auth_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error('Error al actualizar el perfil');
      }

      return { uploadData, updateData, publicUrl };
    },
    onSuccess: ({ publicUrl }) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-avatar'] });
      
      toast({
        title: 'Avatar actualizado',
        description: 'Tu imagen de perfil ha sido actualizada correctamente.',
      });
      setUploading(false);
    },
    onError: (error: Error) => {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el avatar.',
        variant: 'destructive',
      });
      setUploading(false);
    }
  });

  // Delete avatar mutation
  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      setUploading(true);

      // Delete from Supabase Storage
      const fileName = `${user.id}/avatar.png`;
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([fileName]);

      if (deleteError) {
        console.error('Storage delete error:', deleteError);
        // Continue even if file doesn't exist
      }

      // Update user record in database to remove avatar
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          avatar_url: null,
          avatar_source: null
        })
        .eq('auth_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error('Error al eliminar el avatar');
      }

      return updateData;
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-avatar'] });
      
      toast({
        title: 'Avatar eliminado',
        description: 'Tu imagen de perfil ha sido eliminada correctamente.',
      });
      setUploading(false);
    },
    onError: (error: Error) => {
      console.error('Avatar delete error:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el avatar.',
        variant: 'destructive',
      });
      setUploading(false);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatarMutation.mutate(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteAvatar = () => {
    deleteAvatarMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Imagen de Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          {/* Avatar Display */}
          <div className="relative">
            <div 
              className="relative cursor-pointer group"
              onClick={handleAvatarClick}
            >
              <UserAvatar 
                size="xl" 
                currentUser={currentUser}
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
            </div>

            {/* Source indicator */}
            {currentUser?.avatar_source && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                {currentUser.avatar_source === 'google' ? (
                  <span className="text-xs text-white font-bold">G</span>
                ) : (
                  <Upload className="w-3 h-3 text-white" />
                )}
              </div>
            )}
          </div>

          {/* Avatar Info */}
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-medium">Tu imagen de perfil</h3>
              <p className="text-sm text-muted-foreground">
                Haz clic en el avatar para subir una imagen personalizada.
              </p>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Formatos permitidos: PNG, JPG, JPEG</p>
              <p>• Tamaño máximo: 2MB</p>
              <p>• Recomendado: imagen cuadrada</p>
            </div>

            {currentUser?.avatar_source && (
              <div className="text-xs">
                <span className="text-muted-foreground">Fuente: </span>
                <span className="font-medium">
                  {currentUser.avatar_source === 'google' ? 'Google Account' : 'Imagen personalizada'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Upload and Delete Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {currentUser?.avatar_url ? 'Reemplazar imagen actual' : 'Subir nueva imagen'}
          </p>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAvatarClick}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Seleccionar Imagen
                </>
              )}
            </Button>

            {/* Delete Button - only show if user has avatar */}
            {currentUser?.avatar_url && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDeleteAvatar}
                disabled={uploading}
                className="text-destructive hover:text-destructive"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}