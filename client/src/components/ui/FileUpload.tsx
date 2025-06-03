import { useState, useRef } from 'react';
import { Upload, X, Image, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface FileUploadProps {
  bucket: string;
  folder?: string;
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  maxSizeBytes?: number;
  placeholder?: string;
  className?: string;
}

export const FileUpload = ({
  bucket,
  folder = '',
  value,
  onChange,
  accept = 'image/*',
  maxSizeBytes = 1024 * 1024, // 1MB by default
  placeholder = 'Subir archivo',
  className = ''
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeBytes) {
      toast({
        title: 'Archivo demasiado grande',
        description: `El archivo debe ser menor a ${formatFileSize(maxSizeBytes)}`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      toast({
        title: 'Tipo de archivo no válido',
        description: 'Por favor selecciona un archivo válido',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // First, check if bucket exists, if not create it
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        throw bucketsError;
      }

      const bucketExists = buckets.some(b => b.name === bucket);
      
      if (!bucketExists) {
        console.log(`Creating bucket: ${bucket}`);
        const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
          fileSizeLimit: maxSizeBytes
        });
        
        if (createBucketError) {
          console.error('Error creating bucket:', createBucketError);
          // Continue anyway, maybe bucket exists but wasn't listed
        }
      }

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setPreview(publicUrl);
      onChange(publicUrl);

      toast({
        title: 'Archivo subido exitosamente',
        description: 'El archivo se ha guardado correctamente',
      });

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error al subir archivo',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Extract file path from URL
      const url = new URL(value);
      const pathSegments = url.pathname.split('/');
      const filePath = pathSegments.slice(-2).join('/'); // bucket/filename

      // Delete from Supabase Storage
      await supabase.storage
        .from(bucket)
        .remove([filePath]);

      setPreview(null);
      onChange('');

      toast({
        title: 'Archivo eliminado',
        description: 'El archivo se ha eliminado correctamente',
      });

    } catch (error: any) {
      console.error('Error removing file:', error);
      toast({
        title: 'Error al eliminar archivo',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          <div className="flex items-center gap-3 p-3 bg-[#e1e1e1] border-[#919191]/20 rounded-xl">
            <div className="flex-shrink-0">
              {accept.includes('image') ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Image className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Archivo subido
              </p>
              <p className="text-xs text-muted-foreground">
                Máximo {formatFileSize(maxSizeBytes)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-20 border-2 border-dashed border-[#919191]/30 hover:border-primary/50 bg-[#e1e1e1] hover:bg-[#d0d0d0] rounded-xl transition-colors"
        >
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Subiendo...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{placeholder}</span>
                <span className="text-xs text-muted-foreground">
                  Máximo {formatFileSize(maxSizeBytes)}
                </span>
              </>
            )}
          </div>
        </Button>
      )}

      {accept.includes('image') && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          <span>Se recomiendan imágenes en formato PNG o JPG</span>
        </div>
      )}
    </div>
  );
};