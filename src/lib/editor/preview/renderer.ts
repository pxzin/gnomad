/**
 * PixiJS preview renderer for the Pixel Art Editor
 */

import { Application, Sprite, Texture, AnimatedSprite, Rectangle } from 'pixi.js';
import type { PixelArtAssetV2 } from '../types.js';
import { createExportCanvasV2 } from '../canvas/render.js';

/**
 * Preview renderer interface
 */
export interface PreviewRenderer {
	/** Update preview with current asset */
	update(asset: PixelArtAssetV2, frameIndex?: number): void;
	/** Set preview scale */
	setScale(scale: number): void;
	/** Play animation (for sprite sheets) */
	playAnimation(): void;
	/** Stop animation */
	stopAnimation(): void;
	/** Destroy renderer and cleanup */
	destroy(): void;
	/** Get the PixiJS application */
	getApp(): Application;
}

/**
 * Create PixiJS preview renderer.
 */
export async function createPreviewRenderer(
	container: HTMLElement
): Promise<PreviewRenderer> {
	const app = new Application();

	await app.init({
		width: 200,
		height: 200,
		backgroundColor: 0x1a1a2e,
		backgroundAlpha: 1
	});

	container.appendChild(app.canvas);

	let currentSprite: Sprite | AnimatedSprite | null = null;
	let currentScale = 2;

	function clearStage(): void {
		if (currentSprite) {
			app.stage.removeChild(currentSprite);
			currentSprite.destroy();
			currentSprite = null;
		}
	}

	function update(asset: PixelArtAssetV2, frameIndex: number = 0): void {
		clearStage();

		// Get frame count from layers
		const frameCount = asset.layers[0]?.frames.length ?? 1;

		// Check if this is an animated asset with multiple frames
		if (asset.animation && frameCount > 1) {
			// Create animated sprite with all frames
			const frames: Texture[] = [];

			for (let i = 0; i < frameCount; i++) {
				const canvas = createExportCanvasV2(asset, i);
				const texture = Texture.from(canvas);
				frames.push(texture);
			}

			const animatedSprite = new AnimatedSprite(frames);
			animatedSprite.animationSpeed = (asset.animation.fps ?? 8) / 60;
			animatedSprite.scale.set(currentScale);
			animatedSprite.anchor.set(0.5);
			animatedSprite.x = app.screen.width / 2;
			animatedSprite.y = app.screen.height / 2;
			animatedSprite.play();

			currentSprite = animatedSprite;
		} else {
			// Create static sprite from current frame
			const canvas = createExportCanvasV2(asset, frameIndex);
			const texture = Texture.from(canvas);

			const sprite = new Sprite(texture);
			sprite.scale.set(currentScale);
			sprite.anchor.set(0.5);
			sprite.x = app.screen.width / 2;
			sprite.y = app.screen.height / 2;

			currentSprite = sprite;
		}

		app.stage.addChild(currentSprite);
	}

	function setScale(scale: number): void {
		currentScale = scale;
		if (currentSprite) {
			currentSprite.scale.set(scale);
		}
	}

	function playAnimation(): void {
		if (currentSprite instanceof AnimatedSprite) {
			currentSprite.play();
		}
	}

	function stopAnimation(): void {
		if (currentSprite instanceof AnimatedSprite) {
			currentSprite.stop();
		}
	}

	function destroy(): void {
		clearStage();
		app.destroy(true, { children: true, texture: true });
	}

	return {
		update,
		setScale,
		playAnimation,
		stopAnimation,
		destroy,
		getApp: () => app
	};
}
