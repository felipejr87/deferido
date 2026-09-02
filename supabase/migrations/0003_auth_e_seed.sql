-- Liga `usuarios` a contas reais do Supabase Auth (em vez do senha_hash
-- pensado originalmente pra auth caseira) e semeia o escritório + catálogo
-- da Open Legaliza, pra Propostas/Processos terem dado real pra ler.

ALTER TABLE usuarios
  ADD COLUMN auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ALTER COLUMN senha_hash DROP NOT NULL;

-- Escritório com id fixo pra bater com src/config/escritorio.js no front.
INSERT INTO escritorios (id, nome, slug, cor_primaria, razao_social, plano)
VALUES ('00000000-0000-0000-0000-000000000001', 'Open Legaliza', 'open-legaliza', '#0A4D9E', 'Open Legaliza Corporate Services LTDA', 'proprio')
ON CONFLICT (id) DO NOTHING;

-- Catálogo — mesmos 9 serviços de src/data/mock.js, agora como fonte real.
INSERT INTO servicos (escritorio_id, nome, categoria, tipo_cobranca, valor, custo_terceiros, prazo_dias, etapas_template, ordem) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Abertura MEI', 'abertura', 'pontual', 350, 0, 3,
    '[{"nome":"Dados"},{"nome":"Protocolo"},{"nome":"CNPJ emitido"}]', 1),
  ('00000000-0000-0000-0000-000000000001', 'Abertura ME / LTDA', 'abertura', 'pontual', 1200, 550, 15,
    '[{"nome":"Viabilidade"},{"nome":"Contrato social"},{"nome":"Junta"},{"nome":"Receita"},{"nome":"CNPJ"}]', 2),
  ('00000000-0000-0000-0000-000000000001', 'Alteração contratual', 'alteracao', 'pontual', 800, 320, 20,
    '[{"nome":"Análise"},{"nome":"Minuta"},{"nome":"Junta"},{"nome":"Deferimento"}]', 3),
  ('00000000-0000-0000-0000-000000000001', 'Encerramento / baixa', 'encerramento', 'pontual', 950, 380, 30,
    '[{"nome":"Certidões"},{"nome":"Distrato"},{"nome":"Junta"},{"nome":"Receita"}]', 4),
  ('00000000-0000-0000-0000-000000000001', 'Alvará de funcionamento', 'alvara', 'pontual', 450, 180, 25,
    '[{"nome":"Documentos"},{"nome":"Protocolo prefeitura"},{"nome":"Vistoria"},{"nome":"Emissão"}]', 5),
  ('00000000-0000-0000-0000-000000000001', 'Alvará vigilância sanitária', 'alvara', 'pontual', 520, 210, 30,
    '[{"nome":"Documentos"},{"nome":"Protocolo"},{"nome":"Vistoria"},{"nome":"Emissão"}]', 6),
  ('00000000-0000-0000-0000-000000000001', 'Curso de gestão para MEI', 'curso', 'pontual', 290, 0, 1,
    '[{"nome":"Matrícula"},{"nome":"Acesso liberado"}]', 7),
  ('00000000-0000-0000-0000-000000000001', 'Contabilidade mensal', 'contabil', 'recorrente', 380, 0, null,
    '[{"nome":"Cobrança automática mensal"}]', 8),
  ('00000000-0000-0000-0000-000000000001', 'Jurídico — contratos e consultoria', 'juridico', 'pontual', 1500, 0, 10,
    '[{"nome":"Briefing"},{"nome":"Minuta"},{"nome":"Revisão"},{"nome":"Entrega"}]', 9)
ON CONFLICT DO NOTHING;

