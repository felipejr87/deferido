// Camada de leitura/escrita real no Postgres (Supabase). Cada função cai
// pro array mock correspondente se o Supabase não estiver configurado ou a
// consulta falhar — nunca deixa a tela em branco por causa disso.
//
// Escopo desta rodada: Catálogo de serviços, lista de Propostas e lista de
// Processos passam a ler dado real; "Salvar rascunho" grava de verdade. O
// construtor de proposta (itens/CommandBar/extração de conversa) continua
// referenciando o catálogo mock por id inteiro — trocar isso por uuid em
// toda a cadeia (AppContext, CommandBar, comandos.js, extracaoLocal.js) é
// um refactor maior, fora do escopo desta passada.
import { supabase, supabaseConectado } from "./supabaseClient.js";
import { ESCRITORIO_ID } from "../config/escritorio.js";
import { SERVICOS as SERVICOS_MOCK, PROPOSTAS as PROPOSTAS_MOCK, PROCESSOS as PROCESSOS_MOCK, STATUS, brl } from "../data/mock.js";
import { track } from "./analytics.js";

function mapServicoReal(row) {
  return {
    id: row.id,
    nome: row.nome,
    cat: row.categoria,
    cobranca: row.tipo_cobranca,
    valor: Number(row.valor),
    custo: Number(row.custo_terceiros || 0),
    prazo: row.prazo_dias,
    etapas: (row.etapas_template || []).map((e) => e.nome).join(" → "),
  };
}

export async function buscarServicosReais() {
  if (!supabaseConectado) return { ok: false, dados: SERVICOS_MOCK };
  const { data, error } = await supabase
    .from("servicos")
    .select("*")
    .eq("escritorio_id", ESCRITORIO_ID)
    .eq("ativo", true)
    .order("ordem");
  if (error || !data?.length) return { ok: false, dados: SERVICOS_MOCK };
  return { ok: true, dados: data.map(mapServicoReal) };
}

function formatarNumero(n) {
  return `#${String(n).padStart(4, "0")}`;
}

function dataCurta(iso) {
  const d = new Date(iso);
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${String(d.getDate()).padStart(2, "0")} ${meses[d.getMonth()]}`;
}

export async function buscarPropostasReais() {
  if (!supabaseConectado) return { ok: false, dados: PROPOSTAS_MOCK };
  const { data, error } = await supabase
    .from("propostas")
    .select("numero, cliente_nome, cliente_doc, total, status, criado_em, proposta_itens(descricao)")
    .eq("escritorio_id", ESCRITORIO_ID)
    .order("numero", { ascending: false });
  if (error || !data?.length) return { ok: false, dados: PROPOSTAS_MOCK };
  return {
    ok: true,
    dados: data.map((p) => ({
      numero: formatarNumero(p.numero),
      cliente: p.cliente_nome,
      doc: p.cliente_doc || "",
      servicos: p.proposta_itens?.map((i) => i.descricao).join(", ") || "",
      total: Number(p.total),
      status: p.status,
      data: dataCurta(p.criado_em),
    })),
  };
}

export async function buscarProcessosReais() {
  if (!supabaseConectado) return { ok: false, dados: PROCESSOS_MOCK };
  const { data, error } = await supabase
    .from("processos")
    .select("numero, titulo, status, orgao, protocolo, prazo_estimado, atualizado_em, clientes(nome), servicos(nome), processo_etapas(concluida)")
    .eq("escritorio_id", ESCRITORIO_ID)
    .order("numero", { ascending: false });
  if (error || !data?.length) return { ok: false, dados: PROCESSOS_MOCK };
  const hoje = Date.now();
  return {
    ok: true,
    dados: data.map((p) => {
      const etapas = p.processo_etapas || [];
      const parado = Math.max(0, Math.floor((hoje - new Date(p.atualizado_em).getTime()) / 86400000));
      return {
        numero: formatarNumero(p.numero),
        cliente: p.clientes?.nome || "",
        servico: p.servicos?.nome || p.titulo,
        status: p.status,
        resp: "—",
        orgao: p.orgao || "—",
        protocolo: p.protocolo || "—",
        prazo: p.prazo_estimado ? dataCurta(p.prazo_estimado) : "—",
        feitas: etapas.filter((e) => e.concluida).length,
        total: etapas.length || 1,
        parado,
      };
    }),
  };
}

// Grava a proposta em construção (AppContext) de verdade. Retorna o número
// gerado ou null se não conseguir (mantém o botão funcional mesmo sem
// Supabase — só não persiste nada, como já era antes).
export async function salvarPropostaReal({ cliente, linhas, subtotal, descontoNum, total, parcelasNum }) {
  if (!supabaseConectado) return { ok: false, motivo: "Supabase não conectado nesta sessão." };
  const { data: proposta, error } = await supabase
    .from("propostas")
    .insert({
      escritorio_id: ESCRITORIO_ID,
      cliente_nome: cliente.nome,
      cliente_doc: cliente.doc,
      cliente_email: cliente.email,
      cliente_telefone: cliente.tel,
      subtotal,
      desconto: descontoNum,
      total,
      parcelas: parcelasNum,
      forma_pagamento: parcelasNum > 1 ? "parcelado" : "avista",
      status: "rascunho",
    })
    .select("id, numero")
    .single();

  if (error) {
    track("proposta_salvar_real_erro", { erro: error.message });
    return { ok: false, motivo: error.message };
  }

  const itens = linhas.map((l, idx) => ({
    proposta_id: proposta.id,
    descricao: l.servico.nome,
    quantidade: l.qtd,
    valor_unit: l.servico.valor,
    valor_total: l.total,
    ordem: idx,
  }));
  const { error: erroItens } = await supabase.from("proposta_itens").insert(itens);
  if (erroItens) {
    track("proposta_salvar_itens_erro", { erro: erroItens.message });
    return { ok: false, motivo: erroItens.message };
  }

  track("proposta_salvar_real_sucesso", { numero: proposta.numero });
  return { ok: true, numero: formatarNumero(proposta.numero) };
}
