import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buscarProcessosReais } from "../lib/data.js";
import { useApp } from "../context/AppContext.jsx";
import { Tracked } from "../components/Tracked.jsx";
import { usePagination, Pagination, Badge, StatusBadge, EstadoVazio, Explicacao } from "../components/ui.jsx";

const gridCols = "70px minmax(200px,1.7fr) minmax(140px,1fr) 150px 96px 100px";

export default function Processos() {
  const navigate = useNavigate();
  const { escritorio } = useApp();
  const [processos, setProcessos] = useState([]);
  const [real, setReal] = useState(false);
  const { page, totalPages, setPage, pageItems } = usePagination(processos, 4);

  useEffect(() => {
    buscarProcessosReais().then((res) => {
      setProcessos(res.dados);
      setReal(res.ok);
    });
  }, []);

  return (
    <div className="ol-page">
      <Explicacao chave="processos">
        Cada serviço vendido vira um processo. Aqui você acompanha documentos, protocolo e prazo até o deferimento.
      </Explicacao>
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
          <div>Nº</div>
          <div>Cliente e serviço</div>
          <div>Status</div>
          <div>Etapas</div>
          <div>Resp.</div>
          <div>Prazo</div>
        </div>

        {processos.length === 0 && (
          <EstadoVazio
            titulo="Nenhum processo em andamento"
            explicacao="Processos nascem quando uma proposta é aceita. Você também pode criar direto."
            acoes={[
              { rotulo: "Ver propostas", tag: "processos_ver_propostas", onClick: () => navigate("/propostas") },
            ]}
          />
        )}
        {pageItems.map((p) => {
          const barra = Math.round((p.feitas / p.total) * 100) + "%";
          const alerta = p.parado >= 5 ? `parado há ${p.parado} dias` : "";
          return (
            <Tracked
              key={p.numero}
              as="div"
              tag="processo_abrir"
              data={{ numero: p.numero }}
              className="ol-row"
              onClick={() => navigate(`/processos/${p.numero.replace("#", "")}`)}
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                gap: 12,
                padding: "14px 18px",
                borderBottom: "1px solid #EEF0F3",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <div style={{ fontVariantNumeric: "tabular-nums", color: "#6B7480", fontSize: 13 }}>{p.numero}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <div style={{ fontWeight: 500 }}>{p.cliente}</div>
                <div style={{ fontSize: 12, color: "#8A929E" }}>
                  {p.servico} · {p.orgao}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                <StatusBadge entidade="processo" status={p.status} />
                {alerta && <span style={{ fontSize: 11, color: "#A33F36" }}>{alerta}</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ fontSize: 12, color: "#6B7480", fontVariantNumeric: "tabular-nums" }}>
                  {p.feitas} de {p.total} etapas
                </div>
                <div style={{ height: 4, borderRadius: 3, background: "#EDEFF3", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: escritorio.corPrimaria, width: barra }} />
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: "#4B5563" }}>{p.resp}</div>
              <div style={{ fontSize: 12.5, color: "#8A929E", fontVariantNumeric: "tabular-nums" }}>{p.prazo}</div>
            </Tracked>
          );
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      <div style={{ marginTop: 14, fontSize: 12.5, color: "#8A929E" }}>
        Processo sem movimentação há 5 dias ou mais entra em alerta na lista e no resumo do dono.
      </div>
    </div>
  );
}
