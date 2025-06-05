# Archub - Guía de Despliegue en Producción

## Configuración para Vercel como `app.archub.com`

### 1. Preparación del Proyecto

Tu proyecto Archub está configurado como una Single Page Application (SPA) con React y está listo para producción. Los archivos de configuración necesarios ya están creados:

- ✅ `vercel.json` - Configuración de Vercel con rewrites para SPA
- ✅ `.env.example` - Template de variables de entorno
- ✅ `client/index.html` - Optimizado para producción con SEO

### 2. Variables de Entorno Requeridas

Configura estas variables en el panel de Vercel:

#### Supabase (Requerido)
```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

#### Google Services (Requerido)
```
VITE_GOOGLE_MAPS_API_KEY=tu_clave_de_google_maps
GOOGLE_CLIENT_ID=tu_client_id_de_google_oauth
GOOGLE_CLIENT_SECRET=tu_client_secret_de_google_oauth
```

#### Aplicación
```
NODE_ENV=production
VITE_APP_URL=https://app.archub.com
```

### 3. Pasos para Desplegar en Vercel

1. **Conectar repositorio:**
   - Sube tu código a GitHub/GitLab
   - Conecta el repositorio en Vercel

2. **Configurar dominio:**
   - En Vercel, ve a Settings > Domains
   - Agrega `app.archub.com`
   - Configura los DNS records en tu proveedor de dominio

3. **Configurar variables de entorno:**
   - En Vercel Settings > Environment Variables
   - Agrega todas las variables listadas arriba

4. **Configurar build:**
   - Framework Preset: Other
   - Build Command: `npm run build:client`
   - Output Directory: `dist/public`

### 4. Configuración de DNS

En tu proveedor de dominio (donde compraste archub.com):

```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### 5. Configuración de Supabase para Producción

En tu proyecto de Supabase:

1. **Authentication Settings:**
   - Site URL: `https://app.archub.com`
   - Redirect URLs: `https://app.archub.com/auth/callback`

2. **Storage Settings:**
   - Asegúrate de que los buckets estén configurados correctamente
   - Verifica las políticas RLS para producción

### 6. Optimizaciones de Producción Implementadas

- ✅ Eliminación automática de plugins de desarrollo en build
- ✅ Configuración de rewrites para SPA routing
- ✅ Headers de cache para assets estáticos
- ✅ Meta tags SEO optimizados
- ✅ Chunks de JavaScript optimizados
- ✅ Compresión y minificación habilitadas

### 7. Verificaciones Post-Despliegue

Después del despliegue, verifica:

- [ ] La aplicación carga correctamente en `https://app.archub.com`
- [ ] Las rutas internas funcionan al refrescar (ej: `/dashboard`)
- [ ] El login con Google funciona
- [ ] La conexión con Supabase es exitosa
- [ ] Los mapas de Google se cargan correctamente
- [ ] El sistema de autenticación funciona completamente

### 8. Archivos de Configuración Creados

#### `vercel.json`
Configuración optimizada para SPA con:
- Rewrites para routing del lado cliente
- Headers de cache para assets
- Configuración de build

#### `.env.example`
Template completo de variables de entorno necesarias

#### `client/index.html`
Optimizado con:
- Meta tags SEO
- Open Graph para redes sociales
- Preconexiones para performance
- Eliminación de scripts de desarrollo

### 9. Comandos Útiles

```bash
# Build local para testing
npm run build:client

# Preview local del build de producción
npm run preview

# Verificar tipos
npm run check
```

### 10. Monitoreo y Mantenimiento

- Usa Vercel Analytics para monitorear performance
- Configura alertas en Supabase para errores de base de datos
- Revisa logs regularmente en el dashboard de Vercel

### 11. Troubleshooting Común

#### Error: Rutas no funcionan al refrescar
- Verificar que `vercel.json` tenga los rewrites correctos

#### Error: Variables de entorno no disponibles
- Asegúrate de que todas las variables empiecen con `VITE_` para el frontend
- Redespliega después de agregar nuevas variables

#### Error: Google OAuth no funciona
- Verifica que las URLs de redirect estén configuradas en Google Console
- Asegúrate de que `VITE_APP_URL` sea correcto

Tu proyecto está completamente preparado para producción. Solo necesitas configurar las variables de entorno y seguir los pasos de despliegue.