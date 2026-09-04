// Máquina de estados real (fluxo_transicoes no Postgres) — Parte 1 da spec
// de fluxos. transicionar() é o único caminho pra mudar o status de uma
// proposta/processo: valida a transição contra o banco antes de aplicar,
// então nenhum botão da tela deveria conseguir levar a um estado impossível
// (o front já filtra pelas transições válidas antes de desenhar o botão —
// isso aqui é a segunda trava, não a primeira).
import { supabase, supabaseConectado } from "./supabaseClient.js";
import { track } from "./analytics.js";
import { rotuloStatus as rotuloStatusVocab, rotuloCampo } from "./vocabulario.js";

const TABELA = { proposta: "propostas", processo: "processos" };

// Erro pensado pra ser mostrado direto na tela (Parte 0.10: o que
// aconteceu + por que + o que fazer) — nunca um erro de banco cru.
export class ErroAmigavel extends Error {
  constructor(mensagem, sugestao) {
    super(sugestao ? `${mensagem} ${sugestao}` : mensagem);
    this.mensagem = mensagem;
    this.sugestao = sugestao;
  }
}

// Efeitos realmente executáveis hoje (sem infra de envio de e-mail/WhatsApp
// real conectada): registrar_aceite e criar_cobranca gravam de verdade.
// O resto vira um evento de auditoria/analytics em vez de fingir que uma
// notificação foi enviada — mesmo padrão "honesto" do resto do projeto.
async function executarEfeito(codigo, entidade, id, atual, dados) {
  if (codigo === "registrar_aceite" && entidade === "proposta") {
    await supabase.from("propostas").update({
      aceita_em: new Date().toISOString(),
      aceite_nome: dados.aceiteNome || null,
    }).eq("id", id);
    return;
  }
  if (codigo === "criar_cobranca" && entidade === "proposta") {
    const vencimento = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    await supabase.from("cobrancas").insert({
      escritorio_id: atual.escritorio_id,
      cliente_id: atual.cliente_id,
      proposta_id: id,
      descricao: `Proposta #${String(atual.numero).padStart(4, "0")}`,
      valor: atual.total,
      vencimento,
    });
    return;
  }
  // Efeitos de notificação (cliente/escritório) e SLA/consulta dependem de
  // infra ainda não conectada (WhatsApp/e-mail real, SLA da Parte 3, robô
  // da Parte 4) — fica registrado como evento em vez de fingir que rodou.
  track("fluxo_efeito_pendente", { codigo, entidade, entidade_id: id });
}

export async function transicionar(entidade, id, novoStatus, dados = {}) {
  if (!supabaseConectado) {
    throw new ErroAmigavel("Não consegui salvar.", "O Supabase não está conectado nesta sessão.");
  }

  const tabela = TABELA[entidade];
  const { data: atual, error: erroAtual } = await supabase.from(tabela).select("*").eq("id", id).single();
  if (erroAtual || !atual) {
    throw new ErroAmigavel("Esse registro não existe mais.", "Atualize a página e tente de novo.");
  }

  const { data: transicao } = await supabase
    .from("fluxo_transicoes")
    .select("*")
    .eq("entidade", entidade)
    .eq("de", atual.status)
    .eq("para", novoStatus)
    .maybeSingle();

  if (!transicao) {
    throw new ErroAmigavel(
      `Não dá para ir de "${rotuloStatusVocab(entidade, atual.status).label}" para "${rotuloStatusVocab(entidade, novoStatus).label}".`,
      "Verifique se alguma etapa anterior ficou pendente.",
    );
  }

  const faltando = (transicao.requer_campos || []).filter((c) => !dados[c] && !atual[c]);
  if (faltando.length) {
    throw new ErroAmigavel(`Falta preencher: ${faltando.map(rotuloCampo).join(", ")}.`);
  }

  const camposValidos = ["protocolo", "orgao", "observacoes"];
  const patch = { status: novoStatus };
  for (const c of camposValidos) if (dados[c] != null) patch[c] = dados[c];

  const { error: erroUpdate } = await supabase.from(tabela).update(patch).eq("id", id);
  if (erroUpdate) {
    throw new ErroAmigavel("Não consegui salvar.", "Tente de novo em alguns segundos.");
  }

  for (const efeito of transicao.efeitos || []) {
    try {
      await executarEfeito(efeito, entidade, id, { ...atual, ...patch }, dados);
    } catch (err) {
      track("fluxo_efeito_erro", { codigo: efeito, entidade, entidade_id: id, erro: String(err) });
    }
  }

  track("fluxo_transicao", { entidade, entidade_id: id, de: atual.status, para: novoStatus });
  return { ok: true, de: atual.status, para: novoStatus };
}
