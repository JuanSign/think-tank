<script lang="ts">
	import PuzzleScreen from '$lib/components/PuzzleScreen.svelte';
	import QueensBoard from '$lib/components/QueensBoard.svelte';
	import QueensControls from '$lib/components/QueensControls.svelte';

	const size = 7;
</script>

<PuzzleScreen
	title="Queens"
	level="{size} × {size}"
	rules="Place one queen in each row, column and colored region. No two queens can touch."
>
	<QueensBoard {size} />

	{#snippet controls()}
		<QueensControls />
	{/snippet}
</PuzzleScreen>
