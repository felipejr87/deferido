-- BACKFILL — esta migration já estava aplicada no banco remoto (versão
-- 20260902224423, mesmo timestamp do nome do arquivo) mas nunca tinha um
-- arquivo local correspondente neste repo — descoberto ao tentar rodar
-- `supabase db push` para a próxima migration e o CLI reclamar de versão
-- remota sem arquivo local. Reconstruído a partir do estado real do banco
-- (pg_policies) para o histórico ficar reproduzível a partir de um clone
-- limpo. Não é o SQL literal original (que não fica salvo em lugar nenhum
-- além do que já rodou) — é o que já está em vigor agora, bug incluso: as
-- 3 policies de curso_modulos/curso_aulas/aula_progresso usam o mesmo
-- padrão auth.jwt()->>'escritorio_id' já identificado como quebrado em
-- 0003 e 0006 (Supabase Auth não popula esse claim sozinho) — o efeito é
-- que RLS deixou de estar "totalmente aberto" (o gap real que esta
-- migration fechou) mas essas 3 tabelas ficaram inacessíveis pra todo
-- mundo, inclusive dono logado. A correção de verdade (meu_escritorio_id())
-- vem na migration seguinte (0008).

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cnaes','curso_modulos','curso_aulas','aula_progresso']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

CREATE POLICY "cnaes: leitura pública" ON cnaes FOR SELECT USING (true);

CREATE POLICY "curso_modulos: via servico" ON curso_modulos
  FOR ALL USING (
    servico_id IN (SELECT id FROM servicos WHERE escritorio_id = ((auth.jwt() ->> 'escritorio_id')::uuid))
  );

CREATE POLICY "curso_aulas: via modulo" ON curso_aulas
  FOR ALL USING (
    modulo_id IN (
      SELECT cm.id FROM curso_modulos cm JOIN servicos s ON s.id = cm.servico_id
      WHERE s.escritorio_id = ((auth.jwt() ->> 'escritorio_id')::uuid)
    )
  );

CREATE POLICY "aula_progresso: via matricula" ON aula_progresso
  FOR ALL USING (
    matricula_id IN (SELECT id FROM matriculas WHERE escritorio_id = ((auth.jwt() ->> 'escritorio_id')::uuid))
  );
