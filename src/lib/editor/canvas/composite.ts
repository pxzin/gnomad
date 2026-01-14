/**
 * Layer compositing utilities for the Pixel Art Editor.
 * Handles flattening multiple layers into a single canvas/pixel array.
 */

import type { Layer, Pixel, PixelArtAssetV2 } from '../types.js';
import { parseHexColor } from '../utils/color.js';

/**
 * Create an offscreen canvas for layer compositing.
 */
function createOffscreenCanvas(width: number, height: number): {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
} {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d')!;
	return { canvas, ctx };
}

/**
 * Render a single layer's pixels to a canvas context.
 */
function renderLayerToContext(
	ctx: CanvasRenderingContext2D,
	pixels: Pixel[],
	opacity: number
): void {
	ctx.globalAlpha = opacity;

	for (const pixel of pixels) {
		const color = parseHexColor(pixel.color);
		ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
		ctx.fillRect(pixel.x, pixel.y, 1, 1);
	}

	ctx.globalAlpha = 1.0;
}

/**
 * Composite all visible layers into a single canvas.
 * Layers are composited bottom-to-top with their individual opacities.
 */
export function compositeLayers(
	layers: Layer[],
	frameIndex: number,
	width: number,
	height: number
): HTMLCanvasElement {
	const { canvas, ctx } = createOffscreenCanvas(width, height);

	// Clear to transparent
	ctx.clearRect(0, 0, width, height);

	// Composite layers from bottom (index 0) to top
	for (const layer of layers) {
		if (!layer.visible || layer.opacity === 0) continue;

		const framePixels = layer.frames[frameIndex] ?? [];
		if (framePixels.length === 0) continue;

		// Create temporary canvas for this layer
		const { canvas: layerCanvas, ctx: layerCtx } = createOffscreenCanvas(width, height);
		layerCtx.clearRect(0, 0, width, height);

		// Render pixels at full opacity to layer canvas
		for (const pixel of framePixels) {
			const color = parseHexColor(pixel.color);
			layerCtx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
			layerCtx.fillRect(pixel.x, pixel.y, 1, 1);
		}

		// Draw layer canvas to composite with layer opacity
		ctx.globalAlpha = layer.opacity;
		ctx.drawImage(layerCanvas, 0, 0);
		ctx.globalAlpha = 1.0;
	}

	return canvas;
}

/**
 * Flatten all visible layers into a single pixel array.
 * Used for PNG export and undo/redo.
 */
export function flattenToPixels(
	layers: Layer[],
	frameIndex: number,
	width: number,
	height: number
): Pixel[] {
	const canvas = compositeLayers(layers, frameIndex, width, height);
	const ctx = canvas.getContext('2d')!;
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;

	const pixels: Pixel[] = [];

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = (y * width + x) * 4;
			const r = data[index] ?? 0;
			const g = data[index + 1] ?? 0;
			const b = data[index + 2] ?? 0;
			const a = data[index + 3] ?? 0;

			// Skip fully transparent pixels
			if (a === 0) continue;

			// Convert to hex color
			const color = a === 255
				? `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
				: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a.toString(16).padStart(2, '0')}`;

			pixels.push({ x, y, color: color.toUpperCase() });
		}
	}

	return pixels;
}

/**
 * Flatten entire asset's visible layers into a single layer.
 * Returns new asset with single layer containing flattened pixels.
 */
export function flattenAsset(asset: PixelArtAssetV2): PixelArtAssetV2 {
	const frameCount = asset.layers[0]?.frames.length ?? 1;

	const flattenedFrames: Pixel[][] = [];
	for (let frameIdx = 0; frameIdx < frameCount; frameIdx++) {
		flattenedFrames.push(flattenToPixels(asset.layers, frameIdx, asset.width, asset.height));
	}

	const flattenedLayer: Layer = {
		id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		name: 'Flattened',
		visible: true,
		opacity: 1.0,
		frames: flattenedFrames
	};

	return {
		...asset,
		layers: [flattenedLayer]
	};
}

/**
 * Get pixels from a specific layer at a specific frame.
 */
export function getLayerPixels(
	asset: PixelArtAssetV2,
	layerId: string,
	frameIndex: number
): Pixel[] {
	const layer = asset.layers.find((l) => l.id === layerId);
	if (!layer) return [];
	return layer.frames[frameIndex] ?? [];
}

/**
 * Get composite pixels for current frame (all visible layers).
 */
export function getCompositePixels(
	asset: PixelArtAssetV2,
	frameIndex: number
): Pixel[] {
	return flattenToPixels(asset.layers, frameIndex, asset.width, asset.height);
}
