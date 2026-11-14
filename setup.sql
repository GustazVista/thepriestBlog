-- Run this ONCE in Supabase: SQL Editor -> New query -> paste -> Run.

-- 1) Tables (locked down with row level security)
create table if not exists public.owner (id uuid primary key references auth.users(id) on delete cascade);
create unique index if not exists owner_single on public.owner ((true));   -- at most ONE owner, ever
create table if not exists public.content (
  id text primary key,
  kind text not null,
  data jsonb not null default '{}'::jsonb
);
alter table public.owner enable row level security;     -- no policies: clients can't read it directly
alter table public.content enable row level security;

-- 2) Helper functions the site calls
create or replace function public.is_owner() returns boolean
  language sql security definer set search_path = public stable
  as $$ select exists (select 1 from public.owner where id = auth.uid()) $$;
create or replace function public.has_owner() returns boolean
  language sql security definer set search_path = public stable
  as $$ select exists (select 1 from public.owner) $$;
grant execute on function public.is_owner(), public.has_owner() to anon, authenticated;

-- 3) First account becomes the owner; every later sign-up is rejected by the database
create or replace function public.lock_signup() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.owner) then
    raise exception 'Registration is closed';
  end if;
  return new;
end $$;
create or replace function public.claim_owner() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.owner (id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists a_lock_signup on auth.users;
drop trigger if exists a_claim_owner on auth.users;
create trigger a_lock_signup before insert on auth.users for each row execute function public.lock_signup();
create trigger a_claim_owner after insert on auth.users for each row execute function public.claim_owner();

-- 4) Content: everyone reads, only the owner writes
drop policy if exists "public read" on public.content;
drop policy if exists "owner write" on public.content;
create policy "public read" on public.content for select using (true);
create policy "owner write" on public.content for all using (public.is_owner()) with check (public.is_owner());

-- 5) Image storage: public bucket, only the owner uploads / replaces / deletes
insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do update set public = true;
drop policy if exists "owner uploads" on storage.objects;
drop policy if exists "owner updates" on storage.objects;
drop policy if exists "owner deletes" on storage.objects;
create policy "owner uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_owner());
create policy "owner updates" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_owner());
create policy "owner deletes" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_owner());
