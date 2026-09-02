import { useState } from "react";
import { CURSO_MODULOS, MATRICULA_DEMO } from "../data/blocoB.js";
import { useApp } from "../context/AppContext.jsx";
import { Page, Card, SectionTitle, Badge } from "../components/ui.jsx";
import { Tracked } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";

const TIPO_LABEL = { video: "Vídeo", pdf: "PDF", link: "Link", texto: "Texto" };

export default function Cursos() {
  const { escritorio } = useApp();
  const [progresso, setProgresso] = useState(MATRICULA_DEMO.progresso);

  const totalAulas = CURSO_MODULOS.reduce((a, m) => a + m.aulas.length, 0);
  const concluidas = progresso.length;
  const percent = Math.round((concluidas / totalAulas) * 100);
  const certificadoLiberado = concluidas === totalAulas;

  const toggleAula = (id) => {
    setProgresso((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    track("aula_progresso_toggle", { aula_id: id });
  };

  const emitirCertificado = () => {
    track("curso_certificado_emitido", { cliente: MATRICULA_DEMO.cliente, curso: MATRICULA_DEMO.curso });
    window.print();
  };

  return (
    <Page style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{MATRICULA_DEMO.curso}</div>
            <div style={{ fontSize: 12.5, color: "#8A929E" }}>
              Matrícula de {MATRICULA_DEMO.cliente} · token {MATRICULA_DEMO.token}
            </div>
          </div>
          <Badge bg="#EAF1FB" fg="#0A4D9E">
            {percent}% concluído
          </Badge>
        </div>
        <div style={{ height: 4, borderRadius: 3, background: "#EDEFF3", overflow: "hidden", marginTop: 12 }}>
          <div style={{ height: "100%", background: escritorio.corPrimaria, width: `${percent}%` }} />
        </div>
      </Card>

      {CURSO_MODULOS.map((m) => (
        <Card key={m.id}>
          <SectionTitle>{m.titulo}</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {m.aulas.map((a) => {
              const ok = progresso.includes(a.id);
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid #EEF0F3" }}>
                  <Tracked
                    as="div"
                    tag="aula_toggle"
                    data={{ aula_id: a.id }}
                    onClick={() => toggleAula(a.id)}
                    style={{
                      width: 20,
                      height: 20,
                      flex: "0 0 20px",
                      borderRadius: 5,
                      border: `1.5px solid ${ok ? "#1F6F4C" : "#DDE1E7"}`,
                      background: ok ? "#1F6F4C" : "#fff",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {ok ? "✓" : ""}
                  </Tracked>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontSize: 13.5, textDecoration: ok ? "line-through" : "none", color: ok ? "#6B7480" : "#14181F" }}>{a.titulo}</div>
                    <div style={{ fontSize: 11.5, color: "#98A0AC" }}>
                      {TIPO_LABEL[a.tipo]} · {a.duracaoMin} min
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Card style={{ textAlign: "center" }}>
        {certificadoLiberado ? (
          <Tracked as="div" tag="curso_emitir_certificado" onClick={emitirCertificado} className="ol-btn-primary" style={{ display: "inline-block", padding: "11px 22px", borderRadius: 7, background: escritorio.corPrimaria, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Emitir certificado de conclusão
          </Tracked>
        ) : (
          <div style={{ fontSize: 12.5, color: "#8A929E" }}>Conclua todas as aulas para liberar o certificado.</div>
        )}
      </Card>
    </Page>
  );
}
