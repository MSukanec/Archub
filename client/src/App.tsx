import { useEffect } from 'react';
import { Switch, Route } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/authStore';
import AppLayout from '@/components/layout/AppLayout';
import AuthPage from '@/pages/AuthPage';
import LandingPage from '@/pages/LandingPage';
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
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  const { setLoading } = useAuthStore();

  useEffect(() => {
    // Initialize app
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [setLoading]);

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
