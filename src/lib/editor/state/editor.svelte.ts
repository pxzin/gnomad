/**
 * Editor state store using Svelte 5 runes
 */

import type { PixelArtAssetV2, EditorTool, EditorState, Layer, Pixel } from '../types.js';
import { DEFAULT_EDITOR_STATE, DEFAULT_TIMELINE, DEFAULT_ONION_SKIN, EDITOR_CONSTANTS, LAYER_WARNING_THRESHOLD } from '../types.js';
import { readClipboardImage, imageToPixels, extractPaletteColors } from '../clipboard/paste.js';
import { flattenToPixels } from '../canvas/composite.js';

/**
 * Editor store interface
 */
export interface EditorStore {
	/** Readonly reactive state */
	readonly state: EditorState;

	// Asset operations
	newAsset(asset: PixelArtAssetV2): void;
	loadAsset(asset: PixelArtAssetV2): void;
	updateAsset(asset: PixelArtAssetV2): void;
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

	// Clipboard operations
	pasteFromClipboard(): Promise<boolean>;

	// Layer operations
	addLayer(name?: string): void;
	deleteLayer(layerId: string): void;
	selectLayer(layerId: string): void;
	renameLayer(layerId: string, name: string): void;
	setLayerVisibility(layerId: string, visible: boolean): void;
	setLayerOpacity(layerId: string, opacity: number): void;
	reorderLayer(layerId: string, newIndex: number): void;
	mergeLayerDown(layerId: string): void;
	flattenAllLayers(): void;
	duplicateLayer(layerId: string): void;

	// Frame operations
	addFrame(): void;
	deleteFrame(frameIndex: number): void;
	duplicateFrame(frameIndex: number): void;
	selectFrame(frameIndex: number): void;
	reorderFrame(fromIndex: number, toIndex: number): void;

	// Animation operations
	enableAnimation(): void;
	setFps(fps: number): void;
	togglePlay(): void;
	play(): void;
	stop(): void;

	// Onion skin operations
	toggleOnionSkin(): void;
	setOnionSkinPreviousOpacity(opacity: number): void;
	setOnionSkinNextOpacity(opacity: number): void;
	toggleOnionSkinPrevious(): void;
	toggleOnionSkinNext(): void;
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
		newAsset(asset: PixelArtAssetV2) {
			state.asset = asset;
			state.isDirty = false;
			state.undoStack = [];
			state.redoStack = [];
			state.jsonFileHandle = null;
			state.pngFileHandle = null;
			// Set active layer to first layer
			state.activeLayerId = asset.layers[0]?.id ?? null;
			state.currentFrame = 0;
			state.timeline = { ...DEFAULT_TIMELINE };
			state.onionSkin = { ...DEFAULT_ONION_SKIN };
		},

		loadAsset(asset: PixelArtAssetV2) {
			state.asset = asset;
			state.isDirty = false;
			state.undoStack = [];
			state.redoStack = [];
			// Set active layer to first layer
			state.activeLayerId = asset.layers[0]?.id ?? null;
			state.currentFrame = 0;
			// Set timeline fps from asset if available
			state.timeline = {
				...DEFAULT_TIMELINE,
				fps: asset.animation?.fps ?? DEFAULT_TIMELINE.fps
			};
			state.onionSkin = { ...DEFAULT_ONION_SKIN };
		},

		updateAsset(asset: PixelArtAssetV2) {
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
		},

		// Clipboard operations
		async pasteFromClipboard(): Promise<boolean> {
			if (!state.asset) return false;

			// Read image from clipboard
			const image = await readClipboardImage();
			if (!image) return false;

			// Push undo state before making changes
			this.pushUndo();

			// Convert image to pixels, cropping to canvas size
			const pixels = imageToPixels(image, state.asset.width, state.asset.height);
			if (pixels.length === 0) return false;

			// Create a new layer for the pasted content
			const newLayerId = crypto.randomUUID();
			const frameCount = state.asset.layers[0]?.frames.length ?? 1;

			// Create frames array - paste goes on current frame only, others are empty
			const frames: Pixel[][] = [];
			for (let i = 0; i < frameCount; i++) {
				frames.push(i === state.currentFrame ? pixels : []);
			}

			const newLayer: Layer = {
				id: newLayerId,
				name: `Pasted Layer ${state.asset.layers.length + 1}`,
				visible: true,
				opacity: 1.0,
				frames
			};

			// Add layer on top of existing layers
			const newLayers = [...state.asset.layers, newLayer];

			// Extract colors for palette update (optional)
			const newColors = extractPaletteColors(pixels, 8);
			const existingPalette = state.asset.palette ?? [];
			const combinedPalette = [...new Set([...existingPalette, ...newColors])].slice(0, 32);

			// Update asset
			state.asset = {
				...state.asset,
				layers: newLayers,
				palette: combinedPalette
			};

			// Select the new layer
			state.activeLayerId = newLayerId;
			state.isDirty = true;

			return true;
		},

