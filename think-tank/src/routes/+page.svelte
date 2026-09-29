<script lang="ts">
	import { READING, story } from '$lib/attachments/story';
	import { typeOnce } from '$lib/attachments/type-once';
	import AnimatedBoard from '$lib/components/AnimatedBoard.svelte';
	import RecoveryChart, { enterRecovery } from '$lib/components/RecoveryChart.svelte';
	import ScreenTimeChart, { enterScreenTime } from '$lib/components/ScreenTimeChart.svelte';
	import WanderingChart, { enterWandering } from '$lib/components/WanderingChart.svelte';
	import { smoothScroll } from '$lib/smooth-scroll';
	import { typeOut, typeParagraphs, typeStory, type Typed } from '$lib/typing';
	import type { PageProps } from './$types';

	type Beat = ReturnType<typeof beat>;

	let { data }: PageProps = $props();

	$effect(smoothScroll);

	const TYPING_STARTS = 250;
	const LEDE_PAUSE = 300;

	const headline = 'Put your attention back together.';
	const typedHeadline = typeOut(headline, TYPING_STARTS);
	const TYPED_BY = typedHeadline.end;

	const switching = beat('Built for focus in a distracted world.', [
		'Most of the internet is built to break your focus. It rewards the endless scroll and trains us to move on before we’ve even started.'
	]);
	const recovery = beat('Every switch has a cost.', [
		'An interruption lasts seconds. Getting back to what you were doing takes far longer, usually after a detour through two other tasks.'
	]);
	const wandering = beat('Even without a ping, we drift.', [
		'Not every distraction is a notification. Left alone, our minds wander for almost half of our waking hours, and we tend to feel less happy when they do.'
	]);
	const closing = beat('A logic puzzle asks for something different.', [
		'One challenge, clear rules, and zero shortcuts. You hold an idea in your mind, test it, learn from a mistake, and persist until the solution snaps into place.',
		'It’s a quiet space to rebuild the focus that the rest of the web strips away.'
	]);

	const puzzlesTitle = 'Choose a puzzle.';
	const puzzlesLede = ['Simple rules, no luck involved.', 'Take as long as you need.'];
	const typedPuzzlesTitle = typeOut(puzzlesTitle);
	const typedPuzzlesLede = typeParagraphs(puzzlesLede, typedPuzzlesTitle.end + LEDE_PAUSE);

	const sudokuCells = ['5', '', '3', '', '7', '', '8', '', '1'];
	const queensLayout = ['AABB', 'CAAB', 'CCDD', 'CDDD'];
	const queensColumn = [1, 3, 0, 2];
	const queensRegion: Record<string, number> = { A: 2, B: 1, C: 3, D: 4 };
	const emptyCells = Array.from({ length: 9 }, (_, i) => i);

	function beat(title: string, paragraphs: string[]) {
		return { title, paragraphs, typedStory: typeStory(title, paragraphs) };
	}
</script>

