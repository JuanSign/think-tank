<script lang="ts">
	import ToolButton from './ToolButton.svelte';

	const digits = Array.from({ length: 9 }, (_, i) => i + 1);
</script>

<div class="tools" data-enter>
	<ToolButton icon="undo" label="Undo" />
	<ToolButton icon="erase" label="Erase" />
	<ToolButton icon="notes" label="Notes" pressed={false} />
	<ToolButton icon="hint" label="Hint" />
</div>

<div class="pad" role="group" aria-label="Numbers" data-enter>
	{#each digits as digit (digit)}
		<button type="button" class="digit">{digit}</button>
	{/each}
</div>

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
