# Ledger de consentimento

Contrato do registro exigido pela [#1545](https://github.com/anhanga-tech/AV-SITE/issues/1545). A [#1824](https://github.com/anhanga-tech/AV-SITE/issues/1824) continua desligada: `ODOO_CONVERSION_FIELDS_ENABLED` não é definido em `wrangler.toml` nem no Preview por este trabalho.

## Atos

| Purpose | Como nasce o grant | Como se revoga | O que libera |
|---|---|---|---|
| `ads_measurement` | Aceite no banner → `POST /api/consent` | Recusa no banner, ou um revoke mais novo | Persistir e enviar UTM, click IDs (`gclid`, `fbclid`, `ttclid`, `wbraid`, `gbraid`, `msclkid`), `fbc`, `fbp` e `hsa_*`. Também a purpose `marketing` do Zaraz |
| `email_marketing` | Checkbox de um formulário, no servidor, no momento do envio | `POST /api/consent` com `action: "revoke"` (página de privacidade) | Campo `x_lgpd_consent` no `res.partner` |

O endpoint público recusa grant de `email_marketing`. Quem soubesse um e-mail não pode optar a pessoa por ela.

Os dois atos são independentes. Recusar cookies não apaga um opt-in de e-mail. Desmarcar o checkbox num envio posterior também não revoga um grant anterior: isso seria uma supressão por qualquer um que reenvie o formulário. A revogação de e-mail é o pedido explícito.

## Evento

```text
id, subjectKey, purpose, action, noticeVersion, origin, occurredAt, recordedAt
```

- `occurredAt` é o momento do ato do titular e ordena o estado efetivo.
- `recordedAt` é o carimbo do servidor e serve de desempate e de trilha.
- O texto do aviso fica em `lib/consent-notices.ts`, versão `2026-10-13`. O evento guarda a versão, não o texto inteiro.
- O mesmo `id` é replay: não duplica e não muda o carimbo original.
- Um grant com `occurredAt` anterior a uma revogação entra no histórico e não restaura o consentimento. Um grant novo, com ato mais recente, restaura.
- Lead e contato reutilizam o `eventId` da tentativa, então o retry daquele envio é replay. Quiz e waitlist não mandam id: cada envio recebe um id opaco novo, sem o e-mail na chave. Reenviar o checkbox depois da revogação restaura.
- `POST /api/consent` guarda um `occurredAt` no passado e troca qualquer valor no futuro (ou inválido) pelo relógio do servidor. O write no Odoo da revogação de e-mail só acontece quando o estado efetivo ficou `revoke`.
- Desmarcar o checkbox não cria revogação. Se o ledger já está em `revoke`, o envio seguinte pede de novo `x_lgpd_consent = false`, para um write que ficou pendente.
- Reaceitar marketing no banner não apaga um recibo já registrado. Se o grant novo falha, a medição continua com a prova anterior.

## Sujeito e armazenamento

- Banner: `anon:<uuid>` em `localStorage` (`anhanga_consent_subject`).
- E-mail: `email:` + 32 caracteres hex de HMAC-SHA256 do endereço normalizado, com o mesmo segredo do rate limit. O e-mail em claro não entra na chave.
- Upstash (a conta já usada no rate limit), retenção de 5 anos (157680000 s), alinhada ao cadastro no CRM:
  - `lgpd:consent:event:<id>` — `SET NX`
  - `lgpd:consent:subject:<subjectKey>` — lista append-only
  - `lgpd:consent:anon-email:<anon>` — liga o sujeito do banner ao HMAC quando um formulário com recibo traz e-mail
- Sem Upstash, no edge, o append falha fechado (HTTP 503 no `/api/consent`). Em dev e teste, um mapa em memória cobre o processo.
- Falha do ledger num formulário não perde o lead: o envio segue sem `x_lgpd_consent` e sem identificadores de campanha.

## Destinos da revogação

| Destino | O que a revogação faz |
|---|---|
| Navegador | Apaga os parâmetros de campanha de `tracking_data` e de `anhanga_tracking_data`. A purpose do Zaraz vai a falso e a página recarrega |
| Odoo `x_lgpd_consent` | `writePartnerConsent(id, false)` quando o e-mail já tem parceiro. Não cria contato vazio. O write normal do formulário não consegue apagar `true` (`PROTECTED_SCALAR_FIELDS`) |
| Odoo, identificadores de campanha | Envios futuros saem sem UTM/click ID. Descrições já gravadas não são reescritas |
| Meta/TikTok via Zaraz | A purpose deixa de ser concedida, então as chamadas de marketing param |
| GA4, Traks, Web Analytics, Sentry | Não são desligados. São legítimo interesse; a oposição continua manual (#1663 para o opt-out durável) |
| Customer Match / Mautic | Inativos. Nada a propagar |

A resposta de `POST /api/consent` não inclui se o Odoo sincronizou nem se o e-mail existe. Isso fica só no log (`CONSENT`, campo `sync`: `recorded` ou `pending`).

## Prova no cliente

`readAdsConsentReceipt()` só devolve `{ eventId, subjectKey }` quando a escolha é `marketing` e `meta.registered === true`. Os formulários mandam esse recibo em `attributionConsent`. O servidor confere se aquele evento ainda é um grant de `ads_measurement` para aquele sujeito. Recibo forjado, id desconhecido ou grant já revogado não libera os campos.
