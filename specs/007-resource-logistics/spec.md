# Feature Specification: Resource Logistics System

**Feature Branch**: `007-resource-logistics`
**Created**: 2025-12-14
**Status**: Draft
**Input**: User description: "Implement resource logistics system with physics, collect tasks, gnome inventory, and storage buildings"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resource Physics (Priority: P1)

Dropped resources must behave like physical objects in the game world. When a tile is mined and a resource drops, it should fall with gravity until it lands on solid ground. This creates a more realistic and satisfying gameplay experience.

**Why this priority**: Without physics, resources would float in mid-air after mining, breaking immersion and potentially blocking access. This is foundational for all other resource logistics features.

**Independent Test**: Mine a tile above empty space (air) and verify the dropped resource falls until it lands on a solid tile below.

**Acceptance Scenarios**:

1. **Given** a gnome is mining a tile with air below it, **When** the tile is destroyed, **Then** the dropped resource falls with gravity until it lands on solid ground
2. **Given** a resource is falling, **When** it reaches a solid tile, **Then** it stops and rests on top of that tile
3. **Given** a resource lands on a tile, **When** that tile is subsequently mined, **Then** the resource falls again to the next solid surface
4. **Given** multiple resources are dropped in the same column, **When** they fall, **Then** they stack or land on the same tile without overlapping visually

---

### User Story 2 - Collect Task System (Priority: P2)

Resources on the ground are not automatically collected. Instead, each grounded resource generates a "Collect" task. Gnomes must be assigned to these tasks, pathfind to the resource, and pick it up. This introduces meaningful logistics gameplay.

**Why this priority**: This transforms resource collection from passive to active gameplay, requiring player strategy. Depends on P1 (resources must land before generating tasks).

**Independent Test**: Mine a tile, let the resource land, observe a Collect task is created, assign a gnome, and verify the gnome picks up the resource.

**Acceptance Scenarios**:

1. **Given** a resource lands on solid ground, **When** it comes to rest, **Then** a Collect task is automatically created for that resource
2. **Given** a Collect task exists, **When** an idle gnome is available, **Then** the gnome can be assigned to collect that resource
3. **Given** a gnome is assigned to a Collect task, **When** the gnome reaches the resource location, **Then** the resource is picked up and added to the gnome's inventory
4. **Given** a resource is collected, **When** the gnome picks it up, **Then** the Collect task is marked complete and removed
5. **Given** a resource is still falling, **When** viewing tasks, **Then** no Collect task exists for that resource (only grounded resources generate tasks)

---

### User Story 3 - Gnome Inventory (Priority: P3)

Each gnome has a personal inventory that can hold a limited number of items (maximum 5). Gnomes carry collected resources in their inventory until they deposit them at Storage. The inventory contents are visible when selecting a gnome.

**Why this priority**: Enables gnomes to carry resources and introduces inventory management. Depends on P2 (gnomes need to collect resources first).

**Independent Test**: Have a gnome collect 3 resources, select the gnome, and verify the inventory shows 3 items. Then try to collect a 6th resource and verify it's rejected.

**Acceptance Scenarios**:

1. **Given** a gnome with empty inventory, **When** the gnome collects a resource, **Then** the resource is added to the gnome's inventory
2. **Given** a gnome carrying 4 resources, **When** the gnome collects another resource, **Then** the gnome now carries 5 resources (at capacity)
3. **Given** a gnome at max capacity (5 items), **When** assigned to collect another resource, **Then** the gnome cannot accept the task until inventory has space
4. **Given** a gnome is selected in the UI, **When** viewing the selection panel, **Then** the gnome's inventory contents (item types and counts) are displayed
5. **Given** a gnome with items in inventory, **When** the gnome deposits items at Storage, **Then** the inventory count decreases accordingly

---

### User Story 4 - Storage Building (Priority: P4)

The player can place a Storage structure in the game world. Gnomes deposit collected resources into Storage. Storage has unlimited capacity. This is the first building type in the game.

**Why this priority**: Provides the destination for collected resources. Without Storage, gnomes have nowhere to deposit items. Depends on P3 (gnomes need inventory to deposit from).

**Independent Test**: Place a Storage building, have a gnome collect resources, verify the gnome automatically goes to Storage and deposits items.

**Acceptance Scenarios**:

1. **Given** the player is in the game, **When** the player selects the "Build Storage" action and clicks a valid location, **Then** a Storage structure is placed at that location
2. **Given** a gnome has items in inventory and a Storage exists, **When** the gnome's inventory is not empty, **Then** the gnome automatically seeks to deposit items at the nearest Storage
3. **Given** a gnome reaches a Storage with items in inventory, **When** the gnome interacts with Storage, **Then** all carried items are deposited into Storage
4. **Given** a Storage building exists, **When** the player selects it, **Then** the selection panel shows the Storage contents (types and quantities)
5. **Given** Storage can only be placed on solid, accessible ground, **When** player tries to place on air or unreachable location, **Then** placement is rejected with visual feedback

---

### User Story 5 - Global Resource Availability (Priority: P5)

Resources only count toward the global inventory (shown in HUD) after being deposited in Storage. The HUD displays "stored" resources, representing what's actually available for future use (crafting, building, etc.).

