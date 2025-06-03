-- Política RLS para el bucket organization-logo
-- Ejecutar este SQL en Supabase SQL Editor

-- Permitir a usuarios autenticados subir archivos al bucket organization-logo
CREATE POLICY "Give users authenticated access to organization logos" ON storage.objects
FOR ALL USING (
  bucket_id = 'organization-logo' AND 
  auth.role() = 'authenticated'
);

-- Política alternativa más específica (opcional, usar solo una de las dos)
-- CREATE POLICY "Organization logo access for authenticated users" ON storage.objects
-- FOR ALL USING (
--   bucket_id = 'organization-logo' AND 
--   auth.uid() IS NOT NULL
-- );