import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { setUser } = useAuthStore();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await authService.signIn(data.email, data.password);
      
      if (error) {
        toast({
          title: 'Error de autenticación',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (authData.user) {
        // Get user data from database table
        const dbUser = await authService.getUserFromDatabase(authData.user.id);
        
        const authUser = {
          id: authData.user.id,
          email: authData.user.email || '',
          firstName: authData.user.user_metadata?.first_name || '',
          lastName: authData.user.user_metadata?.last_name || '',
          role: dbUser?.role || 'user', // Use role from database table
        };
        
        console.log('User from database:', dbUser);
        setUser(authUser);
        
        toast({
          title: 'Bienvenido',
          description: 'Has iniciado sesión correctamente',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await authService.signInWithGoogle();
      
      if (error) {
        toast({
          title: 'Error de autenticación',
          description: error.message,
          variant: 'destructive',
        });
      }
      // El redirect será manejado por Supabase
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">A</span>
        </div>
        <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingresa a tu cuenta de Archub
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="tu@email.com"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-4"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continuar con Google
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-primary hover:text-primary/90 font-medium"
            >
              Regístrate aquí
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
