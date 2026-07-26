# Automação de posts sociais no publish do blog

> **TODO(dead code):** o workflow n8n que receberia este webhook nunca foi
> implementado. A divulgação social de posts do blog passou a ser feita
> manualmente via Postiz (ver conversa de 26/07/2026). Deletar este doc
> junto com `.github/workflows/notify-social-automation.yml`,
> `scripts/notify-blog-published.ts`, `lib/social-announcement.ts` e os
> testes correspondentes (`tests/notify-blog-published.test.ts`,
> `tests/social-announcement.test.ts`,
> `tests/notify-social-automation-workflow.test.ts`).

## Escopo

Só o publish de um novo post do blog é automatizado. Posts sociais avulsos
(sem artigo por trás) são agendados direto no calendário do
[Postiz](https://github.com/gitroomhq/postiz-app) — sem pipeline custom, para
não duplicar o que a própria ferramenta já resolve.

## Fluxo

1. `.github/workflows/notify-social-automation.yml` dispara em todo `push` em
   `main` que toca `content/blog/**.mdx`.
2. O job diferencia arquivos **novos** (`git diff --diff-filter=A`) dos só
   editados — só posts novos disparam anúncio.
3. `scripts/notify-blog-published.ts` lê o frontmatter de cada post novo,
   monta o payload via `lib/social-announcement.ts` e faz `POST` para o
   webhook do n8n, autenticado com o mesmo header `X-Webhook-Secret` usado
   pelos outros webhooks do site (`N8N_WEBHOOK_SECRET`).
4. Do lado do n8n: o workflow recebe o payload, monta a copy por rede e chama
   a API pública do Postiz (ou o nó nativo N8N→Postiz) para agendar o
   anúncio no calendário editorial.

Se `N8N_SOCIAL_ANNOUNCE_WEBHOOK_URL` ou `N8N_WEBHOOK_SECRET` não estiverem
configurados, o script loga e sai sem erro — a automação é opcional até o
workflow do n8n existir do outro lado.

## Payload enviado ao n8n

```json
{
  "event": "blog_post_published",
  "slug": "5-segredos-da-disney-que-ninguem-conta",
  "title": "5 Segredos da Disney que Ninguém Conta",
  "excerpt": "Descubra como furar filas legalmente...",
  "url": "https://www.anhanga.tur.br/blog/5-segredos-da-disney-que-ninguem-conta/",
  "image": "https://media.anhanga.tur.br/images/blog/5-segredos-disney.jpg",
  "category": "Dicas de Expert",
  "tags": ["disney", "orlando"],
  "publishedAt": "2025-12-12"
}
```

## Secrets necessários (GitHub Actions → Settings → Secrets)

| Secret | Descrição |
|---|---|
| `N8N_SOCIAL_ANNOUNCE_WEBHOOK_URL` | URL do webhook trigger do workflow n8n que agenda o post no Postiz |
| `N8N_WEBHOOK_SECRET` | Já existente — reaproveitado como segredo compartilhado nesta chamada de saída |

Este é o único uso de `N8N_WEBHOOK_SECRET` fora do runtime da aplicação (os
demais handlers em `api/` o validam como segredo **de entrada**; aqui o
workflow do GitHub Actions o envia como segredo **de saída**, e o workflow do
n8n do outro lado deve validar o mesmo header antes de processar).
