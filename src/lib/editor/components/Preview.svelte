<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { EditorStore } from '../state/editor.svelte.js';
	import { createPreviewRenderer, type PreviewRenderer } from '../preview/renderer.js';

	interface Props {
		store: EditorStore;
	}

	let { store }: Props = $props();

	let containerEl: HTMLDivElement | undefined = $state(undefined);
	let renderer: PreviewRenderer | null = $state(null);
	let previewScale = $state(2);
	let isPlaying = $state(true);

	const asset = $derived(store.state.asset);
	const showPreview = $derived(store.state.showPreview);

	onDestroy(() => {
		if (renderer) {
			renderer.destroy();
			renderer = null;
		}
	});

	// Initialize renderer when container becomes available
	$effect(() => {
		if (containerEl && !renderer) {
			createPreviewRenderer(containerEl)
				.then((r) => {
					renderer = r;
					if (asset) {
						r.update(asset);
					}
				})
				.catch((error) => {
					console.error('Failed to create preview renderer:', error);
				});
		}
	});

	// Update preview when asset changes
	$effect(() => {
		if (renderer && asset) {
			renderer.update(asset);
		}
	});

	function handleScaleChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		previewScale = parseInt(select.value, 10);
		if (renderer) {
			renderer.setScale(previewScale);
		}
	}

	function toggleAnimation() {
		if (!renderer) return;

		if (isPlaying) {
			renderer.stopAnimation();
		} else {
			renderer.playAnimation();
		}
		isPlaying = !isPlaying;
	}

	const hasAnimation = $derived(asset?.animation && asset.animation.frameCount > 1);
</script>

{#if showPreview}
	<div class="preview-panel">
		<div class="preview-header">
			<h3>Preview</h3>
			<div class="preview-controls">
				<select value={previewScale} onchange={handleScaleChange}>
					<option value="1">1x</option>
					<option value="2">2x</option>
					<option value="4">4x</option>
					<option value="8">8x</option>
				</select>
				{#if hasAnimation}
					<button
						class="anim-btn"
						onclick={toggleAnimation}
						title={isPlaying ? 'Pause' : 'Play'}
					>
						{isPlaying ? '\u23F8' : '\u25B6'}
					</button>
				{/if}
			</div>
		</div>
		{#if asset}
			<div class="preview-container" bind:this={containerEl}></div>
		{:else}
			<div class="preview-placeholder">
				<p>No asset to preview</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	.preview-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.preview-header h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.preview-controls {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	.preview-controls select {
		padding: 0.25rem;
		background: #1a1a2e;
		border: 1px solid #0f3460;
		color: #fff;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.anim-btn {
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
		font-size: 0.75rem;
	}

	.anim-btn:hover {
		background: #1a4a7e;
	}

	.preview-container {
		width: 100%;
		height: 200px;
		border-radius: 4px;
		overflow: hidden;
		background: #1a1a2e;
	}

	.preview-container :global(canvas) {
		display: block;
		width: 100% !important;
		height: 100% !important;
		image-rendering: pixelated;
		image-rendering: crisp-edges;
	}

	.preview-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: #666;
		font-size: 0.8rem;
		background: #1a1a2e;
		border-radius: 4px;
	}

	.preview-placeholder p {
		margin: 0;
	}
</style>
