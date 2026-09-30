<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, children }: { label: string; children: Snippet } = $props();
</script>

<div class="board" role="group" aria-label={label}>
	{@render children()}
</div>

<style>
	.board {
		container-type: inline-size;
		width: 100%;
	}

	.board :global(.cell) {
		background: var(--surface);
	}

	.board :global([data-seed]) {
		view-transition-name: portal-seed;
	}
</style>
