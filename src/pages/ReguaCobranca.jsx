import { useState } from "react";
import { REGUA_COBRANCA } from "../data/blocoC.js";
import { useApp } from "../context/AppContext.jsx";
import { Page, Card } from "../components/ui.jsx";
import { Tracked } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";

export default function ReguaCobranca() {
  const { escritorio } = useApp();
  const [passos, setPassos] = useState(REGUA_COBRANCA);

  const toggle = (idx) => {
    setPassos((prev) => prev.map((p, i) => (i === idx ? { ...p, ativo: !p.ativo } : p)));
    track("regua_cobranca_toggle", { passo: passos[idx].dia });
  };

  return (
    <Page style={{ maxWidth: 620 }}>
      <div style={{ fontSize: 12.5, color: "#8A929E", marginBottom: 20 }}>
        Sequência automática para inadimplência. Os passos marcados como "manual" nunca disparam sozinhos — ficam como
        lembrete para o escritório agir.
      </div>
      <div style={{ position: "relative", paddingLeft: 24 }}>
        <div style={{ position: "absolute", left: 8, top: 6, bottom: 6, width: 2, background: "#E4E7EC" }} />
        {passos.map((p, idx) => (
          <div key={p.dia} style={{ position: "relative", marginBottom: 16 }}>
            <div
              style={{
                position: "absolute",
                left: -24,
                top: 4,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: p.ativo ? escritorio.corPrimaria : "#DDE1E7",
              }}
            />
            <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {p.dia} — {p.tom}
                </div>
                <div style={{ fontSize: 12, color: "#8A929E" }}>{p.manual ? "Ação manual (protesto/negativação)" : `Canal: ${p.canal}`}</div>
              </div>
              {!p.manual && (
                <Tracked as="div" tag="regua_toggle" data={{ dia: p.dia }} onClick={() => toggle(idx)} style={{ fontSize: 12, color: p.ativo ? "#A33F36" : "#1F6F4C", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {p.ativo ? "desligar" : "ligar"}
                </Tracked>
              )}
            </Card>
          </div>
        ))}
      </div>
    </Page>
  );
}
