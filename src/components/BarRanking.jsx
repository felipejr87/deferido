// Bar horizontal de magnitude (ranking), hue único sequencial — ver skill
// dataviz: forma = magnitude → um hue, sem legenda (série única), rótulo de
// valor na ponta, barra fina com ponta arredondada, eixo único.
const HUE_STEP = "#2A78D6"; // sequential/450 do palette.md, próximo do azul da marca

export default function BarRanking({ data, formatValue, title }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      {title && <div style={{ fontSize: 11, color: "#898781", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 14 }}>{title}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.map((d) => {
          const pct = Math.max((d.value / max) * 100, 3);
          return (
            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 150, flex: "0 0 150px", fontSize: 12.5, color: "#3C4453", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {d.label}
              </div>
              <div style={{ flex: 1, position: "relative", height: 16, background: "#F2F3F5", borderRadius: 4 }}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    background: HUE_STEP,
                    borderRadius: 4,
                  }}
                />
              </div>
              <div style={{ width: 90, flex: "0 0 90px", fontSize: 12.5, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {formatValue ? formatValue(d.value) : d.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
