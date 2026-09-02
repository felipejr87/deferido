// Nível 3 — extração de conversa, versão sem IA. A spec pede extração
// semântica via Claude (supabase/functions/extrair-lead); sem
// ANTHROPIC_API_KEY configurada, isso não existe de verdade nesta build.
// Em vez de simular uma resposta de IA (o que seria enganoso), esta função
// faz o que dá pra fazer com regras simples e honestas: acha telefone,
// e-mail, e sugere serviço por palavra-chave. É real, só é burro — o
// operador sempre revisa antes de salvar (mesma UX do card de confirmação).

import { SERVICOS } from "../data/mock.js";

const TELEFONE_RE = /(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;

const PALAVRAS_SERVICO = [
  { termos: ["mei"], servicoId: 1 },
  { termos: ["ltda", "abrir empresa", "abertura de empresa", "sócio", "socios"], servicoId: 2 },
  { termos: ["alterar", "alteração", "mudar sócio", "trocar endereço"], servicoId: 3 },
  { termos: ["encerrar", "fechar empresa", "baixa"], servicoId: 4 },
  { termos: ["alvará", "funcionamento"], servicoId: 5 },
  { termos: ["vigilância", "vigilancia sanitária"], servicoId: 6 },
  { termos: ["curso"], servicoId: 7 },
  { termos: ["contabilidade", "contador"], servicoId: 8 },
  { termos: ["contrato", "jurídico", "advogado"], servicoId: 9 },
];

function adivinharNome(texto) {
  // Primeira linha não vazia que não é telefone/e-mail vira candidato a nome.
  const linhas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const linha of linhas.slice(0, 3)) {
    if (TELEFONE_RE.test(linha) || EMAIL_RE.test(linha)) continue;
    const limpa = linha.replace(/[:\-–].*$/, "").trim();
    if (limpa.length > 1 && limpa.length < 40 && !/^\d+$/.test(limpa)) return limpa;
  }
  return null;
}

export function extrairLeadDaConversa(textoConversa) {
  const texto = String(textoConversa || "");
  const telefoneMatch = texto.match(TELEFONE_RE);
  const emailMatch = texto.match(EMAIL_RE);

  const servicoEncontrado = PALAVRAS_SERVICO.find((p) => p.termos.some((t) => texto.toLowerCase().includes(t)));
  const servico = servicoEncontrado ? SERVICOS.find((s) => s.id === servicoEncontrado.servicoId) : null;

  return {
    nome: adivinharNome(texto),
    telefone: telefoneMatch ? telefoneMatch[0].replace(/\D/g, "") : null,
    email: emailMatch ? emailMatch[0] : null,
    servicoSugerido: servico?.nome ?? null,
    servicoId: servico?.id ?? null,
    interesse: texto.trim().slice(0, 240),
    metodo: "regras_locais",
  };
}
