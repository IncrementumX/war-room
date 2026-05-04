alter table public.war_room_tasks
  alter column user_id drop not null;

create unique index if not exists war_room_tasks_client_id_unique
  on public.war_room_tasks(client_id);
