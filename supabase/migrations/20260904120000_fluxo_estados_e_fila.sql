-- Bloco 3 da spec de fluxos/boas práticas: máquina de estados (Parte 1) e a
-- fila de trabalho "O que fazer agora" (Parte 2), que passa a ser a tela
-- inicial em vez de um dashboard de números soltos.

-- ============================================
-- CORREÇÃO: mesmo bug de RLS de 0003/0006, 3ª ocorrência
-- ============================================
-- 20260902224423_correcoes_seguranca.sql (backfill do que já rodou direto
-- no remoto) fechou o RLS "totalmente aberto" de cnaes/curso_modulos/
-- curso_aulas/aula_progresso, mas usando auth.jwt()->>'escritorio_id' —
-- claim que o Supabase Auth não popula. Resultado: essas 3 tabelas viraram
-- inacessíveis pra todo mundo, dono logado incluso. Troca pelo padrão
-- meu_escritorio_id() já usado em todo o resto do schema.

DROP POLICY IF EXISTS "curso_modulos: via servico" ON curso_modulos;
CREATE POLICY "curso_modulos: via servico" ON curso_modulos
  FOR ALL USING (
    servico_id IN (SELECT id FROM servicos WHERE escritorio_id = meu_escritorio_id())
  );

DROP POLICY IF EXISTS "curso_aulas: via modulo" ON curso_aulas;
CREATE POLICY "curso_aulas: via modulo" ON curso_aulas
  FOR ALL USING (
    modulo_id IN (
      SELECT cm.id FROM curso_modulos cm JOIN servicos s ON s.id = cm.servico_id
      WHERE s.escritorio_id = meu_escritorio_id()
    )
  );

DROP POLICY IF EXISTS "aula_progresso: via matricula" ON aula_progresso;
CREATE POLICY "aula_progresso: via matricula" ON aula_progresso
  FOR ALL USING (
    matricula_id IN (SELECT id FROM matriculas WHERE escritorio_id = meu_escritorio_id())
  );

-- ============================================
-- MÁQUINA DE ESTADOS — status de proposta ganha 'arquivada'
-- ============================================
-- Era usado no front (Propostas.jsx tinha status decorativo) mas nunca
-- existiu no catálogo de valores válidos da coluna.
ALTER TABLE propostas DROP CONSTRAINT IF EXISTS propostas_status_check;
ALTER TABLE propostas ADD CONSTRAINT propostas_status_check
  CHECK (status IN ('rascunho','enviada','vista','aceita','recusada','expirada','arquivada'));

-- ============================================
-- MÁQUINA DE ESTADOS
-- ============================================

CREATE TABLE fluxo_transicoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade      text NOT NULL,   -- proposta | processo
  de            text NOT NULL,
  para          text NOT NULL,
  rotulo        text NOT NULL,   -- texto do botão, em linguagem humana
  requer_papel  text[],          -- null/vazio = qualquer papel logado
  requer_campos text[],          -- colunas que precisam vir preenchidas em `dados` (ou já no registro)
  efeitos       jsonb DEFAULT '[]', -- lista de códigos processados por src/lib/fluxo.js#executarEfeito
  automatica    boolean DEFAULT false, -- true = não vira botão; disparada por outro código (ex: trigger, view)
  ordem         int DEFAULT 0,
  UNIQUE (entidade, de, para)
);

ALTER TABLE fluxo_transicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fluxo_transicoes: leitura de qualquer usuário logado" ON fluxo_transicoes
  FOR SELECT USING (meu_escritorio_id() IS NOT NULL);

INSERT INTO fluxo_transicoes (entidade, de, para, rotulo, requer_campos, efeitos, automatica, ordem) VALUES
  ('proposta', 'rascunho', 'enviada',  'Enviar proposta', NULL, '["notificar_cliente_proposta"]', false, 1),
  ('proposta', 'enviada',  'vista',    '—',               NULL, '["avisar_escritorio_visualizacao"]', true, 2),
  ('proposta', 'vista',    'aceita',   'Aceitar',         NULL, '["registrar_aceite","criar_cobranca"]', false, 3),
  ('proposta', 'enviada',  'recusada', 'Recusar',         '{observacoes}', '["atualizar_lead"]', false, 4),
  ('proposta', 'vista',    'recusada', 'Recusar',         '{observacoes}', '["atualizar_lead"]', false, 4),
  ('proposta', 'enviada',  'expirada', '—',               NULL, '["notificar_escritorio_expirou"]', true, 5),
  ('proposta', 'vista',    'expirada', '—',               NULL, '["notificar_escritorio_expirou"]', true, 5),
  ('proposta', 'rascunho', 'arquivada','Arquivar',        NULL, '[]', false, 6)
ON CONFLICT (entidade, de, para) DO NOTHING;

INSERT INTO fluxo_transicoes (entidade, de, para, rotulo, requer_campos, efeitos, automatica, ordem) VALUES
  ('processo', 'aguardando_docs', 'em_andamento',   '—',                     NULL, '["notificar_cliente_docs_completos"]', true, 1),
  ('processo', 'em_andamento',    'aguardando_orgao','Registrar protocolo',  '{protocolo,orgao}', '[]', false, 2),
  ('processo', 'aguardando_orgao','pendencia',       'Registrar exigência',  '{observacoes}', '["notificar_cliente_pendencia"]', false, 3),
  ('processo', 'pendencia',       'aguardando_orgao','Reenviar',             NULL, '[]', false, 4),
  ('processo', 'aguardando_orgao','concluido',       'Marcar como deferido', NULL, '["notificar_cliente_deferido"]', false, 5),
  ('processo', 'aguardando_docs', 'cancelado',       'Cancelar',             '{observacoes}', '[]', false, 9),
  ('processo', 'em_andamento',    'cancelado',       'Cancelar',             '{observacoes}', '[]', false, 9),
  ('processo', 'aguardando_orgao','cancelado',       'Cancelar',             '{observacoes}', '[]', false, 9),
  ('processo', 'pendencia',       'cancelado',       'Cancelar',             '{observacoes}', '[]', false, 9)
