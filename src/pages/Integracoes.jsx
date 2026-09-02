import { useState } from "react";
import { Page, Card, SectionTitle, Field, inputStyle, PrimaryButton, Badge } from "../components/ui.jsx";
import { TrackedInput } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";

export default function Integracoes() {
  const [asaasKey, setAsaasKey] = useState("");
  const [zapiToken, setZapiToken] = useState("");
  const [zapiInstancia, setZapiInstancia] = useState("");
  const [salvo, setSalvo] = useState(false);

  const salvar = () => {
    setSalvo(true);
    track("integracoes_salvar", { asaas: Boolean(asaasKey), whatsapp: Boolean(zapiToken) });
  };

  return (
    <Page style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <Card>
        <SectionTitle action={<Badge bg="#EAF6EE" fg="#1F6F4C">real, sem chave</Badge>}>Consulta de CNPJ e CEP</SectionTitle>
        <div style={{ fontSize: 12.5, color: "#6B7480" }}>
          BrasilAPI (CNPJ) e ViaCEP (endereço) — únicas integrações desta demo conectadas de verdade a um serviço
          externo, porque são APIs públicas sem autenticação. Usadas em Nova proposta e no Onboarding.
        </div>
      </Card>

      <Card>
        <SectionTitle action={<Badge bg="#F1F3F6" fg="#5C6675">não conectado</Badge>}>Asaas (pagamento)</SectionTitle>
        <Field label="Chave de API" hint="Boleto, Pix, cartão e recorrência. Salva apenas localmente nesta demo.">
          <TrackedInput tag="integracoes_asaas_key" style={inputStyle} value={asaasKey} onChange={(e) => setAsaasKey(e.target.value)} placeholder="$aact_..." />
        </Field>
      </Card>

      <Card>
        <SectionTitle action={<Badge bg="#F1F3F6" fg="#5C6675">não conectado</Badge>}>WhatsApp (Z-API / Evolution API)</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Instância">
            <TrackedInput tag="integracoes_zapi_instancia" style={inputStyle} value={zapiInstancia} onChange={(e) => setZapiInstancia(e.target.value)} />
          </Field>
          <Field label="Token">
            <TrackedInput tag="integracoes_zapi_token" style={inputStyle} value={zapiToken} onChange={(e) => setZapiToken(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card style={{ borderColor: "#F0DFC0", background: "#FDF9F1" }}>
        <SectionTitle>Certificado digital A1 dos clientes</SectionTitle>
        <div style={{ fontSize: 12.5, color: "#8A5A0B" }}>
          Não implementado por decisão de escopo — a própria spec pede avaliar o risco antes de guardar certificado de
          cliente no sistema. Se decidir seguir, precisa de criptografia em repouso, KMS dedicado e política de acesso
          restrita, não só uma tabela a mais.
        </div>
      </Card>

      <PrimaryButton tag="integracoes_salvar" onClick={salvar}>
        {salvo ? "Salvo" : "Salvar configurações"}
      </PrimaryButton>
    </Page>
  );
}
