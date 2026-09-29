import type { Attachment } from 'svelte/attachments';
import { gsap } from 'gsap';
import { onPortalExit, takeEntry } from '$lib/portal';

const SIDE_TRAVEL = 60;
const EXIT_SPEED = 2;

export function enterScreen(puzzle: string): Attachment<HTMLElement> {
	return (screen) => {
		const board = screen.querySelector<HTMLElement>('.board')!;
		const seed = board.querySelector<HTMLElement>('[data-seed]')!;
		const sides = board.querySelectorAll<HTMLElement>('[data-side]');
		const parts = screen.querySelectorAll<HTMLElement>('[data-enter]');
		const entry = takeEntry(puzzle);
		const mm = gsap.matchMedia();
		let stopExit = () => {};

		mm.add('(prefers-reduced-motion: no-preference)', () => {
			const timeline = gsap.timeline({ paused: true });

			if (entry) {
				const { origin, ...offset } = fromSeed(board, seed, entry.seed);
				gsap.set(board, { transformOrigin: origin });
				timeline.from(board, { ...offset, duration: 0.7, ease: 'power3.inOut' });
			}

			timeline
				.from(
					sides,
					{
						opacity: 0,
						xPercent: (_, side: HTMLElement) => Number(side.dataset.dx) * SIDE_TRAVEL,
						yPercent: (_, side: HTMLElement) => Number(side.dataset.dy) * SIDE_TRAVEL,
						duration: 0.55,
						ease: 'power3.out',
						stagger: 0.03
					},
					entry ? 0.35 : 0
				)
				.from(
					parts,
					{ opacity: 0, y: '0.75rem', duration: 0.5, ease: 'power2.out', stagger: 0.08 },
					'>-0.15'
				);

			const play = () => timeline.play();
			if (entry) entry.ready.then(play);
			else play();

			stopExit = onPortalExit(() => {
				if (timeline.progress() === 0) return Promise.resolve();
				return new Promise((resolve) => {
					timeline.eventCallback('onReverseComplete', () => resolve());
					timeline.timeScale(EXIT_SPEED).reverse();
				});
			});
		});

		return () => {
			stopExit();
			mm.revert();
		};
	};
}

function fromSeed(board: HTMLElement, seed: HTMLElement, target: DOMRect) {
	const boardRect = board.getBoundingClientRect();
	const seedRect = seed.getBoundingClientRect();
	const seedX = seedRect.left + seedRect.width / 2;
	const seedY = seedRect.top + scrollY + seedRect.height / 2;

	return {
		origin: `${seedX - boardRect.left}px ${seedY - scrollY - boardRect.top}px`,
		x: target.left + target.width / 2 - seedX,
		y: target.top + target.height / 2 - seedY,
		scale: target.width / seedRect.width
	};
}
