import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { SERVICOS } from "../data/mock.js";
import { Tracked, TrackedInput } from "../components/Tracked.jsx";
import { Card, Field, inputStyle, PrimaryButton, SecondaryButton } from "../components/ui.jsx";
import { track } from "../lib/analytics.js";
import { buscarCep } from "../lib/integracoes.js";

const PASSOS = ["Dados do escritório", "Catálogo de serviços", "Dados do contrato", "Cobrança (Asaas)"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { escritorio, setEscritorio } = useApp();
  const [passo, setPasso] = useState(0);
  const [cep, setCep] = useState("");
  const [enderecoBusca, setEnderecoBusca] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [seedsAplicados, setSeedsAplicados] = useState(true);
  const [consentimento, setConsentimento] = useState(false);
  const [asaasKey, setAsaasKey] = useState("");

  const aplicarSeeds = () => {
    setSeedsAplicados(true);
    track("onboarding_seeds_catalogo", { total: SERVICOS.length });
  };

  const handleBuscarCep = async () => {
    setBuscandoCep(true);
    const res = await buscarCep(cep);
    setBuscandoCep(false);
    if (res.ok) setEnderecoBusca(res.data);
  };

  const finalizar = () => {
    track("onboarding_concluido", { escritorio_id: escritorio.id, seeds: seedsAplicados, asaas_configurado: Boolean(asaasKey) });
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F6F8", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px" }}>
      <div style={{ width: 620, maxWidth: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Bem-vindo ao Open Legaliza</div>
          <div style={{ fontSize: 13, color: "#6B7480" }}>Vamos configurar seu escritório em 4 passos.</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {PASSOS.map((p, i) => (
            <div key={p} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ height: 4, borderRadius: 3, background: i <= passo ? escritorio.corPrimaria : "#E4E7EC" }} />
              <div style={{ fontSize: 11, color: i === passo ? "#14181F" : "#98A0AC", fontWeight: i === passo ? 600 : 400 }}>{p}</div>
            </div>
          ))}
        </div>

        <Card style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {passo === 0 && (
            <>
              <Field label="Nome do escritório">
                <TrackedInput tag="onboarding_nome" style={inputStyle} value={escritorio.nome} onChange={(e) => setEscritorio((s) => ({ ...s, nome: e.target.value }))} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="CNPJ">
                  <TrackedInput tag="onboarding_cnpj" style={inputStyle} placeholder="00.000.000/0001-00" />
                </Field>
                <Field label="Cor primária (contratos e propostas)">
                  <div style={{ display: "flex", gap: 8 }}>
                    {["#0A4D9E", "#123A5C", "#1F6F5C", "#2E2A26"].map((c) => (
                      <Tracked
                        key={c}
                        as="div"
                        tag="onboarding_cor"
                        onClick={() => setEscritorio((s) => ({ ...s, corPrimaria: c }))}
                        style={{ width: 26, height: 26, borderRadius: 6, background: c, cursor: "pointer", border: escritorio.corPrimaria === c ? "2px solid #14181F" : "2px solid transparent" }}
                      />
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="CEP" hint="busca real via ViaCEP">
                <div style={{ display: "flex", gap: 8 }}>
                  <TrackedInput tag="onboarding_cep" style={inputStyle} value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" />
                  <SecondaryButton tag="onboarding_buscar_cep" onClick={handleBuscarCep} style={{ whiteSpace: "nowrap" }}>
                    {buscandoCep ? "Buscando…" : "Buscar CEP"}
                  </SecondaryButton>
                </div>
              </Field>
              {enderecoBusca && (
                <div style={{ fontSize: 12.5, color: "#3C4453", background: "#F7F8FA", borderRadius: 8, padding: 10 }}>
                  {enderecoBusca.logradouro}, {enderecoBusca.bairro} — {enderecoBusca.localidade}/{enderecoBusca.uf}
                </div>
              )}
            </>
          )}

          {passo === 1 && (
            <>
              <div style={{ fontSize: 13, color: "#6B7480" }}>
                {SERVICOS.length} serviços típicos do setor já vêm prontos com etapas e documentos configurados — você só ajusta valores depois em Catálogo de serviços.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8 }}>
                {SERVICOS.map((s) => (
                  <div key={s.id} style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: "9px 11px", fontSize: 12.5 }}>
                    {s.nome}
                  </div>
                ))}
              </div>
              {seedsAplicados ? (
                <div style={{ fontSize: 12.5, color: "#1F6F4C", fontWeight: 500 }}>✓ Catálogo padrão aplicado</div>
              ) : (
                <PrimaryButton tag="onboarding_aplicar_seeds" onClick={aplicarSeeds}>
                  Usar catálogo padrão
                </PrimaryButton>
              )}
            </>
          )}

          {passo === 2 && (
            <>
              <Field label="Razão social">
                <TrackedInput tag="onboarding_razao_social" style={inputStyle} placeholder="Open Legaliza Corporate Services LTDA" />
              </Field>
              <Field label="Responsável legal">
                <TrackedInput tag="onboarding_responsavel" style={inputStyle} placeholder="Nome completo" />
              </Field>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#3C4453" }}>
                <input
                  type="checkbox"
                  data-track="onboarding_consentimento"
                  checked={consentimento}
                  onChange={(e) => {
                    setConsentimento(e.target.checked);
                    track("onboarding_consentimento", { aceito: e.target.checked });
                  }}
                  style={{ marginTop: 2 }}
                />
                <span>
                  Li e aceito os termos de uso e a política de privacidade. Este consentimento fica registrado com data e hora
                  (LGPD).
                </span>
              </label>
            </>
          )}

          {passo === 3 && (
            <>
              <Field label="Chave de API do Asaas" hint="não conectada nesta demo — fica salva apenas localmente">
                <TrackedInput tag="onboarding_asaas_key" style={inputStyle} value={asaasKey} onChange={(e) => setAsaasKey(e.target.value)} placeholder="$aact_..." />
              </Field>
              <div style={{ fontSize: 12.5, color: "#8A929E" }}>
                Você pode pular esta etapa e configurar depois em Configurações → Integrações.
              </div>
            </>
          )}
        </Card>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <SecondaryButton tag="onboarding_voltar" onClick={() => setPasso((p) => Math.max(0, p - 1))} style={{ visibility: passo === 0 ? "hidden" : "visible" }}>
            Voltar
          </SecondaryButton>
          {passo < PASSOS.length - 1 ? (
            <PrimaryButton
              tag="onboarding_avancar"
              onClick={() => {
                if (passo === 2 && !consentimento) return;
                setPasso((p) => p + 1);
              }}
              style={passo === 2 && !consentimento ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
            >
              Avançar
            </PrimaryButton>
          ) : (
            <PrimaryButton tag="onboarding_finalizar" onClick={finalizar}>
              Concluir e entrar no sistema
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
