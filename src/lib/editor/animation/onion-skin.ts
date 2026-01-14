/**
 * Onion skinning renderer for animation preview
 * Renders previous/next frames as semi-transparent overlays with color tints
 */

import type { Layer, OnionSkinSettings } from '../types.js';
import { compositeLayers } from '../canvas/composite.js';

// Tint colors for onion skin overlays
const PREVIOUS_TINT = { r: 255, g: 100, b: 100 }; // Red tint for previous frame
const NEXT_TINT = { r: 100, g: 255, b: 100 }; // Green tint for next frame

/**
 * Apply a color tint to an image on a canvas.
 * Returns a new canvas with the tinted image.
 */
function applyTint(
	sourceCanvas: HTMLCanvasElement,
	tint: { r: number; g: number; b: number }
): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = sourceCanvas.width;
	canvas.height = sourceCanvas.height;

	const ctx = canvas.getContext('2d');
	if (!ctx) return sourceCanvas;

	// Draw original image
	ctx.drawImage(sourceCanvas, 0, 0);

	// Get image data and apply tint
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;

	for (let i = 0; i < data.length; i += 4) {
		const alpha = data[i + 3] ?? 0;
		if (alpha > 0) {
			// Blend original color with tint
			const r = data[i] ?? 0;
			const g = data[i + 1] ?? 0;
			const b = data[i + 2] ?? 0;

			data[i] = Math.round((r + tint.r) / 2);
			data[i + 1] = Math.round((g + tint.g) / 2);
			data[i + 2] = Math.round((b + tint.b) / 2);
		}
	}

	ctx.putImageData(imageData, 0, 0);
	return canvas;
}

/**
 * Render onion skin overlays for adjacent frames.
 * Returns canvas elements for previous and next frame overlays.
 */
export function renderOnionSkin(
	layers: Layer[],
	currentFrameIndex: number,
	width: number,
	height: number,
	settings: OnionSkinSettings
): { previous: HTMLCanvasElement | null; next: HTMLCanvasElement | null } {
	const result: { previous: HTMLCanvasElement | null; next: HTMLCanvasElement | null } = {
		previous: null,
		next: null
	};

	if (!settings.enabled) {
		return result;
	}

	const frameCount = layers[0]?.frames.length ?? 0;

	// Render previous frame overlay
	if (settings.showPrevious && currentFrameIndex > 0) {
		const prevFrameCanvas = compositeLayers(layers, currentFrameIndex - 1, width, height);
		result.previous = applyTint(prevFrameCanvas, PREVIOUS_TINT);
	}

	// Render next frame overlay
	if (settings.showNext && currentFrameIndex < frameCount - 1) {
		const nextFrameCanvas = compositeLayers(layers, currentFrameIndex + 1, width, height);
		result.next = applyTint(nextFrameCanvas, NEXT_TINT);
	}

	return result;
}

/**
 * Draw onion skin overlays on a target canvas.
 * Should be called before drawing the current frame.
 */
export function drawOnionSkinOverlays(
	ctx: CanvasRenderingContext2D,
	layers: Layer[],
	currentFrameIndex: number,
	width: number,
	height: number,
	settings: OnionSkinSettings,
	zoom: number
): void {
	if (!settings.enabled) {
		return;
	}

	const overlays = renderOnionSkin(layers, currentFrameIndex, width, height, settings);

	// Draw previous frame (below current)
	if (overlays.previous) {
		ctx.save();
		ctx.globalAlpha = settings.previousOpacity;
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(
			overlays.previous,
			0,
			0,
			overlays.previous.width * zoom,
			overlays.previous.height * zoom
		);
		ctx.restore();
	}

	// Draw next frame (also below current, slightly less opacity by default)
	if (overlays.next) {
		ctx.save();
		ctx.globalAlpha = settings.nextOpacity;
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(overlays.next, 0, 0, overlays.next.width * zoom, overlays.next.height * zoom);
		ctx.restore();
	}
}