{#snippet typed(text: string, { words }: Typed, final = true)}
	<span class="visually-hidden">{text}</span>
	<span aria-hidden="true">
		{#each words as word, w (w)}
			<span class="word"
				>{#each word as letter, l (l)}<span
						class="char"
						class:last={final && w === words.length - 1 && l === word.length - 1}
						style:--at="{letter.at}ms"
						style:--hold="{letter.hold}ms">{letter.char}</span
					>{/each}</span
			>{' '}
		{/each}
	</span>
{/snippet}

{#snippet beatText({ title, paragraphs, typedStory }: Beat, level: 'h2' | 'h3')}
	<div class="beat-text">
		<svelte:element this={level} class="beat-title">
			{@render typed(title, typedStory.title)}
		</svelte:element>
		{#each paragraphs as paragraph, i (i)}
			<p>{@render typed(paragraph, typedStory.body.blocks[i])}</p>
		{/each}
	</div>
{/snippet}

<svelte:head>
	<title>Think Tank!</title>
	<meta
		name="description"
		content="Calm logic puzzles like Sudoku and Queens, made for people who want their attention back."
	/>
</svelte:head>

<section class="hero" style:--typed-by="{TYPED_BY}ms">
	<div class="container hero-inner">
		<div class="hero-text">
			<h1>
				{@render typed(headline, typedHeadline)}
			</h1>
			<p class="lede">The world is built to distract you.<br />Learn to focus anyway.</p>
			<div class="actions">
				<a class="button" href="#puzzles">Choose a puzzle</a>
				<a class="text-link" href="#facts">Why puzzles help</a>
			</div>
		</div>
		<div class="hero-board">
			<AnimatedBoard variant={data.board} delay={TYPED_BY + 400} />
		</div>
	</div>
</section>

<section id="facts" class="container facts">
	<div class="beat" {@attach story(switching.typedStory, { enterChart: enterScreenTime })}>
		{@render beatText(switching, 'h2')}
		<ScreenTimeChart />
	</div>

	<div
		class="beat flip"
		{@attach story(recovery.typedStory, { pacing: READING, enterChart: enterRecovery })}
	>
		{@render beatText(recovery, 'h3')}
		<RecoveryChart />
	</div>

	<div
		class="beat"
		{@attach story(wandering.typedStory, { pacing: READING, enterChart: enterWandering })}
	>
		{@render beatText(wandering, 'h3')}
		<WanderingChart />
	</div>

	<div class="beat closing" {@attach story(closing.typedStory, { pacing: READING })}>
		{@render beatText(closing, 'h3')}
	</div>
</section>

<section
	id="puzzles"
	class="container puzzles"
	style:--cards-at="{typedPuzzlesTitle.end}ms"
	{@attach typeOnce()}
>
	<div class="section-head">
		<h2>{@render typed(puzzlesTitle, typedPuzzlesTitle, false)}</h2>
		<p>
			{@render typed(puzzlesLede[0], typedPuzzlesLede.blocks[0], false)}<br />
			{@render typed(puzzlesLede[1], typedPuzzlesLede.blocks[1])}
		</p>
	</div>

	<ul class="puzzle-list">
		<li style:--i={0}>
			<a class="puzzle" href="/sudoku">
				<div class="plate">
					<div class="mini mini-sudoku" aria-hidden="true">
						{#each sudokuCells as digit, i (i)}
							<span class:selected={i === 5}>{digit}</span>
						{/each}
					</div>
				</div>
				<h3>Sudoku</h3>
				<p>Fill the grid so every row, column and box has the numbers 1 to 9 exactly once.</p>
				<span class="play">Play Sudoku</span>
			</a>
		</li>

		<li style:--i={1}>
			<a class="puzzle" href="/queens">
				<div class="plate">
					<div class="mini mini-queens" aria-hidden="true">
						{#each queensLayout as row, r (r)}
							{#each [...row] as letter, c (c)}
								<span style:background="var(--region-{queensRegion[letter]})">
									{#if queensColumn[r] === c}
										<svg viewBox="0 0 24 24">
											<path d="M3.2 8.2 7.6 11.6 12 4.6l4.4 7 4.4-3.4-1.9 9.3H5.1z" />
											<rect x="5.1" y="18.6" width="13.8" height="2.2" rx="1.1" />
										</svg>
									{/if}
								</span>
							{/each}
						{/each}
					</div>
				</div>
				<h3>Queens</h3>
				<p>Place one queen in each row, column and colored region. No two queens can touch.</p>
				<span class="play">Play Queens</span>
			</a>
		</li>

		<li class="puzzle soon" style:--i={2}>
			<div class="plate">
				<div class="mini mini-empty" aria-hidden="true">
					{#each emptyCells as cell (cell)}
						<span></span>
					{/each}
				</div>
			</div>
			<h3>More on the way</h3>
			<p>New puzzles will join over time. Sudoku and Queens come first.</p>
		</li>
	</ul>
</section>

<style>
	.hero {
		display: grid;
		align-items: center;
		min-height: calc(100svh - var(--header-height));
		overflow: clip;
		padding-block: clamp(1.5rem, 5svh, 4rem);
	}

	.hero-inner {
		display: grid;
		grid-template-areas: 'headline' 'lede' 'board' 'actions';
	}

	.hero-text {
		display: contents;
	}

	.hero-board {
		grid-area: board;
		justify-self: start;
		width: min(100%, 16rem, 30svh);
		margin-top: 2rem;
	}

	@media (min-width: 56rem) {
		.hero-inner {
			grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
			grid-template-rows: 1fr auto auto auto 1fr;
			grid-template-areas: '. board' 'headline board' 'lede board' 'actions board' '. board';
			column-gap: clamp(3rem, 8vw, 5rem);
		}

		.hero-board {
			align-self: center;
			justify-self: stretch;
			width: auto;
			margin-top: 0;
		}
	}

	h1 {
		grid-area: headline;
		max-width: 11ch;
		font-size: min(var(--step-4), 11svh);
		line-height: 0.96;
		letter-spacing: -0.04em;
	}

	.char {
		--caret: 0.07em 0 0 var(--accent);
	}

	h1 .char,
	.puzzles:global([data-typing='play']) .char {
		opacity: 0;
		animation:
			type-in 0s var(--at) forwards,
			caret var(--hold) var(--at);
	}

	h1 .char.last,
	.puzzles:global([data-typing='play']) .char.last {
		animation:
			type-in 0s var(--at) forwards,
			caret-blink 1s var(--at) 3;
	}

	.lede {
		grid-area: lede;
		max-width: 30rem;
		margin-top: 1.5rem;
		color: var(--ink-soft);
		font-size: var(--step-1);
		line-height: 1.55;
	}

	.actions {
		grid-area: actions;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem 1.75rem;
		margin-top: 2.25rem;
	}

	.hero .lede {
		animation: rise 700ms var(--ease-out) calc(var(--typed-by) - 250ms) both;
	}

	.hero .actions {
		animation: rise 700ms var(--ease-out) calc(var(--typed-by) - 100ms) both;
	}

	.facts,
	.puzzles {
		--section-top: clamp(6rem, 10vw, 8rem);

		scroll-margin-top: calc(-1 * var(--section-top));
		padding-top: var(--section-top);
	}

	h2,
	.beat-title {
		font-size: var(--step-3);
		letter-spacing: -0.035em;
	}

	.facts {
		display: grid;
		gap: clamp(6rem, 10vw, 8rem);
	}

	.beat {
		display: grid;
		gap: clamp(2.5rem, 6vw, 5rem);
		align-items: start;
	}

	@media (min-width: 56rem) {
		.beat {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}

		.beat.flip .beat-text {
			order: 2;
		}

		.beat.closing {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.beat-title {
		max-width: 14ch;
	}

	.beat-text p {
		max-width: 36rem;
		margin-top: 1.25rem;
		color: var(--ink-soft);
	}

	.beat-title + p {
		margin-top: 1.75rem;
	}

	.closing .beat-text {
		text-align: center;
	}

	.closing .beat-title,
	.closing p {
		margin-inline: auto;
	}

	.closing .beat-title {
		max-width: 24ch;
	}

	.closing .beat-text p {
		max-width: 44rem;
		text-wrap: balance;
	}

	.closing p:last-child {
		color: var(--ink);
		font-weight: 500;
	}

	.beat-text:global([data-typing]) .char:not(:global([data-typed])) {
		opacity: 0;
	}

	.beat-text .char:global([data-caret]) {
		animation: caret-blink 1s 3;
	}

	.puzzles {
		padding-bottom: clamp(3rem, 6vw, 5rem);
	}

	.section-head {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 0.75rem 2rem;
		margin-bottom: clamp(2rem, 4vw, 3rem);
	}

	.section-head p {
		max-width: 22rem;
		color: var(--ink-soft);
	}

	.puzzle-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.5rem 1rem;
		padding: 0;
		list-style: none;
	}

	@media (min-width: 40rem) {
		.puzzle-list {
			grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
			gap: 2.5rem clamp(1.25rem, 3vw, 2rem);
		}
	}

	.puzzles:global([data-typing='waiting']) :is(.char, .puzzle-list > li) {
		opacity: 0;
	}

	.puzzles:global([data-typing='play']) .puzzle-list > li {
		animation: rise 700ms var(--ease-out) calc(var(--cards-at) + var(--i) * 140ms) both;
	}

	.puzzle {
		display: block;
		color: inherit;
		text-decoration: none;
		border-radius: var(--radius-l);
	}

	.puzzle:focus-visible {
		outline-offset: 6px;
	}

	.plate {
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 4 / 3;
		max-height: 32svh;
		margin-bottom: 1.25rem;
		border-radius: var(--radius-l);
		background: var(--paper-deep);
		transition: background-color 200ms;
	}

	.puzzle h3 {
		font-size: var(--step-2);
		letter-spacing: -0.03em;
	}

	.puzzle p {
		max-width: 32ch;
		margin-top: 0.5rem;
		color: var(--ink-soft);
	}

	.play {
		display: inline-block;
		margin-top: 0.875rem;
		color: var(--accent);
		font-weight: 600;
		text-decoration: underline;
		text-decoration-color: transparent;
		text-decoration-thickness: 2px;
		text-underline-offset: 0.22em;
		transition: text-decoration-color 160ms;
	}

	a.puzzle:hover .plate {
		background: var(--accent-soft);
	}

	a.puzzle:hover .play {
		text-decoration-color: currentColor;
	}

	.soon h3 {
		color: var(--ink-soft);
	}

	@media (width < 40rem) {
		.plate {
			margin-bottom: 0.75rem;
		}

		.puzzle h3 {
			font-size: var(--step-1);
		}

		.puzzle p,
		.play {
			display: none;
		}

		.mini {
			width: 60%;
		}
	}

	.mini {
		display: grid;
		width: 44%;
	}

	.mini span {
		display: grid;
		align-content: center;
		place-items: center;
		aspect-ratio: 1;
	}

	.mini-sudoku {
		grid-template-columns: repeat(3, 1fr);
		gap: 4px;
	}

	.mini-sudoku span {
		border-radius: var(--radius-s);
		background: var(--surface);
		font-size: clamp(1.125rem, 2vw, 1.5rem);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.mini-sudoku .selected {
		box-shadow: inset 0 0 0 2.5px var(--accent);
	}

	a.puzzle:hover .mini-sudoku .selected {
		background: var(--accent);
	}

	.mini-queens {
		grid-template-columns: repeat(4, 1fr);
		gap: 3px;
	}

	.mini-queens span {
		border-radius: 5px;
	}

	.mini-queens svg {
		width: 56%;
		fill: var(--queen);
	}

	.mini-empty {
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}

	.mini-empty span {
		border: 2px dashed var(--line);
		border-radius: var(--radius-s);
	}

	@keyframes type-in {
		to {
			opacity: 1;
		}
	}

	@keyframes caret {
		from,
		to {
			box-shadow: var(--caret);
		}
	}

	@keyframes caret-blink {
		0%,
		50% {
			box-shadow: var(--caret);
		}
		50.01%,
		100% {
			box-shadow: none;
		}
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(0.75rem);
		}
	}
</style>
