import { useEffect, useState } from "react";

// Usado nos poucos pontos onde inline style precisa mudar de verdade em
// telas pequenas (grid de duas colunas virando uma, sidebar virando
// drawer) — o resto do app é inline style, que media query de CSS não
// consegue sobrescrever, então aqui é JS mesmo.
export function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= breakpoint,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}
