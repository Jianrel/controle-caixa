-- ============================================
-- CONTROLE DE CAIXA - Schema para Supabase
-- Execute no SQL Editor do Supabase
-- ============================================

-- Tabela de categorias (compartilhada entre usuários)
create table categoria (
    id serial primary key,
    nome varchar(100) unique not null,
    tipo varchar(10) not null check (tipo in ('entrada', 'saida')),
    descricao varchar(255),
    ativa boolean default true,
    cor varchar(7) default '#6c757d'
);

-- Tabela de pacientes
create table paciente (
    id serial primary key,
    nome varchar(150) not null,
    cpf varchar(14) unique not null,
    telefone varchar(20),
    email varchar(150),
    observacoes text,
    criado_em timestamp with time zone default now(),
    atualizado_em timestamp with time zone default now(),
    usuario_id uuid references auth.users(id) not null default auth.uid()
);

-- Tabela de lançamentos (entradas e saídas)
create table lancamento (
    id serial primary key,
    tipo varchar(10) not null check (tipo in ('entrada', 'saida')),
    valor numeric(10,2) not null check (valor > 0),
    descricao varchar(255),
    data date not null default current_date,
    forma_pagamento varchar(30) not null,
    observacoes text,
    criado_em timestamp with time zone default now(),
    atualizado_em timestamp with time zone default now(),
    usuario_id uuid references auth.users(id) not null default auth.uid(),
    categoria_id integer references categoria(id) not null,
    paciente_id integer references paciente(id)
);

-- Índices
create index idx_lancamento_data on lancamento(data);
create index idx_lancamento_tipo on lancamento(tipo);
create index idx_lancamento_usuario on lancamento(usuario_id);
create index idx_paciente_usuario on paciente(usuario_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

alter table categoria enable row level security;
alter table paciente enable row level security;
alter table lancamento enable row level security;

-- Categorias: todos autenticados podem ler e modificar
create policy "categoria_select" on categoria for select to authenticated using (true);
create policy "categoria_insert" on categoria for insert to authenticated with check (true);
create policy "categoria_update" on categoria for update to authenticated using (true);
create policy "categoria_delete" on categoria for delete to authenticated using (true);

-- Pacientes: apenas o dono pode ver e modificar
create policy "paciente_select" on paciente for select to authenticated using (usuario_id = auth.uid());
create policy "paciente_insert" on paciente for insert to authenticated with check (usuario_id = auth.uid());
create policy "paciente_update" on paciente for update to authenticated using (usuario_id = auth.uid());
create policy "paciente_delete" on paciente for delete to authenticated using (usuario_id = auth.uid());

-- Lançamentos: apenas o dono pode ver e modificar
create policy "lancamento_select" on lancamento for select to authenticated using (usuario_id = auth.uid());
create policy "lancamento_insert" on lancamento for insert to authenticated with check (usuario_id = auth.uid());
create policy "lancamento_update" on lancamento for update to authenticated using (usuario_id = auth.uid());
create policy "lancamento_delete" on lancamento for delete to authenticated using (usuario_id = auth.uid());

-- ============================================
-- DADOS INICIAIS (Categorias da clínica CNH)
-- ============================================

insert into categoria (nome, tipo, descricao, cor) values
    ('Exame Oftalmológico', 'entrada', 'Exame de visão para CNH', '#28a745'),
    ('Exame Psicológico', 'entrada', 'Avaliação psicológica para CNH', '#17a2b8'),
    ('Exame Clínico Geral', 'entrada', 'Exame clínico para aptidão física', '#007bff'),
    ('Outros Recebimentos', 'entrada', 'Receitas diversas', '#6f42c1'),
    ('Aluguel', 'saida', 'Aluguel do espaço da clínica', '#dc3545'),
    ('Salários', 'saida', 'Pagamento de funcionários', '#fd7e14'),
    ('Material de Escritório', 'saida', 'Papéis, canetas, etc', '#ffc107'),
    ('Equipamentos', 'saida', 'Equipamentos médicos e de escritório', '#e83e8c'),
    ('Impostos', 'saida', 'Tributos e taxas', '#6c757d'),
    ('Serviços (Contador, TI)', 'saida', 'Serviços terceirizados', '#20c997'),
    ('Outros Gastos', 'saida', 'Despesas diversas', '#795548');
