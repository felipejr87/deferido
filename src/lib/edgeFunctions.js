// Chamadas reais às Edge Functions implantadas (supabase/functions/*).
// Cada uma tem fallback local se o Supabase não estiver configurado, a
// função não estiver implantada, ou a chamada falhar por qualquer motivo —
// nunca trava o fluxo, só degrada para a versão sem IA.
import { supabase } from "./supabaseClient.js";
import { track } from "./analytics.js";
import { CATS } from "../data/mock.js";

async function invocar(nome, body) {
  if (!supabase) return { ok: false, erro: "Supabase não configurado (.env.local ausente)." };
  try {
    const { data, error } = await supabase.functions.invoke(nome, { body });
    if (error) {
      track("edge_function_erro", { funcao: nome, erro: error.message });
      return { ok: false, erro: error.message };
    }
    track("edge_function_sucesso", { funcao: nome });
    return data;
  } catch (err) {
    track("edge_function_erro", { funcao: nome, erro: String(err) });
    return { ok: false, erro: String(err) };
  }
}

export function extrairLeadIA(conversa) {
  return invocar("extrair-lead", { conversa });
}

export function extrairDocumentoIA({ arquivoBase64, mimeType, tipoDocumento }) {
  return invocar("extrair-documento", { arquivo_base64: arquivoBase64, mime_type: mimeType, tipo_documento: tipoDocumento });
}

// Normaliza a resposta do assistente ({ferramenta,input}, chaves snake_case
// do schema da spec) para o MESMO formato {tipo,descricao,dados} — com as
// mesmas chaves camelCase — que o parser local (comandos.js) produz.
// CommandBar.jsx trata as duas origens de forma idêntica depois disso.
//
// `catalogo` é o useCatalogo() do chamador: o assistente recebe o catálogo
// real (com uuid) no contexto e deve devolver servico_id exato (ver system
// prompt em supabase/functions/assistente-comandos) — casamos por id
// primeiro; nome só entra como fallback se o id vier ausente/errado.
function normalizarAcaoIA(ferramenta, input, catalogo) {
  if (ferramenta === "criar_proposta") {
    const primeiroServico = input.servicos?.[0];
    const servico = (primeiroServico?.servico_id && catalogo.porId(primeiroServico.servico_id)) || catalogo.porNome(primeiroServico?.nome);
    return {
      tipo: "criar_proposta",
      descricao: `Criar proposta — ${servico?.nome ?? primeiroServico?.nome ?? "serviço"}${input.cliente_nome ? " para " + input.cliente_nome : ""}`,
      dados: {
        clienteNome: input.cliente_nome ?? null,
        servicoId: servico?.id ?? null,
        servicoNome: servico?.nome ?? primeiroServico?.nome ?? null,
        categoria: servico ? CATS[servico.cat] : null,
        valorCatalogo: servico?.valor ?? primeiroServico?.valor ?? null,
        valorMencionado: primeiroServico?.valor ?? null,
        parcelas: input.parcelas ?? 1,
        desconto: input.desconto ?? null,
      },
    };
  }
  if (ferramenta === "atualizar_processo") {
    return {
      tipo: "atualizar_processo",
      descricao: `Atualizar processo #${input.processo_numero}`,
      dados: {
        processoNumero: input.processo_numero,
        status: input.status ?? "aguardando_orgao",
        protocolo: input.protocolo ?? null,
        orgao: input.orgao ?? null,
      },
    };
  }
  if (ferramenta === "registrar_documento") {
    return {
      tipo: "registrar_documento",
      descricao: `Marcar "${input.documento_nome}" como recebido no processo #${input.processo_numero}`,
      dados: { processoNumero: input.processo_numero, documentoNome: input.documento_nome },
    };
  }
  if (ferramenta === "criar_lead") {
    return {
      tipo: "criar_lead",
      descricao: `Criar lead${input.nome ? " — " + input.nome : ""}`,
      dados: { nome: input.nome ?? null, telefone: input.telefone ?? null, interesse: input.interesse ?? null, servicoSugerido: null },
    };
  }
  return { tipo: ferramenta, descricao: ferramenta, dados: input };
}

export async function interpretarComandoIA(comando, contexto, catalogo) {
  const res = await invocar("assistente-comandos", { comando, contexto });
  if (!res.ok) return res;
  if (res.tipo === "resposta") return { ok: true, resposta: res.texto };
  if (res.tipo !== "acao_proposta") return { ok: false, erro: "Resposta inesperada do assistente." };

  return { ok: true, acao: { ...normalizarAcaoIA(res.ferramenta, res.input, catalogo), origem: "ia" } };
}
