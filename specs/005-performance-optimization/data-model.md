# Data Model: Performance Optimization

**Date**: 2025-12-11
**Branch**: 005-performance-optimization

## Overview

This document defines new data structures and modifications to existing ones to support performance optimizations.

## New Entities

### 1. Binary Heap (Priority Queue)

A min-heap for efficient A* open set operations.

```
BinaryHeap<T>
├── items: T[]              # Heap array storage
├── size: number            # Current number of elements
├── compareFn: (a, b) => number  # Comparison function
│
├── push(item: T): void     # O(log n) insert
├── pop(): T | undefined    # O(log n) remove min
├── peek(): T | undefined   # O(1) view min
├── update(item: T): void   # O(log n) update priority
└── clear(): void           # O(1) reset
```

**Purpose**: Replace array sorting in pathfinding.

### 2. Task Cache

Cached sorted task list with invalidation.

```
TaskCache
├── sortedTasks: [Entity, Task][]  # Pre-sorted task list
├── isDirty: boolean               # Needs re-sort flag
├── lastSortTick: number           # When last sorted
│
├── invalidate(): void             # Mark as dirty
├── getSorted(state): [Entity, Task][]  # Get or rebuild
└── onTaskChange(): void           # Called on add/remove
```

**Purpose**: Avoid sorting 2000 tasks every tick.

### 3. Path Cache

Cached pathfinding results with validity tracking.

```
PathCache
├── cache: Map<string, CachedPath>  # startX,startY,endX,endY -> path
├── worldVersion: number            # Increments when world changes
│
├── get(start, end): Position[] | null  # Get cached path
├── set(start, end, path): void    # Store path
├── invalidate(): void             # Clear on world change
└── generateKey(start, end): string
```

```
CachedPath
├── path: Position[]        # The computed path
├── worldVersion: number    # World version when computed
└── timestamp: number       # Tick when computed
```

**Purpose**: Reuse paths when world hasn't changed.

### 4. Dirty Tracking

Track what needs re-rendering.

```
RenderDirtyFlags
├── tiles: Set<Entity>      # Tiles that changed
├── gnomes: Set<Entity>     # Gnomes that moved
├── taskMarkers: boolean    # Task markers changed
├── selection: boolean      # Selection changed
│
├── markTileDirty(entity): void
├── markGnomeDirty(entity): void
├── markTasksDirty(): void
├── clear(): void
└── hasDirtyTiles(): boolean
```

**Purpose**: Only redraw what changed.

## Modified Entities

### GameState (Modified)

Add performance-related caches.

```
GameState (additions)
├── taskCache: TaskCache           # Cached sorted tasks
├── pathCache: PathCache           # Cached paths
├── renderDirty: RenderDirtyFlags  # What needs redraw
├── worldVersion: number           # Increments on world change
└── lastAssignmentTick: number     # For throttling
```

### Renderer (Modified)

Add cached graphics state.

```
Renderer (additions)
├── tileColors: Map<Entity, number>    # Last drawn color per tile
├── gnomePositions: Map<Entity, {x,y}> # Last drawn position per gnome
└── taskMarkerPath: GraphicsPath       # Batched task markers
```

## Configuration Constants

New constants for `src/lib/config/performance.ts`:

```
TASK_ASSIGNMENT_THROTTLE_TICKS = 10   # Run assignment every N ticks
MAX_PATHFIND_ATTEMPTS_PER_GNOME = 10  # Stop after N failed pathfinds
PATH_CACHE_MAX_SIZE = 1000            # Max cached paths
PATH_CACHE_TTL_TICKS = 300            # Path validity in ticks
```

## Data Flow

### Task Assignment Flow (Optimized)

```
1. Check: tick % THROTTLE_TICKS == 0?
   └─ No → Skip this tick
   └─ Yes → Continue

2. Get cached sorted tasks
   └─ If dirty: sort and cache
   └─ If clean: use cached

3. For each idle gnome (max N):
   └─ For each task (max M attempts):
       └─ Check path cache
           └─ Hit → Use cached path
           └─ Miss → Compute and cache
       └─ If path found → Assign, break
       └─ If attempts exceeded → Skip gnome
```

### Render Flow (Optimized)

```
1. Check dirty flags

2. Tiles:
   └─ For each dirty tile:
       └─ Update graphics
   └─ Clear dirty set

3. Gnomes:
   └─ For each dirty gnome:
       └─ Update position
   └─ Clear dirty set

4. Task Markers:
   └─ If taskMarkers dirty:
       └─ Rebuild batched path
       └─ Clear flag

5. Selection:
   └─ If selection dirty:
       └─ Redraw selection
       └─ Clear flag
```

## Entity Relationships

```
GameState
    │
    ├── TaskCache ─────────┐
    │       │              │
    │       └──> tasks ────┤ (references)
    │                      │
    ├── PathCache          │
    │       │              │
    │       └──> paths ────┤ (computed from world)
    │                      │
    ├── RenderDirtyFlags   │
    │       │              │
    │       └──> tiles ────┘
    │       └──> gnomes
    │
    └── worldVersion ──────> PathCache.invalidate()
```

## Validation Rules

1. **TaskCache.sortedTasks** must only contain unassigned tasks
2. **PathCache** entries must be invalidated when worldVersion changes
3. **RenderDirtyFlags** must be cleared after render completes
4. **worldVersion** must increment on any tile modification
5. **THROTTLE_TICKS** must be > 0

## State Transitions

### Task Cache States

```
VALID ──[task added/removed]──> DIRTY
DIRTY ──[getSorted called]──> VALID
```

### Path Cache Entry States

```
CACHED ──[world changed]──> INVALID
CACHED ──[TTL expired]──> INVALID
INVALID ──[removed from cache]──> (deleted)
NEW ──[path computed]──> CACHED
```

### Dirty Flag States

```
CLEAN ──[entity changed]──> DIRTY
DIRTY ──[render completed]──> CLEAN
```
