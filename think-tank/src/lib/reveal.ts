import { gsap } from 'gsap';

const HIDE_SPEED = 2;

export type Reveal = ReturnType<typeof revealBoard>;

export function revealBoard(screen: HTMLElement) {
	const board = screen.querySelector<HTMLElement>('.board')!;
	const cells = board.querySelectorAll<HTMLElement>('[data-cell]');
	const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

	const timeline = gsap
		.timeline({ paused: true })
		.to(cells, {
			'--paint': 1,
			duration: 0.4,
			ease: 'power2.out',
			stagger: { grid: 'auto', from: 'center', amount: 0.3 }
		})
		.to(board, { '--merge': 1, duration: 0.45, ease: 'power3.inOut' }, '-=0.2');

	return {
		show(instant = false) {
			if (instant || still) timeline.progress(1);
			else timeline.timeScale(1).play();
		},
		hide(instant = false) {
			if (instant || still || timeline.progress() === 0) {
				timeline.pause(0);
				return Promise.resolve();
			}
			return new Promise<void>((resolve) => {
				timeline.eventCallback('onReverseComplete', () => resolve());
				timeline.timeScale(HIDE_SPEED).reverse();
			});
		},
		kill() {
			timeline.kill();
		}
	};
}
