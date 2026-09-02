# Open Legaliza

Sistema de gestão comercial e operacional para escritórios de legalização
empresarial. Implementa o layout aprovado da Fase 1
(`Open Legaliza - Fase 1.dc.html`) e todos os blocos A-G da spec
complementar (fundação, módulos de negócio, comunicação, inteligência,
integrações, SaaS e qualidade) como frontend funcional sobre dados mock,
com login mock e duas integrações externas reais (BrasilAPI e ViaCEP).

## Rodando localmente (dev loop)

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Hot reload via Vite. Faça login com
qualquer senha de 4+ caracteres e um dos e-mails em `src/data/usuarios.js`
(ex: `felipe@openlegaliza.com.br`, papel dono).

```bash
npm run build     # build de produção em dist/
npm run preview   # serve o build de produção localmente
```

## Estrutura

- `src/pages/` — uma tela por rota. Ver lista completa em `src/App.jsx`.
- `src/context/AppContext.jsx` — estado da proposta em construção, do
  processo de demonstração e das assinaturas eletrônicas.
- `src/context/AuthContext.jsx` — sessão mock (login, logout, bloqueio após
  tentativas, recuperação de senha).
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
| Busca de CNPJ (BrasilAPI) e CEP (ViaCEP) | Login/sessão (sem bcrypt/JWT real) |
| Hash SHA-256 da assinatura eletrônica (Web Crypto) | Envio de e-mail/WhatsApp (log local, sem provedor) |
| Export JSON/CSV (download no navegador) | Upload de arquivo (guardado só em memória, sem Storage) |
| Paginação, empty states, confirmação em ações destrutivas | Asaas, certificado digital A1 (não implementado por decisão de escopo) |
| PWA instalável (manifest + service worker) | Painel super admin / planos (dados fixos, Fase 7 desligada) |
| Entrada por voz (Web Speech API, `src/lib/voz.js`) | OCR de documentos (extração real requer backend) |
| Sugestão de CNAE por palavra-chave (`src/data/cnae.js`) | Extração de conversa/comando natural via IA (usa parser local por regras) |

## Módulo de Captura Inteligente

5 níveis, do maior pro menor ganho de tempo (ver spec):

| Nível | O que é | Nesta build |
|---|---|---|
| 1. Consulta automática | CNPJ → sócios, CNAEs, regime provável; CEP → endereço | **Real** — BrasilAPI/ViaCEP, sem chave. Ver `src/lib/integracoes.js`, `NovaProposta.jsx` |
| — | CNAE → alerta "não permitido para MEI" | **Real**, mas com recorte curado (~20 códigos, não os ~1.300 do IBGE). `sugerirCnae()` em `src/data/cnae.js`, campo "Atividade pretendida" em Nova Proposta |
| 2. OCR de documento | Foto de RG/CNH/comprovante → preenche campos | UI completa (`Arquivos.jsx`) tenta `POST /functions/v1/extrair-documento` de verdade; sem `ANTHROPIC_API_KEY` implantada, a chamada falha e cai num formulário manual com os mesmos campos — nunca finge um resultado |
| 3. Extração de conversa | Colar WhatsApp → lead | Botão "Importar de conversa" em Propostas usa `extrairLeadDaConversa()` (`src/lib/extracaoLocal.js`) — regex para telefone/e-mail + palavra-chave de serviço, **real mas sem semântica** de IA |
| 4. Linguagem natural | Barra de comando (Ctrl+K / Cmd+K) | `CommandBar.jsx` + `parseComando()` (`src/lib/comandos.js`) — parser local por regras que cobre os 3 formatos de exemplo da spec (criar proposta, atualizar processo, registrar documento). Sempre mostra card de confirmação antes de aplicar qualquer coisa |
| 5. Voz | Ditar em vez de digitar | **Real** — Web Speech API nativa do navegador, sem credencial. Botão de microfone dentro da barra de comando; normaliza números por extenso ("meia" → 6) antes de preencher o campo, nunca envia direto |

As Edge Functions descritas na spec (`consultar-cnpj`, `extrair-documento`,
`extrair-lead`, `assistente-comandos`) estão em `supabase/functions/` —
código real, deployável, mas **não implantado** nesta demo. Implantar
`extrair-documento` e `extrair-lead` com `ANTHROPIC_API_KEY` configurada é
o que faz Nível 2 e a versão "de verdade" do Nível 3 funcionarem; trocar o
parser local do Nível 4 pelo `assistente-comandos` é o mesmo tipo de troca.

## White-label / multi-tenant

O painel de configurações troca nome do escritório e cor primária em tempo
real — demonstração, no front, do princípio "multi-tenant desde o dia 1"
(`escritorio_id` em toda tabela, RLS por escritório). Schema completo
(propostas, processos, financeiro + todos os blocos A-C da spec
complementar: sessões, auditoria, arquivos, assinaturas, cursos,
obrigações contábeis, modelos jurídicos, notificações) em `db/schema.sql`
e `db/rls.sql`, **prontos para um projeto Supabase mas ainda não
conectados**.

## O que fica fora desta entrega

- **Qualquer backend real**: Supabase (auth/storage/DB), Asaas, Resend,
  WhatsApp (Z-API/Evolution). Precisam de credenciais que não foram
  fornecidas — as telas existem e salvam configuração localmente, mas não
  enviam nada de verdade.
- **Certificado digital A1 dos clientes**: decisão consciente de não
  implementar — a própria spec pede avaliar o risco (criptografia em
  repouso, KMS, política de acesso) antes de guardar isso.
- **Consulta de situação no Simples Nacional**: a spec já assinala que é
  scraping ou manual; não implementado.
- **OCR e extração semântica via IA** (Nível 2 e a parte "inteligente" dos
  Níveis 3-4 da captura): precisam de `ANTHROPIC_API_KEY` num backend real.
  Código das Edge Functions pronto em `supabase/functions/`, não implantado.
  Os equivalentes locais (regras/regex) cobrem o caminho feliz, não o geral.
- **Tabela CNAE completa do IBGE** (~1.300 códigos): esta build usa um
  recorte curado de ~20 códigos comuns em `src/data/cnae.js`.
- **Geração de PDF real**: os botões "Baixar PDF" acionam `window.print()`
  (o navegador salva como PDF); trocar por geração client-side dedicada
  quando o modelo de contrato for definido.
- **Fase 3 (funil de leads) e Fase 4 (financeiro)**: flags existem e estão
  desligadas; sem UI implementada.
- **Portal do cliente como app separado sem sidebar**: nesta demo, "Link da
  proposta" e "Portal do cliente" são visualizações dentro do mesmo app
  (toggle Sistema/Visão do cliente), não uma rota pública de verdade sem
  autenticação de operador por trás.
