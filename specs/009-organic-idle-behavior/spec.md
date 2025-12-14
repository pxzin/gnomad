# Feature Specification: Organic Idle Behavior for Gnomes

**Feature Branch**: `009-organic-idle-behavior`
**Created**: 2025-12-14
**Status**: Draft
**Input**: User description: "Sistema de comportamentos idle que torna os gnomes mais orgânicos com passeio casual, socialização, descanso/soneca e transição suave para trabalho"

## Clarifications

### Session 2025-12-14

- Q: What should be the probability weights for idle behavior selection? → A: Movement-biased: 50% stroll, 35% socialize, 15% rest
- Q: What speed should gnomes use for casual strolls relative to work walking? → A: 50% of normal speed (clearly leisurely)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Casual Stroll (Priority: P1)

When gnomes have no tasks assigned, they take short casual walks near the colony center (Storage building) instead of standing still. This creates a sense of life and activity even when there's no work to do.

**Why this priority**: This is the foundation of organic idle behavior. A gnome that moves around looks alive; a gnome that stands frozen looks like a bug. This single behavior transforms the game feel dramatically with minimal complexity.

**Independent Test**: Can be tested by spawning gnomes with no tasks available and observing them walk in small random paths near Storage. Delivers immediate visual improvement.

**Acceptance Scenarios**:

1. **Given** a gnome with no assigned task and a Storage building exists, **When** the gnome enters idle state, **Then** it begins walking slowly in a random direction within a limited radius of the Storage
2. **Given** a gnome is on a casual stroll, **When** the stroll destination is reached, **Then** the gnome pauses briefly before choosing a new random destination or switching to another idle behavior
3. **Given** a gnome is on a casual stroll, **When** a task becomes available, **Then** the gnome immediately stops the stroll and goes to work

---

### User Story 2 - Instant Work Interruption (Priority: P1)

Idle behaviors must never interfere with work. When any task is assigned to a gnome engaged in idle behavior, the gnome immediately transitions to working state without delay or animation completion.

**Why this priority**: This is critical for gameplay - players must never feel that idle animations are slowing down their colony's productivity. Work always takes priority.

**Independent Test**: Can be tested by having gnomes in various idle states and creating a dig task - all idle gnomes should immediately respond.

**Acceptance Scenarios**:

1. **Given** a gnome is performing any idle behavior (strolling, socializing, resting), **When** a task is assigned to that gnome, **Then** the idle behavior is interrupted immediately and the gnome begins walking to the task
2. **Given** multiple gnomes are idle, **When** a single task is created, **Then** the nearest eligible gnome immediately abandons idle behavior and takes the task
3. **Given** a gnome is in the middle of a social interaction, **When** a task is assigned, **Then** the conversation ends instantly without any "goodbye" animation or delay

---

### User Story 3 - Gnome Socialization (Priority: P2)

When two or more idle gnomes are near each other, they can engage in brief "conversations" - standing face to face with a simple visual indicator (speech bubbles or "..." symbols). This creates emergent social behavior that makes the colony feel alive.

**Why this priority**: Social interactions add significant personality to gnomes but require proximity detection and visual indicators. More complex than strolling but very impactful for player engagement.

**Independent Test**: Can be tested by having multiple idle gnomes in the same area and observing them pair up for conversations. Delivers emergent storytelling moments.

**Acceptance Scenarios**:

1. **Given** two idle gnomes are within 3 tiles of each other, **When** neither has started another idle behavior, **Then** they may choose to walk toward each other and begin socializing
2. **Given** two gnomes are socializing, **When** the conversation duration elapses (5-15 seconds), **Then** both gnomes end the conversation and may choose different idle behaviors
3. **Given** three or more gnomes are nearby, **When** socializing starts, **Then** only two gnomes engage in conversation while others continue independent idle behaviors

---

### User Story 4 - Rest and Nap (Priority: P3)

Idle gnomes can rest by sitting down near the Storage. If beds are available in the future, gnomes would prefer resting there. For MVP, gnomes simply sit on the ground in a designated rest area.

**Why this priority**: Rest behavior adds variety but is less visually impactful than movement-based behaviors. It's a "nice to have" that rounds out the idle system.

