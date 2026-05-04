# War Room

Standalone personal task command panel.

- Static frontend: `index.html`
- Hosting: GitHub Pages
- API: Cloudflare Worker
- Database: Supabase `public.war_room_tasks`
- Access: simple PIN gate through the Worker

The browser does not use Supabase Auth or contain a service-role key. The service-role key lives only as a Cloudflare Worker secret.

War Room is separate from Incrementum Dashboard. It shares Supabase infrastructure only, with isolated table names and Worker-enforced access.

See `docs/LIVE_DEPLOY_PLAN.md` for deployment, API, agent access, testing, and rollback notes.
