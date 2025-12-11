# Implementation Plan: Technical Debt & Code Quality Review

**Branch**: `004-code-quality` | **Date**: 2025-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-code-quality/spec.md`

## Summary

Refatorar a codebase existente em `src/lib` (excluindo editor) para aplicar princípios DRY, centralizar constantes/magic numbers, padronizar estrutura de arquivos e melhorar type safety. Esta é uma refatoração de baixo risco focada em manutenibilidade sem alterar comportamento observável.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: SvelteKit 2.x, PixiJS v8
**Storage**: N/A (refatoração de código existente)
**Testing**: pnpm check (svelte-check), pnpm lint
**Target Platform**: Web (browser)
**Project Type**: Web application (SvelteKit)
**Performance Goals**: Manter performance existente (60 FPS target)
**Constraints**: Zero alteração de comportamento, todos os testes devem passar
**Scale/Scope**: ~30 arquivos em src/lib (excluindo editor)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Type Safety First** | ✅ ALIGNED | Esta feature reforça type safety - elimina 'any' e adiciona tipos explícitos |
| **II. Entity-Component Architecture** | ✅ ALIGNED | Não altera arquitetura ECS, apenas organiza código existente |
| **III. Documentation as Specification** | ✅ ALIGNED | Atualizará CLAUDE.md com padrões centralizados |
| **IV. Simplicity and YAGNI** | ✅ ALIGNED | Centralização reduz complexidade; não adiciona abstrações desnecessárias |
| **V. Deterministic Game State** | ✅ ALIGNED | Refatoração não altera lógica de game state |

**Gate Result**: PASSED - Nenhuma violação. Feature está totalmente alinhada com a constituição.

## Project Structure

### Documentation (this feature)

```text
specs/004-code-quality/
├── plan.md              # This file
├── research.md          # Phase 0: Análise do código existente
├── data-model.md        # Phase 1: Estrutura de constantes e configs
├── quickstart.md        # Phase 1: Guia de aplicação dos padrões
├── contracts/           # Phase 1: Convenções e templates
└── tasks.md             # Phase 2: Tarefas de refatoração
```

### Source Code (repository root)

```text
src/lib/
├── config/              # NEW: Constantes centralizadas
│   ├── constants.ts     # Valores numéricos (TILE_SIZE, PAN_SPEED, etc.)
│   ├── colors.ts        # Cores para rendering
│   └── timing.ts        # Delays, timeouts, velocidades
├── utils/               # NEW: Funções utilitárias compartilhadas
│   └── coordinates.ts   # Conversão de coordenadas
├── components/          # EXISTING: Componentes ECS (padronizar estrutura)
├── systems/             # EXISTING: Sistemas ECS (padronizar estrutura)
├── game/                # EXISTING: Game loop e state
├── input/               # EXISTING: Input handling
├── render/              # EXISTING: Rendering
├── ecs/                 # EXISTING: ECS core
└── world-gen/           # EXISTING: World generation
```

**Structure Decision**: Adicionar diretórios `config/` e `utils/` para centralização. Estrutura existente mantida, apenas reorganização interna dos arquivos.

## Complexity Tracking

> Nenhuma violação de constitution - tabela não necessária.

## Phase Summary

### Phase 0: Research
- Auditar código existente para identificar magic numbers
- Mapear duplicações de código
- Identificar inconsistências de nomenclatura e estrutura
- Catalogar usos de 'any' e tipos implícitos

### Phase 1: Design
- Definir estrutura de arquivos de configuração
- Criar templates de convenção para componentes e sistemas
- Documentar padrões no quickstart.md
