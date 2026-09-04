import { useEffect, useState } from "react";
import { Tracked } from "./Tracked.jsx";

// Parte 0.5 da spec de fluxos: desfazer em vez de confirmar. A ação já
// aconteceu (o chamador já gravou no banco) — isto só mostra a janela de
// 10s pra reverter, sem travar o fluxo com uma pergunta antes.
export function useToast() {
  const [toast, setToast] = useState(null);
  const mostrar = ({ texto, aoDesfazer }) => setToast({ texto, aoDesfazer, id: Date.now() });
  return { toast, mostrar, fechar: () => setToast(null) };
}

export default function Toast({ toast, onFechar }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onFechar, 10000);
    return () => clearTimeout(t);
  }, [toast, onFechar]);

  if (!toast) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        background: "#14181F",
        color: "#fff",
        borderRadius: 10,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontSize: 13,
        boxShadow: "0 12px 30px rgba(0,0,0,.3)",
        zIndex: 1300,
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <span>{toast.texto}</span>
      {toast.aoDesfazer && (
        <Tracked
          as="div"
          tag="toast_desfazer"
          onClick={() => {
            toast.aoDesfazer();
            onFechar();
          }}
          style={{ color: "#7FB8FF", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Desfazer
        </Tracked>
      )}
    </div>
  );
}
