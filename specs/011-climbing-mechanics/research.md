# Research: Climbing Mechanics

**Feature**: 011-climbing-mechanics
**Date**: 2025-12-21

## Research Topics

### 1. Seeded PRNG for Fall Chance

**Context**: Fall chance must be deterministic per constitution principle V.

**Decision**: Use existing `createRNG(seed)` from `src/lib/world-gen/noise.ts`

**Rationale**:
- Project already has a mulberry32 PRNG implementation
- Creates deterministic random numbers from seed
- Can derive per-gnome seed from `(gameSeed * 1000 + entity + tick)` for unique but reproducible sequences
- Supports save/load via `RNGState` tracking

**Alternatives considered**:
- Store RNG state per gnome: Rejected - adds serialization complexity for minimal benefit
- Use tick modulo: Rejected - creates predictable patterns gnomes could "exploit"

**Implementation**:
```typescript
// In climbing system
function shouldFall(seed: number, entity: number, tick: number, baseFallChance: number): boolean {
  const rng = createRNG(seed * 1000 + entity + tick);
  return rng() < baseFallChance;
}
```

---

### 2. Climbable Surface Detection

**Context**: Need to identify what surface type a gnome is climbing to apply modifiers.

**Decision**: Create `getClimbableSurface()` function that checks in priority order:

1. **Block Edge** - Adjacent foreground block (solid tile left or right)
2. **Background Block** - Background tile at current position
3. **Cave Background** - Position below horizon with no background tile
4. **Not Climbable** - Sky background (above horizon, no background tile)

**Rationale**:
- Leverages existing `isSolid()`, `getBackgroundTileAt()`, `getPermanentBackgroundType()` functions
- Priority order matches spec: block edges > background blocks > cave background
- Sky is never climbable (FR-004)

**Implementation**:
```typescript
export enum ClimbableSurfaceType {
  BlockEdge = 'block_edge',
  BackgroundBlock = 'background_block',
  CaveBackground = 'cave_background',
  None = 'none'  // Sky or no surface
}

function getClimbableSurface(state: GameState, x: number, y: number): ClimbableSurfaceType {
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);

  // Check adjacent foreground blocks (block edge)
  if (isSolid(state, tileX - 1, tileY) || isSolid(state, tileX + 1, tileY)) {
    return ClimbableSurfaceType.BlockEdge;
  }

  // Check background tile at position
  const bgEntity = getBackgroundTileAt(state, tileX, tileY);
  if (bgEntity !== null) {
    return ClimbableSurfaceType.BackgroundBlock;
  }

  // Check permanent background (cave vs sky)
  if (getPermanentBackgroundType(state, tileY) === PermanentBackgroundType.Cave) {
    return ClimbableSurfaceType.CaveBackground;
  }

  return ClimbableSurfaceType.None;  // Sky - not climbable
}
```

**Alternatives considered**:
- Single boolean `canClimb()`: Rejected - need surface type for speed/fall modifiers
- Store climbability in tile: Rejected - dynamic based on adjacent tiles

---

### 3. Health Component Design

**Context**: Gnomes need health tracking for fall damage and incapacitation.

**Decision**: Separate Health component (not embedded in Gnome)

**Rationale**:
- Follows ECS principle - pure data, reusable for future combat/hazards
- Can be queried independently for UI display
- Simpler serialization (just add to GameState.healths Map)

**Data structure**:
```typescript
export interface Health {
  current: number;  // Current HP
  max: number;      // Maximum HP (for recovery target)
}

// Constants
export const GNOME_MAX_HEALTH = 100;
export const HEALTH_RECOVERY_RATE = 1;  // HP per tick when incapacitated
```

**Alternatives considered**:
- Embed in Gnome component: Rejected - mixes concerns, harder to reuse
- Percentage-based (0-1): Rejected - integers clearer for damage formula

---

### 4. Incapacitated State Integration

**Context**: Incapacitated gnomes cannot perform tasks until recovered.

**Decision**: Add `GnomeState.Incapacitated` and filter in task assignment

**Rationale**:
- Follows existing GnomeState pattern (Idle, Walking, Mining, etc.)
- Task assignment system already checks gnome state
- Visual feedback via state change (renderer can show different appearance)

**Integration points**:
1. `task-assignment.ts` - Skip gnomes with state `Incapacitated`
2. `physics.ts` - No movement for incapacitated gnomes
3. `health.ts` (new) - Recovery system transitions back to Idle

**Alternatives considered**:
- Separate boolean `isIncapacitated`: Rejected - GnomeState handles this pattern
- Remove gnome from active list: Rejected - need to render, track, recover

---

### 5. Pathfinding Cost Modifiers

**Context**: Climbing routes should have higher costs, varying by surface type.

**Decision**: Extend existing `getNeighbors()` with surface-aware climb costs

**Current code** (`pathfinding.ts:24`):
```typescript
const COST_CLIMB = 5; // Climb vertically (wall climbing penalty)
```

**New approach**:
```typescript
const COST_CLIMB_BLOCK_EDGE = 5;      // Current value (base)
const COST_CLIMB_BACKGROUND = 6;       // 1.2x base
const COST_CLIMB_CAVE = 8;             // 1.6x base (accounts for fall risk)
```

**Rationale**:
- Extends existing cost system without breaking changes
- Higher costs for riskier surfaces match spec intent
- Pathfinding already checks `canClimb()` - extend to `getClimbCost()`

**Alternatives considered**:
- Weighted by fall probability: Rejected - too complex, fall is probabilistic
- Flat high cost for all climbing: Rejected - loses surface differentiation

---

### 6. Fall Damage Formula

**Context**: `damage = (fall height - 2) * 10` per spec.

**Decision**: Track fall start position, calculate on landing

**Implementation**:
```typescript
// Add to Gnome component (or separate FallState component)
fallStartY?: number;  // Y position when falling started

// In physics system, on landing:
if (gnome.state === GnomeState.Falling && landed) {
  const fallDistance = Math.floor(newY - gnome.fallStartY);
  if (fallDistance >= 3) {
    const damage = (fallDistance - 2) * 10;
    state = applyDamage(state, entity, damage);
  }
}
```

**Rationale**:
- Simple integer math matches spec exactly
- Track start position avoids complex height accumulation
- Handles interrupted falls (grab wall mid-fall) correctly

**Alternatives considered**:
- Velocity-based damage: Rejected - spec gives explicit formula
- Accumulate per tick: Rejected - harder to match spec formula

---

## Summary

All technical unknowns resolved. Key decisions:

| Topic | Decision |
|-------|----------|
| PRNG for fall chance | Use existing `createRNG()` with entity+tick seed derivation |
| Surface detection | Priority-based check: block edge > background > cave > sky |
| Health component | Separate component, 100 max HP, 1 HP/tick recovery |
| Incapacitated state | Add to GnomeState enum, filter in task assignment |
| Pathfinding costs | Surface-specific costs (5/6/8) for climb moves |
| Fall damage | Track start Y, apply formula on landing |

Ready for Phase 1: Data Model & Contracts.
