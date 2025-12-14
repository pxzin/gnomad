# Quickstart: Resource Logistics System

**Purpose**: Step-by-step implementation guide with test scenarios
**Prerequisites**: Read spec.md, research.md, data-model.md

## Implementation Order

Follow this order to minimize integration issues:

### Phase 1: Foundation
1. Extend Resource component with `isGrounded`
2. Extend Gnome component with `inventory`
3. Extend Task component with `targetEntity` and `TaskType.Collect`
4. Add Building and Storage components
5. Extend GameState with `buildings` and `storages` Maps
6. Update serialization/deserialization

### Phase 2: Resource Physics (US1)
1. Create `resource-physics.ts` system
2. Apply gravity to non-grounded resources
3. Detect landing on solid ground
4. Update `isGrounded` when resource lands

### Phase 3: Collect Tasks (US2)
1. Generate Collect task when resource becomes grounded
2. Extend task assignment to check gnome inventory capacity
3. Implement resource pickup on task completion
4. Add `GnomeState.Collecting` state handling

### Phase 4: Gnome Inventory (US3)
1. Implement inventory capacity check
2. Add item to inventory on collection
3. Update SelectionPanel to show gnome inventory
4. Add `GnomeState.Depositing` state

### Phase 5: Storage Building (US4)
1. Implement Storage entity creation
2. Add build command handling
3. Implement deposit behavior (gnome → storage transfer)
4. Update SelectionPanel to show storage contents
5. Add Storage rendering

### Phase 6: HUD Integration (US5)
1. Remove/repurpose `state.inventory`
2. Compute HUD totals from all storages
3. Update ResourcePanel to use computed totals

---

## Manual Test Scenarios

### Test 1: Resource Physics

**Setup**: Start game with default world

**Steps**:
1. Select a gnome
2. Create a dig task on a dirt tile that has air below it
3. Wait for gnome to mine the tile

**Expected**:
- Resource entity appears when tile is destroyed
- Resource falls with gravity
- Resource stops when it hits solid ground below
- Resource is visually visible on the ground

**Verify**:
- Resource entity exists in `state.resources`
- Resource has `isGrounded: true` after landing

---

### Test 2: Collect Task Generation

**Setup**: Complete Test 1 (resource on ground)

**Steps**:
1. Observe the task list in HUD

**Expected**:
- A Collect task appears automatically
- Task shows target position where resource landed
- Task is unassigned (no gnome on it yet)

**Verify**:
- Task entity in `state.tasks` with `type: TaskType.Collect`
- Task has `targetEntity` pointing to resource entity

---

### Test 3: Resource Collection

**Setup**: Complete Test 2 (collect task exists)

**Steps**:
1. Observe idle gnome behavior (should auto-assign)
2. OR manually ensure gnome is near the resource
3. Wait for gnome to reach resource

**Expected**:
- Gnome walks to resource location
- Resource disappears from ground
- Collect task is removed
- Gnome inventory shows 1 item

**Verify**:
- Resource removed from `state.resources`
- Task removed from `state.tasks`
- Gnome's `inventory` array has 1 item

---

### Test 4: Inventory Capacity

**Setup**: Start fresh game

**Steps**:
1. Have gnome collect 5 resources
2. Mine another tile to create 6th resource
3. Observe gnome behavior

**Expected**:
- Gnome collects first 5 resources
- 6th Collect task exists but gnome doesn't accept it
- Gnome inventory shows 5 items (full)

**Verify**:
- `gnome.inventory.length === 5`
- 6th Collect task has `assignedGnome: null`

---

### Test 5: Storage Placement

**Setup**: Start game, gnome has items in inventory

**Steps**:
1. Open build menu (to be implemented)
2. Select Storage building
3. Click valid ground location
4. Verify placement

**Expected**:
- Storage building appears at clicked location
- Storage is 2x2 tiles visually
- Selection panel shows Storage with empty contents

**Verify**:
- Entity exists in `state.buildings` with `type: BuildingType.Storage`
- Entity exists in `state.storages` with empty contents Map

---

### Test 6: Resource Deposit

**Setup**: Gnome has items, Storage exists

**Steps**:
1. Observe gnome behavior after collecting

**Expected**:
- Gnome automatically walks to Storage
- Gnome deposits all items
- Gnome inventory becomes empty
- Storage contents increase

**Verify**:
- `gnome.inventory.length === 0`
- Storage contents Map has resource counts

---

### Test 7: HUD Resource Display

**Setup**: Complete Test 6 (resources in Storage)

**Steps**:
1. Look at resource panel in HUD

**Expected**:
- HUD shows deposited resource counts
- Counts match Storage contents
- Resources on ground don't show in HUD
- Resources in gnome inventory don't show in HUD

**Verify**:
- HUD dirt/stone counts match sum of all Storage contents

---

### Test 8: Multiple Storages

**Setup**: Place 2 Storage buildings

**Steps**:
1. Have gnome deposit in Storage A
2. Have gnome deposit in Storage B
3. Check HUD

**Expected**:
- HUD shows combined total from both Storages
- Each Storage shows individual contents when selected

---

### Test 9: Resource Re-Fall

**Setup**: Resource grounded on a tile

**Steps**:
1. Mine the tile the resource is resting on

**Expected**:
- Resource falls again
- Resource lands on next solid surface below
- New Collect task generated (or existing one updated)

**Verify**:
- Resource `isGrounded` becomes false then true again

---

### Test 10: Save/Load Persistence

**Setup**: Game with resources in various states

**Steps**:
1. Mine tiles, collect some resources, deposit some
2. Save game
3. Reload page
4. Load game

**Expected**:
- Falling resources continue falling from saved position
- Grounded resources remain grounded
- Gnome inventories preserved
- Storage contents preserved
- Collect tasks for grounded resources preserved

---

## Debugging Tips

### Check Resource State
```typescript
// In browser console
const state = window.__gameState; // if exposed
for (const [id, resource] of state.resources) {
  const pos = state.positions.get(id);
  console.log(`Resource ${id}: ${resource.type}, grounded=${resource.isGrounded}, pos=(${pos?.x}, ${pos?.y})`);
}
```

### Check Gnome Inventory
```typescript
for (const [id, gnome] of state.gnomes) {
  console.log(`Gnome ${id}: inventory=[${gnome.inventory.map(i => i.type).join(', ')}]`);
}
```

### Check Storage Contents
```typescript
for (const [id, storage] of state.storages) {
  console.log(`Storage ${id}:`, Object.fromEntries(storage.contents));
}
```

### Check Collect Tasks
```typescript
for (const [id, task] of state.tasks) {
  if (task.type === 'collect') {
    console.log(`Collect task ${id}: target=${task.targetEntity}, assigned=${task.assignedGnome}`);
  }
}
```

---

## Common Issues

### Issue: Resources float in air
**Cause**: Resource physics system not running or not detecting solid ground
**Check**: Verify `resourcePhysicsSystem` is in game loop, `isSolid()` working

### Issue: Collect tasks not appearing
**Cause**: Task not created on grounding event
**Check**: Verify grounding detection triggers task creation

### Issue: Gnome doesn't deposit
**Cause**: Deposit behavior not triggering, no Storage found
**Check**: Verify Storage exists, pathfinding to Storage works

### Issue: HUD shows wrong count
**Cause**: Still reading from `state.inventory` instead of Storage sum
**Check**: Update ResourcePanel to compute from storages

### Issue: Save/Load loses resources
**Cause**: Missing serialization for new fields
**Check**: Verify `isGrounded`, `inventory`, `buildings`, `storages` in serialize/deserialize
