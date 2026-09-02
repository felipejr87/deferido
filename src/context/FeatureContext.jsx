import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { getFeatures, setFeature as persistFeature } from "../config/features.js";
import { track } from "../lib/analytics.js";

const FeatureContext = createContext(null);

export function FeatureProvider({ children }) {
  const [flags, setFlags] = useState(() => getFeatures());

  const toggle = useCallback((name) => {
    setFlags((prev) => {
      const next = { ...prev, [name]: !prev[name] };
      persistFeature(name, next[name]);
      track("feature_toggle", { flag: name, value: next[name] });
      return next;
    });
  }, []);

  const value = useMemo(() => ({ flags, toggle }), [flags, toggle]);

  return <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>;
}

export function useFeatures() {
  const ctx = useContext(FeatureContext);
  if (!ctx) throw new Error("useFeatures deve ser usado dentro de <FeatureProvider>");
  return ctx;
}

export function useFeature(name) {
  const { flags } = useFeatures();
  return Boolean(flags[name]);
}
