<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { enterScreen } from '$lib/attachments/enter-screen';
	import Icon from './Icon.svelte';

	let {
		title,
		level,
		rules,
		controls,
		children
	}: {
		title: string;
		level: string;
		rules: string;
		controls: Snippet;
		children: Snippet;
	} = $props();
</script>

<svelte:head>
	<title>{title} · Think Tank</title>
	<meta name="description" content={rules} />
</svelte:head>

<div class="screen" {@attach enterScreen(page.url.pathname)}>
	<div class="container inner">
		<header class="bar" data-enter>
			<a class="back" href="/#puzzles">
				<Icon name="back" />
				<span class="back-label">Puzzles</span>
			</a>

			<div class="title">
				<h1>{title}</h1>
				<span class="level">{level}</span>
			</div>

			<div class="status">
				<span class="timer" aria-label="Time">0:00</span>
				<button type="button" class="pause" aria-label="Pause">
					<Icon name="pause" />
				</button>
			</div>
		</header>

		<div class="play">
			<div class="board-slot">
				{@render children()}
			</div>

			<aside class="panel" aria-label="Controls">
				{@render controls()}
				<p class="rules" data-enter>{rules}</p>
			</aside>
		</div>
	</div>
</div>

<style>
	.screen {
		min-height: 100svh;
		background: var(--paper-deep);
	}

	.inner {
		display: grid;
		grid-template-rows: auto 1fr;
		min-height: 100svh;
		padding-bottom: clamp(1.5rem, 4vw, 3rem);
	}

	.bar {
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
	.pause:hover {
		background: var(--surface);
		color: var(--ink);
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

	.level {
		color: var(--ink-soft);
		font-size: var(--step--1);
		font-weight: 500;
	}

	.status {
		display: flex;
		align-items: center;
		justify-self: end;
		gap: 0.25rem;
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
		width: min(100%, 36rem);
	}

	.panel {
		display: grid;
		gap: 1rem;
		width: min(100%, 36rem);
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
