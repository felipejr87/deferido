import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { supabase, supabaseConectado } from "../lib/supabaseClient.js";
import { ESCRITORIO_ID } from "../config/escritorio.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Tracked } from "./Tracked.jsx";
import { track } from "../lib/analytics.js";

// Simplificação radical de navegação (Passo 7): Cmd+K / Ctrl+K abre busca
// — resolve "não sei onde fica" sem precisar entender o menu de 5 itens.
// Usa buscar_tudo() (migration 20260904180000), a mesma RPC real que
// varre clientes/propostas/processos.
const ROTULO_TIPO = { cliente: "CLIENTES", proposta: "PROPOSTAS", processo: "PROCESSOS" };

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberto((v) => !v);
      }
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (aberto) setTimeout(() => inputRef.current?.focus(), 30);
    else {
      setTermo("");
      setResultados([]);
    }
  }, [aberto]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!termo.trim() || !supabaseConectado) {
      setResultados([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      const { data, error } = await supabase.rpc("buscar_tudo", { p_escritorio_id: ESCRITORIO_ID, p_termo: termo.trim() });
      setBuscando(false);
      if (!error) setResultados(data || []);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [termo]);

  if (!isAuthenticated) return null;

  const irPara = (r) => {
    track("busca_global_navegar", { tipo: r.tipo });
    navigate(r.rota);
    setAberto(false);
  };

  const grupos = ["cliente", "proposta", "processo"]
    .map((tipo) => ({ tipo, itens: resultados.filter((r) => r.tipo === tipo) }))
    .filter((g) => g.itens.length);

  return (
    <>
      <Tracked
        as="div"
        tag="busca_global_abrir"
        onClick={() => { track("busca_global_abrir", { via: "clique" }); setAberto(true); }}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", border: "1px solid #DDE1E7", borderRadius: 7, cursor: "pointer", color: "#8A929E", fontSize: 12.5 }}
        title="Buscar (Ctrl+K)"
      >
        <Search size={14} />
      </Tracked>

      {aberto && (
        <div
          onClick={() => setAberto(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(14,20,32,.45)", zIndex: 1200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: "92vw", background: "#fff", borderRadius: 14, boxShadow: "0 24px 60px rgba(0,0,0,.35)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid #EEF0F3" }}>
              <Search size={16} color="#8A929E" />
              <input
                ref={inputRef}
                data-track="busca_global_input"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && resultados[0]) irPara(resultados[0]);
                }}
                placeholder="Buscar cliente, proposta ou processo…"
                style={{ flex: 1, border: "none", outline: "none", fontSize: 14.5 }}
              />
            </div>

            <div style={{ padding: 8, maxHeight: "50vh", overflowY: "auto" }}>
              {!termo.trim() && <div style={{ padding: "12px 8px", fontSize: 12, color: "#98A0AC" }}>Digite pra buscar. Ctrl+K abre/fecha.</div>}
              {termo.trim() && buscando && <div style={{ padding: "12px 8px", fontSize: 12, color: "#98A0AC" }}>Buscando…</div>}
              {termo.trim() && !buscando && !resultados.length && (
                <div style={{ padding: "12px 8px", fontSize: 12, color: "#98A0AC" }}>Nada encontrado para "{termo}".</div>
              )}
              {!supabaseConectado && termo.trim() && (
                <div style={{ padding: "12px 8px", fontSize: 12, color: "#98A0AC" }}>Busca precisa do Supabase conectado.</div>
              )}
              {grupos.map((g) => (
                <div key={g.tipo} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10.5, color: "#8A929E", letterSpacing: ".05em", padding: "8px 8px 4px 8px" }}>{ROTULO_TIPO[g.tipo]}</div>
                  {g.itens.map((r) => (
                    <Tracked
                      key={r.id}
                      as="div"
                      tag="busca_global_resultado"
                      data={{ tipo: r.tipo }}
                      onClick={() => irPara(r)}
                      className="ol-row"
                      style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 8px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
                    >
                      <span>{r.titulo}</span>
                      <span style={{ color: "#8A929E", fontSize: 12 }}>{r.subtitulo}</span>
                    </Tracked>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
