import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import RecuperarSenha from "./pages/RecuperarSenha.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Propostas from "./pages/Propostas.jsx";
import NovaProposta from "./pages/NovaProposta.jsx";
import Servicos from "./pages/Servicos.jsx";
import PropostaPublica from "./pages/PropostaPublica.jsx";
import Processos from "./pages/Processos.jsx";
import Processo from "./pages/Processo.jsx";
import PortalCliente from "./pages/PortalCliente.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import Auditoria from "./pages/Auditoria.jsx";
import Lgpd from "./pages/Lgpd.jsx";
import Arquivos from "./pages/Arquivos.jsx";
import Assinaturas from "./pages/Assinaturas.jsx";
import Cursos from "./pages/Cursos.jsx";
import Obrigacoes from "./pages/Obrigacoes.jsx";
import Juridico from "./pages/Juridico.jsx";
import Notificacoes from "./pages/Notificacoes.jsx";
import TemplatesMensagem from "./pages/TemplatesMensagem.jsx";
import ReguaCobranca from "./pages/ReguaCobranca.jsx";
import Relatorios from "./pages/Relatorios.jsx";
import CnaeBusca from "./pages/CnaeBusca.jsx";
import Integracoes from "./pages/Integracoes.jsx";
import SuperAdmin from "./pages/SuperAdmin.jsx";
import Planos from "./pages/Planos.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import CommandBar from "./components/CommandBar.jsx";
import { useFeature } from "./context/FeatureContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function RequireFeature({ flag, children }) {
  const on = useFeature(flag);
  return on ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />

        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route path="/propostas" element={<Propostas />} />
          <Route path="/propostas/nova" element={<NovaProposta />} />
          <Route path="/propostas/publica" element={<PropostaPublica />} />
          <Route path="/servicos" element={<Servicos />} />

          <Route path="/processos" element={<RequireFeature flag="fase2_processos"><Processos /></RequireFeature>} />
          <Route path="/processos/:numero" element={<RequireFeature flag="fase2_processos"><Processo /></RequireFeature>} />
          <Route path="/processos/:numero/portal" element={<RequireFeature flag="fase2_processos"><PortalCliente /></RequireFeature>} />

          <Route path="/arquivos" element={<RequireFeature flag="b_documentos"><Arquivos /></RequireFeature>} />
          <Route path="/assinaturas" element={<RequireFeature flag="b_assinatura"><Assinaturas /></RequireFeature>} />
          <Route path="/cursos" element={<RequireFeature flag="b_cursos"><Cursos /></RequireFeature>} />
          <Route path="/obrigacoes" element={<RequireFeature flag="b_obrigacoes"><Obrigacoes /></RequireFeature>} />
          <Route path="/juridico" element={<RequireFeature flag="b_juridico"><Juridico /></RequireFeature>} />

          <Route path="/notificacoes" element={<RequireFeature flag="c_notificacoes"><Notificacoes /></RequireFeature>} />
          <Route path="/templates-mensagem" element={<RequireFeature flag="c_templates"><TemplatesMensagem /></RequireFeature>} />
          <Route path="/regua-cobranca" element={<RequireFeature flag="c_regua_cobranca"><ReguaCobranca /></RequireFeature>} />

          <Route path="/relatorios" element={<RequireFeature flag="d_relatorios"><Relatorios /></RequireFeature>} />

          <Route path="/cnae" element={<RequireFeature flag="e_cnae_busca"><CnaeBusca /></RequireFeature>} />
          <Route path="/integracoes" element={<RequireFeature flag="e_integracoes_config"><Integracoes /></RequireFeature>} />

          <Route path="/admin" element={<RequireFeature flag="f_super_admin"><SuperAdmin /></RequireFeature>} />
          <Route path="/planos" element={<RequireFeature flag="f_planos"><Planos /></RequireFeature>} />

          <Route path="/usuarios" element={<RequireFeature flag="a_usuarios"><Usuarios /></RequireFeature>} />
          <Route path="/auditoria" element={<RequireFeature flag="a_auditoria"><Auditoria /></RequireFeature>} />
          <Route path="/lgpd" element={<RequireFeature flag="a_lgpd"><Lgpd /></RequireFeature>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <SettingsPanel />
      <CommandBar />
    </BrowserRouter>
  );
}
