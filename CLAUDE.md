# gnomad Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-11

## Active Technologies
- TypeScript 5.x (strict mode enabled) + SvelteKit 2.x, Canvas 2D API (editing), PixiJS v8 (preview), browser-fs-access (file operations) (002-pixel-art-editor)
- JSON files (source assets), PNG files (exports), no database (002-pixel-art-editor)
- TypeScript 5.9.3 (strict mode enabled) + SvelteKit 2.48.5, Svelte 5.43.8, PixiJS 8.0.0, Vite 7.2.2 (003-game-hud)
- N/A (uses existing GameState in memory) (003-game-hud)
- TypeScript 5.x (strict mode enabled) + SvelteKit 2.x, PixiJS v8 (004-code-quality)
- N/A (refatoração de código existente) (004-code-quality)

- TypeScript 5.x (strict mode enabled) + SvelteKit 2.x (app framework), PixiJS v8 (2D rendering with WebGPU/WebGL) (001-colony-sim-core)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (strict mode enabled): Follow standard conventions

## Recent Changes
- 004-code-quality: Added TypeScript 5.x (strict mode enabled) + SvelteKit 2.x, PixiJS v8
- 003-game-hud: Added TypeScript 5.9.3 (strict mode enabled) + SvelteKit 2.48.5, Svelte 5.43.8, PixiJS 8.0.0, Vite 7.2.2
- 002-pixel-art-editor: Added TypeScript 5.x (strict mode enabled) + SvelteKit 2.x, Canvas 2D API (editing), PixiJS v8 (preview), browser-fs-access (file operations)


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

<!-- MANUAL ADDITIONS END -->
