# Campus Guide Admin

Admin site for Campus Guide PU to review student payment receipts.

## Setup

1. Install dependencies: `npm install`
2. Set up environment variables in `.env`
3. Run the development server: `npm run dev`

## Environment Variables

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_ADMIN_EMAIL`: Email address of the admin user

## Features

- Secure login restricted to admin email
- Dashboard with tabs for pending, approved, and rejected receipts
- Preview receipts (images or PDFs)
- Approve or reject receipts with optional notes
- Real-time updates via Supabase realtime
- Responsive design with Tailwind CSS