// Nível 2 — OCR de documentos. Tenta de verdade a Edge Function
// (supabase/functions/extrair-documento), mas ela não está implantada nesta
// demo (sem ANTHROPIC_API_KEY configurada) — então a chamada falha e o
// chamador cai no formulário manual. Isso é intencional: melhor um erro
// honesto do que fingir uma extração que não aconteceu.

export const CAMPOS_POR_TIPO = {
  rg: ["nome", "numero_rg", "orgao_emissor", "uf", "data_emissao"],
  cnh: ["nome", "cpf", "numero_registro", "categoria", "validade"],
  comprovante_endereco: ["cep", "logradouro", "numero", "bairro", "cidade", "uf"],
  contrato_social: ["razao_social", "cnpj", "capital_social", "objeto_social", "socios"],
  cartao_cnpj: ["cnpj", "razao_social", "nome_fantasia", "cnae_principal", "endereco"],
};

export const TIPOS_DOCUMENTO = [
  { value: "rg", label: "RG" },
  { value: "cnh", label: "CNH" },
  { value: "comprovante_endereco", label: "Comprovante de endereço" },
  { value: "contrato_social", label: "Contrato social" },
  { value: "cartao_cnpj", label: "Cartão CNPJ" },
];

export async function extrairDocumento({ arquivoBase64, mimeType, tipoDocumento }) {
  try {
    const resp = await fetch("/functions/v1/extrair-documento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ arquivo_base64: arquivoBase64, mime_type: mimeType, tipo_documento: tipoDocumento }),
    });
    if (!resp.ok) {
      return { ok: false, erro: "Backend de OCR não conectado nesta demo (ver supabase/functions/extrair-documento — falta ANTHROPIC_API_KEY)." };
    }
    return await resp.json();
  } catch {
    return { ok: false, erro: "Backend de OCR não conectado nesta demo (ver supabase/functions/extrair-documento — falta ANTHROPIC_API_KEY)." };
  }
}

export function arquivoParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
