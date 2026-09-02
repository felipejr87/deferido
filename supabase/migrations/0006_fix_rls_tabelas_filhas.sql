-- As policies de proposta_itens/processo_etapas/processo_documentos/
-- processo_eventos (criadas em 0002_rls.sql, herdadas do db/rls.sql
-- original) checavam auth.jwt()->>'escritorio_id' — um claim que o
-- Supabase Auth não popula sozinho (mesmo problema já corrigido nas
-- tabelas principais em 0003). Resultado: ficaram inacessíveis pra
-- qualquer um, inclusive dono logado. Troca pelo mesmo padrão via
-- meu_escritorio_id(), e adiciona leitura pública (portal do cliente e
-- link da proposta são "sem login" por spec).

DROP POLICY IF EXISTS "proposta_itens: via proposta" ON proposta_itens;
CREATE POLICY "proposta_itens: do usuário logado" ON proposta_itens
  FOR ALL USING (
    proposta_id IN (SELECT id FROM propostas WHERE escritorio_id = meu_escritorio_id())
  );
CREATE POLICY "proposta_itens: leitura pública" ON proposta_itens FOR SELECT USING (true);

DROP POLICY IF EXISTS "processo_etapas: via processo" ON processo_etapas;
CREATE POLICY "processo_etapas: do usuário logado" ON processo_etapas
  FOR ALL USING (
    processo_id IN (SELECT id FROM processos WHERE escritorio_id = meu_escritorio_id())
  );
CREATE POLICY "processo_etapas: leitura pública" ON processo_etapas FOR SELECT USING (true);

DROP POLICY IF EXISTS "processo_documentos: via processo" ON processo_documentos;
CREATE POLICY "processo_documentos: do usuário logado" ON processo_documentos
  FOR ALL USING (
    processo_id IN (SELECT id FROM processos WHERE escritorio_id = meu_escritorio_id())
  );
CREATE POLICY "processo_documentos: leitura pública" ON processo_documentos FOR SELECT USING (true);

DROP POLICY IF EXISTS "processo_eventos: via processo" ON processo_eventos;
CREATE POLICY "processo_eventos: do usuário logado" ON processo_eventos
  FOR ALL USING (
    processo_id IN (SELECT id FROM processos WHERE escritorio_id = meu_escritorio_id())
  );
CREATE POLICY "processo_eventos: leitura pública dos visíveis ao cliente" ON processo_eventos
  FOR SELECT USING (visivel_cliente = true);
