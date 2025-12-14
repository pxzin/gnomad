/**
 * Task Assignment System
 *
 * Assigns unassigned tasks to idle gnomes.
 * Uses priority + FIFO ordering.
 */

import type { GameState } from '$lib/game/state';
import type { Task } from '$lib/components/task';
import { TaskType } from '$lib/components/task';
import type { Entity } from '$lib/ecs/types';
import type { Position } from '$lib/components/position';
import { getEntitiesWithGnome, getEntitiesWithTask, updateGnome, updateTask } from '$lib/ecs/world';
import { GnomeState, hasInventorySpace } from '$lib/components/gnome';
import { findPath } from './pathfinding';
import {
	TASK_ASSIGNMENT_THROTTLE_TICKS,
	MAX_PATHFIND_ATTEMPTS_PER_GNOME
} from '$lib/config/performance';

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

		const result = findReachableTask(
			currentState,
			gnomeEntity,
			gnomeX,
			gnomeY,
			eligibleTasks
		);

		if (!result) continue;

		const { taskEntity, task, path } = result;

		// Find and remove from original unassigned list
		const originalIndex = unassignedTasks.findIndex(([e]) => e === taskEntity);
		if (originalIndex !== -1) {
			unassignedTasks.splice(originalIndex, 1);
		}

		// Determine gnome state based on task type
		const gnomeStateForTask = task.type === TaskType.Collect ? GnomeState.Walking : GnomeState.Walking;

		// Assign task to gnome
		currentState = updateGnome(currentState, gnomeEntity, (g) => ({
			...g,
			state: gnomeStateForTask,
			currentTaskId: taskEntity,
			path: path,
			pathIndex: 0
		}));

		// Mark task as assigned
		currentState = updateTask(currentState, taskEntity, (t) => ({
			...t,
			assignedGnome: gnomeEntity
		}));
	}

	return currentState;
}

/**
 * Get all idle gnomes.
 */
function getIdleGnomes(state: GameState): Entity[] {
	const gnomeEntities = getEntitiesWithGnome(state);
	return gnomeEntities.filter((entity) => {
		const gnome = state.gnomes.get(entity);
		return gnome && gnome.state === GnomeState.Idle && gnome.currentTaskId === null;
	});
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

interface ReachableTaskResult {
	taskIndex: number;
	taskEntity: Entity;
	task: Task;
	path: Position[];
}

/**
 * Find a reachable task for a gnome.
 * Tries tasks in priority order and returns the first one with a valid path.
 * Limited to MAX_PATHFIND_ATTEMPTS_PER_GNOME attempts to prevent CPU overload.
 */
function findReachableTask(
	state: GameState,
	_gnomeEntity: Entity,
	gnomeX: number,
	gnomeY: number,
	tasks: [Entity, Task][]
): ReachableTaskResult | null {
	let attempts = 0;

	// Try each task in priority order until we find one we can reach
	for (let i = 0; i < tasks.length; i++) {
		// Stop after max attempts to prevent CPU overload with many unreachable tasks
		if (attempts >= MAX_PATHFIND_ATTEMPTS_PER_GNOME) {
			break;
		}

		const [taskEntity, task] = tasks[i]!;

		// Calculate path to task
		const path = findPath(state, gnomeX, gnomeY, task.targetX, task.targetY);
		attempts++;

		if (path && path.length > 0) {
			return {
				taskIndex: i,
				taskEntity,
				task,
				path
			};
		}
	}

	return null;
}
