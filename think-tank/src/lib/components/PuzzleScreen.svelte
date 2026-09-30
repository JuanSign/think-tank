<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { backOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import { page } from '$app/state';
	import { enterScreen } from '$lib/attachments/enter-screen';
	import { fallApart } from '$lib/fall-apart';
	import type { Clock } from '$lib/games/clock.svelte';
	import type { Difficulty } from '$lib/puzzles/common';
	import { revealBoard, type Reveal } from '$lib/reveal';
	import Icon from './Icon.svelte';
	import LevelMenu from './LevelMenu.svelte';

	type Game = {
		clock: Clock;
		won: boolean;
		hint: unknown;
		load: (difficulty: Difficulty) => Promise<void>;
	};

	let {
		title,
		rules,
		game,
		controls,
		children
	}: {
		title: string;
		rules: string;
		game: Game;
		controls: Snippet;
		children: Snippet;
	} = $props();

	let clock = $derived(game.clock);
	let won = $derived(game.won);
	let screen: HTMLElement;
	let difficulty = $state<Difficulty>('medium');
	let arrived = $state(false);
	let ready = $state(false);
	let settled = $state(false);
	let reveal: Reveal | undefined;
	let ticket = 0;

	let time = $derived(format(clock.seconds));

	$effect(() => () => clock.stop());

	$effect(() => () => reveal?.kill());

	$effect(() => {
		const level = difficulty;
		untrack(() => refresh(level));
	});

	$effect(() => {
		if (arrived && ready) (reveal ??= revealBoard(screen)).show();
	});

	async function refresh(level: Difficulty) {
		const current = ++ticket;
		ready = false;
		await hideBoard();
		await game.load(level);
		if (current === ticket) ready = true;
	}

	function arrive() {
		arrived = true;
	}

	function hideBoard() {
		game.hint = undefined;
		return reveal?.hide() ?? Promise.resolve();
	}

	$effect(() => {
		if (!won) return;
		const pieces = [
			...screen.querySelectorAll<HTMLElement>(
				'.controls button, .controls li, .status button, .rules'
			)
		];
		const restore = fallApart(pieces, () => (settled = true));
		return () => {
			settled = false;
			restore();
		};
	});

	function format(total: number) {
		const hours = Math.floor(total / 3600);
		const minutes = Math.floor((total % 3600) / 60);
		const seconds = String(total % 60).padStart(2, '0');
		if (!hours) return `${minutes}:${seconds}`;
		return `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`;
	}
</script>

<svelte:head>
	<title>{title} · Think Tank</title>
	<meta name="description" content={rules} />
</svelte:head>

<svelte:document onvisibilitychange={clock.sync} />

<div
	class="screen"
	bind:this={screen}
	{@attach enterScreen(page.url.pathname, { onarrive: arrive, beforeexit: hideBoard })}
>
	<div class="container inner">
		<header class="bar" data-enter>
			<a class="back" href="/#puzzles">
				<Icon name="back" />
				<span class="back-label">Puzzles</span>
			</a>

			<div class="title">
				<h1>{title}</h1>
				<LevelMenu bind:value={difficulty} />
			</div>

			<div class="status">
				<span class="timer" aria-label="Time">{time}</span>
				<button
					type="button"
					class="pause"
					aria-label={clock.paused ? 'Resume' : 'Pause'}
					disabled={!clock.running}
					onclick={clock.toggle}
				>
					<Icon name={clock.paused ? 'play' : 'pause'} />
				</button>
			</div>
		</header>

		<div class="play">
			<div class="board-slot">
				<div class="board-view" class:hidden={clock.paused} inert={clock.paused}>
					{@render children()}
				</div>
				{#if clock.paused}
					<div class="cover">
						<p>Paused</p>
						<button type="button" class="button" onclick={clock.toggle}>Resume</button>
					</div>
				{/if}
			</div>

			<aside class="panel" aria-label="Controls">
				<div class="deck">
					<div class="controls" inert={won || clock.paused}>
						{@render controls()}
					</div>
					{#if settled}
						<div class="again" in:scale={{ start: 0.85, duration: 380, easing: backOut }}>
							<button
								type="button"
								class="button"
								disabled={!ready}
								onclick={() => refresh(difficulty)}
							>
								{ready ? 'New Puzzle' : 'Shuffling…'}
							</button>
						</div>
					{/if}
				</div>
				<p class="rules" data-enter>{rules}</p>
			</aside>
		</div>
	</div>
</div>

<style>
	.screen {
		min-height: 100svh;
		overflow: clip;
		background: var(--paper-deep);
		touch-action: manipulation;
	}

	.inner {
		display: grid;
		grid-template-rows: auto 1fr;
		min-height: 100svh;
		padding-bottom: clamp(1.5rem, 4vw, 3rem);
	}

	.bar {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		min-height: 4rem;
	}

	.back,
	.pause {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 2.75rem;
		padding: 0 0.6rem;
		border: 0;
		border-radius: var(--radius-m);
		background: none;
		color: var(--ink-soft);
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color 160ms,
			color 160ms;
	}

	.back {
		justify-self: start;
		margin-left: -0.6rem;
	}

	.back:hover,
	.pause:hover:not(:disabled) {
		background: var(--surface);
		color: var(--ink);
	}

	.pause:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.title {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
	}

	h1 {
		font-size: var(--step-1);
		letter-spacing: -0.02em;
	}

	.status {
		display: flex;
		align-items: center;
		justify-self: end;
		gap: 0.75rem;
		margin-right: -0.6rem;
	}

	.timer {
		color: var(--ink);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.play {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-content: center;
		justify-items: center;
		gap: clamp(1.25rem, 3vw, 2rem);
	}

	.board-slot {
		position: relative;
		width: min(100%, 36rem);
	}

	.board-view.hidden {
		visibility: hidden;
	}

	.cover {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 1rem;
		border-radius: var(--radius-l);
		background: var(--surface);
	}

	.cover p {
		font-size: var(--step-2);
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	.panel {
		display: grid;
		gap: 1rem;
		width: min(100%, 36rem);
	}

	.deck {
		position: relative;
		display: grid;
		gap: inherit;
	}

	.controls {
		display: grid;
		gap: inherit;
	}

	.again {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
	}

	.rules {
		color: var(--ink-soft);
		font-size: var(--step--1);
		text-align: center;
		text-wrap: balance;
	}

	@media (width < 40rem) {
		.back-label {
			display: none;
		}
	}

	@media (min-width: 56rem) {
		.play {
			grid-template-columns: auto 19rem;
			align-items: center;
			justify-content: center;
			column-gap: clamp(2.5rem, 5vw, 4.5rem);
		}

		.board-slot {
			width: min(36rem, calc(100svh - 9rem));
		}

		.panel {
			width: 19rem;
			gap: 1.5rem;
		}
	}
</style>
