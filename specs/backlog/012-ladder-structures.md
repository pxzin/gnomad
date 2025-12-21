# Ladder Structures

**Priority**: Medium
**Type**: Gameplay Feature
**Dependencies**: 010-background-blocks-horizon, 011-climbing-mechanics

## Summary

Implementar escadas como estruturas craftáveis que permitem escalada segura e mais rápida.

## Motivation

- Escadas eliminam risco de queda durante escalada
- Diferentes materiais oferecem velocidades diferentes
- Adiciona progressão ao jogo (escadas melhores com recursos melhores)
- Incentiva planejamento de infraestrutura na colônia

## Proposed Solution

### Tipos de Escada

| Material | Velocidade | Custo de Craft | Durabilidade |
|----------|------------|----------------|--------------|
| Madeira  | 1.0x       | 2 Wood         | 100 usos     |
| Pedra    | 1.3x       | 3 Stone        | 500 usos     |
| Ferro    | 1.6x       | 2 Iron         | Infinita     |
| Aço      | 2.0x       | 2 Steel        | Infinita     |

### Propriedades das Escadas

- Colocadas em background blocks (não em foreground)
- Ocupam 1 tile de altura
- Podem ser empilhadas verticalmente
- Gnomes automaticamente usam escadas quando disponíveis
- Pathfinding prefere rotas com escadas

### Colocação

- Requer background block ou cave background no tile
- Não pode ser colocada no sky background
- Player seleciona escada no inventário e clica no tile destino
- Preview visual mostra se colocação é válida (como buildings)

### Uso pelos Gnomes

- Gnomes sobem/descem escadas automaticamente
- Velocidade de escalada multiplicada pelo tipo de escada
- Zero chance de queda em escadas
- Animação específica de subir escada (se disponível)

### Sistema de Durabilidade (Madeira/Pedra)

- Cada uso (gnome passa pela escada) reduz durabilidade
- Escada quebra quando durabilidade = 0
- Recurso parcialmente recuperado quando quebra (50%)
- Visual feedback quando escada está danificada

## Acceptance Criteria

- [ ] Escadas podem ser craftadas com diferentes materiais
- [ ] Escadas colocadas em background blocks
- [ ] Gnomes usam escadas automaticamente
- [ ] Velocidade aumentada conforme material
- [ ] Zero risco de queda em escadas
- [ ] Sistema de durabilidade para madeira/pedra
- [ ] Pathfinding prefere rotas com escadas

## Notes

- Requer sistema de crafting básico (pode ser simplificado inicialmente)
- Considerar andaimes como estrutura relacionada (horizontal)
- Elevadores/plataformas móveis seriam evolução futura
