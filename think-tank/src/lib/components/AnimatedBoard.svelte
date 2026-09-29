<script lang="ts" module>
	export type BoardVariant = 'queens' | 'sudoku';
</script>

<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import Crown from './Crown.svelte';

	let {
		variant = 'queens',
		delay = 0
	}: {
		variant?: BoardVariant;
		delay?: number;
	} = $props();

	const QUEENS_LAYOUT = [
		'AAABBBC',
		'DABBBCC',
		'DABBCCF',
		'DAAECCF',
		'DEEEECF',
		'DDEFFFF',
		'DEEGGGG'
	];
	const QUEEN_COLUMN = [1, 3, 5, 0, 2, 4, 6];

	const SUDOKU = [
		'534678912',
		'672195348',
		'198342567',
		'859761423',
		'426853791',
		'713924856',
		'961537284',
		'287419635',
		'345286179'
	];

	const DESCRIPTION: Record<BoardVariant, string> = {
		queens: 'A solved Queens puzzle: seven queens, one in every row, column and colored region',
		sudoku: 'A solved Sudoku: every row, column and box holds the numbers 1 to 9 once'
	};

	const LEAVE_MS = 500;

	function rand(seed: number) {
		let t = (seed + 0x6d2b79f5) | 0;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	function scatter(i: number, cols: number) {
		const reach = cols / 7;
		return {
			x: Math.round((rand(i * 4 + 1) - 0.5) * 720 * reach),
			y: Math.round((rand(i * 4 + 2) - 0.5) * 560 * reach),
			turn: Math.round((rand(i * 4 + 3) - 0.5) * 140),
			delay: Math.round(rand(i * 4 + 4) * 420)
		};
	}

	type Tile = ReturnType<typeof scatter> & {
		color: string;
		queen: boolean;
		digit: string;
		given: boolean;
		markDelay: number;
	};

	const BOARDS: Record<BoardVariant, { cols: number; tiles: Tile[] }> = {
		queens: {
			cols: 7,
			tiles: QUEENS_LAYOUT.flatMap((row, r) =>
				[...row].map((letter, c) => ({
					...scatter(r * 7 + c, 7),
					color: `var(--region-${letter.charCodeAt(0) - 64})`,
					queen: QUEEN_COLUMN[r] === c,
					digit: '',
					given: false,
					markDelay: 1350 + r * 110
				}))
			)
		},
		sudoku: {
			cols: 9,
			tiles: SUDOKU.flatMap((row, r) =>
				[...row].map((digit, c) => {
					const i = r * 9 + c;
					const given = rand(i * 4 + 5) < 0.4;
					const shaded = (Math.floor(r / 3) + Math.floor(c / 3)) % 2;
					return {
						...scatter(i, 9),
						color: shaded ? 'var(--region-4)' : 'var(--region-1)',
						queen: false,
						digit,
						given,
						markDelay: given ? 1300 : 1500 + r * 90 + c * 12
					};
				})
			)
		}
	};

	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce');

	let leaving = $state(false);
	let switched = $state(false);

	let board = $derived(BOARDS[variant]);
	let other = $derived<BoardVariant>(variant === 'queens' ? 'sudoku' : 'queens');

	function switchPuzzle() {
		if (leaving) return;

		const swap = () => {
			variant = other;
			switched = true;
			leaving = false;
		};

		if (reducedMotion.current) return swap();
		leaving = true;
		setTimeout(swap, LEAVE_MS);
	}
</script>

<button
	type="button"
	class="board"
	class:leaving
	style:--cols={board.cols}
	style:--start="{switched ? 0 : delay}ms"
	aria-label="{DESCRIPTION[variant]}. Show {other === 'queens' ? 'Queens' : 'a Sudoku'} instead."
	title="Click to switch puzzle"
	onclick={switchPuzzle}
>
	{#key variant}
		{#each board.tiles as tile, i (i)}
			<span
				class="tile"
				style:background={tile.color}
				style:--x="{tile.x}%"
				style:--y="{tile.y}%"
				style:--turn="{tile.turn}deg"
				style:--delay="{tile.delay}ms"
			>
				{#if tile.queen}
					<svg class="mark queen" style:--delay="{tile.markDelay}ms" viewBox="0 0 24 24">
						<Crown />
					</svg>
				{:else if tile.digit}
					<span class="mark digit" class:given={tile.given} style:--delay="{tile.markDelay}ms">
						{tile.digit}
					</span>
				{/if}
			</span>
		{/each}
	{/key}
</button>

<style>
	.board {
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		align-items: stretch;
		gap: clamp(3px, 0.7vw, 5px);
		width: min(100%, 27rem, 68svh);
		aspect-ratio: 1;
		margin-inline: auto;
		padding: 0;
		border: 0;
		border-radius: 8px;
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
		container-type: inline-size;
		-webkit-tap-highlight-color: transparent;
		transition: transform 300ms var(--ease-out);
	}

	@media (hover: hover) {
		.board:hover {
			transform: scale(1.015);
		}
	}

	.tile {
		display: grid;
		align-content: center;
		place-items: center;
		border-radius: calc(clamp(4px, 0.9vw, 7px) * 7 / var(--cols));
		animation: settle 1300ms var(--ease-out) calc(var(--start) + var(--delay)) both;
	}

	.leaving .tile {
		animation: scatter 450ms cubic-bezier(0.5, 0, 0.75, 0) calc(var(--delay) * 0.12) forwards;
	}

	.mark {
		animation: appear 480ms var(--ease-spring) calc(var(--start) + var(--delay)) both;
	}

	.queen {
		width: 54%;
		fill: var(--queen);
	}

	.digit {
		color: var(--accent);
		font-size: 5.2cqi;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.digit.given {
		color: var(--ink);
		font-weight: 700;
	}

	@keyframes settle {
		from {
			transform: translate(var(--x), var(--y)) rotate(var(--turn)) scale(0.72);
			opacity: 0;
		}
		30% {
			opacity: 1;
		}
		to {
			transform: none;
			opacity: 1;
		}
	}

	@keyframes scatter {
		to {
			transform: translate(var(--x), var(--y)) rotate(var(--turn)) scale(0.72);
			opacity: 0;
		}
	}

	@keyframes appear {
		from {
			transform: scale(0.2);
			opacity: 0;
		}
		to {
			transform: none;
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tile,
		.mark {
			animation: none;
		}
	}
</style>
