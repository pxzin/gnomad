/**
 * Validation utilities for the Pixel Art Editor
 */

import type { PixelArtAsset, PixelArtAssetV2, Pixel, Layer, AnyPixelArtAsset } from '../types.js';
import { EDITOR_CONSTANTS, LAYER_WARNING_THRESHOLD } from '../types.js';
import { isValidHexColor } from './color.js';

/**
 * Validation error codes.
 */
export enum AssetValidationError {
	INVALID_VERSION = 'INVALID_VERSION',
	MISSING_NAME = 'MISSING_NAME',
	INVALID_DIMENSIONS = 'INVALID_DIMENSIONS',
	INVALID_PIXEL_FORMAT = 'INVALID_PIXEL_FORMAT',
	PIXEL_OUT_OF_BOUNDS = 'PIXEL_OUT_OF_BOUNDS',
	INVALID_PRESET = 'INVALID_PRESET',
	INVALID_PALETTE = 'INVALID_PALETTE',
	INVALID_ANIMATION = 'INVALID_ANIMATION',
	INVALID_LAYERS = 'INVALID_LAYERS',
	NO_LAYERS = 'NO_LAYERS',
	LAYER_FRAME_MISMATCH = 'LAYER_FRAME_MISMATCH'
}

/**
 * Check if a value is a valid pixel.
 */
export function isValidPixel(p: unknown): p is Pixel {
	if (typeof p !== 'object' || p === null) return false;
	const pixel = p as Record<string, unknown>;
	return (
		typeof pixel.x === 'number' &&
		typeof pixel.y === 'number' &&
		typeof pixel.color === 'string' &&
		Number.isInteger(pixel.x) &&
		Number.isInteger(pixel.y) &&
		pixel.x >= 0 &&
		pixel.y >= 0 &&
		isValidHexColor(pixel.color)
	);
}

/**
 * Check if a value is a valid layer.
 */
export function isValidLayer(l: unknown, expectedFrameCount?: number): l is Layer {
	if (typeof l !== 'object' || l === null) return false;
	const layer = l as Record<string, unknown>;

	if (typeof layer.id !== 'string' || layer.id.trim() === '') return false;
	if (typeof layer.name !== 'string') return false;
	if (typeof layer.visible !== 'boolean') return false;
	if (typeof layer.opacity !== 'number' || layer.opacity < 0 || layer.opacity > 1) return false;
	if (!Array.isArray(layer.frames)) return false;

	// Check frame count consistency if expected
	if (expectedFrameCount !== undefined && layer.frames.length !== expectedFrameCount) return false;

	// Check each frame is an array of pixels
	for (const frame of layer.frames) {
		if (!Array.isArray(frame)) return false;
		for (const pixel of frame) {
			if (!isValidPixel(pixel)) return false;
		}
	}

	return true;
}

/**
 * Validate PixelArtAsset structure (v1).
 * Returns true if the data is a valid PixelArtAsset.
 */
export function validateAsset(data: unknown): data is PixelArtAsset {
	return validateAssetDetailed(data).length === 0;
}

/**
 * Validate PixelArtAssetV2 structure.
 * Returns true if the data is a valid PixelArtAssetV2.
 */
export function validateAssetV2(data: unknown): data is PixelArtAssetV2 {
	return validateAssetV2Detailed(data).length === 0;
}

/**
 * Validate any asset version.
 */
export function validateAnyAsset(data: unknown): data is AnyPixelArtAsset {
	if (typeof data !== 'object' || data === null) return false;
	const asset = data as Record<string, unknown>;

	if (asset.version === 1) return validateAsset(data);
	if (asset.version === 2) return validateAssetV2(data);
	return false;
}

/**
 * Validate v1 asset and return detailed errors.
 */
