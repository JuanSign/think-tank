<script lang="ts">
	import PuzzleScreen from '$lib/components/PuzzleScreen.svelte';
	import QueensBoard from '$lib/components/QueensBoard.svelte';
	import QueensControls from '$lib/components/QueensControls.svelte';
</script>

<PuzzleScreen
	title="Queens"
	level="7 × 7"
	rules="Place one queen in each row, column and colored region. No two queens can touch."
>
	<QueensBoard />

	{#snippet controls()}
		<QueensControls />
	{/snippet}
</PuzzleScreen>
