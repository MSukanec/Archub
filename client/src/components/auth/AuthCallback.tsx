import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Starting OAuth callback handling...');
        
        // Check URL parameters for OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        
        const code = urlParams.get('code');
        const error_description = urlParams.get('error_description') || hashParams.get('error_description');
        
        console.log('AuthCallback: URL params:', { code: !!code, error_description });
        
        if (error_description) {
          console.error('OAuth error:', error_description);
          toast({
            title: 'Error de autenticación',
            description: error_description,
            variant: 'destructive',
          });
          navigate('/auth');
          return;
        }

        if (code) {
          console.log('AuthCallback: Found auth code, exchanging for session...');
          // Exchange code for session - the global auth listener will handle the rest
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code:', error);
            toast({
              title: 'Error de autenticación',
              description: 'No se pudo completar el inicio de sesión.',
              variant: 'destructive',
            });
            navigate('/auth');
            return;
          }
          
          // Show success message
          toast({
            title: 'Bienvenido',
            description: 'Has iniciado sesión correctamente con Google.',
          });
          
          // Wait a bit for the global auth listener to process the user
          setTimeout(() => {
            console.log('AuthCallback: Navigating to dashboard...');
            navigate('/dashboard');
          }, 1000);
          return;
        }

        // If no code, check if user is already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('AuthCallback: User already authenticated, navigating to dashboard...');
          navigate('/dashboard');
          return;
        }

        // If we get here, no valid auth data was found
        console.log('AuthCallback: No valid auth data found, redirecting...');
        navigate('/auth');
        
      } catch (error) {
        console.error('AuthCallback: Unexpected error:', error);
        toast({
          title: 'Error',
          description: 'Error inesperado durante la autenticación.',
          variant: 'destructive',
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm text-muted-foreground">
          Completando autenticación...
        </p>
      </div>
    </div>
  );
}