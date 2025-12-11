# Research: Technical Debt & Code Quality Review

**Date**: 2025-12-11
**Branch**: 004-code-quality

## Scope

Análise de 23 arquivos TypeScript em `src/lib/` (excluindo `src/lib/editor/`).

## 1. Magic Numbers & Constants Audit

### 1.1 Constants Already Well-Defined

Estes já seguem boas práticas (exported, named, documented):

| File | Constant | Value | Notes |
|------|----------|-------|-------|
| `render/renderer.ts` | `TILE_SIZE` | 16 | ✅ Exported, usado em múltiplos arquivos |
| `game/loop.ts` | `TICKS_PER_SECOND` | 60 | ✅ Exported, base para timing |
| `game/loop.ts` | `MS_PER_TICK` | 1000/60 | ✅ Derived, exported |
| `components/gnome.ts` | `GNOME_SPEED` | 0.1 | ✅ Exported, documented |
| `components/gnome.ts` | `GNOME_MINE_RATE` | 1 | ✅ Exported |
| `components/camera.ts` | `MIN_ZOOM` | 0.25 | ✅ Exported |
| `components/camera.ts` | `MAX_ZOOM` | 4.0 | ✅ Exported |
| `components/camera.ts` | `CAMERA_LERP_SPEED` | 0.1 | ✅ Exported |
| `game/commands.ts` | `GameSpeed` enum | 1,2,3,4 | ✅ Enum pattern correto |

### 1.2 Constants to Centralize

Estes estão definidos localmente mas poderiam beneficiar de centralização:

| File | Constant | Value | Recommendation |
|------|----------|-------|----------------|
| `input/handler.ts` | `DOUBLE_CLICK_TIMEOUT` | 300 | → `config/timing.ts` |
| `input/handler.ts` | `PAN_SPEED` | 8 | → `config/input.ts` |
| `render/renderer.ts` | `SELECTION_COLOR` | 0xffff00 | → `config/colors.ts` |
| `render/renderer.ts` | `SELECTION_ALPHA` | 0.3 | → `config/colors.ts` |
| `render/renderer.ts` | `TASK_MARKER_COLOR` | 0xff0000 | → `config/colors.ts` |
| `render/renderer.ts` | `TASK_MARKER_ALPHA` | 0.5 | → `config/colors.ts` |
| `render/renderer.ts` | `backgroundColor` | 0x87ceeb | → `config/colors.ts` (SKY_COLOR) |
| `systems/physics.ts` | `GRAVITY` | 0.02 | → `config/physics.ts` |
| `systems/physics.ts` | `TERMINAL_VELOCITY` | 0.5 | → `config/physics.ts` |
| `systems/pathfinding.ts` | `COST_*` constants | 1-5 | Manter local (específico do sistema) |

### 1.3 Colors Audit

| File | Color | Hex Value | Purpose |
|------|-------|-----------|---------|
| `render/renderer.ts` | SELECTION_COLOR | 0xffff00 | Yellow selection highlight |
| `render/renderer.ts` | TASK_MARKER_COLOR | 0xff0000 | Red task indicator |
| `render/renderer.ts` | backgroundColor | 0x87ceeb | Sky blue background |
| `components/gnome.ts` | GNOME_COLOR | 0x00ff00 | Green gnome placeholder |
| `components/tile.ts` | Air color | 0x87ceeb | Sky (same as background) |
| `components/tile.ts` | Dirt color | 0x8b4513 | Brown dirt |
| `components/tile.ts` | Stone color | 0x808080 | Gray stone |

**Decision**: Criar `config/colors.ts` para UI colors (selection, markers, background). Tile colors permanecem em `TILE_CONFIG` pois são parte do data model.

## 2. Code Duplication Analysis

### 2.1 Patterns Already Centralized ✅

- `screenToTile()` - já centralizado em `renderer.ts`
- `getVisibleBounds()` - já centralizado em `renderer.ts`
- Entity creation - já centralizado em `ecs/world.ts`

### 2.2 Potential Duplications (Low Priority)

Após análise, não há duplicações significativas. O código está relativamente DRY.

Padrões que se repetem mas são específicos de contexto:
- Iteração sobre Maps de componentes (padrão ECS normal)
- Verificações de bounds (específicas de cada sistema)

**Decision**: Não criar abstrações desnecessárias. Código atual é aceitável.

## 3. Nomenclature & Structure Consistency

### 3.1 Component Files Analysis

