# Data Model: Background Blocks & Horizon System

**Phase 1 Output** | **Date**: 2025-12-21 | **Spec**: [spec.md](./spec.md)

## Overview

Este documento define as estruturas de dados e tipos TypeScript para o sistema de background blocks e horizonte.

## Type Definitions

### New Types

```typescript
// src/lib/components/background.ts

/**
 * Permanent background types that cannot be mined.
 * Rendered as fill regions, not individual tiles.
 */
export enum PermanentBackgroundType {
  /** Above horizon - sky color */
  Sky = 'sky',
  /** Below horizon - cave/rock color */
  Cave = 'cave'
}
```

### Extended Types

```typescript
// src/lib/components/tile.ts (additions)

/**
 * BackgroundTile uses same TileType as foreground.
 * Visual distinction via color modification in renderer.
 */
export interface BackgroundTile {
  type: TileType;      // Dirt, Stone, etc. (Air = no background block)
  durability: number;  // Same values as foreground tiles
}

/**
 * Create a background tile with full durability.
 */
export function createBackgroundTile(type: TileType): BackgroundTile {
  return {
    type,
    durability: TILE_CONFIGS[type].durability
  };
}

/**
 * Create an empty background (shows permanent background).
 */
export function createEmptyBackground(): BackgroundTile {
  return {
    type: TileType.Air,
    durability: 0
  };
}
```

```typescript
// src/lib/game/state.ts (additions)

export interface GameState {
  // ... existing properties ...

  /**
   * Background tile grid. Same dimensions as tileGrid.
   * null = use permanent background (Sky/Cave based on horizonY)
   * Entity = background block that can be mined
   */
  backgroundTileGrid: (Entity | null)[][];

  /**
   * Background tile components storage.
   */
  backgroundTiles: Map<Entity, BackgroundTile>;

  /**
   * Y coordinate of horizon line. Tiles at y < horizonY show Sky,
   * tiles at y >= horizonY show Cave as permanent background.
   * Set during world generation, persisted in save.
   */
  horizonY: number;
}
```

```typescript
// src/lib/world-gen/generator.ts (additions)

export interface WorldConfig {
  // ... existing properties ...

  /**
   * Horizon Y position override. If not provided, calculated as:
   * Math.floor(surfaceLevel * height)
   */
  horizonY?: number;
}
```

```typescript
// src/lib/config/colors.ts (additions)

/** Permanent background colors */
export const PERMANENT_BACKGROUND_COLORS = {
  sky: 0x87ceeb,   // Light sky blue
  cave: 0x2a2a2a   // Dark cave rock
} as const;

/** Background block color multiplier (darker than foreground) */
export const BACKGROUND_DARKEN_FACTOR = 0.6; // 60% brightness

/**
 * Calculate background block color from foreground color.
 */
export function getBackgroundBlockColor(foregroundColor: number): number {
  const r = Math.floor(((foregroundColor >> 16) & 0xff) * BACKGROUND_DARKEN_FACTOR);
  const g = Math.floor(((foregroundColor >> 8) & 0xff) * BACKGROUND_DARKEN_FACTOR);
  const b = Math.floor((foregroundColor & 0xff) * BACKGROUND_DARKEN_FACTOR);
  return (r << 16) | (g << 8) | b;
}

/** Pre-computed background tile colors */
export const BACKGROUND_TILE_COLORS: Record<TileType, number> = {
  [TileType.Air]: 0x000000,  // Not rendered
  [TileType.Dirt]: getBackgroundBlockColor(0x8b4513),   // ~0x533010
  [TileType.Stone]: getBackgroundBlockColor(0x808080), // ~0x4d4d4d
  [TileType.Bedrock]: getBackgroundBlockColor(0x1a1a1a) // ~0x101010
};
```

```typescript
// src/lib/render/renderer.ts (additions)

export interface Renderer {
  // ... existing properties ...

  /** Permanent background layer (Sky/Cave fills) */
  permanentBackgroundContainer: Container;

  /** Background blocks layer */
  backgroundContainer: Container;

  /** Graphics cache for background tiles */
  backgroundTileGraphics: Map<Entity, Graphics>;

  /** Graphics for permanent background fills */
  skyFillGraphics: Graphics;
  caveFillGraphics: Graphics;
}
```

## State Functions

### Background Tile Management

```typescript
// src/lib/ecs/background.ts

/**
 * Get background tile entity at grid position.
 */
export function getBackgroundTileAt(
  state: GameState,
  x: number,
  y: number
): Entity | null {
  if (x < 0 || x >= state.worldWidth || y < 0 || y >= state.worldHeight) {
    return null;
  }
  return state.backgroundTileGrid[y][x];
}

/**
 * Set background tile entity at grid position.
 */
export function setBackgroundTileAt(
  state: GameState,
  x: number,
  y: number,
  entity: Entity | null
): GameState {
  const newGrid = state.backgroundTileGrid.map((row, rowY) =>
    rowY === y
      ? row.map((cell, cellX) => (cellX === x ? entity : cell))
      : row
  );
  return { ...state, backgroundTileGrid: newGrid };
}

/**
 * Add background tile component to entity.
 */
export function addBackgroundTile(
  state: GameState,
  entity: Entity,
  tile: BackgroundTile
): GameState {
  const newTiles = new Map(state.backgroundTiles);
  newTiles.set(entity, tile);
  return { ...state, backgroundTiles: newTiles };
}

/**
 * Remove background tile component from entity.
 */
export function removeBackgroundTile(
  state: GameState,
  entity: Entity
): GameState {
  const newTiles = new Map(state.backgroundTiles);
  newTiles.delete(entity);
  return { ...state, backgroundTiles: newTiles };
}

/**
 * Get background tile component.
 */
export function getBackgroundTile(
  state: GameState,
  entity: Entity
): BackgroundTile | undefined {
  return state.backgroundTiles.get(entity);
}

/**
 * Update background tile component.
 */
export function updateBackgroundTile(
  state: GameState,
  entity: Entity,
  updater: (tile: BackgroundTile) => BackgroundTile
): GameState {
  const tile = state.backgroundTiles.get(entity);
  if (!tile) return state;
  const newTiles = new Map(state.backgroundTiles);
  newTiles.set(entity, updater(tile));
  return { ...state, backgroundTiles: newTiles };
}
```

