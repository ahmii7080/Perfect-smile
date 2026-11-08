// Website chatbot: POST /api/chat  { sessionId, visitorId, messages: [{ role, content }] }
// Answers patients from live clinic content (services, consultants, team, blog)
// plus Admin → Chatbot knowledge, using Gemini. GEMINI_API_KEY lives only in
// Vercel env vars — never in the Angular bundle.
import { select, rpc } from './_supabase.mjs';

const GEMINI_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const GEMINI_MODELS = () => [process.env.GEMINI_MODEL, 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash'].filter(Boolean);
const HANDOFF = '[[HANDOFF]]';

const DEFAULT_CONFIG = {
  is_enabled: true,
  bot_name: 'Smile Assistant',
  max_messages: 10,
  handoff_message: 'Our team can answer that properly. Message us on WhatsApp or book an appointment and we will get back to you.',
};

/** Fixed clinic facts — keep in sync with src/app/data/clinic-info.ts. */
const CLINIC = `## About the clinic
The Perfect Smile Dental Clinic, Faisalabad, Pakistan — a premium dental & implant clinic.
Lead dentist: Dr. Muhammad Faizan Sheikh (BDS, Diploma in Crown & Bridge, Certificate in Orthodontics, Certificate in Implantology; ex-House Surgeon, Sharif Hospital Lahore). Multi-disciplinary: implants, orthodontics/braces, crown & bridge, cosmetic dentistry, smile design, general dentistry.
Address: Adjacent Rehman Garden Gate No. 1, Fish Farm, Satyana (Stayana) Road, Faisalabad.
Timings: Monday to Saturday, 5:00 pm – 10:00 pm. Sunday closed.
Phone / WhatsApp: +92 324 7734135. Email: faizanwaris765@gmail.com.
Book a visit: /appointment page or WhatsApp. Contact page: /contact.
Clinic values: strict sterilisation (autoclave, single-use disposables), transparent pricing with quotes upfront, flexible instalment plans on major treatments.
Pages: /services, /doctors, /team, /gallery (before/after cases), /blog, /about, /appointment, /contact.`;

/** Small in-memory rate limit per IP (per server instance). */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 12;
}

const safe = (p) => select(p).catch((e) => { console.error('[chat]', e.message); return []; });
const plain = (s, max = 600) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

async function loadConfig() {
  const [row] = await safe('chatbot_settings?select=*&id=eq.1');
  const merged = { ...DEFAULT_CONFIG };
  for (const [k, v] of Object.entries(row ?? {})) if (v !== null && v !== '') merged[k] = v;
  return merged;
}

/** Everything the bot may say, built from what is live on the website. */
async function loadFacts() {
  const [extra, services, consultants, team, posts] = await Promise.all([
    safe('chatbot_knowledge?select=title,content&published=eq.true&order=sort'),
    safe('services?select=slug,title,summary,benefits,faqs&order=sort_order'),
    safe('visiting_consultants?select=name,qualifications,specialty'),
    safe('team_members?select=name,role'),
    safe('blog_posts?select=slug,title&order=date.desc&limit=25'),
  ]);
  return [
    CLINIC,
    ...extra.map((k) => `## ${k.title}\n${plain(k.content, 2000)}`),
    services.length && `## Treatments (details on /services/<slug>)\n${services.map((s) =>
      `- ${s.title} (/services/${s.slug}): ${plain(s.summary, 300)}${(s.benefits ?? []).length ? ` Benefits: ${plain((s.benefits ?? []).join('; '), 250)}` : ''}`).join('\n')}`,
    ...services.flatMap((s) => (Array.isArray(s.faqs) ? s.faqs : []).slice(0, 4)
      .filter((f) => f?.q || f?.question)
      .map((f) => `## FAQ (${s.title}): ${plain(f.q ?? f.question, 200)}\n${plain(f.a ?? f.answer, 600)}`)),
    consultants.length && `## Visiting consultants\n${consultants.map((c) => `- ${c.name} — ${c.specialty} (${c.qualifications})`).join('\n')}`,
    team.length && `## Support team\n${team.map((t) => `- ${t.name} — ${t.role}`).join('\n')}`,
    posts.length && `## Blog articles\n${posts.map((p) => `- ${p.title}: /blog/${p.slug}`).join('\n')}`,
  ].filter(Boolean).join('\n\n');
}

