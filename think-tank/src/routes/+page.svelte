<script lang="ts">
	import { reveal } from '$lib/attachments/reveal';
	import AnimatedBoard from '$lib/components/AnimatedBoard.svelte';
	import type { PageProps } from './$types';

	type Letter = { char: string; at: number; hold: number };

	let { data }: PageProps = $props();

	const TYPING_STARTS = 250;
	const WORD_PAUSE = 70;

	const headline = 'Put your attention back together.';
	const factsTitle = 'Built for focus in a distracted world.';
	const puzzlesTitle = 'Choose a puzzle.';

	const screenTime = [
		{ period: '2004', seconds: 150, label: '2½ min' },
		{ period: '2012', seconds: 75, label: '75 sec' },
		{ period: '2016-21', seconds: 47, label: '47 sec' }
	];

	const sudokuCells = ['5', '', '3', '', '7', '', '8', '', '1'];
	const queensLayout = ['AABB', 'CAAB', 'CCDD', 'CDDD'];
	const queensColumn = [1, 3, 0, 2];
	const queensRegion: Record<string, number> = { A: 2, B: 1, C: 3, D: 4 };
	const emptyCells = Array.from({ length: 9 }, (_, i) => i);

	function typeOut(text: string) {
		const words: Letter[][] = [];
		let clock = TYPING_STARTS;
		let n = 0;

		for (const word of text.split(' ')) {
			const letters: Letter[] = [];
			for (const char of word) {
				const step = 30 + ((n++ * 17) % 31);
				letters.push({ char, at: clock, hold: step });
				clock += step;
			}
			letters[letters.length - 1].hold += WORD_PAUSE;
			clock += WORD_PAUSE;
			words.push(letters);
		}

		return { words, end: clock };
	}

	const { words: typedWords, end: TYPED_BY } = typeOut(headline);
</script>

