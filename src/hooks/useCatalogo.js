// Fonte única de verdade do catálogo de serviços. Lê da tabela `servicos`
// real (Postgres) com cache em memória; cai para o array mock (com ids
// prefixados 'mock-' pra nunca colidir com um uuid real) se o Supabase não
// estiver configurado ou a consulta falhar. Todo componente que precisa do
// catálogo — builder de proposta, CommandBar, extração de conversa —
// deve usar este hook em vez de importar SERVICOS de data/mock.js direto.
import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConectado } from "../lib/supabaseClient.js";
import { ESCRITORIO_ID } from "../config/escritorio.js";
import { SERVICOS as SERVICOS_MOCK } from "../data/mock.js";

let _cache = null;
let _promise = null;

function mapRow(row) {
  return {
    id: row.id,
    nome: row.nome,
    cat: row.categoria,
    cobranca: row.tipo_cobranca,
    valor: Number(row.valor),
    custo: Number(row.custo_terceiros || 0),
    prazo: row.prazo_dias,
    etapasTemplate: row.etapas_template || [],
    documentosTemplate: row.documentos_template || [],
    etapas: (row.etapas_template || []).map((e) => e.nome).join(" → "),
    _mock: false,
  };
}

function mapMock(s) {
  return {
    ...s,
    id: `mock-${s.id}`,
    etapasTemplate: [],
    documentosTemplate: [],
    _mock: true,
  };
}

async function carregarCatalogo() {
  if (_cache) return _cache;
  if (_promise) return _promise;

  _promise = (async () => {
    try {
      if (!supabaseConectado) throw new Error("Supabase não conectado nesta sessão.");
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome, descricao, categoria, tipo_cobranca, valor, custo_terceiros, prazo_dias, etapas_template, documentos_template, ativo, ordem")
        .eq("escritorio_id", ESCRITORIO_ID)
        .eq("ativo", true)
        .order("ordem")
        .order("nome");

      if (error) throw error;
      if (!data?.length) throw new Error("catálogo vazio");

      _cache = data.map(mapRow);
      return _cache;
    } catch (e) {
      console.warn("[catalogo] fallback para mock:", e.message);
      _cache = SERVICOS_MOCK.map(mapMock);
      return _cache;
    } finally {
      _promise = null;
    }
  })();

  return _promise;
}

export function invalidarCatalogo() {
  _cache = null;
}

function normalizar(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const PALAVRAS_POR_CATEGORIA = {
  mei: ["mei", "microempreendedor"],
  abertura: ["abertura", "abrir", "constituicao", "ltda", "slu", "empresa"],
  alteracao: ["alteracao", "alterar", "mudanca", "contratual", "socio"],
  encerramento: ["encerramento", "encerrar", "baixa", "fechar", "distrato"],
  alvara: ["alvara", "funcionamento", "vigilancia", "sanitaria", "licenca"],
  contabil: ["contabil", "contabilidade", "mensalidade", "contador"],
  juridico: ["juridico", "contrato", "consultoria", "advogado"],
  curso: ["curso", "treinamento", "aula"],
};

export function useCatalogo() {
  const [servicos, setServicos] = useState(_cache || []);
  const [carregando, setCarregando] = useState(!_cache);

  useEffect(() => {
    let vivo = true;
    carregarCatalogo().then((data) => {
      if (vivo) {
        setServicos(data);
        setCarregando(false);
      }
    });
    return () => {
      vivo = false;
    };
  }, []);

  const porId = useCallback((id) => servicos.find((s) => String(s.id) === String(id)) || null, [servicos]);

  const porNome = useCallback(
    (termo) => {
      if (!termo) return null;
      const t = normalizar(termo);

      let hit = servicos.find((s) => normalizar(s.nome) === t);
      if (hit) return hit;

      hit = servicos.find((s) => normalizar(s.nome).includes(t) || t.includes(normalizar(s.nome)));
      if (hit) return hit;

      for (const [cat, chaves] of Object.entries(PALAVRAS_POR_CATEGORIA)) {
        if (chaves.some((k) => t.includes(k))) {
          hit = servicos.find((s) => normalizar(s.cat || "").includes(cat));
          if (hit) return hit;
        }
      }
      return null;
    },
    [servicos],
  );

  const recarregar = useCallback(() => {
    invalidarCatalogo();
    return carregarCatalogo().then((data) => {
      setServicos(data);
      return data;
    });
  }, []);

  return { servicos, carregando, porId, porNome, recarregar };
}
