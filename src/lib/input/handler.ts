/**
 * Input Handler
 *
 * Handles mouse and keyboard input and converts to game commands.
 */

import type { Renderer } from '$lib/render/renderer';
import { screenToTile, getVisibleBounds } from '$lib/render/renderer';
import type { GameState } from '$lib/game/state';
import type { Command } from '$lib/game/commands';
import {
	selectTiles,
	dig,
	cancelDig,
	panCamera,
	zoomCamera,
	setSpeed,
	togglePause,
	selectGnomes,
	clearSelection,
	AVAILABLE_SPEEDS
} from '$lib/game/commands';
import { TileType } from '$lib/components/tile';
import type { Entity } from '$lib/ecs/types';

/**
 * Double-click detection timeout in milliseconds.
 */
const DOUBLE_CLICK_TIMEOUT = 300;

/**
 * Camera pan speed for arrow keys (pixels per frame at 60fps).
 */
const PAN_SPEED = 8;

/**
 * Input state for tracking drag operations.
 */
export interface InputState {
	isDragging: boolean;
	isSelecting: boolean;
	isAddingToSelection: boolean;
	dragStartX: number;
	dragStartY: number;
	lastMouseX: number;
	lastMouseY: number;
	selectionStart: { x: number; y: number } | null;
	// Double-click tracking
	lastClickTime: number;
	lastClickedGnome: number | null;
	// Keyboard pan tracking
	keysPressed: Set<string>;
}

/**
 * Create initial input state.
 */
export function createInputState(): InputState {
	return {
		isDragging: false,
		isSelecting: false,
		isAddingToSelection: false,
		dragStartX: 0,
		dragStartY: 0,
		lastMouseX: 0,
		lastMouseY: 0,
		selectionStart: null,
		lastClickTime: 0,
		lastClickedGnome: null,
		keysPressed: new Set()
	};
}

/**
 * Input event handlers that emit commands.
 */
export interface InputHandlers {
	onMouseDown: (e: MouseEvent) => void;
	onMouseMove: (e: MouseEvent) => void;
	onMouseUp: (e: MouseEvent) => void;
	onWheel: (e: WheelEvent) => void;
	onKeyDown: (e: KeyboardEvent) => void;
	onKeyUp: (e: KeyboardEvent) => void;
	/** Process continuous input (call every frame) */
	update: () => void;
	cleanup: () => void;
}

/**
 * Create input handlers for a canvas element.
 */
