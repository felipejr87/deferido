// SHA-256 real via Web Crypto (window.crypto.subtle) — usado na assinatura
// eletrônica nível 1 (Bloco B2): o hash do conteúdo assinado é genuíno,
// calculado no navegador, não simulado.
export async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
