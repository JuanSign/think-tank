import type { Attachment } from 'svelte/attachments';

const SETTLE = 120;
const MAX_WAIT = 1000;
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

export function reveal(amount = 0.5): Attachment<HTMLElement> {
	return (node) => {
		let firstCheck = true;
		let settleTimer: ReturnType<typeof setTimeout> | undefined;
		let maxTimer: ReturnType<typeof setTimeout> | undefined;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[entries.length - 1];

				if (firstCheck) {
					firstCheck = false;
					if (entry.isIntersecting) stop();
					else node.dataset.reveal = 'waiting';
					return;
				}

				const visible = entry.intersectionRect.height;
				const fits = Math.min(entry.boundingClientRect.height, innerHeight);
				if (entry.isIntersecting && visible >= fits * amount) playWhenSettled();
			},
			{ threshold: THRESHOLDS }
		);

		function playWhenSettled() {
			if (maxTimer) return;
			maxTimer = setTimeout(play, MAX_WAIT);
			addEventListener('scroll', onScroll, { passive: true });
			onScroll();
		}

		function onScroll() {
			clearTimeout(settleTimer);
			settleTimer = setTimeout(play, SETTLE);
		}

		function play() {
			if (hiddenBySpotlight()) return;
			stop();
			node.dataset.reveal = 'playing';
		}

		function hiddenBySpotlight() {
			const spot = document.querySelector('[data-spotlit]');
			return spot !== null && !spot.contains(node);
		}

		function stop() {
			observer.disconnect();
			clearTimeout(settleTimer);
			clearTimeout(maxTimer);
			removeEventListener('scroll', onScroll);
		}

		observer.observe(node);
		return stop;
	};
}
