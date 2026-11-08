// Shared Supabase REST helpers for the Vercel functions in /api.
// Files starting with "_" are not deployed as routes.

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cgmvvpfrfdwbficxuknc.supabase.co';
// anon key is a PUBLIC key (protected by RLS) — same one the browser app uses.
export const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbXZ2cGZyZmR3YmZpY3h1a25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDE5MTIsImV4cCI6MjA5MzgxNzkxMn0.O9IopmZLpxDQuHJzmAqw7ybLaCPIRMtMUDwXIDNkqRs';

const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

/** GET /rest/v1/<path> — e.g. select('services?select=title&order=sort_order') */
export async function select(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers, signal: AbortSignal.timeout(5_000) });
  if (!res.ok) throw new Error(`${path.split('?')[0]}: ${res.status}`);
  return res.json();
}

/** POST /rest/v1/rpc/<fn> */
export async function rpc(fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers, body: JSON.stringify(args), signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`rpc ${fn}: ${res.status}`);
  return res.json();
}
