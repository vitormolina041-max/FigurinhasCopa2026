create table if not exists public.figurinhas (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  nome text not null,
  pais text not null,
  categoria text not null,
  preco numeric(10, 2) not null default 0,
  quantidade integer not null default 0 check (quantidade >= 0),
  imagem_url text,
  disponivel boolean generated always as (quantidade > 0) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.configuracoes_sistema (
  id text primary key default 'default',
  whatsapp text not null default '14998496036',
  senha_admin text not null default 'admin123',
  nome_site text not null default 'Figurinhas da Copa',
  updated_at timestamptz not null default now(),
  constraint single_config_row check (id = 'default')
);

insert into public.configuracoes_sistema (id, whatsapp, senha_admin, nome_site)
values ('default', '14998496036', 'admin123', 'Figurinhas da Copa')
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.ajustar_estoque_figurinha(p_id uuid, p_delta integer)
returns table (
  id uuid,
  numero text,
  nome text,
  pais text,
  categoria text,
  preco numeric,
  quantidade integer,
  imagem_url text,
  disponivel boolean
)
language plpgsql
as $$
begin
  return query
  update public.figurinhas f
  set quantidade = f.quantidade + p_delta
  where f.id = p_id
    and f.quantidade + p_delta >= 0
  returning
    f.id,
    f.numero,
    f.nome,
    f.pais,
    f.categoria,
    f.preco,
    f.quantidade,
    f.imagem_url,
    f.disponivel;
end;
$$;

drop trigger if exists set_figurinhas_updated_at on public.figurinhas;
create trigger set_figurinhas_updated_at
before update on public.figurinhas
for each row execute function public.set_updated_at();

drop trigger if exists set_configuracoes_updated_at on public.configuracoes_sistema;
create trigger set_configuracoes_updated_at
before update on public.configuracoes_sistema
for each row execute function public.set_updated_at();

alter table public.figurinhas enable row level security;
alter table public.configuracoes_sistema enable row level security;

drop policy if exists "Leitura publica de figurinhas" on public.figurinhas;
create policy "Leitura publica de figurinhas"
on public.figurinhas for select
to anon
using (true);

drop policy if exists "Escrita publica de figurinhas para app simples" on public.figurinhas;
create policy "Escrita publica de figurinhas para app simples"
on public.figurinhas for all
to anon
using (true)
with check (true);

drop policy if exists "Leitura publica de configuracoes" on public.configuracoes_sistema;
create policy "Leitura publica de configuracoes"
on public.configuracoes_sistema for select
to anon
using (id = 'default');

drop policy if exists "Escrita publica de configuracoes para app simples" on public.configuracoes_sistema;
create policy "Escrita publica de configuracoes para app simples"
on public.configuracoes_sistema for all
to anon
using (id = 'default')
with check (id = 'default');
