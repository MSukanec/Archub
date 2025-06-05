# Archmony - Construction Project Management

Professional construction project management web application designed to streamline project workflows and enhance team collaboration through intelligent financial tracking and organizational management.

## Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: TailwindCSS with Shadcn/ui components
- **State Management**: Zustand + React Query (TanStack Query)
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tool**: Vite
- **Deployment**: Vercel (SPA)

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

### Deploy to Vercel

1. Push to GitHub repository
2. Connect repository to Vercel
3. Vercel will automatically use the settings from `vercel.json`:
   - Build Command: `vite build`
   - Output Directory: `dist/public`
   - Framework: None (SPA)

## Environment Variables

For Supabase integration, set these environment variables in Vercel:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
├── client/           # React frontend source
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── stores/
│   └── index.html
├── shared/           # Shared types and schemas
├── server/           # Express backend (development only)
├── migrations/       # Database migrations
└── dist/public/      # Build output (Vercel deployment)
```

## Features

- 📊 Project and budget management
- 👥 Team collaboration tools
- 📈 Financial tracking and reporting
- 📋 Site logs and progress tracking
- 📅 Calendar and scheduling
- 🏗️ Construction-specific workflows
- 🔐 Role-based access control
- 📱 Responsive design

## Development Notes

- Uses single-page application (SPA) architecture for Vercel deployment
- All routes handled client-side with Wouter routing
- Database operations through Supabase client
- Component library based on Radix UI primitives