**Why this priority**: Completes the logistics loop by making stored resources the "real" count. Depends on P4 (Storage must exist to store resources).

**Independent Test**: Mine tiles, collect resources with gnome, check HUD shows 0 until gnome deposits in Storage, then verify HUD count increases.

**Acceptance Scenarios**:

1. **Given** a resource is dropped on the ground, **When** viewing the HUD, **Then** the resource is NOT counted in the global inventory
2. **Given** a gnome is carrying resources, **When** viewing the HUD, **Then** carried resources are NOT counted in the global inventory
3. **Given** a gnome deposits resources in Storage, **When** viewing the HUD, **Then** the global inventory increases by the deposited amount
4. **Given** multiple Storages exist, **When** gnomes deposit to different Storages, **Then** the HUD shows the combined total from all Storages

---

### Edge Cases

- What happens when a resource falls into an enclosed space with no gnome access? Resource remains there; Collect task exists but may be unreachable.
- What happens if Storage is destroyed while containing resources? Resources are dropped on the ground at Storage location (future consideration - not in scope for initial implementation).
- What happens if a gnome dies/is destroyed while carrying resources? Resources are dropped at the gnome's last position.
- What happens when trying to place Storage in an invalid location? Placement is rejected; player receives visual feedback (e.g., red highlight).
- What happens if no Storage exists when a gnome has a full inventory? Gnome remains idle until Storage is built or inventory space is freed.
- What happens to falling resources at world boundaries? Resources stop at the lowest accessible tile (bedrock floor).

## Requirements *(mandatory)*

### Functional Requirements

**Resource Physics**

- **FR-001**: System MUST apply gravity to dropped resource entities
- **FR-002**: Resources MUST fall until they collide with a solid tile below
- **FR-003**: Resources MUST remain stationary once landed on solid ground
- **FR-004**: Resources MUST resume falling if their supporting tile is removed

**Collect Tasks**

- **FR-005**: System MUST automatically create a Collect task when a resource lands on solid ground
- **FR-006**: Collect tasks MUST NOT be created for resources that are still falling
- **FR-007**: Gnomes MUST pathfind to the resource location to collect it
- **FR-008**: Collecting a resource MUST remove it from the world and add it to the gnome's inventory
- **FR-009**: Collect tasks MUST be removed upon successful collection

**Gnome Inventory**

- **FR-010**: Each gnome MUST have a personal inventory with a maximum capacity of 5 items
- **FR-011**: Gnomes MUST NOT accept Collect tasks if their inventory is full
- **FR-012**: Inventory contents MUST be visible when a gnome is selected
- **FR-013**: Gnomes MUST automatically seek to deposit items when their inventory is not empty and a Storage exists

**Storage Building**

- **FR-014**: Players MUST be able to place Storage structures on valid ground tiles
- **FR-015**: Storage MUST have unlimited capacity for resources
- **FR-016**: Gnomes MUST deposit all carried items when interacting with Storage
- **FR-017**: Storage contents MUST be visible when Storage is selected
- **FR-018**: Storage placement MUST be restricted to solid, accessible tiles

**Global Inventory**

- **FR-019**: HUD MUST display only resources that have been deposited in Storage
- **FR-020**: Resources on the ground or in gnome inventories MUST NOT count toward HUD totals
- **FR-021**: HUD totals MUST aggregate resources from all Storage structures

### Key Entities

- **Resource**: Physical item dropped when mining. Attributes: type (dirt/stone), position, velocity (for physics), isGrounded (whether at rest). Exists in world until collected.
- **GnomeInventory**: Personal storage for a gnome. Attributes: items (list of resource types), maxCapacity (5). Each gnome has exactly one inventory.
- **Storage**: Building structure for depositing resources. Attributes: position, contents (map of resource type to count). Unlimited capacity. Placed by player.
- **CollectTask**: Task type for resource collection. Attributes: targetResource (entity ID), priority. Created automatically when resources land.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of dropped resources fall with gravity and land on solid ground correctly
- **SC-002**: 100% of grounded resources generate Collect tasks automatically
- **SC-003**: Gnomes successfully collect resources and add them to inventory within expected pathfinding time
- **SC-004**: Gnome inventory correctly limits to 5 items maximum, rejecting additional collections
- **SC-005**: Gnomes automatically deposit inventory contents when reaching Storage
- **SC-006**: HUD displays accurate count of stored resources (matching sum of all Storage contents)
- **SC-007**: Players can place Storage buildings on valid locations with clear feedback for invalid placements
- **SC-008**: Save/load preserves all resource states (falling, grounded, in inventory, in storage)

## Assumptions

- Storage building uses a simple visual representation (colored rectangle) consistent with current MVP graphics
- Only one Storage type exists initially (generic storage for all resource types)
- Gnomes prioritize depositing at the nearest Storage
- Collect tasks have Normal priority (same as Dig tasks)
- Resources in gnome inventory are not visually shown on the gnome sprite (future enhancement)
- Storage can be placed anywhere on solid ground (no specific placement restrictions beyond accessibility)
- The existing Dig task system will be extended to support the new Collect task type
