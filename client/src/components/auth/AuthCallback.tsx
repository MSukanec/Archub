import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const { setUser } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL fragments
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          toast({
            title: 'Error de autenticación',
            description: 'No se pudo completar el inicio de sesión con Google.',
            variant: 'destructive',
          });
          navigate('/auth');
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;
          
          // Get user data from database table
          const dbUser = await authService.getUserFromDatabase(user.id);
          
          const authUser = {
            id: user.id,
            email: user.email || '',
            firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
            lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            role: dbUser?.role || 'user',
          };
          
          setUser(authUser);
          
          toast({
            title: 'Bienvenido',
            description: 'Has iniciado sesión correctamente con Google.',
          });
          
          // Navigate to dashboard
          navigate('/dashboard');
        } else {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        toast({
          title: 'Error',
          description: 'Ocurrió un error durante la autenticación.',
          variant: 'destructive',
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, setUser, toast]);

  return (
    <div className="min-h-screen bg-surface-views flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Completando autenticación...</h2>
        <p className="text-muted-foreground">
          Estamos configurando tu cuenta. Solo tomará un momento.
        </p>
      </div>
    </div>
  );
}