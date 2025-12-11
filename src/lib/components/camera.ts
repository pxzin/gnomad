/**
 * Camera Component
 *
 * Viewport camera state for rendering.
 */

/**
 * Camera state data.
 */
export interface Camera {
	/** Center position X in world pixels */
	x: number;
	/** Center position Y in world pixels */
	y: number;
	/** Zoom level (1.0 = 100%, 0.5 = 50%, 2.0 = 200%) */
	zoom: number;
	/** Target X for smooth pan interpolation */
	targetX: number;
	/** Target Y for smooth pan interpolation */
	targetY: number;
}

/**
 * Create a new Camera with default settings.
 */
export function createCamera(x: number = 0, y: number = 0): Camera {
	return {
		x,
		y,
		zoom: 1.0,
		targetX: x,
		targetY: y
	};
}

/**
 * Camera zoom limits.
 */
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4.0;

/**
 * Camera interpolation speed (0-1, higher = faster).
 */
export const CAMERA_LERP_SPEED = 0.1;
