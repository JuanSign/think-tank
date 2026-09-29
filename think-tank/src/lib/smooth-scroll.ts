import Lenis, { type VirtualScrollData } from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const REST_DELAY = 350;
const REACH_AHEAD = 0.1;
const MAX_OVERSHOOT = 0.4;
const SETTLE_DURATION = 0.7;
const OTHER_INPUT = ['keydown', 'pointerdown', 'touchstart'] as const;

const restingPoints = new Set<() => number>();
const sectionStarts = new Set<() => number>();

export function restAt(point: () => number) {
	return register(restingPoints, point);
}

export function sectionStartsAt(point: () => number) {
	return register(sectionStarts, point);
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
	const points = [...restingPoints].map((point) => point());

	const next = Math.min(...points.filter((at) => at > from));
	if (next - from <= innerHeight * REACH_AHEAD) return glide(lenis, next);

	const rest = Math.max(...points.filter((at) => at < from));
	const overshoot = from - rest;
	if (overshoot < 1 || overshoot > innerHeight * MAX_OVERSHOOT) return;

	const movedOn = [...sectionStarts].some((start) => {
		const at = start();
		return at > rest && at <= from;
	});
	if (!movedOn) glide(lenis, rest);
}

function glide(lenis: Lenis, target: number) {
	lenis.scrollTo(target, { duration: SETTLE_DURATION, easing: easeOutCubic });
}

function easeOutCubic(t: number) {
	return 1 - (1 - t) ** 3;
}

function register(points: Set<() => number>, point: () => number) {
	points.add(point);
	return () => {
		points.delete(point);
	};
}
