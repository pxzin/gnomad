# Feature Idea: Resource System

**Status**: Backlog
**Priority**: TBD
**Created**: 2025-12-11

## Problema

Atualmente quando um gnome minera um tile, ele simplesmente vira `air` e desaparece. Nenhum recurso é coletado ou armazenado.

## Proposta

Implementar sistema de coleta e armazenamento de recursos.

## Escopo Sugerido

### 1. Drop de Recursos
- Tiles dropam recursos ao serem minerados
  - Dirt → Terra (dirt resource)
  - Stone → Pedra (stone resource)
- Recursos ficam no chão como entidades no mundo

### 2. Coleta de Recursos
- Gnomes coletam recursos automaticamente ao passar por cima
- OU nova tarefa HAUL (transportar) para levar recursos a um local

### 3. Armazenamento
- Sistema de inventário/stockpile
- Área designada para armazenar recursos
- Contagem de recursos disponíveis

## Dependências

- Nenhuma (pode ser implementado sobre o sistema atual)

## Notas

- Este sistema é pré-requisito para construção (usar recursos para construir)
- Fecha o loop: Minerar → Coletar → (futuro: Construir)
