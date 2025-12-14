# Feature Specification: Resource System

**Feature Branch**: `006-resource-system`
**Created**: 2025-12-14
**Status**: Draft
**Input**: User description: "Implement resource collection and storage system for mined tiles"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resource Drop on Mining (Priority: P1)

When a gnome mines a tile, the tile drops a resource item onto the ground. This creates the foundation for the entire resource economy.

**Why this priority**: This is the core mechanic that enables all other resource features. Without resource drops, there's nothing to collect or store.

**Independent Test**: Mine a single dirt tile and verify a dirt resource entity appears at the mined location.

**Acceptance Scenarios**:

1. **Given** a gnome is mining a dirt tile, **When** the tile is fully mined, **Then** a dirt resource item appears at the tile's location
2. **Given** a gnome is mining a stone tile, **When** the tile is fully mined, **Then** a stone resource item appears at the tile's location
3. **Given** a tile is mined, **When** the resource drops, **Then** the resource is visible on screen as a distinct visual element

---

### User Story 2 - Resource Collection (Priority: P2)

Gnomes automatically collect resource items when they walk over them, adding to a global resource counter.

**Why this priority**: Collecting resources is the next logical step after dropping. Auto-collection keeps gameplay simple and doesn't require additional player commands.

**Independent Test**: Drop a resource item on the ground, have a gnome walk over it, and verify the resource disappears and the counter increases.

**Acceptance Scenarios**:

1. **Given** a resource item is on the ground, **When** a gnome walks onto that tile, **Then** the resource is collected and removed from the world
2. **Given** a gnome collects a dirt resource, **When** collection occurs, **Then** the global dirt count increases by 1
3. **Given** a gnome collects a stone resource, **When** collection occurs, **Then** the global stone count increases by 1
4. **Given** multiple resources are on the same tile, **When** a gnome walks over, **Then** all resources on that tile are collected

---

### User Story 3 - Resource Display in HUD (Priority: P3)

The player can see current resource counts displayed in the game HUD.

**Why this priority**: Visibility of collected resources completes the feedback loop and lets players track their progress.

**Independent Test**: Collect resources and verify the HUD displays accurate counts for each resource type.

**Acceptance Scenarios**:

1. **Given** the game is running, **When** player looks at the HUD, **Then** current dirt and stone counts are visible
2. **Given** a gnome collects a resource, **When** collection occurs, **Then** the HUD count updates immediately
3. **Given** the game starts fresh, **When** player views HUD, **Then** all resource counts start at zero

---

### Edge Cases

- What happens when a resource drops on a tile that's about to be mined? Resource remains until collected.
- How does the system handle multiple gnomes collecting the same resource simultaneously? First gnome to reach it collects.
- What happens to resources when the game is saved/loaded? Resources persist with their positions.
- What happens if a resource drops outside visible area? Resource still exists, visible when player scrolls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a resource entity when a tile is fully mined
- **FR-002**: System MUST create dirt resources from dirt tiles and stone resources from stone tiles
- **FR-003**: Resource entities MUST be visually distinct from tiles and gnomes
- **FR-004**: System MUST automatically collect resources when a gnome occupies the same tile
- **FR-005**: System MUST maintain a global count for each resource type (dirt, stone)
- **FR-006**: System MUST display current resource counts in the HUD
- **FR-007**: System MUST update HUD counts immediately upon collection
- **FR-008**: System MUST persist resource entities and counts when saving the game
- **FR-009**: System MUST restore resource entities and counts when loading the game
- **FR-010**: Bedrock tiles MUST NOT drop any resources (they cannot be mined)

### Key Entities

- **Resource**: An item dropped when mining. Attributes: type (dirt/stone), position (x, y). Exists as an entity in the world until collected.
- **ResourceInventory**: Global counter for collected resources. Attributes: dirt count, stone count. Single instance per game session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of mined dirt tiles produce exactly 1 dirt resource
- **SC-002**: 100% of mined stone tiles produce exactly 1 stone resource
- **SC-003**: Resources are collected within the same game tick that a gnome enters their tile
- **SC-004**: HUD displays accurate resource counts at all times (verified by comparing to actual collected resources)
- **SC-005**: Save/load preserves all resource entities and inventory counts with 100% accuracy

## Assumptions

- Resources do not stack on the ground (each resource is a separate entity)
- Resources have no weight or inventory limit (gnomes can collect unlimited resources)
- Resources are purely visual in this phase (no crafting or building use yet)
- Resource collection is automatic (no player command needed)
- All gnomes share the same global resource inventory (no per-gnome inventory)
