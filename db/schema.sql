-- Open Legaliza — schema multi-tenant (spec seção 2).
-- Referência para quando o backend Supabase for provisionado; o front desta
-- entrega (Fase 1) roda com dados mock em src/data/mock.js e ainda não está
-- conectado a este banco.

-- ============================================
-- TENANT E USUÁRIOS
-- ============================================

CREATE TABLE escritorios (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  cnpj          text,
  logo_url      text,
  cor_primaria  text DEFAULT '#0A4D9E',
  telefone      text,
  email         text,
  endereco      jsonb,
  razao_social  text,
  responsavel   text,
  ativo         boolean DEFAULT true,
  plano         text DEFAULT 'proprio',  -- proprio | basico | pro
  criado_em     timestamptz DEFAULT now()
);

CREATE TABLE usuarios (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id  uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  nome           text NOT NULL,
  email          text NOT NULL,
  senha_hash     text NOT NULL,
  papel          text DEFAULT 'operador'
    CHECK (papel IN ('dono','operador','comercial')),
  ativo          boolean DEFAULT true,
  ultimo_acesso  timestamptz,
  criado_em      timestamptz DEFAULT now(),
  UNIQUE (escritorio_id, email)
);

-- ============================================
-- CATÁLOGO DE SERVIÇOS
-- ============================================

CREATE TABLE servicos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id  uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  nome           text NOT NULL,
  descricao      text,
  categoria      text,  -- abertura | alteracao | encerramento | alvara | curso | contabil | juridico
  tipo_cobranca  text DEFAULT 'pontual'
    CHECK (tipo_cobranca IN ('pontual','recorrente')),
  valor          numeric NOT NULL DEFAULT 0,
  custo_terceiros numeric DEFAULT 0,
  prazo_dias     int,
  etapas_template     jsonb DEFAULT '[]',
  documentos_template jsonb DEFAULT '[]',
  ativo          boolean DEFAULT true,
  ordem          int DEFAULT 0,
  criado_em      timestamptz DEFAULT now()
);

COMMENT ON COLUMN servicos.etapas_template IS
  'Ex: [{"nome":"Viabilidade","prazo_dias":2},{"nome":"Contrato social","prazo_dias":1}]';
COMMENT ON COLUMN servicos.documentos_template IS
  'Ex: [{"nome":"RG e CPF dos sócios","obrigatorio":true},{"nome":"Comprovante de endereço","obrigatorio":true}]';

-- ============================================
-- LEADS E CLIENTES
-- ============================================

CREATE TABLE leads (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id  uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  nome           text NOT NULL,
  telefone       text,
  email          text,
  origem         text,  -- instagram | whatsapp | indicacao | site | google
  interesse      text,
  servico_id     uuid REFERENCES servicos(id),
  etapa          text DEFAULT 'novo'
    CHECK (etapa IN ('novo','contatado','qualificado','proposta','ganho','perdido')),
  motivo_perda   text,
  responsavel_id uuid REFERENCES usuarios(id),
  proximo_contato date,
  observacoes    text,
  criado_em      timestamptz DEFAULT now(),
  atualizado_em  timestamptz DEFAULT now()
);

CREATE TABLE clientes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id  uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  lead_id        uuid REFERENCES leads(id),
  tipo           text DEFAULT 'pf' CHECK (tipo IN ('pf','pj')),
  nome           text NOT NULL,
  nome_fantasia  text,
  documento      text,
  email          text,
  telefone       text,
  endereco       jsonb,
  socios         jsonb DEFAULT '[]',
  cnae_principal text,
  cnaes_secundarios text[],
  regime_tributario text,  -- mei | simples | presumido | real
  observacoes    text,
  ativo          boolean DEFAULT true,
  criado_em      timestamptz DEFAULT now()
);

-- ============================================
-- PROPOSTAS
-- ============================================

