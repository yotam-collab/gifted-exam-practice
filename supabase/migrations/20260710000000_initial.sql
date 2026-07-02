-- Zinuk Mechunanim — initial schema: profiles, entitlements, purchases, webhook_log.
-- Entitlements are keyed by EMAIL (not user_id) so the Grow webhook can grant
-- access before the buyer ever creates an account; the account claims them on
-- first login. Multi-kit ready via kit_id.

-- ── profiles ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  child_name text,
  exam_date date,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── entitlements ──────────────────────────────────────────────────────────
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,                       -- granted BEFORE the user exists
  kit_id text not null,                       -- e.g. 'stage-b-grade2'
  source text not null check (source in ('grow','manual','promo')),
  purchase_id uuid,
  expires_at timestamptz,                     -- null = no expiry
  created_at timestamptz not null default now(),
  unique (email, kit_id)
);
create index if not exists entitlements_user_idx  on public.entitlements(user_id);
create index if not exists entitlements_email_idx on public.entitlements(lower(email));

-- ── purchases (webhook grants; service-role only) ────────────────────────
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'grow',
  transaction_id text not null,
  payer_email text,
  payer_phone text,
  payer_name text,
  kit_id text not null,
  amount_agorot int,
  status text not null default 'received',    -- received|granted|invited|error|ignored
  created_at timestamptz not null default now(),
  unique (provider, transaction_id)           -- idempotency anchor
);

-- ── webhook_log (raw payloads, service-role only) ────────────────────────
create table if not exists public.webhook_log (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  raw_payload jsonb not null,
  headers jsonb,
  outcome text,                               -- granted|duplicate|bad_secret|parse_error
  created_at timestamptz not null default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.entitlements enable row level security;
alter table public.purchases    enable row level security;
alter table public.webhook_log  enable row level security;

drop policy if exists "own profile read"  on public.profiles;
drop policy if exists "own profile write" on public.profiles;
create policy "own profile read"  on public.profiles for select using (auth.uid() = id);
create policy "own profile write" on public.profiles for update using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "own entitlements" on public.entitlements;
create policy "own entitlements" on public.entitlements for select
  using (
    auth.uid() = user_id
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
-- purchases / webhook_log: NO client policies → service-role only (RLS on,
-- zero policies = deny all to anon/authenticated).

-- ── claim_entitlements(): stamp user_id onto email-matched rows at login ──
create or replace function public.claim_entitlements()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  updated int;
  uid uuid := auth.uid();
  uemail text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if uid is null or uemail = '' then
    return 0;
  end if;
  update public.entitlements
    set user_id = uid
    where user_id is null and lower(email) = uemail;
  get diagnostics updated = row_count;
  return updated;
end;
$$;

grant execute on function public.claim_entitlements() to authenticated;
