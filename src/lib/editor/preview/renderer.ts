/**
 * PixiJS preview renderer for the Pixel Art Editor
 */

import { Application, Sprite, Texture, AnimatedSprite, Rectangle } from 'pixi.js';
import type { PixelArtAsset } from '../types.js';
import { createExportCanvas } from '../canvas/render.js';

/**
 * Preview renderer interface
 */
export interface PreviewRenderer {
	/** Update preview with current asset */
	update(asset: PixelArtAsset): void;
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

	function update(asset: PixelArtAsset): void {
		clearStage();

		// Create texture from asset
		const canvas = createExportCanvas(asset);
		const texture = Texture.from(canvas);

		// Check if this is an animated sprite sheet
		if (asset.animation && asset.animation.frameCount > 1) {
			// Create animated sprite
			const frames: Texture[] = [];
			const { frameWidth, frameHeight, frameCount } = asset.animation;

			for (let i = 0; i < frameCount; i++) {
				const frameTexture = new Texture({
					source: texture.source,
					frame: new Rectangle(
						i * frameWidth,
						0,
						frameWidth,
						frameHeight
					)
				});
				frames.push(frameTexture);
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
			// Create static sprite
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
