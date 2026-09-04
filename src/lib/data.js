// Camada de leitura/escrita real no Postgres (Supabase). Cada função cai
// pro array mock correspondente se o Supabase não estiver configurado ou a
// consulta falhar — nunca deixa a tela em branco por causa disso.
//
// O construtor de proposta (itens/CommandBar/extração de conversa) já
// referencia o catálogo real por uuid via src/hooks/useCatalogo.js —
// "Salvar rascunho" grava proposta_itens.servico_id de verdade, e uma
// proposta aceita pode gerar processo com as etapas/documentos do
// etapas_template/documentos_template do serviço (gerarProcessoDaProposta).
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
    .select("id, numero, cliente_id, cliente_nome, cliente_doc, total, status, criado_em, proposta_itens(descricao)")
    .eq("escritorio_id", ESCRITORIO_ID)
    .order("numero", { ascending: false });
  if (error || !data?.length) return { ok: false, dados: PROPOSTAS_MOCK };
  return {
    ok: true,
    dados: data.map((p) => ({
      id: p.id,
      clienteId: p.cliente_id,
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
    servico_id: l.servico._mock ? null : l.servico.id,
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

// Acha um cliente existente do escritório pelo documento (CPF/CNPJ), ou cria
// um novo a partir dos dados soltos da proposta. `processos.cliente_id` é
// NOT NULL — propostas hoje só guardam cliente_nome/doc/email/telefone como
// texto solto, então isso é o que garante ter um cliente real antes de gerar
// o processo.
async function acharOuCriarCliente(proposta) {
  if (proposta.cliente_id) return { ok: true, id: proposta.cliente_id };

  if (proposta.cliente_doc) {
    const { data: existente } = await supabase
      .from("clientes")
      .select("id")
      .eq("escritorio_id", ESCRITORIO_ID)
      .eq("documento", proposta.cliente_doc)
      .maybeSingle();
    if (existente) return { ok: true, id: existente.id };
  }

  const { data: novo, error } = await supabase
    .from("clientes")
    .insert({
      escritorio_id: ESCRITORIO_ID,
      tipo: (proposta.cliente_doc || "").replace(/\D/g, "").length === 14 ? "pj" : "pf",
      nome: proposta.cliente_nome,
      documento: proposta.cliente_doc || null,
      email: proposta.cliente_email || null,
      telefone: proposta.cliente_telefone || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, motivo: error.message };
  return { ok: true, id: novo.id };
}

function somarDias(dias) {
  if (!dias) return null;
  return new Date(Date.now() + dias * 86400000).toISOString().split("T")[0];
}

// Gera um processo por serviço com servico_id real na proposta aceita —
// cada processo nasce com as etapas e documentos do etapas_template /
// documentos_template do serviço (itens sem servico_id real, ou seja com
// _mock: true no momento em que a proposta foi salva, são ignorados: não há
// template de verdade pra eles).
export async function gerarProcessoDaProposta(propostaId) {
  if (!supabaseConectado) return { ok: false, motivo: "Supabase não conectado nesta sessão." };

  const { data: proposta, error: erroProposta } = await supabase
    .from("propostas")
    .select("id, numero, cliente_id, cliente_nome, cliente_doc, cliente_email, cliente_telefone")
    .eq("id", propostaId)
    .single();
  if (erroProposta) return { ok: false, motivo: erroProposta.message };

  const { data: itens, error: erroItens } = await supabase
    .from("proposta_itens")
    .select("servico_id, descricao, servicos(nome, prazo_dias, etapas_template, documentos_template)")
    .eq("proposta_id", propostaId)
    .not("servico_id", "is", null);
  if (erroItens) return { ok: false, motivo: erroItens.message };
  if (!itens?.length) return { ok: false, motivo: "Nenhum item desta proposta tem serviço do catálogo real — não há template pra gerar processo." };

  const cliente = await acharOuCriarCliente(proposta);
  if (!cliente.ok) return cliente;
  if (!proposta.cliente_id) {
    await supabase.from("propostas").update({ cliente_id: cliente.id }).eq("id", propostaId);
  }

  const criados = [];
  for (const item of itens) {
    const svc = item.servicos;
    if (!svc) continue;

    const { data: proc, error: erroProc } = await supabase
      .from("processos")
      .insert({
        escritorio_id: ESCRITORIO_ID,
        cliente_id: cliente.id,
        servico_id: item.servico_id,
        proposta_id: propostaId,
        titulo: `${svc.nome} — ${proposta.cliente_nome}`,
        status: "aguardando_docs",
        prazo_estimado: somarDias(svc.prazo_dias),
      })
      .select()
      .single();
    if (erroProc) {
      track("processo_gerar_erro", { erro: erroProc.message });
      continue;
    }

    const etapas = (svc.etapas_template || []).map((e, i) => ({
      processo_id: proc.id,
      nome: e.nome,
      ordem: i,
      prazo: somarDias(e.prazo_dias),
    }));
    if (etapas.length) await supabase.from("processo_etapas").insert(etapas);

    const docs = (svc.documentos_template || []).map((d) => ({
      processo_id: proc.id,
      nome: d.nome,
      obrigatorio: d.obrigatorio !== false,
    }));
    if (docs.length) await supabase.from("processo_documentos").insert(docs);

    await supabase.from("processo_eventos").insert({
      processo_id: proc.id,
      tipo: "criado",
      descricao: `Processo aberto a partir da proposta ${formatarNumero(proposta.numero)}`,
      visivel_cliente: true,
    });

    track("processo_gerar_sucesso", { proposta_numero: proposta.numero, servico: svc.nome });
    criados.push(proc);
  }

  if (!criados.length) return { ok: false, motivo: "Nenhum processo pôde ser criado." };
  return { ok: true, dados: criados };
}
