-- InstaMatrix Schema
-- Execute no Supabase SQL Editor

-- Tabela de contas do Instagram
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  instagram_id text not null,
  username text not null,
  display_name text,
  profile_picture text,
  access_token text not null,
  token_expires_at timestamptz,
  page_id text,
  page_access_token text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de fila de publicações
create table posts_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  account_id uuid references accounts(id) on delete cascade,
  post_type text check (post_type in ('reel', 'story')) not null,
  media_url text not null,
  caption text,
  link_url text,
  cta_text text,
  status text check (status in ('pending', 'processing', 'published', 'failed')) default 'pending',
  error_message text,
  instagram_media_id text,
  retry_count int default 0,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Tabela de templates de CTA
create table cta_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  button_text text not null,
  button_color text default '#FF0066',
  text_color text default '#FFFFFF',
  created_at timestamptz default now()
);

-- Inserir CTAs padrão (serão inseridos pelo trigger após criação de usuário)
-- ou manualmente via seed

-- RLS Policies
alter table accounts enable row level security;
alter table posts_queue enable row level security;
alter table cta_templates enable row level security;

create policy "users can manage own accounts"
  on accounts for all using (auth.uid() = user_id);

create policy "users can manage own posts"
  on posts_queue for all using (auth.uid() = user_id);

create policy "users can manage own ctas"
  on cta_templates for all using (auth.uid() = user_id);

-- Seed CTAs padrão
insert into cta_templates (user_id, name, button_text, button_color, text_color)
select
  id,
  name,
  button_text,
  button_color,
  text_color
from
  auth.users,
  (values
    ('Comprar agora', 'Comprar agora', '#FF0066', '#FFFFFF'),
    ('Ver oferta', 'Ver oferta', '#FF4500', '#FFFFFF'),
    ('Entrar hoje', 'Entrar hoje', '#6C5CE7', '#FFFFFF'),
    ('Últimas vagas', 'Últimas vagas', '#E17055', '#FFFFFF'),
    ('Acessar promoção', 'Acessar promoção', '#00B894', '#FFFFFF')
  ) as defaults(name, button_text, button_color, text_color)
on conflict do nothing;
