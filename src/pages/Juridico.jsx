import { useState } from "react";
import { MODELOS_DOCUMENTO } from "../data/blocoB.js";
import { useApp } from "../context/AppContext.jsx";
import { Page, Card, SectionTitle, PrimaryButton, SecondaryButton, Field, inputStyle } from "../components/ui.jsx";
import { Tracked, TrackedInput } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";

const CATEGORIA_LABEL = {
  prestacao_servico: "Prestação de serviços",
  contrato_social: "Contrato social",
  distrato: "Distrato",
  procuracao: "Procuração",
  nda: "Confidencialidade (NDA)",
};

function preencherTemplate(conteudo, valores, escritorioNome) {
  let out = conteudo.replace(/\{\{escritorio_nome\}\}/g, escritorioNome);
  for (const [k, v] of Object.entries(valores)) {
    out = out.replaceAll(`{{${k}}}`, v || `{{${k}}}`);
  }
  return out;
}

export default function Juridico() {
  const { escritorio } = useApp();
  const [selecionado, setSelecionado] = useState(null);
  const [valores, setValores] = useState({});
  const [gerado, setGerado] = useState(null);

  const abrirModelo = (m) => {
    setSelecionado(m);
    setValores({});
    setGerado(null);
    track("juridico_abrir_modelo", { modelo_id: m.id });
  };

  const gerar = () => {
    const conteudoFinal = preencherTemplate(selecionado.conteudo, valores, escritorio.nome);
    setGerado(conteudoFinal);
    track("documento_gerar", { modelo_id: selecionado.id, categoria: selecionado.categoria });
  };

  const baixarPdf = () => {
    track("juridico_baixar_pdf", { modelo_id: selecionado.id });
    window.print();
  };

  if (selecionado) {
    return (
      <Page style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
        <Tracked as="div" tag="juridico_voltar" onClick={() => setSelecionado(null)} style={{ fontSize: 12.5, color: "#0A4D9E", cursor: "pointer" }}>
          ← Voltar aos modelos
        </Tracked>

        <Card>
          <SectionTitle>{selecionado.nome}</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {selecionado.variaveis.map((v) => (
              <Field key={v} label={v.replace(/_/g, " ")}>
                <TrackedInput
                  tag={`juridico_variavel_${v}`}
                  style={inputStyle}
                  value={valores[v] || ""}
                  onChange={(e) => setValores((s) => ({ ...s, [v]: e.target.value }))}
                />
              </Field>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <PrimaryButton tag="juridico_gerar" onClick={gerar}>
              Gerar documento
            </PrimaryButton>
          </div>
        </Card>

        {gerado && (
          <Card>
            <SectionTitle action={<SecondaryButton tag="juridico_baixar" onClick={baixarPdf}>Baixar PDF</SecondaryButton>}>
              Pré-visualização
            </SectionTitle>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, lineHeight: 1.6, background: "#F7F8FA", borderRadius: 8, padding: 16 }}>
              {gerado}
            </pre>
          </Card>
        )}
      </Page>
    );
  }

  return (
    <Page>
      <div style={{ fontSize: 12.5, color: "#8A929E", marginBottom: 16 }}>
        Biblioteca de modelos com campos preenchíveis. Escolha um modelo, preencha os dados do cliente e gere o
        documento — pronto para baixar como PDF.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {MODELOS_DOCUMENTO.map((m) => (
          <Tracked
            key={m.id}
            as="div"
            tag="juridico_selecionar_modelo"
            data={{ modelo_id: m.id }}
            className="ol-catalogo-card"
            onClick={() => abrirModelo(m)}
            style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: "14px 15px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6, background: "#fff" }}
          >
            <span style={{ fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: "#6B7480" }}>{CATEGORIA_LABEL[m.categoria]}</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{m.nome}</span>
            <span style={{ fontSize: 11.5, color: "#8A929E" }}>{m.variaveis.length} campos preenchíveis</span>
          </Tracked>
        ))}
      </div>
    </Page>
  );
}
