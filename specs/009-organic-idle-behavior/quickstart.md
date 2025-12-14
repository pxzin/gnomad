# Quickstart: Organic Idle Behavior for Gnomes

**Feature**: 009-organic-idle-behavior
**Date**: 2025-12-14

## Overview

This feature adds organic idle behaviors to gnomes when they have no work tasks. Instead of standing frozen, gnomes will:
- Take casual strolls near the Storage (50% chance)
- Socialize with nearby idle gnomes (35% chance)
- Rest in place (15% chance)

All behaviors are immediately interrupted when work becomes available.

## Prerequisites

- Gnomes At Work development environment set up
- Node.js 18+ and pnpm installed
- Feature branch `009-organic-idle-behavior` checked out

## Quick Start

```bash
# 1. Ensure you're on the feature branch
git checkout 009-organic-idle-behavior

# 2. Install dependencies (if needed)
pnpm install

# 3. Run development server
pnpm dev

# 4. Run type checking
pnpm check

# 5. Run tests
pnpm test
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/components/gnome.ts` | Gnome component with IdleBehavior field |
| `src/lib/config/idle-behavior.ts` | Behavior weights and duration constants |
| `src/lib/systems/idle-behavior.ts` | Main idle behavior system |
| `src/lib/systems/task-assignment.ts` | Clears idle behavior on task assignment |
| `src/lib/render/renderer.ts` | Socialization indicator rendering |

## Implementation Steps

### Step 1: Add IdleBehavior Type

In `src/lib/components/gnome.ts`:

```typescript
export type IdleBehaviorType = 'strolling' | 'socializing' | 'resting';

export interface IdleBehavior {
  type: IdleBehaviorType;
  startedAt: number;
  endsAt: number;
  targetX?: number;
  targetY?: number;
  partnerEntity?: Entity;
}

export interface Gnome {
  // ... existing fields ...
  idleBehavior?: IdleBehavior | null;
}
```

### Step 2: Add Configuration Constants

Create `src/lib/config/idle-behavior.ts`:

```typescript
export const IDLE_BEHAVIOR_WEIGHTS = {
  stroll: 50,
  socialize: 35,
  rest: 15
} as const;

export const REST_MIN_DURATION_TICKS = 600;  // 10 seconds
export const REST_MAX_DURATION_TICKS = 1800; // 30 seconds
// ... other constants
```

In `src/lib/config/physics.ts`:

```typescript
export const GNOME_IDLE_SPEED = 0.05; // 50% of GNOME_SPEED
```

### Step 3: Create Idle Behavior System

In `src/lib/systems/idle-behavior.ts`:

```typescript
export function idleBehaviorSystem(state: GameState): GameState {
  // Throttle: only run every N ticks
  if (state.tick % IDLE_BEHAVIOR_THROTTLE_TICKS !== 0) {
    return state;
  }

  // Find colony center (Storage position)
  const colonyCenter = findColonyCenter(state);

  // Process each idle gnome
  for (const [entity, gnome] of state.gnomes) {
    if (gnome.currentTaskId !== null) continue; // Has task, skip

    if (gnome.idleBehavior) {
      // Update existing behavior
      state = updateIdleBehavior(state, entity, gnome);
    } else {
      // Assign new idle behavior
      state = assignIdleBehavior(state, entity, gnome, colonyCenter);
    }
  }

  return state;
}
```

### Step 4: Update Task Assignment

In `src/lib/systems/task-assignment.ts`, when assigning a task:

```typescript
currentState = updateGnome(currentState, gnomeEntity, (g) => ({
  ...g,
  state: GnomeState.Walking,
  currentTaskId: taskEntity,
  path: path,
  pathIndex: 0,
  idleBehavior: null  // Clear any idle behavior
}));
```

### Step 5: Add Socialization Indicator

In `src/lib/render/renderer.ts`, within `renderGnomes()`:

```typescript
// After rendering gnome sprite
if (gnome.idleBehavior?.type === 'socializing') {
  renderSocializationIndicator(graphics, screenX, screenY - 4);
}
```

## Testing

### Manual Testing

1. Start game with no dig tasks
2. Spawn 3+ gnomes and observe idle behaviors
3. Verify gnomes walk slowly around Storage
4. Verify nearby gnomes occasionally "chat" (show "...")
5. Create a dig task and verify immediate response

### Verification Checklist

- [ ] Gnomes start idle behavior within 5 seconds of becoming idle
- [ ] Strolling gnomes move at visibly slower speed
- [ ] Socializing gnomes show "..." indicator above them
- [ ] Creating a task immediately interrupts all idle behaviors
- [ ] Game maintains 60 FPS with 10+ idle gnomes
- [ ] Gnomes stay within 8 tiles of Storage during strolls

## Behavior Reference

| Behavior | Weight | Duration | Visual |
|----------|--------|----------|--------|
| Stroll | 50% | Until destination reached | Slow walking |
| Socialize | 35% | 5-15 seconds | Two gnomes + "..." |
| Rest | 15% | 10-30 seconds | Stationary |

## Troubleshooting

### Gnomes not showing idle behaviors
- Check that task queue is empty
- Verify idle behavior system is in game loop
- Check console for errors

### Gnomes walking too fast during stroll
- Verify GNOME_IDLE_SPEED is 0.05 (not 0.1)
- Check that speed selection uses idleBehavior.type

### Socialization indicator not showing
- Verify renderSocializationIndicator is called
- Check gnome.idleBehavior.type value
- Verify both partners have socializing behavior

### Performance issues
- Ensure IDLE_BEHAVIOR_THROTTLE_TICKS is set to 10
- Check pathfinding retry limit is respected
- Profile with browser dev tools
