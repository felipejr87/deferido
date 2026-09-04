// Metadados de cada rota: breadcrumb, título e o par Sistema/Visão-do-cliente
// usado pelo seletor de modo no topbar (mesma ideia do "modos" no layout
// original, onde a mesma tela pode ser vista como operador ou como cliente).

// acaoPrincipal (Parte 0.2 da spec de fluxos: uma ação principal por
// tela): o botão sólido do topbar só aparece nas telas onde existe uma
// ação real pra oferecer — ficava fixo em "Nova proposta" em toda tela do
// sistema antes disso, inclusive em Usuários/Auditoria, onde não faz
// sentido nenhum e brigava com a própria ação da tela.
export const ROUTES = {
  "/inicio": { crumb: "Início", titulo: "Hoje" },

  "/propostas": { crumb: "Comercial", titulo: "Propostas", acaoPrincipal: { rotulo: "Nova proposta", path: "/propostas/nova" } },
  "/propostas/nova": {
    crumb: "Comercial · Propostas",
    titulo: "Nova proposta",
    modos: { sistema: "/propostas/nova", cliente: "/propostas/publica" },
  },
  "/propostas/publica": {
    crumb: "Link público da proposta",
    titulo: "O que o cliente vê no celular",
    modos: { sistema: "/propostas/nova", cliente: "/propostas/publica" },
  },
  "/servicos": { crumb: "Configuração", titulo: "Catálogo de serviços" },
  "/processos": { crumb: "Operação", titulo: "Processos em andamento" },
  "/clientes": { crumb: "Clientes", titulo: "Clientes" },
  "/financeiro": { crumb: "Financeiro", titulo: "Dinheiro" },
  "/config": { crumb: "Configurações", titulo: "Configurações" },
  "/config/escritorio": { crumb: "Configurações", titulo: "Dados e cor do escritório" },

  "/arquivos": { crumb: "Operação", titulo: "Documentos e arquivos" },
  "/assinaturas": { crumb: "Operação", titulo: "Assinaturas eletrônicas" },
  "/cursos": { crumb: "Cursos", titulo: "Progresso do aluno" },
  "/obrigacoes": { crumb: "Contabilidade", titulo: "Calendário de obrigações" },
  "/juridico": { crumb: "Jurídico", titulo: "Modelos de documento" },

  "/notificacoes": { crumb: "Comunicação", titulo: "Notificações" },
  "/templates-mensagem": { crumb: "Comunicação", titulo: "Templates de mensagem" },
  "/regua-cobranca": { crumb: "Comunicação", titulo: "Régua de cobrança" },

  "/relatorios": { crumb: "Inteligência", titulo: "Números do mês" },

  "/cnae": { crumb: "Integrações", titulo: "Consulta de CNAE" },
  "/integracoes": { crumb: "Integrações", titulo: "Configuração" },

  "/admin": { crumb: "SaaS", titulo: "Super admin — escritórios" },
  "/planos": { crumb: "SaaS", titulo: "Planos" },

  "/usuarios": { crumb: "Configuração", titulo: "Usuários e papéis" },
  "/auditoria": { crumb: "Configuração", titulo: "Auditoria" },
  "/lgpd": { crumb: "Configuração", titulo: "LGPD" },
};

export function routeMeta(pathname, processoNumero) {
  if (ROUTES[pathname]) return ROUTES[pathname];

  if (processoNumero) {
    const base = `/processos/${processoNumero}`;
    if (pathname === base) {
      return {
        crumb: "Operação · Processos",
        titulo: `${processoNumero} · Abertura ME / LTDA`,
        modos: { sistema: base, cliente: `${base}/portal` },
      };
    }
    if (pathname === `${base}/portal`) {
      return {
        crumb: "Portal público do processo",
        titulo: "O que o cliente vê no celular",
        modos: { sistema: base, cliente: `${base}/portal` },
      };
    }
  }

  return { crumb: "Open Legaliza", titulo: "" };
}
