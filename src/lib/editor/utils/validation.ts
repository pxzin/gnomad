/**
 * Validation utilities for the Pixel Art Editor
 */

import type { PixelArtAsset, Pixel } from '../types.js';
import { EDITOR_CONSTANTS } from '../types.js';
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
	INVALID_ANIMATION = 'INVALID_ANIMATION'
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
 * Validate PixelArtAsset structure.
 * Returns true if the data is a valid PixelArtAsset.
 */
export function validateAsset(data: unknown): data is PixelArtAsset {
	return validateAssetDetailed(data).length === 0;
}

/**
 * Validate and return detailed errors.
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
 * Get human-readable error message for validation error.
 */
export function getValidationErrorMessage(error: AssetValidationError): string {
	switch (error) {
		case AssetValidationError.INVALID_VERSION:
			return 'Invalid or missing version. Expected version: 1';
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
			return 'Invalid animation metadata. Must have positive frameWidth, frameHeight, frameCount, and fps';
		default:
			return 'Unknown validation error';
	}
}
