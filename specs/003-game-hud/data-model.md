# Data Model: Game HUD/UI

**Feature**: 003-game-hud | **Date**: 2025-12-11

## Overview

This document defines the data structures for the HUD feature. The HUD primarily reads existing game state but requires one state extension for gnome selection.

## State Extensions

### GameState (existing, extended)

**File**: `src/lib/game/state.ts`

```typescript
interface GameState {
  // EXISTING - read by HUD
  tick: number;
  isPaused: boolean;
  speed: GameSpeed;  // 0.5 | 1 | 2
  gnomes: Map<Entity, Gnome>;
  tasks: Map<Entity, Task>;
  tiles: Map<Entity, Tile>;
  tileGrid: (Entity | null)[][];
  positions: Map<Entity, Position>;
  selectedTiles: { x: number; y: number }[];

  // NEW - added for HUD gnome selection
  selectedGnomes: Entity[];
}
```

### Selection Model

**Tile Selection** (existing):
```typescript
interface TileCoordinate {
  x: number;  // Grid X position
  y: number;  // Grid Y position
}

// Usage: state.selectedTiles: TileCoordinate[]
```

**Gnome Selection** (new):
```typescript
// Usage: state.selectedGnomes: Entity[]
// Entity is number (from src/lib/ecs/types.ts)
```

## Derived Types (for HUD display)

### SelectionInfo

Computed from `selectedTiles` and `selectedGnomes` for display in SelectionPanel.

```typescript
type SelectionInfo =
  | { type: 'none' }
  | { type: 'single-tile'; tile: TileInfo }
  | { type: 'single-gnome'; gnome: GnomeInfo }
  | { type: 'multiple'; tileCount: number; gnomeCount: number };

interface TileInfo {
  x: number;
  y: number;
  tileType: 'dirt' | 'stone';  // air tiles not selectable
  durability: number;
  maxDurability: number;
  hasDigTask: boolean;
}

interface GnomeInfo {
  entity: Entity;
  state: GnomeState;  // 'idle' | 'walking' | 'mining' | 'falling'
  currentTask: string | null;  // Task description or null
  position: { x: number; y: number };
}
```

### TaskProgress

Computed from `state.tasks` for display in TopBar.

```typescript
interface TaskProgress {
  assigned: number;   // Tasks with assignedGnome !== null
  total: number;      // Total task count
}
```

### ActionButtonState

Computed from selection for ActionBar display.

```typescript
interface ActionButtonState {
  label: string;           // "Dig (D)" or "Cancel Dig (D)"
  shortcut: string;        // "D"
  enabled: boolean;        // false if mixed selection or gnomes only
  action: 'dig' | 'cancel-dig';
}
```

## Existing Types (referenced, not modified)

### Entity
```typescript
// src/lib/ecs/types.ts
type Entity = number;
```

### Gnome Component
```typescript
// src/lib/components/gnome.ts
enum GnomeState {
  Idle = 'idle',
  Walking = 'walking',
  Mining = 'mining',
  Falling = 'falling'
}

interface Gnome {
  state: GnomeState;
  currentTaskId: Entity | null;
  path: { x: number; y: number }[] | null;
  pathIndex: number;
}
```

### Task Component
```typescript
// src/lib/components/task.ts
enum TaskType {
  Dig = 'dig'
}

interface Task {
  type: TaskType;
  targetX: number;
  targetY: number;
  priority: TaskPriority;
  createdAt: number;
  assignedGnome: Entity | null;
  progress: number;  // 0-100
}
```

### Tile Component
```typescript
// src/lib/components/tile.ts
enum TileType {
  Dirt = 'dirt',
  Stone = 'stone'
}

interface Tile {
  type: TileType;
  durability: number;
}
```

### Position Component
```typescript
// src/lib/components/position.ts
interface Position {
  x: number;  // Tile grid X
  y: number;  // Tile grid Y
}
```

### GameSpeed
```typescript
// src/lib/game/state.ts
type GameSpeed = 0.5 | 1 | 2;
```

## State Transitions

### Selection State Machine

```
[Nothing Selected]
    │
    ├─ Click on tile ──────────────→ [Tiles Selected]
    │                                      │
    │                                      ├─ Drag extends selection
    │                                      ├─ Click elsewhere → [Nothing Selected]
    │                                      └─ Press Escape → [Nothing Selected]
    │
    ├─ Click on gnome ─────────────→ [Gnomes Selected]
    │                                      │
    │                                      ├─ Shift+click adds/removes gnomes
    │                                      ├─ Click elsewhere → [Nothing Selected]
    │                                      └─ Press Escape → [Nothing Selected]
    │
    └─ Drag select with gnomes ────→ [Mixed Selection]
       in rectangle                        │
                                           ├─ Actions disabled
                                           └─ Press Escape → [Nothing Selected]
```

### Speed/Pause State

```
[Running at 1x]
    │
    ├─ Press Space ──────→ [Paused] ──── Press Space ──→ [Running at previous speed]
    │
    ├─ Press 1 ──────────→ [Running at 0.5x]
    ├─ Press 2 ──────────→ [Running at 1x]
    └─ Press 3 ──────────→ [Running at 2x]
```

Note: Speed values map as follows:
- Key "1" → `speed: 0.5` (displayed as "1x" in HUD for simplicity)
- Key "2" → `speed: 1` (displayed as "2x")
- Key "3" → `speed: 2` (displayed as "3x")

This matches existing behavior in `handler.ts:156-166`.

## Validation Rules

### Selection Validation

1. **Air tiles**: Must be excluded from `selectedTiles`. Validation in selection logic, not state.
2. **Dead gnomes**: If a gnome entity is removed from `state.gnomes`, it must be removed from `selectedGnomes`.
3. **Destroyed tiles**: If a tile becomes air (mining complete), it must be removed from `selectedTiles`.

### Action Validation

1. **Dig action**: Only enabled when `selectedTiles.length > 0` AND `selectedGnomes.length === 0`
2. **Cancel Dig**: Same as Dig - requires tiles only selection
3. **Mixed selection**: All actions disabled

## Initialization

### State Defaults

```typescript
// In createEmptyState() (state.ts)
{
  // ... existing fields ...
  selectedGnomes: []  // NEW - empty array by default
}
```

### Serialization

The `selectedGnomes` array should be included in `serialize()` and `deserialize()` functions for save/load support, following the same pattern as `selectedTiles`.
