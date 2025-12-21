# Feature Specification: Climbing Mechanics

**Feature Branch**: `011-climbing-mechanics`
**Created**: 2025-12-21
**Status**: Draft
**Input**: User description: "Implement climbing system for gnomes to navigate vertical terrain with speed penalties and fall risk"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gnome Escapes from Pit (Priority: P1)

A gnome gets trapped in a pit (vertical hole with no horizontal exit) and needs to climb out using available surfaces.

**Why this priority**: This is the core problem the feature solves - gnomes currently get stuck in holes with no way out. Without this, mining operations can result in permanently trapped gnomes.

**Independent Test**: Can be fully tested by placing a gnome in a 3-block deep pit and observing it climb out. Delivers the fundamental value of terrain navigation.

**Acceptance Scenarios**:

1. **Given** a gnome is at the bottom of a 3-block pit with foreground block walls, **When** the gnome needs to exit, **Then** the gnome climbs up the block edges at reduced speed and exits the pit
2. **Given** a gnome is climbing a surface, **When** observing the gnome's movement, **Then** the gnome moves at 30% of normal walking speed
3. **Given** a gnome is in a pit with only background blocks on walls (no foreground edges), **When** the gnome needs to exit, **Then** the gnome climbs the background block surface to escape

---

### User Story 2 - Fall Risk During Climbing (Priority: P2)

Gnomes experience risk of falling while climbing, adding strategic depth and tension to vertical navigation.

**Why this priority**: Adds the risk/reward mechanic that creates meaningful gameplay decisions (build infrastructure vs. risk climbing). Secondary to basic climbing functionality.

**Independent Test**: Can be tested by having gnomes perform extended climbing sessions and observing occasional falls. Delivers strategic depth through risk management.

**Acceptance Scenarios**:

1. **Given** a gnome is actively climbing, **When** time passes, **Then** there is a chance per game tick that the gnome loses grip and falls
2. **Given** a gnome is climbing a cave background surface, **When** compared to climbing foreground block edges, **Then** the fall chance is higher on cave background
3. **Given** a gnome falls from climbing, **When** the gnome lands, **Then** the gnome receives damage based on fall distance

---

### User Story 3 - Fall Damage and Incapacitation (Priority: P2)

Gnomes take damage from falling significant heights and become incapacitated when health reaches zero.

**Why this priority**: Creates consequences for falls, making climbing a meaningful risk. Ties directly to the fall mechanic.

**Independent Test**: Can be tested by dropping gnomes from various heights and observing health reduction and incapacitation state.

**Acceptance Scenarios**:

1. **Given** a gnome falls less than 3 tiles, **When** the gnome lands, **Then** the gnome takes no damage
2. **Given** a gnome falls 3 or more tiles, **When** the gnome lands, **Then** the gnome takes damage proportional to fall distance minus 2 tiles
3. **Given** a gnome's health reaches zero, **When** this occurs, **Then** the gnome becomes incapacitated (not dead) and cannot perform tasks until rescued

---

### User Story 4 - Pathfinding with Climbing Routes (Priority: P3)

The pathfinding system considers climbing as a valid but costly route option when planning gnome movement.

**Why this priority**: Enables intelligent automation of climbing decisions. Gnomes should prefer easier routes but use climbing when necessary.

**Independent Test**: Can be tested by setting up scenarios where climbing is the only path vs. scenarios where walking around is possible, observing route choices.

**Acceptance Scenarios**:

1. **Given** a gnome needs to reach a destination only accessible by climbing, **When** pathfinding calculates a route, **Then** the route includes climbing segments
2. **Given** multiple routes exist to a destination (one with climbing, one without), **When** pathfinding calculates routes, **Then** the system prefers the non-climbing route due to higher climbing cost
3. **Given** a gnome is pathfinding through an area with climbing segments, **When** the route is calculated, **Then** climbing costs reflect the surface type (block edge cheaper than cave background)

---

### User Story 5 - Surface-Specific Climbing Behavior (Priority: P3)

Different surfaces provide different climbing experiences - speed modifiers and fall risk vary by surface type.

**Why this priority**: Adds depth to terrain strategy and creates value for future infrastructure features (ladders, scaffolds).

**Independent Test**: Can be tested by having gnomes climb different surface types and measuring speed and fall frequency.

**Acceptance Scenarios**:

1. **Given** a gnome is climbing foreground block edges, **When** climbing, **Then** the gnome climbs at base climbing speed with base fall chance
2. **Given** a gnome is climbing background blocks, **When** climbing, **Then** the gnome climbs at 80% of base climbing speed with 1.2x fall chance
3. **Given** a gnome is climbing cave background (natural underground), **When** climbing, **Then** the gnome climbs at 60% of base climbing speed with 1.5x fall chance
4. **Given** a gnome is in an area with only sky background, **When** the gnome attempts to find climbing surfaces, **Then** no climbing is possible (sky is never climbable)

