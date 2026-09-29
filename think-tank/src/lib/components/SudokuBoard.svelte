<script lang="ts">
	import BoardFrame from './BoardFrame.svelte';

	const nine = Array.from({ length: 9 }, (_, i) => i);
	const CENTER = 4;
</script>

<BoardFrame label="Sudoku board">
	<div class="boxes">
		{#each nine as box (box)}
			<div
				class="box"
				data-seed={box === CENTER ? '' : undefined}
				data-side={box === CENTER ? undefined : ''}
				data-dx={(box % 3) - 1}
				data-dy={Math.floor(box / 3) - 1}
			>
				<div class="cell-grid" style:--n={3}>
					{#each nine as cell (cell)}
						<span class="cell"></span>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</BoardFrame>

<style>
	.boxes {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 2cqi;
	}

	.box {
		container-type: inline-size;
	}
</style>