**Independent Test**: Can be tested by observing idle gnomes occasionally choosing to sit and rest instead of walking or socializing.

**Acceptance Scenarios**:

1. **Given** a gnome is idle near the Storage, **When** choosing an idle behavior, **Then** it may choose to rest by remaining stationary in a "sitting" visual state
2. **Given** a gnome is resting, **When** the rest duration elapses (10-30 seconds), **Then** the gnome stands up and may choose a different idle behavior
3. **Given** a gnome is resting, **When** a task is assigned, **Then** the gnome immediately stands and begins working (no "waking up" delay)

---

### Edge Cases

- What happens when the Storage building is destroyed while gnomes are idle?
  - Gnomes should fall back to their current position as the "colony center" and continue idle behaviors in a smaller radius
- What happens when a gnome is pushed into an unreachable area during idle?
  - Gnome should detect unreachable stroll destinations and choose a different direction
- What happens when all gnomes try to socialize at once?
  - System should limit concurrent socializations to prevent all gnomes pairing up simultaneously (stagger behavior selection)
- What happens when a gnome is mid-stroll and the path becomes blocked?
  - Gnome should stop, recalculate, and either find a new path or choose a different idle behavior

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect when a gnome enters idle state (no assigned task, not falling, not depositing)
- **FR-002**: System MUST select a random idle behavior for each idle gnome with weighted probabilities: 50% stroll, 35% socialize, 15% rest
- **FR-003**: System MUST use the Storage building position as the colony center for idle behavior boundaries
- **FR-004**: System MUST limit casual strolls to a maximum radius of 8 tiles from the colony center
- **FR-005**: System MUST immediately interrupt any idle behavior when a task is assigned to the gnome
- **FR-006**: System MUST prevent gnomes from strolling into dangerous areas (unreachable tiles, outside explored areas)
- **FR-007**: System MUST vary idle behavior selection so not all gnomes do the same thing simultaneously
- **FR-008**: System MUST display a visual indicator (simple "..." or speech bubble) when two gnomes are socializing
- **FR-009**: System MUST use 50% of normal movement speed for casual strolls (clearly leisurely pace)
- **FR-010**: System MUST preserve existing pathfinding performance (idle behaviors use same throttling as task assignment)

### Key Entities

- **IdleBehavior**: Represents the current idle activity of a gnome (type: stroll/socialize/rest, duration, target position if applicable, partner gnome if socializing)
- **ColonyCenter**: Reference point for idle behaviors, derived from Storage building position (fallback to spawn point if no Storage)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Idle gnomes visibly move or change state within 5 seconds of becoming idle (no frozen gnomes)
- **SC-002**: 100% of task assignments interrupt idle behaviors with zero perceivable delay
- **SC-003**: Game maintains 60 FPS with 10+ idle gnomes performing various idle behaviors
- **SC-004**: Players can observe at least 3 distinct idle behaviors (stroll, socialize, rest) during normal gameplay
- **SC-005**: Gnomes never walk into walls, bedrock, or unreachable areas during idle strolls
- **SC-006**: Social interactions are visually identifiable through indicator graphics

## Assumptions

- Storage building exists in most gameplay scenarios (reasonable default for colony center)
- Current gnome visual representation can indicate "sitting" state through sprite or color change
- Speech bubble or "..." indicator can be rendered using existing UI graphics system
- Existing pathfinding system can be reused for stroll destination validation
- Idle behavior system will run on same throttle as task assignment to maintain performance

## Out of Scope

- Gnome personality traits (lazy, social, active) - future enhancement
- Needs system (hunger, tiredness) affecting behavior - future enhancement
- Furniture interaction (beds, chairs) - future enhancement
- Complex animation states - using existing sprite system
- Sound effects for idle behaviors - future enhancement

## Future Considerations

The idle behavior system should be designed with extensibility in mind for:

- **Personality System**: Different gnomes could have weighted preferences for idle behaviors
- **Needs System**: Tiredness could increase rest behavior frequency, social needs could drive socialization
- **Furniture**: Beds could become preferred rest locations, tables could be socialization spots
- **Activities**: Reading, eating, playing - additional idle behaviors with associated furniture
