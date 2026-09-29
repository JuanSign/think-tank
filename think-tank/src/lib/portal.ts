import type { OnNavigate } from '@sveltejs/kit';

const HOME = '/';
const PUZZLES = ['/sudoku', '/queens'];
const SEED = 'portal-seed';

type Entry = { puzzle: string; seed: DOMRect; ready: Promise<void> };

let entry: Entry | undefined;
let exitScreen: (() => Promise<void>) | undefined;

export function isPuzzleRoute(path: string) {
	return PUZZLES.includes(path);
}

export function takeEntry(puzzle: string) {
	const taken = entry?.puzzle === puzzle ? entry : undefined;
	entry = undefined;
	return taken;
}

export function onPortalExit(exit: () => Promise<void>) {
	exitScreen = exit;
	return () => {
		if (exitScreen === exit) exitScreen = undefined;
	};
}

export async function portal(navigation: OnNavigate) {
	if (!document.startViewTransition || navigation.willUnload) return;
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const from = navigation.from?.url.pathname ?? '';
	const to = navigation.to?.url.pathname ?? '';
	const entering = from === HOME && isPuzzleRoute(to);
	const leaving = isPuzzleRoute(from) && to === HOME;
	if (!entering && !leaving) return;

	const root = document.documentElement;
	const puzzle = entering ? to : from;
	let seed: HTMLElement | undefined;
	let arrived = () => {};

	if (entering) {
		seed = openingFrom(puzzle);
		if (!seed) return;
		entry = {
			puzzle,
			seed: seed.getBoundingClientRect(),
			ready: new Promise((resolve) => (arrived = resolve))
		};
	} else {
		await exitScreen?.();
	}

	root.dataset.portal = entering ? 'in' : 'out';

	return new Promise<void>((resolve) => {
		const transition = document.startViewTransition(async () => {
			root.style.scrollBehavior = 'auto';
			resolve();
			await navigation.complete;

			if (leaving) {
				seed = openingFrom(puzzle);
				if (!seed) root.dataset.portal = 'fade';
			}
		});

		const cleanUp = () => {
			delete root.dataset.portal;
			root.style.removeProperty('scroll-behavior');
			seed?.style.removeProperty('view-transition-name');
			arrived();
		};

		transition.finished.then(cleanUp, cleanUp);
	});
}

function openingFrom(puzzle: string) {
	const card = document.querySelector(`a.puzzle[href="${puzzle}"]`);
	const plate = card?.querySelector('.plate');
	const seed = card?.querySelector<HTMLElement>('.mini');
	if (!plate || !seed) return;

	const rect = plate.getBoundingClientRect();
	if (rect.bottom <= 0 || rect.top >= innerHeight) return;

	const style = document.documentElement.style;
	style.setProperty('--portal-top', `${rect.top}px`);
	style.setProperty('--portal-left', `${rect.left}px`);
	style.setProperty('--portal-width', `${rect.width}px`);
	style.setProperty('--portal-height', `${rect.height}px`);
	style.setProperty('--portal-x', `${rect.left + rect.width / 2}px`);
	style.setProperty('--portal-y', `${rect.top + rect.height / 2}px`);

	seed.style.viewTransitionName = SEED;
	return seed;
}
