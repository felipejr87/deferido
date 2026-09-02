import { track } from "../lib/analytics.js";

/**
 * Elemento clicável com tagueamento embutido: todo `Tracked` grava um evento
 * de analytics (via track()) e expõe `data-track`/`data-testid` no DOM antes
 * de disparar o onClick original. Use no lugar de <div onClick> ou <button>
 * cru em qualquer parte clicável da UI — é assim que cumprimos "tagueamento
 * em tudo" pedido na spec.
 */
export function Tracked({
  as: Component = "div",
  tag,
  data,
  onClick,
  children,
  ...rest
}) {
  const handleClick = (event) => {
    track(tag, data);
    onClick?.(event);
  };

  return (
    <Component data-track={tag} data-testid={tag} onClick={handleClick} {...rest}>
      {children}
    </Component>
  );
}

/** Versão para inputs/selects: tagueia on change em vez de on click. */
export function TrackedInput({ as: Component = "input", tag, data, onChange, ...rest }) {
  const handleChange = (event) => {
    track(tag, { ...data, value: event.target.value });
    onChange?.(event);
  };

  return <Component data-track={tag} data-testid={tag} onChange={handleChange} {...rest} />;
}
