-- Simplificação radical de navegação (Parte 7): busca global Cmd+K.
-- Não é SECURITY DEFINER — roda com o RLS do caller, igual fila_de_trabalho().

CREATE OR REPLACE FUNCTION buscar_tudo(p_escritorio_id uuid, p_termo text)
RETURNS TABLE (tipo text, id uuid, titulo text, subtitulo text, rota text)
LANGUAGE sql STABLE
AS $$
  (SELECT 'cliente', c.id, c.nome,
         COALESCE(c.documento, c.telefone, ''), '/clientes'
  FROM clientes c
  WHERE c.escritorio_id = p_escritorio_id AND c.ativo
    AND (c.nome ILIKE '%'||p_termo||'%' OR c.documento ILIKE '%'||p_termo||'%')
  LIMIT 5)

  UNION ALL
  (SELECT 'proposta', p.id, '#' || lpad(p.numero::text,4,'0') || ' · ' || p.cliente_nome,
         'R$ ' || p.total, '/propostas'
  FROM propostas p
  WHERE p.escritorio_id = p_escritorio_id
    AND (p.cliente_nome ILIKE '%'||p_termo||'%' OR p.numero::text = p_termo)
  LIMIT 5)

  UNION ALL
  (SELECT 'processo', pr.id, '#' || lpad(pr.numero::text,4,'0') || ' · ' || pr.titulo,
         pr.status, '/processos/' || lpad(pr.numero::text,4,'0')
  FROM processos pr
  WHERE pr.escritorio_id = p_escritorio_id
    AND (pr.titulo ILIKE '%'||p_termo||'%' OR pr.protocolo ILIKE '%'||p_termo||'%'
         OR pr.numero::text = p_termo)
  LIMIT 5);
$$;
