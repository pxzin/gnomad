/**
 * Command Types
 *
 * Discrete player actions captured for deterministic replay.
 * All player input is converted to commands before processing.
 */

import type { Entity } from '$lib/ecs/types';
import type { BuildingType } from '$lib/components/building';

/**
 * Game speed configuration.
 * Centralized speed values - change here to affect the entire game.
 */
export enum GameSpeed {
	Normal = 1,
	Fast = 2,
	Faster = 3,
	Fastest = 4 // Reserved for future use
}

/**
 * All available game speeds for UI iteration.
 * Add/remove speeds here to change what's available in the game.
 */
export const AVAILABLE_SPEEDS: GameSpeed[] = [GameSpeed.Normal, GameSpeed.Fast, GameSpeed.Faster];

/**
 * Speed display labels for UI.
 */
export const SPEED_LABELS: Record<GameSpeed, string> = {
	[GameSpeed.Normal]: '1x',
	[GameSpeed.Fast]: '2x',
	[GameSpeed.Faster]: '3x',
	[GameSpeed.Fastest]: '4x'
};

/**
 * All possible player commands.
 */
export type Command =
	| { type: 'SELECT_TILES'; tiles: { x: number; y: number }[]; addToSelection: boolean }
	| { type: 'DIG'; tiles: { x: number; y: number }[] }
	| { type: 'CANCEL_TASK'; taskId: Entity }
	| { type: 'PAN_CAMERA'; dx: number; dy: number }
	| { type: 'ZOOM_CAMERA'; delta: number; mouseX: number; mouseY: number; screenWidth: number; screenHeight: number }
	| { type: 'SET_SPEED'; speed: GameSpeed }
	| { type: 'TOGGLE_PAUSE' }
	| { type: 'SPAWN_GNOME' }
	| { type: 'SELECT_GNOMES'; gnomeIds: Entity[]; addToSelection: boolean }
	| { type: 'CLEAR_SELECTION' }
	| { type: 'CANCEL_DIG'; tiles: { x: number; y: number }[] }
	| { type: 'PLACE_BUILDING'; buildingType: BuildingType; x: number; y: number };

/**
 * Command with tick timestamp for deterministic replay.
 */
export interface CommandEnvelope {
	command: Command;
	/** Tick when this command was issued */
	tick: number;
}

/**
 * Create a SELECT_TILES command.
 * @param tiles - Array of tile coordinates to select
 * @param addToSelection - If true, add to existing selection (Shift+click behavior)
 */
export function selectTiles(tiles: { x: number; y: number }[], addToSelection: boolean = false): Command {
	return { type: 'SELECT_TILES', tiles, addToSelection };
}

/**
 * Create a DIG command.
 */
export function dig(tiles: { x: number; y: number }[]): Command {
	return { type: 'DIG', tiles };
}

/**
 * Create a PAN_CAMERA command.
 */
export function panCamera(dx: number, dy: number): Command {
	return { type: 'PAN_CAMERA', dx, dy };
}

/**
 * Create a ZOOM_CAMERA command.
 * @param delta - Zoom change amount (positive = zoom in, negative = zoom out)
 * @param mouseX - Mouse X position on screen
 * @param mouseY - Mouse Y position on screen
 * @param screenWidth - Screen/canvas width
 * @param screenHeight - Screen/canvas height
 */
export function zoomCamera(
	delta: number,
	mouseX: number,
	mouseY: number,
	screenWidth: number,
	screenHeight: number
): Command {
	return { type: 'ZOOM_CAMERA', delta, mouseX, mouseY, screenWidth, screenHeight };
}

/**
 * Create a SET_SPEED command.
 */
export function setSpeed(speed: GameSpeed): Command {
	return { type: 'SET_SPEED', speed };
}

/**
 * Create a TOGGLE_PAUSE command.
 */
export function togglePause(): Command {
	return { type: 'TOGGLE_PAUSE' };
}

/**
 * Create a SPAWN_GNOME command.
 */
export function spawnGnomeCommand(): Command {
	return { type: 'SPAWN_GNOME' };
}

/**
 * Create a SELECT_GNOMES command.
 * @param gnomeIds - Array of gnome entity IDs to select
 * @param addToSelection - If true, Shift+click behavior (toggle selection)
 */
export function selectGnomes(gnomeIds: Entity[], addToSelection: boolean = false): Command {
	return { type: 'SELECT_GNOMES', gnomeIds, addToSelection };
}

/**
 * Create a CLEAR_SELECTION command.
 * Clears both tile and gnome selections.
 */
export function clearSelection(): Command {
	return { type: 'CLEAR_SELECTION' };
}

/**
 * Create a CANCEL_DIG command.
 * Cancels dig tasks for the specified tiles.
 */
export function cancelDig(tiles: { x: number; y: number }[]): Command {
	return { type: 'CANCEL_DIG', tiles };
}

/**
 * Create a PLACE_BUILDING command.
 * Places a building at the specified tile coordinates.
 * @param buildingType - Type of building to place
 * @param x - X tile coordinate (left edge of building)
 * @param y - Y tile coordinate (top edge of building)
 */
export function placeBuilding(buildingType: BuildingType, x: number, y: number): Command {
	return { type: 'PLACE_BUILDING', buildingType, x, y };
}
