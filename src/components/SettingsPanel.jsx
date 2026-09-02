import { useState } from "react";
import { Settings, X } from "lucide-react";
import { useFeatures } from "../context/FeatureContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { Tracked, TrackedInput } from "./Tracked.jsx";

const FLAG_GROUPS = {
  "Fase 1 — Propostas": {
    fase1_propostas: "Propostas",
    fase1_pdf_proposta: "Baixar PDF",
    fase1_whatsapp_share: "Enviar por WhatsApp",
    fase1_mostrar_margem: "Mostrar margem estimada",
  },
  "Fase 2 — Processos": {
    fase2_processos: "Processos e portal do cliente",
    fase2_alerta_parado: "Alerta de processo parado",
  },
  "Fase 3-4 (fora de escopo)": {
    fase3_funil_leads: "Funil de leads",
    fase4_financeiro: "Financeiro",
  },
  "Bloco A — Fundação": {
    a_auth: "Autenticação (login)",
    a_onboarding: "Onboarding do escritório",
    a_usuarios: "Usuários e papéis",
    a_auditoria: "Auditoria",
    a_lgpd: "LGPD",
  },
  "Bloco B — Módulos de negócio": {
    b_documentos: "Documentos e arquivos",
    b_assinatura: "Assinatura eletrônica",
    b_cursos: "Cursos",
    b_obrigacoes: "Obrigações contábeis",
    b_juridico: "Modelos jurídicos",
    b_portal_expandido: "Portal do cliente expandido",
  },
  "Bloco C — Comunicação": {
    c_notificacoes: "Notificações",
    c_templates: "Templates de mensagem",
    c_regua_cobranca: "Régua de cobrança",
  },
  "Bloco D — Inteligência": {
    d_dashboard: "Dashboard",
    d_relatorios: "Relatórios",
  },
  "Bloco E — Integrações": {
    e_cnpj_lookup: "Busca de CNPJ (real, BrasilAPI)",
    e_cep_lookup: "Busca de CEP (real, ViaCEP)",
    e_cnae_busca: "Consulta de CNAE",
    e_integracoes_config: "Config. Asaas/WhatsApp",
  },
  "Bloco F — SaaS": {
    f_super_admin: "Painel super admin",
    f_planos: "Página de planos",
  },
  "Captura inteligente": {
    captura_cnpj_avancado: "CNPJ avançado (sócios, regime) — real",
    captura_cnae_sugestao: "Sugestão de CNAE por atividade — real",
    captura_ocr: "OCR de documentos — requer backend",
    captura_conversa: "Importar conversa (WhatsApp) — regras locais",
    captura_comando_natural: "Barra de comando (Cmd+K) — regras locais",
    captura_voz: "Entrada por voz — real (Web Speech API)",
  },
};

const CORES = ["#0A4D9E", "#123A5C", "#1F6F5C", "#2E2A26"];

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const { flags, toggle } = useFeatures();
  const { escritorio, setEscritorio } = useApp();

  return (
    <>
      <Tracked
        as="button"
        tag="settings_panel_toggle"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "#0E1420",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 20px rgba(0,0,0,.25)",
          zIndex: 1000,
        }}
        title="Configurações do escritório e feature toggles"
      >
        <Settings size={18} />
      </Tracked>

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 76,
            right: 20,
            left: 20,
            marginLeft: "auto",
            width: 320,
            maxWidth: "calc(100vw - 40px)",
            maxHeight: "70vh",
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #E4E7EC",
            borderRadius: 12,
            boxShadow: "0 12px 34px rgba(0,0,0,.18)",
            zIndex: 1000,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            fontSize: 13,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 600 }}>Escritório (white-label)</div>
            <Tracked as="div" tag="settings_panel_close" onClick={() => setOpen(false)} style={{ cursor: "pointer", color: "#8A929E" }}>
              <X size={16} />
            </Tracked>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#6B7480", textTransform: "uppercase", letterSpacing: ".03em" }}>Nome do escritório</span>
            <TrackedInput
              tag="settings_nome_escritorio"
              value={escritorio.nome}
              onChange={(e) => setEscritorio((s) => ({ ...s, nome: e.target.value }))}
              style={{ padding: "8px 10px", border: "1px solid #DDE1E7", borderRadius: 6 }}
            />
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#6B7480", textTransform: "uppercase", letterSpacing: ".03em" }}>Cor primária</span>
            <div style={{ display: "flex", gap: 8 }}>
              {CORES.map((c) => (
                <Tracked
                  key={c}
                  as="div"
                  tag="settings_cor_primaria"
                  data={{ cor: c }}
                  onClick={() => setEscritorio((s) => ({ ...s, corPrimaria: c }))}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: c,
                    cursor: "pointer",
                    border: escritorio.corPrimaria === c ? "2px solid #14181F" : "2px solid transparent",
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid #EEF0F3", paddingTop: 12, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontWeight: 600 }}>Feature toggles</div>
            {Object.entries(FLAG_GROUPS).map(([grupo, items]) => (
              <div key={grupo} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 10.5, color: "#8A929E", letterSpacing: ".04em", textTransform: "uppercase" }}>{grupo}</div>
                {Object.entries(items).map(([name, label]) => (
                  <label key={name} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input type="checkbox" data-track={`flag_${name}`} checked={Boolean(flags[name])} onChange={() => toggle(name)} />
                    <span style={{ color: "#3C4453" }}>{label}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
