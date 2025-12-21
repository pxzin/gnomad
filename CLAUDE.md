# Gnomes At Work - Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-11

## Active Technologies
- TypeScript 5.x (strict mode enabled) + SvelteKit 2.x, PixiJS v8, Svelte 5.x (005-performance-optimization)
- N/A (in-memory game state) (005-performance-optimization)
- Browser localStorage (existing serialization system) (006-resource-system)
- N/A (in-memory game state, localStorage for saves) (008-task-priority)

- TypeScript 5.x (strict mode enabled) + SvelteKit 2.x, Canvas 2D API (editing), PixiJS v8 (preview), browser-fs-access (file operations) (002-pixel-art-editor)
- JSON files (source assets), PNG files (exports), no database (002-pixel-art-editor)
- TypeScript 5.9.3 (strict mode enabled) + SvelteKit 2.48.5, Svelte 5.43.8, PixiJS 8.0.0, Vite 7.2.2 (003-game-hud)
- N/A (uses existing GameState in memory) (003-game-hud)
- TypeScript 5.x (strict mode enabled) + SvelteKit 2.x, PixiJS v8 (004-code-quality)
- N/A (refatoração de código existente) (004-code-quality)

- TypeScript 5.x (strict mode enabled) + SvelteKit 2.x (app framework), PixiJS v8 (2D rendering with WebGPU/WebGL) (001-colony-sim-core)

## Project Structure

```text
src/lib/
  config/        # Centralized constants (colors, physics, timing, input)
  components/    # ECS components (Position, Velocity, Gnome, Tile, etc.)
  systems/       # ECS systems (physics, mining, pathfinding, task-assignment)
  game/          # Game loop and state management
  render/        # PixiJS rendering
  input/         # Input handling
  ecs/           # Entity-component-system utilities
  world-gen/     # World generation
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (strict mode enabled): Follow standard conventions

## Recent Changes
- 011-climbing-mechanics: Added TypeScript 5.9.3 (strict mode enabled) + SvelteKit 2.48.5, Svelte 5.43.8, PixiJS 8.0.0
- 009-organic-idle-behavior: Added TypeScript 5.9.3 (strict mode enabled) + SvelteKit 2.48.5, Svelte 5.43.8, PixiJS 8.0.0
- 008-task-priority: Added TypeScript 5.9.3 (strict mode enabled) + SvelteKit 2.48.5, Svelte 5.43.8, PixiJS 8.0.0


<!-- MANUAL ADDITIONS START -->

## Design Principles

### DRY over Hardcoding

Avoid hardcoding values that may change or are used in multiple places. Instead:

- Use **enums** for discrete sets of values (e.g., `GameSpeed.Normal`, `GameSpeed.Fast`)
- Use **constants arrays** for iteration (e.g., `AVAILABLE_SPEEDS`)
- Use **lookup objects** for display values (e.g., `SPEED_LABELS`)

This allows changing values in one place without hunting through the codebase.

**Example pattern:**

```typescript
export enum GameSpeed {
  Normal = 1,
  Fast = 2,
  Faster = 3
}

export const AVAILABLE_SPEEDS: GameSpeed[] = [GameSpeed.Normal, GameSpeed.Fast, GameSpeed.Faster];

export const SPEED_LABELS: Record<GameSpeed, string> = {
  [GameSpeed.Normal]: '1x',
  [GameSpeed.Fast]: '2x',
  [GameSpeed.Faster]: '3x'
};
```

Balance KISS (Keep It Simple) with DRY (Don't Repeat Yourself) - simple code is good, but repeated magic values create maintenance burden.

### YAGNI for Abstractions

Don't create abstractions for patterns that repeat only 2-3 times. ECS iteration patterns (e.g., `for (const [entity, component] of state.components)`) are normal and don't need helper functions. Only abstract when:
- The same code appears 4+ times
- The pattern is complex (>5 lines)
- Abstraction provides clear semantic value

**Audit finding (2025-12-11)**: No significant code duplications found. Code is already DRY.

### Centralized Configuration

**IMPORTANT**: When adding new features, always place configurable constants in `src/lib/config/`:

| Type | File | Examples |
|------|------|----------|
| Colors | `config/colors.ts` | UI colors, entity colors, highlights |
| Physics | `config/physics.ts` | Gravity, speed, rates |
| Timing | `config/timing.ts` | Tick rates, timeouts, delays |
| Input | `config/input.ts` | Pan speed, key bindings |

**Checklist for new features:**
- [ ] No magic numbers in code - use named constants
- [ ] Constants in `config/` directory, not inline in files
- [ ] Use UPPER_SNAKE_CASE for constant names
- [ ] Re-export from original location if needed for backwards compatibility
- [ ] Run `pnpm check` after changes

### Code Quality Standards

Every new file must follow these patterns:

**Components** (`src/lib/components/`):
1. JSDoc header with description
2. Interface definition
3. Factory function (`createX`)
4. Constants (if any)

**Systems** (`src/lib/systems/`):
1. JSDoc header with description
2. Main exported function (`xSystem`)
3. Private helper functions
4. System-specific constants (keep local if not reused)

**Type Safety**:
- Never use `any` without justification
- All exported functions must have explicit return types
- Use `unknown` instead of `any` when possible

### Performance Optimization Patterns

Follow these patterns for game performance:

**Algorithm Complexity**:
- Use binary heaps (`src/lib/utils/binary-heap.ts`) for priority queues - O(log n) vs O(n log n) for sorted arrays
- Use Map-based lookups for O(1) access instead of array.find() O(n)
- Use numeric keys (`x * 10000 + y`) instead of string keys to avoid GC pressure

**Throttling and Limiting**:
- Expensive systems should run every N ticks (see `TASK_ASSIGNMENT_THROTTLE_TICKS`)
- Limit iterations per frame (see `MAX_PATHFIND_ATTEMPTS_PER_GNOME`)
- Constants go in `src/lib/config/performance.ts`

**Rendering Optimization**:
- Use dirty checking - only redraw entities that changed
- Cache previous state (position, type) to detect changes
- Batch draw calls - single stroke() for multiple shapes
- Create Graphics objects once, update position only

**Example - Dirty Checking Pattern**:
```typescript
interface Cache { x: number; y: number; type: number; }
const cache = new Map<number, Cache>();

function render(entity: number, newX: number, newY: number) {
  const cached = cache.get(entity);
  if (cached && cached.x === newX && cached.y === newY) {
    return; // Skip redraw
  }
  // ... actual render
  cache.set(entity, { x: newX, y: newY, type });
}
```

<!-- MANUAL ADDITIONS END -->
