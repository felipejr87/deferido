// Nível 4 — comando em linguagem natural, versão sem IA. A spec descreve
// function calling via Claude (supabase/functions/assistente-comandos, não
// conectada aqui). Este parser cobre, por regras, exatamente os 3 formatos
// de exemplo da própria spec — real, funcional, sem custo de API, mas rígido:
// foge do formato e ele não reconhece (retorna null, nunca inventa).
//
// Toda saída é uma PROPOSTA de ação — nunca aplica nada sozinho. Quem aplica
// é o CommandBar depois que o operador confirma (mesma regra da versão com IA).

import { SERVICOS, CATS } from "../data/mock.js";

const SERVICO_POR_PALAVRA = [
  { termos: ["mei"], id: 1 },
  { termos: ["ltda", "me ", "abertura de empresa", "abrir empresa"], id: 2 },
  { termos: ["alteração", "alteracao", "alterar contrato"], id: 3 },
  { termos: ["encerramento", "encerrar", "baixa"], id: 4 },
  { termos: ["alvará de funcionamento", "alvara de funcionamento", "alvará", "alvara"], id: 5 },
  { termos: ["vigilância", "vigilancia"], id: 6 },
  { termos: ["curso"], id: 7 },
  { termos: ["contabilidade"], id: 8 },
  { termos: ["jurídico", "juridico", "contrato de prestação"], id: 9 },
];

const ORGAO_POR_PALAVRA = [
  { termos: ["junta"], orgao: "Junta Comercial" },
  { termos: ["receita"], orgao: "Receita Federal" },
  { termos: ["prefeitura"], orgao: "Prefeitura" },
  { termos: ["vigilância", "vigilancia"], orgao: "Vigilância Sanitária" },
];

function acharServico(textoLower) {
  const found = SERVICO_POR_PALAVRA.find((s) => s.termos.some((t) => textoLower.includes(t)));
  return found ? SERVICOS.find((s) => s.id === found.id) : null;
}

// "protocolei o processo 45 na junta, protocolo 2026/887766"
function tentarAtualizarProcesso(texto) {
  const lower = texto.toLowerCase();
  if (!/protocol/.test(lower)) return null;
  const numeroMatch = texto.match(/processo\s*#?(\d+)/i);
  if (!numeroMatch) return null;

  const protocoloMatch = texto.match(/protocolo\s*([\w./-]+)/i);
  const orgaoFound = ORGAO_POR_PALAVRA.find((o) => o.termos.some((t) => lower.includes(t)));

  return {
    tipo: "atualizar_processo",
    descricao: `Atualizar processo #${numeroMatch[1]}`,
    dados: {
      processoNumero: numeroMatch[1],
      status: "aguardando_orgao",
      protocolo: protocoloMatch ? protocoloMatch[1] : null,
      orgao: orgaoFound?.orgao ?? null,
    },
  };
}

// "joão ligou, quer abrir mei de eletricista, 11 98765 4321"
function tentarCriarLead(texto) {
  const lower = texto.toLowerCase();
  const telefoneMatch = texto.match(/(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/);
  const gatilho = /\bligou\b|\bquer\b.*\bmei\b|\bquer abrir\b|\blead\b/.test(lower);
  if (!telefoneMatch || !gatilho) return null;

  const nomeMatch = texto.match(/^([A-ZÀ-Ú][a-zà-ú]+)\b/);
  const servico = acharServico(lower);

  return {
    tipo: "criar_lead",
    descricao: `Criar lead${nomeMatch ? " — " + nomeMatch[1] : ""}`,
    dados: {
      nome: nomeMatch ? nomeMatch[1] : null,
      telefone: telefoneMatch[0].replace(/\D/g, ""),
      interesse: texto.trim(),
      servicoSugerido: servico?.nome ?? null,
    },
  };
}

// "abertura ltda pra Maria Silva, capital 10 mil, comércio de roupas em santo
// andré, 1200 em 3x"
function tentarCriarProposta(texto) {
  const lower = texto.toLowerCase();
  const servico = acharServico(lower);
  if (!servico) return null;

  const nomeMatch = texto.match(/\bpr?a\s+([A-ZÀ-Úa-zà-ú][\w' -]{2,40}?)(?:,|\.|$)/i);
  const parcelasMatch = texto.match(/(\d+)\s*x\b/i);
  const valorMatch = texto.match(/(\d{2,6})(?:\s*reais)?\s*(?:em\s*\d+x)?/i);

  return {
    tipo: "criar_proposta",
    descricao: `Criar proposta — ${servico.nome}${nomeMatch ? " para " + nomeMatch[1].trim() : ""}`,
    dados: {
      clienteNome: nomeMatch ? nomeMatch[1].trim() : null,
      servicoId: servico.id,
      servicoNome: servico.nome,
      categoria: CATS[servico.cat],
      valorCatalogo: servico.valor,
      valorMencionado: valorMatch ? Number(valorMatch[1]) : null,
      parcelas: parcelasMatch ? Number(parcelasMatch[1]) : 1,
    },
  };
}

// "recebi o rg do processo 45" / "documento rg recebido no processo 45"
function tentarRegistrarDocumento(texto) {
  const lower = texto.toLowerCase();
  if (!/(recebi|chegou|enviou)\b/.test(lower)) return null;
  const numeroMatch = texto.match(/processo\s*#?(\d+)/i);
  if (!numeroMatch) return null;
  const docMatch = texto.match(/\b(rg|cpf|comprovante de endereço|comprovante de endereco|contrato social|iptu)\b/i);
  if (!docMatch) return null;

  return {
    tipo: "registrar_documento",
    descricao: `Marcar "${docMatch[1]}" como recebido no processo #${numeroMatch[1]}`,
    dados: { processoNumero: numeroMatch[1], documentoNome: docMatch[1] },
  };
}

export function parseComando(texto) {
  const t = String(texto || "").trim();
  if (!t) return null;
  return tentarAtualizarProcesso(t) || tentarRegistrarDocumento(t) || tentarCriarLead(t) || tentarCriarProposta(t) || null;
}
