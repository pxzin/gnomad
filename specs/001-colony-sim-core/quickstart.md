# Quickstart: Colony Simulation Core (MVP)

**Date**: 2025-12-11
**Branch**: `001-colony-sim-core`

## Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm 8+ (`npm install -g pnpm`)
- Modern browser with WebGPU support (Chrome 113+, Edge 113+) or WebGL2 fallback

## Project Setup

### 1. Initialize SvelteKit Project

```bash
# Create new SvelteKit project
pnpm create svelte@latest gnomad
# Select: Skeleton project, TypeScript, ESLint, Prettier

cd gnomad
pnpm install
```

### 2. Configure TypeScript Strict Mode

Edit `tsconfig.json`:

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 3. Install Dependencies

```bash
# PixiJS v8 for rendering
pnpm add pixi.js

# Development tools
pnpm add -D vitest @testing-library/svelte playwright
```

### 4. Create Directory Structure

```bash
mkdir -p src/lib/{ecs,components,rendering,input,world-gen,game}
mkdir -p src/lib/ecs/systems
mkdir -p tests/{unit,e2e}
mkdir -p docs/systems
```

## Running the Game

### Development Mode

```bash
pnpm dev
# Opens http://localhost:5173
```

### Build for Production

```bash
pnpm build
pnpm preview
```

### Run Tests

```bash
# Unit tests
pnpm vitest

# E2E tests (requires running dev server)
pnpm playwright test
```

## MVP Feature Checklist

After setup, implement in this order:

1. **[ ] Basic PixiJS canvas** - Render colored rectangle
2. **[ ] World generation** - 100x50 grid of tiles (dirt/stone layers)
3. **[ ] Tile rendering** - Colored squares based on tile type
4. **[ ] Camera controls** - Pan with mouse drag, zoom with scroll
5. **[ ] Gnome entity** - Single gnome rendered as colored square
6. **[ ] Click-to-dig** - Select tile, gnome walks there, mines it
7. **[ ] Pathfinding** - A* for gnome navigation
8. **[ ] Game loop** - Fixed 60 tick/s with pause/speed controls

## Quick Verification

After each feature, verify:

```typescript
// In browser console or test:
console.log(gameState.tick);          // Tick counter incrementing
console.log(gameState.gnomes.size);   // Should be 1
console.log(gameState.tiles.size);    // Should be ~5000 (100x50)
```

## File Quick Reference

| File | Purpose |
|------|---------|
| `src/routes/+page.svelte` | Main game page with PixiJS canvas |
| `src/lib/game/loop.ts` | Game loop (tick, render, input) |
| `src/lib/game/state.ts` | GameState type and helpers |
| `src/lib/ecs/world.ts` | Entity/component management |
| `src/lib/world-gen/generator.ts` | World generation |
| `src/lib/rendering/renderer.ts` | PixiJS setup and rendering |
| `src/lib/input/mouse.ts` | Mouse input handling |

## Common Commands

```bash
# Start development
pnpm dev

# Type check
pnpm check

# Lint
pnpm lint

# Format
pnpm format

# Test
pnpm test

# Build
pnpm build
```

## Troubleshooting

### WebGPU not available

PixiJS v8 auto-falls back to WebGL2. Check console for:
```
[PixiJS] WebGPU is not supported, falling back to WebGL2
```

### Canvas not rendering

Ensure the canvas container has explicit dimensions:
```svelte
<div bind:this={container} style="width: 100vw; height: 100vh;"></div>
```

### Type errors

Run `pnpm check` to see all TypeScript errors. Common issues:
- Missing explicit types on function parameters
- `Map.get()` returns `undefined` - use `!` only when certain or check first

## Next Steps After MVP

Once the MVP is working:
1. Add resource collection (stockpile)
2. Add multiple gnomes
3. Replace colored squares with pixel art sprites
4. Add building system
5. Add day/night cycle