		// Layer operations
		addLayer(name?: string) {
			if (!state.asset) return;

			// Warn if adding many layers
			if (state.asset.layers.length >= LAYER_WARNING_THRESHOLD) {
				console.warn(`You have ${state.asset.layers.length} layers. Consider merging or flattening for better performance.`);
			}

			this.pushUndo();

			const newLayerId = crypto.randomUUID();
			const frameCount = state.asset.layers[0]?.frames.length ?? 1;

			// Create empty frames for the new layer
			const frames: Pixel[][] = [];
			for (let i = 0; i < frameCount; i++) {
				frames.push([]);
			}

			const newLayer: Layer = {
				id: newLayerId,
				name: name ?? `Layer ${state.asset.layers.length + 1}`,
				visible: true,
				opacity: 1.0,
				frames
			};

			// Add layer on top
			state.asset = {
				...state.asset,
				layers: [...state.asset.layers, newLayer]
			};

			state.activeLayerId = newLayerId;
			state.isDirty = true;
		},

		deleteLayer(layerId: string) {
			if (!state.asset) return;

			// Prevent deleting the last layer
			if (state.asset.layers.length <= 1) {
				console.warn('Cannot delete the last layer');
				return;
			}

			this.pushUndo();

			const layerIndex = state.asset.layers.findIndex(l => l.id === layerId);
			if (layerIndex === -1) return;

			const newLayers = state.asset.layers.filter(l => l.id !== layerId);
			state.asset = {
				...state.asset,
				layers: newLayers
			};

			// If deleted layer was active, select another
			if (state.activeLayerId === layerId) {
				const newActiveIndex = Math.min(layerIndex, newLayers.length - 1);
				state.activeLayerId = newLayers[newActiveIndex]?.id ?? null;
			}

			state.isDirty = true;
		},

		selectLayer(layerId: string) {
			if (!state.asset) return;
			const layer = state.asset.layers.find(l => l.id === layerId);
			if (layer) {
				state.activeLayerId = layerId;
			}
		},

		renameLayer(layerId: string, name: string) {
			if (!state.asset) return;

			const layerIndex = state.asset.layers.findIndex(l => l.id === layerId);
			if (layerIndex === -1) return;

			this.pushUndo();

			const newLayers = [...state.asset.layers];
			const layer = newLayers[layerIndex];
			if (layer) {
				newLayers[layerIndex] = { ...layer, name };
			}

			state.asset = {
				...state.asset,
				layers: newLayers
			};
			state.isDirty = true;
		},

		setLayerVisibility(layerId: string, visible: boolean) {
			if (!state.asset) return;

			const layerIndex = state.asset.layers.findIndex(l => l.id === layerId);
			if (layerIndex === -1) return;

			const newLayers = [...state.asset.layers];
			const layer = newLayers[layerIndex];
			if (layer) {
				newLayers[layerIndex] = { ...layer, visible };
			}

			state.asset = {
				...state.asset,
				layers: newLayers
			};
			state.isDirty = true;
		},

		setLayerOpacity(layerId: string, opacity: number) {
			if (!state.asset) return;

			const layerIndex = state.asset.layers.findIndex(l => l.id === layerId);
			if (layerIndex === -1) return;

			// Clamp opacity to 0-1 range
			const clampedOpacity = Math.max(0, Math.min(1, opacity));

			const newLayers = [...state.asset.layers];
			const layer = newLayers[layerIndex];
			if (layer) {
				newLayers[layerIndex] = { ...layer, opacity: clampedOpacity };
			}

			state.asset = {
				...state.asset,
				layers: newLayers
			};
			state.isDirty = true;
		},

		reorderLayer(layerId: string, newIndex: number) {
			if (!state.asset) return;

			const layers = state.asset.layers;
			const currentIndex = layers.findIndex(l => l.id === layerId);
			if (currentIndex === -1) return;

			// Clamp new index to valid range
			const clampedIndex = Math.max(0, Math.min(layers.length - 1, newIndex));
			if (currentIndex === clampedIndex) return;

			this.pushUndo();

			const newLayers = [...layers];
			const [removed] = newLayers.splice(currentIndex, 1);
			if (removed) {
				newLayers.splice(clampedIndex, 0, removed);
			}

			state.asset = {
				...state.asset,
				layers: newLayers
			};
			state.isDirty = true;
		},

