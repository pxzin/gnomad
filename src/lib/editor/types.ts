/**
 * TypeScript types for the Pixel Art Editor
 */

// ============================================================================
// Asset Format Types
// ============================================================================

/**
 * Single pixel in sparse format.
 * Only non-transparent pixels are stored.
 */
export interface Pixel {
	/** X coordinate (0 = left edge) */
	x: number;
	/** Y coordinate (0 = top edge) */
	y: number;
	/** Hex color: "#RRGGBB" or "#RRGGBBAA" */
	color: string;
}

/**
 * Animation info for sprite sheets.
 */
export interface AnimationMetadata {
	/** Width of each frame in pixels */
	frameWidth: number;
	/** Height of each frame in pixels */
	frameHeight: number;
	/** Number of frames in the animation */
	frameCount: number;
	/** Playback speed in frames per second */
	fps: number;
}

/**
 * Predefined canvas sizes for game assets.
 */
export type AssetPreset =
	| 'tile-16'
	| 'tile-32'
	| 'gnome-idle'
	| 'gnome-walk'
	| 'gnome-dig'
	| 'gnome-climb'
	| 'structure-wall'
	| 'structure-door'
	| 'structure-ladder'
	| 'ui-button'
	| 'ui-icon'
	| 'resource-item'
	| 'tree'
	| 'bush'
	| 'custom';

/**
 * Asset category for organization.
 */
export type AssetCategory = 'tiles' | 'gnomes' | 'structures' | 'ui' | 'resources' | 'vegetation';

/**
 * Preset configuration with dimensions and metadata.
 */
export interface PresetConfig {
	name: AssetPreset;
	width: number;
	height: number;
	category: AssetCategory;
	description: string;
	animation?: {
		frameWidth: number;
		frameHeight: number;
		frameCount: number;
	};
}

/**
 * JSON-serializable pixel art asset format.
 * Designed to be human-readable and AI-writable.
 */
export interface PixelArtAsset {
	/** Asset identifier (filename without extension) */
	name: string;
	/** Format version for future migrations */
	version: 1;
	/** Preset used to create this asset */
	preset: AssetPreset;
	/** Canvas width in pixels */
	width: number;
	/** Canvas height in pixels */
	height: number;
	/** Optional color palette for reference */
	palette?: string[];
	/** Pixel data - sparse format (only non-transparent pixels) */
	pixels: Pixel[];
	/** Animation metadata for sprite sheets */
	animation?: AnimationMetadata;
}

// ============================================================================
// Editor State Types
// ============================================================================

/**
 * Available drawing tools.
 */
export type EditorTool = 'pencil' | 'eraser' | 'fill' | 'picker';

/**
 * Complete editor application state.
 */
export interface EditorState {
	/** Current document being edited */
	asset: PixelArtAsset | null;
	/** Whether asset has unsaved changes */
	isDirty: boolean;
	/** Currently selected drawing tool */
	currentTool: EditorTool;
	/** Current drawing color (hex) */
	currentColor: string;
	/** Secondary color for swap */
	secondaryColor: string;
	/** Display zoom multiplier */
	zoom: number;
	/** Whether to show pixel grid overlay */
	showGrid: boolean;
	/** Whether to show PixiJS preview panel */
	showPreview: boolean;
	/** Undo history stack */
	undoStack: PixelArtAsset[];
	/** Redo history stack */
	redoStack: PixelArtAsset[];
	/** Maximum undo history size */
	maxHistory: number;
	/** File handle for JSON (File System Access API) */
	jsonFileHandle: FileSystemFileHandle | null;
	/** File handle for PNG export */
	pngFileHandle: FileSystemFileHandle | null;
}

// ============================================================================
// Tool Types
// ============================================================================

/**
 * Context passed to tools during operations.
 */
export interface ToolContext {
	/** Current asset */
	asset: PixelArtAsset;
	/** Current drawing color */
	color: string;
	/** Callback to set a pixel */
	setPixel(x: number, y: number, color: string): void;
	/** Callback to clear a pixel (make transparent) */
	clearPixel(x: number, y: number): void;
	/** Callback to get pixel color */
	getPixel(x: number, y: number): string | null;
	/** Callback to set current color (for picker) */
	setCurrentColor(color: string): void;
	/** Callback to trigger canvas redraw */
	redraw(): void;
	/** Callback to push undo state */
	pushUndo(): void;
}

/**
 * Tool behavior interface.
 */
export interface Tool {
	/** Tool identifier */
	name: EditorTool;
	/** Cursor style when tool is active */
	cursor: string;
	/** Handle mouse down on canvas */
	onMouseDown(ctx: ToolContext, x: number, y: number): void;
	/** Handle mouse move while drawing */
	onMouseMove(ctx: ToolContext, x: number, y: number): void;
	/** Handle mouse up */
	onMouseUp(ctx: ToolContext): void;
}

// ============================================================================
// Color Types
// ============================================================================

/**
 * RGBA color representation.
 */
export interface RGBAColor {
	r: number; // 0-255
	g: number; // 0-255
	b: number; // 0-255
	a: number; // 0-255
}

// ============================================================================
// Constants
// ============================================================================

export const EDITOR_CONSTANTS = {
	MIN_ZOOM: 1,
	MAX_ZOOM: 32,
	DEFAULT_ZOOM: 8,
	MAX_CANVAS_SIZE: 128,
	MAX_UNDO_HISTORY: 50,
	GRID_COLOR: '#444444',
	TRANSPARENT_PATTERN_LIGHT: '#cccccc',
	TRANSPARENT_PATTERN_DARK: '#999999'
} as const;

export const DEFAULT_PALETTE = [
	'#000000', // Black
	'#FFFFFF', // White
	'#8B4513', // Dirt brown
	'#A0522D', // Sienna
	'#808080', // Stone gray
	'#228B22', // Forest green
	'#87CEEB', // Sky blue
	'#FFD700', // Gold
	'#CD853F', // Peru/copper
	'#00FF00' // Bright green (gnome)
] as const;

export const DEFAULT_EDITOR_STATE: EditorState = {
	asset: null,
	isDirty: false,
	currentTool: 'pencil',
	currentColor: '#000000',
	secondaryColor: '#FFFFFF',
	zoom: EDITOR_CONSTANTS.DEFAULT_ZOOM,
	showGrid: true,
	showPreview: true,
	undoStack: [],
	redoStack: [],
	maxHistory: EDITOR_CONSTANTS.MAX_UNDO_HISTORY,
	jsonFileHandle: null,
	pngFileHandle: null
};
