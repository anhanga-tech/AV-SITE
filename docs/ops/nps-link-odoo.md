# Link de NPS por cliente (automação do Odoo)

O e-mail "Como foi a viagem?" (template 54) precisa de um link de NPS válido para cada cliente. O `/nps` só aceita convite assinado (`?token=…`, 30 dias, uso único; ver [nps-invite.md](nps-invite.md)), e o Odoo não consegue assinar nada sem guardar segredo no template. Por isso o site gera o link e grava no próprio lead.

Autorizado pelo Felipe em 11/11/2026: "Autorizo o Otto a construir o link de NPS por cliente no AV-SITE (endpoint/rota nova + ajuste do /nps), via PR para minha revisão, e a me pedir para criar no Cloudflare Pages o(s) segredo(s) necessários."

## Como funciona

1. **Regra 10** (2 dias após `x_data_de_retorno`, oportunidade Ganha) deixa de mandar o e-mail e passa a mandar um **webhook** do próprio Odoo ("Send Webhook Notification") para:

   ```
   POST https://www.anhanga.tur.br/api/nps-link-hook?secret=<NPS_LINK_WEBHOOK_SECRET>
   Content-Type: application/json

   {"_action": "…", "_id": <id do lead>, "_model": "crm.lead"}
   ```

   O Odoo não deixa pôr cabeçalho nem assinar o corpo, e espera só 1 s. Por isso o segredo vai na query (`secret`, apagado do Sentry e dos logs) e o site responde `202` na hora e faz o resto em segundo plano.

2. O site (`api/nps-link-hook.ts` → `lib/nps-link.ts`) usa só o `_id`. Relê o lead no Odoo com a credencial que já usa (`ODOO_*`) e confere:
   - oportunidade ganha (`won_status = won`) e ativa;
   - `email_from` válido;
   - nome do contato (primeiro nome do contato vinculado, ou do "Nome do contato");
   - `x_data_de_retorno` entre hoje e 30 dias atrás (data de São Paulo);
   - `x_nps_link` ainda vazio.

3. Se estiver tudo certo, gera o convite de sempre (`lib/nps-invite.ts`, 30 dias, uso único) e grava em `crm.lead.x_nps_link`:

   ```
   https://www.anhanga.tur.br/nps?token=<token>
   ```

   Quando o webhook chega num preview (`*.pages.dev`), o link aponta para esse mesmo preview, porque é o `NPS_INVITE_SECRET` dele que confere a assinatura. Qualquer outro host gera link de produção.

   No chatter do lead fica uma nota interna "Link de NPS gerado (uso único, válido até dd/mm/aaaa)". A nota não leva o link.

4. **Regra 10b** (nova) dispara quando `x_nps_link` é preenchido e manda o template 54. O botão do template aponta para `object.x_nps_link`.

Quando falta algo, o site não grava nada e deixa uma nota interna "Link de NPS não gerado: <motivo>. Corrija e dispare o envio de novo.". Lead inexistente, arquivado ou que já tem link não ganha nota.

O link nunca volta na resposta do webhook. Se alguém descobrir o segredo, o máximo que consegue é fazer o site gerar, uma única vez, o link de um cliente elegível, e esse link fica gravado no lead dele. Um webhook repetido não sobrescreve o link, então não sai um segundo e-mail. Um lock no Redis (10 min por lead) cobre duas chamadas simultâneas.

**Reenviar:** apague `x_nps_link` no lead e rode a ação 817 de novo (ou espere a regra). O link antigo continua valendo até expirar ou ser usado.

## O que o Felipe cria no Cloudflare Pages

Projeto do site → Settings → Environment variables → **Production** e **Preview**, como segredo (encrypted):

| Variável | Para quê | Como gerar |
|---|---|---|
| `NPS_LINK_WEBHOOK_SECRET` | Autentica o webhook do Odoo | `openssl rand -hex 32` |
| `NPS_INVITE_SECRET` | Assina o convite (já exigido pelo `/nps`) | `openssl rand -hex 32` |

