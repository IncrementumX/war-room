# War Room Live Deploy Plan

## Architecture

War Room remains a standalone `index.html` app hosted separately from Incrementum Dashboard on GitHub Pages. It uses the existing Incrementum Dashboard Supabase project only as shared infrastructure for Auth, Postgres, and Realtime.

War Room data is isolated in `public.war_room_tasks`; it does not use or modify Dashboard application tables.

## Supabase Setup

- Project ref: `oziequrhypzbfdynnnda`
- Frontend URL: `https://oziequrhypzbfdynnnda.supabase.co`
- Browser key: publishable/anon key only
- Secret/service-role keys are not used in frontend code

Migration file:

- `supabase/migrations/001_create_war_room_tasks.sql`

The migration creates `public.war_room_tasks`, adds useful indexes, maintains `updated_at`, enables RLS, adds owner-scoped policies, and enables Realtime publication for the table.

## Schema And RLS

Each row has a `user_id` referencing `auth.users(id)`. RLS policies allow authenticated users to select, insert, update, and delete only rows where `auth.uid() = user_id`.

Insert and update policies both enforce ownership with `with check`, preventing a browser client from writing rows for another user.

## Auth Flow

The page starts on a minimal access screen. The lightweight local passphrase gate is a UI barrier only; it is stored as a browser-local SHA-256 hash and is not real security.

Real data protection comes from Supabase Auth plus RLS. The War Room UI is not shown until the local gate passes and a Supabase session exists.

The app uses email magic links through Supabase Auth. After GitHub Pages is enabled, add the deployed URL to Supabase Auth redirect URLs.

## Supabase Configuration

The public browser config is in the clearly marked `SUPABASE_CONFIG` section inside `index.html`.

Only these values belong there:

- `url`
- `anonKey`

Never paste a service-role key, secret key, database password, JWT secret, or other private credential into frontend code.

## LocalStorage Import

Existing localStorage data under `warroom_v1_min` is preserved. On first authenticated login per Supabase user, local tasks are imported into `public.war_room_tasks` using the existing local task id as `client_id`.

After login, Supabase is treated as the source of truth. localStorage remains a cache/fallback and stores pending deletes until sync succeeds.

## Realtime Sync

The app subscribes to changes on `public.war_room_tasks`. When another browser/device creates, edits, archives, restores, or deletes a task, the current browser refreshes from Supabase.

## GitHub Pages

Recommended deployment:

- Repository: `IncrementumX/war-room`
- Visibility: public
- Pages source: `main` branch, root folder
- Build system: none

Expected Pages URL:

- `https://incrementumx.github.io/war-room/`

## Manual Test Steps

1. Open the deployed War Room page.
2. Pass the local access gate.
3. Sign in with Supabase magic link.
4. Add a task.
5. Edit the task title/comment/theme/subtopic.
6. Change priority inline between P1/P2/P3.
7. Add the task to Order.
8. Complete the task and confirm it appears in Archived.
9. Use Undo on the archive toast.
10. Archive again and filter Archived by date.
11. Reload the page and confirm data loads from Supabase.
12. Open the page in another browser/device, sign in, and confirm tasks sync.

## Rollback

Frontend rollback:

- Restore `index_before_supabase_github_pages.html` over `index.html`.
- Commit and push the rollback.

Database rollback:

- Disable the War Room UI or remove Supabase config first.
- Drop only `public.war_room_tasks` if explicitly desired:

```sql
drop table if exists public.war_room_tasks;
drop function if exists public.set_war_room_updated_at();
```

Do not drop or change Incrementum Dashboard tables.
