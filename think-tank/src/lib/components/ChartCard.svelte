<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		caption,
		source,
		children
	}: {
		caption: string;
		source: Snippet;
		children: Snippet;
	} = $props();
</script>

<figure class="chart">
	<figcaption>{caption}</figcaption>
	<div class="body">
		{@render children()}
	</div>
	<p class="source">Source: {@render source()}</p>
</figure>

<style>
	.chart {
		padding: clamp(1.5rem, 4vw, 2.25rem);
		border: 1px solid var(--line);
		border-radius: var(--radius-l);
		background: var(--surface);
	}

	figcaption {
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.body {
		margin-top: 1.5rem;
	}

	.source {
		margin-top: 1.5rem;
		color: var(--ink-soft);
		font-size: var(--step--1);
	}
</style>