export function createInputHandlers(
	canvas: HTMLCanvasElement,
	getRenderer: () => Renderer | null,
	getState: () => GameState,
	emitCommand: (command: Command) => void
): InputHandlers {
	const inputState = createInputState();

	function onMouseDown(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (e.button === 0) {
			// Left click - check for gnome first, then tile selection
			const renderer = getRenderer();
			if (renderer) {
				const state = getState();
				const tile = screenToTile(renderer, state, x, y);

				// Check for gnome at this tile
				const gnomeAtTile = findGnomeAtTile(state, tile.x, tile.y);

				if (gnomeAtTile !== null) {
					// Click on gnome - check for double-click
					const now = Date.now();
					const isDoubleClick =
						inputState.lastClickedGnome === gnomeAtTile &&
						now - inputState.lastClickTime < DOUBLE_CLICK_TIMEOUT;

					if (isDoubleClick) {
						// Double-click on gnome - select all visible gnomes
						const bounds = getVisibleBounds(renderer, state);
						const visibleGnomes = findVisibleGnomes(state, bounds);
						emitCommand(selectGnomes(visibleGnomes, false));
						// Reset double-click tracking
						inputState.lastClickedGnome = null;
						inputState.lastClickTime = 0;
					} else {
						// Single click on gnome - handle gnome selection
						const addToSelection = e.shiftKey;
						emitCommand(selectGnomes([gnomeAtTile], addToSelection));
						// Track for potential double-click
						inputState.lastClickedGnome = gnomeAtTile;
						inputState.lastClickTime = now;
					}
				} else {
					// Not clicking on gnome - reset double-click tracking
					inputState.lastClickedGnome = null;
					inputState.lastClickTime = 0;

					// Start tile selection drag
					// Always start selection drag, even on air (to allow drag-selecting)
					const addToSelection = e.shiftKey;
					inputState.isSelecting = true;
					inputState.isAddingToSelection = addToSelection;
					inputState.selectionStart = tile;

					// Check if tile is solid (not air)
					const entityId = state.tileGrid[tile.y]?.[tile.x];
					const tileData = entityId ? state.tiles.get(entityId) : null;
					const isSolidTile = tileData && tileData.type !== TileType.Air;

					if (isSolidTile) {
						// Clicked on solid tile - select it
						emitCommand(selectTiles([tile], addToSelection));
					} else if (!addToSelection) {
						// Clicked on air without Shift - clear all selection but allow drag to start
						emitCommand(clearSelection());
					}
					// If Shift+click on air, do nothing (keep existing selection, allow drag)
				}
			}
		} else if (e.button === 1) {
			// Middle click - start camera drag
			inputState.isDragging = true;
			inputState.dragStartX = x;
			inputState.dragStartY = y;
		}
		// Note: Right click (button === 2) reserved for future context menu

		inputState.lastMouseX = x;
		inputState.lastMouseY = y;
	}

	function onMouseMove(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (inputState.isDragging) {
			// Pan camera
			const dx = inputState.lastMouseX - x;
			const dy = inputState.lastMouseY - y;
			emitCommand(panCamera(dx, dy));
		} else if (inputState.isSelecting && inputState.selectionStart) {
			// Update selection rectangle
			const renderer = getRenderer();
			if (renderer) {
				const state = getState();
				const endTile = screenToTile(renderer, state, x, y);
				const tiles = getTilesInRect(state, inputState.selectionStart, endTile);
				emitCommand(selectTiles(tiles, inputState.isAddingToSelection));
			}
		}

		inputState.lastMouseX = x;
		inputState.lastMouseY = y;
	}

	function onMouseUp(e: MouseEvent) {
		if (inputState.isDragging) {
			inputState.isDragging = false;
		}

		if (inputState.isSelecting) {
			inputState.isSelecting = false;
			inputState.isAddingToSelection = false;
			inputState.selectionStart = null;
		}
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const rect = canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;
		const delta = e.deltaY > 0 ? -0.15 : 0.15;
		emitCommand(zoomCamera(delta, mouseX, mouseY, rect.width, rect.height));
	}

	function onKeyDown(e: KeyboardEvent) {
		// Check for modifier keys
		if (e.ctrlKey || e.metaKey || e.altKey) return;

		switch (e.key.toLowerCase()) {
			case 'd': {
				// Dig or cancel dig selected tiles
				const state = getState();
				if (state.selectedTiles.length > 0) {
					// Check if all selected tiles have dig tasks
					let allHaveDigTask = true;
					for (const coord of state.selectedTiles) {
						let hasTask = false;
						for (const task of state.tasks.values()) {
							if (task.targetX === coord.x && task.targetY === coord.y) {
								hasTask = true;
								break;
							}
						}
						if (!hasTask) {
							allHaveDigTask = false;
							break;
						}
					}

					if (allHaveDigTask) {
						emitCommand(cancelDig(state.selectedTiles));
					} else {
						emitCommand(dig(state.selectedTiles));
					}
				}
				break;
			}

			case ' ':
				// Toggle pause
				e.preventDefault();
				emitCommand(togglePause());
				break;

			case '1':
			case '2':
			case '3':
			case '4': {
				// Map number keys to available speeds (1 = first speed, 2 = second, etc.)
				const speedIndex = parseInt(e.key) - 1;
				const speed = AVAILABLE_SPEEDS[speedIndex];
				if (speed !== undefined) {
					emitCommand(setSpeed(speed));
				}
				break;
			}

			case 'escape':
				// Clear selection
				emitCommand(clearSelection());
				break;

			// Camera pan with arrow keys - track key state for smooth movement
			// TODO: Future - Add WASD support as user-configurable option
			// This would require remapping 'D' (dig) to another key or using a modifier
			case 'arrowup':
			case 'arrowdown':
			case 'arrowleft':
			case 'arrowright':
				e.preventDefault();
				inputState.keysPressed.add(e.key.toLowerCase());
				break;
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		const key = e.key.toLowerCase();
		inputState.keysPressed.delete(key);
	}

	/**
	 * Process continuous input - call every frame for smooth camera movement.
	 */
	function update() {
		let dx = 0;
		let dy = 0;

		if (inputState.keysPressed.has('arrowup')) {
			dy -= PAN_SPEED;
		}
		if (inputState.keysPressed.has('arrowdown')) {
			dy += PAN_SPEED;
		}
		if (inputState.keysPressed.has('arrowleft')) {
			dx -= PAN_SPEED;
		}
		if (inputState.keysPressed.has('arrowright')) {
			dx += PAN_SPEED;
		}

		if (dx !== 0 || dy !== 0) {
			emitCommand(panCamera(dx, dy));
		}
	}

	// Prevent context menu on right-click
	function onContextMenu(e: MouseEvent) {
		e.preventDefault();
	}

	// Add event listeners
	canvas.addEventListener('mousedown', onMouseDown);
	window.addEventListener('mousemove', onMouseMove);
	window.addEventListener('mouseup', onMouseUp);
	canvas.addEventListener('wheel', onWheel, { passive: false });
	canvas.addEventListener('contextmenu', onContextMenu);
	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);

	return {
		onMouseDown,
		onMouseMove,
		onMouseUp,
		onWheel,
		onKeyDown,
		onKeyUp,
		update,
		cleanup: () => {
			canvas.removeEventListener('mousedown', onMouseDown);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
			canvas.removeEventListener('wheel', onWheel);
			canvas.removeEventListener('contextmenu', onContextMenu);
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
		}
	};
}

