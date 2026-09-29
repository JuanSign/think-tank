<script lang="ts">
	import BoardFrame from './BoardFrame.svelte';

	const SEED_SIZE = 4;

	let { size = 7 }: { size?: number } = $props();

	let seedStart = $derived(Math.floor((size - SEED_SIZE) / 2));
	let cells = $derived(
		Array.from({ length: size * size }, (_, i) => {
			const row = Math.floor(i / size);
			const col = i % size;
			const dx = side(col);
			const dy = side(row);
			return { row, col, dx, dy, inSeed: dx === 0 && dy === 0 };
		})
	);

	function side(index: number) {
		if (index < seedStart) return -1;
		if (index >= seedStart + SEED_SIZE) return 1;
		return 0;
	}
</script>

<BoardFrame label="Queens board">
	<div class="cell-grid" style:--n={size}>
		{#each cells as cell, i (i)}
			<span
				class="cell"
				style:grid-area="{cell.row + 1} / {cell.col + 1}"
				data-side={cell.inSeed ? undefined : ''}
				data-dx={cell.dx}
				data-dy={cell.dy}
			></span>
		{/each}
		<span
			class="seed"
			data-seed
			style:grid-area="{seedStart + 1} / {seedStart + 1} / span {SEED_SIZE} / span {SEED_SIZE}"
		></span>
	</div>
</BoardFrame>

<style>
	.seed {
		aspect-ratio: auto;
		pointer-events: none;
	}
</style>
