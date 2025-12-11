/**
 * Input Handler
 *
 * Handles mouse and keyboard input and converts to game commands.
 */

import type { Renderer } from '$lib/render/renderer';
import { screenToTile } from '$lib/render/renderer';
import type { GameState } from '$lib/game/state';
import type { Command } from '$lib/game/commands';
import {
	selectTiles,
	dig,
	panCamera,
	zoomCamera,
	setSpeed,
	togglePause
} from '$lib/game/commands';

/**
 * Input state for tracking drag operations.
 */
export interface InputState {
	isDragging: boolean;
	isSelecting: boolean;
	dragStartX: number;
	dragStartY: number;
	lastMouseX: number;
	lastMouseY: number;
	selectionStart: { x: number; y: number } | null;
}

/**
 * Create initial input state.
 */
export function createInputState(): InputState {
	return {
		isDragging: false,
		isSelecting: false,
		dragStartX: 0,
		dragStartY: 0,
		lastMouseX: 0,
		lastMouseY: 0,
		selectionStart: null
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
			// Left click - start selection
			const renderer = getRenderer();
			if (renderer) {
				const tile = screenToTile(renderer, getState(), x, y);
				inputState.isSelecting = true;
				inputState.selectionStart = tile;
				emitCommand(selectTiles([tile]));
			}
		} else if (e.button === 1 || e.button === 2) {
			// Middle or right click - start drag
			inputState.isDragging = true;
			inputState.dragStartX = x;
			inputState.dragStartY = y;
		}

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
				const endTile = screenToTile(renderer, getState(), x, y);
				const tiles = getTilesInRect(inputState.selectionStart, endTile);
				emitCommand(selectTiles(tiles));
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
			inputState.selectionStart = null;
		}
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const delta = e.deltaY > 0 ? -0.1 : 0.1;
		emitCommand(zoomCamera(delta));
	}

	function onKeyDown(e: KeyboardEvent) {
		// Check for modifier keys
		if (e.ctrlKey || e.metaKey || e.altKey) return;

		switch (e.key.toLowerCase()) {
			case 'd':
				// Dig selected tiles
				const state = getState();
				if (state.selectedTiles.length > 0) {
					emitCommand(dig(state.selectedTiles));
				}
				break;

			case ' ':
				// Toggle pause
				e.preventDefault();
				emitCommand(togglePause());
				break;

			case '1':
				emitCommand(setSpeed(0.5));
				break;

			case '2':
				emitCommand(setSpeed(1));
				break;

			case '3':
				emitCommand(setSpeed(2));
				break;

			case 'escape':
				// Clear selection
				emitCommand(selectTiles([]));
				break;
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

	return {
		onMouseDown,
		onMouseMove,
		onMouseUp,
		onWheel,
		onKeyDown,
		cleanup: () => {
			canvas.removeEventListener('mousedown', onMouseDown);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
			canvas.removeEventListener('wheel', onWheel);
			canvas.removeEventListener('contextmenu', onContextMenu);
			window.removeEventListener('keydown', onKeyDown);
		}
	};
}

/**
 * Get all tiles in a rectangular selection.
 */
function getTilesInRect(
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
			tiles.push({ x, y });
		}
	}

	return tiles;
}
