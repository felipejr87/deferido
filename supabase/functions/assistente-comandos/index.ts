// Edge Function: assistente-comandos (Nível 4 — linguagem natural via
// function calling)
//
// Implantada e conectada (ANTHROPIC_API_KEY configurada via `supabase
// secrets set`). O front (src/components/CommandBar.jsx) chama isto quando
// supabaseConectado; se a chamada falhar por qualquer motivo, cai pro
// parser local por regras (src/lib/comandos.js) — real, mas menos flexível.
// O card de confirmação é o mesmo nos dois casos.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TOOLS = [
  {
    name: "criar_lead",
    description: "Cria um lead novo a partir de descrição em linguagem natural.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string" },
        telefone: { type: "string" },
        email: { type: "string" },
        interesse: { type: "string" },
        servico_sugerido: { type: "string" },
        origem: { type: "string", enum: ["whatsapp", "instagram", "telefone", "indicacao", "site"] },
      },
      required: ["nome"],
    },
  },
  {
    name: "criar_proposta",
    description: "Cria proposta para um cliente ou lead.",
    input_schema: {
      type: "object",
      properties: {
        cliente_nome: { type: "string" },
        servicos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              servico_id: { type: "string", description: "uuid EXATO de um item do catálogo enviado no contexto — nunca invente, nunca copie de outro serviço. Omita se não achar nenhum correspondente." },
              nome: { type: "string" },
              valor: { type: "number" },
              quantidade: { type: "number" },
            },
            required: ["nome"],
          },
        },
        parcelas: { type: "number" },
        desconto: { type: "number" },
        observacoes: { type: "string" },
      },
      required: ["cliente_nome", "servicos"],
    },
  },
  {
    name: "atualizar_processo",
    description: "Atualiza status, protocolo ou etapa de um processo.",
    input_schema: {
      type: "object",
      properties: {
        processo_numero: { type: "number" },
        status: { type: "string" },
        protocolo: { type: "string" },
        orgao: { type: "string" },
        etapa_concluida: { type: "string" },
        observacao: { type: "string" },
      },
      required: ["processo_numero"],
    },
  },
  {
    name: "registrar_documento",
    description: "Marca documento como recebido em um processo.",
    input_schema: {
      type: "object",
      properties: {
        processo_numero: { type: "number" },
        documento_nome: { type: "string" },
      },
      required: ["processo_numero", "documento_nome"],
    },
  },
  {
    name: "buscar",
    description: "Busca clientes, processos, propostas ou leads.",
    input_schema: {
      type: "object",
      properties: {
        tipo: { type: "string", enum: ["cliente", "processo", "proposta", "lead"] },
        termo: { type: "string" },
      },
      required: ["tipo", "termo"],
    },
  },
];

// Ferramentas de escrita nunca executam direto — retornam a proposta de ação,
// o front mostra o card, o operador confirma (ou edita) antes de gravar.
const FERRAMENTAS_ESCRITA = ["criar_lead", "criar_proposta", "atualizar_processo", "registrar_documento"];

serve(async (req) => {
  const { comando, contexto } = await req.json();

  const systemPrompt = `Você é o assistente operacional de um escritório de legalização empresarial.
Transforma linguagem natural em registros estruturados no sistema.

CONTEXTO DO ESCRITÓRIO:
${JSON.stringify(contexto?.catalogoServicos ?? [])}
${JSON.stringify(contexto?.clientesRecentes ?? [])}
${JSON.stringify(contexto?.processosAbertos ?? [])}

REGRAS:
1. NUNCA invente dados. Se faltar informação essencial, pergunte.
2. Ao citar um serviço, use o valor do catálogo — não invente preço.
3. Ao criar proposta, preencha servico_id com o uuid EXATO do catálogo acima
   (campo "id" de cada item). Nunca invente um uuid, nunca reaproveite o uuid
   de outro serviço só porque o nome é parecido — se não achar correspondência
   clara, omita servico_id e deixe só o nome preenchido.
4. Ao citar um cliente, tente casar com os existentes antes de criar novo.
5. Se identificar atividade econômica, sugira o CNAE e avise se é permitido para MEI.
6. Toda ação de escrita passa por confirmação — descreva o que vai fazer.
7. Respostas curtas. Máximo 3 linhas.`;

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
      system: systemPrompt,
      tools: TOOLS,
      messages: [{ role: "user", content: comando }],
    }),
  });

  const data = await res.json();
  const toolUse = data.content?.find((c: any) => c.type === "tool_use");

  if (!toolUse) {
    const texto = data.content?.find((c: any) => c.type === "text")?.text ?? "Não entendi o comando.";
    return Response.json({ ok: true, tipo: "resposta", texto });
  }

  return Response.json({
    ok: true,
    tipo: "acao_proposta",
    ferramenta: toolUse.name,
    input: toolUse.input,
    requerConfirmacao: FERRAMENTAS_ESCRITA.includes(toolUse.name),
  });
});
