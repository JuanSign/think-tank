<script lang="ts">
	import type { SudokuGame } from '$lib/games/sudoku.svelte';
	import ToolButton from './ToolButton.svelte';

	let { game }: { game: SudokuGame } = $props();

	const digits = Array.from({ length: 9 }, (_, i) => i + 1);

	let stage = $derived(game.hintStage);

	let spoken = $derived.by(() => {
		const hint = game.hint;
		if (!hint) return '';
		if (hint.kind === 'mistake') return hint.message;
		const step = hint.steps[game.frame];
		const digit = hint.steps.at(-1)?.place?.digit;
		return step ? step.message : `It's ${digit === 8 ? 'an' : 'a'} ${digit}.`;
	});
</script>

<div class="tools" data-enter>
	<ToolButton icon="undo" label="Undo" disabled={!game.canUndo} onclick={() => game.undo()} />
	<ToolButton icon="erase" label="Erase" onclick={() => game.erase()} />
	<ToolButton
		icon="notes"
		label="Notes"
		pressed={game.noting}
		onclick={() => (game.noting = !game.noting)}
	/>
	<ToolButton
		icon="hint"
		label="Hint"
		badge={stage && `${stage.at}/${stage.of}`}
		beckon={!!stage && stage.at < stage.of}
		onclick={() => game.showHint()}
	/>
</div>

<div class="pad" role="group" aria-label="Numbers" data-enter>
	{#each digits as digit (digit)}
		<button type="button" class="digit" onclick={() => game.enter(digit)}>{digit}</button>
	{/each}
</div>

<p class="visually-hidden" aria-live="polite">{spoken}</p>

<style>
	.tools {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.25rem;
	}

	.pad {
		display: grid;
		grid-template-columns: repeat(9, minmax(0, 1fr));
		gap: 0.3rem;
	}

	.digit {
		height: 3.25rem;
		padding: 0;
		border: 0;
		border-radius: var(--radius-m);
		background: var(--surface);
		color: var(--ink);
		font-size: var(--step-2);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		cursor: pointer;
		transition:
			background-color 160ms,
			color 160ms,
			transform 160ms var(--ease-out);
	}

	.digit:hover {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.digit:active {
		transform: scale(0.96);
	}

	@media (min-width: 56rem) {
		.pad {
			grid-template-columns: repeat(3, 1fr);
			gap: 0.5rem;
		}

		.digit {
			height: auto;
			aspect-ratio: 1.15;
			font-size: var(--step-3);
		}
	}
</style>
