/**
 * Command Types
 *
 * Discrete player actions captured for deterministic replay.
 * All player input is converted to commands before processing.
 */

import type { Entity } from '$lib/ecs/types';

/**
 * Game speed multipliers.
 */
export type GameSpeed = 0.5 | 1 | 2;

/**
 * All possible player commands.
 */
export type Command =
	| { type: 'SELECT_TILES'; tiles: { x: number; y: number }[] }
	| { type: 'DIG'; tiles: { x: number; y: number }[] }
	| { type: 'CANCEL_TASK'; taskId: Entity }
	| { type: 'PAN_CAMERA'; dx: number; dy: number }
	| { type: 'ZOOM_CAMERA'; delta: number }
	| { type: 'SET_SPEED'; speed: GameSpeed }
	| { type: 'TOGGLE_PAUSE' }
	| { type: 'SPAWN_GNOME' };

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
 */
export function selectTiles(tiles: { x: number; y: number }[]): Command {
	return { type: 'SELECT_TILES', tiles };
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
 */
export function zoomCamera(delta: number): Command {
	return { type: 'ZOOM_CAMERA', delta };
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
