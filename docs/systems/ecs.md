# ECS (Entity-Component-System) Architecture

**Date**: 2025-12-11

## Overview

The game uses a custom, minimal ECS architecture following the constitution principles. The implementation prioritizes simplicity and type safety over performance optimization (which is not needed at MVP scale).

## Core Concepts

### Entity

An entity is simply a unique numeric identifier. Entities have no behavior or data themselves - they are just IDs used to associate components.

```typescript
type Entity = number;
```

### Components

Components are plain TypeScript interfaces containing only data (no methods). Each component type is stored in a `Map<Entity, Component>` within the game state.

Available components:
- **Position**: World coordinates (x, y in tile units)
- **Velocity**: Movement direction and speed (dx, dy)
- **Tile**: Terrain type and durability
- **Gnome**: State, current task, path
- **Task**: Type, target, priority, progress, assigned gnome
- **Camera**: Viewport position and zoom

### Systems

Systems are pure functions that operate on entities with specific component combinations. They take the current game state and return a new state.

```typescript
type SystemUpdate = (state: GameState) => GameState;
```

## Implementation Details

### Entity Management

Entities are created via `createEntity()` which returns a tuple of new state and entity ID:

```typescript
const [newState, entity] = createEntity(state);
```

Entities are destroyed via `destroyEntity()` which removes all components:

```typescript
const newState = destroyEntity(state, entity);
```

### Component Access

Each component type has dedicated functions:
- `addPosition()`, `getPosition()`, `hasPosition()`, `updatePosition()`
- Similar patterns for all component types

Updates use functional patterns:

```typescript
state = updateGnome(state, entity, (gnome) => ({
  ...gnome,
  state: GnomeState.Walking
}));
```

### Game State

All component maps are stored in the centralized `GameState` interface:

```typescript
interface GameState {
  // Entity management
  nextEntityId: Entity;

  // Component storage
  positions: Map<Entity, Position>;
  velocities: Map<Entity, Velocity>;
  tiles: Map<Entity, Tile>;
  gnomes: Map<Entity, Gnome>;
  tasks: Map<Entity, Task>;

  // World data
  tileGrid: (Entity | null)[][];
  camera: Camera;
  // ...
}
```

## System Execution Order

Systems are executed in this order each tick:

1. **Physics System**: Handles gravity, falling, and movement along paths
2. **Task Assignment System**: Assigns unassigned tasks to idle gnomes
3. **Mining System**: Processes mining actions and tile destruction

## Design Decisions

### Why Custom ECS?

- **Simplicity**: MVP scale (1 gnome, 5000 tiles) doesn't need optimized ECS libraries
- **Type Safety**: Full TypeScript typing with explicit component interfaces
- **Transparency**: Easy to understand and debug
- **No Dependencies**: Follows constitution's minimal dependency principle

### Why Maps?

- Simple O(1) lookup and insertion
- Native JavaScript, well-optimized
- Easy serialization via `Array.from(map.entries())`

### Why Pure Functions?

- Deterministic behavior required for replay
- Easy testing and debugging
- Immutable patterns prevent accidental state mutations

## Files

- `src/lib/ecs/types.ts`: Core type definitions
- `src/lib/ecs/world.ts`: Entity and component management functions
- `src/lib/components/*.ts`: Component interfaces and factories
- `src/lib/systems/*.ts`: System implementations
