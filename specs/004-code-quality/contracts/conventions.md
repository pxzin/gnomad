# Code Conventions Contract

**Date**: 2025-12-11
**Branch**: 004-code-quality

Este documento define as convenções de código que devem ser seguidas após a refatoração.

## 1. Naming Conventions

### Constants
```typescript
// ✅ CORRECT - UPPER_SNAKE_CASE
export const TILE_SIZE = 16;
export const MAX_ZOOM = 4.0;
export const GRAVITY = 0.02;

// ❌ WRONG
export const tileSize = 16;
export const maxZoom = 4.0;
```

### Functions
```typescript
// ✅ CORRECT - camelCase
export function createGnome(): Gnome { }
export function physicsSystem(state: GameState): GameState { }

// ❌ WRONG
export function CreateGnome(): Gnome { }
export function physics_system(): GameState { }
```

### Types & Interfaces
```typescript
// ✅ CORRECT - PascalCase
export interface GameState { }
export type Entity = number;
export enum TileType { }

// ❌ WRONG
export interface gameState { }
export type entity = number;
```

## 2. File Structure Convention

### Component Files (`src/lib/components/*.ts`)

```typescript
/**
 * [Component Name]
 *
 * [Brief description of what this component represents]
 */

// 1. Imports
import type { Entity } from '$lib/ecs/types';

// 2. Constants (if any)
export const COMPONENT_CONSTANT = value;

// 3. Types/Interfaces
export interface ComponentName {
  field1: Type1;
  field2: Type2;
}

// 4. Factory Function
export function createComponentName(params): ComponentName {
  return { ... };
}

// 5. Helper Functions (if any)
export function helperFunction(): ReturnType { }
```

### System Files (`src/lib/systems/*.ts`)

```typescript
/**
 * [System Name]
 *
 * [Brief description of what this system does]
 */

// 1. Imports
import type { GameState } from '$lib/game/state';
import { CONSTANT } from '$lib/config/physics';

// 2. Local Constants (system-specific only)
const SYSTEM_SPECIFIC_CONSTANT = value;

// 3. Main System Function (exported)
export function systemName(state: GameState): GameState {
  // System logic
  return updatedState;
}

// 4. Helper Functions (internal)
function helperFunction(): ReturnType { }
```

### Config Files (`src/lib/config/*.ts`)

```typescript
/**
 * [Config Category]
 *
 * [Brief description of what constants are defined here]
 */

// Group related constants with comments

// Group 1: [Category]
export const CONSTANT_1 = value;  // Description
export const CONSTANT_2 = value;  // Description

// Group 2: [Category]
export const CONSTANT_3 = value;  // Description
```

## 3. Export Conventions

### Always Use Named Exports
```typescript
// ✅ CORRECT
export function createGnome(): Gnome { }
export const GNOME_SPEED = 0.1;
export interface Gnome { }

// ❌ WRONG - No default exports
export default function createGnome(): Gnome { }
```

### Barrel Files (index.ts)
```typescript
// Re-export everything from submodules
export * from './colors';
export * from './physics';
export * from './timing';
export * from './input';
```

## 4. Type Safety Rules

### Explicit Return Types for Public Functions
```typescript
// ✅ CORRECT
export function findPath(state: GameState, from: Position, to: Position): Position[] | null {
  // ...
}

// ❌ WRONG - Implicit return type
export function findPath(state: GameState, from: Position, to: Position) {
  // ...
}
```

### No 'any' Without Justification
```typescript
// ✅ CORRECT - If unavoidable, document why
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const result = externalApi.call() as any; // External API doesn't provide types

// ❌ WRONG - Unexplained any
const data: any = getData();
```

### Use 'unknown' Instead of 'any' When Possible
```typescript
// ✅ CORRECT
function parseJSON(text: string): unknown {
  return JSON.parse(text);
}

// ❌ WRONG
function parseJSON(text: string): any {
  return JSON.parse(text);
}
```

## 5. Documentation Rules

### JSDoc for Exported Functions
```typescript
/**
 * Create a new gnome entity at the specified position.
 * @param state - Current game state
 * @param x - Tile X coordinate
 * @param y - Tile Y coordinate
 * @returns Updated state and gnome entity ID, or null if spawn failed
 */
export function spawnGnome(state: GameState, x?: number, y?: number): [GameState, Entity] | null {
  // ...
}
```

### JSDoc for Constants (when not obvious)
```typescript
/** Acceleration applied to falling entities per tick */
export const GRAVITY = 0.02;

/** Maximum falling speed (tiles per tick) */
export const TERMINAL_VELOCITY = 0.5;
```

## 6. Import Order Convention

```typescript
// 1. External packages (node_modules)
import { Application } from 'pixi.js';

// 2. Internal aliases ($lib/...)
import type { GameState } from '$lib/game/state';
import { GRAVITY } from '$lib/config/physics';

// 3. Relative imports (if any)
import { localHelper } from './helper';
```

## Validation Checklist

Before committing code, verify:

- [ ] All constants use UPPER_SNAKE_CASE
- [ ] All functions use camelCase
- [ ] All types/interfaces use PascalCase
- [ ] All public functions have explicit return types
- [ ] No unexplained 'any' types
- [ ] All exported functions have JSDoc
- [ ] Imports are ordered correctly
- [ ] Named exports only (no default exports)