| File | Has Interface | Has Factory | Has Constants | Exports |
|------|---------------|-------------|---------------|---------|
| `position.ts` | ✅ Position | ✅ createPosition | ❌ | Named |
| `velocity.ts` | ✅ Velocity | ✅ createVelocity | ❌ | Named |
| `gnome.ts` | ✅ Gnome | ✅ createGnome | ✅ GNOME_* | Named |
| `tile.ts` | ✅ Tile | ✅ createTile | ✅ TileType, TILE_CONFIG | Named |
| `task.ts` | ✅ Task | ✅ create*Task | ✅ TaskType, TaskPriority | Named |
| `camera.ts` | ✅ Camera | ✅ createCamera | ✅ *_ZOOM, LERP | Named |

**Finding**: Estrutura consistente! Todos seguem padrão: Interface + Factory + Constants (quando aplicável) + Named exports.

### 3.2 System Files Analysis

| File | Has Main Function | Has Helper Functions | Has Constants | Documentation |
|------|-------------------|---------------------|---------------|---------------|
| `physics.ts` | ✅ physicsSystem | ✅ applyGravity, etc | ✅ GRAVITY, etc | ✅ JSDoc |
| `mining.ts` | ✅ miningSystem | ✅ helpers | ❌ | ✅ JSDoc |
| `task-assignment.ts` | ✅ taskAssignmentSystem | ✅ helpers | ❌ | ✅ JSDoc |
| `pathfinding.ts` | ✅ findPath | ✅ helpers | ✅ COST_* | ✅ JSDoc |

**Finding**: Estrutura consistente! Sistemas exportam função principal + helpers internos.

### 3.3 Naming Convention Check

| Convention | Status | Notes |
|------------|--------|-------|
| camelCase for functions | ✅ Consistent | `createGnome`, `physicsSystem`, `findPath` |
| PascalCase for types | ✅ Consistent | `GameState`, `Position`, `Gnome` |
| UPPER_SNAKE_CASE for constants | ✅ Mostly | Algumas constantes locais usam `const name` |

**Decision**: Nomenclatura já está boa. Apenas garantir que constantes extraídas sigam UPPER_SNAKE_CASE.

## 4. Type Safety Analysis

### 4.1 Usage of 'any'

```bash
grep -rn ": any" src/lib --include="*.ts" | grep -v editor
# Result: NONE
```

**Finding**: Zero uso de `any` no código do jogo. ✅

### 4.2 Implicit Types Check

Verificação manual de arquivos críticos:
- Funções públicas têm tipos de retorno explícitos ✅
- Parâmetros de função têm tipos explícitos ✅
- Interfaces estão bem definidas ✅

**Finding**: Type safety já está boa. Apenas verificar edge cases durante refatoração.

## 5. Summary & Recommendations

### High Priority (P1) - Centralizar Constantes

1. Criar `src/lib/config/colors.ts`:
   - UI colors (SELECTION, TASK_MARKER, SKY)
   - Export all as named constants

2. Criar `src/lib/config/timing.ts`:
   - DOUBLE_CLICK_TIMEOUT
   - Re-export TICKS_PER_SECOND, MS_PER_TICK from loop.ts

3. Criar `src/lib/config/physics.ts`:
   - GRAVITY, TERMINAL_VELOCITY
   - Mover de systems/physics.ts

4. Criar `src/lib/config/input.ts`:
   - PAN_SPEED
   - Mover de input/handler.ts

### Medium Priority (P2) - Não há duplicações significativas

- Código já está relativamente DRY
- Não criar abstrações desnecessárias (YAGNI)

### Low Priority (P3) - Estrutura já consistente

- Nomenclatura já segue convenções
- Estrutura de arquivos já é previsível

### P4 - Type Safety já está boa

- Zero 'any' types
- Tipos explícitos em funções públicas

## Decisions Made

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Criar `config/` directory | Centraliza constantes sem alterar estrutura existente | Usar barrel file único (rejeitado: menos organizado) |
| Manter tile colors em TILE_CONFIG | São parte do data model, não UI config | Extrair para colors.ts (rejeitado: quebra coesão) |
| Não criar utils para iteração de Maps | Padrão ECS é claro, abstração desnecessária | Criar helpers genéricos (rejeitado: YAGNI) |
| Manter pathfinding COST_* locais | Específicos do sistema, não reutilizados | Centralizar (rejeitado: acoplamento desnecessário) |
