<script lang="ts" module>
	import { CLIPPED, UNCLIPPED, type ChartEntrance } from '$lib/attachments/story';

	const FOCUSED = 15;
	const RECOVERY = 23;
	const RESUMED = 22;

	export const enterRecovery: ChartEntrance = (timeline, figure) => {
		const part = (name: string) => figure.querySelector(`.${name}`);
		const minutes = part('minutes')!;
		const counter = { value: 0 };

		timeline
			.fromTo(part('focused'), { clipPath: CLIPPED }, { clipPath: UNCLIPPED, duration: 0.6 }, 0.3)
			.from(part('focused-label'), { opacity: 0, duration: 0.4 }, 0.35)
			.from(
				part('tick'),
				{ scaleY: 0, transformOrigin: '50% 100%', duration: 0.45, ease: 'back.out(2)' },
				0.8
			)
			.from(part('interrupted'), { opacity: 0, y: '0.5rem', duration: 0.4 }, 0.9)
			.fromTo(
				part('recovery'),
				{ clipPath: CLIPPED },
				{ clipPath: UNCLIPPED, duration: 1.4, ease: 'power1.inOut' },
				1.1
			)
			.from(part('lost'), { opacity: 0, y: '0.5rem', duration: 0.4 }, 1.1)
			.to(
				counter,
				{
					value: RECOVERY,
					duration: 1.4,
					ease: 'power1.inOut',
					onUpdate: () => {
						minutes.textContent = String(Math.round(counter.value));
					}
				},
				1.1
			)
			.fromTo(part('resumed'), { clipPath: CLIPPED }, { clipPath: UNCLIPPED, duration: 0.6 }, 2.5)
			.from(part('resumed-label'), { opacity: 0, duration: 0.4 }, 2.55);
	};
</script>

<script lang="ts">
	import ChartCard from './ChartCard.svelte';
</script>

<ChartCard caption="Time to get back to an interrupted task">
	{#snippet source()}Gloria Mark, interview in <cite>Gallup Business Journal</cite> (2006){/snippet}

	<div class="timeline" style:grid-template-columns="{FOCUSED}fr {RECOVERY}fr {RESUMED}fr">
		<span class="label focused-label">Focused</span>
		<span class="label interrupted">Interrupted</span>
		<span class="label resumed-label">Resumed</span>
		<span class="segment focused"></span>
		<span class="segment recovery"></span>
		<span class="segment resumed"></span>
		<span class="tick"></span>
		<p class="lost">
			<strong>~<span class="minutes">{RECOVERY}</span> min</strong>
			to get back on task
		</p>
	</div>
</ChartCard>

<style>
	.timeline {
		display: grid;
		column-gap: 4px;
		row-gap: 0.5rem;
	}

	.label {
		grid-row: 1;
		color: var(--ink-soft);
		font-size: var(--step--1);
		white-space: nowrap;
	}

	.segment {
		grid-row: 2;
		height: 2.25rem;
		border-radius: var(--radius-s);
		background: var(--region-2);
	}

	.focused-label,
	.focused {
		grid-column: 1;
	}

	.interrupted,
	.recovery {
		grid-column: 2;
	}

	.resumed-label,
	.resumed {
		grid-column: 3;
	}

	.interrupted {
		padding-left: 0.5rem;
		color: var(--accent);
		font-weight: 600;
	}

	.recovery {
		background: repeating-linear-gradient(-45deg, var(--line) 0 2px, transparent 2px 8px);
		box-shadow: inset 0 0 0 1px var(--line);
	}

	.tick {
		grid-column: 2;
		grid-row: 1 / 3;
		justify-self: start;
		width: 3px;
		margin-left: -3.5px;
		border-radius: 2px;
		background: var(--accent);
	}

	.lost {
		grid-column: 2 / 4;
		grid-row: 3;
		padding-top: 0.25rem;
		color: var(--ink-soft);
		font-size: var(--step--1);
	}

	.lost strong {
		display: block;
		color: var(--accent);
		font-size: var(--step-2);
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
	}
</style>
