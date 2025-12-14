# Research: Resource Logistics System

**Input**: spec.md for feature 007-resource-logistics
**Purpose**: Document design decisions and resolve technical questions

## Design Decisions

### DD-001: Resource Physics Implementation

**Question**: How should resource physics be implemented?

**Options**:
1. Extend existing physics.ts to handle resources alongside gnomes
2. Create dedicated resource-physics.ts system with simpler gravity logic
3. Reuse gnome physics by treating resources as entities with velocity

**Decision**: Option 2 - Create `resource-physics.ts`

**Rationale**:
- Resources have simpler physics than gnomes (no wall climbing, no pathfinding interruption)
- Gnome physics has complex state machine (Idle/Walking/Mining/Falling) - resources only need falling/grounded
- Separation of concerns: resource physics can be optimized independently
- Existing `physics.ts` (lines 52-152) is tightly coupled to gnome behavior

**Trade-offs**: Slightly more code, but cleaner separation and easier maintenance.

---

### DD-002: Gnome Inventory Storage

**Question**: Where should gnome inventory be stored?

**Options**:
1. Add `inventory` field directly to Gnome interface
2. Create separate GnomeInventory component with its own Map in GameState
3. Use existing task system to track carried items

**Decision**: Option 1 - Add `inventory` field to Gnome interface

**Rationale**:
- Inventory is intrinsic to gnome state (always 1:1 relationship)
- Simplifies serialization (already handled by gnomes Map)
- Follows existing pattern: Gnome has state, currentTaskId, path inline
- Option 2 would add unnecessary indirection for a simple array

**Implementation**:
```typescript
export interface Gnome {
  state: GnomeState;
  currentTaskId: Entity | null;
  path: Position[] | null;
  pathIndex: number;
  inventory: GnomeInventoryItem[];  // NEW: max 5 items
}

export interface GnomeInventoryItem {
  type: ResourceType;
}
```

---

### DD-003: Storage Building Entity Structure

**Question**: How should Storage buildings be modeled in ECS?

**Options**:
1. New `buildings` Map<Entity, Building> + `storages` Map<Entity, Storage>
2. Single `buildings` Map with Building component containing type-specific data
3. Just `storages` Map (buildings = storages for now)

**Decision**: Option 1 - Separate buildings and storages Maps

**Rationale**:
- Future-proof: Other building types will need different components
- Clear separation: Building component (position, type) vs Storage component (contents)
- Follows ECS principle: Components are composable (Storage IS-A Building)
- Pattern matches existing architecture (positions + gnomes = gnome entities)

**Implementation**:
```typescript
// New components
export interface Building {
  type: BuildingType;
  width: number;   // tiles
  height: number;  // tiles
}

export interface Storage {
  contents: Map<ResourceType, number>;
}

// GameState additions
buildings: Map<Entity, Building>;
storages: Map<Entity, Storage>;
```

---

### DD-004: Collect Task Target Reference

**Question**: How should Collect tasks reference their target resource?

**Options**:
1. Store resource Entity ID in task (same as task stores targetX/targetY)
2. Store position only (task finds resource at position)
3. Extend Task interface with optional `targetEntity` field

**Decision**: Option 3 - Extend Task interface with `targetEntity`

**Rationale**:
- Entity ID is stable reference (position could have multiple resources)
- Existing Task has targetX/targetY for Dig tasks - keep for pathfinding
- `targetEntity` is null for Dig tasks, set for Collect tasks
- Minimal change to existing Task interface

**Implementation**:
```typescript
export interface Task {
  type: TaskType;
  targetX: number;
  targetY: number;
  priority: TaskPriority;
  createdAt: number;
  assignedGnome: Entity | null;
  progress: number;
  targetEntity: Entity | null;  // NEW: Resource entity for Collect tasks
}
```

---

### DD-005: Resource State Tracking (Falling vs Grounded)

**Question**: How to track whether a resource is falling or grounded?

**Options**:
1. Add `isGrounded` boolean to Resource component
2. Track via velocity (dy === 0 means grounded)
3. Create separate `PhysicsState` component for entities with physics

**Decision**: Option 1 - Add `isGrounded` to Resource component

**Rationale**:
- Simple and explicit state tracking
- Velocity could be 0 temporarily during physics steps
- Resource component is already minimal (just `type`)
- Matches spec entity definition: "isGrounded (whether at rest)"

**Implementation**:
```typescript
export interface Resource {
  type: ResourceType;
  isGrounded: boolean;  // NEW: true when resting on solid tile
}
```

---

### DD-006: Deposit Task vs Automatic Behavior