Em 11/11/2026, `GET /nps?token=abc.def` em produção devolveu os cookies do convite em vez de "Link inválido". Esse é o comportamento de quando `NPS_INVITE_SECRET` não existe (`lib/nps-invite-redirect.ts`). Se ele de fato faltar, o `/api/submit-nps` também responde 500 hoje. Confira e crie se não existir. Se já existir, **não troque**: trocar invalida os links já enviados.

Os valores não vão para chat, template, planilha nem para o repositório. O `NPS_LINK_WEBHOOK_SECRET` vai também para a URL da ação 817 no Odoo (passo 2 abaixo), e só para lá. Depois de criar ou mudar variável, é preciso um deploy novo para a função ler o valor.

Nada muda em `wrangler.toml`, Redis ou banco. As chaves novas no Redis são só o lock `nps:link:lead:<id>` (TTL 10 min) e o rate limit `ratelimit:nps-link-hook`.

## O que muda no Odoo (Amadeus)

1. **Campo novo** em `crm.lead`: `x_nps_link`, tipo Char (texto), rótulo "Link do NPS". Não precisa ficar na tela. Se ficar, que seja só leitura.
2. **Ação 817** (da regra 10): tipo "Send Webhook Notification", URL `https://www.anhanga.tur.br/api/nps-link-hook?secret=<valor de NPS_LINK_WEBHOOK_SECRET>`. Sem campos no payload: o `_id` e o `_model` já vão sempre. O gatilho e o domínio da regra 10 ficam como estão.
3. **Regra 10b** (nova) em `crm.lead`:
   - gatilho "Ao atualizar" (`on_create_or_write`) com campo de gatilho `x_nps_link`;
   - antes da atualização: `[('x_nps_link', '=', False)]`;
   - depois da atualização: `[('x_nps_link', '!=', False), ('stage_id', '=', 4), ('email_from', '!=', False)]`, mais as exclusões que a regra 10 já tem;
   - ação: enviar e-mail com o template 54.
4. **Template 54**: o botão passa de `href="https://anhanga.tur.br/nps"` para `t-att-href="object.x_nps_link"`. Não pôr `firstname`, e-mail nem outro parâmetro na URL.

## Teste (só com felipewilliam@gmail.com)

Primeiro no preview do PR (`https://<branch>.av-site-8ex.pages.dev`), com os dois segredos em Preview. A URL da ação aponta para o preview só durante o teste.

1. Lead de teste com `email_from = felipewilliam@gmail.com`, Ganho, `x_data_de_retorno` = hoje − 2 dias e `x_nps_link` vazio.
2. Rodar a ação 817 no lead. Esperado: `x_nps_link` preenchido, nota "Link de NPS gerado…" e e-mail do template 54 na caixa do felipewilliam@gmail.com.
3. Abrir o link: o formulário cumprimenta pelo primeiro nome. Responder e conferir `x_nps_score` no contato.
4. Abrir o link de novo e responder: "link inválido ou expirado".
5. Rodar a ação 817 de novo: nada muda e não sai segundo e-mail.
6. Retorno há 40 dias, ou sem e-mail: nota "Link de NPS não gerado…" e nenhum e-mail.
7. `curl -X POST '<site>/api/nps-link-hook?secret=errado' -d '{}'`: `401`.

Depois, apontar a ação 817 para `https://www.anhanga.tur.br/...` e repetir os passos 1 a 3 em produção antes do primeiro envio real (por volta de 02/12).

## Respostas do webhook

| Status | `code` | Quando |
|---|---|---|
| 202 | — | Aceito. O resultado aparece no lead (campo ou nota) |
| 400 | `VALIDATION_ERROR` | Corpo sem `_model = crm.lead` e `_id` inteiro |
| 401 | `UNAUTHORIZED` | `secret` ausente ou errado |
| 405 | `METHOD_NOT_ALLOWED` | Não é POST |
| 429 / 503 | `RATE_LIMIT_EXCEEDED` / `SERVICE_UNAVAILABLE` | Mais de 60 por minuto por IP / Redis fora |
| 500 | `CONFIG_ERROR` | Falta `NPS_LINK_WEBHOOK_SECRET` |

Falta de `NPS_INVITE_SECRET` ou das variáveis `ODOO_*` não aparece na resposta, que sai antes. Aparece como `NPS_LINK config_missing` nos logs e no Sentry, e o lead fica sem link e sem nota.
