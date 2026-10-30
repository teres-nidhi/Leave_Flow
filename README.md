# LeaveFlow

LeaveFlow is a React and Supabase employee leave management application for employees, managers, and HR administrators.

## Features

- Supabase email/password authentication and role-based protected routes
- Employee dashboard, leave balances, leave applications, history, and calendar
- Manager team approvals and rejection reasons
- HR employee management, policy management, holiday management, reports, settings, and notifications
- CSV exports, responsive layouts, local demo mode, and Supabase-ready database operations
- PostgreSQL migration with RLS, indexes, audit logging, and an atomic approval RPC

## Prerequisites

- Node.js 20 or newer
- Supabase project
- Vercel account for production deployment

## Local installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase environment variables, the app uses a fully interactive local demo workspace. Demo accounts are available on the login page.

## Environment configuration

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Never place the Supabase service-role key in Vite environment variables or frontend source.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/20261030000000_leaveflow.sql` in the SQL Editor or with the Supabase CLI.
3. Enable the Email authentication provider.
4. Add local and production redirect URLs in Authentication settings.
5. Create organization and profile records through trusted setup SQL.

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## Initial administrator

Create the authentication user first, then insert its matching profile and assign the admin role. Do not expose role selection in public registration.

```sql
insert into public.profiles (id, organization_id, employee_id, full_name, email, role)
values ('AUTH_USER_UUID', 'ORG_UUID', 'LF-ADMIN-001', 'HR Administrator', 'admin@example.com', 'admin');
```

## Development commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## GitHub upload

```bash
git init
git add .
git commit -m "Initial LeaveFlow application"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## Vercel deployment

Import the GitHub repository in Vercel and configure the two `VITE_SUPABASE_*` environment variables for Preview and Production. `vercel.json` contains the SPA routing rewrite. Supabase remains the persistent database and authentication backend.
