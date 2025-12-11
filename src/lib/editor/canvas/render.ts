/**
 * Canvas rendering functions for the Pixel Art Editor
 */

import type { PixelArtAsset } from '../types.js';
import { EDITOR_CONSTANTS } from '../types.js';
import { parseHexColor } from '../utils/color.js';

/**
 * Render transparency checkerboard pattern.
 */
export function renderTransparencyPattern(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	zoom: number,
	checkerSize: number = 8
): void {
	const { TRANSPARENT_PATTERN_LIGHT, TRANSPARENT_PATTERN_DARK } = EDITOR_CONSTANTS;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			// Determine checker color based on position
			const checkerX = Math.floor(x / checkerSize);
			const checkerY = Math.floor(y / checkerSize);
			const isLight = (checkerX + checkerY) % 2 === 0;

			ctx.fillStyle = isLight ? TRANSPARENT_PATTERN_LIGHT : TRANSPARENT_PATTERN_DARK;
			ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
		}
	}
}

/**
 * Render asset to canvas context at 1:1 scale.
 */
export function renderAssetToCanvas(
	ctx: CanvasRenderingContext2D,
	asset: PixelArtAsset
): void {
	// Clear canvas
	ctx.clearRect(0, 0, asset.width, asset.height);

	// Draw each pixel
	for (const pixel of asset.pixels) {
		ctx.fillStyle = pixel.color;
		ctx.fillRect(pixel.x, pixel.y, 1, 1);
	}
}

/**
 * Render asset with zoom and optional grid.
 */
export function renderAssetZoomed(
	ctx: CanvasRenderingContext2D,
	asset: PixelArtAsset,
	zoom: number,
	showGrid: boolean
): void {
	const canvasWidth = asset.width * zoom;
	const canvasHeight = asset.height * zoom;

	// Clear canvas
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	// Render transparency checkerboard
	renderTransparencyPattern(ctx, asset.width, asset.height, zoom);

	// Draw each pixel
	for (const pixel of asset.pixels) {
		const color = parseHexColor(pixel.color);
		ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
		ctx.fillRect(pixel.x * zoom, pixel.y * zoom, zoom, zoom);
	}

	// Draw grid if enabled
	if (showGrid && zoom >= 4) {
		renderGrid(ctx, asset.width, asset.height, zoom, EDITOR_CONSTANTS.GRID_COLOR);
	}
}

/**
 * Render pixel grid overlay.
 */
export function renderGrid(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	zoom: number,
	gridColor: string
): void {
	ctx.strokeStyle = gridColor;
	ctx.lineWidth = 1;

	// Use half-pixel offset for crisp lines
	ctx.beginPath();

	// Vertical lines
	for (let x = 0; x <= width; x++) {
		const px = x * zoom + 0.5;
		ctx.moveTo(px, 0);
		ctx.lineTo(px, height * zoom);
	}

	// Horizontal lines
	for (let y = 0; y <= height; y++) {
		const py = y * zoom + 0.5;
		ctx.moveTo(0, py);
		ctx.lineTo(width * zoom, py);
	}

	ctx.stroke();
}

/**
 * Render cursor highlight at pixel position.
 */
export function renderCursor(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	zoom: number,
	color: string = '#FFFFFF'
): void {
	ctx.strokeStyle = color;
	ctx.lineWidth = 2;
	ctx.strokeRect(x * zoom, y * zoom, zoom, zoom);
}

/**
 * Create an offscreen canvas with the asset rendered at 1:1 for export.
 */
export function createExportCanvas(asset: PixelArtAsset): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = asset.width;
	canvas.height = asset.height;

	const ctx = canvas.getContext('2d')!;

	// Set alpha to fully transparent
	ctx.clearRect(0, 0, asset.width, asset.height);

	// Draw each pixel
	for (const pixel of asset.pixels) {
		const color = parseHexColor(pixel.color);
		ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
		ctx.fillRect(pixel.x, pixel.y, 1, 1);
	}

	return canvas;
}

/**
 * Convert asset to ImageData for pixel manipulation.
 */
export function assetToImageData(asset: PixelArtAsset): ImageData {
	const imageData = new ImageData(asset.width, asset.height);
	const data = imageData.data;

	for (const pixel of asset.pixels) {
		const color = parseHexColor(pixel.color);
		const index = (pixel.y * asset.width + pixel.x) * 4;
		data[index] = color.r;
		data[index + 1] = color.g;
		data[index + 2] = color.b;
		data[index + 3] = color.a;
	}

	return imageData;
}
