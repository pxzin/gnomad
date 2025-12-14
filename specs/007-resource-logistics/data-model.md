# Data Model: Resource Logistics System

**Input**: spec.md, research.md
**Purpose**: Define all data structures, types, and interfaces

## Type Definitions

### Resource Component (Modified)

```typescript
// src/lib/components/resource.ts

/**
 * Resource component data.
 * Extended with physics state for falling/grounding.
 */
export interface Resource {
  /** Type of resource (determines inventory slot) */
  type: ResourceType;
  /** Whether the resource has landed on solid ground */
  isGrounded: boolean;
}

/**
 * Create a new Resource component.
 * Resources start as not grounded (will fall).
 */
export function createResource(type: ResourceType): Resource {
  return {
    type,
    isGrounded: false
  };
}
```

### Gnome Inventory Item

```typescript
// src/lib/components/gnome.ts

/**
 * Item in a gnome's personal inventory.
 */
export interface GnomeInventoryItem {
  /** Type of resource being carried */
  type: ResourceType;
}

/** Maximum items a gnome can carry */
export const GNOME_INVENTORY_CAPACITY = 5;
```

### Gnome Component (Modified)

```typescript
// src/lib/components/gnome.ts

/**
 * Gnome behavior states.
 * Extended with Depositing state.
 */
export enum GnomeState {
  Idle = 'idle',
  Walking = 'walking',
  Mining = 'mining',
  Falling = 'falling',
  Collecting = 'collecting',  // NEW: Picking up resource
  Depositing = 'depositing'   // NEW: Depositing at Storage
}

/**
 * Gnome component data.
 * Extended with personal inventory.
 */
export interface Gnome {
  /** Current behavior state */
  state: GnomeState;
  /** ID of the currently assigned task, or null if idle */
  currentTaskId: Entity | null;
  /** Current pathfinding result (array of positions to visit) */
  path: Position[] | null;
  /** Current index in the path array */
  pathIndex: number;
  /** Personal inventory of carried items (max 5) */
  inventory: GnomeInventoryItem[];
}

/**
 * Create a new Gnome component in idle state.
 */
export function createGnome(): Gnome {
  return {
    state: GnomeState.Idle,
    currentTaskId: null,
    path: null,
    pathIndex: 0,
    inventory: []
  };
}

/**
 * Check if gnome inventory has space.
 */
export function hasInventorySpace(gnome: Gnome): boolean {
  return gnome.inventory.length < GNOME_INVENTORY_CAPACITY;
}

/**
 * Add item to gnome inventory. Returns new gnome or null if full.
 */
export function addToGnomeInventory(
  gnome: Gnome,
  type: ResourceType
): Gnome | null {
  if (!hasInventorySpace(gnome)) return null;
  return {
    ...gnome,
    inventory: [...gnome.inventory, { type }]
  };
}

/**
 * Clear gnome inventory. Returns new gnome with empty inventory.
 */
export function clearGnomeInventory(gnome: Gnome): Gnome {
  return {
    ...gnome,
    inventory: []
  };
}
```

### Building Component (New)

```typescript
// src/lib/components/building.ts

/**
 * Types of buildings that can be placed.
 */
export enum BuildingType {
  Storage = 'storage'
}

/**
 * Building component data.
 * Base component for all building types.
 */
export interface Building {
  /** Type of building */
  type: BuildingType;
  /** Width in tiles */
  width: number;
  /** Height in tiles */
  height: number;
}

/**
 * Building visual configuration.
 */
export interface BuildingConfig {
  /** Hex color for MVP rendering */
  color: number;
  /** Default dimensions */
  width: number;
  height: number;
}

/**
 * Building type configurations.
 */
export const BUILDING_CONFIG: Record<BuildingType, BuildingConfig> = {
  [BuildingType.Storage]: {
    color: 0x8B4513,  // Saddle brown
    width: 2,
    height: 2
  }
};

/**
 * Create a new Building component.
 */
export function createBuilding(type: BuildingType): Building {
  const config = BUILDING_CONFIG[type];
  return {
    type,
    width: config.width,
    height: config.height
  };
}
```

### Storage Component (New)

```typescript
// src/lib/components/storage.ts

import { ResourceType } from './resource';

/**
 * Storage component data.
 * Contains deposited resources.
 */
export interface Storage {
  /** Map of resource type to count */
  contents: Map<ResourceType, number>;
}

/**
 * Create a new empty Storage component.
 */
export function createStorage(): Storage {
  return {
    contents: new Map()
  };
}

/**
 * Add resources to storage.
 */
export function addToStorage(
  storage: Storage,
  type: ResourceType,
  count: number = 1
): Storage {
  const newContents = new Map(storage.contents);
  const current = newContents.get(type) ?? 0;
  newContents.set(type, current + count);
  return { contents: newContents };
}

/**
 * Get total count of a resource type in storage.
 */
export function getStorageCount(storage: Storage, type: ResourceType): number {
  return storage.contents.get(type) ?? 0;
}

/**
 * Get total items in storage.
 */
export function getStorageTotal(storage: Storage): number {
  let total = 0;
  for (const count of storage.contents.values()) {
    total += count;
  }
  return total;
}
```

### Task Component (Modified)