---

### Edge Cases

- What happens when a gnome falls while already damaged? Damage accumulates; if health reaches zero, gnome becomes incapacitated
- How does the system handle a gnome that becomes incapacitated mid-climb? Gnome falls to the ground immediately, taking additional fall damage
- What happens if there are no climbable surfaces anywhere? Gnome remains stuck; this is intended to create need for infrastructure
- What if a gnome is climbing and the surface is destroyed? Gnome falls immediately
- How are gnomes rescued from incapacitation? Gnomes auto-recover health over time while stationary (provisional - death mechanics in future feature)
- Can gnomes traverse ceilings while climbing? No, climbing is vertical only (up/down); gnomes cannot move horizontally along ceiling surfaces

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow gnomes to climb foreground block edges (lateral surfaces)
- **FR-002**: System MUST allow gnomes to climb background block surfaces
- **FR-003**: System MUST allow gnomes to climb cave background surfaces (below horizon only)
- **FR-004**: System MUST prevent gnomes from climbing sky background surfaces (above horizon)
- **FR-018**: System MUST restrict climbing to vertical movement only (up/down); ceiling traversal is not supported
- **FR-005**: System MUST reduce gnome movement speed to 30% of normal walking speed while climbing
- **FR-006**: System MUST apply surface-specific speed modifiers (block edge: 100%, background block: 80%, cave background: 60%)
- **FR-007**: System MUST implement a per-tick fall chance while gnomes are climbing
- **FR-008**: System MUST apply surface-specific fall chance modifiers (block edge: 1.0x, background block: 1.2x, cave background: 1.5x)
- **FR-009**: System MUST track gnome health as a numeric value
- **FR-010**: System MUST apply fall damage when gnomes fall 3 or more tiles (damage = (fall height - 2) * 10)
- **FR-011**: System MUST set gnomes to incapacitated state when health reaches zero
- **FR-012**: Incapacitated gnomes MUST NOT be able to perform any tasks until recovered
- **FR-017**: Incapacitated gnomes MUST auto-recover health over time while stationary (provisional - death mechanics planned for future)
- **FR-013**: Pathfinding system MUST consider climbing routes when calculating paths
- **FR-014**: Pathfinding system MUST assign higher movement costs to climbing segments
- **FR-015**: System MUST add a "Climbing" state to gnome state machine
- **FR-016**: Gnomes MUST display visual feedback when in climbing state

### Key Entities

- **Gnome Health**: Numeric value representing gnome's current health points. Decreases from fall damage, zero triggers incapacitation.
- **Gnome State**: Extended to include Climbing state and Incapacitated state, affecting available actions and animations.
- **Climbable Surface**: Property of tile/background combinations determining if climbing is possible. Block edges and backgrounds have different climb properties.
- **Surface Modifier**: Attributes (speed multiplier, fall chance multiplier) associated with each climbable surface type.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Gnomes can escape from pits up to 10 tiles deep within reasonable time (accounting for 30% speed)
- **SC-002**: Gnomes successfully navigate to destinations requiring climbing at least 90% of the time (10% fall failure expected)
- **SC-003**: Players observe visible difference in climbing speed between surface types during gameplay
- **SC-004**: Incapacitated gnomes are clearly distinguishable from active gnomes
- **SC-005**: Pathfinding prefers non-climbing routes when travel time difference is less than 2x the climbing route time
- **SC-006**: Fall damage system triggers correctly for falls of 3+ tiles with observable health reduction

## Clarifications

### Session 2025-12-21

- Q: Should rescue mechanics be part of this feature or deferred? → A: Simple recovery (provisional) - Incapacitated gnomes auto-recover health over time in-place. Death mechanics will be implemented in a future feature.
- Q: Can gnomes climb horizontally along ceilings? → A: No, vertical only - Gnomes climb up/down surfaces, no ceiling traversal.

## Assumptions

- Gnomes have a base health pool (assumed 100 HP based on damage formula making 12-tile falls fatal: (12-2)*10 = 100)
- Incapacitated gnomes auto-recover health over time (rate to be tuned during implementation)
- Death mechanics deferred to future feature; current implementation uses incapacitation as temporary state
- The horizon line from feature 010 (background blocks & horizon) is already implemented and available to determine sky vs. cave background
- Base fall chance per tick of 0.1% results in approximately 6% cumulative chance over 60 ticks of climbing
