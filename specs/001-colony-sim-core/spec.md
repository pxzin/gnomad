# Feature Specification: Colony Simulation Core

**Feature Branch**: `001-colony-sim-core`
**Created**: 2025-12-11
**Status**: Draft
**Input**: User description: "A browser-based 2D side-scrolling colony management sandbox game with a platformer-style camera perspective similar to Terraria and Craft the World, where players command a tribe of gnomes to dig through procedurally generated layered terrain, build underground bases, gather resources, craft items, and survive against environmental threats."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start New Game and Explore World (Priority: P1)

A player launches the game in their browser and starts a new game. They see a procedurally generated 2D world with layered terrain (grass, dirt, stone, ore) displayed in a side-scrolling view. Their gnome tribe spawns on the surface. The player can pan the camera to explore the visible world and see the terrain cross-section with different material layers visible.

**Why this priority**: This is the foundation of the game—without world generation and basic rendering, no other gameplay is possible. Players need to see and navigate the world before they can interact with it.

**Independent Test**: Can be fully tested by launching the game and verifying a unique, explorable world appears with visible terrain layers and gnome sprites.

**Acceptance Scenarios**:

1. **Given** the player is on the main menu, **When** they click "New Game", **Then** a procedurally generated world loads with visible terrain layers within 5 seconds
2. **Given** a world is loaded, **When** the player pans the camera left/right/up/down, **Then** the view scrolls smoothly to reveal more terrain
3. **Given** a world is loaded, **When** the player looks at the terrain, **Then** they can distinguish different material types (grass, dirt, stone, ore) by their pixel art appearance
4. **Given** a new game starts, **When** the world generates, **Then** the gnome tribe (at least 3 gnomes) spawns on the surface

---

### User Story 2 - Command Gnomes to Dig Terrain (Priority: P2)

The player selects a section of terrain and issues a dig command. Assigned gnomes navigate to the location, mine through the blocks, and the terrain is removed. Mined resources are collected and added to the colony stockpile. Gravity affects loose materials above excavated areas.

**Why this priority**: Digging is the primary interaction mechanic that enables all other gameplay—base building, resource gathering, and exploration all depend on terrain modification.

**Independent Test**: Can be fully tested by selecting terrain, issuing dig command, and observing gnomes excavate blocks and collect resources.

**Acceptance Scenarios**:

1. **Given** the player has gnomes available, **When** they select a terrain area and click "Dig", **Then** one or more gnomes receive the dig task
2. **Given** a gnome has a dig task, **When** they reach the target block, **Then** they play a digging animation and the block is removed after a duration based on material hardness
3. **Given** a block is mined, **When** the gnome completes mining, **Then** the corresponding resource is added to the colony stockpile
4. **Given** terrain is removed below other blocks, **When** the supporting block is gone, **Then** affected loose materials (dirt, sand) fall due to gravity
5. **Given** a gnome is assigned to dig, **When** the path to the block is obstructed, **Then** the gnome pathfinds around obstacles or queues blocks for removal

---

### User Story 3 - Build Structures in the Colony (Priority: P3)

The player places building blueprints (walls, floors, doors, ladders) in the world. Gnomes gather required materials from the stockpile and construct the structures. Built structures provide shelter, storage, and navigation aids.

**Why this priority**: Building enables base construction which is essential for colony survival and progression, but requires digging (P2) to create space first.

**Independent Test**: Can be fully tested by placing a structure blueprint, ensuring resources are available, and observing gnomes complete construction.

**Acceptance Scenarios**:

1. **Given** the player opens the build menu, **When** they select a structure type, **Then** they see a blueprint preview that follows their cursor
2. **Given** the player has a blueprint selected, **When** they click a valid location, **Then** a construction site is placed showing required materials
3. **Given** a construction site exists and materials are available, **When** a gnome is idle, **Then** they retrieve materials and begin building
4. **Given** a gnome is building, **When** construction completes, **Then** the blueprint is replaced with the finished structure sprite
5. **Given** a ladder is built, **When** a gnome pathfinds through that area, **Then** they can climb vertically using the ladder

---

### User Story 4 - Gather and Manage Resources (Priority: P4)

The player can view their colony's resource stockpile. Gnomes automatically gather surface resources (trees, plants, surface stone). Resources are categorized and displayed with quantities. The player can designate storage zones for organization.

**Why this priority**: Resource management supports crafting and building but is less urgent than the core interaction loops.

**Independent Test**: Can be fully tested by observing gnomes gather surface resources and verifying stockpile quantities update correctly.

