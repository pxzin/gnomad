/**
 * Editor state store using Svelte 5 runes
 */

import type { PixelArtAsset, EditorTool, EditorState } from '../types.js';
import { DEFAULT_EDITOR_STATE, EDITOR_CONSTANTS } from '../types.js';

/**
 * Editor store interface
 */
export interface EditorStore {
	/** Readonly reactive state */
	readonly state: EditorState;

	// Asset operations
	newAsset(asset: PixelArtAsset): void;
	loadAsset(asset: PixelArtAsset): void;
	updateAsset(asset: PixelArtAsset): void;
	closeAsset(): void;

	// Tool operations
	setTool(tool: EditorTool): void;
	setColor(color: string): void;
	setSecondaryColor(color: string): void;
	swapColors(): void;

	// View operations
	setZoom(zoom: number): void;
	zoomIn(): void;
	zoomOut(): void;
	resetZoom(): void;
	toggleGrid(): void;
	togglePreview(): void;

	// History operations
	pushUndo(): void;
	undo(): void;
	redo(): void;
	canUndo(): boolean;
	canRedo(): boolean;
	clearHistory(): void;

	// Dirty tracking
	markDirty(): void;
	markClean(): void;

	// File handles
	setJsonHandle(handle: FileSystemFileHandle | null): void;
	setPngHandle(handle: FileSystemFileHandle | null): void;
}

/**
 * Create editor state store using Svelte 5 runes.
 */
export function createEditorStore(): EditorStore {
	let state = $state<EditorState>({ ...DEFAULT_EDITOR_STATE });

	return {
		get state() {
			return state;
		},

		// Asset operations
		newAsset(asset: PixelArtAsset) {
			state.asset = asset;
			state.isDirty = false;
			state.undoStack = [];
			state.redoStack = [];
			state.jsonFileHandle = null;
			state.pngFileHandle = null;
		},

		loadAsset(asset: PixelArtAsset) {
			state.asset = asset;
			state.isDirty = false;
			state.undoStack = [];
			state.redoStack = [];
		},

		updateAsset(asset: PixelArtAsset) {
			state.asset = asset;
		},

		closeAsset() {
			state.asset = null;
			state.isDirty = false;
			state.undoStack = [];
			state.redoStack = [];
			state.jsonFileHandle = null;
			state.pngFileHandle = null;
		},

		// Tool operations
		setTool(tool: EditorTool) {
			state.currentTool = tool;
		},

		setColor(color: string) {
			state.currentColor = color;
		},

		setSecondaryColor(color: string) {
			state.secondaryColor = color;
		},

		swapColors() {
			const temp = state.currentColor;
			state.currentColor = state.secondaryColor;
			state.secondaryColor = temp;
		},

		// View operations
		setZoom(zoom: number) {
			state.zoom = Math.max(
				EDITOR_CONSTANTS.MIN_ZOOM,
				Math.min(EDITOR_CONSTANTS.MAX_ZOOM, zoom)
			);
		},

		zoomIn() {
			if (state.zoom < EDITOR_CONSTANTS.MAX_ZOOM) {
				state.zoom = Math.min(state.zoom * 2, EDITOR_CONSTANTS.MAX_ZOOM);
			}
		},

		zoomOut() {
			if (state.zoom > EDITOR_CONSTANTS.MIN_ZOOM) {
				state.zoom = Math.max(state.zoom / 2, EDITOR_CONSTANTS.MIN_ZOOM);
			}
		},

		resetZoom() {
			state.zoom = EDITOR_CONSTANTS.DEFAULT_ZOOM;
		},

		toggleGrid() {
			state.showGrid = !state.showGrid;
		},

		togglePreview() {
			state.showPreview = !state.showPreview;
		},

		// History operations
		pushUndo() {
			if (!state.asset) return;

			// Deep clone the current asset using JSON to avoid Svelte proxy issues
			const snapshot = JSON.parse(JSON.stringify(state.asset));
			state.undoStack = [...state.undoStack, snapshot];

			// Trim history if too long
			if (state.undoStack.length > state.maxHistory) {
				state.undoStack = state.undoStack.slice(-state.maxHistory);
			}

			// Clear redo stack on new action
			state.redoStack = [];
		},

		undo() {
			if (state.undoStack.length === 0 || !state.asset) return;

			// Save current state to redo stack using JSON to avoid Svelte proxy issues
			const currentSnapshot = JSON.parse(JSON.stringify(state.asset));
			state.redoStack = [...state.redoStack, currentSnapshot];

			// Pop from undo stack
			const previousState = state.undoStack[state.undoStack.length - 1];
			if (previousState) {
				state.undoStack = state.undoStack.slice(0, -1);
				state.asset = previousState;
				state.isDirty = true;
			}
		},

		redo() {
			if (state.redoStack.length === 0 || !state.asset) return;

			// Save current state to undo stack using JSON to avoid Svelte proxy issues
			const currentSnapshot = JSON.parse(JSON.stringify(state.asset));
			state.undoStack = [...state.undoStack, currentSnapshot];

			// Pop from redo stack
			const nextState = state.redoStack[state.redoStack.length - 1];
			if (nextState) {
				state.redoStack = state.redoStack.slice(0, -1);
				state.asset = nextState;
				state.isDirty = true;
			}
		},

		canUndo() {
			return state.undoStack.length > 0;
		},

		canRedo() {
			return state.redoStack.length > 0;
		},

		clearHistory() {
			state.undoStack = [];
			state.redoStack = [];
		},

		// Dirty tracking
		markDirty() {
			state.isDirty = true;
		},

		markClean() {
			state.isDirty = false;
		},

		// File handles
		setJsonHandle(handle: FileSystemFileHandle | null) {
			state.jsonFileHandle = handle;
		},

		setPngHandle(handle: FileSystemFileHandle | null) {
			state.pngFileHandle = handle;
		}
	};
}
