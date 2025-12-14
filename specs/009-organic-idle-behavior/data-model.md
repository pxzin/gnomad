# Data Model: Organic Idle Behavior for Gnomes

**Feature**: 009-organic-idle-behavior
**Date**: 2025-12-14

## Entities

### IdleBehavior (NEW - embedded in Gnome component)

Represents the current idle activity of a gnome. This is an optional field on the existing Gnome interface, not a separate component.

```typescript
/**
 * Types of idle behaviors a gnome can perform.
 */
type IdleBehaviorType = 'strolling' | 'socializing' | 'resting';

/**
 * Idle behavior state for a gnome.
 * Stored as optional field on Gnome component.
 */
interface IdleBehavior {
  /** Type of idle behavior currently active */
  type: IdleBehaviorType;
  /** Tick when this behavior started (for duration tracking) */
  startedAt: number;
  /** Tick when this behavior should end */
  endsAt: number;
  /** Target position for strolling (tile coordinates) */
  targetX?: number;
  targetY?: number;
  /** Partner gnome entity for socialization */
  partnerEntity?: Entity;
}
```

### Gnome (MODIFIED - existing)

Add optional `idleBehavior` field to track current idle state.

```typescript
interface Gnome {
  state: GnomeState;
  currentTaskId: Entity | null;
  path: Position[] | null;
  pathIndex: number;
  inventory: GnomeInventoryItem[];
  depositTargetStorage?: Entity;
  /** Current idle behavior, null if working or truly idle */
  idleBehavior?: IdleBehavior | null;  // NEW FIELD
}
```

### GnomeState (UNCHANGED)

Existing states are sufficient:
- `Idle` - No task, potentially doing idle behavior
- `Walking` - Moving (either to task or during casual stroll)
- `Mining`, `Collecting`, `Depositing`, `Falling` - Work states

**Note**: We reuse `Walking` state for strolling. The `idleBehavior.type === 'strolling'` distinguishes casual strolls from work-related walking.

## New Configuration Constants

### Physics Constants

```typescript
// In src/lib/config/physics.ts

/** Gnome idle stroll speed (50% of normal walking speed) */
export const GNOME_IDLE_SPEED = 0.05; // tiles per tick (normal is 0.1)
```

### Performance Constants

```typescript
// In src/lib/config/performance.ts

/** Ticks between idle behavior system runs (same as task assignment) */
export const IDLE_BEHAVIOR_THROTTLE_TICKS = 10;

/** Maximum radius from colony center for idle strolls (tiles) */
export const IDLE_STROLL_MAX_RADIUS = 8;

/** Minimum radius from colony center for idle strolls (tiles) */
export const IDLE_STROLL_MIN_RADIUS = 3;

/** Maximum distance for socialization partner detection (tiles) */
export const SOCIALIZATION_MAX_DISTANCE = 3;
```

### Behavior Duration Constants

```typescript
// In src/lib/config/idle-behavior.ts (NEW FILE)

/** Minimum rest duration in ticks (10 seconds at 60 TPS) */
export const REST_MIN_DURATION_TICKS = 600;

/** Maximum rest duration in ticks (30 seconds at 60 TPS) */
export const REST_MAX_DURATION_TICKS = 1800;

/** Minimum socialization duration in ticks (5 seconds at 60 TPS) */
export const SOCIALIZE_MIN_DURATION_TICKS = 300;

/** Maximum socialization duration in ticks (15 seconds at 60 TPS) */
export const SOCIALIZE_MAX_DURATION_TICKS = 900;

/** Pause duration after completing a stroll (ticks) */
export const STROLL_PAUSE_DURATION_TICKS = 60; // 1 second

/** Behavior selection weights (must sum to 100) */
export const IDLE_BEHAVIOR_WEIGHTS = {
  stroll: 50,
  socialize: 35,
  rest: 15
} as const;
```

## Behavior State Machine

### Idle Behavior Flow

```
[Gnome completes task / becomes idle]
        │
        ▼
[Task Assignment System runs]
        │
        ├── Task available? ──Yes──▶ [Assign task, clear idleBehavior]
        │
        No
        ▼
[Idle Behavior System runs]
        │
        ├── Already has idleBehavior? ──Yes──▶ [Update current behavior]
        │                                              │
        No                                             ▼
        ▼                                    [Behavior ended?]
[Select random behavior]                           │
        │                                    ├── Yes ──▶ [Clear idleBehavior]
        ├── Stroll (50%) ──▶ [Find destination, set path]
        │                                    No
        ├── Socialize (35%) ──▶ [Find partner, walk toward]  │
        │                                              ▼
        └── Rest (15%) ──▶ [Stay in place]    [Continue behavior]
```

### State Transitions

| From State | Event | To State | Actions |
|------------|-------|----------|---------|
| Idle (no behavior) | System tick | Idle + strolling | Set path to random destination |
| Idle (no behavior) | System tick | Idle + socializing | Set partner, walk toward |
| Idle (no behavior) | System tick | Idle + resting | Set end time |
| Idle + strolling | Destination reached | Idle (no behavior) | Clear idleBehavior, brief pause |
| Idle + strolling | Task assigned | Walking (to task) | Clear idleBehavior immediately |
| Idle + socializing | Duration elapsed | Idle (no behavior) | Clear idleBehavior, notify partner |
| Idle + socializing | Task assigned | Walking (to task) | Clear idleBehavior immediately |
| Idle + resting | Duration elapsed | Idle (no behavior) | Clear idleBehavior |
| Idle + resting | Task assigned | Walking (to task) | Clear idleBehavior immediately |

## Relationships

```
GameState
├── gnomes: Map<Entity, Gnome>
│   └── Gnome.idleBehavior?: IdleBehavior  ◀── NEW
├── buildings: Map<Entity, Building>
├── storages: Map<Entity, Storage>  ──▶ Used to find colony center
└── positions: Map<Entity, Position>

IdleBehavior
├── type: IdleBehaviorType
├── startedAt: number (tick)
├── endsAt: number (tick)
├── targetX?, targetY?: number (for strolling)
└── partnerEntity?: Entity (for socializing)
    └── References another Gnome entity
```

## Rendering Data

### Socialization Indicator

When rendering gnomes that are socializing, draw a simple "..." indicator above their position.

```typescript
interface SocializationIndicator {
  x: number;        // Screen X position (above gnome)
  y: number;        // Screen Y position
  visible: boolean; // true if gnome.idleBehavior?.type === 'socializing'
}
```

The indicator is rendered as 3 small circles (ellipsis) using PixiJS Graphics, positioned 4 pixels above the gnome sprite.

## Validation Rules

1. **IdleBehavior.endsAt**: Must be > startedAt
2. **IdleBehavior.partnerEntity**: Must exist in state.gnomes (for socializing)
3. **IdleBehavior.targetX/Y**: Must be within world bounds (for strolling)
4. **Behavior weights**: IDLE_BEHAVIOR_WEIGHTS must sum to 100
5. **Speed constraint**: GNOME_IDLE_SPEED must be < GNOME_SPEED

## Serialization Notes

The `idleBehavior` field on Gnome is already JSON-serializable (no Maps or special types). No changes needed to serialize/deserialize functions in state.ts.

Backwards compatibility: Old saves without `idleBehavior` field will deserialize correctly since the field is optional. Gnomes will simply start without active idle behaviors and the system will assign them on next tick.