async function askGemini(key, system, history) {
  for (const model of GEMINI_MODELS()) {
    try {
      const res = await fetch(GEMINI_URL(model), {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
        }),
        signal: AbortSignal.timeout(9_000),
      });
      if (!res.ok) {
        console.error('[chat] gemini', model, res.status, (await res.text()).slice(0, 200));
        continue;
      }
      const json = await res.json();
      const parts = json.candidates?.[0]?.content?.parts ?? [];
      const reply = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('').trim();
      if (reply) return reply;
    } catch (e) {
      console.error('[chat] gemini error', model, e.message);
    }
  }
  return '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');

  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'local';
  if (rateLimited(ip)) return res.status(429).json({ reply: 'Please wait a moment before sending another message.', handoff: false });

  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch { body = null; }
  body = body ?? {};

  const sessionId = /^[0-9a-f-]{36}$/i.test(body.sessionId ?? '') ? body.sessionId : null;
  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));
  const last = history.at(-1);
  if (!sessionId || !last || last.role !== 'user') return res.status(400).json({ error: 'Bad request' });

  const config = await loadConfig();
  const userCount = history.filter((m) => m.role === 'user').length;

  // Server-side message limit (clearing the browser does not reset it)
  const stored = await rpc('chat_message_count', { p_session: sessionId }).catch(() => 0);
  const used = Math.max(Number(stored) || 0, userCount);
  const handoffReply = { reply: config.handoff_message, handoff: true, remaining: 0 };
  if (!config.is_enabled || used > config.max_messages) return res.status(200).json(handoffReply);

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(200).json({ reply: 'The assistant is being set up. Please message us on WhatsApp and our team will reply.', handoff: true, remaining: 0 });
  }

  const system = `You are "${config.bot_name}", the website assistant of The Perfect Smile Dental Clinic in Faisalabad.

RULES
- Answer ONLY using the INFORMATION below. Never invent prices, discounts, guarantees, doctor names, results or timelines. If a price is not listed, say the doctor gives an exact quote after a check-up.
- You are NOT a dentist. Never diagnose, never prescribe or name medicines/doses. For pain, swelling or any symptom, give general guidance only and advise booking a check-up. For severe pain, heavy bleeding, facial swelling, fever or trauma, tell them to call +92 324 7734135 right away or go to the nearest emergency department.
- Keep answers short: 1–3 sentences, warm and clear. You may point to a page path from the information, e.g. /appointment.
- Reply in the same language the visitor uses (English, Urdu or Roman Urdu).
- If the answer is not in the INFORMATION, or the visitor wants to book, get a personal quote or talk to the doctor: say the team will help and end your reply with ${HANDOFF}
- Never ask for passwords, payment details or medical record numbers.

INFORMATION
${await loadFacts()}`;

  let reply = await askGemini(key, system, history);
  if (!reply) {
    return res.status(200).json({ reply: "Sorry, I can't answer right now. Please message us on WhatsApp and our team will help.", handoff: true, remaining: 0 });
  }

  const wantsHandoff = reply.includes(HANDOFF);
  reply = reply.replaceAll(HANDOFF, '').trim();
  const remaining = Math.max(0, config.max_messages - used);

  await rpc('log_chat', {
    p_session: sessionId,
    p_visitor: String(body.visitorId ?? '').slice(0, 80),
    p_messages: [...history, { role: 'assistant', content: reply }],
  }).catch((e) => console.error('[chat] log', e.message));

  return res.status(200).json({ reply, handoff: wantsHandoff || remaining === 0, remaining });
}
