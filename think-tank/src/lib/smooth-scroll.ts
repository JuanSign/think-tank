import Lenis, { type VirtualScrollData } from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const REST_DELAY = 700;
const REACH_AHEAD = 0.20;
const REACH_BEHIND = 0.1;
const OTHER_INPUT = ['keydown', 'pointerdown', 'touchstart'] as const;

const restingPoints = new Set<() => number>();

export function restAt(point: () => number) {
	restingPoints.add(point);
	return () => {
		restingPoints.delete(point);
	};
}

export function smoothScroll() {
	gsap.registerPlugin(ScrollTrigger);

	const mm = gsap.matchMedia();

	mm.add('(prefers-reduced-motion: no-preference)', () => {
		const lenis = new Lenis({ autoRaf: false });
		const raf = (time: number) => lenis.raf(time * 1000);
		let restTimer: ReturnType<typeof setTimeout> | undefined;

		function onWheel({ deltaY, event }: VirtualScrollData) {
			clearTimeout(restTimer);
			if (event.type !== 'wheel' || deltaY <= 0) return;
			restTimer = setTimeout(() => settle(lenis), REST_DELAY);
		}

		function cancelRest() {
			clearTimeout(restTimer);
		}

		lenis.on('scroll', ScrollTrigger.update);
		lenis.on('virtual-scroll', onWheel);
		for (const type of OTHER_INPUT) addEventListener(type, cancelRest, { passive: true });
		gsap.ticker.add(raf);
		gsap.ticker.lagSmoothing(0);

		return () => {
			cancelRest();
			for (const type of OTHER_INPUT) removeEventListener(type, cancelRest);
			gsap.ticker.remove(raf);
			gsap.ticker.lagSmoothing(500, 33);
			lenis.destroy();
		};
	});

	return () => mm.revert();
}

function settle(lenis: Lenis) {
	const from = lenis.targetScroll;
	let target: number | undefined;
	let nearest = Infinity;

	for (const point of restingPoints) {
		const at = point();
		const distance = Math.abs(at - from);
		const reach = innerHeight * (at >= from ? REACH_AHEAD : REACH_BEHIND);
		if (distance <= reach && distance < nearest) {
			target = at;
			nearest = distance;
		}
	}

	if (target !== undefined && nearest > 1) lenis.scrollTo(target);
}
