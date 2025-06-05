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
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('App: Auth state changed:', event, !!session);
      console.log('App: Setting loading to false immediately');
      setLoading(false);
      
      if (!mounted) return;
      
      if (session?.user) {
        console.log('App: Processing user session...');
        try {
          // First, handle auth linking to ensure user exists in internal system
          console.log('App: Importing auth linking service...');
          const { handleAuthLinking } = await import('./lib/authLinkingService');
          console.log('App: Handling auth linking...');
          await handleAuthLinking(session.user as any);
          
          // Get user data from database table
          console.log('App: Importing auth service...');
          const { authService } = await import('./lib/supabase');
          console.log('App: Getting user from database...');
          const dbUser = await authService.getUserFromDatabase(session.user.id);
          
          const authUser = {
            id: session.user.id,
            email: session.user.email || '',
            firstName: session.user.user_metadata?.first_name || session.user.user_metadata?.full_name?.split(' ')[0] || '',
            lastName: session.user.user_metadata?.last_name || session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            role: dbUser?.role || 'user',
          };
          
          console.log('App: Setting authenticated user:', authUser);
          setUser(authUser);
        } catch (error) {
          console.error('App: Error during auth state change:', error);
          
          // Fallback to basic auth user creation
          const authUser = {
            id: session.user.id,
            email: session.user.email || '',
            firstName: session.user.user_metadata?.first_name || '',
            lastName: session.user.user_metadata?.last_name || '',
            role: 'user',
          };
          console.log('App: Setting fallback user:', authUser);
          setUser(authUser);
        }
      } else {
        console.log('App: No session, clearing user');
        setUser(null);
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
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
