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
        console.log('AuthCallback: Starting OAuth callback handling...');
        console.log('AuthCallback: Current URL:', window.location.href);
        
        // First, let's handle the auth state change from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('AuthCallback: Current session:', session);
        console.log('AuthCallback: Session error:', error);
        
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

        if (session?.user) {
          console.log('AuthCallback: Found valid session, processing user...');
          await processUser(session.user);
          return;
        }

        // If no session, check URL for auth fragments
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const accessToken = hashParams.get('access_token') || urlParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || urlParams.get('refresh_token');
        const authCode = urlParams.get('code');
        
        console.log('AuthCallback: URL params check:', {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          authCode: !!authCode
        });
        
        if (accessToken) {
          console.log('AuthCallback: Found access token, setting session...');
          
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          if (sessionError) {
            console.error('Error setting session from tokens:', sessionError);
            toast({
              title: 'Error de autenticación',
              description: 'No se pudieron procesar los tokens de Google.',
              variant: 'destructive',
            });
            navigate('/auth');
            return;
          }
          
          if (sessionData.session?.user) {
            await processUser(sessionData.session.user);
            return;
          }
        }
        
        // If we have an auth code, exchange it for tokens
        if (authCode) {
          console.log('AuthCallback: Found auth code, exchanging for session...');
          
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(authCode);
          
          if (sessionError) {
            console.error('Error exchanging code for session:', sessionError);
            toast({
              title: 'Error de autenticación',
              description: 'No se pudo intercambiar el código de autorización.',
              variant: 'destructive',
            });
            navigate('/auth');
            return;
          }
          
          if (sessionData.session?.user) {
            await processUser(sessionData.session.user);
            return;
          }
        }
        
        console.log('AuthCallback: No valid session or tokens found, redirecting to auth');
        toast({
          title: 'Error de autenticación',
          description: 'No se encontró una sesión válida.',
          variant: 'destructive',
        });
        navigate('/auth');
        
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

    const processUser = async (user: any) => {
      try {
        console.log('AuthCallback: Processing user:', user);
        
        // Get user data from database table with linking
        const dbUser = await authService.getUserFromDatabase(user.id);
        
        const authUser = {
          id: user.id,
          email: user.email || '',
          firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
          lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          role: dbUser?.role || 'user',
        };
        
        console.log('AuthCallback: Setting user in store:', authUser);
        setUser(authUser);
        
        toast({
          title: 'Bienvenido',
          description: 'Has iniciado sesión correctamente con Google.',
        });
        
        // Navigate to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Error processing user:', error);
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