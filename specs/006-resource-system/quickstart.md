# Quickstart: Resource System

**Feature**: 006-resource-system
**Date**: 2025-12-14

## Overview

This feature adds resource collection to gnomad. When gnomes mine tiles, resources drop on the ground. Gnomes automatically collect resources by walking over them, and the collected counts display in the HUD.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/components/resource.ts` | Resource component, ResourceType enum, config |
| `src/lib/systems/resource-collection.ts` | Auto-collection system |
| `src/lib/systems/mining.ts` | Modified to drop resources |
| `src/lib/game/state.ts` | Extended with resources Map and inventory |
| `src/lib/render/renderer.ts` | Resource entity rendering |
| `src/lib/components/hud/ResourcePanel.svelte` | HUD display |

## Implementation Sequence

### 1. Create Resource Component

```typescript
// src/lib/components/resource.ts
export enum ResourceType { Dirt = 1, Stone = 2 }
export interface Resource { type: ResourceType }
```

### 2. Extend Game State

Add to `GameState`:
- `resources: Map<Entity, Resource>`
- `inventory: ResourceInventory`

Update `serialize()` and `deserialize()`.

### 3. Modify Mining System

In `mining.ts`, when tile durability ≤ 0:
1. Get tile type
2. Create resource entity at tile position
3. Then convert tile to Air

### 4. Create Collection System

```typescript
// src/lib/systems/resource-collection.ts
export function resourceCollectionSystem(state: GameState): GameState {
  // For each gnome position, check for resource at same tile
  // If found: increment inventory, destroy resource entity
}
```

### 5. Add to Game Loop

In `Game.svelte`, add `resourceCollectionSystem` to systems array after physics.

### 6. Render Resources

In `renderer.ts`:
- Add `resourceGraphics: Map<Entity, Graphics>`
- Add `renderResources()` function
- Small colored squares (6x6) centered in tile

### 7. Create HUD Panel

```svelte
<!-- src/lib/components/hud/ResourcePanel.svelte -->
<div class="resource-panel">
  <div>Dirt: {inventory.dirt}</div>
  <div>Stone: {inventory.stone}</div>
</div>
```

## Testing Checklist

- [ ] Mine a dirt tile → dirt resource appears at location
- [ ] Mine a stone tile → stone resource appears at location
- [ ] Gnome walks over resource → resource disappears
- [ ] Collected resources increment HUD counter
- [ ] Multiple resources on same tile all collected
- [ ] Save/load preserves resources and inventory
- [ ] Resources outside viewport still exist
- [ ] Bedrock tiles do not drop resources

## Common Patterns

### Creating Resource Entity

```typescript
import { createEntity, addPosition, addResource } from '$lib/ecs/world';
import { getResourceTypeForTile, ResourceType } from '$lib/components/resource';

function dropResource(state: GameState, x: number, y: number, tileType: TileType): GameState {
  const resourceType = getResourceTypeForTile(tileType);
  if (resourceType === null) return state;

  const [newState, entity] = createEntity(state);
  let result = addPosition(newState, entity, { x, y });
  result = addResource(result, entity, { type: resourceType });
  return result;
}
```

### Checking for Collection

```typescript
function getResourceAtPosition(state: GameState, x: number, y: number): Entity | null {
  for (const [entity, resource] of state.resources) {
    const pos = state.positions.get(entity);
    if (pos && Math.floor(pos.x) === x && Math.floor(pos.y) === y) {
      return entity;
    }
  }
  return null;
}
```

### Updating Inventory

```typescript
function addToInventory(inventory: ResourceInventory, type: ResourceType): ResourceInventory {
  switch (type) {
    case ResourceType.Dirt:
      return { ...inventory, dirt: inventory.dirt + 1 };
    case ResourceType.Stone:
      return { ...inventory, stone: inventory.stone + 1 };
  }
}
```

## Architecture Notes

- Resources are entities with Position + Resource components
- Collection system runs after physics (gnome position is final)
- First gnome to reach resource in tick order collects it
- Inventory is global, not per-gnome
- Resources persist across save/load via existing serialization
