# Feature Specification: Game HUD/UI

**Feature Branch**: `003-game-hud`
**Created**: 2025-12-11
**Status**: Draft
**Input**: User description: "Implementar interface de usuário (HUD) para o jogo de simulação de colônia. O HUD deve ser uma camada sobre a área do jogo, não intrusiva, com estilo placeholder simples."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Game Status at a Glance (Priority: P1)

As a player, I want to see essential game information (gnome count, task progress, current tick) displayed in a non-intrusive top bar so that I can monitor my colony's status without interrupting gameplay.

**Why this priority**: Core HUD functionality - without status visibility, players cannot make informed decisions about their colony.

**Independent Test**: Can be fully tested by starting the game and verifying all counters update in real-time as gnomes and tasks change.

**Acceptance Scenarios**:

1. **Given** the game is running, **When** I look at the top-left of the screen, **Then** I see the current gnome count and task progress as "X / Y" where X = tasks with assigned gnomes actively working, Y = total tasks (assigned + unassigned)
2. **Given** the game is running, **When** a gnome is added or removed, **Then** the gnome counter updates immediately
3. **Given** tasks exist in the system, **When** task states change, **Then** the task counter updates to reflect current progress and pending totals
4. **Given** the game is running, **When** I look at the top-right, **Then** I see the current game tick number

---

### User Story 2 - Control Game Speed (Priority: P1)

As a player, I want to control the game speed (pause, 1x, 2x, 3x) using both UI buttons and keyboard shortcuts so that I can manage the pace of gameplay according to my preference.

**Why this priority**: Essential for playability - players need to pause to plan actions and speed up during waiting periods.

**Independent Test**: Can be fully tested by clicking speed buttons and pressing keyboard shortcuts, observing the game tick counter rate changes.

**Acceptance Scenarios**:

1. **Given** the game is running at any speed, **When** I click the pause button or press Space, **Then** the game pauses and the tick counter stops advancing
2. **Given** the game is paused, **When** I click the pause button or press Space, **Then** the game resumes at the previous speed
3. **Given** the game is running, **When** I click 1x/2x/3x buttons or press 1/2/3 keys, **Then** the game speed changes accordingly and the active speed button is visually highlighted
4. **Given** speed buttons are displayed, **When** I view them, **Then** each button shows its speed value (1x, 2x, 3x)

---

### User Story 3 - View Selection Information (Priority: P2)

As a player, I want to see detailed information about what I have selected in a bottom-left panel so that I can understand the state of selected tiles or gnomes before taking actions.

**Why this priority**: Supports informed decision-making - players need context about selections to choose appropriate actions.

**Independent Test**: Can be fully tested by selecting different combinations of tiles/gnomes and verifying correct information display.

**Selection Mechanisms**:
- **Tiles**: Rectangle drag selection (existing behavior). Air tiles are excluded from selection - only solid tiles (dirt/stone) can be selected.
- **Gnomes**: Click-only selection. Click directly on a gnome to select it. Shift+click to add/remove gnomes from selection.

**Acceptance Scenarios**:

1. **Given** nothing is selected, **When** I view the selection panel, **Then** it displays "Nenhuma seleção" (No selection)
2. **Given** I select a single tile, **When** I view the selection panel, **Then** I see the tile type (dirt/stone), current/maximum durability, and any active task status
3. **Given** I select a single gnome by clicking on it, **When** I view the selection panel, **Then** I see the gnome's state (idle/walking/mining/falling), current task, and position
4. **Given** I select multiple items, **When** I view the selection panel, **Then** it displays a count summary (e.g., "3 tiles, 2 gnomes")
5. **Given** I drag-select over an area with air and solid tiles, **When** the selection completes, **Then** only solid tiles are included in the selection

---

### User Story 4 - Execute Contextual Actions (Priority: P2)

As a player, I want to see and use contextual action buttons based on my selection so that I can efficiently command my colony using both mouse clicks and keyboard shortcuts.

**Why this priority**: Enables player agency - without action buttons, players cannot interact with the game world effectively.

**Independent Test**: Can be fully tested by selecting tiles, clicking the Dig button, and verifying dig tasks are created/cancelled appropriately.

**Acceptance Scenarios**:

1. **Given** I have tiles selected without dig tasks, **When** I view the action bar, **Then** I see "Dig (D)" button enabled
2. **Given** I have tiles selected with dig tasks, **When** I view the action bar, **Then** I see "Cancel Dig (D)" button enabled
3. **Given** I have a mixed selection (some tiles with dig tasks, some without), **When** I view the action bar, **Then** I see "Dig (D)" button that will apply to tiles without tasks
4. **Given** I have tiles selected, **When** I click Dig button or press D, **Then** dig tasks are created for eligible tiles (or cancelled if all have tasks)
5. **Given** I have only gnomes selected or a mixed selection of tiles and gnomes, **When** I view the action bar, **Then** action buttons are disabled
6. **Given** I press Escape, **When** I have any selection, **Then** the selection is cleared

---

### User Story 5 - Non-Intrusive HUD Overlay (Priority: P3)

