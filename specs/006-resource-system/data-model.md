# Data Model: Resource System

**Feature**: 006-resource-system
**Date**: 2025-12-14

## Entities

### Resource Entity

A resource entity is created when a tile is mined. It exists in the world at a position until collected by a gnome.

**Components**:
- `Position` (existing) - x, y tile coordinates
- `Resource` (new) - type information

**Lifecycle**:
1. Created: When tile durability reaches 0 in mining system
2. Exists: Rendered on ground, persisted in save
3. Destroyed: When gnome occupies same tile position

## Components

### Resource Component (NEW)

```typescript
// src/lib/components/resource.ts

/**
 * Resource types that can be collected.
 * Maps 1:1 with mineable TileTypes.
 */
export enum ResourceType {
  Dirt = 1,
  Stone = 2
}

/**
 * Resource component for dropped resource entities.
 * Pure data structure per ECS principles.
 */
export interface Resource {
  /** Type of resource (determines inventory slot) */
  type: ResourceType;
}

/**
 * Visual configuration for resource rendering.
 */
export const RESOURCE_CONFIG: Record<ResourceType, { color: number }> = {
  [ResourceType.Dirt]: { color: 0x8b5a2b },   // Darker brown than dirt tile
  [ResourceType.Stone]: { color: 0x4a4a4a }   // Darker gray than stone tile
};

/**
 * Map tile type to resource type for drops.
 * Returns null for non-droppable tiles (Air, Bedrock).
 */
export function getResourceTypeForTile(tileType: TileType): ResourceType | null {
  switch (tileType) {
    case TileType.Dirt:
      return ResourceType.Dirt;
    case TileType.Stone:
      return ResourceType.Stone;
    default:
      return null;
  }
}
```

### ResourceInventory (NEW)

```typescript
// Added to src/lib/game/state.ts

/**
 * Global resource inventory.
 * Tracks collected resources across all gnomes.
 */
export interface ResourceInventory {
  /** Count of collected dirt resources */
  dirt: number;
  /** Count of collected stone resources */
  stone: number;
}

/**
 * Initial empty inventory.
 */
export function createEmptyInventory(): ResourceInventory {
  return { dirt: 0, stone: 0 };
}
```

## State Additions

### GameState Extensions

```typescript
// Additions to GameState interface in src/lib/game/state.ts

interface GameState {
  // ... existing fields ...

  /** Resource entities in the world (dropped, not yet collected) */
  resources: Map<Entity, Resource>;

  /** Global collected resource counts */
  inventory: ResourceInventory;
}
```

### Serialization Updates

```typescript
// serialize() additions
{
  // ... existing serialization ...
  resources: Array.from(state.resources.entries()),
  inventory: state.inventory
}

// deserialize() additions
resources: new Map(json.resources || []),
inventory: json.inventory || { dirt: 0, stone: 0 }
```

## State Transitions

### Resource Creation (Mining Completion)

**Trigger**: Tile durability ≤ 0 in mining system
**Preconditions**:
- Tile type is Dirt or Stone (not Air, not Bedrock)
- Tile entity exists at position

**Actions**:
1. Get tile type before conversion
2. Map tile type to resource type
3. Create new entity
4. Add Position component at tile coordinates
5. Add Resource component with mapped type
6. Convert tile to Air (existing behavior)

**Postconditions**:
- New resource entity in `state.resources`
- Resource has position matching mined tile
- Tile is now Air

### Resource Collection (Gnome Movement)

**Trigger**: Resource collection system runs each tick
**Preconditions**:
- Gnome entity exists with Position
- Resource entity exists at same tile position

**Actions**:
1. Increment inventory count for resource type
2. Remove resource from `state.resources`
3. Destroy resource entity

**Postconditions**:
- Resource entity removed from state
- Inventory count increased by 1

## Validation Rules

| Rule | Validation |
|------|------------|
| Resource type must be valid | `ResourceType.Dirt` or `ResourceType.Stone` only |
| Resource position must be valid | Within world bounds (0 to worldWidth-1, 0 to worldHeight-1) |
| Inventory counts must be non-negative | Integer ≥ 0 |
| Only one gnome collects a resource | First gnome to reach position in tick order |

## Relationships

```
TileType (1) ----maps to----> (0..1) ResourceType
    Dirt → Dirt
    Stone → Stone
    Air → null
    Bedrock → null

Resource Entity (1) ----has----> (1) Position Component
Resource Entity (1) ----has----> (1) Resource Component

Gnome Entity (many) ----collects----> (many) Resource Entity
    (Collection destroys resource, increments inventory)

GameState (1) ----contains----> (many) Resource Entity
GameState (1) ----contains----> (1) ResourceInventory
```
