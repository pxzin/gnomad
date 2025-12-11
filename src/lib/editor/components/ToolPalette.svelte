<script lang="ts">
	import type { EditorStore } from '../state/editor.svelte.js';
	import type { EditorTool } from '../types.js';
	import { getToolInfo } from '../tools/types.js';

	interface Props {
		store: EditorStore;
	}

	let { store }: Props = $props();

	// All available drawing tools
	const availableTools: EditorTool[] = ['pencil', 'eraser', 'fill', 'picker'];

	const currentTool = $derived(store.state.currentTool);

	function selectTool(tool: EditorTool) {
		store.setTool(tool);
	}

	function getToolIcon(tool: EditorTool): string {
		const icons: Record<EditorTool, string> = {
			pencil: '\u270F',    // Pencil
			eraser: '\u2716',    // Eraser (X mark)
			fill: '\u25A0',      // Fill (square)
			picker: '\u25CE'     // Picker (target)
		};
		return icons[tool];
	}
</script>

<div class="tool-palette">
	{#each availableTools as tool}
		{@const info = getToolInfo(tool)}
		<button
			class="tool-btn"
			class:active={currentTool === tool}
			onclick={() => selectTool(tool)}
			title="{info.displayName} ({info.shortcut})"
		>
			<span class="tool-icon">{getToolIcon(tool)}</span>
		</button>
	{/each}
</div>

<style>
	.tool-palette {
		display: flex;
		gap: 0.25rem;
	}

	.tool-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		background: #0f3460;
		border: 1px solid #1a1a2e;
		color: #fff;
		cursor: pointer;
		border-radius: 4px;
		font-size: 1.1rem;
		transition: background-color 0.15s;
	}

	.tool-btn:hover {
		background: #1a4a7e;
	}

	.tool-btn.active {
		background: #1a4a7e;
		border-color: #fff;
	}

	.tool-icon {
		line-height: 1;
	}
</style>
