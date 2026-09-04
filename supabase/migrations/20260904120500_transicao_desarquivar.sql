-- Parte 0.5 da spec (desfazer em vez de confirmar): arquivar uma proposta
-- oferece 10s pra desfazer, o que exige que 'arquivada' -> 'rascunho'
-- também seja uma transição válida — faltou no seed original de
-- 20260904120000_fluxo_estados_e_fila.sql.
INSERT INTO fluxo_transicoes (entidade, de, para, rotulo, efeitos, automatica, ordem) VALUES
  ('proposta', 'arquivada', 'rascunho', 'Restaurar', '[]', false, 7)
ON CONFLICT (entidade, de, para) DO NOTHING;
