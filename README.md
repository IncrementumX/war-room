# War Room

Standalone personal task command panel.

- Static frontend: `index.html`
- Hosting target: GitHub Pages
- Data/auth: Supabase Auth + `public.war_room_tasks`
- Security model: Supabase Row Level Security; no service-role keys in browser code

War Room is intentionally separate from Incrementum Dashboard. It shares Supabase infrastructure only, with isolated table names and RLS policies.

See `docs/LIVE_DEPLOY_PLAN.md` for deployment, sync, testing, and rollback notes.
