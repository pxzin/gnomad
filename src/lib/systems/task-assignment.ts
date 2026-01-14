/**
 * Task Assignment System
 *
 * Assigns unassigned tasks to idle gnomes.
 * Uses priority + distance + FIFO ordering:
 * 1. Higher priority tasks are selected first
 * 2. Within same priority, closest task (by path length) is selected
 * 3. When priority and distance are equal, older task wins (FIFO)
 */

import type { GameState } from '$lib/game/state';
import type { Task } from '$lib/components/task';
import { TaskType, TaskPriority } from '$lib/components/task';
import type { Entity } from '$lib/ecs/types';
import type { Position } from '$lib/components/position';
import { getEntitiesWithGnome, getEntitiesWithTask, updateGnome, updateTask } from '$lib/ecs/world';
import { GnomeState, hasInventorySpace } from '$lib/components/gnome';
import { findPath } from './pathfinding';
import {
	TASK_ASSIGNMENT_THROTTLE_TICKS,
	MAX_PATHFIND_ATTEMPTS_PER_GNOME
} from '$lib/config/performance';
import { INTERRUPT_IDLE_BEHAVIORS_FOR_TASKS } from '$lib/config/idle-behavior';

/**
 * Task assignment system update.
 * Assigns the highest priority unassigned task to each idle gnome.
 * Throttled to run every TASK_ASSIGNMENT_THROTTLE_TICKS ticks for performance.
 */
export function taskAssignmentSystem(state: GameState): GameState {
	// Throttle: only run every N ticks to reduce CPU load
	if (state.tick % TASK_ASSIGNMENT_THROTTLE_TICKS !== 0) {
		return state;
	}

	let currentState = state;

	// Find idle gnomes
	const idleGnomes = getIdleGnomes(currentState);
	if (idleGnomes.length === 0) return currentState;

	// Get unassigned tasks sorted by priority (descending) then creation time (ascending)
	const unassignedTasks = getUnassignedTasks(currentState);
	if (unassignedTasks.length === 0) return currentState;

	// Assign tasks to gnomes
	for (const gnomeEntity of idleGnomes) {
		if (unassignedTasks.length === 0) break;

		const gnome = currentState.gnomes.get(gnomeEntity);
		const gnomePos = currentState.positions.get(gnomeEntity);
		if (!gnome || !gnomePos) continue;

		// Find a reachable task for this gnome
		const gnomeX = Math.floor(gnomePos.x);
		const gnomeY = Math.floor(gnomePos.y);

		// Filter tasks based on gnome capabilities
		const eligibleTasks = unassignedTasks.filter(([_, task]) => {
			// For Collect tasks, gnome must have inventory space
			if (task.type === TaskType.Collect) {
				return hasInventorySpace(gnome);
			}
			return true;
		});

		// STICKY BEHAVIOR: First, try to find an adjacent task (within 2 tiles)
		// This keeps gnomes working in the same area instead of wandering off
		let result = findAdjacentTask(currentState, gnomeX, gnomeY, eligibleTasks);

		// If no adjacent task, fall back to the full algorithm
		if (!result) {
			result = findReachableTask(
				currentState,
				gnomeEntity,
				gnomeX,
				gnomeY,
				eligibleTasks
			);
		}

		if (!result) continue;

		const { taskEntity, task, path } = result;

		// Find and remove from original unassigned list
		const originalIndex = unassignedTasks.findIndex(([e]) => e === taskEntity);
		if (originalIndex !== -1) {
			unassignedTasks.splice(originalIndex, 1);
		}

		// Determine gnome state based on task type
		const gnomeStateForTask = task.type === TaskType.Collect ? GnomeState.Walking : GnomeState.Walking;

		// Assign task to gnome (clear any idle behavior)
		currentState = updateGnome(currentState, gnomeEntity, (g) => ({
			...g,
			state: gnomeStateForTask,
			currentTaskId: taskEntity,
			path: path,
			pathIndex: 0,
			idleBehavior: null
		}));

		// Mark task as assigned and reset unreachable count
		currentState = updateTask(currentState, taskEntity, (t) => ({
			...t,
			assignedGnome: gnomeEntity,
			unreachableCount: 0
		}));
	}

	// Find all tasks that are "protected" (connected to an active/assigned task via chain of dig tasks)
	const protectedTasks = findProtectedTasks(currentState);

	// Track how many idle gnomes we started with - if there were idle gnomes but tasks
	// remain unassigned, those tasks are likely unreachable
	const hadIdleGnomes = idleGnomes.length > 0;

	// Increment unreachable count for DIG tasks that remain unassigned and are not protected
	// (Collect tasks are excluded - resources are dynamic and may be briefly unreachable while falling)
	for (const [taskEntity, task] of unassignedTasks) {
		// Only track unreachable for Dig tasks
		if (task.type !== TaskType.Dig) continue;

		const isProtected = protectedTasks.has(`${task.targetX},${task.targetY}`);

		if (!isProtected && hadIdleGnomes) {
			// Truly isolated task - increment unreachable count
			currentState = updateTask(currentState, taskEntity, (t) => ({
				...t,
				unreachableCount: t.unreachableCount + 1
			}));
		} else if (isProtected) {
			// Task is in chain leading to active task - reset count (it's just waiting)
			currentState = updateTask(currentState, taskEntity, (t) => ({
				...t,
				unreachableCount: 0
			}));
		}
		// If no tasks are assigned yet, don't modify unreachableCount (wait for system to stabilize)
	}

	return currentState;
}

