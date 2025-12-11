# Mining System

**Date**: 2025-12-11

## Overview

The mining system processes gnomes in the Mining state, reducing tile durability and destroying tiles when durability reaches zero.

## Mining Process

Each tick, for each gnome in Mining state:

1. Get gnome's current task
2. Get target tile from task coordinates
3. Reduce tile durability by `GNOME_MINE_RATE`
4. If durability <= 0:
   - Convert tile to Air
   - Complete task
   - Return gnome to Idle
5. Otherwise:
   - Update task progress percentage

## Mining Rate

```typescript
const GNOME_MINE_RATE = 1; // Durability reduced per tick
```

At 60 ticks/second:
- Dirt (100 durability): ~1.7 seconds to mine
- Stone (200 durability): ~3.3 seconds to mine

## Tile Durability

Each tile type has initial durability:

```typescript
const TILE_CONFIG = {
  [TileType.Air]: { durability: 0, mineTicks: 0 },
  [TileType.Dirt]: { durability: 100, mineTicks: 30 },
  [TileType.Stone]: { durability: 200, mineTicks: 90 }
};
```

## Task Progress

Progress is calculated as percentage of durability removed:

```typescript
progress = (1 - currentDurability / originalDurability) * 100
```

Progress is capped at 99% until tile is actually destroyed.

## Tile Destruction

When tile is destroyed:

1. Tile component changed to Air type with 0 durability
2. Task marked as 100% complete
3. Task entity removed from state
4. Gnome's `currentTaskId` set to null
5. Gnome state returns to Idle

## Edge Cases

### Tile Already Air
If target tile is already air (mined by another means), task is immediately completed.

### Tile Doesn't Exist
If tile entity not found at target coordinates, task is completed.

## Visual Feedback

The renderer shows dig task markers:
- Red outlined rectangle on tiles with active dig tasks
- Provides visual indication of queued work

## Files

- `src/lib/systems/mining.ts`: Mining system implementation
- `src/lib/components/tile.ts`: Tile types and durability config
- `src/lib/components/gnome.ts`: `GNOME_MINE_RATE` constant
