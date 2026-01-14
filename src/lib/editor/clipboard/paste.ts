/**
 * Clipboard paste functionality for the Pixel Art Editor
 * Handles reading images from clipboard and converting to pixel data
 */

import type { Pixel, ClipboardImage } from '../types.js';

/**
 * Read image data from the clipboard.
 * Returns null if clipboard doesn't contain an image.
 */
export async function readClipboardImage(): Promise<ClipboardImage | null> {
	try {
		const clipboardItems = await navigator.clipboard.read();

		for (const item of clipboardItems) {
			// Check for image types
			const imageType = item.types.find((type) => type.startsWith('image/'));
			if (imageType) {
				const blob = await item.getType(imageType);
				return blobToClipboardImage(blob);
			}
		}

		return null;
	} catch (error) {
		console.error('Failed to read clipboard:', error);
		return null;
	}
}

/**
 * Convert a Blob to ClipboardImage with RGBA data.
 * Stores the original ImageBitmap for later scaling.
 */
async function blobToClipboardImage(blob: Blob): Promise<ClipboardImage> {
	const imageBitmap = await createImageBitmap(blob);

	// Create a canvas to extract pixel data at original size
	const canvas = document.createElement('canvas');
	canvas.width = imageBitmap.width;
	canvas.height = imageBitmap.height;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to get canvas context');
	}

	ctx.drawImage(imageBitmap, 0, 0);
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	return {
		width: canvas.width,
		height: canvas.height,
		data: imageData.data
	};
}

/**
 * Resize an image to fit within target dimensions while maintaining aspect ratio.
 * Uses nearest-neighbor sampling for pixel-art style results.
 *
 * @param image - Source clipboard image
 * @param targetWidth - Maximum target width
 * @param targetHeight - Maximum target height
 * @returns Resized image data
 */
export function resizeImageToFit(
	image: ClipboardImage,
	targetWidth: number,
	targetHeight: number
): ClipboardImage {
	const { width: srcWidth, height: srcHeight, data: srcData } = image;

	// If image already fits, return as-is
	if (srcWidth <= targetWidth && srcHeight <= targetHeight) {
		return image;
	}

	// Calculate scale factor to fit within target dimensions
	const scaleX = targetWidth / srcWidth;
	const scaleY = targetHeight / srcHeight;
	const scale = Math.min(scaleX, scaleY);

	// Calculate new dimensions
	const newWidth = Math.max(1, Math.round(srcWidth * scale));
	const newHeight = Math.max(1, Math.round(srcHeight * scale));

	// Create source canvas with original image
	const srcCanvas = document.createElement('canvas');
	srcCanvas.width = srcWidth;
	srcCanvas.height = srcHeight;
	const srcCtx = srcCanvas.getContext('2d');
	if (!srcCtx) {
		throw new Error('Failed to get source canvas context');
	}

	// Put original image data
	const srcImageData = new ImageData(new Uint8ClampedArray(srcData), srcWidth, srcHeight);
	srcCtx.putImageData(srcImageData, 0, 0);

	// Create destination canvas at new size
	const dstCanvas = document.createElement('canvas');
	dstCanvas.width = newWidth;
	dstCanvas.height = newHeight;
	const dstCtx = dstCanvas.getContext('2d');
	if (!dstCtx) {
		throw new Error('Failed to get destination canvas context');
	}

	// Disable image smoothing for pixel-art style (nearest-neighbor)
	dstCtx.imageSmoothingEnabled = false;

	// Draw scaled image
	dstCtx.drawImage(srcCanvas, 0, 0, newWidth, newHeight);

	// Extract pixel data
	const dstImageData = dstCtx.getImageData(0, 0, newWidth, newHeight);

	return {
		width: newWidth,
		height: newHeight,
		data: dstImageData.data
	};
}

/**
 * Convert clipboard image to pixels, resizing to fit canvas dimensions.
 * Maintains aspect ratio and uses nearest-neighbor scaling for pixel-art results.
 * Only extracts non-transparent pixels (alpha > 0).
 *
 * @param image - The clipboard image data
 * @param canvasWidth - Target canvas width (image will be scaled to fit)
 * @param canvasHeight - Target canvas height (image will be scaled to fit)
 * @returns Array of non-transparent pixels with hex colors
 */
export function imageToPixels(
	image: ClipboardImage,
	canvasWidth: number,
	canvasHeight: number
): Pixel[] {
	// Resize image to fit canvas while maintaining aspect ratio
	const resized = resizeImageToFit(image, canvasWidth, canvasHeight);

	const pixels: Pixel[] = [];
	const { width, height, data } = resized;

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
			const color = rgbaToHex(r, g, b, a);
			pixels.push({ x, y, color });
		}
	}

	return pixels;
}

/**
 * Convert RGBA values to hex color string.
 * Returns #RRGGBB for fully opaque, #RRGGBBAA for semi-transparent.
 */
function rgbaToHex(r: number, g: number, b: number, a: number): string {
	const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();

	if (a === 255) {
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}
	return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
}

/**
 * Extract unique colors from pixels for palette update.
 * Limits to a maximum number of colors to prevent palette bloat.
 *
 * @param pixels - Array of pixels to extract colors from
 * @param maxColors - Maximum number of colors to return (default 16)
 * @returns Array of unique hex colors (without alpha for palette)
 */
export function extractPaletteColors(pixels: Pixel[], maxColors: number = 16): string[] {
	const colorSet = new Set<string>();

	for (const pixel of pixels) {
		// Normalize to #RRGGBB format for palette (strip alpha)
		const baseColor = pixel.color.substring(0, 7).toUpperCase();
		colorSet.add(baseColor);

		if (colorSet.size >= maxColors) break;
	}

	return Array.from(colorSet);
}

/**
 * Check if clipboard has image data available.
 * Uses the older execCommand API as fallback for broader compatibility.
 */
export async function hasClipboardImage(): Promise<boolean> {
	try {
		const clipboardItems = await navigator.clipboard.read();
		return clipboardItems.some((item) => item.types.some((type) => type.startsWith('image/')));
	} catch {
		return false;
	}
}
