# Conversion Tracking Template (PLACEHOLDER)

## O que foi adicionado
- `lib/conversions/google.ts` (placeholder Google Ads)
- `lib/conversions/meta.ts` (placeholder Meta CAPI)
- `api/hubspot-webhook.ts` (placeholder HubSpot webhook)
- `.env.example` atualizado com variáveis de conversão

## Próximos passos
1. Preencher variáveis de ambiente no Vercel
2. Implementar as chamadas reais nas funções de conversão
3. Atualizar `api/submit-lead.ts` para chamar `sendGoogleConversion` e `sendMetaConversion`
4. Configurar webhook no HubSpot para closed_won

## Issue relacionada
- #28: Server-side conversion tracking
