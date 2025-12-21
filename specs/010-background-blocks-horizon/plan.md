# Implementation Plan: Background Blocks & Horizon System

**Branch**: `010-background-blocks-horizon` | **Date**: 2025-12-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-background-blocks-horizon/spec.md`

## Summary

Implementar sistema de camadas de terreno com background blocks e horizonte, adicionando profundidade visual ao mundo. Quando foreground blocks são minerados, background blocks ficam visíveis por trás. O horizonte divide o mundo em superfície (com céu) e subterrâneo (com rocha de caverna).

**Technical Approach**: Adicionar nova camada de dados (`backgroundTileGrid`) ao GameState, estender o renderer com container dedicado para backgrounds, e modificar o world generator para criar background blocks junto com foreground.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: SvelteKit 2.x, PixiJS v8 (rendering)
**Storage**: LocalStorage (JSON serialization via existing save/load)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Web browser (modern ES2020+)
**Project Type**: Single SvelteKit application
**Performance Goals**: 60 FPS com 10.000 tiles visíveis (foreground + background)
**Constraints**: Deterministic game state, ECS architecture, JSON-serializable state
**Scale/Scope**: 100x50 tile worlds (5.000 tiles foreground + 5.000 background)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Type Safety First** | ✅ PASS | BackgroundTile terá tipos explícitos, novo enum para PermanentBackgroundType |
| **II. Entity-Component Architecture** | ✅ PASS | Background blocks serão componentes puros, sem métodos, sistemas stateless |
| **III. Documentation as Specification** | ✅ PASS | spec.md completo, plan.md em criação |
| **IV. Simplicity and YAGNI** | ✅ PASS | Reutiliza TileType existente, sem abstrações desnecessárias |
| **V. Deterministic Game State** | ✅ PASS | backgroundTileGrid será serializado igual a tileGrid, horizonY configurável |

**Gate Result**: PASSED - Nenhuma violação detectada.

## Project Structure

### Documentation (this feature)

```text
specs/010-background-blocks-horizon/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no external APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   ├── tile.ts                    # MODIFY: Add BackgroundTile interface
│   │   └── background.ts              # NEW: PermanentBackgroundType enum
│   ├── config/
│   │   └── colors.ts                  # MODIFY: Add background colors
│   ├── game/
│   │   └── state.ts                   # MODIFY: Add backgroundTileGrid, horizonY
│   ├── world-gen/
│   │   └── generator.ts               # MODIFY: Generate background blocks
│   ├── render/
│   │   └── renderer.ts                # MODIFY: Add background rendering layer
│   └── systems/
│       └── mining.ts                  # MODIFY: Support background mining
```

**Structure Decision**: Extensão do projeto existente seguindo padrões estabelecidos. Novos arquivos apenas quando necessário (background.ts). Modificações em arquivos existentes para manter coesão.

## Complexity Tracking

> Nenhuma violação de constitution detectada.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |

## Phase 0: Research

**Output**: [research.md](./research.md)

Análise completa da codebase existente e decisões técnicas:
- Rendering system (PixiJS containers, dirty checking, frustum culling)
- World generation (column-by-column, noise-based surface)
- Game state (ECS patterns, serialization)
- Mining system (durability-based, resource drops)

**Key Decisions:**
1. Grid separado para backgrounds (`backgroundTileGrid`)
2. Permanent background como fills (não tiles individuais)
3. Background colors = foreground * 0.6 (60% brightness)
4. Horizon como valor configurável na WorldConfig

## Phase 1: Design Artifacts

### Data Model

**Output**: [data-model.md](./data-model.md)

Definições TypeScript completas:
- `PermanentBackgroundType` enum (Sky, Cave)
- `BackgroundTile` interface
- `GameState` extensions (backgroundTileGrid, backgroundTiles, horizonY)
- ECS functions (get/set/add/remove/update)
- Serialization format
- Mining target resolution

### Quickstart Guide

**Output**: [quickstart.md](./quickstart.md)

Guia de implementação com:
- Architecture summary (container hierarchy)
- Implementation order (7 steps)
- Code snippets para cada componente
- Testing checklist
- Common pitfalls

### Contracts

**Output**: N/A - Esta feature não expõe APIs externas.

## Implementation Summary

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/components/background.ts` | PermanentBackgroundType enum |
| `src/lib/ecs/background.ts` | Background ECS functions |

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/components/tile.ts` | Add BackgroundTile interface |
| `src/lib/config/colors.ts` | Add background colors, darken function |
| `src/lib/game/state.ts` | Add backgroundTileGrid, backgroundTiles, horizonY |
| `src/lib/world-gen/generator.ts` | Generate backgrounds with foreground |
| `src/lib/render/renderer.ts` | Add background containers, rendering |
| `src/lib/systems/mining.ts` | Support background mining |

### Implementation Order

1. **Types** - background.ts, tile.ts (BackgroundTile)
2. **Colors** - colors.ts (background colors)
3. **State** - state.ts (grid, Map, horizonY)
4. **ECS** - background.ts (CRUD functions)
5. **Generation** - generator.ts (create backgrounds)
6. **Rendering** - renderer.ts (containers, draw logic)
7. **Mining** - mining.ts (layer priority, no drops)
8. **Persistence** - state.ts (serialize/deserialize)

## Next Steps

Execute `/speckit.tasks` para gerar o arquivo tasks.md com tarefas detalhadas e ordenadas por dependência.
