# Pathfinding System

**Date**: 2025-12-11

## Overview

The pathfinding system uses A* algorithm to find paths for gnomes navigating the tile-based world. Gnomes can walk horizontally, climb up/down one tile, and fall through air.

## A* Algorithm

### Heuristic

Uses Manhattan distance (L1 norm) as the heuristic:

```typescript
function heuristic(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}
```

### Cost

All moves have a cost of 1 tile. Future iterations could add:
- Higher cost for climbing
- Variable cost based on terrain

### Implementation

```typescript
function findPath(
  state: GameState,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): Position[] | null
```

Returns array of positions from start to end, or `null` if no path exists.

## Movement Rules

Gnomes can move in these ways:

### Horizontal Walk
- Move left/right on same level
- Requires walkable tile at destination
- Requires solid tile below destination (ground)

### Step Up
- Move diagonally up by one tile
- Requires walkable tile at higher position
- Requires solid tile at current level (to step on)

### Step Down
- Move diagonally down by one tile
- Requires walkable tile at lower position
- Requires solid tile two tiles below (landing)

### Fall
- Move straight down
- Occurs when no solid tile below
- Path may include falling to reach lower areas

## Solid vs Walkable

- **Solid**: Dirt or Stone tiles (block movement)
- **Walkable**: Air tiles or mined-out spaces

## Path to Solid Tiles

When targeting a solid tile (for mining):
1. Find adjacent walkable tile
2. Path to that adjacent tile instead
3. Gnome stands next to target to mine

Adjacent positions checked:
1. Left/right of target (must have ground below)
2. Above target (standing on the target tile)

## Performance Considerations

- Maximum 1000 iterations to prevent infinite loops
- Open set sorted by f-cost (not optimal, but simple)
- Suitable for MVP with small worlds and single gnome

## Future Improvements

For post-MVP:
- Use binary heap for open set (O(log n) insert)
- Cache paths for frequently-used routes
- Jump point search for open areas

## Files

- `src/lib/systems/pathfinding.ts`: A* implementation
- `src/lib/world-gen/generator.ts`: `isSolid()`, `isWalkable()` helpers
