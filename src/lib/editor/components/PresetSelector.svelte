<script lang="ts">
	import type { EditorStore } from '../state/editor.svelte.js';
	import type { AssetPreset } from '../types.js';
	import {
		getPresetsGroupedByCategory,
		getCategoryDisplayName,
		getCategories,
		createAssetFromPreset
	} from '../io/presets.js';

	interface Props {
		store: EditorStore;
	}

	let { store }: Props = $props();

	let showDropdown = $state(false);
	let assetName = $state('');

	const presetsByCategory = getPresetsGroupedByCategory();
	const categories = getCategories();

	function handleNewAsset(preset: AssetPreset) {
		// Use preset name as default if no custom name provided
		const name = assetName.trim() || preset;
		const asset = createAssetFromPreset(preset, name);
		store.newAsset(asset);
		showDropdown = false;
		assetName = '';
	}

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function closeDropdown() {
		showDropdown = false;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.preset-selector')) {
			closeDropdown();
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="preset-selector">
	<button class="new-asset-btn" onclick={toggleDropdown}>
		New Asset
		<span class="dropdown-arrow">{showDropdown ? '\u25B2' : '\u25BC'}</span>
	</button>

	{#if showDropdown}
		<div class="dropdown">
			<div class="name-input">
				<label for="asset-name">Asset Name:</label>
				<input
					id="asset-name"
					type="text"
					bind:value={assetName}
					placeholder="untitled"
				/>
			</div>

			<div class="presets-list">
				{#each categories as category}
					{@const presets = presetsByCategory.get(category) ?? []}
					{#if presets.length > 0}
						<div class="category">
							<div class="category-header">{getCategoryDisplayName(category)}</div>
							{#each presets as preset}
								<button
									class="preset-item"
									onclick={() => handleNewAsset(preset.name)}
								>
									<span class="preset-name">{preset.name}</span>
									<span class="preset-size">{preset.width}x{preset.height}</span>
								</button>
							{/each}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.preset-selector {
		position: relative;
	}

	.new-asset-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #0f3460;
		border: 1px solid #1a1a2e;
		color: #fff;
		cursor: pointer;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.new-asset-btn:hover {
		background: #1a4a7e;
	}

	.dropdown-arrow {
		font-size: 0.6rem;
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		z-index: 100;
		min-width: 250px;
		max-height: 400px;
		overflow-y: auto;
		background: #16213e;
		border: 1px solid #0f3460;
		border-radius: 4px;
		margin-top: 0.25rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.name-input {
		padding: 0.75rem;
		border-bottom: 1px solid #0f3460;
	}

	.name-input label {
		display: block;
		font-size: 0.75rem;
		color: #888;
		margin-bottom: 0.25rem;
	}

	.name-input input {
		width: 100%;
		padding: 0.5rem;
		background: #1a1a2e;
		border: 1px solid #0f3460;
		color: #fff;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.name-input input:focus {
		outline: none;
		border-color: #1a4a7e;
	}

	.presets-list {
		padding: 0.5rem 0;
	}

	.category {
		margin-bottom: 0.5rem;
	}

	.category-header {
		padding: 0.25rem 0.75rem;
		font-size: 0.7rem;
		text-transform: uppercase;
		color: #666;
		letter-spacing: 0.05em;
	}

	.preset-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: none;
		border: none;
		color: #fff;
		cursor: pointer;
		text-align: left;
		font-size: 0.875rem;
	}

	.preset-item:hover {
		background: #0f3460;
	}

	.preset-name {
		font-weight: 500;
	}

	.preset-size {
		font-size: 0.75rem;
		color: #888;
		font-family: monospace;
	}
</style>
