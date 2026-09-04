import { createContext, useContext, useState, useCallback, useRef } from "react";
import { Tracked } from "../components/Tracked.jsx";

// Parte 0.5 da spec de fluxos: desfazer em vez de confirmar. A ação já
// aconteceu — isto só oferece a janela de reverter, sem travar o fluxo
// com uma pergunta antes de agir. Global (Provider) porque o Passo 3 pede
// pra substituir window.confirm em qualquer tela, não só numa.
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remover = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const avisar = useCallback(
    (texto, tipo = "ok") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, texto, tipo }]);
      timers.current[id] = setTimeout(() => remover(id), 4000);
    },
    [remover],
  );

  const comDesfazer = useCallback(
    (texto, aoDesfazer) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [
        ...t,
        {
          id,
          texto,
          tipo: "ok",
          desfazer: async () => {
            await aoDesfazer();
            remover(id);
          },
        },
      ]);
      timers.current[id] = setTimeout(() => remover(id), 10000);
    },
    [remover],
  );

  return (
    <ToastCtx.Provider value={{ avisar, comDesfazer }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1300,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "min(420px, calc(100vw - 32px))",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: "#101828",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: 9,
              fontSize: 13.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              boxShadow: "0 8px 24px rgba(16,24,40,.24)",
            }}
          >
            <span>
              {t.tipo === "ok" ? "✓ " : ""}
              {t.texto}
            </span>
            {t.desfazer && (
              <Tracked
                as="div"
                tag="toast_desfazer"
                onClick={t.desfazer}
                style={{ color: "#7CC4FF", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Desfazer
              </Tracked>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