		mergeLayerDown(layerId: string) {
			if (!state.asset) return;

			const layers = state.asset.layers;
			const layerIndex = layers.findIndex(l => l.id === layerId);

			// Cannot merge the bottom layer
			if (layerIndex <= 0) {
				console.warn('Cannot merge the bottom layer');
				return;
			}

			const topLayer = layers[layerIndex];
			const bottomLayer = layers[layerIndex - 1];
			if (!topLayer || !bottomLayer) return;

			this.pushUndo();

			// Merge frames: top layer pixels on top of bottom layer pixels
			const mergedFrames: Pixel[][] = [];
			const frameCount = Math.max(topLayer.frames.length, bottomLayer.frames.length);

			for (let i = 0; i < frameCount; i++) {
				const bottomPixels = bottomLayer.frames[i] ?? [];
				const topPixels = topLayer.frames[i] ?? [];

				// Create a pixel map from bottom layer
				const pixelMap = new Map<string, Pixel>();
				for (const pixel of bottomPixels) {
					pixelMap.set(`${pixel.x},${pixel.y}`, pixel);
				}

				// Overlay top layer pixels (with opacity blending)
				for (const pixel of topPixels) {
					// For simplicity, just replace (proper alpha blending would be more complex)
					pixelMap.set(`${pixel.x},${pixel.y}`, pixel);
				}

				mergedFrames.push(Array.from(pixelMap.values()));
			}

			// Create merged layer
			const mergedLayer: Layer = {
				...bottomLayer,
				frames: mergedFrames
			};

			// Remove top layer, update bottom layer
			const newLayers = layers.filter((_, i) => i !== layerIndex);
			newLayers[layerIndex - 1] = mergedLayer;

			state.asset = {
				...state.asset,
				layers: newLayers
			};

			// Select the merged layer
			state.activeLayerId = mergedLayer.id;
			state.isDirty = true;
		},

		flattenAllLayers() {
			if (!state.asset) return;
			if (state.asset.layers.length <= 1) return;

			this.pushUndo();

			const frameCount = state.asset.layers[0]?.frames.length ?? 1;
			const flattenedFrames: Pixel[][] = [];

			// Flatten each frame
			for (let i = 0; i < frameCount; i++) {
				const pixels = flattenToPixels(
					state.asset.layers,
					i,
					state.asset.width,
					state.asset.height
				);
				flattenedFrames.push(pixels);
			}

			const flattenedLayer: Layer = {
				id: crypto.randomUUID(),
				name: 'Flattened',
				visible: true,
				opacity: 1.0,
				frames: flattenedFrames
			};

			state.asset = {
				...state.asset,
				layers: [flattenedLayer]
			};

			state.activeLayerId = flattenedLayer.id;
			state.isDirty = true;
		},

		duplicateLayer(layerId: string) {
			if (!state.asset) return;

			const layer = state.asset.layers.find(l => l.id === layerId);
			if (!layer) return;

			// Warn if adding many layers
			if (state.asset.layers.length >= LAYER_WARNING_THRESHOLD) {
				console.warn(`You have ${state.asset.layers.length} layers. Consider merging or flattening for better performance.`);
			}

			this.pushUndo();

			const newLayerId = crypto.randomUUID();
			const duplicatedLayer: Layer = {
				...layer,
				id: newLayerId,
				name: `${layer.name} copy`,
				frames: layer.frames.map(frame => [...frame])
			};

			// Insert duplicate above original
			const layerIndex = state.asset.layers.findIndex(l => l.id === layerId);
			const newLayers = [...state.asset.layers];
			newLayers.splice(layerIndex + 1, 0, duplicatedLayer);

			state.asset = {
				...state.asset,
				layers: newLayers
			};

			state.activeLayerId = newLayerId;
			state.isDirty = true;
		},

		// Frame operations
		addFrame() {
			if (!state.asset) return;

			this.pushUndo();

			// Add empty frame to each layer
			const newLayers = state.asset.layers.map(layer => ({
				...layer,
				frames: [...layer.frames, []]
			}));

			// Enable animation mode if not already
			const animation = state.asset.animation ?? { fps: state.timeline.fps };

			state.asset = {
				...state.asset,
				layers: newLayers,
				animation
			};

			// Select the new frame
			state.currentFrame = newLayers[0]?.frames.length ? newLayers[0].frames.length - 1 : 0;
			state.isDirty = true;
		},

