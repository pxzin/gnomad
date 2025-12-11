/**
 * Task Component
 *
 * A queued task for gnomes to execute.
 */

import type { Entity } from '$lib/ecs/types';

/**
 * Types of tasks gnomes can perform.
 */
export enum TaskType {
	Dig = 'dig'
}

/**
 * Task priority levels. Higher values = higher priority.
 */
export enum TaskPriority {
	Low = 0,
	Normal = 1,
	High = 2,
	Urgent = 3
}

/**
 * Task component data.
 */
export interface Task {
	/** Type of task to perform */
	type: TaskType;
	/** Target tile X coordinate */
	targetX: number;
	/** Target tile Y coordinate */
	targetY: number;
	/** Execution priority (higher = executed first) */
	priority: TaskPriority;
	/** Tick when this task was created (for FIFO within same priority) */
	createdAt: number;
	/** Entity ID of the gnome assigned to this task, or null if unassigned */
	assignedGnome: Entity | null;
	/** Task completion progress (0-100) */
	progress: number;
}

/**
 * Create a new dig task.
 */
export function createDigTask(
	targetX: number,
	targetY: number,
	priority: TaskPriority,
	createdAt: number
): Task {
	return {
		type: TaskType.Dig,
		targetX,
		targetY,
		priority,
		createdAt,
		assignedGnome: null,
		progress: 0
	};
}
