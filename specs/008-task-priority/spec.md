# Feature Specification: Task Priority and Distance System

**Feature Branch**: `008-task-priority`
**Created**: 2025-12-14
**Status**: Draft
**Input**: User description: "Precisamos refatorar o sistema de tasks para que os gnomes levem em consideração prioridades e distância."

## Clarifications

### Session 2025-12-14

- Q: Qual mecanismo de interação para definir prioridade de tasks? → A: Não haverá atalho de teclado direto. Futuramente, uma ferramenta de aumentar/diminuir prioridade poderá ter atalho, mas não atalho para prioridade específica.
- Q: Qual representação visual para níveis de prioridade? → A: Cores diferentes no marcador de task (vermelho=Urgent, amarelo=High, azul=Normal, cinza=Low)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gnome Selects Nearest Task of Same Priority (Priority: P1)

When multiple tasks exist with the same priority level, a gnome should choose the closest one to minimize travel time and maximize efficiency.

**Why this priority**: This is the core behavior change - distance must factor into task selection. Without this, gnomes waste time walking across the map when closer tasks are available.

**Independent Test**: Can be fully tested by creating 3 tasks with Normal priority at different distances and observing that the gnome always picks the closest one.

**Acceptance Scenarios**:

1. **Given** a gnome at position (10, 5) and two Dig tasks with Normal priority at (12, 5) and (50, 5), **When** the gnome becomes idle, **Then** the gnome is assigned the task at (12, 5)
2. **Given** a gnome at position (25, 10) and three Collect tasks at (10, 10), (30, 10), and (40, 10) all with Normal priority, **When** the gnome becomes idle, **Then** the gnome is assigned the task at (30, 10)
3. **Given** a gnome at position (5, 5) and two tasks where the closest has no valid path but the farther one does, **When** the gnome becomes idle, **Then** the gnome is assigned the reachable farther task

---

### User Story 2 - Higher Priority Tasks Override Distance (Priority: P1)

Tasks with higher priority should be selected even if they are farther away, ensuring critical work gets done first.

**Why this priority**: Priority must still matter - an Urgent task should not be ignored just because a Low priority task is nearby.

**Independent Test**: Can be fully tested by creating a nearby Low priority task and a distant High priority task, then verifying the gnome chooses the High priority one.

**Acceptance Scenarios**:

1. **Given** a gnome at (10, 5) with a Low priority task at (11, 5) and a High priority task at (50, 5), **When** the gnome becomes idle, **Then** the gnome is assigned the High priority task
2. **Given** a gnome at (10, 5) with a Normal priority task at (11, 5) and an Urgent priority task at (80, 5), **When** the gnome becomes idle, **Then** the gnome is assigned the Urgent priority task
3. **Given** multiple tasks of varying priorities and distances, **When** the gnome becomes idle, **Then** priority is always the primary sorting factor

---

### User Story 3 - Player Sets Task Priority via UI (Priority: P2) [DEFERRED]

> **Note**: This user story is deferred to a future iteration. The priority adjustment tool will be implemented separately.

Players should be able to change the priority of existing tasks to influence gnome behavior and manage workflow. This will be addressed when the priority tool is implemented.

---

### User Story 4 - Visual Priority Indicators (Priority: P2)

Players should see visual feedback indicating task priority levels to understand the current work queue.

**Why this priority**: Without visual feedback, players cannot easily understand which tasks are prioritized. This enables informed decision-making.

**Independent Test**: Can be tested by creating tasks with different priorities and verifying each displays the correct color marker.

**Acceptance Scenarios**:

1. **Given** tasks with Low, Normal, High, and Urgent priorities, **When** rendered on screen, **Then** markers display Gray, Blue, Yellow, and Red colors respectively
2. **Given** a task whose priority is changed, **When** the display updates, **Then** the marker color reflects the new priority
3. **Given** a task being viewed, **When** the player selects it, **Then** the selection panel shows the priority level name

---

### Edge Cases

- What happens when all nearby tasks are unreachable but a distant task has a valid path?
  - The gnome should still be assigned the reachable task regardless of distance
- What happens when a gnome is equidistant from two tasks of the same priority?
  - Fall back to creation time (FIFO) as tiebreaker
- What happens when a task priority is changed while a gnome is walking to it?
  - The gnome continues to the assigned task; priority affects future assignments only
- What happens when there are no tasks available?
  - Gnome remains idle (current behavior preserved)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST sort available tasks by priority (descending) as the primary factor
- **FR-002**: System MUST use distance from gnome to task as a secondary sorting factor within the same priority level
- **FR-003**: System MUST use task creation time (FIFO) as a tertiary tiebreaker when priority and distance are equal
- **FR-004**: System MUST calculate distance as path length (tiles to walk), not straight-line distance
- **FR-005**: System MUST skip unreachable tasks and consider the next best option
- **FR-006**: [DEFERRED] Priority adjustment tool will be implemented in a future feature (out of scope for this iteration)
- **FR-007**: System MUST display color-coded task markers: Red (Urgent), Yellow (High), Blue (Normal), Gray (Low)
- **FR-008**: [DEFERRED] Batch priority changes deferred with priority tool (FR-006)
- **FR-009**: System MUST preserve the current throttling mechanism for performance
- **FR-010**: System MUST NOT reassign tasks already being worked on when priorities change

### Key Entities

- **Task**: Extended with priority field (already exists), visual representation via color-coded markers
- **TaskPriority**: Enum with Low (0), Normal (1), High (2), Urgent (3) levels (already exists)
- **Priority Color Mapping**: Low=Gray, Normal=Blue, High=Yellow, Urgent=Red
- **TaskMarker**: Visual representation of a task on the game world, colored by priority level

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Gnomes complete tasks 30% faster on average by reducing unnecessary travel distance
- **SC-002**: [DEFERRED] Priority control UI deferred to future iteration
- **SC-003**: All four priority levels are visually distinguishable at a glance
- **SC-004**: Task assignment decisions complete within the existing performance budget (no regression)
- **SC-005**: 100% of task assignments respect priority ordering (higher priority always chosen over lower, given reachability)

## Assumptions

- Path length is an acceptable proxy for "distance" since gnomes walk tile-by-tile
- The existing throttling mechanism (TASK_ASSIGNMENT_THROTTLE_TICKS) remains appropriate
- Players understand priority as "higher = done first"
- The four priority levels (Low, Normal, High, Urgent) are sufficient granularity
- Default priority for new tasks remains Normal
- Collect tasks continue to use Normal priority by default

## Future Considerations

- **Accessibility**: Color-only priority indicators may be difficult for colorblind users. A future iteration should add alternative visual representations (icons, shapes, or patterns). See `specs/backlog/008-colorblind-priority-indicators.md`.
