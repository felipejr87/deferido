// Nível 2 — OCR de documentos. Chama a Edge Function extrair-documento de
// verdade via supabase-js; sem Supabase configurado (ou se a chamada
// falhar), quem chama isso cai no formulário manual — nunca finge um
// resultado de IA que não aconteceu.
import { extrairDocumentoIA } from "./edgeFunctions.js";
import { supabaseConectado } from "./supabaseClient.js";

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
  if (!supabaseConectado) {
    return { ok: false, erro: "Supabase não conectado nesta sessão (.env.local ausente)." };
  }
  const res = await extrairDocumentoIA({ arquivoBase64, mimeType, tipoDocumento });
  if (!res.ok) {
    return { ok: false, erro: `Extração automática falhou: ${res.erro}` };
  }
  return res;
}

export function arquivoParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
