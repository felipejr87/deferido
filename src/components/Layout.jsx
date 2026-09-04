import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { Home, FileText, FolderOpen, Users, Wallet, Settings } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { buscarPropostasReais, buscarProcessosReais } from "../lib/data.js";
import { routeMeta } from "../routesConfig.js";
import { Tracked } from "./Tracked.jsx";
import GlobalSearch from "./GlobalSearch.jsx";

// Simplificação radical de navegação (Passo 1): o menu tinha 25 itens em 7
// grupos espelhando os blocos da spec — não o trabalho de uma pessoa real.
// Cinco coisas por dia: ver pendência, mandar proposta, tocar processo,
// cuidar de cliente, olhar dinheiro. Tudo o mais mora em Configurações.
function useMenuPrincipal() {
  const [contadores, setContadores] = useState({ propostas: 0, processos: 0 });

  useEffect(() => {
    let vivo = true;
    buscarPropostasReais().then((res) => {
      if (!vivo) return;
      const abertas = res.dados.filter((p) => p.status === "enviada" || p.status === "vista").length;
      setContadores((c) => ({ ...c, propostas: abertas }));
    });
    buscarProcessosReais().then((res) => {
      if (!vivo) return;
      const ativos = res.dados.filter((p) => p.status !== "concluido" && p.status !== "cancelado").length;
      setContadores((c) => ({ ...c, processos: ativos }));
    });
    return () => {
      vivo = false;
    };
  }, []);

  return [
    { key: "inicio", label: "Hoje", path: "/inicio", Icone: Home },
    { key: "propostas", label: "Propostas", path: "/propostas", Icone: FileText, badge: contadores.propostas || null },
    { key: "processos", label: "Processos", path: "/processos", Icone: FolderOpen, badge: contadores.processos || null },
    { key: "clientes", label: "Clientes", path: "/clientes", Icone: Users },
    { key: "financeiro", label: "Dinheiro", path: "/financeiro", Icone: Wallet },
  ];
}