CREATE TABLE propostas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id  uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  numero         serial,
  lead_id        uuid REFERENCES leads(id),
  cliente_id     uuid REFERENCES clientes(id),
  cliente_nome   text NOT NULL,
  cliente_doc    text,
  cliente_email  text,
  cliente_telefone text,
  subtotal       numeric NOT NULL DEFAULT 0,
  desconto       numeric DEFAULT 0,
  total          numeric NOT NULL DEFAULT 0,
  forma_pagamento text,  -- avista | parcelado
  parcelas       int DEFAULT 1,
  status         text DEFAULT 'rascunho'
    CHECK (status IN ('rascunho','enviada','vista','aceita','recusada','expirada')),
  token_publico  text UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  validade       date,
  enviada_em     timestamptz,
  vista_em       timestamptz,
  aceita_em      timestamptz,
  aceite_ip      text,
  aceite_nome    text,
  observacoes    text,
  criado_por     uuid REFERENCES usuarios(id),
  criado_em      timestamptz DEFAULT now()
);

CREATE TABLE proposta_itens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id  uuid NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
  servico_id   uuid REFERENCES servicos(id),
  descricao    text NOT NULL,
  quantidade   int DEFAULT 1,
  valor_unit   numeric NOT NULL,
  valor_total  numeric NOT NULL,
  ordem        int DEFAULT 0
);

-- ============================================
-- PROCESSOS (execução do serviço vendido)
-- ============================================

CREATE TABLE processos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id  uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  numero         serial,
  cliente_id     uuid NOT NULL REFERENCES clientes(id),
  servico_id     uuid REFERENCES servicos(id),
  proposta_id    uuid REFERENCES propostas(id),
  titulo         text NOT NULL,
  status         text DEFAULT 'aguardando_docs'
    CHECK (status IN ('aguardando_docs','em_andamento','aguardando_orgao','pendencia','concluido','cancelado')),
  responsavel_id uuid REFERENCES usuarios(id),
  iniciado_em    date DEFAULT CURRENT_DATE,
  prazo_estimado date,
  concluido_em   date,
  protocolo      text,
  orgao          text,   -- junta comercial | receita | prefeitura | vigilancia
  token_publico  text UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  observacoes    text,
  criado_em      timestamptz DEFAULT now(),
  atualizado_em  timestamptz DEFAULT now()
);

CREATE TABLE processo_etapas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id  uuid NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  nome         text NOT NULL,
  ordem        int NOT NULL,
  concluida    boolean DEFAULT false,
  concluida_em timestamptz,
  responsavel_id uuid REFERENCES usuarios(id),
  prazo        date,
  observacao   text
);

CREATE TABLE processo_documentos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id  uuid NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  nome         text NOT NULL,
  obrigatorio  boolean DEFAULT true,
  recebido     boolean DEFAULT false,
  recebido_em  timestamptz,
  arquivo_url  text,
  observacao   text
);

CREATE TABLE processo_eventos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id  uuid NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  tipo         text NOT NULL,  -- criado | doc_recebido | etapa_concluida | protocolo | pendencia | concluido
  descricao    text NOT NULL,
  visivel_cliente boolean DEFAULT true,
  usuario_id   uuid REFERENCES usuarios(id),
  criado_em    timestamptz DEFAULT now()
);

-- ============================================
-- FINANCEIRO
-- ============================================

CREATE TABLE cobrancas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id  uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  cliente_id     uuid NOT NULL REFERENCES clientes(id),
  proposta_id    uuid REFERENCES propostas(id),
  processo_id    uuid REFERENCES processos(id),
  descricao      text NOT NULL,
  valor          numeric NOT NULL,
  vencimento     date NOT NULL,
  status         text DEFAULT 'pendente'
    CHECK (status IN ('pendente','pago','atrasado','cancelado')),
  pago_em        date,
  forma_pagamento text,
  asaas_id       text,
  link_pagamento text,
  recorrente     boolean DEFAULT false,
  recorrencia_dia int,
  parcela_num    int,
  parcela_total  int,
  criado_em      timestamptz DEFAULT now()
);

CREATE TABLE despesas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id  uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  processo_id    uuid REFERENCES processos(id),
  descricao      text NOT NULL,
  categoria      text,  -- taxa_junta | taxa_prefeitura | despachante | operacional
  valor          numeric NOT NULL,
  data           date NOT NULL DEFAULT CURRENT_DATE,
  criado_em      timestamptz DEFAULT now()
);

-- ============================================
-- BLOCO A — FUNDAÇÃO (spec complementar)
-- ============================================

CREATE TABLE sessoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash    text NOT NULL,
  ip_hash       text,
  user_agent    text,
  expira_em     timestamptz NOT NULL,
  revogada      boolean DEFAULT false,
  criado_em     timestamptz DEFAULT now()
);

