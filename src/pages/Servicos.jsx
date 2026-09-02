import { useEffect, useState } from "react";
import { CATS, brl } from "../data/mock.js";
import { buscarServicosReais } from "../lib/data.js";
import { Badge } from "../components/ui.jsx";

const gridCols = "minmax(220px,1.7fr) 112px 96px 112px 122px 104px";

export default function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [real, setReal] = useState(false);

  useEffect(() => {
    buscarServicosReais().then((res) => {
      setServicos(res.dados);
      setReal(res.ok);
    });
  }, []);

  return (
    <div className="ol-page">
      <div style={{ marginBottom: 14 }}>
        <Badge bg={real ? "#EAF6EE" : "#F1F3F6"} fg={real ? "#1F6F4C" : "#5C6675"}>
          {real ? "dados do Postgres" : "dados de exemplo (offline)"}
        </Badge>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            gap: 12,
            padding: "11px 18px",
            background: "#FAFBFC",
            borderBottom: "1px solid #E4E7EC",
            fontSize: 11,
            color: "#8A929E",
            letterSpacing: ".05em",
            textTransform: "uppercase",
          }}
        >
          <div>Serviço</div>
          <div>Categoria</div>
          <div>Cobrança</div>
          <div style={{ textAlign: "right" }}>Valor</div>
          <div style={{ textAlign: "right" }}>Custo terceiros</div>
          <div style={{ textAlign: "right" }}>Margem</div>
        </div>

        {servicos.map((s) => {
          const margemValor = s.valor - s.custo;
          const margemCor = margemValor / s.valor < 0.5 ? "#A33F36" : "#1F6F4C";
          return (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                gap: 12,
                padding: "14px 18px",
                borderBottom: "1px solid #EEF0F3",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontWeight: 500 }}>{s.nome}</div>
                <div style={{ fontSize: 12, color: "#8A929E" }}>{s.etapas}</div>
              </div>
              <div style={{ fontSize: 12.5, color: "#4B5563" }}>{CATS[s.cat]}</div>
              <div style={{ fontSize: 12.5, color: "#4B5563" }}>{s.cobranca === "recorrente" ? "Mensal" : "Pontual"}</div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                {s.cobranca === "recorrente" ? `${brl(s.valor)}/mês` : brl(s.valor)}
              </div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#6B7480" }}>
                {s.custo ? brl(s.custo) : "—"}
              </div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: margemCor }}>
                {brl(margemValor)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, fontSize: 12.5, color: "#8A929E" }}>
        Etapas e documentos exigidos são configurados por serviço e viram o checklist de todo processo novo desse tipo.
      </div>
    </div>
  );
}
