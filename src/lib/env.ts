// Environment configuration with fallbacks
export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  PROD: import.meta.env.PROD || false,
  DEV: import.meta.env.DEV || true,
} as const;

// Validation helper
export const validateEnv = () => {
  const errors: string[] = [];
  
  if (!env.SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!env.SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  if (errors.length > 0) {
    console.warn('Environment validation warnings:', errors);
  }
  
  return errors.length === 0;
};