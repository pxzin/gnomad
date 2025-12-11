# Data Model: Configuration Structure

**Date**: 2025-12-11
**Branch**: 004-code-quality

## Overview

Este documento define a estrutura dos arquivos de configuração centralizados a serem criados em `src/lib/config/`.

## Config Module Structure

```text
src/lib/config/
├── index.ts          # Barrel file re-exporting all configs
├── colors.ts         # UI and rendering colors
├── physics.ts        # Physics system constants
├── timing.ts         # Time-related constants
└── input.ts          # Input handling constants
```

## 1. Colors Config (`colors.ts`)

```typescript
/**
 * UI Colors
 * Centralized color definitions for rendering and UI elements.
 */

// Selection & Highlighting
export const SELECTION_COLOR = 0xffff00;      // Yellow
export const SELECTION_ALPHA = 0.3;

// Task Markers
export const TASK_MARKER_COLOR = 0xff0000;    // Red
export const TASK_MARKER_ALPHA = 0.5;

// Environment
export const SKY_COLOR = 0x87ceeb;            // Sky blue (also used as background)

// Entity Colors (placeholder sprites)
export const GNOME_COLOR = 0x00ff00;          // Bright green
```

**Note**: Tile colors (Dirt, Stone, Air) permanecem em `TILE_CONFIG` pois são parte do data model de tiles, não configuração de UI.

## 2. Physics Config (`physics.ts`)

```typescript
/**
 * Physics Constants
 * Values that control physical simulation behavior.
 */

// Gravity
export const GRAVITY = 0.02;                  // Acceleration per tick
export const TERMINAL_VELOCITY = 0.5;         // Max falling speed

// Movement
export const GNOME_SPEED = 0.1;               // Tiles per tick (6 tiles/sec at 60 TPS)
export const GNOME_MINE_RATE = 1;             // Damage per tick when mining
```

## 3. Timing Config (`timing.ts`)

```typescript
/**
 * Timing Constants
 * Game loop and interaction timing values.
 */

// Game Loop
export const TICKS_PER_SECOND = 60;
export const MS_PER_TICK = 1000 / TICKS_PER_SECOND;

// Input Timing
export const DOUBLE_CLICK_TIMEOUT = 300;      // ms between clicks for double-click
```

## 4. Input Config (`input.ts`)

```typescript
/**
 * Input Constants
 * Values that control input handling behavior.
 */

// Camera Pan
export const PAN_SPEED = 8;                   // Pixels per frame for keyboard pan
```

## 5. Rendering Config (remains in `render/renderer.ts`)

```typescript
/**
 * Rendering Constants
 * Kept in renderer as they're tightly coupled to rendering logic.
 */

export const TILE_SIZE = 16;                  // Pixels per tile
```

**Rationale**: `TILE_SIZE` é usado extensivamente no renderer e converter coordenadas. Manter no renderer evita import circular e mantém coesão.

## 6. Camera Config (remains in `components/camera.ts`)

```typescript
/**
 * Camera Constants
 * Kept with Camera component as they're specific to camera behavior.
 */

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4.0;
export const CAMERA_LERP_SPEED = 0.1;
```

**Rationale**: Constantes de zoom são específicas do componente Camera. Centralizar não adiciona valor pois só são usadas nesse contexto.

## Import Pattern

Após refatoração, imports devem seguir este padrão:

```typescript
// Before (scattered)
import { GRAVITY } from '$lib/systems/physics';
import { DOUBLE_CLICK_TIMEOUT } from '$lib/input/handler';

// After (centralized)
import { GRAVITY } from '$lib/config/physics';
import { DOUBLE_CLICK_TIMEOUT } from '$lib/config/timing';

// Or using barrel
import { GRAVITY, DOUBLE_CLICK_TIMEOUT } from '$lib/config';
```

## Migration Notes

1. **Colors**: Mover de `renderer.ts` e `gnome.ts` para `config/colors.ts`
2. **Physics**: Mover de `systems/physics.ts` e `components/gnome.ts` para `config/physics.ts`
3. **Timing**: Mover de `game/loop.ts` e `input/handler.ts` para `config/timing.ts`
4. **Input**: Mover de `input/handler.ts` para `config/input.ts`

## Validation Rules

- All constants MUST use UPPER_SNAKE_CASE
- All constants MUST have JSDoc comment explaining purpose
- All constants MUST be exported (no private module constants for config values)
- Config files MUST NOT import from non-config modules (to prevent circular deps)
