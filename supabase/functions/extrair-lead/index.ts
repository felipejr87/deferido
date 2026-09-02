// Edge Function: extrair-lead (Nível 3 — extração de conversa via Claude)
//
// NÃO CONECTADA nesta demo — mesma dependência de ANTHROPIC_API_KEY do
// extrair-documento. O front (src/lib/extracaoLocal.js) usa um extrator
// local por regras (telefone, e-mail, palavra-chave de serviço) como
// substituto honesto: menos inteligente, mas real e sem custo de API.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { conversa } = await req.json();

  const prompt = `Extraia os dados de lead desta conversa de WhatsApp.

CONVERSA:
${conversa}

Responda APENAS com JSON:
{
  "nome": "nome da pessoa ou null",
  "telefone": "só números com DDD ou null",
  "email": "email ou null",
  "interesse": "resumo em 1 frase do que a pessoa quer",
  "servico_sugerido": "abertura_mei | abertura_ltda | alteracao | encerramento | alvara | contabilidade | outro",
  "urgencia": "alta | media | baixa",
  "observacoes": "detalhes relevantes: atividade pretendida, se já tem CNPJ, prazo, orçamento mencionado",
  "proximo_passo": "sugestão do que fazer agora"
}

Não invente dados que não estão na conversa. Use null.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const texto = data.content?.[0]?.text || "{}";
  const limpo = texto.replace(/```json|```/g, "").trim();

  try {
    return Response.json({ ok: true, dados: JSON.parse(limpo) });
  } catch {
    return Response.json({ ok: false, erro: "Não foi possível extrair dados da conversa" });
  }
});
