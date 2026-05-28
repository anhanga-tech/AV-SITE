# Landing Page Corporativo

## Objetivo

Criar uma landing page B2B genérica para a Anhangá Viagens voltada a donos de micro e pequenas empresas. A empresa esta entrando no segmento corporativo agora, entao a pagina deve ser ampla (incentivo, confraternizacao, viagens a trabalho, eventos) sem restringir a um tipo especifico.

## Abordagem

Adaptacao direta da landing Brazil Promotion Day. Mesma estrutura visual (6 componentes), trocando apenas conteudo, constantes e campos de formulario. A Brazil Promotion Day sera redirecionada para `/corporativo` via redirect 301.

## Rota

- `/corporativo` (nova rota)
- `/brazil-promotion-day` redireciona 301 para `/corporativo`

## Estrutura de componentes

Nova pasta: `components/landings/corporativo/`

| Componente | Base (BPD) | Mudancas |
|---|---|---|
| `CorpNav` | `BpdNav` | `source: 'corporativo'` |
| `CorpHero` | `BpdHero` | Textos B2B, pills atualizados |
| `CorpPillars` | `BpdPillars` | 3 cards com diferenciais corporativos |
| `CorpWhatsAppBand` | `BpdWhatsAppBand` | Headline e subtitulo corporativo |
| `CorpContactSection` | `BpdContactSection` | Campos "Empresa" e "Cargo/Funcao" substituem "Destino de interesse" |
| `CorpFooter` | `BpdFooter` | Identico |

Nova page: `pages/landings/CorporativoLanding.tsx`

## Conteudo por secao

### CorpNav

Identico ao BpdNav. Botao WhatsApp com `source: 'corporativo'`.

### CorpHero

- **Badge:** Viagens para Empresas
- **Headline:** A viagem da sua equipe / começa aqui.
- **Subtitulo:** Incentivo, confraternizacao, evento ou viagem a trabalho. A gente monta o roteiro do zero, voce so embarca.
- **Feature pills:** Roteiro do Zero | Consultor So Seu | Faturamento PJ | Grupos e Eventos
- **CTA primario:** Falar no WhatsApp (abre contact modal com source corporativo)
- **CTA secundario:** Prefiro ser contatado (ancora para #contato)

### CorpPillars

- **Titulo da secao:** Por que empresas escolhem a Anhanga
- **Card 1 - Consultor so seu:** Uma pessoa que conhece sua empresa e resolve tudo: passagem, hotel, transfer, seguro. Voce liga, ela resolve.
- **Card 2 - Roteiro feito pra sua equipe:** Premiacao dos top vendedores, retiro de fim de ano ou reuniao fora do escritorio. Cada viagem tem um motivo. A gente monta em cima dele.
- **Card 3 - Sem burocracia:** Faturamento direto no CNPJ e condicoes pra grupo. Voce cuida da empresa, a gente cuida da viagem.

### CorpWhatsAppBand

- **Subtitulo:** Bate-papo rapido
- **Headline:** Quer uma proposta? / Chama no WhatsApp.

### CorpContactSection

- **Headline:** Prefere que a gente entre em contato?
- **Campos do formulario:**
  - Nome (obrigatorio)
  - Sobrenome (obrigatorio)
  - E-mail corporativo (obrigatorio, placeholder: joao@suaempresa.com.br)
  - WhatsApp (obrigatorio)
  - Empresa (opcional)
  - Cargo/Funcao (opcional)
- **bantSummary:** `Lead corporativo captado via landing /corporativo. Empresa: {empresa}. Cargo: {cargo}.`
- **formType:** `corporate_lead`

### CorpFooter

Identico ao BpdFooter.

## Constantes (constants.ts)

```typescript
WHATSAPP_MESSAGE = 'Oi! Vi que vocês fazem viagens corporativas. Quero entender como funciona pra minha empresa.'

PILLARS = [
  { icon: UsersThree, title: 'Consultor só seu', ... },
  { icon: Sparkle, title: 'Roteiro feito pra sua equipe', ... },
  { icon: ClipboardText, title: 'Sem burocracia', ... },
]
```

## GTM dataLayer

```typescript
{
  event: 'landing_view',
  campaign: 'corporativo',
  landing_type: 'b2b',
}
```

## SEO

- **Title:** Viagens Corporativas | Anhanga Viagens
- **Description:** Viagens corporativas sob medida para micro e pequenas empresas. Incentivo, confraternizacao, eventos e viagens a trabalho com atendimento dedicado.
- **Canonical:** https://www.anhanga.tur.br/corporativo/
- **Breadcrumb:** Inicio > Corporativo

## Routing (App.tsx)

- Adicionar lazy import de `CorporativoLanding`
- Adicionar `<Route path="/corporativo" element={<CorporativoLanding />} />`
- Alterar rota `/brazil-promotion-day` de renderizar `BrazilPromotionDayLanding` para `<Navigate to="/corporativo" replace />`

## O que NAO muda

- Visual, layout, animacoes, cores (identico a BPD)
- Fluxo de lead capture (mesmo hook useLeadCapture, mesmo endpoint /api/submit-lead)
- Estrutura de arquivos (mesma convencao de pasta por landing)
- Footer e Nav (mesma estrutura, so muda source no tracking)

## Testes

- Atualizar ou criar testes E2E para `/corporativo`
- Verificar que redirect 301 de `/brazil-promotion-day` funciona
- Verificar que formulario envia lead com campos corporativos
- Verificar GTM dataLayer push com campaign corporativo
