// Bloco E — únicas integrações desta entrega que batem em serviço externo de
// verdade: BrasilAPI (CNPJ) e ViaCEP (endereço). Ambas são APIs públicas sem
// autenticação, então dá para chamar direto do browser sem expor segredo
// nenhum. Asaas/WhatsApp/Resend ficam como configuração salva localmente
// (ver Integracoes.jsx) porque exigem credenciais que não temos nesta sessão.

import { track } from "./analytics.js";

// Nível 1 da spec de captura inteligente: chuta o regime tributário provável
// a partir do que a Receita já devolveu, para pré-selecionar no formulário
// (o operador confirma/ajusta — nunca é usado sem revisão).
function inferirRegime(d) {
  if (d.opcao_pelo_mei) return "mei";
  if (d.opcao_pelo_simples) return "simples";
  if (Number(d.capital_social) > 4800000) return "presumido_ou_real";
  return "a_definir";
}

export async function buscarCnpj(cnpjRaw) {
  const cnpj = String(cnpjRaw || "").replace(/\D/g, "");
  if (cnpj.length !== 14) {
    return { ok: false, error: "CNPJ precisa ter 14 dígitos." };
  }
  try {
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!resp.ok) {
      track("integracao_cnpj_erro", { cnpj, status: resp.status });
      return { ok: false, error: resp.status === 404 ? "CNPJ não encontrado." : "Falha ao consultar CNPJ." };
    }
    const data = await resp.json();
    track("integracao_cnpj_sucesso", { cnpj });
    return {
      ok: true,
      data: {
        razaoSocial: data.razao_social,
        nomeFantasia: data.nome_fantasia,
        cnaePrincipal: data.cnae_fiscal_descricao,
        cnaeCodigo: data.cnae_fiscal,
        cnaesSecundarios: (data.cnaes_secundarios || []).map((c) => ({ codigo: String(c.codigo), descricao: c.descricao })),
        situacao: data.descricao_situacao_cadastral,
        dataAbertura: data.data_inicio_atividade,
        capitalSocial: data.capital_social,
        porte: data.porte,
        regimeProvavel: inferirRegime(data),
        socios: (data.qsa || []).map((s) => ({ nome: s.nome_socio, qualificacao: s.qualificacao_socio, entrada: s.data_entrada_sociedade })),
        endereco: {
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          municipio: data.municipio,
          uf: data.uf,
          cep: data.cep,
        },
        telefone: data.ddd_telefone_1,
        email: data.email,
      },
    };
  } catch (err) {
    track("integracao_cnpj_erro", { cnpj, error: String(err) });
    return { ok: false, error: "Não foi possível conectar à BrasilAPI. Verifique sua internet." };
  }
}

export async function buscarCep(cepRaw) {
  const cep = String(cepRaw || "").replace(/\D/g, "");
  if (cep.length !== 8) {
    return { ok: false, error: "CEP precisa ter 8 dígitos." };
  }
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await resp.json();
    if (data.erro) {
      track("integracao_cep_erro", { cep, motivo: "nao_encontrado" });
      return { ok: false, error: "CEP não encontrado." };
    }
    track("integracao_cep_sucesso", { cep });
    return { ok: true, data };
  } catch (err) {
    track("integracao_cep_erro", { cep, error: String(err) });
    return { ok: false, error: "Não foi possível conectar ao ViaCEP. Verifique sua internet." };
  }
}
