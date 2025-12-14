# Colorblind-Friendly Priority Indicators

**Priority**: Medium
**Type**: Accessibility / UX
**Related**: 008-task-priority

## Summary

Implementar representação visual alternativa para prioridades de tasks que não dependa exclusivamente de cores, garantindo acessibilidade para pessoas com daltonismo (color blindness).

## Motivation

- Aproximadamente 8% dos homens e 0.5% das mulheres têm alguma forma de daltonismo
- A implementação atual usa apenas cores (Red, Yellow, Blue, Gray) para diferenciar prioridades
- Jogadores daltônicos terão dificuldade em distinguir níveis de prioridade
- Acessibilidade é uma boa prática de design inclusivo

## Proposed Solutions

### Opção A: Ícones/Símbolos
- Urgent: Cor + símbolo "!!" ou seta dupla para cima
- High: Cor + símbolo "!" ou seta para cima
- Normal: Cor sem símbolo adicional
- Low: Cor + seta para baixo

### Opção B: Formas Geométricas
- Urgent: Losango/diamante
- High: Triângulo
- Normal: Círculo (atual)
- Low: Quadrado

### Opção C: Padrões/Texturas
- Usar padrões (listras, pontilhado) além de cores sólidas

### Opção D: Toggle de Acessibilidade
- Adicionar opção nas configurações para "Modo Alto Contraste" ou "Modo Daltônico"
- Substitui ou complementa cores com símbolos/formas

## Notes

- Considerar implementar como opção de acessibilidade nas configurações do jogo
- Manter cores como padrão, mas permitir alternativas
- Pesquisar padrões de acessibilidade em jogos similares (Factorio, Dwarf Fortress, RimWorld)
