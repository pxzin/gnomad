/**
 * UI Colors
 *
 * Centralized color definitions for rendering and UI elements.
 * All colors use PixiJS hex format (0xRRGGBB).
 */

import { TaskPriority } from '$lib/components/task';

// Selection & Highlighting
/** Yellow selection highlight color */
export const SELECTION_COLOR = 0xffff00;
/** Selection highlight opacity (0-1) */
export const SELECTION_ALPHA = 0.3;

// Task Markers
/** Red task indicator color */
export const TASK_MARKER_COLOR = 0xff0000;
/** Task marker opacity (0-1) */
export const TASK_MARKER_ALPHA = 0.5;

// Environment
/** Sky blue background color */
export const SKY_COLOR = 0x87ceeb;

// Entity Colors (placeholder sprites)
/** Bright green gnome placeholder color */
export const GNOME_COLOR = 0x00ff00;

// Resource Entity Colors
/** Dirt resource entity color (darker brown) */
export const RESOURCE_DIRT_COLOR = 0x6b3a0b;
/** Stone resource entity color (darker gray) */
export const RESOURCE_STONE_COLOR = 0x4a4a4a;

// Building Colors
/** Storage building color (saddle brown) */
export const STORAGE_COLOR = 0x8b4513;

// Task Priority Colors
/** Color mapping for task priority levels */
export const TASK_PRIORITY_COLORS: Record<TaskPriority, number> = {
	[TaskPriority.Low]: 0x888888, // Gray
	[TaskPriority.Normal]: 0x4a90d9, // Blue
	[TaskPriority.High]: 0xffaa00, // Yellow/Orange
	[TaskPriority.Urgent]: 0xff4444 // Red
};