```typescript
// src/lib/components/task.ts

/**
 * Types of tasks gnomes can perform.
 * Extended with Collect task.
 */
export enum TaskType {
  Dig = 'dig',
  Collect = 'collect'  // NEW
}

/**
 * Task component data.
 * Extended with optional target entity reference.
 */
export interface Task {
  /** Type of task to perform */
  type: TaskType;
  /** Target tile X coordinate */
  targetX: number;
  /** Target tile Y coordinate */
  targetY: number;
  /** Execution priority (higher = executed first) */
  priority: TaskPriority;
  /** Tick when this task was created (for FIFO within same priority) */
  createdAt: number;
  /** Entity ID of the gnome assigned to this task, or null if unassigned */
  assignedGnome: Entity | null;
  /** Task completion progress (0-100) */
  progress: number;
  /** Target entity ID (for Collect tasks: the resource to collect) */
  targetEntity: Entity | null;  // NEW
}

/**
 * Create a new collect task for a grounded resource.
 */
export function createCollectTask(
  targetX: number,
  targetY: number,
  resourceEntity: Entity,
  createdAt: number
): Task {
  return {
    type: TaskType.Collect,
    targetX,
    targetY,
    priority: TaskPriority.Normal,
    createdAt,
    assignedGnome: null,
    progress: 0,
    targetEntity: resourceEntity
  };
}

// Update existing createDigTask to include targetEntity: null
export function createDigTask(
  targetX: number,
  targetY: number,
  priority: TaskPriority,
  createdAt: number
): Task {
  return {
    type: TaskType.Dig,
    targetX,
    targetY,
    priority,
    createdAt,
    assignedGnome: null,
    progress: 0,
    targetEntity: null
  };
}
```

### GameState (Modified)

```typescript
// src/lib/game/state.ts

/**
 * Complete game state.
 * Extended with buildings and storages.
 */
export interface GameState {
  // ... existing fields ...

  // Component storage (existing)
  positions: Map<Entity, Position>;
  velocities: Map<Entity, Velocity>;
  tiles: Map<Entity, Tile>;
  gnomes: Map<Entity, Gnome>;
  tasks: Map<Entity, Task>;
  resources: Map<Entity, Resource>;

  // Component storage (NEW)
  buildings: Map<Entity, Building>;
  storages: Map<Entity, Storage>;

  // Note: inventory field repurposed or removed
  // HUD now computes totals from storages

  // ... rest of existing fields ...
}

/**
 * Serialized game state format.
 * Extended with buildings and storages.
 */
export interface SerializedGameState {
  // ... existing fields ...
  buildings: [number, Building][];
  storages: [number, SerializedStorage][];
}

/**
 * Serialized storage (Map converted to array).
 */
export interface SerializedStorage {
  contents: [ResourceType, number][];
}
```

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTITY TYPES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TILE ENTITY                                                    │
│  ├── Position                                                   │
│  └── Tile                                                       │
│                                                                 │
│  GNOME ENTITY                                                   │
│  ├── Position                                                   │
│  ├── Velocity                                                   │
│  └── Gnome (includes inventory[])                               │
│                                                                 │
│  RESOURCE ENTITY                                                │
│  ├── Position                                                   │
│  ├── Velocity                                                   │
│  └── Resource (type, isGrounded)                                │
│                                                                 │
│  STORAGE ENTITY (NEW)                                           │
│  ├── Position                                                   │
│  ├── Building (type=Storage, width, height)                     │
│  └── Storage (contents Map)                                     │
│                                                                 │
│  TASK ENTITY                                                    │
│  └── Task (includes targetEntity for Collect)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## State Flow Diagram

```
MINING FLOW:
┌──────────┐    ┌──────────────┐    ┌───────────────┐
│  Mine    │───>│ Drop Resource│───>│ Resource Falls│
│  Tile    │    │  (entity)    │    │  (physics)    │
└──────────┘    └──────────────┘    └───────┬───────┘
                                            │
                                            v
                                    ┌───────────────┐
                                    │Resource Lands │
                                    │(isGrounded=t) │
                                    └───────┬───────┘
                                            │
                                            v
                                    ┌───────────────┐
                                    │Create Collect │
                                    │    Task       │
                                    └───────────────┘

COLLECTION FLOW:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Assign Task  │───>│ Gnome Walks  │───>│ Gnome Picks  │
│  to Gnome    │    │ to Resource  │    │ Up Resource  │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                                               v
                                       ┌──────────────┐
                                       │ Add to Gnome │
                                       │  Inventory   │
                                       └──────┬───────┘
                                               │
                                               v
                                       ┌──────────────┐
                                       │Remove Resource│
                                       │Complete Task │
                                       └──────────────┘

DEPOSIT FLOW:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Gnome Has    │───>│ Gnome Walks  │───>│ Gnome Deposits│
│ Items+Storage│    │ to Storage   │    │ All Items    │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                                               v
                                       ┌──────────────┐
                                       │ Add to Storage│
                                       │   Contents   │
                                       └──────┬───────┘
                                               │
                                               v
                                       ┌──────────────┐
                                       │Clear Gnome   │
                                       │ Inventory    │
                                       └──────────────┘
```

## Serialization Notes

### Storage Contents
Storage.contents is a Map which needs special handling:
```typescript
// Serialize
const serialized = Array.from(storage.contents.entries());

// Deserialize
const contents = new Map(serializedContents);
```

### Gnome Inventory
Gnome.inventory is a simple array of objects, JSON-serializable as-is.

### Resource isGrounded
Boolean field, serializes naturally.

### Backwards Compatibility
- Old saves without `buildings`/`storages` fields: Initialize empty Maps
- Old saves without `gnome.inventory`: Initialize empty array
- Old saves without `resource.isGrounded`: Default to true (assume grounded)
- Old saves without `task.targetEntity`: Default to null
