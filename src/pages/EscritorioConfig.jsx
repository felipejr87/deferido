import { useState } from "react";
import { Page, Card, Field, inputStyle, PrimaryButton } from "../components/ui.jsx";
import { TrackedInput, Tracked } from "../components/Tracked.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { track } from "../lib/analytics.js";

const CORES = ["#0A4D9E", "#123A5C", "#1F6F5C", "#2E2A26"];
const CHAVE_ONBOARDING = "guia_passo_escritorio";

// Simplificação radical de navegação (Passo 2): nome/cor do escritório
// eram só editáveis no painel de dev (SettingsPanel) — agora que ele some
// da produção (Passo 4), isso precisa de um lugar de verdade pro usuário.
export default function EscritorioConfig() {
  const { escritorio, setEscritorio } = useApp();
  const { avisar } = useToast();
  const [nome, setNome] = useState(escritorio.nome);

  const salvar = () => {
    setEscritorio((s) => ({ ...s, nome }));
    try {
      localStorage.setItem(CHAVE_ONBOARDING, "1");
    } catch {
      // ignora — só afeta o guia de primeiro acesso
    }
    track("escritorio_config_salvar", { nome });
    avisar("Dados do escritório salvos.");
  };

  return (
    <Page style={{ maxWidth: 480 }}>
      <Card style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Nome do escritório" hint="aparece no topo do menu e nas propostas enviadas ao cliente">
          <TrackedInput tag="escritorio_nome" style={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} />
        </Field>

        <div>
          <span style={{ fontSize: 11.5, color: "#6B7480", letterSpacing: ".03em", textTransform: "uppercase" }}>Cor primária</span>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {CORES.map((c) => (
              <Tracked
                key={c}
                as="div"
                tag="escritorio_cor"
                data={{ cor: c }}
                onClick={() => setEscritorio((s) => ({ ...s, corPrimaria: c }))}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  background: c,
                  cursor: "pointer",
                  border: escritorio.corPrimaria === c ? "2px solid #14181F" : "2px solid transparent",
                }}
              />
            ))}
          </div>
        </div>

        <PrimaryButton tag="escritorio_salvar" onClick={salvar} style={{ alignSelf: "flex-start" }}>
          Salvar
        </PrimaryButton>
      </Card>
    </Page>
  );
}
