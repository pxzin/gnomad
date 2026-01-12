/**
 * Rendering Configuration
 *
 * Centralized constants for tile and sprite rendering.
 * All visual size calculations should use these values.
 */

/** Tile dimensions in pixels */
export const TILE_SIZE = 32;

/** Sprite dimensions in pixels */
export const SPRITE_WIDTH = 32;
export const SPRITE_HEIGHT = 48;

/** Background dimming factor (0.0 = black, 1.0 = full bright) */
export const BACKGROUND_DIM_FACTOR = 0.6;

/** Supported zoom levels for pixel-perfect rendering */
export const ZOOM_LEVELS = [1, 2, 3, 4] as const;
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

/** Default zoom level */
export const DEFAULT_ZOOM = 2;

/**
 * Calculate tint value for background dimming.
 * Returns a hex color for PixiJS tint property.
 */
export function getBackgroundTint(): number {
	const tintValue = Math.floor(BACKGROUND_DIM_FACTOR * 255);
	return (tintValue << 16) | (tintValue << 8) | tintValue;
}
