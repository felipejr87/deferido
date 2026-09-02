# Open Legaliza

Sistema de gestão comercial e operacional para escritórios de legalização
empresarial. Implementa o layout aprovado da Fase 1
(`Open Legaliza - Fase 1.dc.html`) e todos os blocos A-G da spec
complementar (fundação, módulos de negócio, comunicação, inteligência,
integrações, SaaS e qualidade).

**Conectado a um projeto Supabase real** (schema, RLS, seed e as 4 Edge
Functions da spec de captura inteligente implantadas — projeto `deferido`).
Publicado em produção: https://deferido.vercel.app (deploy automático a
cada push em `main`, via integração Vercel↔GitHub).

## Rodando localmente (dev loop)

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Hot reload via Vite. Copie `.env.example`
para `.env.local` e preencha com a URL e a publishable key do projeto
Supabase (Project Settings → API) para rodar contra o backend real — sem
isso, o app cai sozinho para dados mock (nunca quebra por falta de
credencial, ver seção abaixo). Login: e-mail/senha de uma conta real do
Supabase Auth (Authentication → Users no dashboard para criar a primeira).

```bash
npm run build     # build de produção em dist/
npm run preview   # serve o build de produção localmente
```

## Estrutura

- `src/pages/` — uma tela por rota. Ver lista completa em `src/App.jsx`.
- `src/context/AppContext.jsx` — estado da proposta em construção, do
  processo de demonstração e das assinaturas eletrônicas.
- `src/context/AuthContext.jsx` — Supabase Auth real quando `.env.local`
  está configurado (login/logout/recuperação de senha de verdade, sessão
  restaurada via `onAuthStateChange`); cai para sessão mock (localStorage,
  bloqueio após tentativas) quando não está.
- `src/lib/data.js` — leitura/escrita real no Postgres para Catálogo,
  Propostas e Processos, com fallback pros arrays mock de
  `src/data/mock.js` se a consulta falhar.
- `src/lib/edgeFunctions.js` — chamadas reais às 4 Edge Functions
  implantadas (`supabase/functions/`), com fallback pros parsers locais.
- `supabase/migrations/` — as migrations já aplicadas no projeto real
  (schema, RLS, seed, correções). `db/schema.sql`/`db/rls.sql` viraram
  histórico — a fonte de verdade agora são as migrations numeradas.
- `src/context/FeatureContext.jsx` + `src/config/features.js` — feature
  toggles (ver abaixo).
- `src/lib/analytics.js` + `src/components/Tracked.jsx` — tagueamento e
  trilha de auditoria.
- `src/lib/integracoes.js` — as únicas chamadas a serviço externo real
  desta entrega (BrasilAPI para CNPJ, ViaCEP para endereço).
- `src/lib/hash.js` — SHA-256 real via Web Crypto (assinatura eletrônica).
- `src/lib/export.js` — download real de JSON/CSV no navegador.
- `src/data/` — catálogo e exemplos por bloco (substituir por Supabase
  quando o backend — `db/schema.sql` + `db/rls.sql` — for provisionado).

## Feature toggles

Todo o produto é parametrizado por fase e por bloco da spec. Flags em
`src/config/features.js` (~30 flags), editáveis em runtime:

- pelo painel de engrenagem no canto inferior direito da UI, agrupado por
  bloco;
- por querystring: `?flag=fase2_processos:0`;
- por `localStorage["ol:flags"]` (persistente no navegador).

Desligar uma flag esconde os itens de navegação correspondentes e
redireciona a rota de volta para `/dashboard` — sem remover código, para
ligar por escritório/ambiente. `f_super_admin` e `f_planos` (Bloco F —
SaaS) vêm **desligadas por padrão**: só fazem sentido se a Open Legaliza
decidir vender o sistema para outros escritórios.

## Tagueamento e auditoria

Todo elemento clicável/editável passa por `<Tracked>` ou `<TrackedInput>`
(`src/components/Tracked.jsx`), que grava `data-track`/`data-testid` no DOM
e chama `track(evento, payload)` (`src/lib/analytics.js`) antes do handler
original. Em dev os eventos aparecem no console; para plugar um provedor
real (GA4, Mixpanel, PostHog), defina `window.__OL_ANALYTICS__ = (evt) =>
{ ... }`.

Um subconjunto desses eventos (aceite de proposta, etapa concluída, usuário
desativado, dados exportados...) também vira uma entrada na trilha de
**auditoria** (Bloco A4), visível em Configurações → Auditoria — nesta demo
persistida em `localStorage`, migra 1:1 para a tabela `auditoria` do
Postgres quando o backend existir.

## O que é real nesta entrega (vs. mock)

| Real, de verdade | Mock/simulado |
|---|---|
| Login/sessão via Supabase Auth (com fallback mock se `.env.local` ausente) | Envio de e-mail/WhatsApp (log local, sem provedor Resend/Z-API) |
| Catálogo, Propostas e Processos lidos do Postgres; "Salvar rascunho" grava de verdade | Asaas (cobrança), certificado digital A1 (não implementado por decisão de escopo) |
| OCR de documento e extração de conversa via Claude (Edge Functions implantadas) | Upload de arquivo (guardado só em memória, sem Supabase Storage ainda) |
| Busca de CNPJ (BrasilAPI) e CEP (ViaCEP) | Painel super admin / planos (dados fixos, Fase 7 desligada) |
| Hash SHA-256 da assinatura eletrônica (Web Crypto) | Builder da proposta (itens/CommandBar) ainda referencia o catálogo mock por id inteiro, não o real por uuid (ver nota abaixo) |
| Export JSON/CSV (download no navegador) | |
| Entrada por voz (Web Speech API) | |
| Sugestão de CNAE por palavra-chave — recorte curado, não a tabela IBGE completa | |
| Paginação, empty states, confirmação em ações destrutivas | |

