import { gsap } from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';

gsap.registerPlugin(Physics2DPlugin);

const SETTLED_AT = 0.9;

export function fallApart(pieces: HTMLElement[], settled: () => void) {
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const timeline = gsap.timeline();
	gsap.set(pieces, { transition: 'none' });

	if (reduced) {
		timeline.to(pieces, { opacity: 0, duration: 0.3 });
	} else {
		for (const piece of pieces) {
			const side = Math.random() < 0.5 ? -1 : 1;
			const start = gsap.utils.random(0, 0.35);
			timeline
				.set(piece, { transformOrigin: side > 0 ? 'top left' : 'top right' }, 0)
				.to(
					piece,
					{
						rotation: side * gsap.utils.random(12, 35),
						duration: gsap.utils.random(0.25, 0.45),
						ease: 'power2.in'
					},
					start
				)
				.to(
					piece,
					{
						physics2D: {
							velocity: gsap.utils.random(150, 350),
							angle: -90 + side * gsap.utils.random(10, 35),
							gravity: 2600
						},
						rotation: `+=${side * gsap.utils.random(90, 360)}`,
						duration: 1.4,
						ease: 'none'
					},
					'>'
				);
		}
	}
	timeline.call(settled, [], reduced ? 0.3 : SETTLED_AT);

	return function restore() {
		timeline.kill();
		gsap.set(pieces, { clearProps: 'transform,transformOrigin,opacity' });
		gsap.from(pieces, {
			opacity: 0,
			y: reduced ? 0 : '0.75rem',
			duration: 0.45,
			ease: 'power2.out',
			stagger: 0.015,
			clearProps: 'transform,opacity,transition'
		});
	};
}
