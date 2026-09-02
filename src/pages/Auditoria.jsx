import { useEffect, useState } from "react";
import { getAuditLog } from "../lib/analytics.js";
import { Page, Table, Th, Row, Badge, EmptyState } from "../components/ui.jsx";

const ACAO_COR = {
  criou: { bg: "#EAF6EE", fg: "#1F6F4C" },
  editou: { bg: "#EAF1FB", fg: "#0A4D9E" },
  deletou: { bg: "#FBEDEC", fg: "#A33F36" },
  enviou: { bg: "#FDF3E3", fg: "#8A5A0B" },
  aceitou: { bg: "#EAF6EE", fg: "#1F6F4C" },
};

const gridCols = "150px 110px 110px minmax(220px,1fr) 130px";

export default function Auditoria() {
  const [log, setLog] = useState([]);

  useEffect(() => {
    setLog(getAuditLog());
    const id = setInterval(() => setLog(getAuditLog()), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <Page>
      <div style={{ fontSize: 12.5, color: "#8A929E", marginBottom: 14 }}>
        Toda ação relevante do escritório (proposta aceita, etapa concluída, usuário desativado, dados exportados...)
        fica registrada aqui — em serviço jurídico isso não é opcional. Nesta demo, a trilha vive no navegador; em
        produção seria a tabela <code>auditoria</code> do Postgres.
      </div>

      {log.length === 0 ? (
        <EmptyState title="Nenhuma ação registrada ainda" hint="Interaja com o sistema — aceite uma proposta, marque uma etapa — e volte aqui." />
      ) : (
        <>
          <Table cols={gridCols}>
            <Th>Quando</Th>
            <Th>Entidade</Th>
            <Th>Ação</Th>
            <Th>Evento</Th>
            <Th>Usuário</Th>
          </Table>
          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderTop: "none", borderRadius: "0 0 9px 9px", overflow: "hidden" }}>
            {log.map((entry) => {
              const cor = ACAO_COR[entry.acao] ?? { bg: "#F1F3F6", fg: "#5C6675" };
              return (
                <Row key={entry.id} cols={gridCols}>
                  <div style={{ fontSize: 12, color: "#8A929E", fontVariantNumeric: "tabular-nums" }}>
                    {new Date(entry.criado_em).toLocaleString("pt-BR")}
                  </div>
                  <div style={{ fontSize: 12.5, textTransform: "capitalize" }}>{entry.entidade}</div>
                  <div>
                    <Badge bg={cor.bg} fg={cor.fg}>
                      {entry.acao}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7480", fontFamily: "monospace" }}>{entry.evento}</div>
                  <div style={{ fontSize: 12.5 }}>{entry.usuario}</div>
                </Row>
              );
            })}
          </div>
        </>
      )}
    </Page>
  );
}