## Módulo de Captura Inteligente

5 níveis, do maior pro menor ganho de tempo (ver spec):

| Nível | O que é | Nesta build |
|---|---|---|
| 1. Consulta automática | CNPJ → sócios, CNAEs, regime provável; CEP → endereço | **Real** — BrasilAPI/ViaCEP, sem chave. Ver `src/lib/integracoes.js`, `NovaProposta.jsx` |
| — | CNAE → alerta "não permitido para MEI" | **Real**, mas com recorte curado (~20 códigos, não os ~1.300 do IBGE). `sugerirCnae()` em `src/data/cnae.js`, campo "Atividade pretendida" em Nova Proposta |
| 2. OCR de documento | Foto de RG/CNH/comprovante → preenche campos | **Real** — `Arquivos.jsx` chama a Edge Function `extrair-documento` (Claude com visão) implantada; se falhar, cai num formulário manual com os mesmos campos |
| 3. Extração de conversa | Colar WhatsApp → lead | **Real** — `extrair-lead` (Claude) implantada, chamada por `ImportarConversa.jsx`; se falhar, cai pro extrator local por regex (`extracaoLocal.js`, sem semântica) |
| 4. Linguagem natural | Barra de comando (Ctrl+K / Cmd+K) | **Real** — `assistente-comandos` (Claude com function calling) implantada; se falhar, cai pro parser local (`comandos.js`, só os 3 formatos de exemplo da spec). Card de confirmação idêntico nos dois caminhos, nunca aplica nada sem confirmar |
| 5. Voz | Ditar em vez de digitar | **Real** — Web Speech API nativa do navegador, sem credencial. Botão de microfone dentro da barra de comando; normaliza números por extenso ("meia" → 6) antes de preencher o campo, nunca envia direto |

As 4 Edge Functions da spec (`consultar-cnpj`, `extrair-documento`,
`extrair-lead`, `assistente-comandos`) estão implantadas no projeto
Supabase real (`supabase/functions/`, com `ANTHROPIC_API_KEY` configurada
como secret). `consultar-cnpj` está implantada mas o front prefere chamar
a BrasilAPI direto do navegador — a versão via Edge Function esbarra num
rate-limit (429) da BrasilAPI contra o IP compartilhado do Supabase Edge.

## White-label / multi-tenant

O painel de configurações troca nome do escritório e cor primária em tempo
real. O schema completo (propostas, processos, financeiro + todos os
blocos A-C da spec complementar) está aplicado no Supabase real via
`supabase/migrations/`, com RLS por escritório usando
`usuarios.auth_user_id = auth.uid()` (função `meu_escritorio_id()`) — hoje
mono-tenant na prática (um único escritório semeado, id fixo em
`src/config/escritorio.js`), mas a estrutura já é multi-tenant de verdade.
Migration `0003` também fecha um gap real que o schema original tinha:
`db/rls.sql` só continha um *comentário* de exemplo para as tabelas
principais, nunca um `ENABLE ROW LEVEL SECURITY` de fato — corrigido.

## O que fica fora desta entrega

- **Asaas, Resend, WhatsApp (Z-API/Evolution)**: telas de configuração
  existem e salvam localmente, mas não enviam nada de verdade — precisam
  de credenciais que não foram fornecidas.
- **Certificado digital A1 dos clientes**: decisão consciente de não
  implementar — a própria spec pede avaliar o risco (criptografia em
  repouso, KMS, política de acesso) antes de guardar isso.
- **Consulta de situação no Simples Nacional**: a spec já assinala que é
  scraping ou manual; não implementado.
- **Tabela CNAE completa do IBGE** (~1.300 códigos): esta build usa um
  recorte curado de ~20 códigos comuns em `src/data/cnae.js`.
- **Builder da proposta com uuid real**: itens/CommandBar/extração de
  conversa continuam referenciando o catálogo por id inteiro (1-9, de
  `src/data/mock.js`) em vez do uuid real do Postgres — trocar isso em
  toda a cadeia é um refactor maior, fora do escopo desta rodada.
- **Supabase Storage**: upload de arquivo (`Arquivos.jsx`) ainda guarda só
  em memória do navegador, não sobe pro Storage de verdade.
- **Convite de usuário real**: `Usuarios.jsx` ainda é mock — criar contas
  de verdade no Supabase Auth exige a service_role key (API admin) ou uso
  manual do dashboard (Authentication → Users → Add user), que é como as
  contas atuais foram criadas.
- **Geração de PDF real**: os botões "Baixar PDF" acionam `window.print()`
  (o navegador salva como PDF); trocar por geração client-side dedicada
  quando o modelo de contrato for definido.
- **Fase 3 (funil de leads) e Fase 4 (financeiro)**: flags existem e estão
  desligadas; sem UI implementada.
- **Portal do cliente como app separado sem sidebar**: nesta demo, "Link da
  proposta" e "Portal do cliente" são visualizações dentro do mesmo app
  (toggle Sistema/Visão do cliente), não uma rota pública de verdade sem
  autenticação de operador por trás.

