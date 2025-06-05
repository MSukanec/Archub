import { useEffect } from 'react';
import { Switch, Route } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/layout/AppLayout';
import AuthPage from '@/pages/AuthPage';
import LandingPage from '@/pages/LandingPage';
import AuthCallback from '@/components/auth/AuthCallback';
import NotFound from '@/pages/not-found';
import { SimpleOnboardingWizard } from '@/components/onboarding/SimpleOnboardingWizard';

function Router() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-2xl">M</span>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {isAuthenticated ? (
        <Route path="*" component={AppLayout} />
      ) : (
        <>
          <Route path="/" component={LandingPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/auth/callback" component={AuthCallback} />
          <Route path="*" component={LandingPage} />
        </>
      )}
    </Switch>
  );
}

function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    let mounted = true;
    
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.log('App: No valid session found, clearing auth state');
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Valid session exists, process user
        console.log('App: Valid session found, processing user');
        processUserSession(session);
      } catch (error) {
        console.log('App: Error getting session:', error);
        setUser(null);
        setLoading(false);
      }
    };
    
    const processUserSession = (session: any) => {
      const basicAuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        firstName: session.user.user_metadata?.first_name || session.user.user_metadata?.full_name?.split(' ')[0] || '',
        lastName: session.user.user_metadata?.last_name || session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        role: session.user.id === '0f77f1c8-ecdf-4484-89a7-022c53f24d5a' ? 'admin' : 'user',
      };
      
      console.log('App: Setting authenticated user:', basicAuthUser);
      setUser(basicAuthUser);
      setLoading(false);
      
      // Enhance with database data in background
      setTimeout(async () => {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('role, first_name, last_name, full_name')
            .eq('auth_id', session.user.id)
            .single();
          
          if (userData && userData.role !== basicAuthUser.role) {
            const enhancedUser = {
              ...basicAuthUser,
              firstName: userData.first_name || basicAuthUser.firstName,
              lastName: userData.last_name || basicAuthUser.lastName,
              role: userData.role,
            };
            
            console.log('App: Enhancing user with database data:', enhancedUser);
            setUser(enhancedUser);
          }
        } catch (error) {
          console.log('Could not enhance user data from database:', error);
        }
      }, 100);
    };
    
    // Initialize on mount
    initializeAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('App: Auth state changed:', event, !!session);
      
      if (!mounted) return;
      
      // Handle logout immediately
      if (event === 'SIGNED_OUT' || !session?.user) {
        console.log('App: User signed out, clearing state...');
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Handle sign in
      if (session?.user) {
        console.log('App: Processing user session from auth state change...');
        processUserSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [setUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
          <SimpleOnboardingWizard />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