{#snippet risingWords(text: string)}
	{#each text.split(' ') as word, i (i)}
		<span class="rise" style:--delay="{i * 90}ms">{word}</span>{' '}
	{/each}
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
				<span class="visually-hidden">{headline}</span>
				<span aria-hidden="true">
					{#each typedWords as word, w (w)}
						<span class="word"
							>{#each word as letter, l (l)}<span
									class="char"
									class:last={w === typedWords.length - 1 && l === word.length - 1}
									style:--at="{letter.at}ms"
									style:--hold="{letter.hold}ms">{letter.char}</span
								>{/each}</span
						>{' '}
					{/each}
				</span>
			</h1>
			<p class="lede">The world is built to distract you.<br />Learn to focus anyway.</p>
			<div class="actions">
				<a class="button" href="#puzzles">Choose a puzzle</a>
				<a class="text-link" href="#facts">Why puzzles help</a>
			</div>
		</div>
		<AnimatedBoard variant={data.board} delay={TYPED_BY + 400} />
	</div>
</section>

<section id="facts" class="container facts">
	<div class="facts-text" {@attach reveal()}>
		<h2>
			{@render risingWords(factsTitle)}
		</h2>
		<p class="rise" style:--delay="500ms">
			Most of the internet is built to break your focus. It rewards the endless scroll and trains
			us to move on before we’ve even started.
		</p>
		<p class="rise" style:--delay="700ms">
			A logic puzzle asks for something different. One challenge, clear rules, and zero
			shortcuts. You hold an idea in your mind, test it, learn from a mistake, and persist until
			the solution snaps into place.
		</p>
		<p class="rise closing" style:--delay="900ms">
			It’s a quiet space to rebuild the focus that the rest of the web strips away.
		</p>
	</div>

	<figure class="chart" {@attach reveal()}>
		<figcaption class="rise" style:--delay="150ms">
			Average time on one screen before switching
		</figcaption>
		<ul>
			{#each screenTime as row, i (row.period)}
				<li style:--i={i}>
					<span class="period">{row.period}</span>
					<span class="track">
						<span class="bar" style:width="{(row.seconds / 150) * 78}%"></span>
						<span class="value">{row.label}</span>
					</span>
				</li>
			{/each}
		</ul>
		<p class="source">Source: Gloria Mark, <cite>Attention Span</cite> (2023)</p>
	</figure>
</section>

<section id="puzzles" class="container puzzles">
	<div class="section-head" {@attach reveal()}>
		<h2>
			{@render risingWords(puzzlesTitle)}
		</h2>
		<p class="rise" style:--delay="300ms">
			Simple rules, no luck involved.<br />Take as long as you need.
		</p>
	</div>

	<ul class="puzzle-list">
		<li style:--i={0} {@attach reveal()}>
			<a class="puzzle" href="/sudoku">
				<div class="plate">
					<div class="mini mini-sudoku" aria-hidden="true">
						{#each sudokuCells as digit, i (i)}
							<span class:selected={i === 5} style:--n={i}>{digit}</span>
						{/each}
					</div>
				</div>
				<h3>Sudoku</h3>
				<p>Fill the grid so every row, column and box has the numbers 1 to 9 exactly once.</p>
				<span class="play">Play Sudoku</span>
			</a>
		</li>

		<li style:--i={1} {@attach reveal()}>
			<a class="puzzle" href="/queens">
				<div class="plate">
					<div class="mini mini-queens" aria-hidden="true">
						{#each queensLayout as row, r (r)}
							{#each [...row] as letter, c (c)}
								<span style:background="var(--region-{queensRegion[letter]})" style:--n={r + c}>
									{#if queensColumn[r] === c}
										<svg viewBox="0 0 24 24" style:--r={r}>
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

		<li class="puzzle soon" style:--i={2} {@attach reveal()}>
			<div class="plate">
				<div class="mini mini-empty" aria-hidden="true">
					{#each emptyCells as cell (cell)}
						<span style:--n={cell}></span>
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
		gap: clamp(3rem, 8vw, 5rem);
		align-items: center;
	}

	@media (min-width: 56rem) {
		.hero-inner {
			grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
		}
	}

	h1 {
		max-width: 11ch;
		font-size: min(var(--step-4), 11svh);
		line-height: 0.96;
		letter-spacing: -0.04em;
	}

	.char {
		--caret: 0.07em 0 0 var(--accent);

		opacity: 0;
		animation:
			type-in 0s var(--at) forwards,
			caret var(--hold) var(--at);
	}

	.char.last {
		animation:
			type-in 0s var(--at) forwards,
			caret-blink 1s var(--at) 3;
	}

	.lede {
		max-width: 30rem;
		margin-top: 1.5rem;
		color: var(--ink-soft);
		font-size: var(--step-1);
		line-height: 1.55;
	}

	.actions {
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

	h2 {
		font-size: var(--step-3);
		letter-spacing: -0.035em;
	}

	h2 .rise {
		display: inline-block;
	}

	:global([data-reveal='waiting']) .rise {
		opacity: 0;
	}

	:global([data-reveal='playing']) .rise {
		animation: rise 700ms var(--ease-out) calc(var(--offset, 0ms) + var(--delay)) both;
	}

	.facts {
		display: grid;
		gap: clamp(2.5rem, 6vw, 5rem);
		align-items: center;
	}

	@media (min-width: 56rem) {
		.facts {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}

	.facts-text h2 {
		max-width: 14ch;
	}

	.facts-text p {
		max-width: 36rem;
		margin-top: 1.25rem;
		color: var(--ink-soft);
	}

	.facts-text h2 + p {
		margin-top: 1.75rem;
	}

	.facts-text .closing {
		color: var(--ink);
		font-weight: 500;
	}

	.chart {
		--offset: 0ms;

		padding: clamp(1.5rem, 4vw, 2.25rem);
		border: 1px solid var(--line);
		border-radius: var(--radius-l);
		background: var(--surface);
	}

	@media (min-width: 56rem) {
		.chart {
			--offset: 800ms;
		}
	}

	.chart figcaption {
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.chart ul {
		display: grid;
		gap: 0.875rem;
		margin-top: 1.5rem;
		padding: 0;
		list-style: none;
	}

	.chart li {
		--bar-starts: calc(var(--offset) + 400ms + var(--i) * 500ms);

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

	.chart li:last-child .bar {
		background: var(--accent);
	}

	.chart li:last-child .value {
		font-weight: 700;
	}

	.source {
		margin-top: 1.5rem;
		color: var(--ink-soft);
		font-size: var(--step--1);
	}

	.chart:global([data-reveal='waiting']) {
		opacity: 0;
	}

	.chart:global([data-reveal='playing']) {
		animation: rise 700ms var(--ease-out) var(--offset) both;
	}

	:global([data-reveal='waiting']) .bar {
		clip-path: inset(0 100% 0 0);
	}

	:global([data-reveal='waiting']) :is(.value, .source) {
		opacity: 0;
	}

	:global([data-reveal='playing']) .bar {
		animation: grow 850ms var(--ease-out) var(--bar-starts) both;
	}

	:global([data-reveal='playing']) .value {
		animation: fade-in 350ms ease-out calc(var(--bar-starts) + 500ms) both;
	}

	:global([data-reveal='playing']) li:last-child .value {
		animation: pop 550ms var(--ease-spring) calc(var(--bar-starts) + 500ms) both;
	}

	:global([data-reveal='playing']) .source {
		animation: fade-in 500ms ease-out calc(var(--offset) + 2100ms) both;
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
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
		gap: 2.5rem clamp(1.25rem, 3vw, 2rem);
		padding: 0;
		list-style: none;
	}

	.puzzle-list > li {
		--card-delay: calc(250ms + var(--i) * 160ms);
		--board-delay: calc(var(--card-delay) + 450ms);
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

	.mini {
		display: grid;
		width: 44%;
	}

	.mini span {
		display: grid;
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

	.puzzle-list > li:global([data-reveal='waiting']) {
		opacity: 0;
	}

	.puzzle-list > li:global([data-reveal='playing']) {
		animation: slide-in 850ms var(--ease-out) var(--card-delay) both;
	}

	:global([data-reveal='playing']) .mini-sudoku span {
		animation: pop 450ms var(--ease-spring) calc(var(--board-delay) + var(--n) * 55ms) both;
	}

	:global([data-reveal='playing']) .mini-queens span {
		animation: fade-in 400ms ease-out calc(var(--board-delay) + var(--n) * 45ms) both;
	}

	:global([data-reveal='playing']) .mini-queens svg {
		animation: drop 500ms var(--ease-spring) calc(var(--board-delay) + 450ms + var(--r) * 110ms)
			both;
	}

	:global([data-reveal='playing']) .mini-empty span {
		animation: fade-in 400ms ease-out calc(var(--board-delay) + var(--n) * 60ms) both;
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

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.6);
		}
	}

	@keyframes grow {
		from {
			clip-path: inset(0 100% 0 0 round var(--radius-s));
		}
		to {
			clip-path: inset(0 0 0 0 round var(--radius-s));
		}
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(-2.5rem);
		}
	}

	@keyframes drop {
		from {
			opacity: 0;
			transform: translateY(-40%) scale(0.6);
		}
	}
</style>
