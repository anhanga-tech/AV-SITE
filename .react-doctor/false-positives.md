# React Doctor — Falsos Positivos

Falsos positivos confirmados deste repositório. O passo **Filter** do playbook de
triagem (`react-doctor-agent.md`) descarta diagnósticos que casam com as entradas
abaixo.

**Regra de uso:** cada entrada descreve a **forma de código** que torna o achado um
FP. Antes de suprimir, verifique (`Read`/`grep`) que a forma ainda está presente no
arquivo apontado. Se o código mudou e a forma sumiu, **não suprima** — re-triagem.
Nunca suprima só pelo nome do arquivo.

Última validação: 2026-06-23 (`main` @ `0abc823`), contra os prompts canônicos de
validação de cada regra. Relacionado: PR #937, PR #938. Espelha a memória de triagem
do agente (`project-react-doctor-triage`).

---

## react-doctor/build-pipeline-secret-boundary

Workflows do GitHub Actions onde `pnpm install` aparece a <700 chars de um
`secrets.*`. FP de **proximidade de texto**: o secret está escopado a um passo
separado que não compartilha ambiente com o install, e o checkout usa
`persist-credentials: false` (a credencial não é persistida no runner). Endurecidos
no PR #937.

- `.github/workflows/generate-blog-manifest.yml` — verificar `persist-credentials: false` no checkout + push via `x-access-token` URL.
- `.github/workflows/playwright.yml` — idem.
- `.github/workflows/refresh-reviews.yml` — idem.
- `.github/workflows/update-snapshots.yml` — idem.
- `.github/workflows/release.yml` — checkout sem `token:`; secrets (`NPM_TOKEN`/`GITHUB_TOKEN`) escopados só no passo do `semantic-release`.

Para zerar de vez exigiria split install/push em jobs separados (recusado) ou
`--ignore-scripts` (quebra os builds allowlisted `esbuild`/`sharp`/`workerd`).

## react-doctor/dangerous-html-sink

- `lib/head.tsx` (`setElementContent`) — suprimir só se o `innerHTML` for atribuído com `escapeScriptContent(...)`, que troca `<`→`<` (técnica canônica para conteúdo de `<script>` inline). O analisador só reconhece sanitizadores nomeados `escapeHtml`/`encode*Html`.

## react-doctor/unsafe-json-in-html

- `lib/head.tsx` — mesma linha do `dangerous-html-sink`; protegida por `escapeScriptContent`. (Pode não aparecer em todo scan.)

## react-doctor/no-event-handler

`useEffect` que sincroniza o estado imperativo de um `<dialog>` **nativo**
(`showModal()`/`close()`) com state/prop React. FP da classe "estado mexido por
assinatura externa que o handler não observa": o dialog é fechado por ESC/backdrop
(listener de `cancel`/`click`) e, em alguns, por `CustomEvent` de window. Suprimir só
se houver o par `dialog.showModal()/close()` + listener de `cancel`.

- `components/AIChat.tsx` — `<dialog>` + listener `cancel`/`click` + evento `toggle-ai-chat`.
- `components/ContactModal.tsx` — `<dialog>` + `cancel`/`click` + evento `open-contact-modal`.
- `components/Destinations.tsx` — `<dialog>` + `cancel`/`click`.
- `components/landings/beto-carrero/DestinationsModal.tsx` — variante com prop `isOpen`; pai recebe `onClose` de `cancel`/`click`.

## react-doctor/no-initialize-state

`useEffect` (deps de setter) que faz `setState` no mount com valor **client-only**
que deve diferir entre servidor e cliente (SSR-safe / proteção de LCP / prerender
determinístico). Migrar para `useSyncExternalStore` é opcional, não bug. Suprimir só
se a inicialização ler API de browser (`window`/`location`/`IntersectionObserver`/
storage) ou estiver comentada como intencional para prerender/LCP.

- `components/AIChat.tsx` (×3) — lê `window.location.search` (deep-link `?chat=1&destino=`).
- `components/Hero.tsx` — randomiza vídeo pós-mount; comentado "protect LCP".
- `components/ui/LazyImage.tsx` — subscription de `IntersectionObserver`.
- `hooks/useLeadCapture.ts` (×2) — re-captura tracking no mount (corrida com `utm-tracking.js` assíncrono).
- `lib/footer-runtime.ts` — `new Date()` pós-mount; "first render deterministic for prerendered routes".

## react-doctor/js-set-map-lookups

- `api/auth/callback.ts` (`parseCookies`) — `part.indexOf('=')`: `String.prototype.indexOf` para achar o separador `chave=valor`, não busca em array.
- `utils/whatsapp.ts` — `entry.indexOf('=')`: idem (parse de data-string). Suprimir só se o `indexOf('=')` for sobre string vinda de `.split(...)`.

## react-doctor/prefer-useReducer

Regra é só contagem (≥5 `useState`); não verifica se os slices são relacionados.
React 18 já faz batching; refatorar forms críticos de conversão é risco > benefício.

- `components/ChatLeadForm.tsx` — slices independentes (campos do form + erros/notice).
- `pages/NpsPage.tsx` — slices independentes (score/reason/highlight/pageState/...).

## react-doctor/prefer-tag-over-role

- `components/SearchForm.tsx` (×2: `role="listbox"`, `role="option"`) — padrão ARIA APG de combobox; não dá para usar `<select>/<option>` num autocomplete custom com `aria-activedescendant`, ícones e popup que não rouba foco.

## react-doctor/no-redundant-roles

- `components/SearchForm.tsx` — `role="combobox"` num `<input type="text">`: `combobox` **não** é o role implícito do input (`textbox`); é o padrão ARIA APG. Não é redundante.

## react-doctor/control-has-associated-label

- `components/SearchForm.tsx` (input de idade da criança) — tem `<label htmlFor={\`child-age-input-${i+1}\`}>`; o linter não resolve a associação por template literal.

## react-doctor/no-gray-on-colored-background

- `components/blog/BlogPostContent.tsx` — `text-zinc-600` (prose-p/li) e `bg-yellow-50` (prose-blockquote) estão em elementos diferentes via prefixos `prose-*`; nunca se combinam (texto da blockquote é `text-brand-dark`).
