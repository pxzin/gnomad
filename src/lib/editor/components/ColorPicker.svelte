<script lang="ts">
	import type { EditorStore } from '../state/editor.svelte.js';
	import { DEFAULT_PALETTE } from '../types.js';

	interface Props {
		store: EditorStore;
	}

	let { store }: Props = $props();

	const currentColor = $derived(store.state.currentColor);
	const secondaryColor = $derived(store.state.secondaryColor);

	function handleColorChange(event: Event) {
		const input = event.target as HTMLInputElement;
		store.setColor(input.value);
	}

	function handleSecondaryColorChange(event: Event) {
		const input = event.target as HTMLInputElement;
		store.setSecondaryColor(input.value);
	}

	function selectPaletteColor(color: string) {
		store.setColor(color);
	}

	function handleSwapColors() {
		store.swapColors();
	}
</script>

<div class="color-picker">
	<div class="color-controls">
		<div class="color-swatches">
			<div class="swatch-container">
				<input
					type="color"
					class="color-input primary"
					value={currentColor}
					oninput={handleColorChange}
					title="Primary color"
				/>
				<input
					type="color"
					class="color-input secondary"
					value={secondaryColor}
					oninput={handleSecondaryColorChange}
					title="Secondary color"
				/>
			</div>
			<button class="swap-btn" onclick={handleSwapColors} title="Swap colors (X)">
				<span class="swap-icon">&#x21C4;</span>
			</button>
		</div>

		<div class="color-values">
			<span class="color-hex">{currentColor.toUpperCase()}</span>
		</div>
	</div>

	<div class="palette">
		{#each DEFAULT_PALETTE as color}
			<button
				class="palette-color"
				class:active={currentColor.toUpperCase() === color.toUpperCase()}
				style="background-color: {color};"
				onclick={() => selectPaletteColor(color)}
				title={color}
			></button>
		{/each}
	</div>
</div>

<style>
	.color-picker {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.color-controls {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.color-swatches {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.swatch-container {
		position: relative;
		width: 48px;
		height: 48px;
	}

	.color-input {
		position: absolute;
		width: 32px;
		height: 32px;
		padding: 0;
		border: 2px solid #0f3460;
		border-radius: 4px;
		cursor: pointer;
	}

	.color-input::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	.color-input::-webkit-color-swatch {
		border: none;
		border-radius: 2px;
	}

	.color-input.primary {
		top: 0;
		left: 0;
		z-index: 2;
	}

	.color-input.secondary {
		bottom: 0;
		right: 0;
		z-index: 1;
	}

	.swap-btn {
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

	.swap-btn:hover {
		background: #1a4a7e;
	}

	.swap-icon {
		font-size: 0.75rem;
	}

	.color-values {
		text-align: center;
	}

	.color-hex {
		font-size: 0.7rem;
		font-family: monospace;
		color: #888;
	}

	.palette {
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		max-width: 120px;
	}

	.palette-color {
		width: 20px;
		height: 20px;
		padding: 0;
		border: 2px solid transparent;
		border-radius: 2px;
		cursor: pointer;
	}

	.palette-color:hover {
		border-color: #fff;
	}

	.palette-color.active {
		border-color: #fff;
		box-shadow: 0 0 0 1px #0f3460;
	}
</style>