**Acceptance Scenarios**:

1. **Given** the game world has surface resources (trees, bushes), **When** the player designates them for gathering, **Then** gnomes collect them and add to stockpile
2. **Given** the player opens the stockpile view, **When** resources exist, **Then** they see categorized resources with current quantities
3. **Given** the player designates a storage zone, **When** gnomes have gathered resources, **Then** resources are deposited in the designated area
4. **Given** resources are in the stockpile, **When** a building requires materials, **Then** the system correctly deducts from available quantities

---

### User Story 5 - Craft Items and Equipment (Priority: P5)

The player accesses a crafting menu to create tools, equipment, and materials. Crafting requires specific resources and a crafting station. Crafted items improve gnome efficiency or unlock new capabilities.

**Why this priority**: Crafting adds progression depth but requires resource gathering and building (crafting stations) to be functional first.

**Independent Test**: Can be fully tested by building a crafting station, selecting a recipe, and observing a gnome craft the item.

**Acceptance Scenarios**:

1. **Given** a crafting station exists, **When** the player clicks it, **Then** a crafting menu displays available recipes
2. **Given** the player selects a recipe, **When** required resources are available, **Then** a gnome begins the crafting task
3. **Given** a gnome is crafting, **When** the craft completes, **Then** the item is added to the stockpile and resources are consumed
4. **Given** a tool is crafted (e.g., pickaxe), **When** equipped to a gnome, **Then** that gnome mines blocks faster

---

### User Story 6 - Survive Environmental Threats (Priority: P6)

The colony faces environmental challenges: day/night cycles affect visibility and spawn hostile creatures at night, weather events can impact gnome movement, and cave-ins can occur in unstable excavations. Players must build shelter and defenses.

**Why this priority**: Survival mechanics add challenge and urgency but should only be introduced after core colony management is enjoyable.

**Independent Test**: Can be fully tested by advancing time to night and observing threat spawning, then verifying gnomes take shelter.

**Acceptance Scenarios**:

1. **Given** time passes in the game, **When** night falls, **Then** the world darkens and hostile creatures may spawn on the surface
2. **Given** hostile creatures exist, **When** they encounter gnomes outside shelter, **Then** combat occurs with potential gnome injury
3. **Given** gnomes have shelter with doors, **When** night falls, **Then** gnomes automatically seek shelter
4. **Given** the player excavates without proper support, **When** too much material is removed, **Then** a cave-in may occur damaging nearby structures

---

### Edge Cases

- What happens when a gnome is trapped with no valid path to their destination?
  - System marks the task as unreachable and gnome becomes idle; player receives notification
- What happens when the player tries to build in an invalid location (overlapping structure, no ground support)?
  - Blueprint shows in red/invalid state and cannot be placed
- What happens when all gnomes die?
  - Game over state triggered with option to reload save or start new game
- What happens when stockpile is full?
  - Gnomes stop gathering until storage space is available; player receives warning
- What happens when the player digs to the world boundary?
  - Unbreakable bedrock layer prevents further excavation; visual indicator shows world edge

## Requirements *(mandatory)*

### Functional Requirements

#### World Generation

- **FR-001**: System MUST generate a procedurally generated 2D world with distinct terrain layers (surface, soil, stone, deep stone, bedrock)
- **FR-002**: System MUST place ore deposits, caverns, and underground water features randomly within appropriate depth ranges
- **FR-003**: System MUST generate varied surface terrain including hills, valleys, trees, and vegetation
- **FR-004**: World MUST use 16x16 pixel tiles for all terrain and entity rendering

#### Gnome Management

- **FR-005**: System MUST spawn an initial tribe of gnomes (3-5) when a new game begins
- **FR-006**: Gnomes MUST have core attributes: health, hunger, energy, and assigned task
- **FR-007**: Gnomes MUST pathfind to destinations considering terrain, ladders, and obstacles
- **FR-008**: Gnomes MUST display animated sprites for idle, walking, climbing, digging, building, and crafting states
- **FR-009**: System MUST allow gnomes to be selected individually or in groups

#### Terrain Interaction

- **FR-010**: Players MUST be able to designate terrain areas for excavation
- **FR-011**: System MUST queue tasks by priority level, processing higher priority tasks first; within the same priority level, tasks execute in FIFO order
- **FR-012**: Different terrain types MUST have different mining durations (dirt fast, stone slow, ore medium)
- **FR-013**: System MUST apply gravity to loose materials when supporting terrain is removed
- **FR-014**: Mined resources MUST be added to colony stockpile upon collection

