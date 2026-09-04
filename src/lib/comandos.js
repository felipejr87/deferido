// Nível 4 — comando em linguagem natural, versão sem IA. A spec descreve
// function calling via Claude (supabase/functions/assistente-comandos, não
// conectada aqui). Este parser cobre, por regras, exatamente os 3 formatos
// de exemplo da própria spec — real, funcional, sem custo de API, mas rígido:
// foge do formato e ele não reconhece (retorna null, nunca inventa).
//
// Toda saída é uma PROPOSTA de ação — nunca aplica nada sozinho. Quem aplica
// é o CommandBar depois que o operador confirma (mesma regra da versão com IA).

import { CATS } from "../data/mock.js";

const ORGAO_POR_PALAVRA = [
  { termos: ["junta"], orgao: "Junta Comercial" },
  { termos: ["receita"], orgao: "Receita Federal" },
  { termos: ["prefeitura"], orgao: "Prefeitura" },
  { termos: ["vigilância", "vigilancia"], orgao: "Vigilância Sanitária" },
];

// catalogo.porNome já casa por nome exato, substring, e por palavra-chave
// de categoria — reaproveita a mesma lógica em vez de manter uma tabela
// palavra→id separada (que ficava presa aos ids inteiros do mock).
function acharServico(textoLower, catalogo) {
  return catalogo.porNome(textoLower);
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
function tentarCriarLead(texto, catalogo) {
  const lower = texto.toLowerCase();
  const telefoneMatch = texto.match(/(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/);
  const gatilho = /\bligou\b|\bquer\b.*\bmei\b|\bquer abrir\b|\blead\b/.test(lower);
  if (!telefoneMatch || !gatilho) return null;

  const nomeMatch = texto.match(/^([A-ZÀ-Ú][a-zà-ú]+)\b/);
  const servico = acharServico(lower, catalogo);

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
function tentarCriarProposta(texto, catalogo) {
  const lower = texto.toLowerCase();
  const servico = acharServico(lower, catalogo);
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

// `catalogo` vem de useCatalogo() — precisa ser passado pelo chamador
// (CommandBar) porque este módulo não é um componente React.
export function parseComando(texto, catalogo) {
  const t = String(texto || "").trim();
  if (!t) return null;
  return tentarAtualizarProcesso(t) || tentarRegistrarDocumento(t) || tentarCriarLead(t, catalogo) || tentarCriarProposta(t, catalogo) || null;
}
