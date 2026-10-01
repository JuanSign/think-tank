<script lang="ts">
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import bricolage from '$lib/assets/fonts/bricolage-grotesque.woff2';
	import { isPuzzleRoute, portal } from '$lib/portal';
	import type { LayoutProps } from './$types';

	type PeekKey = 'home' | 'puzzles' | 'facts';

	let { children }: LayoutProps = $props();

	const COMPACT_AFTER = 24;
	const LANDED_AFTER = 150;
	const TAKEOVER = ['wheel', 'touchstart', 'keydown'] as const;

	const links: { key: PeekKey; href: string; label: string; icon: typeof joystick }[] = [
		{ key: 'puzzles', href: '/#puzzles', label: 'Puzzles', icon: joystick },
		{ key: 'facts', href: '/#facts', label: 'Facts', icon: questionMark }
	];

	let scrollY = $state(0);
	let ready = $state(false);
	let hovered = $state<PeekKey | null>(null);
	let focused = $state<PeekKey | null>(null);
	let labelWidth = $state({ home: 0, puzzles: 0, facts: 0 });

	let compact = $derived(scrollY > COMPACT_AFTER);
	let peek = $derived(hovered ?? focused);
	let inPuzzle = $derived(isPuzzleRoute(page.url.pathname));

	onNavigate(portal);

	$effect(() => {
		let frame = requestAnimationFrame(() => {
			frame = requestAnimationFrame(() => (ready = true));
		});
		return () => cancelAnimationFrame(frame);
	});

	function peekable(key: PeekKey) {
		return {
			onpointerenter: (event: PointerEvent) => {
				if (event.pointerType !== 'touch') hovered = key;
			},
			onpointerleave: () => {
				if (hovered === key) hovered = null;
			},
			onfocus: (event: FocusEvent) => {
				if ((event.currentTarget as HTMLElement).matches(':focus-visible')) focused = key;
			},
			onblur: () => {
				if (focused === key) focused = null;
			}
		};
	}

	let endSpotlight = () => {};

	function spotlightOnJump(event: MouseEvent) {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}

		const link = (event.target as Element).closest('a');
		if (!link?.hash || link.pathname !== location.pathname) return;

		const section = document.getElementById(decodeURIComponent(link.hash.slice(1)));
		if (!section?.matches('main > section')) return;

		endSpotlight();

		const spot = section;
		spot.dataset.spotlit = '';
		let timer = setTimeout(land, LANDED_AFTER);

		function onScroll() {
			clearTimeout(timer);
			timer = setTimeout(land, LANDED_AFTER);
		}

		function stopWaiting() {
			clearTimeout(timer);
			removeEventListener('scroll', onScroll);
			for (const type of TAKEOVER) removeEventListener(type, end);
		}

		function land() {
			stopWaiting();
			document.documentElement.dataset.spotlight = '';
			addEventListener('scroll', end, { once: true, passive: true });
		}

		function end() {
			stopWaiting();
			removeEventListener('scroll', end);
			delete spot.dataset.spotlit;
			delete document.documentElement.dataset.spotlight;
			endSpotlight = () => {};
		}

		endSpotlight = end;
		addEventListener('scroll', onScroll, { passive: true });
		for (const type of TAKEOVER) addEventListener(type, end, { passive: true });
	}

	function keepScrollManual() {
		history.scrollRestoration = 'manual';
	}
</script>

