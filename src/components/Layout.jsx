import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { useFeatures } from "../context/FeatureContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { PROPOSTAS, PROCESSOS, SERVICOS } from "../data/mock.js";
import { routeMeta } from "../routesConfig.js";
import { Tracked } from "./Tracked.jsx";

export default function Layout() {
  const { escritorio } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { flags } = useFeatures();
  const { session, logout } = useAuth();
  const isMobile = useIsMobile();
  const [drawerAberto, setDrawerAberto] = useState(false);

  // Troca de rota (inclusive pelo menu) sempre fecha o drawer no mobile —
  // senão a próxima tela abre com o menu ainda em cima.
  useEffect(() => {
    setDrawerAberto(false);
  }, [location.pathname]);

  const meta = routeMeta(location.pathname, params.numero);

  const groups = [
    {
      titulo: "Comercial",
      items: [
        { key: "propostas", label: "Propostas", badge: String(PROPOSTAS.length), path: "/propostas" },
        { key: "nova", label: "Nova proposta", path: "/propostas/nova" },
        { key: "servicos", label: "Catálogo de serviços", badge: String(SERVICOS.length), path: "/servicos" },
        { key: "publico", label: "Link da proposta", path: "/propostas/publica" },
      ],
    },
    flags.fase2_processos && {
      titulo: "Operação",
      items: [
        { key: "processos", label: "Processos", badge: String(PROCESSOS.length), path: "/processos" },
        { key: "processo", label: "Processo #0087", path: "/processos/0087" },
        { key: "portal", label: "Portal do cliente", path: "/processos/0087/portal" },
        flags.b_documentos && { key: "arquivos", label: "Documentos e arquivos", path: "/arquivos" },
        flags.b_assinatura && { key: "assinaturas", label: "Assinaturas eletrônicas", path: "/assinaturas" },
      ].filter(Boolean),
    },
    (flags.b_cursos || flags.b_obrigacoes || flags.b_juridico) && {
      titulo: "Outros serviços",
      items: [
        flags.b_cursos && { key: "cursos", label: "Cursos", path: "/cursos" },
        flags.b_obrigacoes && { key: "obrigacoes", label: "Obrigações contábeis", path: "/obrigacoes" },
        flags.b_juridico && { key: "juridico", label: "Modelos jurídicos", path: "/juridico" },
      ].filter(Boolean),
    },
    (flags.c_notificacoes || flags.c_templates || flags.c_regua_cobranca) && {
      titulo: "Comunicação",
      items: [
        flags.c_notificacoes && { key: "notificacoes", label: "Notificações", path: "/notificacoes" },
        flags.c_templates && { key: "templates", label: "Templates de mensagem", path: "/templates-mensagem" },
        flags.c_regua_cobranca && { key: "regua", label: "Régua de cobrança", path: "/regua-cobranca" },
      ].filter(Boolean),
    },
    (flags.d_relatorios || flags.e_cnae_busca || flags.e_integracoes_config) && {
      titulo: "Inteligência e integrações",
      items: [
        flags.d_relatorios && { key: "relatorios", label: "Relatórios", path: "/relatorios" },
        flags.e_cnae_busca && { key: "cnae", label: "Consulta de CNAE", path: "/cnae" },
        flags.e_integracoes_config && { key: "integracoes", label: "Integrações", path: "/integracoes" },
      ].filter(Boolean),
    },
    (flags.a_usuarios || flags.a_auditoria || flags.a_lgpd) && {
      titulo: "Configurações",
      items: [
        { key: "onboarding", label: "Onboarding", path: "/onboarding" },
        flags.a_usuarios && { key: "usuarios", label: "Usuários e papéis", path: "/usuarios" },
        flags.a_auditoria && { key: "auditoria", label: "Auditoria", path: "/auditoria" },
        flags.a_lgpd && { key: "lgpd", label: "LGPD", path: "/lgpd" },
      ].filter(Boolean),
    },
    (flags.f_super_admin || flags.f_planos) && {
      titulo: "SaaS",
      items: [
        flags.f_super_admin && { key: "admin", label: "Super admin", path: "/admin" },
        flags.f_planos && { key: "planos", label: "Planos", path: "/planos" },
      ].filter(Boolean),
    },
  ].filter(Boolean);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {isMobile && drawerAberto && (
        <div
          onClick={() => setDrawerAberto(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(14,20,32,.5)", zIndex: 1150 }}
        />
      )}

      <aside
        style={{
          width: 244,
          maxWidth: "82vw",
          flex: isMobile ? "0 0 auto" : "0 0 244px",
          background: "#0E1420",
          color: "#C8CFDA",
          display: "flex",
          flexDirection: "column",
          padding: "20px 0",
          overflowY: "auto",
          ...(isMobile
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 1200,
                transform: drawerAberto ? "translateX(0)" : "translateX(-100%)",
                transition: "transform .2s ease",
                boxShadow: drawerAberto ? "0 0 30px rgba(0,0,0,.4)" : "none",
              }
            : {}),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 20px 20px" }}>
          <Tracked
            as="div"
            tag="nav_home"
            onClick={() => navigate("/dashboard")}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minWidth: 0 }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                flex: "0 0 30px",
                borderRadius: 5,
                background: escritorio.corPrimaria,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".02em",
              }}
            >
              OL
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{escritorio.nome}</div>
              <div style={{ fontSize: 11, color: "#6C7787" }}>Corporate Services</div>
            </div>
          </Tracked>
          {isMobile && (
            <Tracked as="div" tag="drawer_fechar" onClick={() => setDrawerAberto(false)} style={{ color: "#98A0AC", cursor: "pointer", flex: "0 0 auto", padding: 4 }}>
              <X size={18} />
            </Tracked>
          )}
        </div>

        {groups.map((g) => (
          <div key={g.titulo} style={{ padding: "10px 10px 4px 10px" }}>
            <div style={{ fontSize: 10.5, color: "#5F6A7A", letterSpacing: ".06em", textTransform: "uppercase", padding: "4px 10px 6px 10px" }}>
              {g.titulo}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {g.items.map((n) => {
                const active = location.pathname === n.path;
                return (
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
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      background: active ? "#1A2333" : "transparent",
                      color: active ? "#FFFFFF" : "#C8CFDA",
                    }}
                  >
                    <span>{n.label}</span>
                    {n.badge && <span style={{ fontSize: 11, color: "#5F6A7A", fontVariantNumeric: "tabular-nums" }}>{n.badge}</span>}
                  </Tracked>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ marginTop: "auto", padding: "16px 20px 0 20px", borderTop: "1px solid #1C2432" }}>
          {session && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.nome}</div>
                <div style={{ fontSize: 10.5, color: "#5F6A7A", textTransform: "capitalize" }}>{session.papel}</div>
              </div>
              <Tracked as="div" tag="logout" onClick={() => { logout(); navigate("/login"); }} style={{ fontSize: 11.5, color: "#98A0AC", cursor: "pointer", whiteSpace: "nowrap" }}>
                Sair
              </Tracked>
            </div>
          )}
          <div style={{ fontSize: 11, color: "#5F6A7A", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Escopo ativo</div>
          <div style={{ fontSize: 12, color: "#A8B2C0" }}>
            {[flags.fase1_propostas && "Fase 1", flags.fase2_processos && "Fase 2"].filter(Boolean).join(" + ")}
          </div>
        </div>
      </aside>

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
              <Tracked
                as="div"
                tag="drawer_abrir"
                onClick={() => setDrawerAberto(true)}
                style={{ flex: "0 0 auto", padding: 6, cursor: "pointer", color: "#3C4453" }}
              >
                <Menu size={20} />
              </Tracked>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#8A929E", letterSpacing: ".06em", textTransform: "uppercase" }}>
                {meta.crumb}
              </div>
              <div
                style={{
                  fontSize: isMobile ? 15 : 19,
                  fontWeight: 600,
                  letterSpacing: "-.01em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {meta.titulo}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
                      style={{
                        padding: isMobile ? "6px 10px" : "7px 13px",
                        fontSize: 12.5,
                        cursor: "pointer",
                        background: active ? "#FFFFFF" : "transparent",
                        color: active ? "#14181F" : "#7A828F",
                      }}
                    >
                      {m.label}
                    </Tracked>
                  );
                })}
              </div>
            )}
            <Tracked
              as="div"
              tag="nova_proposta_cta"
              className="ol-btn-primary"
              onClick={() => navigate("/propostas/nova")}
              style={{
                padding: isMobile ? "8px 12px" : "9px 15px",
                borderRadius: 7,
                background: escritorio.corPrimaria,
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Nova proposta
            </Tracked>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
