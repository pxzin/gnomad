/**
 * Color utilities for the Pixel Art Editor
 */

import type { RGBAColor, PixelArtAsset } from '../types.js';

/**
 * Parse hex color string to RGBA.
 * Supports #RGB, #RRGGBB, and #RRGGBBAA formats.
 */
export function parseHexColor(hex: string): RGBAColor {
	// Remove # prefix if present
	const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

	// Handle shorthand (#RGB)
	if (cleanHex.length === 3) {
		const r = parseInt(cleanHex.charAt(0) + cleanHex.charAt(0), 16);
		const g = parseInt(cleanHex.charAt(1) + cleanHex.charAt(1), 16);
		const b = parseInt(cleanHex.charAt(2) + cleanHex.charAt(2), 16);
		return { r, g, b, a: 255 };
	}

	// Handle #RRGGBB
	if (cleanHex.length === 6) {
		const r = parseInt(cleanHex.slice(0, 2), 16);
		const g = parseInt(cleanHex.slice(2, 4), 16);
		const b = parseInt(cleanHex.slice(4, 6), 16);
		return { r, g, b, a: 255 };
	}

	// Handle #RRGGBBAA
	if (cleanHex.length === 8) {
		const r = parseInt(cleanHex.slice(0, 2), 16);
		const g = parseInt(cleanHex.slice(2, 4), 16);
		const b = parseInt(cleanHex.slice(4, 6), 16);
		const a = parseInt(cleanHex.slice(6, 8), 16);
		return { r, g, b, a };
	}

	throw new Error(`Invalid hex color: ${hex}`);
}

/**
 * Format RGBA color as hex string.
 * Returns #RRGGBB if alpha is 255, #RRGGBBAA otherwise.
 */
export function formatHexColor(color: RGBAColor): string {
	const hex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
	const { r, g, b, a } = color;

	return a === 255 ? `#${hex(r)}${hex(g)}${hex(b)}` : `#${hex(r)}${hex(g)}${hex(b)}${hex(a)}`;
}

/**
 * Check if two RGBA colors are equal.
 */
export function colorsEqual(a: RGBAColor, b: RGBAColor): boolean {
	return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
}

/**
 * Check if two hex color strings are equal.
 */
export function hexColorsEqual(a: string, b: string): boolean {
	try {
		return colorsEqual(parseHexColor(a), parseHexColor(b));
	} catch {
		return false;
	}
}

/**
 * Validate hex color string format.
 */
export function isValidHexColor(hex: string): boolean {
	return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(hex);
}

/**
 * Extract unique colors from asset as palette.
 * Returns array of hex color strings sorted by frequency (most used first).
 */
export function extractPalette(asset: PixelArtAsset): string[] {
	const colorCounts = new Map<string, number>();

	for (const pixel of asset.pixels) {
		// Normalize to uppercase for consistency
		const normalizedColor = pixel.color.toUpperCase();
		colorCounts.set(normalizedColor, (colorCounts.get(normalizedColor) ?? 0) + 1);
	}

	// Sort by frequency descending
	return Array.from(colorCounts.entries())
		.sort((a, b) => b[1] - a[1])
		.map(([color]) => color);
}

/**
 * Convert RGBA to CSS rgba() string.
 */
export function rgbaToCss(color: RGBAColor): string {
	return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
}

/**
 * Check if a color is transparent (alpha = 0).
 */
export function isTransparent(hex: string): boolean {
	if (!isValidHexColor(hex)) return false;
	const color = parseHexColor(hex);
	return color.a === 0;
}