/**
 * Find all dig task positions that are "protected" - connected via chain to an assigned task.
 * Uses flood-fill/BFS starting from assigned dig tasks.
 *
 * A task is protected if:
 * - It's assigned (being worked on), OR
 * - It's adjacent to a protected task (recursive chain)
 * - It's connected through already-dug air tiles (for T-shaped tunnels etc.)
 *
 * Returns a Set of "x,y" coordinate strings for protected positions.
 */
function findProtectedTasks(state: GameState): Set<string> {
	const protected_ = new Set<string>();
	const visited = new Set<string>();

	// Build a map of all dig task positions for quick lookup
	const digTaskPositions = new Map<string, Task>();
	const assignedPositions: string[] = [];

	for (const [, task] of state.tasks) {
		if (task.type !== TaskType.Dig) continue;
		const key = `${task.targetX},${task.targetY}`;
		digTaskPositions.set(key, task);

		if (task.assignedGnome !== null) {
			assignedPositions.push(key);
			protected_.add(key);
		}
	}

	// Helper to check if a position is air (already dug)
	const isAir = (x: number, y: number): boolean => {
		if (y < 0 || y >= state.worldHeight || x < 0 || x >= state.worldWidth) {
			return false;
		}
		return state.tileGrid[y]![x] === null;
	};

	// BFS from each assigned task to find all connected dig tasks
	// Now also traverses through air tiles to connect T-shaped tunnels
	const queue = [...assignedPositions];

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (visited.has(current)) continue;
		visited.add(current);

		const parts = current.split(',');
		const x = Number(parts[0]);
		const y = Number(parts[1]);

		// Check all 4 cardinal directions
		const neighborCoords = [
			{ nx: x - 1, ny: y },
			{ nx: x + 1, ny: y },
			{ nx: x, ny: y - 1 },
			{ nx: x, ny: y + 1 }
		];

		for (const { nx, ny } of neighborCoords) {
			const neighborKey = `${nx},${ny}`;
			if (visited.has(neighborKey)) continue;

			// Check if neighbor is a dig task
			if (digTaskPositions.has(neighborKey)) {
				// This neighbor is a dig task connected to the chain
				protected_.add(neighborKey);
				queue.push(neighborKey);
			} else if (isAir(nx, ny)) {
				// This neighbor is already-dug air - traverse through it
				// to potentially reach more dig tasks on the other side
				queue.push(neighborKey);
			}
		}
	}

	return protected_;
}

/**
 * Get all gnomes available for task assignment.
 *
 * Returns gnomes that are:
 * - Truly idle (state === Idle, no task)
 * - Performing idle behaviors (strolling, socializing, resting) if INTERRUPT_IDLE_BEHAVIORS_FOR_TASKS is enabled
 */
