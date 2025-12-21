# Climbing Mechanics

**Priority**: High
**Type**: Core Gameplay
**Dependencies**: 010-background-blocks-horizon

## Summary

Implementar sistema de escalada para gnomes, permitindo subir/descer terrenos verticais com penalidades de velocidade e risco de queda.

## Motivation

- Gnomes atualmente ficam presos em buracos
- Escalada adiciona profundidade estratégica (construir escadas vs arriscar)
- Mecânica central de jogos como Craft the World e Terraria
- Cria necessidade para estruturas de suporte (escadas)

## Proposed Solution

### Prioridade de Escalada (ordem de preferência)
1. **Lateral de blocos** - bordas de foreground blocks
2. **Face de background blocks** - construídos ou naturais
3. **Cave background** - permanente, apenas abaixo do horizonte
4. **Estruturas** - escadas, andaimes (feature futura)
5. ~~Sky background~~ - NUNCA escalável

### Parâmetros de Escalada
```typescript
interface ClimbingConfig {
  // Velocidade relativa à caminhada normal
  climbSpeed: 0.3;           // 30% da velocidade normal

  // Chance de queda por tick enquanto escalando
  fallChancePerTick: 0.001;  // ~6% chance em 60 ticks

  // Modificadores por tipo de superfície
  surfaceModifiers: {
    blockEdge: { speed: 1.0, fallChance: 1.0 },
    backgroundBlock: { speed: 0.8, fallChance: 1.2 },
    caveBackground: { speed: 0.6, fallChance: 1.5 },
  };
}
```

### Sistema de Queda e Dano
- Queda de 3+ tiles causa dano
- Dano = (altura - 2) * 10 HP
- Gnomes têm HP (nova propriedade)
- HP = 0 significa gnome incapacitado (não morre, precisa resgate)

### Mudanças no Pathfinding
- Pathfinding considera escalada como opção
- Custo de pathfinding maior para escalada (penalidade de tempo)
- Preferir rotas com escadas quando disponíveis

### Estados do Gnome
- Adicionar `GnomeState.Climbing`
- Animação diferente para escalada (se sprites disponíveis)

## Acceptance Criteria

- [ ] Gnomes podem escalar laterais de blocos
- [ ] Gnomes podem escalar background blocks
- [ ] Gnomes podem escalar cave background (abaixo horizonte)
- [ ] Gnomes NÃO escalam sky background (acima horizonte)
- [ ] Velocidade de escalada reduzida (30%)
- [ ] Chance de queda durante escalada
- [ ] Sistema de dano por queda implementado
- [ ] Pathfinding considera rotas de escalada

## Notes

- Escadas (012) eliminam risco de queda e aumentam velocidade
- Considerar feedback visual quando gnome está prestes a cair
- Som de "escorregando" antes de queda seria bom UX
