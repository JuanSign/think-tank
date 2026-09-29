<script lang="ts" module>
	import { CLIPPED, UNCLIPPED, type ChartEntrance } from '$lib/attachments/story';

	export const enterScreenTime: ChartEntrance = (timeline, figure) => {
		const values = [...figure.querySelectorAll('.value')];
		const punchline = values.pop()!;

		timeline
			.fromTo(
				figure.querySelectorAll('.bar'),
				{ clipPath: CLIPPED },
				{ clipPath: UNCLIPPED, duration: 0.7, stagger: 0.25 },
				0.3
			)
			.from(values, { opacity: 0, duration: 0.35, stagger: 0.25 }, 0.65)
			.from(punchline, { opacity: 0, scale: 0.6, duration: 0.55, ease: 'back.out(2.5)' }, 1.15);
	};
</script>

<script lang="ts">
	import ChartCard from './ChartCard.svelte';

	const rows = [
		{ period: '2004', seconds: 150, label: '2½ min' },
		{ period: '2012', seconds: 75, label: '75 sec' },
		{ period: '2016-21', seconds: 47, label: '47 sec' }
	];
</script>

<ChartCard caption="Average time on one screen before switching">
	{#snippet source()}Gloria Mark, <cite>Attention Span</cite> (2023){/snippet}

	<ul>
		{#each rows as row (row.period)}
			<li>
				<span class="period">{row.period}</span>
				<span class="track">
					<span class="bar" style:width="{(row.seconds / 150) * 78}%"></span>
					<span class="value">{row.label}</span>
				</span>
			</li>
		{/each}
	</ul>
</ChartCard>

<style>
	ul {
		display: grid;
		gap: 0.875rem;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: 4.75rem 1fr;
		align-items: center;
	}

	.period {
		color: var(--ink-soft);
		font-size: var(--step--1);
		font-variant-numeric: tabular-nums;
	}

	.track {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.bar {
		height: 2.25rem;
		border-radius: var(--radius-s);
		background: var(--region-2);
	}

	.value {
		font-size: var(--step--1);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	li:last-child .bar {
		background: var(--accent);
	}

	li:last-child .value {
		font-weight: 700;
	}
</style>
