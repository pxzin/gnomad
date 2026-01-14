<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { EditorStore } from '../state/editor.svelte.js';
	import { createPlaybackController, type PlaybackController } from '../animation/playback.js';

	interface Props {
		store: EditorStore;
	}

	let { store }: Props = $props();

	const asset = $derived(store.state.asset);
	const currentFrame = $derived(store.state.currentFrame);
	const timeline = $derived(store.state.timeline);
	const onionSkin = $derived(store.state.onionSkin);
	const frames = $derived(asset?.layers[0]?.frames ?? []);
	const frameCount = $derived(frames.length);
	const hasAnimation = $derived(frameCount > 1 || asset?.animation !== undefined);

	// Playback controller
	let playbackController: PlaybackController | null = $state(null);

	// Initialize playback controller
	$effect(() => {
		if (asset && frameCount > 1) {
			playbackController = createPlaybackController({
				fps: timeline.fps,
				frameCount,
				loop: timeline.loop,
				onFrameChange: (frameIndex) => {
					store.selectFrame(frameIndex);
				},
				onStop: () => {
					store.stop();
				}
			});
		}

		return () => {
			playbackController?.destroy();
			playbackController = null;
		};
	});

	// Sync playback controller settings with store
	$effect(() => {
		if (playbackController) {
			playbackController.setFps(timeline.fps);
			playbackController.setFrameCount(frameCount);
			playbackController.setLoop(timeline.loop);
		}
	});

	// Handle play/stop based on timeline state
	$effect(() => {
		if (playbackController) {
			if (timeline.playing && !playbackController.isPlaying()) {
				playbackController.play();
			} else if (!timeline.playing && playbackController.isPlaying()) {
				playbackController.stop();
			}
		}
	});

	onDestroy(() => {
		playbackController?.destroy();
	});

	// Drag state for reordering
	let draggedFrameIndex = $state<number | null>(null);

	function handleAddFrame() {
		store.addFrame();
	}

	function handleDeleteFrame(index: number) {
		store.deleteFrame(index);
	}

	function handleDuplicateFrame(index: number) {
		store.duplicateFrame(index);
	}

	function handleSelectFrame(index: number) {
		store.selectFrame(index);
	}

	function handleTogglePlay() {
		store.togglePlay();
	}

	function handleFpsChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const fps = parseInt(target.value, 10);
		store.setFps(fps);
	}

	// Drag and drop for reordering frames
	function handleDragStart(event: DragEvent, index: number) {
		draggedFrameIndex = index;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', String(index));
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(event: DragEvent, targetIndex: number) {
		event.preventDefault();
		if (draggedFrameIndex === null) return;
		if (draggedFrameIndex === targetIndex) return;

		store.reorderFrame(draggedFrameIndex, targetIndex);
		draggedFrameIndex = null;
	}

	function handleDragEnd() {
		draggedFrameIndex = null;
	}

	// Check if this is the only frame
	function isOnlyFrame(): boolean {
		return frameCount <= 1;
	}

	// Onion skin handlers
	function handleToggleOnionSkin() {
		store.toggleOnionSkin();
	}

	function handlePreviousOpacityChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const opacity = parseFloat(target.value) / 100;
		store.setOnionSkinPreviousOpacity(opacity);
	}

	function handleNextOpacityChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const opacity = parseFloat(target.value) / 100;
		store.setOnionSkinNextOpacity(opacity);
	}
</script>

