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

alter table content enable row level security;

drop policy if exists "content_select_authenticated" on content;
drop policy if exists "content_select_public" on content;
create policy "content_select_public"
  on content
  for select
  to public
  using (true);

drop policy if exists "content_insert_authenticated" on content;
create policy "content_insert_authenticated"
  on content
  for insert
  to authenticated
  with check (true);

drop policy if exists "content_update_authenticated" on content;
create policy "content_update_authenticated"
  on content
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "content_delete_authenticated" on content;
create policy "content_delete_authenticated"
  on content
  for delete
  to authenticated
  using (true);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  cover_image_url text,
  short_description text,
  full_description text,
  price numeric(12,2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'Available',
  isbn text,
  published_date date,
  is_published boolean not null default true,
  online_purchase_enabled boolean not null default true,
  hard_copy_enabled boolean not null default true,
  payment_provider_name text,
  payment_url text,
  payment_instructions text,
  download_url text,
  delivery_contact_link text,
  delivery_instructions text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists book_orders (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete restrict,
  book_title_snapshot text not null,
  customer_name text not null,
  phone text not null,
  email text not null,
  quantity integer not null check (quantity > 0),
  delivery_address text not null,
  city_town text not null,
  country text not null,
  additional_instructions text,
  status text not null default 'Pending' check (status in ('Pending', 'Payment received', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_books_published_sort on books(is_published, sort_order, created_at);
create index if not exists idx_book_orders_status_created on book_orders(status, created_at desc);

alter table books enable row level security;
alter table book_orders enable row level security;

drop policy if exists "books_select_public_published" on books;
create policy "books_select_public_published"
  on books
  for select
  to public
  using (is_published = true);

drop policy if exists "books_admin_select_all" on books;
create policy "books_admin_select_all"
  on books
  for select
  to authenticated
  using (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), auth.jwt() ->> 'role', '') = 'admin'
  );

drop policy if exists "books_admin_insert" on books;
create policy "books_admin_insert"
  on books
  for insert
  to authenticated
  with check (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), auth.jwt() ->> 'role', '') = 'admin'
  );

drop policy if exists "books_admin_update" on books;
create policy "books_admin_update"
  on books
  for update
  to authenticated
  using (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), auth.jwt() ->> 'role', '') = 'admin'
  )
  with check (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), auth.jwt() ->> 'role', '') = 'admin'
  );

drop policy if exists "books_admin_delete" on books;
create policy "books_admin_delete"
  on books
  for delete
  to authenticated
  using (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), auth.jwt() ->> 'role', '') = 'admin'
  );

drop policy if exists "book_orders_insert_public" on book_orders;
create policy "book_orders_insert_public"
  on book_orders
  for insert
  to public
  with check (true);

drop policy if exists "book_orders_admin_select" on book_orders;
create policy "book_orders_admin_select"
  on book_orders
  for select
  to authenticated
  using (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), auth.jwt() ->> 'role', '') = 'admin'
  );

drop policy if exists "book_orders_admin_update" on book_orders;
create policy "book_orders_admin_update"
  on book_orders
  for update
  to authenticated
  using (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), auth.jwt() ->> 'role', '') = 'admin'
  )
  with check (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), auth.jwt() ->> 'role', '') = 'admin'
  );

drop policy if exists "book_orders_admin_delete" on book_orders;
create policy "book_orders_admin_delete"
  on book_orders
  for delete
  to authenticated
  using (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), auth.jwt() ->> 'role', '') = 'admin'
  );
