-- Ejecuta esto en el SQL Editor de Supabase

create table if not exists months (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  month text not null unique,
  income numeric default 0,
  label text
);

create table if not exists entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  category text,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  month text not null references months(month) on delete cascade
);

-- Permite acceso público (sin auth de Supabase, usamos contraseña propia)
alter table months enable row level security;
alter table entries enable row level security;

create policy "allow all" on months for all using (true) with check (true);
create policy "allow all" on entries for all using (true) with check (true);
