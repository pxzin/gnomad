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

// Permanent Background Colors
/** Sky color for above horizon */
export const PERMANENT_BACKGROUND_SKY_COLOR = 0x87ceeb;
/** Cave/rock color for below horizon */
export const PERMANENT_BACKGROUND_CAVE_COLOR = 0x2a2a2a;

/** Background block color multiplier (60% brightness = darker than foreground) */
export const BACKGROUND_DARKEN_FACTOR = 0.6;

/**
 * Calculate background block color from foreground color.
 * Darkens the color by BACKGROUND_DARKEN_FACTOR.
 */
export function getBackgroundBlockColor(foregroundColor: number): number {
	const r = Math.floor(((foregroundColor >> 16) & 0xff) * BACKGROUND_DARKEN_FACTOR);
	const g = Math.floor(((foregroundColor >> 8) & 0xff) * BACKGROUND_DARKEN_FACTOR);
	const b = Math.floor((foregroundColor & 0xff) * BACKGROUND_DARKEN_FACTOR);
	return (r << 16) | (g << 8) | b;
}

import { TileType, TILE_CONFIG } from '$lib/components/tile';

/** Pre-computed background tile colors (darker versions of foreground) */
export const BACKGROUND_TILE_COLORS: Record<TileType, number> = {
	[TileType.Air]: 0x000000, // Not rendered
	[TileType.Dirt]: getBackgroundBlockColor(TILE_CONFIG[TileType.Dirt].color),
	[TileType.Stone]: getBackgroundBlockColor(TILE_CONFIG[TileType.Stone].color),
	[TileType.Bedrock]: getBackgroundBlockColor(TILE_CONFIG[TileType.Bedrock].color)
};
