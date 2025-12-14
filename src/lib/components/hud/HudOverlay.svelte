<script lang="ts">
	import type { GameState } from '$lib/game/state';
	import type { Command } from '$lib/game/commands';
	import type { BuildingType } from '$lib/components/building';
	import TopBar from './TopBar.svelte';
	import BottomBar from './BottomBar.svelte';
	import BuildPanel from './BuildPanel.svelte';

	interface Props {
		state: GameState;
		fps: number;
		buildMode: BuildingType | null;
		onCommand: (command: Command) => void;
		onSetBuildMode: (mode: BuildingType | null) => void;
	}

	let { state, fps, buildMode, onCommand, onSetBuildMode }: Props = $props();
</script>

<div class="hud-overlay">
	<TopBar {state} {fps} {onCommand} />
	<div class="side-panel">
		<BuildPanel {state} {buildMode} {onCommand} {onSetBuildMode} />
	</div>
	<BottomBar {state} {onCommand} />
</div>

<style>
	.hud-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 100;
	}

	.side-panel {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: auto;
	}
</style>