		deleteFrame(frameIndex: number) {
			if (!state.asset) return;

			const frameCount = state.asset.layers[0]?.frames.length ?? 0;

			// Prevent deleting the last frame
			if (frameCount <= 1) {
				console.warn('Cannot delete the last frame');
				return;
			}

			if (frameIndex < 0 || frameIndex >= frameCount) return;

			this.pushUndo();

			// Remove frame from each layer
			const newLayers = state.asset.layers.map(layer => ({
				...layer,
				frames: layer.frames.filter((_, i) => i !== frameIndex)
			}));

			state.asset = {
				...state.asset,
				layers: newLayers
			};

			// Adjust current frame if needed
			const newFrameCount = newLayers[0]?.frames.length ?? 0;
			if (state.currentFrame >= newFrameCount) {
				state.currentFrame = Math.max(0, newFrameCount - 1);
			}

			state.isDirty = true;
		},

		duplicateFrame(frameIndex: number) {
			if (!state.asset) return;

			const frameCount = state.asset.layers[0]?.frames.length ?? 0;
			if (frameIndex < 0 || frameIndex >= frameCount) return;

			this.pushUndo();

			// Duplicate frame in each layer
			const newLayers = state.asset.layers.map(layer => {
				const frame = layer.frames[frameIndex];
				const newFrames = [...layer.frames];
				newFrames.splice(frameIndex + 1, 0, frame ? [...frame] : []);
				return { ...layer, frames: newFrames };
			});

			state.asset = {
				...state.asset,
				layers: newLayers
			};

			// Select the duplicated frame
			state.currentFrame = frameIndex + 1;
			state.isDirty = true;
		},

		selectFrame(frameIndex: number) {
			if (!state.asset) return;

			const frameCount = state.asset.layers[0]?.frames.length ?? 0;
			if (frameIndex < 0 || frameIndex >= frameCount) return;

			state.currentFrame = frameIndex;
		},

		reorderFrame(fromIndex: number, toIndex: number) {
			if (!state.asset) return;

			const frameCount = state.asset.layers[0]?.frames.length ?? 0;
			if (fromIndex < 0 || fromIndex >= frameCount) return;
			if (toIndex < 0 || toIndex >= frameCount) return;
			if (fromIndex === toIndex) return;

			this.pushUndo();

			// Reorder frame in each layer
			const newLayers = state.asset.layers.map(layer => {
				const newFrames = [...layer.frames];
				const [removed] = newFrames.splice(fromIndex, 1);
				if (removed) {
					newFrames.splice(toIndex, 0, removed);
				}
				return { ...layer, frames: newFrames };
			});

			state.asset = {
				...state.asset,
				layers: newLayers
			};

			// Update current frame to follow the moved frame
			if (state.currentFrame === fromIndex) {
				state.currentFrame = toIndex;
			} else if (fromIndex < state.currentFrame && toIndex >= state.currentFrame) {
				state.currentFrame--;
			} else if (fromIndex > state.currentFrame && toIndex <= state.currentFrame) {
				state.currentFrame++;
			}

			state.isDirty = true;
		},

		// Animation operations
		enableAnimation() {
			if (!state.asset) return;
			if (state.asset.animation) return; // Already enabled

			this.pushUndo();

			state.asset = {
				...state.asset,
				animation: { fps: state.timeline.fps }
			};

			state.isDirty = true;
		},

		setFps(fps: number) {
			// Clamp fps to valid range
			const clampedFps = Math.max(1, Math.min(30, fps));
			state.timeline = { ...state.timeline, fps: clampedFps };

			// Update asset animation settings if animation mode is enabled
			if (state.asset?.animation) {
				state.asset = {
					...state.asset,
					animation: { ...state.asset.animation, fps: clampedFps }
				};
				state.isDirty = true;
			}
		},

		togglePlay() {
			state.timeline = { ...state.timeline, playing: !state.timeline.playing };
		},

		play() {
			state.timeline = { ...state.timeline, playing: true };
		},

		stop() {
			state.timeline = { ...state.timeline, playing: false };
		},

		// Onion skin operations
		toggleOnionSkin() {
			state.onionSkin = {
				...state.onionSkin,
				enabled: !state.onionSkin.enabled
			};
		},

		setOnionSkinPreviousOpacity(opacity: number) {
			const clampedOpacity = Math.max(0, Math.min(1, opacity));
			state.onionSkin = {
				...state.onionSkin,
				previousOpacity: clampedOpacity
			};
		},

		setOnionSkinNextOpacity(opacity: number) {
			const clampedOpacity = Math.max(0, Math.min(1, opacity));
			state.onionSkin = {
				...state.onionSkin,
				nextOpacity: clampedOpacity
			};
		},

		toggleOnionSkinPrevious() {
			state.onionSkin = {
				...state.onionSkin,
				showPrevious: !state.onionSkin.showPrevious
			};
		},

		toggleOnionSkinNext() {
			state.onionSkin = {
				...state.onionSkin,
				showNext: !state.onionSkin.showNext
			};
		}
	};
}