function getIdleGnomes(state: GameState): Entity[] {
	const gnomeEntities = getEntitiesWithGnome(state);
	return gnomeEntities.filter((entity) => {
		const gnome = state.gnomes.get(entity);
		if (!gnome) return false;
		if (gnome.currentTaskId !== null) return false;

		// Truly idle gnomes are always available
		if (gnome.state === GnomeState.Idle) return true;

		// If interruption is enabled, gnomes doing idle behaviors are also available
		if (INTERRUPT_IDLE_BEHAVIORS_FOR_TASKS && gnome.idleBehavior) {
			// Strolling gnomes are in Walking state but can be interrupted
			if (gnome.state === GnomeState.Walking && gnome.idleBehavior.type === 'strolling') {
				return true;
			}
		}

		return false;
	});
}

/** Maximum distance (Manhattan) for a task to be considered "adjacent" for sticky behavior */
const ADJACENT_TASK_RADIUS = 2;

/**
 * Find an adjacent task (within ADJACENT_TASK_RADIUS tiles) that is reachable.
 * This implements "sticky behavior" - gnomes prefer to continue working in the same area.
 *
 * Priority order:
 * 1. Dig tasks (keep digging before collecting)
 * 2. Then by distance (closest first)
 * 3. Then by task priority
 *
 * Returns null if no adjacent reachable task is found.
 */
function findAdjacentTask(
	state: GameState,
	gnomeX: number,
	gnomeY: number,
	tasks: [Entity, Task][]
): ReachableTaskResult | null {
	// Filter to only tasks within the adjacent radius
	const adjacentTasks = tasks.filter(([, task]) => {
		const distance = Math.abs(task.targetX - gnomeX) + Math.abs(task.targetY - gnomeY);
		return distance <= ADJACENT_TASK_RADIUS;
	});

	if (adjacentTasks.length === 0) return null;

	// Sort by: task type (dig first), then distance (closest), then priority (highest)
	adjacentTasks.sort((a, b) => {
		// Dig tasks have priority over Collect tasks
		const typeA = a[1].type === TaskType.Dig ? 0 : 1;
		const typeB = b[1].type === TaskType.Dig ? 0 : 1;
		if (typeA !== typeB) return typeA - typeB;

		// Then by distance
		const distA = Math.abs(a[1].targetX - gnomeX) + Math.abs(a[1].targetY - gnomeY);
		const distB = Math.abs(b[1].targetX - gnomeX) + Math.abs(b[1].targetY - gnomeY);
		if (distA !== distB) return distA - distB;

		// Then by priority
		return b[1].priority - a[1].priority;
	});

	// Try pathfinding to adjacent tasks (limit attempts to avoid performance issues)
	const maxAttempts = Math.min(adjacentTasks.length, 5);

	for (let i = 0; i < maxAttempts; i++) {
		const [taskEntity, task] = adjacentTasks[i]!;
		const path = findPath(state, gnomeX, gnomeY, task.targetX, task.targetY);

		if (path && path.length > 0) {
			const originalIndex = tasks.findIndex(([e]) => e === taskEntity);
			return {
				taskIndex: originalIndex,
				taskEntity,
				task,
				path
			};
		}
	}

	return null;
}

/**
 * Get all unassigned tasks, sorted by priority (desc) then creation time (asc).
 */
function getUnassignedTasks(state: GameState): [Entity, Task][] {
	const taskEntities = getEntitiesWithTask(state);
	const unassigned: [Entity, Task][] = [];

	for (const entity of taskEntities) {
		const task = state.tasks.get(entity);
		if (task && task.assignedGnome === null) {
			unassigned.push([entity, task]);
		}
	}

	// Sort by priority (descending) then creation time (ascending)
	unassigned.sort((a, b) => {
		const priorityDiff = b[1].priority - a[1].priority;
		if (priorityDiff !== 0) return priorityDiff;
		return a[1].createdAt - b[1].createdAt;
	});

	return unassigned;
}

/**
 * Calculate Manhattan distance between two points.
 * Used as a cheap heuristic to estimate task proximity before expensive pathfinding.
 */
function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
	return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Group tasks by priority level and sort by estimated distance to gnome.
 * Returns a map from priority (Urgent=3 down to Low=0) to tasks at that level.
 * Tasks within each group are sorted by Manhattan distance (ascending), then creation time (FIFO).
 *
 * Sorting by distance first ensures closer tasks (more likely reachable) are tried before
 * distant tasks, reducing wasted pathfinding attempts on unreachable tasks.
 */