export function validateAssetDetailed(data: unknown): AssetValidationError[] {
	const errors: AssetValidationError[] = [];

	if (typeof data !== 'object' || data === null) {
		errors.push(AssetValidationError.INVALID_VERSION);
		return errors;
	}

	const asset = data as Record<string, unknown>;

	// Check version
	if (asset.version !== 1) {
		errors.push(AssetValidationError.INVALID_VERSION);
	}

	// Check name
	if (typeof asset.name !== 'string' || asset.name.trim() === '') {
		errors.push(AssetValidationError.MISSING_NAME);
	}

	// Check dimensions
	if (
		typeof asset.width !== 'number' ||
		typeof asset.height !== 'number' ||
		!Number.isInteger(asset.width) ||
		!Number.isInteger(asset.height) ||
		asset.width <= 0 ||
		asset.height <= 0 ||
		asset.width > EDITOR_CONSTANTS.MAX_CANVAS_SIZE ||
		asset.height > EDITOR_CONSTANTS.MAX_CANVAS_SIZE
	) {
		errors.push(AssetValidationError.INVALID_DIMENSIONS);
	}

	// Check preset
	const validPresets = [
		'tile-16',
		'tile-32',
		'gnome-idle',
		'gnome-walk',
		'gnome-dig',
		'gnome-climb',
		'gnome-fall',
		'gnome-sheet',
		'structure-wall',
		'structure-door',
		'structure-ladder',
		'ui-button',
		'ui-icon',
		'resource-item',
		'tree',
		'bush',
		'custom'
	];
	if (typeof asset.preset !== 'string' || !validPresets.includes(asset.preset)) {
		errors.push(AssetValidationError.INVALID_PRESET);
	}

	// Check pixels array
	if (!Array.isArray(asset.pixels)) {
		errors.push(AssetValidationError.INVALID_PIXEL_FORMAT);
	} else {
		const width = typeof asset.width === 'number' ? asset.width : 0;
		const height = typeof asset.height === 'number' ? asset.height : 0;

		for (const pixel of asset.pixels) {
			if (!isValidPixel(pixel)) {
				errors.push(AssetValidationError.INVALID_PIXEL_FORMAT);
				break;
			}
			if (pixel.x >= width || pixel.y >= height) {
				errors.push(AssetValidationError.PIXEL_OUT_OF_BOUNDS);
				break;
			}
		}
	}

	// Check optional palette
	if (asset.palette !== undefined) {
		if (!Array.isArray(asset.palette)) {
			errors.push(AssetValidationError.INVALID_PALETTE);
		} else {
			for (const color of asset.palette) {
				if (typeof color !== 'string' || !isValidHexColor(color)) {
					errors.push(AssetValidationError.INVALID_PALETTE);
					break;
				}
			}
		}
	}

	// Check optional animation
	if (asset.animation !== undefined) {
		const anim = asset.animation as Record<string, unknown>;
		if (
			typeof anim !== 'object' ||
			anim === null ||
			typeof anim.frameWidth !== 'number' ||
			typeof anim.frameHeight !== 'number' ||
			typeof anim.frameCount !== 'number' ||
			typeof anim.fps !== 'number' ||
			anim.frameWidth <= 0 ||
			anim.frameHeight <= 0 ||
			anim.frameCount <= 0 ||
			anim.fps <= 0
		) {
			errors.push(AssetValidationError.INVALID_ANIMATION);
		}
	}

	return errors;
}

/**
 * Valid preset values.
 */
const VALID_PRESETS = [
	'tile-16',
	'tile-32',
	'gnome-idle',
	'gnome-walk',
	'gnome-dig',
	'gnome-climb',
	'gnome-fall',
	'gnome-sheet',
	'structure-wall',
	'structure-door',
	'structure-ladder',
	'ui-button',
	'ui-icon',
	'resource-item',
	'tree',
	'bush',
	'custom'
];

/**
 * Validate v2 asset and return detailed errors.
 */