export default function Layout() {
  const { escritorio } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { session, logout } = useAuth();
  const isMobile = useIsMobile();
  const menu = useMenuPrincipal();

  const meta = routeMeta(location.pathname, params.numero);
  const ativo = (path) => location.pathname === path || (path !== "/inicio" && location.pathname.startsWith(path));

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {!isMobile && (
        <aside style={{ width: 216, flex: "0 0 216px", background: "#0E1420", color: "#C8CFDA", display: "flex", flexDirection: "column", padding: "20px 0", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 24px 20px" }}>
            <div style={{ width: 30, height: 30, flex: "0 0 30px", borderRadius: 5, background: escritorio.corPrimaria, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
              OL
            </div>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{escritorio.nome}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 10px" }}>
            {menu.map((n) => (
              <Tracked
                key={n.key}
                as="div"
                tag={`nav_${n.key}`}
                data={{ path: n.path }}
                className="ol-nav-item"
                onClick={() => navigate(n.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "10px 12px",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontSize: 13.5,
                  background: ativo(n.path) ? "#1A2333" : "transparent",
                  color: ativo(n.path) ? "#FFFFFF" : "#C8CFDA",
                }}
              >
                <n.Icone size={17} strokeWidth={2} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge > 0 && <span style={{ fontSize: 11, color: "#7A8CA8", fontVariantNumeric: "tabular-nums" }}>{n.badge}</span>}
              </Tracked>
            ))}
          </div>

          <div style={{ marginTop: "auto", padding: "16px 10px 0 10px", borderTop: "1px solid #1C2432" }}>
            <Tracked
              as="div"
              tag="nav_config"
              onClick={() => navigate("/config")}
              className="ol-nav-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 12px",
                borderRadius: 7,
                cursor: "pointer",
                fontSize: 13,
                background: location.pathname.startsWith("/config") ? "#1A2333" : "transparent",
                color: location.pathname.startsWith("/config") ? "#FFFFFF" : "#C8CFDA",
                marginBottom: 10,
              }}
            >
              <Settings size={16} strokeWidth={2} />
              <span>Configurações</span>
            </Tracked>
            {session && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.nome}</div>
                  <div style={{ fontSize: 10.5, color: "#5F6A7A", textTransform: "capitalize" }}>{session.papel}</div>
                </div>
                <Tracked as="div" tag="logout" onClick={() => { logout(); navigate("/login"); }} style={{ fontSize: 11.5, color: "#98A0AC", cursor: "pointer", whiteSpace: "nowrap" }}>
                  Sair
                </Tracked>
              </div>
            )}
          </div>
        </aside>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: isMobile ? 10 : 16,
            flexWrap: isMobile ? "wrap" : "nowrap",
            padding: isMobile ? "12px 14px" : "16px 28px",
            background: "#fff",
            borderBottom: "1px solid #E4E7EC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {isMobile && (
              <div style={{ width: 26, height: 26, flex: "0 0 26px", borderRadius: 5, background: escritorio.corPrimaria, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                OL
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#8A929E", letterSpacing: ".06em", textTransform: "uppercase" }}>{meta.crumb}</div>
              <div style={{ fontSize: isMobile ? 15 : 19, fontWeight: 600, letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {meta.titulo}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <GlobalSearch />
            {isMobile && (
              <Tracked as="div" tag="nav_config_mobile" onClick={() => navigate("/config")} style={{ padding: 6, cursor: "pointer", color: "#3C4453" }}>
                <Settings size={19} />
              </Tracked>
            )}
            {meta.modos && (
              <div style={{ display: "flex", border: "1px solid #DDE1E7", borderRadius: 7, overflow: "hidden", background: "#F7F8FA" }}>
                {[
                  { key: "sistema", label: "Sistema", path: meta.modos.sistema },
                  { key: "cliente", label: "Visão do cliente", path: meta.modos.cliente },
                ].map((m) => {
                  const active = location.pathname === m.path;
                  return (
                    <Tracked
                      key={m.key}
                      as="div"
                      tag={`modo_${m.key}`}
                      className="ol-modo"
                      onClick={() => navigate(m.path)}
                      style={{ padding: isMobile ? "6px 10px" : "7px 13px", fontSize: 12.5, cursor: "pointer", background: active ? "#FFFFFF" : "transparent", color: active ? "#14181F" : "#7A828F" }}
                    >
                      {m.label}
                    </Tracked>
                  );
                })}
              </div>
            )}
            {meta.acaoPrincipal && (
              <Tracked
                as="div"
                tag="acao_principal_topbar"
                data={{ path: meta.acaoPrincipal.path }}
                className="ol-btn-primary"
                onClick={() => navigate(meta.acaoPrincipal.path)}
                style={{ padding: isMobile ? "8px 12px" : "9px 15px", borderRadius: 7, background: escritorio.corPrimaria, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {meta.acaoPrincipal.rotulo}
              </Tracked>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, overflow: "auto", paddingBottom: isMobile ? 62 : 0 }}>
          <Outlet />
        </div>

        {isMobile && (
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1100,
              display: "flex",
              background: "#0E1420",
              borderTop: "1px solid #1C2432",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {menu.map((n) => (
              <Tracked
                key={n.key}
                as="div"
                tag={`tab_${n.key}`}
                data={{ path: n.path }}
                onClick={() => navigate(n.path)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "8px 4px 7px 4px",
                  cursor: "pointer",
                  color: ativo(n.path) ? "#FFFFFF" : "#7A8CA8",
                  position: "relative",
                }}
              >
                <n.Icone size={19} strokeWidth={ativo(n.path) ? 2.4 : 2} />
                <span style={{ fontSize: 10 }}>{n.label}</span>
                {n.badge > 0 && (
                  <span style={{ position: "absolute", top: 4, right: "28%", width: 6, height: 6, borderRadius: "50%", background: "#E0913F" }} />
                )}
              </Tracked>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
