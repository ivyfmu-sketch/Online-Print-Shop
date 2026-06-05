create extension if not exists "uuid-ossp";
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('user','admin')) default 'user',
  email_verified boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  original_name text not null,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  file_size bigint not null,
  page_count int not null default 1,
  storage_path text not null,
  encryption_iv text not null,
  auth_tag text not null,
  created_at timestamptz not null default now(),
  delete_after timestamptz
);
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  document_id uuid not null references documents(id) on delete restrict,
  print_type text not null check (print_type in ('mono','color')),
  copies int not null check (copies > 0),
  orientation text not null check (orientation in ('portrait','landscape')),
  paper_size text not null check (paper_size in ('A4','A3')),
  page_range text not null default 'all',
  price_per_page numeric(10,2) not null,
  amount numeric(10,2) not null,
  status text not null check (status in ('uploaded','payment_pending','paid','printing','completed','failed','cancelled')),
  payment_status text not null check (payment_status in ('pending','success','failed')),
  print_status text not null check (print_status in ('queued','printing','completed','failed','cancelled')),
  transaction_id text,
  printer_name text,
  payment_gateway_response jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create table if not exists settings (
  key text primary key,
  value text not null,
  is_secret boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists audit_logs (
  id bigserial primary key,
  actor_id uuid references users(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_documents_user on documents(user_id);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_status on orders(status,payment_status,print_status);
