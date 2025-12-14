# Research: Resource System

**Feature**: 006-resource-system
**Date**: 2025-12-14

## Research Tasks Completed

### 1. ECS Pattern for Resource Entities

**Decision**: Resource entities follow existing ECS pattern with a `Resource` component stored in a `resources: Map<Entity, Resource>` in GameState.

**Rationale**:
- Matches existing patterns for tiles, gnomes, and tasks
- Enables efficient O(1) lookup by entity ID
- Supports existing serialization mechanism (Map → Array → JSON)
- Allows resource entities to have Position components for world placement

**Alternatives Considered**:
- Inline resource data in tile component: Rejected because resources exist after tile is destroyed
- Separate resource array: Rejected because violates ECS pattern and complicates entity management

### 2. Resource Drop Trigger Point

**Decision**: Create resource entity in `mining.ts` when tile durability reaches 0, immediately before converting tile to Air.

**Rationale**:
- Single integration point with existing code
- Tile type is still available to determine resource type
- Mining system already handles tile destruction lifecycle
- Maintains deterministic behavior (same tick as tile destruction)

**Alternatives Considered**:
- Separate resource-drop system: Rejected as over-engineering for simple drop mechanic
- Event-based trigger: Rejected because no event system exists yet (YAGNI)

### 3. Resource Collection Mechanism

**Decision**: New `resource-collection.ts` system runs after physics, checks gnome positions against resource positions, collects matching resources.

**Rationale**:
- Runs after physics so gnome position is final for the tick
- Simple collision detection: same tile coordinates = collect
- Pure functional: returns new state with collected resources removed and inventory updated

**Alternatives Considered**:
- Collection during physics movement: Rejected as mixing concerns
- Collision callbacks: Rejected as no callback system exists (YAGNI)

### 4. Global Inventory Structure

**Decision**: Add `inventory: ResourceInventory` to GameState with typed counts per resource type.

**Rationale**:
- Simple flat structure matching spec requirements
- Easy to serialize (plain object)
- Direct access for HUD display
- Extensible: add new resource types as properties

**Alternatives Considered**:
- Per-gnome inventory: Rejected per spec assumption (all gnomes share global inventory)
- Map<ResourceType, number>: Rejected as overkill for 2 resource types

### 5. Resource Rendering Approach

**Decision**: Extend existing renderer with `resourceGraphics: Map<Entity, Graphics>` and `resourceCache` following tile/gnome pattern.

**Rationale**:
- Matches existing dirty-checking optimization pattern
- Uses same container hierarchy (entityContainer)
- Consistent visual sizing (small squares within tile)

**Alternatives Considered**:
- Sprite-based rendering: Rejected because project uses colored squares for MVP
- Batch rendering: Not needed yet until performance profiling shows bottleneck

### 6. Tile-to-Resource Type Mapping

**Decision**: Direct mapping in resource.ts: `TileType.Dirt → ResourceType.Dirt`, `TileType.Stone → ResourceType.Stone`.

**Rationale**:
- 1:1 correspondence per spec
- Simple switch statement
- Bedrock excluded (cannot be mined)
- Air excluded (no resource type)

**Alternatives Considered**:
- Configuration object: Rejected as overkill for 2 mappings
- Tile component storing drop type: Rejected as coupling data that's better derived

## Integration Points Confirmed

1. **Mining System** (`src/lib/systems/mining.ts`)
   - Insert resource creation at line where tile becomes Air
   - Call `createResourceEntity()` helper function

2. **Game State** (`src/lib/game/state.ts`)
   - Add `resources: Map<Entity, Resource>`
   - Add `inventory: ResourceInventory`
   - Update `createInitialState()` with empty values
   - Update `serialize()` and `deserialize()`

3. **Game Loop** (`src/lib/components/Game.svelte`)
   - Add `resourceCollectionSystem` to systems array after physics

4. **Renderer** (`src/lib/render/renderer.ts`)
   - Add `renderResources()` function called from `render()`
   - Add graphics cache for resource entities

5. **HUD** (`src/lib/components/hud/`)
   - Create `ResourcePanel.svelte` component
   - Add to `HUD.svelte` layout

## No NEEDS CLARIFICATION Remaining

All technical decisions resolved. Ready for Phase 1 design.
