<script lang="ts" module>
	import type { ChartEntrance } from '$lib/attachments/story';

	const SHARE = 47;

	export const enterWandering: ChartEntrance = (timeline, figure) => {
		const percent = figure.querySelector('.percent')!;
		const counter = { value: 0 };

		timeline
			.from(figure.querySelectorAll('.tile'), { opacity: 0, duration: 0.4, stagger: 0.004 }, 0.3)
			.from(
				figure.querySelectorAll('.fill'),
				{ scale: 0, duration: 0.45, ease: 'back.out(2.5)', stagger: 0.025 },
				0.7
			)
			.from(figure.querySelector('.share'), { opacity: 0, y: '0.75rem', duration: 0.5 }, 0.7)
			.to(
				counter,
				{
					value: SHARE,
					duration: 1.2,
					ease: 'none',
					onUpdate: () => {
						percent.textContent = String(Math.round(counter.value));
					}
				},
				0.7
			);
	};
</script>

<script lang="ts">
	import ChartCard from './ChartCard.svelte';

	const tiles = Array.from({ length: 100 }, (_, i) => i);
</script>

<ChartCard caption="Share of waking hours our minds spend wandering">
	{#snippet source()}Killingsworth &amp; Gilbert, <cite>Science</cite> (2010){/snippet}

	<div class="wandering">
		<div class="grid" aria-hidden="true">
			{#each tiles as tile (tile)}
				<span class="tile">
					{#if tile < SHARE}<span class="fill"></span>{/if}
				</span>
			{/each}
		</div>
		<p class="share">
			<strong><span class="percent">{SHARE}</span>%</strong>
			of the time, our minds are somewhere other than what we’re doing
		</p>
	</div>
</ChartCard>

<style>
	.wandering {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1.5rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		gap: 3px;
		flex: 1 1 10rem;
		max-width: 12rem;
	}

	.tile {
		position: relative;
		aspect-ratio: 1;
		border-radius: 3px;
		background: var(--paper-deep);
	}

	.fill {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: var(--accent);
	}

	.share {
		flex: 1 1 9rem;
		color: var(--ink-soft);
		font-size: var(--step--1);
	}

	.share strong {
		display: block;
		color: var(--accent);
		font-size: var(--step-3);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.03em;
		line-height: 1;
	}
</style>
