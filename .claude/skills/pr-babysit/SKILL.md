---
name: pr-babysit
description: Monitora uma PR até ficar pronta para o merge humano — CI, reviews do gemini-code-assist e merge conflicts — usando Monitor em background. Use quando o usuário pedir para monitorar, acompanhar ou "babysit" uma PR ("continuar monitorando a PR #N", "acompanha até o CI passar", "avisa quando a PR estiver pronta"), ou logo após criar uma PR que precisa de acompanhamento até o merge.
---

# PR Babysit

Acompanha uma PR do repositório até o estado **"pronta para merge"** e então **para**. O merge é sempre humano (squash) — esta skill nunca executa `gh pr merge`.

Uma PR está pronta quando, simultaneamente: (1) todos os checks verdes, (2) nenhum comentário de review não tratado (inclusive do `gemini-code-assist`, que chega *depois* do CI verde), (3) `mergeable` sem conflitos.

## Passos

1. **Identificar a PR.** Se o usuário não deu o número, use `gh pr view --json number,headRefName` na branch atual. Guarde `OWNER/REPO` e `N`.

2. **Estado inicial.** Uma passada síncrona antes de armar o monitor:
   - `gh pr checks N` — se algo já falhou, vá direto ao passo 4.
   - `gh api repos/OWNER/REPO/pulls/N/comments` e `gh api repos/OWNER/REPO/pulls/N/reviews` — se já há reviews não tratados, vá direto ao passo 5.
   - `gh pr view N --json mergeable` — se há conflito, passo 6.
   - Atenção: `gh pr checks` retorna **exit code 8** quando o CodeQL (default setup) fica em "skipping"/neutral — isso **não é falha**; avalie o JSON, não o exit code.

3. **Armar o Monitor** (ferramenta Monitor, background — nunca `sleep` em foreground, o sandbox bloqueia). Um único monitor cobrindo todos os estados terminais:

   ```bash
   PR=N; REPO=OWNER/REPO; last_comment=""
   while true; do
     # Falha de rede/rate-limit NUNCA pode virar evento: em erro, aguardar e tentar de novo.
     checks=$(gh pr checks "$PR" --repo "$REPO" --json name,bucket 2>/dev/null)
     if [ $? -ne 0 ] || [ -z "$checks" ]; then sleep 10; continue; fi
     fail=$(jq -r '[.[] | select(.bucket=="fail")] | length' <<<"$checks")
     pending=$(jq -r '[.[] | select(.bucket=="pending")] | length' <<<"$checks")
     [ "$fail" -gt 0 ] && { echo "CI_FAIL: $(jq -r '[.[] | select(.bucket=="fail") | .name] | join(",")' <<<"$checks")"; break; }
     newc=$(gh api "repos/$REPO/pulls/$PR/comments" --jq 'map(.id) | max // 0' 2>/dev/null)
     if [ $? -ne 0 ] || [ -z "$newc" ]; then sleep 10; continue; fi
     if [ -n "$last_comment" ] && [ "$newc" != "$last_comment" ]; then echo "NEW_REVIEW_COMMENT"; break; fi
     last_comment=$newc
     m=$(gh pr view "$PR" --repo "$REPO" --json mergeable --jq .mergeable 2>/dev/null)
     if [ $? -ne 0 ] || [ -z "$m" ]; then sleep 10; continue; fi
     [ "$m" = "CONFLICTING" ] && { echo "MERGE_CONFLICT"; break; }
     [ "$pending" -eq 0 ] && { echo "ALL_GREEN"; break; }
     sleep 60
   done
   ```

   O script **sai** em qualquer estado acionável (uma notificação por evento); re-arme após tratar cada evento.

4. **Evento `CI_FAIL`:** `gh run view <id> --log-failed` para o log, corrigir na branch, commit + push, voltar ao passo 3.

5. **Evento `NEW_REVIEW_COMMENT` / reviews pendentes:** ler cada comentário (`.../pulls/N/comments` e `.../pulls/N/reviews`). Seguir a skill `receiving-code-review`: avaliar tecnicamente antes de aplicar — nem todo apontamento do bot é válido. Aplicar os legítimos, responder aos dispensados com justificativa (`gh api .../comments/<id>/replies` ou comentário na PR), commit + push, voltar ao passo 3.

6. **Evento `MERGE_CONFLICT`:** `git fetch origin && git merge origin/main`, resolver, push, voltar ao passo 3.

7. **Evento `ALL_GREEN`:** conferir uma última vez reviews e mergeable (o gemini pode ter comentado no intervalo). Se tudo limpo: enviar PushNotification "PR #N pronta para seu merge" (se disponível), resumir para o usuário o que foi tratado no ciclo (fixes de CI, reviews aplicados/dispensados) e **encerrar**. Não mergear, não perguntar "posso mergear?".

## Regras

- Nunca `gh pr merge` — política do repo: squash-merge humano.
- Nunca `sleep` em foreground para esperar CI.
- CodeQL "skipping" ≠ falha (exit 8 do `gh pr checks`).
- Se o monitor expirar sem evento (timeout), re-armar em vez de abandonar.
- Máximo de 3 ciclos de correção de CI para a mesma falha; se persistir, parar e reportar ao usuário com o log.
