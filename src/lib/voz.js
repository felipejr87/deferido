// Nível 5 — voz. Web Speech API é nativa do navegador (Chrome/Edge), grátis,
// sem credencial nenhuma: dá pra ser real de verdade, ao contrário do
// OCR/NLU via Claude. Fallback: se o navegador não suportar, o botão de
// microfone fica desabilitado com um aviso — nunca falha silenciosamente.

export function vozDisponivel() {
  return typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function criarReconhecimento({ onResult, onEnd, onError }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const rec = new SpeechRecognition();
  rec.lang = "pt-BR";
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onresult = (e) => {
    const texto = e.results[0][0].transcript;
    onResult?.(texto);
  };
  rec.onerror = (e) => onError?.(e.error);
  rec.onend = () => onEnd?.();

  return rec;
}

// Números por extenso e "meia" (uso brasileiro em telefone/protocolo) → dígito.
// Regra inegociável (spec): todo número que passar por aqui tem que aparecer
// em destaque no card de confirmação antes de qualquer gravação — nunca
// salvamos direto a partir de voz transcrita.
const NUMEROS_EXTENSO = {
  zero: "0", um: "1", uma: "1", dois: "2", duas: "2", três: "3", tres: "3",
  quatro: "4", cinco: "5", seis: "6", sete: "7", oito: "8", nove: "9",
};

export function normalizarNumeros(texto) {
  let t = texto;
  t = t.replace(/\bmeia\b/gi, "6");
  for (const [palavra, digito] of Object.entries(NUMEROS_EXTENSO)) {
    t = t.replace(new RegExp(`\\b${palavra}\\b`, "gi"), digito);
  }
  // Junta sequências de dígitos separados por espaço que vieram de fala
  // ("2 0 2 6" → "2026") só quando há 3+ dígitos seguidos, pra não grudar
  // números que realmente eram frases separadas.
  t = t.replace(/\b(\d)(?:\s+(\d)){2,}\b/g, (m) => m.replace(/\s+/g, ""));
  return t;
}