export function validateAssetV2Detailed(data: unknown): AssetValidationError[] {
	const errors: AssetValidationError[] = [];

	if (typeof data !== 'object' || data === null) {
		errors.push(AssetValidationError.INVALID_VERSION);
		return errors;
	}

	const asset = data as Record<string, unknown>;

	// Check version
	if (asset.version !== 2) {
		errors.push(AssetValidationError.INVALID_VERSION);
	}

	// Check name
	if (typeof asset.name !== 'string' || asset.name.trim() === '') {
		errors.push(AssetValidationError.MISSING_NAME);
	}

	// Check dimensions
	if (
		typeof asset.width !== 'number' ||
		typeof asset.height !== 'number' ||
		!Number.isInteger(asset.width) ||
		!Number.isInteger(asset.height) ||
		asset.width <= 0 ||
		asset.height <= 0 ||
		asset.width > EDITOR_CONSTANTS.MAX_CANVAS_SIZE ||
		asset.height > EDITOR_CONSTANTS.MAX_CANVAS_SIZE
	) {
		errors.push(AssetValidationError.INVALID_DIMENSIONS);
	}

	// Check preset
	if (typeof asset.preset !== 'string' || !VALID_PRESETS.includes(asset.preset)) {
		errors.push(AssetValidationError.INVALID_PRESET);
	}

	// Check layers
	if (!Array.isArray(asset.layers)) {
		errors.push(AssetValidationError.INVALID_LAYERS);
	} else if (asset.layers.length === 0) {
		errors.push(AssetValidationError.NO_LAYERS);
	} else {
		const width = typeof asset.width === 'number' ? asset.width : 0;
		const height = typeof asset.height === 'number' ? asset.height : 0;
		const firstLayerFrameCount = (asset.layers[0] as { frames?: unknown[] })?.frames?.length ?? 0;

		for (const layer of asset.layers) {
			if (!isValidLayer(layer, firstLayerFrameCount)) {
				errors.push(AssetValidationError.INVALID_LAYERS);
				break;
			}

			// Check pixel bounds
			const typedLayer = layer as Layer;
			for (const frame of typedLayer.frames) {
				for (const pixel of frame) {
					if (pixel.x >= width || pixel.y >= height) {
						errors.push(AssetValidationError.PIXEL_OUT_OF_BOUNDS);
						break;
					}
				}
			}
		}
	}

	// Check optional palette
	if (asset.palette !== undefined) {
		if (!Array.isArray(asset.palette)) {
			errors.push(AssetValidationError.INVALID_PALETTE);
		} else {
			for (const color of asset.palette) {
				if (typeof color !== 'string' || !isValidHexColor(color)) {
					errors.push(AssetValidationError.INVALID_PALETTE);
					break;
				}
			}
		}
	}

	// Check optional animation (v2 format is simpler)
	if (asset.animation !== undefined) {
		const anim = asset.animation as Record<string, unknown>;
		if (
			typeof anim !== 'object' ||
			anim === null ||
			typeof anim.fps !== 'number' ||
			anim.fps <= 0 ||
			anim.fps > 30
		) {
			errors.push(AssetValidationError.INVALID_ANIMATION);
		}
	}

	return errors;
}

/**
 * Get human-readable error message for validation error.
 */
export function getValidationErrorMessage(error: AssetValidationError): string {
	switch (error) {
		case AssetValidationError.INVALID_VERSION:
			return 'Invalid or missing version. Expected version: 1 or 2';
		case AssetValidationError.MISSING_NAME:
			return 'Asset name is required';
		case AssetValidationError.INVALID_DIMENSIONS:
			return `Invalid dimensions. Width and height must be integers between 1 and ${EDITOR_CONSTANTS.MAX_CANVAS_SIZE}`;
		case AssetValidationError.INVALID_PIXEL_FORMAT:
			return 'Invalid pixel format. Each pixel must have x, y (integers >= 0) and color (hex string)';
		case AssetValidationError.PIXEL_OUT_OF_BOUNDS:
			return 'One or more pixels are outside the asset bounds';
		case AssetValidationError.INVALID_PRESET:
			return 'Invalid preset type';
		case AssetValidationError.INVALID_PALETTE:
			return 'Invalid palette. Must be an array of valid hex color strings';
		case AssetValidationError.INVALID_ANIMATION:
			return 'Invalid animation metadata. For v1: must have positive frameWidth, frameHeight, frameCount, and fps. For v2: must have fps between 1-30';
		case AssetValidationError.INVALID_LAYERS:
			return 'Invalid layer structure. Each layer must have id, name, visible, opacity, and frames array';
		case AssetValidationError.NO_LAYERS:
			return 'Asset must have at least one layer';
		case AssetValidationError.LAYER_FRAME_MISMATCH:
			return 'All layers must have the same number of frames';
		default:
			return 'Unknown validation error';
	}
}
