import { useNavigate } from "react-router-dom";
import { Page, Card } from "../components/ui.jsx";
import { Tracked } from "../components/Tracked.jsx";
import { useFeatures } from "../context/FeatureContext.jsx";

// Simplificação radical de navegação (Passo 2): tudo que não é trabalho do
// dia a dia mora aqui, atrás da engrenagem — não some, só sai do caminho.
const SECOES = [
  {
    titulo: "Meu escritório",
    itens: [
      { label: "Dados e cor", path: "/config/escritorio", descricao: "Nome e cor do escritório — o que aparece nas propostas" },
      { label: "Catálogo de serviços", path: "/servicos", descricao: "O que você vende, por quanto e o que exige" },
      { label: "Equipe", path: "/usuarios", flag: "a_usuarios", descricao: "Quem tem acesso e o que cada um pode fazer" },
    ],
  },
  {
    titulo: "Comunicação",
    itens: [
      { label: "Avisos automáticos", path: "/notificacoes", flag: "c_notificacoes", descricao: "Quando o sistema avisa você e o cliente" },
      { label: "Textos das mensagens", path: "/templates-mensagem", flag: "c_templates", descricao: "Personalize o que é enviado" },
      { label: "Cobrança de atrasados", path: "/regua-cobranca", flag: "c_regua_cobranca", descricao: "Sequência automática de cobrança" },
    ],
  },
  {
    titulo: "Módulos",
    descricao: "Funcionalidades extras. Ligue só o que usar.",
    itens: [
      { label: "Contabilidade", path: "/obrigacoes", flag: "b_obrigacoes", descricao: "Calendário de obrigações fiscais dos clientes" },
      { label: "Jurídico", path: "/juridico", flag: "b_juridico", descricao: "Modelos de contrato e documentos" },
      { label: "Cursos", path: "/cursos", flag: "b_cursos", descricao: "Módulos e progresso dos alunos" },
      { label: "Documentos e arquivos", path: "/arquivos", flag: "b_documentos", descricao: "Upload e OCR de documentos do cliente" },
      { label: "Assinaturas eletrônicas", path: "/assinaturas", flag: "b_assinatura", descricao: "Trilha de assinatura das propostas" },
      { label: "Consulta de CNAE", path: "/cnae", flag: "e_cnae_busca", descricao: "Buscar CNAE por atividade" },
    ],
  },
  {
    titulo: "Conexões",
    itens: [{ label: "Pagamentos e WhatsApp", path: "/integracoes", flag: "e_integracoes_config", descricao: "Asaas, Resend e envio automático" }],
  },
  {
    titulo: "Números e segurança",
    itens: [
      { label: "Ver números do mês", path: "/relatorios", flag: "d_relatorios", descricao: "Faturamento, conversão e margem" },
      { label: "Histórico de alterações", path: "/auditoria", flag: "a_auditoria", descricao: "Quem mexeu no quê" },
      { label: "Seus dados (LGPD)", path: "/lgpd", flag: "a_lgpd", descricao: "Exportar ou apagar" },
    ],
  },
  {
    titulo: "SaaS",
    itens: [
      { label: "Super admin", path: "/admin", flag: "f_super_admin", descricao: "Escritórios, planos e uso" },
      { label: "Planos", path: "/planos", flag: "f_planos", descricao: "Assinatura e add-ons" },
    ],
  },
];

export default function Configuracoes() {
  const navigate = useNavigate();
  const { flags } = useFeatures();

  return (
    <Page style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
      {SECOES.map((secao) => {
        const itens = secao.itens.filter((i) => !i.flag || flags[i.flag]);
        if (!itens.length) return null;
        return (
          <div key={secao.titulo}>
            <div style={{ fontSize: 12, color: "#8A929E", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 6 }}>{secao.titulo}</div>
            {secao.descricao && <div style={{ fontSize: 12.5, color: "#98A0AC", marginBottom: 10 }}>{secao.descricao}</div>}
            <Card style={{ padding: 0 }}>
              {itens.map((item, i) => (
                <Tracked
                  key={item.path}
                  as="div"
                  tag="config_item"
                  data={{ path: item.path }}
                  onClick={() => navigate(item.path)}
                  className="ol-row"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    padding: "13px 16px",
                    borderBottom: i < itens.length - 1 ? "1px solid #EEF0F3" : "none",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: "#8A929E" }}>{item.descricao}</span>
                </Tracked>
              ))}
            </Card>
          </div>
        );
      })}
    </Page>
  );
}