ON CONFLICT (entidade, de, para) DO NOTHING;

-- ============================================
-- FILA DE TRABALHO ("o que fazer agora")
-- ============================================
-- Union das mesmas 6 fontes da spec (Parte 2.1), adaptadas às colunas reais
-- deste schema. A consulta por CNAE/scraping de órgão (item 5 do doc
-- original — "sem novidade do órgão há N dias") depende do robô de
-- consulta (Bloco 6, ainda não implementado — precisa de
-- processos.ultima_consulta) e fica de fora desta rodada.

CREATE OR REPLACE FUNCTION fila_de_trabalho(p_escritorio_id uuid)
RETURNS TABLE (
  prioridade  int,
  tipo        text,
  titulo      text,
  subtitulo   text,
  entidade    text,
  entidade_id uuid,
  acao_rotulo text,
  acao_rota   text,
  dias        int
)
LANGUAGE sql STABLE
AS $$
  -- 1. Prazo legal estourando
  SELECT 1, 'prazo_critico',
         'Prazo estourando: ' || p.titulo,
         CASE WHEN p.prazo_estimado < CURRENT_DATE THEN 'Venceu há ' || (CURRENT_DATE - p.prazo_estimado) || ' dia(s)'
              WHEN p.prazo_estimado = CURRENT_DATE THEN 'Vence hoje'
              ELSE 'Vence em ' || (p.prazo_estimado - CURRENT_DATE) || ' dia(s)' END,
         'processo', p.id, 'Ver processo', '/processos/' || lpad(p.numero::text, 4, '0'),
         (p.prazo_estimado - CURRENT_DATE)
  FROM processos p
  WHERE p.escritorio_id = p_escritorio_id
    AND p.status NOT IN ('concluido','cancelado')
    AND p.prazo_estimado IS NOT NULL
    AND p.prazo_estimado <= CURRENT_DATE + 2

  UNION ALL
  -- 2. Exigência do órgão sem resposta
  SELECT 2, 'pendencia',
         'Exigência aberta: ' || p.titulo,
         'Há ' || (CURRENT_DATE - p.atualizado_em::date) || ' dia(s)',
         'processo', p.id, 'Resolver', '/processos/' || lpad(p.numero::text, 4, '0'),
         (CURRENT_DATE - p.atualizado_em::date)
  FROM processos p
  WHERE p.escritorio_id = p_escritorio_id AND p.status = 'pendencia'

  UNION ALL
  -- 3. Documento pendente do cliente há mais de 3 dias
  SELECT 3, 'doc_pendente',
         'Documento não chegou: ' || pd.nome,
         c.nome || ' · pedido há ' || (CURRENT_DATE - p.iniciado_em) || ' dia(s)',
         'processo', p.id, 'Cobrar', '/processos/' || lpad(p.numero::text, 4, '0'),
         (CURRENT_DATE - p.iniciado_em)
  FROM processo_documentos pd
  JOIN processos p ON p.id = pd.processo_id
  JOIN clientes c  ON c.id = p.cliente_id
  WHERE p.escritorio_id = p_escritorio_id
    AND pd.obrigatorio AND NOT pd.recebido
    AND p.status = 'aguardando_docs'
    AND p.iniciado_em <= CURRENT_DATE - 3

  UNION ALL
  -- 4. Proposta vista mas sem resposta
  SELECT 4, 'proposta_parada',
         'Proposta sem resposta: ' || pr.cliente_nome,
         'Vista há ' || (CURRENT_DATE - pr.vista_em::date) || ' dia(s) · R$ ' || pr.total,
         'proposta', pr.id, 'Fazer follow-up', '/propostas',
         (CURRENT_DATE - pr.vista_em::date)
  FROM propostas pr
  WHERE pr.escritorio_id = p_escritorio_id
    AND pr.status = 'vista'
    AND pr.vista_em IS NOT NULL
    AND pr.vista_em <= CURRENT_DATE - 2

  UNION ALL
  -- 5. Lead sem contato há mais de 2 dias
  SELECT 5, 'lead_frio',
         'Lead esfriando: ' || l.nome,
         COALESCE(l.interesse,'') || ' · há ' || (CURRENT_DATE - l.atualizado_em::date) || ' dia(s)',
         'lead', l.id, 'Contatar', '/relatorios',
         (CURRENT_DATE - l.atualizado_em::date)
  FROM leads l
  WHERE l.escritorio_id = p_escritorio_id
    AND l.etapa IN ('novo','contatado')
    AND l.atualizado_em <= CURRENT_DATE - 2

  UNION ALL
  -- 6. Cobrança vencida
  SELECT 6, 'cobranca_vencida',
         'Pagamento atrasado: ' || c.nome,
         'R$ ' || co.valor || ' · vencida há ' || (CURRENT_DATE - co.vencimento) || ' dia(s)',
         'cobranca', co.id, 'Cobrar', '/propostas',
         (CURRENT_DATE - co.vencimento)
  FROM cobrancas co
  JOIN clientes c ON c.id = co.cliente_id
  WHERE co.escritorio_id = p_escritorio_id
    AND co.status = 'pendente' AND co.vencimento < CURRENT_DATE

  ORDER BY 1, 9 DESC
  LIMIT 30;
$$;