{#if asset}
	<div class="timeline-panel">
		<div class="timeline-header">
			<h3>Timeline</h3>
			<div class="timeline-controls">
				<button
					class="play-btn"
					onclick={handleTogglePlay}
					disabled={!hasAnimation || frameCount <= 1}
					title={timeline.playing ? 'Stop' : 'Play'}
				>
					{timeline.playing ? '\u23F9' : '\u25B6'}
				</button>
				<div class="fps-control">
					<label for="fps">FPS:</label>
					<input
						type="number"
						id="fps"
						min="1"
						max="30"
						value={timeline.fps}
						oninput={handleFpsChange}
					/>
				</div>
				<button class="icon-btn" onclick={handleAddFrame} title="Add Frame">+</button>
			</div>
		</div>

		<div class="frame-strip">
			{#each frames as _, index (index)}
				<div
					class="frame-item"
					class:active={index === currentFrame}
					class:dragging={index === draggedFrameIndex}
					draggable="true"
					role="button"
					tabindex="0"
					onclick={() => handleSelectFrame(index)}
					onkeydown={(e) => e.key === 'Enter' && handleSelectFrame(index)}
					ondragstart={(e) => handleDragStart(e, index)}
					ondragover={handleDragOver}
					ondrop={(e) => handleDrop(e, index)}
					ondragend={handleDragEnd}
				>
					<div class="frame-number">{index + 1}</div>
					<div class="frame-actions">
						<button
							class="frame-action-btn"
							onclick={(e) => { e.stopPropagation(); handleDuplicateFrame(index); }}
							title="Duplicate Frame"
						>
							&#x2398;
						</button>
						<button
							class="frame-action-btn danger"
							onclick={(e) => { e.stopPropagation(); handleDeleteFrame(index); }}
							disabled={isOnlyFrame()}
							title="Delete Frame"
						>
							&#x2715;
						</button>
					</div>
				</div>
			{/each}
		</div>

		{#if !hasAnimation}
			<div class="animation-hint">
				<p>Add more frames to enable animation</p>
			</div>
		{/if}

		{#if frameCount > 1}
			<div class="onion-skin-controls">
				<button
					class="onion-btn"
					class:active={onionSkin.enabled}
					onclick={handleToggleOnionSkin}
					title="Toggle Onion Skinning"
				>
					&#x1F9C5;
				</button>
				{#if onionSkin.enabled}
					<div class="onion-sliders">
						<div class="onion-slider">
							<span class="onion-label prev">Prev:</span>
							<input
								type="range"
								min="0"
								max="100"
								value={Math.round(onionSkin.previousOpacity * 100)}
								oninput={handlePreviousOpacityChange}
								title={`Previous frame opacity: ${Math.round(onionSkin.previousOpacity * 100)}%`}
							/>
						</div>
						<div class="onion-slider">
							<span class="onion-label next">Next:</span>
							<input
								type="range"
								min="0"
								max="100"
								value={Math.round(onionSkin.nextOpacity * 100)}
								oninput={handleNextOpacityChange}
								title={`Next frame opacity: ${Math.round(onionSkin.nextOpacity * 100)}%`}
							/>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.timeline-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #1a1a2e;
		border-top: 1px solid #0f3460;
	}

	.timeline-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.timeline-header h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.timeline-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.play-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		background: #2e5a32;
		border: 1px solid #1a1a2e;
		color: #fff;
		cursor: pointer;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.play-btn:hover:not(:disabled) {
		background: #3d7a43;
	}

	.play-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.fps-control {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.fps-control label {
		font-size: 0.75rem;
		color: #888;
	}

	.fps-control input {
		width: 40px;
		padding: 0.2rem 0.3rem;
		background: #0f3460;
		border: 1px solid #16213e;
		color: #fff;
		border-radius: 4px;
		font-size: 0.75rem;
		text-align: center;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: #0f3460;
		border: 1px solid #1a1a2e;
		color: #fff;
		cursor: pointer;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.icon-btn:hover:not(:disabled) {
		background: #1a4a7e;
	}

	.frame-strip {
		display: flex;
		gap: 0.25rem;
		overflow-x: auto;
		padding: 0.25rem 0;
	}

	.frame-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		min-width: 50px;
		padding: 0.35rem;
		background: #252545;
		border: 1px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.1s, border-color 0.1s;
	}

	.frame-item:hover {
		background: #303060;
	}

	.frame-item.active {
		border-color: #1a4a7e;
		background: #1a2a4e;
	}

	.frame-item.dragging {
		opacity: 0.5;
	}

	.frame-number {
		font-size: 0.75rem;
		color: #888;
		font-family: monospace;
	}

	.frame-actions {
		display: flex;
		gap: 0.15rem;
	}

	.frame-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		padding: 0;
		background: transparent;
		border: 1px solid #0f3460;
		color: #888;
		cursor: pointer;
		border-radius: 2px;
		font-size: 0.65rem;
	}

	.frame-action-btn:hover:not(:disabled) {
		background: #0f3460;
		color: #fff;
	}

	.frame-action-btn.danger:hover:not(:disabled) {
		background: #8b2020;
	}

	.frame-action-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.animation-hint {
		text-align: center;
		color: #666;
		font-size: 0.75rem;
	}

	.animation-hint p {
		margin: 0.25rem 0;
	}

	.onion-skin-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-top: 0.25rem;
		border-top: 1px solid #0f3460;
	}

	.onion-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		background: #0f3460;
		border: 1px solid #1a1a2e;
		color: #fff;
		cursor: pointer;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.onion-btn:hover {
		background: #1a4a7e;
	}

	.onion-btn.active {
		background: #1a4a7e;
		border-color: #fff;
	}

	.onion-sliders {
		display: flex;
		gap: 0.75rem;
		flex: 1;
	}

	.onion-slider {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.onion-label {
		font-size: 0.65rem;
		font-weight: 600;
	}

	.onion-label.prev {
		color: #ff6464;
	}

	.onion-label.next {
		color: #64ff64;
	}

	.onion-slider input[type="range"] {
		width: 60px;
		height: 4px;
		background: #0f3460;
		border-radius: 2px;
		cursor: pointer;
		-webkit-appearance: none;
		appearance: none;
	}

	.onion-slider input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 10px;
		height: 10px;
		background: #1a4a7e;
		border-radius: 50%;
		cursor: pointer;
	}

	.onion-slider input[type="range"]::-moz-range-thumb {
		width: 10px;
		height: 10px;
		background: #1a4a7e;
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}
</style>
