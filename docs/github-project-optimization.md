# Optimized GitHub Project Views

## View 1: "🚀 Sprint Atual"
**Filtro:** Status = "In Progress" OR Status = "Review"  
**Ordenação:** Priority (P0 → P3)  
**Uso:** Foco diário no que está sendo trabalhado

## View 2: "📋 Próximas Tarefas"  
**Filtro:** Status = "Ready" OR Status = "Backlog"  
**Ordenação:** Priority DESC, Estimate ASC  
**Uso:** Planning e priorização

## View 3: "✅ Done Esta Semana"
**Filtro:** Status = "Done" AND updated >= @startOfWeek  
**Ordenação:** Updated DESC  
**Uso:** Acompanhar velocidade

## View 4: "🐛 Bugs Críticos"
**Filtro:** Label = "bug" AND Priority = "P0"  
**Ordenação:** Created ASC  
**Uso:** Firefighting

## Webhook Discord
- Notifica quando issue muda status
- Alerta novos bugs P0
- Resumo diário de done

## Script: project-metrics.sh
```bash
# Velocity semanal
# Burndown simples
# Issues por label/priority
```

---
Automatizado por Amadeus 🤖