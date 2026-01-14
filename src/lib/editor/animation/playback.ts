/**
 * Animation playback controller for the Pixel Art Editor
 * Handles requestAnimationFrame-based animation preview
 */

export interface PlaybackController {
	/** Start playback */
	play(): void;
	/** Stop playback */
	stop(): void;
	/** Check if currently playing */
	isPlaying(): boolean;
	/** Set frames per second */
	setFps(fps: number): void;
	/** Set total frame count */
	setFrameCount(count: number): void;
	/** Set loop mode */
	setLoop(loop: boolean): void;
	/** Destroy the controller and cleanup */
	destroy(): void;
}

export interface PlaybackOptions {
	/** Frames per second (1-30) */
	fps: number;
	/** Total number of frames */
	frameCount: number;
	/** Whether to loop playback */
	loop: boolean;
	/** Callback when frame changes */
	onFrameChange: (frameIndex: number) => void;
	/** Callback when playback stops */
	onStop?: () => void;
}

/**
 * Create an animation playback controller.
 */
export function createPlaybackController(options: PlaybackOptions): PlaybackController {
	let fps = options.fps;
	let frameCount = options.frameCount;
	let loop = options.loop;
	let playing = false;
	let currentFrame = 0;
	let lastFrameTime = 0;
	let animationFrameId: number | null = null;

	const onFrameChange = options.onFrameChange;
	const onStop = options.onStop;

	function getFrameDuration(): number {
		return 1000 / fps;
	}

	function tick(timestamp: number): void {
		if (!playing) return;

		const elapsed = timestamp - lastFrameTime;
		const frameDuration = getFrameDuration();

		if (elapsed >= frameDuration) {
			lastFrameTime = timestamp - (elapsed % frameDuration);

			// Advance to next frame
			currentFrame++;

			if (currentFrame >= frameCount) {
				if (loop) {
					currentFrame = 0;
				} else {
					// Stop at end
					playing = false;
					currentFrame = frameCount - 1;
					onFrameChange(currentFrame);
					onStop?.();
					return;
				}
			}

			onFrameChange(currentFrame);
		}

		animationFrameId = requestAnimationFrame(tick);
	}

	return {
		play() {
			if (playing) return;
			if (frameCount <= 1) return;

			playing = true;
			currentFrame = 0;
			lastFrameTime = performance.now();
			onFrameChange(currentFrame);
			animationFrameId = requestAnimationFrame(tick);
		},

		stop() {
			playing = false;
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
			onStop?.();
		},

		isPlaying() {
			return playing;
		},

		setFps(newFps: number) {
			fps = Math.max(1, Math.min(30, newFps));
		},

		setFrameCount(count: number) {
			frameCount = Math.max(1, count);
			if (currentFrame >= frameCount) {
				currentFrame = frameCount - 1;
				if (playing) {
					onFrameChange(currentFrame);
				}
			}
		},

		setLoop(newLoop: boolean) {
			loop = newLoop;
		},

		destroy() {
			this.stop();
		}
	};
}