function groupTasksByPriority(
	tasks: [Entity, Task][],
	gnomeX: number,
	gnomeY: number
): Map<TaskPriority, [Entity, Task][]> {
	const groups = new Map<TaskPriority, [Entity, Task][]>();

	// Initialize all priority levels
	groups.set(TaskPriority.Urgent, []);
	groups.set(TaskPriority.High, []);
	groups.set(TaskPriority.Normal, []);
	groups.set(TaskPriority.Low, []);

	// Group tasks by priority
	for (const taskTuple of tasks) {
		const [, task] = taskTuple;
		const group = groups.get(task.priority);
		if (group) {
			group.push(taskTuple);
		}
	}

	// Sort each group by Manhattan distance (ascending), then creation time (FIFO)
	for (const [, group] of groups) {
		group.sort((a, b) => {
			const distA = manhattanDistance(gnomeX, gnomeY, a[1].targetX, a[1].targetY);
			const distB = manhattanDistance(gnomeX, gnomeY, b[1].targetX, b[1].targetY);
			if (distA !== distB) return distA - distB;
			return a[1].createdAt - b[1].createdAt;
		});
	}

	return groups;
}

interface ReachableTaskResult {
	taskIndex: number;
	taskEntity: Entity;
	task: Task;
	path: Position[];
}

/** Priority levels in descending order (highest first) */
const PRIORITY_ORDER: TaskPriority[] = [
	TaskPriority.Urgent,
	TaskPriority.High,
	TaskPriority.Normal,
	TaskPriority.Low
];

/**
 * Find a reachable task for a gnome.
 *
 * Selection algorithm:
 * 1. Group tasks by priority level
 * 2. Within each group, sort by Manhattan distance to gnome (closest first)
 * 3. For each priority group (highest first):
 *    - Sample tasks from BOTH ends of the distance spectrum (close AND far)
 *    - This ensures we don't miss reachable distant tasks when close ones are blocked
 * 4. Return first reachable task from the highest priority group
 *
 * The hybrid sampling approach handles two failure scenarios:
 * - Close tasks unreachable (blocked by terrain) → distant tasks still get tried
 * - Distant tasks unreachable → close tasks still get tried first
 *
 * Performance: Limited to MAX_PATHFIND_ATTEMPTS_PER_GNOME total attempts across all groups.
 */
function findReachableTask(
	state: GameState,
	_gnomeEntity: Entity,
	gnomeX: number,
	gnomeY: number,
	tasks: [Entity, Task][]
): ReachableTaskResult | null {
	if (tasks.length === 0) return null;

	// Group tasks by priority and sort by distance to gnome
	const groups = groupTasksByPriority(tasks, gnomeX, gnomeY);

	let totalAttempts = 0;

	// Process priority groups from highest (Urgent=3) to lowest (Low=0)
	for (const priority of PRIORITY_ORDER) {
		const tasksInGroup = groups.get(priority);
		if (!tasksInGroup || tasksInGroup.length === 0) continue;

		// Build sampling order: alternate between close and far tasks
		// This ensures we try both ends of the distance spectrum
		const samplingOrder = buildSamplingOrder(tasksInGroup.length);

		for (const idx of samplingOrder) {
			// Stop after max attempts to prevent CPU overload
			if (totalAttempts >= MAX_PATHFIND_ATTEMPTS_PER_GNOME) {
				return null;
			}

			const [taskEntity, task] = tasksInGroup[idx]!;

			// Calculate path to task
			const path = findPath(state, gnomeX, gnomeY, task.targetX, task.targetY);
			totalAttempts++;

			if (path && path.length > 0) {
				// Find original index in the input tasks array for taskIndex
				const originalIndex = tasks.findIndex(([e]) => e === taskEntity);
				return {
					taskIndex: originalIndex,
					taskEntity,
					task,
					path
				};
			}
		}

		// No reachable tasks in this priority group, continue to next lower priority
	}

	return null;
}

/**
 * Build a sampling order that alternates between close and far indices.
 * Given array length N, returns indices in order: [0, N-1, 1, N-2, 2, N-3, ...]
 * This ensures we sample both ends of a distance-sorted array.
 */
function buildSamplingOrder(length: number): number[] {
	if (length === 0) return [];
	if (length === 1) return [0];

	const order: number[] = [];
	let left = 0;
	let right = length - 1;

	while (left <= right) {
		order.push(left);
		if (left !== right) {
			order.push(right);
		}
		left++;
		right--;
	}

	return order;
}
