# Task Limit

**Priority**: Low
**Type**: Polish / Performance

## Summary

Limitar a quantidade máxima de tasks simultâneas no jogo.

## Motivation

- Não há necessidade real de permitir milhares de tasks simultâneas
- Limitar tasks reduz carga de CPU no sistema de task assignment
- Melhora UX ao forçar jogador a priorizar áreas de escavação

## Proposed Solution

- Adicionar constante `MAX_PENDING_TASKS` em `src/lib/config/performance.ts`
- Valor sugerido: 200-500 tasks
- Bloquear criação de novas tasks quando limite atingido
- Mostrar feedback visual no HUD quando limite atingido

## Notes

Por enquanto mantemos ilimitado para stress testing e identificação de gargalos de performance.
