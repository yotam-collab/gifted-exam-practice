// Grow (Meshulam) payment webhook. Grants a kit entitlement (keyed by email)
// and invites the buyer to log in. Design principles:
//   1. Log the raw payload FIRST — every real sale is recoverable by hand.
//   2. Parse tolerantly (Grow may send form-encoded OR json).
//   3. Verify a shared secret; on mismatch, log + return 200 (don't leak).
//   4. Idempotent on (provider, transaction_id).
//   5. A failed invite email must NOT fail the grant.
//   6. Always return 200 so Grow doesn't retry-storm.
//
// Deploy: supabase functions deploy grow-webhook  (verify_jwt disabled via config.toml)
// Grow callback URL: https://<ref>.supabase.co/functions/v1/grow-webhook?secret=<SECRET>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const KIT_MAP: Record<string, string> = {
  // Map a Grow page/process code -> kit id. Fallback below covers v1's single kit.
};
const DEFAULT_KIT = 'stage-b-grade2';

// Access season expiry: full access through May 31; a purchase made on/after
// Jan 1 rolls to the NEXT year's season (guards against a "short" purchase).
function seasonExpiry(now = new Date()): string {
  const year = now.getUTCFullYear();
  const targetYear = now.getUTCMonth() >= 0 && now.getUTCMonth() <= 4 ? year : year + 1;
  // grace: through June 30 of the target year
  return new Date(Date.UTC(targetYear, 5, 30, 23, 59, 59)).toISOString();
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function parseBody(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get('content-type') ?? '';
  try {
    if (ct.includes('application/json')) {
      return await req.json();
    }
    if (ct.includes('form')) {
      const fd = await req.formData();
      return Object.fromEntries([...fd.entries()]);
    }
    // Unknown: try text -> URLSearchParams -> json
    const text = await req.text();
    try {
      return JSON.parse(text);
    } catch {
      return Object.fromEntries(new URLSearchParams(text));
    }
  } catch {
    return {};
  }
}

function pick(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key] ?? (obj.data as Record<string, unknown> | undefined)?.[key];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const url = new URL(req.url);
  const payload = await parseBody(req);
  const headers = Object.fromEntries(req.headers.entries());

  // (1) Log raw first — before any validation.
  const logAndReturn = async (outcome: string) => {
    await admin.from('webhook_log').insert({
      provider: 'grow',
      raw_payload: payload,
      headers,
      outcome,
    });
    return new Response(JSON.stringify({ ok: true, outcome }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  };

  // (3) Shared secret (query param or payload field).
  const expected = Deno.env.get('GROW_WEBHOOK_SECRET') ?? '';
  const provided = url.searchParams.get('secret') ?? (payload.secret ? String(payload.secret) : '');
  if (!expected || !constantTimeEqual(provided, expected)) {
    return await logAndReturn('bad_secret');
  }

  // (2) Extract defensively.
  const transactionId = pick(payload, ['transactionId', 'asmachta', 'transaction_id', 'paymentId']);
  const email = pick(payload, ['payerEmail', 'email', 'customerEmail', 'payer_email'])?.toLowerCase();
  const phone = pick(payload, ['payerPhone', 'phone', 'cell']);
  const name = pick(payload, ['payerName', 'fullName', 'name']);
  const pageCode = pick(payload, ['pageCode', 'processId', 'productId']) ?? '';
  const amount = pick(payload, ['sum', 'amount', 'total']);
  const kitId = KIT_MAP[pageCode] ?? DEFAULT_KIT;

  if (!transactionId || !email) {
    return await logAndReturn('parse_error');
  }

  // (4) Idempotency: insert purchase; a conflict means we already handled it.
  const { data: inserted, error: purchaseErr } = await admin
    .from('purchases')
    .insert({
      provider: 'grow',
      transaction_id: transactionId,
      payer_email: email,
      payer_phone: phone,
      payer_name: name,
      kit_id: kitId,
      amount_agorot: amount ? Math.round(parseFloat(amount) * 100) : null,
      status: 'received',
    })
    .select('id')
    .maybeSingle();

  if (purchaseErr) {
    // Unique violation => duplicate delivery.
    if (purchaseErr.code === '23505') return await logAndReturn('duplicate');
    return await logAndReturn('error:purchase');
  }
  const purchaseId = inserted?.id;

  // (5) Grant entitlement (upsert by email+kit).
  const { error: entErr } = await admin
    .from('entitlements')
    .upsert(
      {
        email,
        kit_id: kitId,
        source: 'grow',
        purchase_id: purchaseId,
        expires_at: seasonExpiry(),
      },
      { onConflict: 'email,kit_id' },
    );
  if (entErr) {
    await admin.from('purchases').update({ status: 'error' }).eq('id', purchaseId);
    return await logAndReturn('error:entitlement');
  }
  await admin.from('purchases').update({ status: 'granted' }).eq('id', purchaseId);

  // (6) Invite the buyer (best-effort — never fails the grant).
  const appUrl = Deno.env.get('APP_URL') ?? '';
  try {
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: appUrl ? `${appUrl}/auth/callback` : undefined,
    });
    await admin.from('purchases').update({ status: 'invited' }).eq('id', purchaseId);
  } catch {
    // Likely: user already exists. That's fine — they can request a link at /auth.
  }

  return await logAndReturn('granted');
});
