import { useMemo, useState } from "react";
import { CNAES } from "../data/cnae.js";
import { Page, Card, inputStyle, Badge } from "../components/ui.jsx";
import { TrackedInput } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";

export default function CnaeBusca() {
  const [busca, setBusca] = useState("");

  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return CNAES;
    return CNAES.filter((c) => c.codigo.includes(q) || c.descricao.toLowerCase().includes(q));
  }, [busca]);

  const onChange = (e) => {
    setBusca(e.target.value);
    if (e.target.value.length > 2) track("cnae_busca", { termo: e.target.value });
  };

  return (
    <Page style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 12.5, color: "#8A929E", marginBottom: 14 }}>
        Recorte curado dos CNAEs mais comuns entre clientes de legalização — não é a tabela completa do IBGE. Alerta em
        vermelho evita o erro mais comum na abertura: CNAE incompatível com MEI.
      </div>
      <TrackedInput
        tag="cnae_busca_input"
        style={{ ...inputStyle, marginBottom: 16 }}
        placeholder="Buscar por código ou descrição… ex: restaurante, contabilidade, 5611"
        value={busca}
        onChange={onChange}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {resultados.map((c) => (
          <Card key={c.codigo} style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.descricao}</div>
                <div style={{ fontSize: 11.5, color: "#98A0AC", fontFamily: "monospace" }}>{c.codigo}</div>
              </div>
              {c.permitidoMei ? (
                <Badge bg="#EAF6EE" fg="#1F6F4C">
                  permitido MEI
                </Badge>
              ) : (
                <Badge bg="#FBEDEC" fg="#A33F36">
                  não permitido MEI
                </Badge>
              )}
            </div>
            {!c.permitidoMei && <div style={{ fontSize: 11.5, color: "#A33F36", marginTop: 6 }}>{c.motivo}</div>}
          </Card>
        ))}
        {resultados.length === 0 && <div style={{ fontSize: 12.5, color: "#98A0AC" }}>Nenhum CNAE encontrado nesse recorte.</div>}
      </div>
    </Page>
  );
}
