import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { PROPOSTAS, PROCESSOS } from "../data/mock.js";
import { USUARIOS } from "../data/usuarios.js";
import { Page, Card, SectionTitle, PrimaryButton, SecondaryButton, Field, inputStyle } from "../components/ui.jsx";
import { TrackedInput } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";
import { downloadJson } from "../lib/export.js";

export default function Lgpd() {
  const { escritorio, cliente, catalogo } = useApp();
  const [clienteAlvo, setClienteAlvo] = useState(cliente.nome);
  const [anonimizado, setAnonimizado] = useState(false);

  const exportarEscritorio = () => {
    const payload = { escritorio, usuarios: USUARIOS, servicos: catalogo.servicos, propostas: PROPOSTAS, processos: PROCESSOS, exportado_em: new Date().toISOString() };
    downloadJson(`open-legaliza-export-${escritorio.id}`, payload);
    track("lgpd_export", { escopo: "escritorio" });
  };

  const exportarCliente = () => {
    const propostasDoCliente = PROPOSTAS.filter((p) => p.cliente.toLowerCase() === clienteAlvo.trim().toLowerCase());
    const payload = { cliente: clienteAlvo, propostas: propostasDoCliente, exportado_em: new Date().toISOString() };
    downloadJson(`open-legaliza-cliente-${clienteAlvo.replace(/\s+/g, "-").toLowerCase()}`, payload);
    track("lgpd_export", { escopo: "cliente", cliente: clienteAlvo });
  };

  const anonimizar = () => {
    if (!window.confirm(`Anonimizar os dados pessoais de "${clienteAlvo}"? Isso preserva o histórico financeiro mas remove nome, documento, e-mail e telefone. Não pode ser desfeito.`)) return;
    setAnonimizado(true);
    track("cliente_anonimizar", { cliente: clienteAlvo });
  };

  return (
    <Page style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <Card>
        <SectionTitle>Export completo do escritório</SectionTitle>
        <div style={{ fontSize: 12.5, color: "#6B7480", marginBottom: 14 }}>
          Baixa um JSON com todos os dados do escritório (usuários, catálogo, propostas, processos). Use para migração
          ou auditoria externa.
        </div>
        <PrimaryButton tag="lgpd_exportar_escritorio" onClick={exportarEscritorio}>
          Baixar export completo (.json)
        </PrimaryButton>
      </Card>

      <Card>
        <SectionTitle>Direito do titular — dados de um cliente específico</SectionTitle>
        <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
          <div style={{ flex: 1 }}>
            <Field label="Nome do cliente">
              <TrackedInput tag="lgpd_cliente_alvo" style={inputStyle} value={clienteAlvo} onChange={(e) => setClienteAlvo(e.target.value)} />
            </Field>
          </div>
          <SecondaryButton tag="lgpd_exportar_cliente" onClick={exportarCliente}>
            Exportar dados do cliente
          </SecondaryButton>
        </div>
      </Card>

      <Card>
        <SectionTitle>Anonimização (exclusão com preservação de histórico)</SectionTitle>
        <div style={{ fontSize: 12.5, color: "#6B7480", marginBottom: 14 }}>
          Remove nome, documento, e-mail, telefone e observações do cliente, mas preserva o histórico financeiro
          (propostas, cobranças) para fins contábeis/legais — o mínimo exigido mesmo após pedido de exclusão.
        </div>
        {anonimizado ? (
          <div style={{ fontSize: 12.5, color: "#1F6F4C", fontWeight: 500 }}>✓ Dados de "{clienteAlvo}" anonimizados.</div>
        ) : (
          <SecondaryButton tag="lgpd_anonimizar" onClick={anonimizar} style={{ borderColor: "#E3B0AB", color: "#A33F36" }}>
            Anonimizar dados de "{clienteAlvo}"
          </SecondaryButton>
        )}
      </Card>

      <div style={{ fontSize: 11.5, color: "#98A0AC" }}>
        Consentimento com termos de uso e política de privacidade é registrado no onboarding, com data e hora
        (ver Configurações → Onboarding).
      </div>
    </Page>
  );
}