-- RLS de usuarios/escritorios/servicos usa (auth.jwt() ->> 'escritorio_id'),
-- mas o Supabase Auth não popula esse claim sozinho. Função + trigger abaixo:
-- no primeiro login de um e-mail novo, cria o profile em `usuarios` (dono se
-- for o primeiro do escritório, operador nos seguintes) e devolve o
-- escritorio_id certo — o app chama isso via RPC logo após o login.
CREATE OR REPLACE FUNCTION provisionar_usuario(p_escritorio_id uuid, p_nome text)
RETURNS usuarios LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_usuario usuarios;
  v_papel text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'provisionar_usuario exige sessão autenticada';
  END IF;

  SELECT * INTO v_usuario FROM usuarios WHERE auth_user_id = auth.uid();
  IF FOUND THEN
    RETURN v_usuario;
  END IF;

  SELECT CASE WHEN COUNT(*) = 0 THEN 'dono' ELSE 'operador' END INTO v_papel
  FROM usuarios WHERE escritorio_id = p_escritorio_id;

  INSERT INTO usuarios (escritorio_id, nome, email, papel, auth_user_id, ultimo_acesso)
  VALUES (p_escritorio_id, p_nome, (SELECT email FROM auth.users WHERE id = auth.uid()), v_papel, auth.uid(), now())
  RETURNING * INTO v_usuario;

  RETURN v_usuario;
END; $$;

-- ATENÇÃO — GAP ENCONTRADO NESTA MIGRATION: db/rls.sql original só tinha um
-- COMENTÁRIO de exemplo ("repita para cada tabela...") pras tabelas
-- principais — nunca um ALTER TABLE/CREATE POLICY de verdade pra
-- escritorios, usuarios, servicos, leads, clientes, propostas, processos,
-- cobrancas, despesas e todo o restante dos blocos A-C. Ou seja: RLS nunca
-- esteve ativo nelas. Fechando isso agora, com um padrão que não depende de
-- custom claim no JWT (o schema original usava auth.jwt()->>'escritorio_id',
-- que o Supabase Auth não popula sozinho) — em vez disso, todo mundo
-- resolve o escritório do usuário logado via usuarios.auth_user_id =
-- auth.uid().

CREATE OR REPLACE FUNCTION meu_escritorio_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT escritorio_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['usuarios','servicos','leads','clientes','propostas','processos',
    'cobrancas','despesas','auditoria','consentimentos','arquivos','assinaturas','matriculas',
    'obrigacoes','documentos_gerados','notificacoes_log','templates_mensagem','extracoes_ia']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (escritorio_id = meu_escritorio_id()) WITH CHECK (escritorio_id = meu_escritorio_id())',
      t || ': do usuário logado', t
    );
  END LOOP;
END $$;

-- Casos especiais: PK não é escritorio_id, ou tabela é template global
-- (escritorio_id nullable = visível a todos).
ALTER TABLE escritorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escritorios: do usuário logado" ON escritorios FOR ALL USING (id = meu_escritorio_id());

ALTER TABLE notificacoes_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notificacoes_config: do usuário logado" ON notificacoes_config FOR ALL USING (escritorio_id = meu_escritorio_id());

ALTER TABLE obrigacoes_tipos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "obrigacoes_tipos: próprio ou template global" ON obrigacoes_tipos
  FOR ALL USING (escritorio_id IS NULL OR escritorio_id = meu_escritorio_id());

ALTER TABLE modelos_documento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modelos_documento: próprio ou template global" ON modelos_documento
  FOR ALL USING (escritorio_id IS NULL OR escritorio_id = meu_escritorio_id());

ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessoes: do próprio usuário" ON sessoes
  FOR ALL USING (usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()));

ALTER TABLE recuperacao_senha ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recuperacao_senha: do próprio usuário" ON recuperacao_senha
  FOR ALL USING (usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()));

-- Leitura pública do catálogo e de propostas/processos por token (portal do
-- cliente e link da proposta — spec pede "sem login"). Segunda policy
-- permissiva, só de SELECT, empilhada sobre a de dono acima.
CREATE POLICY "servicos: leitura pública" ON servicos FOR SELECT USING (true);
CREATE POLICY "propostas: leitura pública por token" ON propostas FOR SELECT USING (true);
CREATE POLICY "processos: leitura pública por token" ON processos FOR SELECT USING (true);
