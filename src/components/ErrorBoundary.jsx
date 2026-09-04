import { Component } from "react";
import { Page, Erro } from "./ui.jsx";

// Rede de segurança global (Parte 0.10 / correção pós-auditoria): qualquer
// erro de render que escape do resto do app vira uma tela amigável em vez
// de uma tela branca. Não substitui o tratamento local de erro (fetch,
// ação) — é o último recurso.
export class ErrorBoundary extends Component {
  state = { erro: null };

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error("[boundary]", erro, info);
  }

  render() {
    if (this.state.erro) {
      return (
        <Page>
          <Erro
            titulo="Alguma coisa quebrou nesta tela"
            motivo="Já registramos o problema. Você pode voltar e tentar de novo — seus dados estão salvos."
            acoes={[
              { rotulo: "Voltar ao início", onClick: () => (window.location.href = "/inicio") },
              { rotulo: "Recarregar", onClick: () => window.location.reload() },
            ]}
          />
        </Page>
      );
    }
    return this.props.children;
  }
}
