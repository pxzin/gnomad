# Quickstart: Climbing Mechanics

**Feature**: 011-climbing-mechanics
**Date**: 2025-12-21

## Prerequisites

- Node.js 18+
- pnpm (package manager)
- Feature branch checked out: `git checkout 011-climbing-mechanics`

## Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run type checking
pnpm check

# Run tests
pnpm test
```

## Implementation Order

Follow this order to minimize dependencies and enable incremental testing:

### Phase 1: Core Components

1. **Add Health component** (`src/lib/components/gnome.ts`)
   - Add `Health` interface
   - Export `GNOME_MAX_HEALTH` constant
   - No dependencies

2. **Add climbing types** (`src/lib/components/climbing.ts`)
   - Create `ClimbableSurfaceType` enum
   - Create `SurfaceModifier` interface
   - No dependencies

3. **Add climbing config** (`src/lib/config/climbing.ts`)
   - Define `SURFACE_MODIFIERS` object
   - Define `GNOME_CLIMB_SPEED`, `BASE_FALL_CHANCE`
   - Depends on: climbing types

### Phase 2: State Extensions

4. **Extend GnomeState** (`src/lib/components/gnome.ts`)
   - Add `Climbing` and `Incapacitated` to enum
   - Add `fallStartY` field to Gnome interface
   - Update `createGnome()` factory

5. **Extend GameState** (`src/lib/game/state.ts`)
   - Add `healths: Map<Entity, Health>`
   - Update serialization/deserialization
   - Add backwards compatibility for old saves

6. **Add ECS accessors** (`src/lib/ecs/world.ts`)
   - Add `getHealth`, `updateHealth`, `hasHealth`
   - Follow existing patterns (getGnome, updateGnome)

### Phase 3: Systems

7. **Create health system** (`src/lib/systems/health.ts`)
   - `applyDamage()` - reduce health, trigger incapacitation
   - `recoverHealth()` - increment health for incapacitated gnomes
   - `healthSystem()` - main tick function

8. **Create climbing system** (`src/lib/systems/climbing.ts`)
   - `getClimbableSurface()` - detect surface type at position
   - `shouldFall()` - deterministic fall chance check
   - `climbingSystem()` - manage climbing state, trigger falls

9. **Extend physics system** (`src/lib/systems/physics.ts`)
   - Handle `GnomeState.Climbing` movement
   - Track `fallStartY` on fall start
   - Apply fall damage on landing

10. **Extend pathfinding** (`src/lib/systems/pathfinding.ts`)
    - Use `getClimbableSurface()` for cost lookup
    - Replace hardcoded `COST_CLIMB` with surface-specific costs

### Phase 4: Integration

11. **Update game loop** (`src/lib/game/loop.ts`)
    - Add `climbingSystem()` before physics
    - Add `healthSystem()` after physics

12. **Update task assignment** (`src/lib/systems/task-assignment.ts`)
    - Skip gnomes with `state === Incapacitated`

13. **Update spawn** (`src/lib/game/spawn.ts`)
    - Initialize Health component for new gnomes

### Phase 5: Testing

14. **Unit tests**
    - `tests/unit/health.test.ts` - damage, recovery, incapacitation
    - `tests/unit/climbing.test.ts` - surface detection, fall chance
    - `tests/unit/pathfinding.test.ts` - climbing route costs

15. **Integration tests**
    - `tests/integration/gnome-climbing.test.ts` - end-to-end scenarios

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/components/climbing.ts` | New types and enums |
| `src/lib/config/climbing.ts` | Configuration constants |
| `src/lib/systems/climbing.ts` | Climbing state management |
| `src/lib/systems/health.ts` | Health/damage system |

## Testing Locally

### Manual Testing

1. Start dev server: `pnpm dev`
2. Create a pit by mining downward
3. Observe gnome climbing out
4. Test fall from height (should see damage)

### Automated Tests

```bash
# Run specific test file
pnpm test src/tests/unit/climbing.test.ts

# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage
```

## Common Issues

### TypeScript Errors

If you see "Property does not exist" errors after adding new state fields:
- Ensure backwards compatibility in `deserialize()`
- Add optional chaining for new fields

### Save/Load Breaks

After adding `healths` map:
- Update `serialize()` to include new data
- Update `deserialize()` with migration for old saves

### Gnome Stuck

If gnomes don't climb:
- Check `getClimbableSurface()` returns correct type
- Verify pathfinding uses climbing costs
- Check horizon Y is set correctly
