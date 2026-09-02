// Edge Function: extrair-documento (Nível 2 — OCR via Claude com visão)
//
// NÃO CONECTADA nesta demo: precisa de ANTHROPIC_API_KEY configurada como
// secret do projeto Supabase (supabase secrets set ANTHROPIC_API_KEY=...).
// O front (src/pages/Arquivos.jsx) tenta chamar esta function; sem ela
// implantada, cai no aviso "requer backend conectado" e no formulário manual.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const INSTRUCOES: Record<string, string> = {
  rg: "Extraia: nome completo, número do RG, órgão emissor, UF, data de emissão, nome do pai, nome da mãe, data de nascimento.",
  cnh: "Extraia: nome completo, CPF, número de registro, categoria, data de validade, data de nascimento.",
  comprovante_endereco: "Extraia: CEP, logradouro, número, complemento, bairro, cidade, UF, nome do titular.",
  contrato_social: "Extraia: razão social, CNPJ, capital social, objeto social, lista de sócios com nome/CPF/participação, endereço da sede.",
  cartao_cnpj: "Extraia: CNPJ, razão social, nome fantasia, CNAE principal, CNAEs secundários, endereço completo, situação cadastral.",
};

serve(async (req) => {
  const { arquivo_base64, mime_type, tipo_documento } = await req.json();

  const prompt = `${INSTRUCOES[tipo_documento] || "Extraia todos os dados estruturados relevantes deste documento."}

Responda APENAS com JSON válido, sem markdown, sem explicação.
Use null para campos que não conseguir ler com confiança.
Adicione um campo "confianca" de 0 a 1 indicando quão legível está o documento.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: mime_type === "application/pdf" ? "document" : "image",
              source: { type: "base64", media_type: mime_type, data: arquivo_base64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  const data = await res.json();
  const texto = data.content?.[0]?.text || "{}";
  const limpo = texto.replace(/```json|```/g, "").trim();

  try {
    const extraido = JSON.parse(limpo);
    return Response.json({ ok: true, dados: extraido });
  } catch {
    return Response.json({ ok: false, erro: "Não foi possível ler o documento" });
  }
});
