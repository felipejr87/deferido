-- Um item de linha por proposta semeada em 0004, só com a descrição que já
-- aparecia como texto "servicos" no mock — não tenta reconstruir o
-- detalhamento exato de preço por serviço dos exemplos combinados (ex:
-- "Abertura MEI + Curso"), que nunca existiu de fato nos dados originais.
INSERT INTO proposta_itens (proposta_id, descricao, quantidade, valor_unit, valor_total)
SELECT p.id, t.descricao, 1, p.total, p.total
FROM (VALUES
  (148, 'Alteração contratual'),
  (147, 'Abertura MEI + Curso'),
  (146, 'Alvará de funcionamento'),
  (145, 'Abertura ME / LTDA'),
  (144, 'Alvará vigilância sanitária'),
  (143, 'Contabilidade mensal')
) AS t(numero, descricao)
JOIN propostas p ON p.numero = t.numero AND p.escritorio_id = '00000000-0000-0000-0000-000000000001';
