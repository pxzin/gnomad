# Data Model: Climbing Mechanics

**Feature**: 011-climbing-mechanics
**Date**: 2025-12-21

## Entities

### Health (New Component)

Tracks current and maximum health for entities that can take damage.

| Field | Type | Description |
|-------|------|-------------|
| `current` | `number` | Current health points (0 = incapacitated) |
| `max` | `number` | Maximum health points (recovery target) |

**Validation Rules**:
- `current >= 0`
- `current <= max`
- `max > 0`

**Lifecycle**:
- Created when gnome spawns (100/100)
- Decremented on fall damage
- Incremented on recovery (when incapacitated + stationary)
- Persisted in save state

---

### GnomeState (Extended Enum)

Extended to include climbing and incapacitated states.

| Value | Description |
|-------|-------------|
| `Idle` | (existing) No current activity |
| `Walking` | (existing) Following path |
| `Mining` | (existing) Breaking tile |
| `Falling` | (existing) Affected by gravity |
| `Collecting` | (existing) Picking up resource |
| `Depositing` | (existing) Storing resource |
| `Climbing` | (new) Ascending/descending surface |
| `Incapacitated` | (new) Health at 0, recovering |

**State Transitions**:
```
Idle/Walking → Climbing (when pathfinding selects climb move)
Climbing → Falling (on fall chance trigger OR surface destroyed)
Climbing → Walking (climb complete, continue path)
Falling → Idle/Incapacitated (on landing, depends on damage)
Any → Incapacitated (when health reaches 0)
Incapacitated → Idle (when health > 0)
```

---

### Gnome (Extended Component)

Additional fields for climbing and fall tracking.

| Field | Type | Description |
|-------|------|-------------|
| ... | ... | (existing fields) |
| `fallStartY` | `number \| null` | Y position when fall started (for damage calculation) |

**Validation Rules**:
- `fallStartY` set when transitioning to Falling state
- `fallStartY` cleared on landing

---

### ClimbableSurfaceType (New Enum)

Identifies what type of surface a gnome can climb at a position.

| Value | Description | Speed Modifier | Fall Chance Modifier |
|-------|-------------|----------------|----------------------|
| `BlockEdge` | Adjacent foreground block | 1.0x | 1.0x |
| `BackgroundBlock` | Background tile present | 0.8x | 1.2x |
| `CaveBackground` | Cave permanent background | 0.6x | 1.5x |
| `None` | Sky or no surface (not climbable) | N/A | N/A |

---

### SurfaceModifier (New Interface)

Configuration for each climbable surface type.

| Field | Type | Description |
|-------|------|-------------|
| `speedMultiplier` | `number` | Multiplier applied to base climb speed |
| `fallChanceMultiplier` | `number` | Multiplier applied to base fall chance |
| `pathfindingCost` | `number` | Cost for A* pathfinding |

---

## GameState Extensions

### New Maps

| Map | Key | Value | Description |
|-----|-----|-------|-------------|
| `healths` | `Entity` | `Health` | Health components for all gnomes |

### Serialization

Add to `SerializedGameState`:
```typescript
healths?: [number, Health][];  // Optional for backwards compatibility
```

Deserialization default: If missing, create Health(100, 100) for each gnome.

---

## Configuration Constants

### `config/climbing.ts` (New File)

| Constant | Value | Description |
|----------|-------|-------------|
| `GNOME_CLIMB_SPEED` | `0.03` | Base climb speed (30% of GNOME_SPEED 0.1) |
| `BASE_FALL_CHANCE` | `0.001` | Per-tick fall probability (~6% over 60 ticks) |
| `FALL_DAMAGE_THRESHOLD` | `3` | Minimum tiles to take damage |
| `FALL_DAMAGE_PER_TILE` | `10` | Damage per tile above threshold |

### `config/physics.ts` (Extended)

| Constant | Value | Description |
|----------|-------|-------------|
| `GNOME_MAX_HEALTH` | `100` | Starting/max health for gnomes |
| `HEALTH_RECOVERY_RATE` | `1` | HP recovered per tick when incapacitated |

### Surface Modifiers (in `config/climbing.ts`)

```typescript
export const SURFACE_MODIFIERS: Record<ClimbableSurfaceType, SurfaceModifier> = {
  [ClimbableSurfaceType.BlockEdge]: {
    speedMultiplier: 1.0,
    fallChanceMultiplier: 1.0,
    pathfindingCost: 5
  },
  [ClimbableSurfaceType.BackgroundBlock]: {
    speedMultiplier: 0.8,
    fallChanceMultiplier: 1.2,
    pathfindingCost: 6
  },
  [ClimbableSurfaceType.CaveBackground]: {
    speedMultiplier: 0.6,
    fallChanceMultiplier: 1.5,
    pathfindingCost: 8
  },
  [ClimbableSurfaceType.None]: {
    speedMultiplier: 0,
    fallChanceMultiplier: 0,
    pathfindingCost: Infinity
  }
};
```

---

## Relationships

```
Gnome 1──1 Health       (every gnome has health)
Gnome 1──* Position     (existing: gnome position in world)
Position ──> ClimbableSurfaceType  (derived at runtime from world state)
```

---

## Queries

### Common Access Patterns

| Query | Implementation | Frequency |
|-------|----------------|-----------|
| Get gnome health | `state.healths.get(entity)` | Per-tick per gnome |
| Get climbable surface | `getClimbableSurface(state, x, y)` | Per pathfind neighbor |
| Is gnome incapacitated? | `gnome.state === GnomeState.Incapacitated` | Per-tick (task assignment) |
| Active gnomes | Filter `state.gnomes` by `state !== Incapacitated` | Per task cycle |

---

## Migration

### Backwards Compatibility

When loading saves without health data:
1. Check if `healths` exists in serialized data
2. If missing, create `Health { current: 100, max: 100 }` for each gnome entity
3. Add `fallStartY: null` to gnomes missing the field

### Forward Compatibility

New fields are optional with sensible defaults - older game versions will ignore them.
