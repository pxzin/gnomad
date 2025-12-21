# Visual Style & Resolution

**Priority**: Medium
**Type**: Art Direction
**Dependencies**: 010-background-blocks-horizon (para testar camadas visuais)

## Summary

Definir o estilo visual final do jogo, incluindo resolução de tiles/sprites e direção artística geral.

## Motivation

- Estilo visual ainda não definido
- Resolução afeta complexidade de criação de assets
- Decisão impacta todas as futuras artes do jogo
- Background blocks (010) precisam de visual distinto

## Options Analysis

### Opção A: Low-Res (8x8 ou 16x16) - Estilo Lemmings

**Prós:**
- Menos pixels para desenhar por sprite
- Estética nostálgica/retrô
- Mais rápido para criar assets
- Funciona bem com animações simples

**Contras:**
- Difícil mostrar detalhes (equipamentos, expressões)
- Background blocks podem ser difíceis de distinguir
- Pode parecer "datado" para alguns jogadores

### Opção B: Mid-Res (16x16 atual, sprites 16x24)

**Prós:**
- Já implementado
- Balanço entre detalhe e simplicidade
- Sprites existentes funcionam

**Contras:**
- Pode ser limitado para personagens detalhados
- Background blocks precisam de design cuidadoso

### Opção C: High-Res (32x32 ou maior) - Estilo Craft the World

**Prós:**
- Muito espaço para detalhes
- Background blocks claramente visíveis
- Personagens podem ter personalidade visual
- Permite equipamentos e variações

**Contras:**
- 4x mais pixels por sprite (32x32 vs 16x16)
- Mais tempo para criar cada asset
- Requer redesenho de todos os assets atuais

## Proposed Process

1. **Implementar 010 (Background Blocks)** com assets placeholder
2. **Criar protótipos visuais** em cada resolução
3. **Testar gameplay** com cada estilo
4. **Decidir baseado em:**
   - Qual estilo "sente" melhor
   - Tempo disponível para criar arte
   - Legibilidade das camadas (foreground/background)

## Tasks

- [ ] Criar tileset de teste em 16x16 com backgrounds
- [ ] Criar tileset de teste em 32x32 com backgrounds
- [ ] Testar ambos no jogo
- [ ] Documentar decisão final
- [ ] Criar style guide para assets futuros

## Acceptance Criteria

- [ ] Resolução final definida e documentada
- [ ] Tileset base criado na resolução escolhida
- [ ] Sprite de gnome atualizado para resolução
- [ ] Background blocks visualmente distintos
- [ ] Style guide criado para consistência

## Notes

- O editor de pixel art (002) pode ser usado para criar os protótipos
- Considerar criar assets em alta resolução e fazer downscale se necessário
- Manter proporções consistentes (ex: personagem = 1.5x altura do tile)
