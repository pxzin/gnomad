# Background Blocks & Horizon System

**Priority**: High
**Type**: Core Architecture
**Dependencies**: None

## Summary

Implementar sistema de camadas de terreno inspirado em Craft the World, com background blocks e conceito de horizonte que divide o mundo em zona de superfície e subterrâneo.

## Motivation

- Background blocks adicionam profundidade visual ao mundo
- Permitem construção mais complexa (paredes, estruturas internas)
- Horizonte define comportamentos diferentes para superfície vs cavernas
- Base necessária para mecânicas de escalada e construção futuras

## Proposed Solution

### Camadas do Terreno
```
ACIMA DO HORIZONTE:
  - Foreground Block (sólido, minerável)
  - Background Block (minerável/construível)
  - Sky Background (permanente, NÃO escalável)

ABAIXO DO HORIZONTE:
  - Foreground Block (sólido, minerável)
  - Background Block (minerável/construível)
  - Cave Background (permanente, escalável)
```

### Mudanças no Data Model
- Adicionar `backgroundTileGrid` ao GameState
- Adicionar `horizonY` ao WorldConfig
- Background blocks têm tipos: `BackgroundDirt`, `BackgroundStone`, `Sky`, `Cave`

### World Generation
- Gerar background blocks junto com foreground
- Definir horizonte baseado no nível do solo
- Quando foreground é minerado, background fica visível

### Renderização
- Nova camada de render para backgrounds (atrás de tiles, atrás de entidades)
- Cores mais escuras/dessaturadas para backgrounds
- Transição visual clara entre sky e cave no horizonte

## Acceptance Criteria

- [ ] Background blocks renderizam atrás de foreground
- [ ] Horizonte visível na transição sky/cave
- [ ] Minerar tile revela background por trás
- [ ] Background blocks podem ser minerados separadamente
- [ ] Sky background claramente diferente de cave background

## Notes

Esta feature é pré-requisito para:
- 011-climbing-mechanics (escalada depende do tipo de background)
- 012-ladder-structures (escadas colocadas em backgrounds)