### Permanent Background

```typescript
// src/lib/world-gen/generator.ts (additions)

/**
 * Get permanent background type for a position.
 */
export function getPermanentBackgroundType(
  state: GameState,
  y: number
): PermanentBackgroundType {
  return y < state.horizonY
    ? PermanentBackgroundType.Sky
    : PermanentBackgroundType.Cave;
}

/**
 * Check if a tile position shows permanent background.
 * True when both foreground and background are empty/Air.
 */
export function showsPermanentBackground(
  state: GameState,
  x: number,
  y: number
): boolean {
  const foreground = getTileAt(state, x, y);
  const background = getBackgroundTileAt(state, x, y);

  const foregroundEmpty = foreground === null ||
    state.tiles.get(foreground)?.type === TileType.Air;
  const backgroundEmpty = background === null ||
    state.backgroundTiles.get(background)?.type === TileType.Air;

  return foregroundEmpty && backgroundEmpty;
}
```

## Serialization

```typescript
// src/lib/game/state.ts (serialize additions)

interface SerializedGameState {
  // ... existing properties ...

  /** Background tile grid as [y][x] arrays */
  backgroundTileGrid: (number | null)[][];

  /** Background tiles as [entity, type, durability] tuples */
  backgroundTiles: [number, number, number][];

  /** Horizon Y coordinate */
  horizonY: number;
}

export function serialize(state: GameState): SerializedGameState {
  return {
    // ... existing serialization ...
    backgroundTileGrid: state.backgroundTileGrid,
    backgroundTiles: Array.from(state.backgroundTiles.entries()).map(
      ([entity, tile]) => [entity, tile.type, tile.durability]
    ),
    horizonY: state.horizonY
  };
}

export function deserialize(json: SerializedGameState): GameState {
  return {
    // ... existing deserialization ...
    backgroundTileGrid: json.backgroundTileGrid ?? createEmptyBackgroundGrid(
      json.worldWidth,
      json.worldHeight
    ),
    backgroundTiles: new Map(
      (json.backgroundTiles ?? []).map(([entity, type, durability]) => [
        entity,
        { type, durability }
      ])
    ),
    horizonY: json.horizonY ?? Math.floor(json.worldHeight * 0.3)
  };
}

function createEmptyBackgroundGrid(width: number, height: number): (Entity | null)[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null)
  );
}
```

## State Initialization

```typescript
// src/lib/game/state.ts (createEmptyState additions)

export function createEmptyState(
  seed: number,
  worldWidth: number,
  worldHeight: number
): GameState {
  return {
    // ... existing properties ...
    backgroundTileGrid: createEmptyBackgroundGrid(worldWidth, worldHeight),
    backgroundTiles: new Map(),
    horizonY: Math.floor(worldHeight * 0.3) // Default horizon at 30%
  };
}
```

## Mining Target Resolution

```typescript
// src/lib/systems/mining.ts (additions)

export type MiningLayer = 'foreground' | 'background';

export interface MiningTarget {
  entity: Entity;
  layer: MiningLayer;
  x: number;
  y: number;
}

/**
 * Get the mineable target at a position.
 * Foreground takes priority over background.
 * Permanent backgrounds (Sky/Cave) are not mineable.
 */
export function getMiningTarget(
  state: GameState,
  x: number,
  y: number
): MiningTarget | null {
  // Check foreground first
  const foregroundEntity = getTileAt(state, x, y);
  if (foregroundEntity !== null) {
    const tile = state.tiles.get(foregroundEntity);
    if (tile && tile.type !== TileType.Air && !isIndestructible(tile.type)) {
      return { entity: foregroundEntity, layer: 'foreground', x, y };
    }
  }

  // Check background if no foreground
  const backgroundEntity = getBackgroundTileAt(state, x, y);
  if (backgroundEntity !== null) {
    const tile = state.backgroundTiles.get(backgroundEntity);
    if (tile && tile.type !== TileType.Air && !isIndestructible(tile.type)) {
      return { entity: backgroundEntity, layer: 'background', x, y };
    }
  }

  // Permanent background not mineable
  return null;
}
```

## Validation Rules

1. **backgroundTileGrid dimensions** must match tileGrid (worldWidth × worldHeight)
2. **horizonY** must be in range [0, worldHeight)
3. **Background block types** must be valid TileType (not Bedrock except at world edges)
4. **Entity IDs** in backgroundTileGrid must exist in backgroundTiles Map
5. **Durability** must be ≥ 0 (0 = destroyed, convert to Air)

## Migration Strategy

For existing save files without background data:

1. Check for `backgroundTileGrid` in deserialized JSON
2. If missing, create empty grid (all null)
3. Set default `horizonY = worldHeight * 0.3`
4. Regeneration of backgrounds is optional (manual action by player)

This ensures backwards compatibility with saves from before this feature.
