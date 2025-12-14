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
import { ResourceType, type Resource } from '$lib/components/resource';
import type { Building } from '$lib/components/building';
import type { Storage } from '$lib/components/storage';
import { createCamera, CAMERA_LERP_SPEED, MIN_ZOOM, MAX_ZOOM } from '$lib/components/camera';
import { GameSpeed } from './commands';

/**
 * Global resource inventory.
 * Tracks collected resources across all gnomes.
 */
export interface ResourceInventory {
	/** Count of collected dirt resources */
	dirt: number;
	/** Count of collected stone resources */
	stone: number;
}

/**
 * Create an empty resource inventory.
 */
export function createEmptyInventory(): ResourceInventory {
	return { dirt: 0, stone: 0 };
}

/**
 * Get the total stored resources across all Storage buildings.
 * This is the new source of truth for global resource availability.
 */
export function getStoredResources(state: GameState): ResourceInventory {
	const result: ResourceInventory = { dirt: 0, stone: 0 };

	for (const storage of state.storages.values()) {
		for (const [resourceType, count] of storage.contents) {
			if (resourceType === ResourceType.Dirt) {
				result.dirt += count;
			} else if (resourceType === ResourceType.Stone) {
				result.stone += count;
			}
		}
	}

	return result;
}

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
	/** Resource entities in the world (dropped, not yet collected) */
	resources: Map<Entity, Resource>;
	/** Building entities */
	buildings: Map<Entity, Building>;
	/** Storage building contents */
	storages: Map<Entity, Storage>;

	// Inventory
	/** Global collected resource counts */
	inventory: ResourceInventory;

	// Camera state
	camera: Camera;

	// Selection state (UI)
	selectedTiles: { x: number; y: number }[];
	/** Selected gnome entity IDs */
	selectedGnomes: Entity[];
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
		speed: GameSpeed.Normal,
		nextEntityId: 1,
		worldWidth: width,
		worldHeight: height,
		tileGrid,
		positions: new Map(),
		velocities: new Map(),
		tiles: new Map(),
		gnomes: new Map(),
		tasks: new Map(),
		resources: new Map(),
		buildings: new Map(),
		storages: new Map(),
		inventory: createEmptyInventory(),
		camera: createCamera((width * 16) / 2, (height * 16) / 2),
		selectedTiles: [],
		selectedGnomes: []
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
 * Zoom the camera centered on mouse position.
 * @param state - Current game state
 * @param delta - Zoom change amount
 * @param mouseX - Mouse X position on screen
 * @param mouseY - Mouse Y position on screen
 * @param screenWidth - Screen width
 * @param screenHeight - Screen height
 */
export function zoomCamera(
	state: GameState,
	delta: number,
	mouseX: number,
	mouseY: number,
	screenWidth: number,
	screenHeight: number
): GameState {
	const { camera } = state;
	const oldZoom = camera.zoom;
	const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom + delta));

	// If zoom didn't change, no need to adjust camera position
	if (newZoom === oldZoom) {
		return state;
	}

	// Calculate world position under mouse before zoom
	const worldXBeforeZoom = (mouseX - screenWidth / 2) / oldZoom + camera.targetX;
	const worldYBeforeZoom = (mouseY - screenHeight / 2) / oldZoom + camera.targetY;

	// Calculate world position under mouse after zoom (should be same point)
	// worldX = (mouseX - screenWidth/2) / newZoom + newCameraX
	// We want worldXBeforeZoom = worldXAfterZoom
	// So: newCameraX = worldXBeforeZoom - (mouseX - screenWidth/2) / newZoom
	const newTargetX = worldXBeforeZoom - (mouseX - screenWidth / 2) / newZoom;
	const newTargetY = worldYBeforeZoom - (mouseY - screenHeight / 2) / newZoom;

	return {
		...state,
		camera: {
			...camera,
			zoom: newZoom,
			targetX: newTargetX,
			targetY: newTargetY
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
 * Serialized storage (Map converted to array).
 */
export interface SerializedStorage {
	contents: [ResourceType, number][];
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
	resources: [number, Resource][];
	buildings: [number, Building][];
	storages: [number, SerializedStorage][];
	inventory: ResourceInventory;
	camera: Camera;
	selectedTiles: { x: number; y: number }[];
	selectedGnomes: number[];
}

/**
 * Serialize game state to JSON string.
 */
export function serialize(state: GameState): string {
	// Convert Storage Maps to serializable format
	const serializedStorages: [number, SerializedStorage][] = Array.from(state.storages.entries()).map(
		([id, storage]) => [id, { contents: Array.from(storage.contents.entries()) }]
	);

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
		resources: Array.from(state.resources.entries()),
		buildings: Array.from(state.buildings.entries()),
		storages: serializedStorages,
		inventory: state.inventory,
		camera: state.camera,
		selectedTiles: state.selectedTiles,
		selectedGnomes: state.selectedGnomes
	};
	return JSON.stringify(serialized);
}

/**
 * Deserialize game state from JSON string.
 */
export function deserialize(json: string): GameState {
	const data = JSON.parse(json) as SerializedGameState;

	// Convert serialized storages back to Storage components with Maps
	const storages = new Map<Entity, Storage>();
	if (data.storages) {
		for (const [id, serializedStorage] of data.storages) {
			storages.set(id, {
				contents: new Map(serializedStorage.contents)
			});
		}
	}

	// Ensure gnomes have inventory field (backwards compatibility)
	const gnomes = new Map(data.gnomes);
	for (const [id, gnome] of gnomes) {
		if (!gnome.inventory) {
			gnomes.set(id, { ...gnome, inventory: [] });
		}
	}

	// Ensure resources have isGrounded field (backwards compatibility)
	const resources = new Map(data.resources ?? []);
	for (const [id, resource] of resources) {
		if (resource.isGrounded === undefined) {
			resources.set(id, { ...resource, isGrounded: true });
		}
	}

	// Ensure tasks have targetEntity field (backwards compatibility)
	const tasks = new Map(data.tasks);
	for (const [id, task] of tasks) {
		if (task.targetEntity === undefined) {
			tasks.set(id, { ...task, targetEntity: null });
		}
	}

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
		gnomes,
		tasks,
		resources,
		buildings: new Map(data.buildings ?? []),
		storages,
		inventory: data.inventory ?? { dirt: 0, stone: 0 },
		camera: data.camera,
		selectedTiles: data.selectedTiles,
		selectedGnomes: data.selectedGnomes ?? []
	};
}

/**
 * Save game state to localStorage.
 */
export function saveToLocalStorage(state: GameState, key: string = 'gnomes_at_work_save'): void {
	localStorage.setItem(key, serialize(state));
}

/**
 * Load game state from localStorage.
 */
export function loadFromLocalStorage(key: string = 'gnomes_at_work_save'): GameState | null {
	const json = localStorage.getItem(key);
	if (!json) return null;
	return deserialize(json);
}