#### Building System

- **FR-015**: Players MUST be able to place building blueprints from a construction menu
- **FR-016**: Blueprints MUST display required materials and current construction progress
- **FR-017**: System MUST validate building placement (solid ground, no overlaps, accessible)
- **FR-018**: Gnomes MUST retrieve required materials and construct placed blueprints
- **FR-019**: Built structures MUST provide functional benefits (ladders enable climbing, doors block enemies)

#### Resource Management

- **FR-020**: System MUST track all colony resources in a centralized stockpile
- **FR-021**: Players MUST be able to view stockpile contents organized by category
- **FR-022**: System MUST support resource consumption for building and crafting
- **FR-023**: Players MUST be able to designate storage zones for resource organization

#### Crafting System

- **FR-024**: System MUST provide craftable recipes for tools, materials, and equipment
- **FR-025**: Crafting MUST require appropriate crafting station and resources
- **FR-026**: Crafted tools MUST provide measurable benefits when equipped to gnomes

#### Game State

- **FR-027**: System MUST support saving and loading game state
- **FR-028**: System MUST implement day/night cycle affecting gameplay
- **FR-029**: System MUST track game time in discrete ticks for deterministic simulation
- **FR-034**: System MUST support full pause (simulation stops, commands can still be queued) and speed controls (slow, normal, fast)

#### User Interface

- **FR-030**: System MUST provide smooth camera panning and zooming
- **FR-031**: System MUST display gnome status, tasks, and health visually
- **FR-032**: System MUST provide clear visual feedback for all player actions (selections, commands, placements)
- **FR-033**: System MUST support mouse as primary input (click to select, drag to pan, scroll to zoom) with keyboard shortcuts for common actions

### Key Entities

- **World**: The procedurally generated terrain grid; contains tile data, entity positions, and environmental state
- **Tile**: Individual terrain unit (16x16); has material type, durability, and whether it's been revealed
- **Gnome**: Colony member entity; has position, health, hunger, energy, current task, equipped items, and animation state
- **Task**: Work order for gnomes; has type (dig, build, gather, craft), target location, priority level (determines execution order), creation timestamp (FIFO within same priority), and assigned gnome
- **Resource**: Material in the stockpile; has type, quantity, and storage location
- **Structure**: Built object in the world; has type, position, health, and functional properties
- **Recipe**: Crafting definition; has required inputs, output item, crafting time, and required station type

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New game world generation completes and displays within 5 seconds on standard hardware
- **SC-002**: Game maintains smooth performance (60 frames per second) with 20+ gnomes and 10,000+ visible tiles
- **SC-003**: Players can successfully command gnomes to dig a 10-block tunnel within 2 minutes of starting
- **SC-004**: Gnomes successfully pathfind to destinations across complex terrain in under 1 second
- **SC-005**: Players can place and complete a basic structure (wall, ladder) within 3 minutes of gathering resources
- **SC-006**: Game state saves and loads correctly, preserving all world and entity data
- **SC-007**: 80% of new players successfully establish a basic underground shelter within their first 15-minute session
- **SC-008**: Day/night cycle completes every 10 minutes of real-time gameplay
- **SC-009**: Resource gathering and stockpile tracking accurately reflects all collection and consumption

## Clarifications

### Session 2025-12-11

- Q: What is the primary input control scheme? → A: Mouse primary, keyboard shortcuts secondary
- Q: How should task priority conflicts be resolved? → A: FIFO within priority levels; gnome needs do not override tasks
- Q: Should the game support pausing and speed controls? → A: Speed controls (slow/normal/fast) plus full pause with command queuing

## Assumptions

The following reasonable defaults have been applied based on the feature description and genre conventions:

- **Save System**: Single save slot per game with manual save; autosave on game close
- **Initial Difficulty**: Game starts without hostile creatures; threats introduced after first night cycle
- **Camera Bounds**: Camera can view entire generated world; no fog of war initially
- **Gnome AI**: Gnomes are fully autonomous once tasks are assigned; no micromanagement required
- **Resource Drops**: All mined blocks yield their corresponding resource type (1:1 ratio)
- **Building Materials**: Basic structures require common materials (wood, stone); no rare resources for early game
- **World Size**: Generated world is approximately 500 tiles wide by 200 tiles deep
- **Gnome Needs**: Hunger and energy deplete over time; gnomes do NOT interrupt tasks for needs—they eat/rest only when idle or task complete (player is responsible for managing workload)
