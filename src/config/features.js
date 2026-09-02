// Feature toggles do Open Legaliza.
// Cada flag pode ser sobrescrita em runtime via localStorage (chave "ol:flags")
// ou via querystring (?flag=nome:0|1), sem precisar de rebuild — útil para
// ligar/desligar fases do produto (spec seção 3) por escritório/ambiente.

export const DEFAULT_FEATURES = {
  // Fase 1 — Propostas e contratos (prioridade máxima, sempre ativa)
  fase1_propostas: true,
  fase1_pdf_proposta: true,
  fase1_whatsapp_share: true,
  fase1_mostrar_margem: true,

  // Fase 2 — Acompanhamento de processos (habilitada por padrão nesta build
  // porque o layout aprovado já inclui as telas de processo e portal)
  fase2_processos: true,
  fase2_alerta_parado: true,

  // Fase 3 — Funil de leads (fora do escopo desta implementação)
  fase3_funil_leads: false,

  // Fase 4 — Financeiro (fora do escopo desta implementação)
  fase4_financeiro: false,

  // Bloco A — Fundação (spec complementar)
  a_auth: true,
  a_onboarding: true,
  a_usuarios: true,
  a_auditoria: true,
  a_lgpd: true,

  // Bloco B — Módulos de negócio
  b_documentos: true,
  b_assinatura: true,
  b_cursos: true,
  b_obrigacoes: true,
  b_juridico: true,
  b_portal_expandido: true,

  // Bloco C — Comunicação
  c_notificacoes: true,
  c_templates: true,
  c_regua_cobranca: true,

  // Bloco D — Inteligência
  d_dashboard: true,
  d_relatorios: true,

  // Bloco E — Integrações
  e_cnpj_lookup: true,
  e_cep_lookup: true,
  e_cnae_busca: true,
  e_integracoes_config: true,

  // Bloco F — SaaS (só relevante se decidir vender para outros escritórios)
  f_super_admin: false,
  f_planos: false,

  // Bloco G — Qualidade
  g_pwa: true,

  // Módulo de Captura Inteligente (spec complementar 3)
  captura_cnpj_avancado: true, // sócios, CNAEs secundários, regime provável — real, BrasilAPI
  captura_cnae_sugestao: true, // sugestão local por palavra-chave — real, sem IA
  captura_ocr: true, // upload + fluxo de confirmação — extração real requer ANTHROPIC_API_KEY (não conectada)
  captura_conversa: true, // extrator local por regras — real, sem IA
  captura_comando_natural: true, // parser local por regras — real, sem IA
  captura_voz: true, // Web Speech API — real, sem credencial
};

const STORAGE_KEY = "ol:flags";

function readOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function readQueryOverrides() {
  try {
    const params = new URLSearchParams(window.location.search);
    const out = {};
    for (const [key, value] of params.entries()) {
      if (key === "flag") {
        const [name, val] = value.split(":");
        if (name) out[name] = val !== "0" && val !== "false";
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function getFeatures() {
  return { ...DEFAULT_FEATURES, ...readOverrides(), ...readQueryOverrides() };
}

export function setFeature(name, value) {
  const overrides = readOverrides();
  overrides[name] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function resetFeatures() {
  localStorage.removeItem(STORAGE_KEY);
}
