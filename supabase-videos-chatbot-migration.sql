-- ============================================================
-- The Perfect Smile — Videos + AI chatbot
-- Run once in Supabase → SQL Editor → Run  (safe to re-run)
--
-- Adds:
--   1. videos              — clinic videos shown on /about
--   2. chatbot_settings    — single-row bot config (name, welcome, limits)
--   3. chatbot_knowledge   — extra facts the bot may use
--   4. chat_sessions       — conversation logs (admin-only read)
--   5. log_chat() / chat_message_count() — the only way visitors write logs
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- =================== 1. VIDEOS ===================
create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  video_url   text not null,
  poster_url  text,
  width       int,
  height      int,
  sort_order  int not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists videos_sort_idx on public.videos (sort_order);

drop trigger if exists trg_videos_updated on public.videos;
create trigger trg_videos_updated before update on public.videos
  for each row execute function public.set_updated_at();

alter table public.videos enable row level security;
drop policy if exists "public read" on public.videos;
drop policy if exists "auth full"   on public.videos;
create policy "public read" on public.videos for select to anon, authenticated using (published = true);
create policy "auth full"   on public.videos for all    to authenticated         using (true) with check (true);

-- Let the existing `clinic-images` bucket accept video files.
-- Only touches the bucket if it has a MIME allow-list / size cap set.
update storage.buckets
   set allowed_mime_types = allowed_mime_types || array['video/webm', 'video/mp4']
 where id = 'clinic-images'
   and allowed_mime_types is not null
   and not ('video/webm' = any (allowed_mime_types));

update storage.buckets
   set file_size_limit = 52428800          -- 50 MB
 where id = 'clinic-images'
   and file_size_limit is not null
   and file_size_limit < 52428800;

-- =================== 2. CHATBOT SETTINGS ===================
create table if not exists public.chatbot_settings (
  id              int primary key default 1 check (id = 1),
  is_enabled      boolean not null default true,
  bot_name        text default 'Smile Assistant',
  welcome_message text default 'Assalam-o-Alaikum! 👋 Ask me about our treatments, timings or how to book a visit.',
  max_messages    int not null default 10,
  handoff_message text default 'Our team can answer that properly. Message us on WhatsApp or book an appointment and we will get back to you.',
  suggestions     text[] not null default array[
                    'What are your clinic timings?',
                    'Do you do dental implants?',
                    'How do I book an appointment?',
                    'Where is the clinic?'],
  updated_at      timestamptz default now()
);
insert into public.chatbot_settings (id) values (1) on conflict (id) do nothing;

-- =================== 3. CHATBOT KNOWLEDGE ===================
create table if not exists public.chatbot_knowledge (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  sort        int default 0,
  published   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- =================== 4. CHAT LOGS ===================
create table if not exists public.chat_sessions (
  id            uuid primary key,
  visitor_id    text,
  messages      jsonb not null default '[]'::jsonb,
  message_count int not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists chat_sessions_updated_idx on public.chat_sessions (updated_at desc);

drop trigger if exists trg_chatbot_settings_updated on public.chatbot_settings;
create trigger trg_chatbot_settings_updated before update on public.chatbot_settings
  for each row execute function public.set_updated_at();
drop trigger if exists trg_chatbot_knowledge_updated on public.chatbot_knowledge;
create trigger trg_chatbot_knowledge_updated before update on public.chatbot_knowledge
  for each row execute function public.set_updated_at();
drop trigger if exists trg_chat_sessions_updated on public.chat_sessions;
create trigger trg_chat_sessions_updated before update on public.chat_sessions
  for each row execute function public.set_updated_at();

alter table public.chatbot_settings  enable row level security;
alter table public.chatbot_knowledge enable row level security;
alter table public.chat_sessions     enable row level security;

drop policy if exists "public read" on public.chatbot_settings;
drop policy if exists "auth full"   on public.chatbot_settings;
create policy "public read" on public.chatbot_settings for select to anon, authenticated using (true);
create policy "auth full"   on public.chatbot_settings for all    to authenticated         using (true) with check (true);

drop policy if exists "public read" on public.chatbot_knowledge;
drop policy if exists "auth full"   on public.chatbot_knowledge;
create policy "public read" on public.chatbot_knowledge for select to anon, authenticated using (published = true);
create policy "auth full"   on public.chatbot_knowledge for all    to authenticated         using (true) with check (true);

-- Visitors can NOT read chat logs — only log_chat() below writes them.
drop policy if exists "auth full" on public.chat_sessions;
create policy "auth full" on public.chat_sessions for all to authenticated using (true) with check (true);

-- =================== 5. RPC FUNCTIONS ===================
create or replace function public.log_chat(p_session uuid, p_visitor text, p_messages jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare
  n int := (select count(*) from jsonb_array_elements(p_messages) m where m->>'role' = 'user');
begin
  if jsonb_array_length(p_messages) > 60 then
    raise exception 'conversation too long';
  end if;
  insert into public.chat_sessions (id, visitor_id, messages, message_count)
  values (p_session, left(p_visitor, 80), p_messages, n)
  on conflict (id) do update
    set messages      = excluded.messages,
        message_count = greatest(public.chat_sessions.message_count, excluded.message_count);
  return n;
end $$;

create or replace function public.chat_message_count(p_session uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select message_count from public.chat_sessions where id = p_session), 0);
$$;

revoke all on function public.log_chat(uuid, text, jsonb) from public;
revoke all on function public.chat_message_count(uuid)   from public;
grant execute on function public.log_chat(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.chat_message_count(uuid)   to anon, authenticated;
