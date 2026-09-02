// Edge Function: consultar-cnpj
// Proxy fino sobre a BrasilAPI. Não exige segredo — o front desta demo já
// chama a BrasilAPI direto do navegador (src/lib/integracoes.js). Só faz
// sentido publicar esta function se quiser cachear respostas ou logar
// consultas por escritorio_id no backend.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { cnpj } = await req.json();
  const limpo = String(cnpj || "").replace(/\D/g, "");

  if (limpo.length !== 14) {
    return Response.json({ ok: false, erro: "CNPJ inválido" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`);
    if (!res.ok) {
      const corpo = await res.text().catch(() => "");
      return Response.json({ ok: false, erro: `BrasilAPI status ${res.status}: ${corpo.slice(0, 200)}` }, { status: res.status === 404 ? 404 : 502 });
    }
    const d = await res.json();

    return Response.json({
      ok: true,
      dados: {
        tipo: "pj",
        nome: d.razao_social,
        nome_fantasia: d.nome_fantasia,
        documento: limpo,
        email: d.email,
        telefone: d.ddd_telefone_1,
        endereco: {
          cep: d.cep,
          logradouro: d.logradouro,
          numero: d.numero,
          complemento: d.complemento,
          bairro: d.bairro,
          cidade: d.municipio,
          uf: d.uf,
        },
        socios: (d.qsa || []).map((s: any) => ({
          nome: s.nome_socio,
          qualificacao: s.qualificacao_socio,
          entrada: s.data_entrada_sociedade,
        })),
        cnae_principal: d.cnae_fiscal
          ? { codigo: String(d.cnae_fiscal), descricao: d.cnae_fiscal_descricao }
          : null,
        cnaes_secundarios: (d.cnaes_secundarios || []).map((c: any) => ({
          codigo: String(c.codigo),
          descricao: c.descricao,
        })),
        situacao: d.descricao_situacao_cadastral,
        data_abertura: d.data_inicio_atividade,
        capital_social: d.capital_social,
        porte: d.porte,
        regime_provavel: inferirRegime(d),
      },
    });
  } catch (e: any) {
    return Response.json({ ok: false, erro: e.message }, { status: 500 });
  }
});

function inferirRegime(d: any): string {
  if (d.opcao_pelo_mei) return "mei";
  if (d.opcao_pelo_simples) return "simples";
  if (Number(d.capital_social) > 4800000) return "presumido_ou_real";
  return "a_definir";
}
