This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Admin portal (Supabase)

1. Create a Supabase project and a table (e.g. `posts`) with appropriate RLS policies.
2. Add the following environment variables to your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Optionally set a `role` on user metadata in Supabase to `admin` for administrative users.
4. Run the app and visit `/admin` to access the admin portal.

This repository includes a simple client-side auth flow and an `AdminPanel` component at `app/components/AdminPanel.tsx` that checks `user.user_metadata.role` for `admin`.

### Server API & RLS

- A server-side Supabase client is included at `app/lib/supabaseServer.ts` and an API at `app/api/content/route.ts` which enforces admin authorization via the `Authorization` header (Bearer token). Use the service role key in the `SUPABASE_SERVICE_ROLE_KEY` env var on Vercel (keep it secret).
- Example RLS policy (run in Supabase SQL editor):

```sql
alter table content enable row level security;

create policy "Admins can manage content" on content
	for all using (
		auth.role() = 'authenticated' and (auth.jwt() ->> 'role') = 'admin'
	);
```

### Deployment (Vercel)

1. Add environment variables in your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. Ensure the Supabase storage bucket `images` exists and is configured to allow public URLs (or adjust upload/getPublicUrl usage accordingly).

3. Deploy normally; server-side APIs will run on Vercel and use the `SUPABASE_SERVICE_ROLE_KEY` stored in Vercel secrets.

Notes:

- The admin editor uses a simple textarea-based body editor and uploads images to Supabase Storage via `app/components/ImageUpload.tsx`.
- For stricter server-side protection of the `/admin` route, consider using Supabase Auth Helpers to persist HTTP-only cookies and verify sessions on the server.
