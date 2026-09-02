import { useApp } from "../context/AppContext.jsx";
import { Tracked, TrackedInput } from "../components/Tracked.jsx";
import { brl } from "../data/mock.js";

const NOVO_NUMERO = "#0149";
const TOKEN = "a7f3c1e908d2b45f";
const VALIDADE = "15 set 2026";

export default function PropostaPublica() {
  const { escritorio, linhas, total, parcelasNum, cliente, aceiteNome, setAceiteNome, aceito, aceitarProposta, assinaturas } = useApp();
  const assinatura = assinaturas[0];

  const parcelaTexto = parcelasNum > 1 ? `${parcelasNum}× de ${brl(total / parcelasNum)}` : "Pagamento à vista";

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#0E1420",
        padding: "32px 20px 48px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 12, color: "#78849A", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
        open-legaliza.app/p/{TOKEN}
      </div>
      <div style={{ width: 390, maxWidth: "100%", background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
        <div style={{ background: escritorio.corPrimaria, padding: 20, color: "#fff", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 5, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
              OL
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{escritorio.nome}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: ".06em", textTransform: "uppercase" }}>
              Proposta {NOVO_NUMERO}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{cliente.nome}</div>
          </div>
        </div>

        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {linhas.map((l) => (
            <div key={l.id} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, paddingBottom: 12, borderBottom: "1px solid #EEF0F3" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{l.servico.nome}</div>
                <div style={{ fontSize: 12, color: "#8A929E" }}>
                  {l.qtd > 1
                    ? `${l.qtd} × ${brl(l.servico.valor)}`
                    : l.servico.cobranca === "recorrente"
                      ? "mensalidade"
                      : "serviço completo"}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{brl(l.total)}</div>
            </div>
          ))}

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#6B7480" }}>Total</span>
            <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>{brl(total)}</span>
          </div>
          <div style={{ fontSize: 12.5, color: "#8A929E", fontVariantNumeric: "tabular-nums" }}>
            {parcelaTexto} · válida até {VALIDADE}
          </div>
        </div>

        {aceito ? (
          <div style={{ margin: "0 20px 20px 20px", border: "1px solid #CFE3D6", background: "#F4FAF6", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1F6F4C" }}>Proposta aceita</div>
            <div style={{ fontSize: 12.5, color: "#4B5563", lineHeight: 1.55 }}>
              Aceita por {aceiteNome || "—"} em 01/09/2026 às 14:32 · IP 177.42.19.208. Cobrança e processo já podem ser
              gerados.
            </div>
            {assinatura && (
              <div style={{ fontSize: 11, color: "#98A0AC", fontFamily: "monospace", wordBreak: "break-all", marginTop: 4 }}>
                SHA-256: {assinatura.hashDocumento}
              </div>
            )}
          </div>
        ) : (
          <div style={{ borderTop: "1px solid #EEF0F3", padding: "18px 20px 22px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12.5, color: "#6B7480" }}>Digite seu nome completo para aceitar digitalmente.</div>
            <TrackedInput
              tag="aceite_nome_input"
              className="ol-input"
              placeholder="Nome completo"
              style={{ padding: "12px 13px", border: "1px solid #DDE1E7", borderRadius: 8, outline: "none", fontSize: 14 }}
              value={aceiteNome}
              onChange={(e) => setAceiteNome(e.target.value)}
            />
            <Tracked
              as="div"
              tag="aceitar_proposta"
              className="ol-btn-primary"
              onClick={aceitarProposta}
              style={{ padding: 14, borderRadius: 8, background: escritorio.corPrimaria, color: "#fff", textAlign: "center", fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}
            >
              Aceitar proposta
            </Tracked>
            <div style={{ textAlign: "center", fontSize: 12, color: "#98A0AC" }}>O aceite registra nome, IP e data e hora.</div>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: "#78849A", textAlign: "center", maxWidth: 390, lineHeight: 1.6 }}>
        Sem login. O mesmo token abre depois o portal de acompanhamento do processo.
      </div>
    </div>
  );
}
