# Quickstart: Code Quality Refactoring

**Date**: 2025-12-11
**Branch**: 004-code-quality

## Overview

Este guia descreve como aplicar as refatorações de code quality no projeto Gnomes At Work.

## Pre-requisites

- Branch `004-code-quality` checked out
- `pnpm install` executado
- `pnpm check` passando (baseline)

## Step 1: Create Config Directory Structure

```bash
mkdir -p src/lib/config
```

Create the following files:

### `src/lib/config/colors.ts`
```typescript
/**
 * UI Colors
 * Centralized color definitions for rendering and UI elements.
 */

// Selection & Highlighting
export const SELECTION_COLOR = 0xffff00;
export const SELECTION_ALPHA = 0.3;

// Task Markers
export const TASK_MARKER_COLOR = 0xff0000;
export const TASK_MARKER_ALPHA = 0.5;

// Environment
export const SKY_COLOR = 0x87ceeb;

// Entity Colors (placeholder sprites)
export const GNOME_COLOR = 0x00ff00;
```

### `src/lib/config/physics.ts`
```typescript
/**
 * Physics Constants
 */

export const GRAVITY = 0.02;
export const TERMINAL_VELOCITY = 0.5;
export const GNOME_SPEED = 0.1;
export const GNOME_MINE_RATE = 1;
```

### `src/lib/config/timing.ts`
```typescript
/**
 * Timing Constants
 */

export const TICKS_PER_SECOND = 60;
export const MS_PER_TICK = 1000 / TICKS_PER_SECOND;
export const DOUBLE_CLICK_TIMEOUT = 300;
```

### `src/lib/config/input.ts`
```typescript
/**
 * Input Constants
 */

export const PAN_SPEED = 8;
```

### `src/lib/config/index.ts`
```typescript
/**
 * Config Barrel
 */

export * from './colors';
export * from './physics';
export * from './timing';
export * from './input';
```

## Step 2: Update Imports in Existing Files

### `src/lib/render/renderer.ts`

Remove local constants:
```typescript
// DELETE these lines:
const SELECTION_COLOR = 0xffff00;
const SELECTION_ALPHA = 0.3;
const TASK_MARKER_COLOR = 0xff0000;
const TASK_MARKER_ALPHA = 0.5;
```

Add import:
```typescript
import {
  SELECTION_COLOR,
  SELECTION_ALPHA,
  TASK_MARKER_COLOR,
  TASK_MARKER_ALPHA,
  SKY_COLOR
} from '$lib/config/colors';
```

Update backgroundColor:
```typescript
backgroundColor: SKY_COLOR, // was: 0x87ceeb
```

### `src/lib/systems/physics.ts`

Remove local constants:
```typescript
// DELETE these lines:
const GRAVITY = 0.02;
const TERMINAL_VELOCITY = 0.5;
```

Add import:
```typescript
import { GRAVITY, TERMINAL_VELOCITY } from '$lib/config/physics';
```

### `src/lib/components/gnome.ts`

Remove local constants:
```typescript
// DELETE these lines:
export const GNOME_COLOR = 0x00ff00;
export const GNOME_SPEED = 0.1;
export const GNOME_MINE_RATE = 1;
```

Add re-exports for backwards compatibility:
```typescript
// Re-export from centralized config
export { GNOME_COLOR } from '$lib/config/colors';
export { GNOME_SPEED, GNOME_MINE_RATE } from '$lib/config/physics';
```

### `src/lib/input/handler.ts`

Remove local constants:
```typescript
// DELETE these lines:
const DOUBLE_CLICK_TIMEOUT = 300;
const PAN_SPEED = 8;
```

Add imports:
```typescript
import { DOUBLE_CLICK_TIMEOUT } from '$lib/config/timing';
import { PAN_SPEED } from '$lib/config/input';
```

### `src/lib/game/loop.ts`

Keep constants but add re-export in config:

In `src/lib/config/timing.ts`, the constants are already defined. Update `loop.ts` to import from config:

```typescript
import { TICKS_PER_SECOND, MS_PER_TICK } from '$lib/config/timing';

// Re-export for backwards compatibility
export { TICKS_PER_SECOND, MS_PER_TICK };
```

## Step 3: Verify No Breaking Changes

After each file modification:

```bash
pnpm check
```

Must pass with no new errors.

## Step 4: Test the Game

```bash
pnpm dev
```

Verify:
- [ ] Game loads correctly
- [ ] Gnomes render with correct color
- [ ] Selection highlights work
- [ ] Task markers appear
- [ ] Camera pan/zoom works
- [ ] Physics (gravity, movement) works

## Step 5: Update CLAUDE.md

Add the new config structure to the Design Principles section:

```markdown
### Config Files Structure

All configurable constants live in `src/lib/config/`:

- `colors.ts` - UI and rendering colors
- `physics.ts` - Physics simulation constants
- `timing.ts` - Time-related constants
- `input.ts` - Input handling constants
- `index.ts` - Barrel file for convenient imports
```

## Rollback Plan

If issues arise:
1. `git stash` current changes
2. `git checkout main -- src/lib/`
3. Investigate issue
4. Re-apply changes incrementally

## Success Criteria

- [ ] `pnpm check` passes
- [ ] `pnpm lint` passes
- [ ] Game runs identically to before
- [ ] All constants centralized in `src/lib/config/`
- [ ] No magic numbers in refactored files
