-- Padrão de RLS por escritório (spec seção 2). Aplicar após criar
-- schema.sql em um projeto Supabase real.

-- Repita para cada tabela com escritorio_id: escritorios (via id = jwt),
-- usuarios, servicos, leads, clientes, propostas, processos, cobrancas, despesas.
-- Exemplo genérico (trocar <tabela>):
--
-- ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "<tabela>: próprio escritório" ON <tabela>
--   FOR ALL USING (escritorio_id = (auth.jwt() ->> 'escritorio_id')::uuid)
--   WITH CHECK (escritorio_id = (auth.jwt() ->> 'escritorio_id')::uuid);

ALTER TABLE proposta_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposta_itens: via proposta" ON proposta_itens
  FOR ALL USING (
    proposta_id IN (
      SELECT id FROM propostas
      WHERE escritorio_id = (auth.jwt() ->> 'escritorio_id')::uuid
    )
  );

ALTER TABLE processo_etapas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "processo_etapas: via processo" ON processo_etapas
  FOR ALL USING (
    processo_id IN (
      SELECT id FROM processos
      WHERE escritorio_id = (auth.jwt() ->> 'escritorio_id')::uuid
    )
  );

ALTER TABLE processo_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "processo_documentos: via processo" ON processo_documentos
  FOR ALL USING (
    processo_id IN (
      SELECT id FROM processos
      WHERE escritorio_id = (auth.jwt() ->> 'escritorio_id')::uuid
    )
  );

ALTER TABLE processo_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "processo_eventos: via processo" ON processo_eventos
  FOR ALL USING (
    processo_id IN (
      SELECT id FROM processos
      WHERE escritorio_id = (auth.jwt() ->> 'escritorio_id')::uuid
    )
  );

-- Bloco B: tabelas filhas por proposta/processo/matrícula seguem o mesmo
-- padrão "via pai" acima. Aplicar em curso_aulas (via curso_modulos via
-- servicos), aula_progresso (via matriculas), etc.

ALTER TABLE curso_modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "curso_modulos: via servico" ON curso_modulos
  FOR ALL USING (
    servico_id IN (
      SELECT id FROM servicos
      WHERE escritorio_id = (auth.jwt() ->> 'escritorio_id')::uuid
    )
  );

ALTER TABLE curso_aulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "curso_aulas: via modulo" ON curso_aulas
  FOR ALL USING (
    modulo_id IN (
      SELECT cm.id FROM curso_modulos cm
      JOIN servicos s ON s.id = cm.servico_id
      WHERE s.escritorio_id = (auth.jwt() ->> 'escritorio_id')::uuid
    )
  );

ALTER TABLE aula_progresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aula_progresso: via matricula" ON aula_progresso
  FOR ALL USING (
    matricula_id IN (
      SELECT id FROM matriculas
      WHERE escritorio_id = (auth.jwt() ->> 'escritorio_id')::uuid
    )
  );

-- Bloco A5 — LGPD: anonimizar cliente preservando histórico financeiro.
CREATE OR REPLACE FUNCTION anonimizar_cliente(p_cliente_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE clientes SET
    nome = 'Cliente anonimizado',
    documento = NULL, email = NULL, telefone = NULL,
    endereco = NULL, socios = '[]', observacoes = NULL,
    ativo = false
  WHERE id = p_cliente_id;
  RETURN jsonb_build_object('ok', true, 'anonimizado_em', now());
END; $$;
