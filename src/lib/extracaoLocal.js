// Nível 3 — extração de conversa, versão sem IA. A spec pede extração
// semântica via Claude (supabase/functions/extrair-lead); sem
// ANTHROPIC_API_KEY configurada, isso não existe de verdade nesta build.
// Em vez de simular uma resposta de IA (o que seria enganoso), esta função
// faz o que dá pra fazer com regras simples e honestas: acha telefone,
// e-mail, e sugere serviço por palavra-chave. É real, só é burro — o
// operador sempre revisa antes de salvar (mesma UX do card de confirmação).

const TELEFONE_RE = /(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;

// Termos que disparam cada palpite — casados contra o catálogo real via
// catalogo.porNome (que já tem seu próprio fallback por categoria).
const PALAVRAS_SERVICO = [
  "mei",
  "ltda", "abrir empresa", "abertura de empresa", "sócio", "socios",
  "alterar", "alteração", "mudar sócio", "trocar endereço",
  "encerrar", "fechar empresa", "baixa",
  "alvará", "funcionamento",
  "vigilância", "vigilancia sanitária",
  "curso",
  "contabilidade", "contador",
  "contrato", "jurídico", "advogado",
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

export function extrairLeadDaConversa(textoConversa, catalogo) {
  const texto = String(textoConversa || "");
  const telefoneMatch = texto.match(TELEFONE_RE);
  const emailMatch = texto.match(EMAIL_RE);

  const lower = texto.toLowerCase();
  const termoEncontrado = PALAVRAS_SERVICO.find((t) => lower.includes(t));
  const servico = termoEncontrado ? catalogo.porNome(termoEncontrado) : null;

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
