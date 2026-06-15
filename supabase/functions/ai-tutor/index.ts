// ============================================================
//  AI Literacy Academy — OpenAI proxy (Supabase Edge Function)
//  File: supabase/functions/ai-tutor/index.ts
// ------------------------------------------------------------
//  WHY THIS EXISTS
//  Your OpenAI API key must NEVER ship to the browser. This
//  function holds the key server-side, forwards learner prompts
//  to OpenAI, and returns only the text. The browser app calls
//  THIS, never OpenAI directly.
//
//  WHAT IT DOES
//   • Adds your secret OpenAI key (from Supabase secrets)
//   • Calls gpt-4o-mini and returns { text }
//   • Enforces a per-user daily request cap (default 40/day)
//   • Handles CORS so the app can call it from the browser
//
//  ── SETUP (≈5 minutes, you never paste your key into code) ──
//  1. Install the CLI:        npm i -g supabase
//  2. Log in / link project:  supabase login && supabase link
//  3. Drop this file at:      supabase/functions/ai-tutor/index.ts
//  4. Store your key SECRET (this is the only place it lives):
//        supabase secrets set OPENAI_API_KEY=sk-...your-key...
//  5. (Optional) change the daily cap:
//        supabase secrets set DAILY_LIMIT=40
//  6. Deploy:
//        supabase functions deploy ai-tutor --no-verify-jwt
//  7. Copy the printed URL into BACKEND_URL in the .jsx app:
//        https://YOUR-PROJECT.supabase.co/functions/v1/ai-tutor
//
//  The rate limiter uses a tiny table. Run this once in the
//  Supabase SQL editor:
//
//    create table if not exists ai_usage (
//      user_key text not null,
//      day      date not null,
//      count    int  not null default 0,
//      primary key (user_key, day)
//    );
//    alter table ai_usage enable row level security;
//    -- no policies: only the service role (this function) touches it
//
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DAILY_LIMIT = Number(Deno.env.get("DAILY_LIMIT") ?? "40");
const MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";

const CORS = {
  "Access-Control-Allow-Origin": "*", // tighten to your domain in production
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const db = createClient(SUPABASE_URL, SERVICE_ROLE);

// Per-user daily counter. Returns true if the request is allowed.
async function underLimit(userKey: string): Promise<boolean> {
  if (!DAILY_LIMIT) return true; // 0 disables limiting
  const day = new Date().toISOString().slice(0, 10);

  const { data } = await db
    .from("ai_usage")
    .select("count")
    .eq("user_key", userKey)
    .eq("day", day)
    .maybeSingle();

  const current = data?.count ?? 0;
  if (current >= DAILY_LIMIT) return false;

  await db
    .from("ai_usage")
    .upsert({ user_key: userKey, day, count: current + 1 }, { onConflict: "user_key,day" });
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const { prompt, maxTokens = 1000 } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return json({ error: "Missing prompt" }, 400);
    }

    // Identify the learner for rate limiting. If you add Supabase
    // Auth later, prefer the verified user id; until then we fall
    // back to client IP so one browser can't drain the budget.
    const userKey =
      req.headers.get("x-user-id") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "anon";

    if (!(await underLimit(userKey))) {
      return json({ error: "Daily limit reached" }, 429);
    }

    const oa = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: Math.min(Number(maxTokens) || 1000, 1500),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!oa.ok) {
      const detail = await oa.text();
      console.error("OpenAI error", oa.status, detail);
      return json({ error: "Upstream error", status: oa.status }, 502);
    }

    const data = await oa.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return json({ text });
  } catch (e) {
    console.error(e);
    return json({ error: "Bad request" }, 400);
  }
});
