/**
 * Game State
 *
 * The complete game state. Must be JSON-serializable for save/load.
 * All game data is stored here following ECS architecture.
 */

import type { Entity } from '$lib/ecs/types';
import type { Position } from '$lib/components/position';
import type { Velocity } from '$lib/components/velocity';
import type { Tile } from '$lib/components/tile';
import type { Gnome } from '$lib/components/gnome';
import type { Task } from '$lib/components/task';
import type { Camera } from '$lib/components/camera';
import { createCamera, CAMERA_LERP_SPEED, MIN_ZOOM, MAX_ZOOM } from '$lib/components/camera';
import type { GameSpeed } from './commands';

/**
 * Complete game state.
 */
export interface GameState {
	// Metadata
	/** World generation seed for reproducibility */
	seed: number;
	/** Current simulation tick */
	tick: number;
	/** Whether the game is paused */
	isPaused: boolean;
	/** Game speed multiplier */
	speed: GameSpeed;

	// Entity management
	/** Next entity ID to assign (auto-incrementing) */
	nextEntityId: Entity;

	// World grid
	/** World width in tiles */
	worldWidth: number;
	/** World height in tiles */
	worldHeight: number;
	/** 2D grid of tile entity IDs (null = air) */
	tileGrid: (Entity | null)[][];

	// Component storage
	positions: Map<Entity, Position>;
	velocities: Map<Entity, Velocity>;
	tiles: Map<Entity, Tile>;
	gnomes: Map<Entity, Gnome>;
	tasks: Map<Entity, Task>;

	// Camera state
	camera: Camera;

	// Selection state (UI)
	selectedTiles: { x: number; y: number }[];
}

/**
 * Create an empty game state.
 */
export function createEmptyState(seed: number, width: number, height: number): GameState {
	// Initialize empty tile grid
	const tileGrid: (Entity | null)[][] = [];
	for (let y = 0; y < height; y++) {
		tileGrid[y] = new Array(width).fill(null);
	}

	return {
		seed,
		tick: 0,
		isPaused: false,
		speed: 1,
		nextEntityId: 1,
		worldWidth: width,
		worldHeight: height,
		tileGrid,
		positions: new Map(),
		velocities: new Map(),
		tiles: new Map(),
		gnomes: new Map(),
		tasks: new Map(),
		camera: createCamera((width * 16) / 2, (height * 16) / 2),
		selectedTiles: []
	};
}

/**
 * Pan the camera by a delta amount.
 */
export function panCamera(state: GameState, dx: number, dy: number): GameState {
	return {
		...state,
		camera: {
			...state.camera,
			targetX: state.camera.targetX + dx,
			targetY: state.camera.targetY + dy
		}
	};
}

/**
 * Zoom the camera by a delta amount.
 */
export function zoomCamera(state: GameState, delta: number): GameState {
	const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.camera.zoom + delta));
	return {
		...state,
		camera: {
			...state.camera,
			zoom: newZoom
		}
	};
}

/**
 * Update camera position with smooth interpolation.
 */
export function updateCamera(state: GameState): GameState {
	const { camera } = state;
	const newX = camera.x + (camera.targetX - camera.x) * CAMERA_LERP_SPEED;
	const newY = camera.y + (camera.targetY - camera.y) * CAMERA_LERP_SPEED;

	return {
		...state,
		camera: {
			...camera,
			x: newX,
			y: newY
		}
	};
}

/**
 * Serialized game state format for JSON storage.
 */
export interface SerializedGameState {
	seed: number;
	tick: number;
	isPaused: boolean;
	speed: GameSpeed;
	nextEntityId: number;
	worldWidth: number;
	worldHeight: number;
	tileGrid: (number | null)[][];
	positions: [number, Position][];
	velocities: [number, Velocity][];
	tiles: [number, Tile][];
	gnomes: [number, Gnome][];
	tasks: [number, Task][];
	camera: Camera;
	selectedTiles: { x: number; y: number }[];
}

/**
 * Serialize game state to JSON string.
 */
export function serialize(state: GameState): string {
	const serialized: SerializedGameState = {
		seed: state.seed,
		tick: state.tick,
		isPaused: state.isPaused,
		speed: state.speed,
		nextEntityId: state.nextEntityId,
		worldWidth: state.worldWidth,
		worldHeight: state.worldHeight,
		tileGrid: state.tileGrid,
		positions: Array.from(state.positions.entries()),
		velocities: Array.from(state.velocities.entries()),
		tiles: Array.from(state.tiles.entries()),
		gnomes: Array.from(state.gnomes.entries()),
		tasks: Array.from(state.tasks.entries()),
		camera: state.camera,
		selectedTiles: state.selectedTiles
	};
	return JSON.stringify(serialized);
}

/**
 * Deserialize game state from JSON string.
 */
export function deserialize(json: string): GameState {
	const data = JSON.parse(json) as SerializedGameState;
	return {
		seed: data.seed,
		tick: data.tick,
		isPaused: data.isPaused,
		speed: data.speed,
		nextEntityId: data.nextEntityId,
		worldWidth: data.worldWidth,
		worldHeight: data.worldHeight,
		tileGrid: data.tileGrid,
		positions: new Map(data.positions),
		velocities: new Map(data.velocities),
		tiles: new Map(data.tiles),
		gnomes: new Map(data.gnomes),
		tasks: new Map(data.tasks),
		camera: data.camera,
		selectedTiles: data.selectedTiles
	};
}

/**
 * Save game state to localStorage.
 */
export function saveToLocalStorage(state: GameState, key: string = 'gnomad_save'): void {
	localStorage.setItem(key, serialize(state));
}

/**
 * Load game state from localStorage.
 */
export function loadFromLocalStorage(key: string = 'gnomad_save'): GameState | null {
	const json = localStorage.getItem(key);
	if (!json) return null;
	return deserialize(json);
}