**Question**: Should depositing create a Deposit task or be automatic behavior?

**Options**:
1. Create explicit Deposit task when gnome inventory is not empty
2. Automatic behavior: gnome seeks nearest Storage when not on a task
3. Hybrid: After completing Collect task, automatically chain to Deposit

**Decision**: Option 3 - Hybrid approach (chain Collect → Deposit)

**Rationale**:
- Spec FR-013: "Gnomes MUST automatically seek to deposit items when inventory is not empty and Storage exists"
- No need for player-created Deposit tasks
- After collecting, gnome should immediately deposit (not wait for task assignment)
- Simpler UX: player manages Collect tasks, system handles depositing

**Implementation**:
- When Collect task completes, system checks gnome inventory
- If not empty and Storage exists, create internal Deposit "behavior" (not task)
- Gnome state transitions: Collecting → Walking(to Storage) → Depositing → Idle

---

### DD-007: Global Inventory Source Change

**Question**: How should HUD resource counts be calculated?

**Options**:
1. Keep `state.inventory` but only update on Storage deposit
2. Replace `state.inventory` with computed sum of all Storage contents
3. Keep both: `state.inventory` for stored, add `state.totalResources` for all

**Decision**: Option 2 - Compute from Storage contents

**Rationale**:
- Spec FR-019: "HUD MUST display only resources that have been deposited in Storage"
- Spec FR-021: "HUD totals MUST aggregate resources from all Storages"
- Single source of truth: Storage contents
- Eliminates sync issues between inventory counter and actual storage

**Implementation**:
```typescript
// Remove state.inventory (or repurpose as computed cache)
// ResourcePanel computes totals from state.storages
function getStoredResources(state: GameState): ResourceInventory {
  const totals = { dirt: 0, stone: 0 };
  for (const storage of state.storages.values()) {
    totals.dirt += storage.contents.get(ResourceType.Dirt) ?? 0;
    totals.stone += storage.contents.get(ResourceType.Stone) ?? 0;
  }
  return totals;
}
```

---

### DD-008: Task Auto-Generation for Grounded Resources

**Question**: When/how should Collect tasks be auto-generated?

**Options**:
1. In resource-physics.ts when resource becomes grounded
2. Separate collect-task-generator.ts system running each tick
3. In mining.ts when resource is dropped (immediate task creation)

**Decision**: Option 1 - Generate in resource-physics.ts on grounding

**Rationale**:
- Spec FR-005: "System MUST automatically create Collect task when resource lands"
- Spec FR-006: "Collect tasks MUST NOT be created for resources still falling"
- Physics system already detects landing moment (state transition)
- Single responsibility: physics handles both movement and grounding event
- Avoids redundant iteration over resources in separate system

**Implementation**:
```typescript
// In resource-physics.ts
if (!wasGrounded && isGrounded) {
  // Resource just landed - create Collect task
  state = createCollectTask(state, resourceEntity, position);
}
```

---

## Resolved Questions

| Question | Resolution |
|----------|------------|
| How to handle resources falling into enclosed spaces? | Resources stay; Collect task exists but gnome pathfinding may fail (task remains unassigned) |
| What if gnome inventory full when assigned Collect? | Task system checks capacity before assignment (FR-011) |
| How to determine "nearest" Storage? | Manhattan distance from gnome position to Storage center |
| Should resources visually stack on same tile? | Yes, slight random offset (0-4px) for visual distinction |
| What happens to in-transit resources on save/load? | Gnome inventory serialized with gnome; resources in world serialized in resources Map |

---

## Technical Risks

### Risk 1: Performance with Many Resources
**Concern**: 100+ falling resources could impact 60fps
**Mitigation**: Resource physics is O(n) per tick, simpler than gnome physics. Batch position updates. Profile early.

### Risk 2: Task System Complexity
**Concern**: Adding Collect tasks alongside Dig tasks
**Mitigation**: TaskType enum already supports extension. Same assignment/completion flow.

### Risk 3: Pathfinding to Storage
**Concern**: Gnomes need to pathfind to Storage buildings
**Mitigation**: Reuse existing A* pathfinding. Storage position is known. Add GnomeState.Depositing.

---

## Dependencies

- Existing physics.ts constants (GRAVITY, TERMINAL_VELOCITY)
- Existing task assignment system
- Existing A* pathfinding
- Existing renderer infrastructure (for Storage rendering)

---

## Out of Scope (Future Considerations)

- Storage destruction dropping contents
- Visual indicator on gnome sprite for inventory
- Resource decay/expiration
- Storage capacity limits
- Multiple Storage types
- Prioritized collection (rare resources first)
