create table if not exists public.war_room_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  title text not null,
  comment text,
  theme text,
  subtopic text,
  priority text check (priority in ('P1','P2','P3')),
  in_order boolean default false,
  status text check (status in ('active','archived')),
  order_index integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz,
  archived_at timestamptz,
  raw jsonb,
  unique(user_id, client_id)
);

create index if not exists war_room_tasks_user_status_order_idx
  on public.war_room_tasks(user_id, status, in_order, order_index);

create index if not exists war_room_tasks_user_updated_idx
  on public.war_room_tasks(user_id, updated_at desc);

create or replace function public.set_war_room_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists war_room_tasks_set_updated_at on public.war_room_tasks;

create trigger war_room_tasks_set_updated_at
before update on public.war_room_tasks
for each row
execute function public.set_war_room_updated_at();

alter table public.war_room_tasks enable row level security;

drop policy if exists "war_room_tasks_select_own" on public.war_room_tasks;
create policy "war_room_tasks_select_own"
on public.war_room_tasks
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "war_room_tasks_insert_own" on public.war_room_tasks;
create policy "war_room_tasks_insert_own"
on public.war_room_tasks
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "war_room_tasks_update_own" on public.war_room_tasks;
create policy "war_room_tasks_update_own"
on public.war_room_tasks
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "war_room_tasks_delete_own" on public.war_room_tasks;
create policy "war_room_tasks_delete_own"
on public.war_room_tasks
for delete
to authenticated
using ((select auth.uid()) = user_id);

alter table public.war_room_tasks replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'war_room_tasks'
  ) then
    alter publication supabase_realtime add table public.war_room_tasks;
  end if;
end;
$$;