{#snippet joystick()}
	<svg viewBox="0 0 24 24">
		<circle cx="12" cy="6" r="2.75" />
		<path d="M12 8.75v5.75" />
		<rect x="4" y="14.5" width="16" height="5.5" rx="2.75" />
	</svg>
{/snippet}

{#snippet questionMark()}
	<svg viewBox="0 0 24 24">
		<path d="M8.5 8.75a3.5 3.5 0 1 1 5.1 3.12c-.95.48-1.6 1.3-1.6 2.38v.5" />
		<circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
	</svg>
{/snippet}

<svelte:window bind:scrollY onhashchange={keepScrollManual} />
<svelte:document onclick={spotlightOnJump} />

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preload" href={bricolage} as="font" type="font/woff2" crossorigin="anonymous" />
	<meta name="theme-color" content="#f2f6fb" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#0b1628" media="(prefers-color-scheme: dark)" />
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>

{#if !inPuzzle}
	<header id="home" class="site-header">
		<div
			class="bar"
			class:compact
			class:ready
			class:peeking={peek !== null}
			style:--peek-width="{peek ? labelWidth[peek] : 0}px"
		>
			<a
				class="brand"
				class:peek={peek === 'home'}
				href={compact ? '#home' : '/'}
				aria-label={compact ? 'Home, back to top' : undefined}
				{...peekable('home')}
			>
				<span class="mark" aria-hidden="true"
					><span></span><span></span><span></span><span></span></span
				>
				<span class="fold brand-name"><span>Think Tank</span></span>
				<span class="fold label" aria-hidden="true">
					<span bind:clientWidth={labelWidth.home}>Home</span>
				</span>
			</a>

			<span class="divider" aria-hidden="true"></span>

			<nav aria-label="Main">
				{#each links as link (link.key)}
					<a href={link.href} class:peek={peek === link.key} {...peekable(link.key)}>
						<span class="fold icon" aria-hidden="true">{@render link.icon()}</span>
						<span class="fold label">
							<span bind:clientWidth={labelWidth[link.key]}>{link.label}</span>
						</span>
					</a>
				{/each}
			</nav>
		</div>
	</header>
{/if}

<main id="main">
	{@render children()}
</main>

{#if !inPuzzle}
	<footer class="container site-footer">
		<span>Think Tank</span>
		<span>© {new Date().getFullYear()} think-tank.co</span>
	</footer>
{/if}

<style>
	.skip-link {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		z-index: 30;
		padding: 0.6rem 1rem;
		border-radius: var(--radius-m);
		background: var(--ink);
		color: var(--paper);
		font-weight: 600;
		text-decoration: none;
		transform: translateY(-200%);
	}

	.skip-link:focus-visible {
		transform: none;
	}

	.site-header {
		--bar-full: var(--header-height);
		--bar-island: 3.5rem;
		--hit: 2.75rem;
		--icon: 1.5rem;
		--island-pad: 0.375rem;
		--nav-gap: 0.25rem;
		--divider-gap: 0.375rem;
		--peek-gap: 0.375rem;
		--peek-end: 0.25rem;
		--morph: 650ms var(--ease-out);

		height: var(--bar-full);
	}

	.bar {
		position: fixed;
		z-index: 20;
		top: 0;
		left: 50%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: min(100%, calc(var(--page-max) + var(--gutter) * 2));
		height: var(--bar-full);
		padding-inline: var(--gutter);
		border-radius: 0;
		background-color: transparent;
		box-shadow:
			0 0 0 1px transparent,
			0 12px 32px -14px transparent;
		transform: translateX(-50%);
		transition:
			width var(--morph),
			height var(--morph),
			padding var(--morph),
			transform var(--morph),
			border-radius var(--morph),
			background-color var(--morph),
			box-shadow var(--morph);
	}

	.bar.compact {
		width: calc(
			var(--island-pad) * 2 + var(--hit) * 3 + var(--nav-gap) + var(--divider-gap) * 2 + 1px +
				var(--peek-extra, 0px)
		);
		height: var(--bar-island);
		padding-inline: var(--island-pad);
		border-radius: calc(var(--bar-island) / 2);
		background-color: color-mix(in srgb, var(--surface) 82%, transparent);
		box-shadow:
			0 0 0 1px var(--line),
			0 12px 32px -14px rgb(16 35 63 / 0.4);
		transform: translate(-50%, 0.75rem);
		-webkit-backdrop-filter: blur(14px);
		backdrop-filter: blur(14px);
	}

	.bar.compact.peeking {
		--peek-extra: calc(var(--peek-width) + var(--peek-gap) + var(--peek-end));
	}

	.bar:not(.ready),
	.bar:not(.ready) * {
		transition: none;
	}

	:global(html[data-early-scroll]) .bar:not(.ready) {
		visibility: hidden;
	}

	.divider {
		flex: none;
		width: 1px;
		height: 0;
		background: var(--line);
		opacity: 0;
		transition:
			height var(--morph),
			margin var(--morph),
			opacity var(--morph);
	}

	.compact .divider {
		height: var(--icon);
		margin-inline: var(--divider-gap);
		opacity: 1;
	}

	nav {
		display: flex;
		gap: clamp(1rem, 3vw, 2rem);
		transition: gap var(--morph);
	}

	.compact nav {
		gap: var(--nav-gap);
	}

	.brand,
	nav a {
		display: flex;
		align-items: center;
		height: var(--hit);
		border-radius: calc(var(--hit) / 2);
		text-decoration: none;
		transition:
			padding var(--morph),
			color 160ms,
			background-color 160ms;
	}

	.compact .brand,
	.compact nav a {
		padding-inline: calc((var(--hit) - var(--icon)) / 2);
	}

	.compact .peek {
		padding-inline-end: calc((var(--hit) - var(--icon)) / 2 + var(--peek-end));
	}

	.compact a:hover {
		background-color: var(--paper-deep);
	}

	.brand {
		color: var(--ink);
		font-size: 1.1875rem;
		font-weight: 700;
		letter-spacing: -0.03em;
	}

	.brand .label {
		font-size: var(--step-0);
		font-weight: 500;
		letter-spacing: normal;
	}

	nav a {
		color: var(--ink-soft);
		font-weight: 500;
	}

	nav a:hover {
		color: var(--ink);
	}

	.mark {
		display: grid;
		flex: none;
		grid-template-columns: 1fr 1fr;
		gap: 2.5px;
		width: var(--icon);
		aspect-ratio: 1;
	}

	.mark span {
		border-radius: 3px;
		background: var(--region-2);
	}

	.mark span:first-child {
		background: var(--accent);
	}

	.mark span:nth-child(4) {
		background: var(--region-3);
	}

	.icon svg {
		width: var(--icon);
		height: var(--icon);
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.fold {
		display: inline-grid;
		grid-template-columns: 0fr;
		overflow: hidden;
		opacity: 0;
		transition:
			grid-template-columns var(--morph),
			margin var(--morph),
			opacity var(--morph);
	}

	.fold > * {
		min-width: 0;
		justify-self: start;
		white-space: nowrap;
	}

	.brand-name,
	nav .label {
		grid-template-columns: 1fr;
		opacity: 1;
	}

	.brand-name {
		margin-left: 0.625rem;
	}

	.compact .brand-name,
	.compact .label {
		grid-template-columns: 0fr;
		margin-left: 0;
		opacity: 0;
	}

	.compact .icon {
		grid-template-columns: 1fr;
		opacity: 1;
	}

	.compact .peek .label {
		grid-template-columns: 1fr;
		margin-left: var(--peek-gap);
		opacity: 1;
	}

	main > :global(*),
	.site-footer {
		transition: opacity 400ms var(--ease-out);
	}

	:global(html[data-spotlight]) main > :global(:not([data-spotlit])),
	:global(html[data-spotlight]) .site-footer {
		opacity: 0;
	}

	.site-footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem 2rem;
		padding-block: 2rem 2.5rem;
		color: var(--ink-soft);
		font-size: var(--step--1);
	}
</style>
