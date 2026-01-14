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

		// Assign task to gnome (clear any idle behavior)
		currentState = updateGnome(currentState, gnomeEntity, (g) => ({
			...g,
			state: gnomeStateForTask,
			currentTaskId: taskEntity,
			path: path,
			pathIndex: 0,
			idleBehavior: null
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
 * Group tasks by priority level.
 * Returns a map from priority (Urgent=3 down to Low=0) to tasks at that level.
 * Tasks within each group are already sorted by creation time (FIFO).
 */
function groupTasksByPriority(tasks: [Entity, Task][]): Map<TaskPriority, [Entity, Task][]> {
	const groups = new Map<TaskPriority, [Entity, Task][]>();

	// Initialize all priority levels
	groups.set(TaskPriority.Urgent, []);
	groups.set(TaskPriority.High, []);
	groups.set(TaskPriority.Normal, []);
	groups.set(TaskPriority.Low, []);

	// Group tasks by priority (input is already sorted by priority desc, createdAt asc)
	for (const taskTuple of tasks) {
		const [, task] = taskTuple;
		const group = groups.get(task.priority);
		if (group) {
			group.push(taskTuple);
		}
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
 * 2. For each priority group (highest first):
 *    - Find the closest reachable task (by path length)
 *    - If multiple tasks have the same path length, use FIFO (createdAt)
 * 3. Return the closest task from the highest priority group that has reachable tasks
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

	// Group tasks by priority
	const groups = groupTasksByPriority(tasks);

	let totalAttempts = 0;

	// Process priority groups from highest (Urgent=3) to lowest (Low=0)
	for (const priority of PRIORITY_ORDER) {
		const tasksInGroup = groups.get(priority);
		if (!tasksInGroup || tasksInGroup.length === 0) continue;

		// Find the closest reachable task in this priority group
		let bestTask: ReachableTaskResult | null = null;
		let bestPathLength = Infinity;
		let bestCreatedAt = Infinity;

		for (let i = 0; i < tasksInGroup.length; i++) {
			// Stop after max attempts to prevent CPU overload
			if (totalAttempts >= MAX_PATHFIND_ATTEMPTS_PER_GNOME) {
				// If we found any task in this group, return it
				if (bestTask) return bestTask;
				// Otherwise, we've exhausted our budget with no result
				return null;
			}

			const [taskEntity, task] = tasksInGroup[i]!;

			// Calculate path to task
			const path = findPath(state, gnomeX, gnomeY, task.targetX, task.targetY);
			totalAttempts++;

			if (path && path.length > 0) {
				const pathLength = path.length;

				// Check if this is better than current best:
				// - Shorter path wins
				// - Equal path length: earlier createdAt wins (FIFO)
				const isBetter =
					pathLength < bestPathLength ||
					(pathLength === bestPathLength && task.createdAt < bestCreatedAt);

				if (isBetter) {
					// Find original index in the input tasks array for taskIndex
					const originalIndex = tasks.findIndex(([e]) => e === taskEntity);
					bestTask = {
						taskIndex: originalIndex,
						taskEntity,
						task,
						path
					};
					bestPathLength = pathLength;
					bestCreatedAt = task.createdAt;

					// Return immediately if we found a reachable task
					// This prevents wasting attempts on unreachable tasks
					return bestTask;
				}
			}
		}

		// If we found a reachable task in this priority group, return it
		// (don't check lower priority groups - priority dominates)
		if (bestTask) {
			return bestTask;
		}

		// No reachable tasks in this priority group, continue to next lower priority
	}

	return null;
}
