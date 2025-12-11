# World Generation System

**Date**: 2025-12-11

## Overview

The world generation system creates the initial game world with layered terrain. Generation is deterministic based on a seed value, ensuring reproducible worlds for the same seed.

## Terrain Layers

The MVP world consists of three terrain layers from top to bottom:

1. **Air (Sky)**: Empty space above the surface (top ~30% of world)
2. **Dirt**: Surface layer, fast to mine (5 tiles deep)
3. **Stone**: Deep layer, slow to mine (remaining depth)

## Configuration

World generation is controlled via `WorldConfig`:

```typescript
interface WorldConfig {
  width: number;      // World width in tiles (default: 100)
  height: number;     // World height in tiles (default: 50)
  seed: number;       // Random seed for deterministic generation
  surfaceLevel: number; // Surface Y as percentage from top (default: 0.3)
  dirtDepth: number;  // Dirt layer thickness in tiles (default: 5)
}
```

## Surface Variation

The surface line is not flat - it uses 1D noise to create gentle hills and valleys:

- Base surface at configured `surfaceLevel` (30% from top by default)
- Noise variation of -2 to +2 tiles using seeded PRNG
- Creates natural-looking terrain without complex algorithms

## Entity Creation

For each tile position in the world:

1. Create a new entity via `createEntity()`
2. Add Position component with (x, y) coordinates
3. Add Tile component with appropriate type and durability
4. Store entity ID in `tileGrid[y][x]` for O(1) spatial lookup

## Helper Functions

### `getTileAt(state, x, y)`
Returns the tile entity at position, or `null` if out of bounds.

### `isInBounds(state, x, y)`
Checks if coordinates are within world boundaries.

### `isSolid(state, x, y)`
Returns true if tile is not air (dirt or stone).

### `isWalkable(state, x, y)`
Returns true if tile is air (inverse of `isSolid`).

### `getSurfaceY(state, x)`
Finds the Y coordinate of the first solid tile at given X.

### `findSpawnPosition(state)`
Finds a valid spawn position on the surface, starting from world center.

## Seeded Random Number Generator

Uses the mulberry32 algorithm for deterministic random numbers:

```typescript
function createRNG(seed: number): () => number
```

- Fast and simple implementation
- Produces numbers in [0, 1) range
- Same seed always produces same sequence

## Files

- `src/lib/world-gen/generator.ts`: Main generation logic
- `src/lib/world-gen/noise.ts`: PRNG and noise functions