/**
 * Get all tiles in a rectangular selection.
 * Excludes air tiles.
 */
function getTilesInRect(
	state: GameState,
	start: { x: number; y: number },
	end: { x: number; y: number }
): { x: number; y: number }[] {
	const minX = Math.min(start.x, end.x);
	const maxX = Math.max(start.x, end.x);
	const minY = Math.min(start.y, end.y);
	const maxY = Math.max(start.y, end.y);

	const tiles: { x: number; y: number }[] = [];
	for (let y = minY; y <= maxY; y++) {
		for (let x = minX; x <= maxX; x++) {
			// Check if tile is not air
			const entityId = state.tileGrid[y]?.[x];
			if (entityId !== null && entityId !== undefined) {
				const tile = state.tiles.get(entityId);
				if (tile && tile.type !== TileType.Air) {
					tiles.push({ x, y });
				}
			}
		}
	}

	return tiles;
}

/**
 * Find a gnome at the given tile position.
 * Returns the gnome entity ID if found, null otherwise.
 */
function findGnomeAtTile(state: GameState, tileX: number, tileY: number): Entity | null {
	for (const [entity, position] of state.positions) {
		// Check if this entity is a gnome
		if (!state.gnomes.has(entity)) continue;

		// Check if gnome is at this tile (accounting for floating-point positions)
		const gnomeTileX = Math.floor(position.x);
		const gnomeTileY = Math.floor(position.y);

		if (gnomeTileX === tileX && gnomeTileY === tileY) {
			return entity;
		}
	}
	return null;
}

/**
 * Find all gnomes visible within the given bounds.
 */
function findVisibleGnomes(
	state: GameState,
	bounds: { minX: number; maxX: number; minY: number; maxY: number }
): Entity[] {
	const visibleGnomes: Entity[] = [];

	for (const [entity, position] of state.positions) {
		// Check if this entity is a gnome
		if (!state.gnomes.has(entity)) continue;

		// Check if gnome is within visible bounds
		const gnomeTileX = Math.floor(position.x);
		const gnomeTileY = Math.floor(position.y);

		if (
			gnomeTileX >= bounds.minX &&
			gnomeTileX <= bounds.maxX &&
			gnomeTileY >= bounds.minY &&
			gnomeTileY <= bounds.maxY
		) {
			visibleGnomes.push(entity);
		}
	}

	return visibleGnomes;
}
