-- Supabase schema for Crowned Victors content
create table if not exists content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  page text not null,
  title text,
  subtitle text,
  body jsonb,
  metadata jsonb,
  banner_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Example RLS policy: allow select to authenticated users, but insert/update/delete only to admins
-- Enable RLS on the table and create policies as explained in README.