CREATE TABLE recuperacao_senha (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  text NOT NULL,
  expira_em   timestamptz NOT NULL,
  usado       boolean DEFAULT false,
  criado_em   timestamptz DEFAULT now()
);

CREATE TABLE auditoria (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  usuario_id    uuid REFERENCES usuarios(id),
  entidade      text NOT NULL,   -- proposta | processo | cliente | cobranca
  entidade_id   uuid,
  acao          text NOT NULL,   -- criou | editou | deletou | enviou | aceitou
  dados_antes   jsonb,
  dados_depois  jsonb,
  ip_hash       text,
  criado_em     timestamptz DEFAULT now()
);
CREATE INDEX idx_auditoria_entidade ON auditoria(escritorio_id, entidade, entidade_id, criado_em DESC);

CREATE TABLE consentimentos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id  uuid REFERENCES escritorios(id) ON DELETE CASCADE,
  usuario_id     uuid REFERENCES usuarios(id),
  cliente_id     uuid REFERENCES clientes(id),
  tipo           text NOT NULL,  -- termos_uso | politica_privacidade | comunicacao_marketing
  versao         text,
  aceito_em      timestamptz DEFAULT now(),
  ip_hash        text
);

-- ============================================
-- BLOCO B — MÓDULOS DE NEGÓCIO
-- ============================================

CREATE TABLE arquivos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  cliente_id    uuid REFERENCES clientes(id),
  processo_id   uuid REFERENCES processos(id),
  documento_id  uuid REFERENCES processo_documentos(id),
  nome          text NOT NULL,
  nome_original text,
  storage_path  text NOT NULL,
  mime_type     text,
  tamanho_bytes bigint,
  versao        int DEFAULT 1,
  enviado_por   text,  -- 'escritorio' | 'cliente'
  usuario_id    uuid REFERENCES usuarios(id),
  criado_em     timestamptz DEFAULT now()
);

CREATE TABLE assinaturas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES escritorios(id),
  documento_tipo text,   -- proposta | contrato | procuracao
  documento_id  uuid,
  signatario_nome text NOT NULL,
  signatario_doc  text,
  signatario_email text,
  hash_documento text NOT NULL,  -- SHA-256 do PDF assinado
  ip_hash       text,
  user_agent    text,
  geolocalizacao jsonb,
  assinado_em   timestamptz DEFAULT now(),
  provedor      text,   -- null = nível 1 nativo | clicksign | d4sign | zapsign
  provedor_id   text
);

CREATE TABLE curso_modulos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id uuid NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  titulo     text NOT NULL,
  descricao  text,
  ordem      int DEFAULT 0
);

CREATE TABLE curso_aulas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id  uuid NOT NULL REFERENCES curso_modulos(id) ON DELETE CASCADE,
  titulo     text NOT NULL,
  tipo       text,  -- video | pdf | link | texto
  conteudo_url text,
  conteudo_texto text,
  duracao_min int,
  ordem      int DEFAULT 0
);

CREATE TABLE matriculas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES escritorios(id),
  cliente_id  uuid NOT NULL REFERENCES clientes(id),
  servico_id  uuid NOT NULL REFERENCES servicos(id),
  proposta_id uuid REFERENCES propostas(id),
  token_acesso text UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  ativa       boolean DEFAULT true,
  expira_em   date,
  concluida_em timestamptz,
  criado_em   timestamptz DEFAULT now()
);

CREATE TABLE aula_progresso (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id uuid NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  aula_id      uuid NOT NULL REFERENCES curso_aulas(id) ON DELETE CASCADE,
  concluida    boolean DEFAULT false,
  concluida_em timestamptz,
  UNIQUE (matricula_id, aula_id)
);

CREATE TABLE obrigacoes_tipos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid REFERENCES escritorios(id),  -- null = template global
  nome          text NOT NULL,        -- DAS, DEFIS, IRPJ, DCTF, eSocial
  descricao     text,
  regime        text[],               -- {mei}, {simples}, {presumido}
  periodicidade text,                 -- mensal | trimestral | anual
  dia_vencimento int,
  mes_vencimento int,                 -- para anuais
  ativo         boolean DEFAULT true
);

