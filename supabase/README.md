# Supabase — Zinuk Mechunanim

Auth (email magic-link) + entitlements for the paid kit. The app runs fully
**without** Supabase in local-only mode (everyone treated as entitled); wiring
env vars flips on real auth + gating.

## One-time setup

1. **Create / open the project** at supabase.com.
2. **Apply the schema**: run `supabase/migrations/20260710000000_initial.sql`
   in the SQL editor (or `supabase db push` with the CLI linked).
3. **Env vars** — copy `.env.example` → `.env.local` and fill:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Project → Settings → API)
   - `VITE_KIT_ID=stage-b-grade2`
   - `VITE_CHECKOUT_URL` = the Grow payment page URL on the marketing site.
4. **Auth config** (Authentication → URL Configuration):
   - Site URL: `https://<app-domain>` (e.g. `https://mechunanim.znk.co.il`)
   - Additional redirect URLs: add `http://localhost:5173/gifted-exam-practice/auth/callback`
     and the production `…/auth/callback`.
5. **Email templates** (Authentication → Email Templates): translate the
   *Magic Link* and *Invite* templates to Hebrew (RTL). The invite is what a
   buyer receives right after paying.
6. **Edge function secrets** (for the Grow webhook, build step 8):
   `supabase secrets set GROW_WEBHOOK_SECRET=… APP_URL=https://<app-domain>`

## Manual entitlement grant (fallback)

If a purchase's webhook fails or the payload shape is unexpected, grant access
by hand in the SQL editor:

```sql
insert into public.entitlements (email, kit_id, source, expires_at)
values ('buyer@example.com', 'stage-b-grade2', 'manual', '2027-05-31T00:00:00Z')
on conflict (email, kit_id) do update
  set expires_at = excluded.expires_at, source = 'manual';
```

Then invite the buyer to log in: Authentication → Users → **Invite user** with
that email (or they can just request a link at `/auth`). On first login the
`claim_entitlements()` RPC stamps their `user_id` onto the row automatically.

## How gating works

- `entitlements` are keyed by **email** so the webhook can grant access before
  the buyer has an account. RLS lets a user read rows matching either their
  `user_id` or their JWT email.
- Client: `useEntitlement()` queries the kit; on network failure it falls back
  to a 7-day localStorage cache so paying families keep access offline.
- `RequireEntitlement` guards paid routes (`/exam`, `/print/*`); locked library
  items route to `/paywall`.
