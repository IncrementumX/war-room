# War Room Live Deploy Plan

## Architecture

War Room is a static `index.html` app hosted on GitHub Pages:

- Frontend: `https://incrementumx.github.io/war-room/`
- API: Cloudflare Worker `war-room-api`
- Database: existing Supabase project `oziequrhypzbfdynnnda`
- Table: `public.war_room_tasks`

The browser no longer imports Supabase JS and no longer uses Supabase Auth or magic links. The browser talks only to the Cloudflare Worker. The Worker uses the Supabase service-role key from Cloudflare secrets, validates the War Room PIN, and then reads/writes Supabase.

This keeps the GitHub repo public without putting privileged Supabase credentials in public code.

## PIN Gate

The app asks for a PIN before showing War Room. The expected PIN is stored as a Cloudflare Worker secret:

- `WAR_ROOM_PIN`

The frontend stores the accepted PIN in browser `localStorage` under `warroom_pin`, plus trusted-device metadata under `warroom_trusted_device`, so the same browser can reopen War Room without asking again. This is convenience, not enterprise security: anyone with access to that browser profile can reuse the remembered PIN. The real protection is that Supabase is not public, the service-role key only exists inside Cloudflare, and the Worker still validates `X-War-Room-Pin` on every task request.

To rotate the PIN:

```bash
cd "/Users/incrementum/Documents/Projects/War Room"
npx wrangler secret put WAR_ROOM_PIN --config worker/wrangler.toml
```

Then use the new PIN in the browser and click `Forget PIN` or `Lock` if an old value is cached. Either action clears the remembered-device keys.

## Worker Secrets

Required Cloudflare Worker secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WAR_ROOM_PIN`

Set them with:

```bash
npx wrangler secret put SUPABASE_URL --config worker/wrangler.toml
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config worker/wrangler.toml
npx wrangler secret put WAR_ROOM_PIN --config worker/wrangler.toml
```

Never commit these values. Never paste the service-role key into `index.html`, GitHub, or public docs.

## Worker Endpoints

Base URL:

- `https://war-room-api.incrementumx.workers.dev`

Task endpoints require:

```http
X-War-Room-Pin: <PIN>
```

Endpoints:

- `GET /health`
- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/:client_id`
- `DELETE /tasks/:client_id`
- `POST /tasks/:client_id/archive`
- `POST /tasks/:client_id/restore`
- `POST /tasks/bulk-import`

The Worker has simple in-memory failed-PIN throttling. This is best-effort only because Worker instances are distributed and ephemeral.

## Agent Access

A personal agent can call the Worker API directly.

Example:

```bash
curl -H "X-War-Room-Pin: <PIN>" \
  https://war-room-api.incrementumx.workers.dev/tasks
```

Create/update example:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-War-Room-Pin: <PIN>" \
  -d '{"client_id":"agent-1","title":"Review priorities","priority":"P2","theme":"Agent","subtopic":"Inbox","status":"active"}' \
  https://war-room-api.incrementumx.workers.dev/tasks
```

Do not expose the PIN/API header publicly. If an agent runs in a managed environment, store the PIN as that environment's secret.

## Supabase Schema And RLS

Existing table:

- `public.war_room_tasks`

Migrations:

- `001_create_war_room_tasks.sql`
- `002_allow_worker_owned_tasks.sql`

RLS remains enabled. Existing policies still scope authenticated Supabase users to `auth.uid() = user_id`. The Worker uses the service-role key, which bypasses RLS, so the Worker must enforce access control with the PIN.

`002_allow_worker_owned_tasks.sql` allows `user_id` to be nullable for Worker-created rows while preserving existing rows and policies. It also adds a unique `client_id` index for Worker upserts.

## LocalStorage

The app keeps `warroom_v1_min` as cache/fallback. On first Worker-backed unlock, if Supabase has no War Room tasks and localStorage does, the app bulk-imports local tasks through the Worker.

If the Worker is temporarily unavailable after unlock, local changes remain in localStorage and sync is retried when the API is reachable.

## GitHub Pages

Repository:

- `https://github.com/IncrementumX/war-room`

Pages URL:

- `https://incrementumx.github.io/war-room/`

Deployment source:

- `main` branch, root folder

## Manual Test Steps

1. Open `https://incrementumx.github.io/war-room/`.
2. Enter the PIN.
3. Confirm War Room opens without email or magic link.
4. Add a task.
5. Edit title/comment/theme/subtopic.
6. Change priority inline between P1/P2/P3.
7. Add a task to Order.
8. Complete a task and confirm it moves to Archived.
9. Use Undo on the archive toast.
10. Archive again and filter Archived by date.
11. Refresh and confirm the app opens without asking again.
12. Open from another browser/device, enter PIN once, and confirm the same tasks load.

## Rollback

Frontend rollback:

- Revert to commit `498d3ab` if you want the Supabase Auth/magic-link version back.

Worker rollback:

```bash
npx wrangler rollback --config worker/wrangler.toml
```

Database rollback:

- Do not drop task data.
- If needed, restore `user_id not null` only after all Worker-created null-owner rows are migrated to a valid auth user.

Do not drop or change Incrementum Dashboard tables.
