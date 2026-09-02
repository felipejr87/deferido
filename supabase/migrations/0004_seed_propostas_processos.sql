-- Popula propostas e processos reais com os mesmos exemplos que já
-- apareciam como mock em src/data/mock.js, pra Propostas.jsx e
-- Processos.jsx passarem a ler do Postgres sem a demo "esvaziar".
-- criado_em/atualizado_em são setados explicitamente pra reproduzir as
-- datas relativas do mock (ex: "parado há 6 dias" a partir de 2026-09-02).

DO $$
DECLARE
  v_escritorio uuid := '00000000-0000-0000-0000-000000000001';
  v_svc_mei uuid; v_svc_ltda uuid; v_svc_alteracao uuid; v_svc_encerramento uuid;
  v_svc_alvara uuid; v_svc_vigilancia uuid;
  v_cli_ricardo uuid; v_cli_marina uuid; v_cli_atelie uuid; v_cli_padaria uuid;
  v_cli_douglas uuid; v_cli_clinica uuid;
BEGIN
  SELECT id INTO v_svc_mei FROM servicos WHERE escritorio_id = v_escritorio AND nome = 'Abertura MEI';
  SELECT id INTO v_svc_ltda FROM servicos WHERE escritorio_id = v_escritorio AND nome = 'Abertura ME / LTDA';
  SELECT id INTO v_svc_alteracao FROM servicos WHERE escritorio_id = v_escritorio AND nome = 'Alteração contratual';
  SELECT id INTO v_svc_encerramento FROM servicos WHERE escritorio_id = v_escritorio AND nome = 'Encerramento / baixa';
  SELECT id INTO v_svc_alvara FROM servicos WHERE escritorio_id = v_escritorio AND nome = 'Alvará de funcionamento';
  SELECT id INTO v_svc_vigilancia FROM servicos WHERE escritorio_id = v_escritorio AND nome = 'Alvará vigilância sanitária';

  -- Clientes (só os que os processos exigem via NOT NULL cliente_id).
  INSERT INTO clientes (escritorio_id, tipo, nome, documento) VALUES
    (v_escritorio, 'pf', 'Ricardo Menezes', '128.440.902-55') RETURNING id INTO v_cli_ricardo;
  INSERT INTO clientes (escritorio_id, tipo, nome, documento) VALUES
    (v_escritorio, 'pj', 'Marina Ribeiro Alimentos', '51.882.104/0001-22') RETURNING id INTO v_cli_marina;
  INSERT INTO clientes (escritorio_id, tipo, nome, documento) VALUES
    (v_escritorio, 'pj', 'Ateliê Casa Nove LTDA', '48.201.775/0001-90') RETURNING id INTO v_cli_atelie;
  INSERT INTO clientes (escritorio_id, tipo, nome, documento) VALUES
    (v_escritorio, 'pj', 'Padaria Trigo Bom', '22.906.318/0001-73') RETURNING id INTO v_cli_padaria;
  INSERT INTO clientes (escritorio_id, tipo, nome, documento) VALUES
    (v_escritorio, 'pf', 'Douglas Prado', '044.812.330-17') RETURNING id INTO v_cli_douglas;
  INSERT INTO clientes (escritorio_id, tipo, nome, documento) VALUES
    (v_escritorio, 'pj', 'Clínica Vitta ME', '39.774.021/0001-14') RETURNING id INTO v_cli_clinica;

  -- Propostas (cliente_id fica null de propósito pra algumas — o schema
  -- congela cliente_nome/doc no momento da proposta, não depende de FK).
  INSERT INTO propostas (escritorio_id, numero, cliente_nome, cliente_doc, subtotal, total, status, criado_em) VALUES
    (v_escritorio, 148, 'Marina Ribeiro Alimentos', '51.882.104/0001-22', 800, 800, 'aceita', '2026-08-28 10:00'),
    (v_escritorio, 147, 'Douglas Prado', '044.812.330-17', 590, 590, 'vista', '2026-08-27 10:00'),
    (v_escritorio, 146, 'Ateliê Casa Nove LTDA', '48.201.775/0001-90', 450, 450, 'enviada', '2026-08-26 10:00'),
    (v_escritorio, 145, 'Ricardo Menezes', '128.440.902-55', 1200, 1200, 'aceita', '2026-08-22 10:00'),
    (v_escritorio, 144, 'Clínica Vitta ME', '39.774.021/0001-14', 520, 520, 'recusada', '2026-08-19 10:00'),
    (v_escritorio, 143, 'Padaria Trigo Bom', '22.906.318/0001-73', 380, 380, 'aceita', '2026-08-15 10:00');

  -- Processos (numero é serial mas aceita valor explícito).
  INSERT INTO processos (escritorio_id, numero, cliente_id, servico_id, titulo, status, orgao, protocolo, iniciado_em, prazo_estimado, criado_em, atualizado_em) VALUES
    (v_escritorio, 87, v_cli_ricardo, v_svc_ltda, 'Abertura ME / LTDA', 'aguardando_orgao', 'Junta Comercial', 'JCSP-2026-441802', '2026-08-22', '2026-09-12', '2026-08-22 09:14', '2026-08-27 10:00'),
    (v_escritorio, 86, v_cli_marina, v_svc_alteracao, 'Alteração contratual', 'em_andamento', 'Junta Comercial', NULL, '2026-08-28', '2026-09-18', '2026-08-28 09:00', '2026-09-01 09:00'),
    (v_escritorio, 85, v_cli_atelie, v_svc_alvara, 'Alvará de funcionamento', 'aguardando_docs', 'Prefeitura', NULL, '2026-08-26', '2026-09-21', '2026-08-26 09:00', '2026-08-24 09:00'),
    (v_escritorio, 84, v_cli_padaria, v_svc_vigilancia, 'Alvará vigilância sanitária', 'pendencia', 'Vigilância Sanitária', 'VS-9920-26', '2026-08-12', '2026-09-09', '2026-08-12 09:00', '2026-08-29 09:00'),
    (v_escritorio, 83, v_cli_douglas, v_svc_mei, 'Abertura MEI', 'concluido', 'Receita Federal', '51.902.774/0001-08', '2026-08-27', '2026-08-30', '2026-08-27 09:00', '2026-09-02 09:00'),
    (v_escritorio, 82, v_cli_clinica, v_svc_encerramento, 'Encerramento / baixa', 'em_andamento', 'Junta Comercial', 'JCSP-2026-438110', '2026-08-04', '2026-09-03', '2026-08-04 09:00', '2026-08-31 09:00');
END $$;

-- Etapas genéricas por processo, só pra alimentar a barra de progresso da
-- lista (feitas/total do antigo mock). O processo #87 é o único com tela
-- de detalhe própria (Processo.jsx) e essa continua usando ETAPAS/DOCS do
-- front por enquanto — não migrada nesta rodada.
INSERT INTO processo_etapas (processo_id, nome, ordem, concluida)
SELECT p.id, 'Etapa ' || s.n, s.n, s.n <= t.feitas
FROM (VALUES (87,5,2), (86,4,1), (85,4,0), (84,4,2), (83,3,3), (82,4,2)) AS t(numero, total, feitas)
JOIN processos p ON p.numero = t.numero AND p.escritorio_id = '00000000-0000-0000-0000-000000000001'
JOIN LATERAL generate_series(1, t.total) AS s(n) ON true;
