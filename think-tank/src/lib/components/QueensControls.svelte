<script lang="ts">
	import type { QueensGame } from '$lib/games/queens.svelte';
	import Crown from './Crown.svelte';
	import ToolButton from './ToolButton.svelte';

	let { game }: { game: QueensGame } = $props();

	let hint = $derived(game.hint);
	let spoken = $derived(!hint ? '' : hint.kind === 'mistake' ? hint.message : hint.step.message);
</script>

<div class="tools" data-enter>
	<ToolButton icon="undo" label="Undo" disabled={!game.canUndo} onclick={() => game.undo()} />
	<ToolButton icon="clear" label="Clear" disabled={!game.canClear} onclick={() => game.clear()} />
	<ToolButton
		icon="cross"
		label="Cross"
		pressed={game.autoCross}
		onclick={() => (game.autoCross = !game.autoCross)}
	/>
	<ToolButton icon="hint" label="Hint" onclick={() => game.showHint()} />
</div>

<ul class="legend" aria-label="How to play" data-enter>
	<li>
		<span class="sample" aria-hidden="true">×</span>
		<span class="how"><strong>Tap once</strong> to mark</span>
	</li>
	<li>
		<span class="sample" aria-hidden="true">
			<svg viewBox="0 0 24 24"><Crown /></svg>
		</span>
		<span class="how"><strong>Tap twice</strong> for a queen</span>
	</li>
</ul>

<p class="visually-hidden" aria-live="polite">{spoken}</p>

<style>
	.tools {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.25rem;
	}

	.legend {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.7rem;
	}

	.sample {
		display: grid;
		flex: none;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-s);
		background: var(--queens-1);
		color: var(--ink);
		font-size: 1.25rem;
		line-height: 1;
	}

	.sample svg {
		width: 56%;
		fill: var(--queen);
	}

	.how {
		color: var(--ink-soft);
		font-size: var(--step--1);
		line-height: 1.35;
	}

	strong {
		display: block;
		color: var(--ink);
		font-weight: 600;
	}
</style>
