-- Ejecuta esto en el SQL Editor de Supabase
-- Si ya ejecutaste el SQL anterior, esto borra las tablas viejas primero

drop table if exists entries cascade;
drop table if exists months cascade;
drop table if exists hucha cascade;
drop table if exists hucha_history cascade;

-- Hucha activa (siempre hay exactamente una)
create table hucha (
  id uuid default gen_random_uuid() primary key,
  started_at date not null default current_date,
  income numeric default 0
);

-- Gastos de la hucha activa
create table entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  category text,
  amount numeric not null,
  type text not null check (type in ('income', 'expense'))
);

-- Histórico de huchas cerradas al reiniciar
create table hucha_history (
  id uuid default gen_random_uuid() primary key,
  started_at date not null,
  ended_at date not null default current_date,
  income numeric default 0,
  total_spent numeric default 0,
  snapshot jsonb
);

-- Políticas de acceso público
alter table hucha enable row level security;
alter table entries enable row level security;
alter table hucha_history enable row level security;

create policy "allow all" on hucha for all using (true) with check (true);
create policy "allow all" on entries for all using (true) with check (true);
create policy "allow all" on hucha_history for all using (true) with check (true);

-- Crear la primera hucha
insert into hucha (started_at, income) values (current_date, 0);
