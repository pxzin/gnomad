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
	Dig = 'dig',
	Collect = 'collect'
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
 * Human-readable labels for task priority levels.
 */
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
	[TaskPriority.Low]: 'Low',
	[TaskPriority.Normal]: 'Normal',
	[TaskPriority.High]: 'High',
	[TaskPriority.Urgent]: 'Urgent'
};

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
	/** Target entity ID (for Collect tasks: the resource to collect) */
	targetEntity: Entity | null;
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
		progress: 0,
		targetEntity: null
	};
}

/**
 * Create a new collect task for a grounded resource.
 */
export function createCollectTask(
	targetX: number,
	targetY: number,
	resourceEntity: Entity,
	createdAt: number
): Task {
	return {
		type: TaskType.Collect,
		targetX,
		targetY,
		priority: TaskPriority.Normal,
		createdAt,
		assignedGnome: null,
		progress: 0,
		targetEntity: resourceEntity
	};
}
