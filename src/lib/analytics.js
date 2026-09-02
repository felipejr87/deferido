// Camada de tagueamento do Open Legaliza.
//
// Todo elemento interativo do produto chama track(event, payload) e carrega
// um atributo data-track=event no DOM (ver <Track> em components/Track.jsx),
// para que QA/analytics consigam instrumentar cliques sem depender de texto
// visível. Nesta build os eventos vão para o console + um buffer em memória;
// trocar sendToProvider() é o único ponto de integração necessário para
// plugar GA4, Mixpanel, PostHog, etc.

const buffer = [];
const MAX_BUFFER = 500;
const AUDIT_KEY = "ol:auditoria";
const MAX_AUDIT = 300;

// Eventos que também viram registro de auditoria (Bloco A4 da spec): ação de
// negócio relevante, não todo clique de UI. entidade/acao seguem o vocabulário
// da tabela `auditoria` (entidade, acao) para que isso possa migrar 1:1 para
// Postgres quando o backend existir.
const AUDIT_EVENTS = {
  proposta_aceitar_proposta: { entidade: "proposta", acao: "aceitou" },
  aceitar_proposta: { entidade: "proposta", acao: "aceitou" },
  proposta_salvar_rascunho: { entidade: "proposta", acao: "criou" },
  proposta_enviar_whatsapp: { entidade: "proposta", acao: "enviou" },
  processo_registrar_evento: { entidade: "processo", acao: "editou" },
  etapa_toggle: { entidade: "processo", acao: "editou" },
  documento_toggle: { entidade: "processo", acao: "editou" },
  usuario_convidar: { entidade: "usuario", acao: "criou" },
  usuario_desativar: { entidade: "usuario", acao: "editou" },
  cliente_anonimizar: { entidade: "cliente", acao: "deletou" },
  lgpd_export: { entidade: "escritorio", acao: "editou" },
  obrigacao_marcar_cumprida: { entidade: "obrigacao", acao: "editou" },
  documento_gerar: { entidade: "documento", acao: "criou" },
  arquivo_upload: { entidade: "arquivo", acao: "enviou" },
};

function readAudit() {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAudit(entries) {
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(-MAX_AUDIT)));
  } catch {
    // localStorage indisponível (modo privado etc.) — auditoria fica só na sessão
  }
}

export function getAuditLog() {
  return readAudit().slice().reverse();
}

export function clearAuditLog() {
  writeAudit([]);
}

function sendToProvider(evt) {
  // Hook de integração: window.__OL_ANALYTICS__ pode ser definido por um
  // script de terceiros injetado no host (ex: GTM) para receber os eventos.
  if (typeof window !== "undefined" && typeof window.__OL_ANALYTICS__ === "function") {
    try {
      window.__OL_ANALYTICS__(evt);
    } catch (err) {
      console.warn("[analytics] provider handler falhou", err);
    }
  }
}

export function track(event, payload = {}) {
  const evt = {
    event,
    payload,
    escritorio: payload.escritorio_id ?? null,
    ts: new Date().toISOString(),
  };

  buffer.push(evt);
  if (buffer.length > MAX_BUFFER) buffer.shift();

  if (import.meta.env.DEV) {
    console.debug(`[track] ${event}`, payload);
  }

  const auditMeta = AUDIT_EVENTS[event];
  if (auditMeta) {
    const entries = readAudit();
    entries.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      entidade: auditMeta.entidade,
      acao: auditMeta.acao,
      evento: event,
      dados: payload,
      usuario: payload.usuario_nome ?? "sessão atual",
      criado_em: evt.ts,
    });
    writeAudit(entries);
  }

  sendToProvider(evt);
  return evt;
}

export function getTrackedEvents() {
  return [...buffer];
}

export function clearTrackedEvents() {
  buffer.length = 0;
}