CREATE TABLE obrigacoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  cliente_id    uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo_id       uuid REFERENCES obrigacoes_tipos(id),
  nome          text NOT NULL,
  competencia   date NOT NULL,        -- mês de referência
  vencimento    date NOT NULL,
  status        text DEFAULT 'pendente'
    CHECK (status IN ('pendente','cumprida','atrasada','dispensada')),
  cumprida_em   date,
  valor         numeric,
  comprovante_url text,
  responsavel_id uuid REFERENCES usuarios(id),
  observacao    text,
  criado_em     timestamptz DEFAULT now()
);
CREATE INDEX idx_obrigacoes_venc ON obrigacoes(escritorio_id, vencimento, status);

CREATE TABLE modelos_documento (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid REFERENCES escritorios(id),  -- null = template global
  nome          text NOT NULL,
  categoria     text,  -- contrato_social | prestacao_servico | nda | procuracao | distrato
  conteudo      text NOT NULL,     -- markdown/HTML com {{variaveis}}
  variaveis     jsonb DEFAULT '[]', -- [{"chave":"razao_social","label":"Razão Social","tipo":"texto"}]
  ativo         boolean DEFAULT true,
  criado_em     timestamptz DEFAULT now()
);

CREATE TABLE documentos_gerados (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  modelo_id     uuid REFERENCES modelos_documento(id),
  cliente_id    uuid REFERENCES clientes(id),
  processo_id   uuid REFERENCES processos(id),
  titulo        text NOT NULL,
  conteudo_final text NOT NULL,
  valores       jsonb,     -- valores usados nas variáveis
  pdf_url       text,
  assinado      boolean DEFAULT false,
  criado_por    uuid REFERENCES usuarios(id),
  criado_em     timestamptz DEFAULT now()
);

-- ============================================
-- BLOCO C — COMUNICAÇÃO
-- ============================================

CREATE TABLE notificacoes_config (
  escritorio_id uuid PRIMARY KEY REFERENCES escritorios(id) ON DELETE CASCADE,
  email_ativo    boolean DEFAULT true,
  whatsapp_ativo boolean DEFAULT false,
  whatsapp_token text,
  whatsapp_instancia text,
  eventos        jsonb DEFAULT '{}',  -- quais eventos disparam
  horario_envio  text DEFAULT '09:00'
);

CREATE TABLE notificacoes_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  destinatario  text NOT NULL,
  canal         text NOT NULL,  -- email | whatsapp | push
  evento        text NOT NULL,
  assunto       text,
  corpo         text,
  status        text DEFAULT 'enviado',  -- enviado | falha | lido
  erro          text,
  enviado_em    timestamptz DEFAULT now()
);

CREATE TABLE templates_mensagem (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  evento        text NOT NULL,
  canal         text NOT NULL,
  assunto       text,
  corpo         text NOT NULL,   -- com {{cliente_nome}}, {{link}}, etc
  ativo         boolean DEFAULT true,
  UNIQUE (escritorio_id, evento, canal)
);

-- ============================================
-- MÓDULO DE CAPTURA INTELIGENTE (complemento)
-- ============================================

-- Tabela CNAE local (dado estático do IBGE, ~1.300 registros em produção;
-- o front desta demo usa um recorte curado em src/data/cnae.js).
CREATE TABLE cnaes (
  codigo        text PRIMARY KEY,     -- '4781400'
  descricao     text NOT NULL,
  secao         text,
  permitido_mei boolean DEFAULT false,
  anexo_simples int,                  -- 1 a 5
  observacao    text
);
CREATE INDEX idx_cnae_busca ON cnaes
  USING gin(to_tsvector('portuguese', descricao));

-- Log de extrações (OCR e conversa) — auditoria de IA: o que foi extraído,
-- de qual documento/conversa, com que confiança, e se o operador confirmou
-- ou corrigiu antes de salvar (nunca grava sem confirmação humana).
CREATE TABLE extracoes_ia (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  tipo          text NOT NULL,   -- documento | conversa | comando_natural
  origem_id     uuid,            -- arquivo_id, lead_id etc conforme o tipo
  entrada_resumo text,           -- não persiste o documento/conversa inteira, só um resumo
  dados_extraidos jsonb NOT NULL,
  confianca     numeric,         -- 0 a 1, quando o modelo reporta
  confirmado_por uuid REFERENCES usuarios(id),
  confirmado_em timestamptz,
  editado       boolean DEFAULT false,  -- operador alterou algo antes de confirmar
  criado_em     timestamptz DEFAULT now()
);