As a player, I want the HUD to overlay the game without blocking interaction so that I can always access game controls while playing.

**Why this priority**: Quality of life - ensures HUD doesn't negatively impact gameplay experience.

**Independent Test**: Can be fully tested by clicking/dragging on the game area near HUD elements and verifying game interactions still work.

**Acceptance Scenarios**:

1. **Given** the HUD is displayed, **When** I interact with the game area, **Then** my clicks and drags register correctly on the game world
2. **Given** the HUD is displayed, **When** I resize the game window, **Then** the HUD elements reposition appropriately
3. **Given** the HUD is displayed, **When** I interact with HUD elements, **Then** those interactions are captured by the HUD (not passed to the game)

---

### Edge Cases

- What happens when there are 0 gnomes? Display "0" in the counter, game continues
- What happens when there are 0 tasks? Display "0 / 0" in the task counter
- How does the system handle rapid speed changes? Each change takes effect immediately, no queuing
- What happens when selecting tiles and gnomes at the same time? Selection panel shows count summary, action buttons are disabled
- How does the HUD behave when the game window is very small? HUD elements should remain visible and functional (minimum supported size assumed)
- What happens to selection panel when a selected gnome dies or tile is destroyed? Panel updates to reflect current valid selections
- What happens when drag-selecting over air tiles? Air tiles are excluded from selection - only solid tiles (dirt/stone) are included
- What happens when clicking on empty space (no gnome)? Current selection is cleared (unless Shift is held)
- What happens when Shift+clicking on an already-selected gnome? The gnome is removed from the selection

## Requirements *(mandatory)*

### Functional Requirements

**Top Bar - Global Counters:**
- **FR-001**: System MUST display the current gnome count in the top-left area
- **FR-002**: System MUST display task progress as "X / Y" format where X = tasks with assigned gnomes, Y = total tasks (assigned + unassigned)
- **FR-003**: System MUST display the current game tick in the top-right area
- **FR-004**: System MUST update all counters reactively as game state changes

**Top Bar - Time Controls:**
- **FR-005**: System MUST provide a pause button that toggles game pause state
- **FR-006**: System MUST provide speed buttons for 1x, 2x, and 3x game speeds
- **FR-007**: System MUST visually indicate which speed is currently active
- **FR-008**: System MUST support keyboard shortcut Space for pause toggle
- **FR-009**: System MUST support keyboard shortcuts 1, 2, 3 for speed selection

**Selection System:**
- **FR-010**: System MUST support rectangle drag selection for tiles (existing behavior)
- **FR-011**: System MUST exclude air tiles from selection - only solid tiles (dirt/stone) are selectable
- **FR-012**: System MUST support click selection for gnomes - clicking on a gnome selects it
- **FR-013**: System MUST support Shift+click to add/remove gnomes from current selection

**Bottom Bar - Selection Panel:**
- **FR-014**: System MUST display "Nenhuma seleção" when nothing is selected
- **FR-015**: System MUST display tile type (dirt/stone), durability (current/max), and task status for single tile selection
- **FR-016**: System MUST display gnome state, current task, and position for single gnome selection
- **FR-017**: System MUST display count summary (e.g., "3 tiles, 2 gnomes") for multiple selections

**Bottom Bar - Action Bar:**
- **FR-018**: System MUST display action buttons with icon and keyboard shortcut label (e.g., "Dig (D)")
- **FR-019**: System MUST enable/disable action buttons based on current selection context
- **FR-020**: System MUST disable all action buttons when selection contains both tiles and gnomes
- **FR-021**: System MUST show "Dig (D)" when selected tiles have no dig tasks
- **FR-022**: System MUST show "Cancel Dig (D)" when all selected tiles have dig tasks
- **FR-023**: System MUST show "Dig (D)" for mixed tile states (applies to tiles without tasks)
- **FR-024**: System MUST support keyboard shortcut D for dig/cancel dig contextual action
- **FR-025**: System MUST support keyboard shortcut Escape to clear selection

**General HUD Behavior:**
- **FR-026**: HUD MUST be a non-blocking overlay that allows game interaction beneath it
- **FR-027**: HUD MUST use placeholder visual style (solid colors, simple shapes)
- **FR-028**: HUD MUST be reactive to game state changes in real-time

### Key Entities

- **HUD State**: Contains current selection info, displayed counters, active speed setting, pause state
- **Selection**: Collection of currently selected game objects (tiles and/or gnomes) with type-specific metadata
- **Action Button**: Represents a contextual action with label, shortcut key, enabled state, and execute behavior

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All game status information (gnomes, tasks, tick) is visible and updates within 100ms of state changes
- **SC-002**: Players can change game speed or pause using both UI buttons and keyboard in under 1 second
- **SC-003**: Selection information panel correctly displays appropriate content for all selection types (none, single tile, single gnome, multiple)
- **SC-004**: Dig action button correctly reflects contextual state and executes appropriate action for 100% of selection scenarios
- **SC-005**: HUD does not block any game interaction in the play area
- **SC-006**: All existing keyboard shortcuts (D, Space, 1, 2, 3, Escape) continue to function as specified
