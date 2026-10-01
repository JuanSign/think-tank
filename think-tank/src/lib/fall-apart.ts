import { gsap } from 'gsap';

type Point = { x: number; y: number };
type Pose = Point & { angle: number };
type Box = { left: number; right: number; top: number };
type Track = { delay: number; poses: Pose[]; cleared: number; place: (pose: Pose) => void };

const GRAVITY = 2600;
const STEP = 1 / 60;
const STAGGER = 0.35;
const EARLIEST_RELEASE = 0.3;

export function fallApart(board: HTMLElement, settled: () => void) {
	const timeline = gsap.timeline();
	timeline.fromTo(board, { '--assembled': 1 }, { '--assembled': 0, duration: 0.2 }, 0);

	if (reduced()) {
		timeline.to(piecesOf(board), { autoAlpha: 0, duration: 0.3 }, 0).call(settled);
		return () => timeline.kill();
	}

	const tracks = plan(board);
	const length = Math.max(...tracks.map(finish));
	timeline
		.add(playback(tracks, length, false), 0)
		.call(settled, [], Math.max(...tracks.map((track) => track.delay + track.cleared * STEP)))
		.set(piecesOf(board), { autoAlpha: 0 }, length);
	return () => timeline.kill();
}

export function riseUp(board: HTMLElement) {
	const pieces = piecesOf(board);
	const timeline = gsap.timeline();
	gsap.set(pieces, { clearProps: 'transform' });

	if (reduced()) {
		timeline.to(pieces, { autoAlpha: 1, duration: 0.45, clearProps: 'opacity,visibility' });
	} else {
		const tracks = plan(board);
		const length = Math.max(...tracks.map(finish));
		timeline
			.add(playback(tracks, length, true), 0)
			.set(pieces, { clearProps: 'transform,transformOrigin,zIndex' }, length);
		gsap.set(pieces, { clearProps: 'opacity,visibility' });
	}

	timeline.to(board, { '--assembled': 1, duration: 0.3 });
	return () => timeline.kill();
}

function plan(board: HTMLElement) {
	const slot = board.getBoundingClientRect();
	const groups = new Map<string, HTMLElement[]>();
	for (const piece of piecesOf(board)) {
		const key = piece.dataset.piece!;
		groups.set(key, [...(groups.get(key) ?? []), piece]);
	}
	return [...groups.values()].map((members, layer) => track(members, slot, layer + 1));
}

function track(members: HTMLElement[], slot: DOMRect, layer: number): Track {
	const rects = members.map((member) => member.getBoundingClientRect());
	const { center, spread, hull, pin } = measure(rects);
	const arm = { x: center.x - pin.x, y: center.y - pin.y };
	const step = swing(arm, spread + arm.x ** 2 + arm.y ** 2);

	const poses: Pose[] = [{ x: 0, y: 0, angle: 0 }];
	let cleared: number | undefined;
	let box: Box;
	do {
		poses.push(step());
		box = extent(hull, center, poses[poses.length - 1]);
		if (cleared === undefined && apart(box, slot)) cleared = poses.length - 1;
	} while (box.top <= innerHeight);

	gsap.set(members, {
		transformOrigin: (i: number) => `${center.x - rects[i].left}px ${center.y - rects[i].top}px`,
		zIndex: layer,
		force3D: true
	});
	const setters = members.map((member) => [
		gsap.quickSetter(member, 'x', 'px'),
		gsap.quickSetter(member, 'y', 'px'),
		gsap.quickSetter(member, 'rotation', 'rad')
	]);

	return {
		delay: gsap.utils.random(0, STAGGER),
		poses,
		cleared: cleared ?? poses.length - 1,
		place: ({ x, y, angle }) => {
			for (const [setX, setY, setRotation] of setters) {
				setX(x);
				setY(y);
				setRotation(angle);
			}
		}
	};
}

function measure(rects: DOMRect[]) {
	const areas = rects.map((rect) => rect.width * rect.height);
	const mass = sum(areas);
	const middles = rects.map((rect) => ({
		x: rect.left + rect.width / 2,
		y: rect.top + rect.height / 2
	}));
	const center = {
		x: sum(middles.map((middle, i) => middle.x * areas[i])) / mass,
		y: sum(middles.map((middle, i) => middle.y * areas[i])) / mass
	};
	const spread =
		sum(
			rects.map(
				(rect, i) =>
					areas[i] *
					((rect.width ** 2 + rect.height ** 2) / 12 +
						(middles[i].x - center.x) ** 2 +
						(middles[i].y - center.y) ** 2)
			)
		) / mass;

	const top = Math.min(...rects.map((rect) => rect.top));
	const bottom = Math.max(...rects.map((rect) => rect.bottom));
	const left = Math.min(...rects.map((rect) => rect.left));
	const right = Math.max(...rects.map((rect) => rect.right));
	const ridge = rects.filter((rect) => rect.top - top < 1);
	const pin =
		Math.random() < 0.5
			? { x: Math.min(...ridge.map((rect) => rect.left)), y: top }
			: { x: Math.max(...ridge.map((rect) => rect.right)), y: top };
	const hull = [
		{ x: left, y: top },
		{ x: right, y: top },
		{ x: left, y: bottom },
		{ x: right, y: bottom }
	].map((corner) => ({ x: corner.x - center.x, y: corner.y - center.y }));

	return { center, spread, hull, pin };
}

function swing(arm: Point, inertia: number) {
	const letGo = Math.abs(Math.atan2(arm.x, arm.y)) * gsap.utils.random(EARLIEST_RELEASE, 1);
	const velocity = { x: 0, y: 0 };
	let pose: Pose = { x: 0, y: 0, angle: 0 };
	let spin = 0;
	let pinned = true;

	return function step(): Pose {
		if (!pinned) {
			velocity.y += GRAVITY * STEP;
			pose = {
				x: pose.x + velocity.x * STEP,
				y: pose.y + velocity.y * STEP,
				angle: pose.angle + spin * STEP
			};
			return pose;
		}

		spin += ((GRAVITY * turn(arm, pose.angle).x) / inertia) * STEP;
		const angle = pose.angle + spin * STEP;
		const reach = turn(arm, angle);
		pose = { x: reach.x - arm.x, y: reach.y - arm.y, angle };

		if (Math.abs(angle) >= letGo) {
			pinned = false;
			velocity.x = -spin * reach.y;
			velocity.y = spin * reach.x;
		}
		return pose;
	};
}

function playback(tracks: Track[], length: number, backwards: boolean) {
	const clock = { time: 0 };
	const render = () => {
		const time = backwards ? length - clock.time : clock.time;
		for (const track of tracks) track.place(poseAt(track, time));
	};
	render();
	return gsap.to(clock, { time: length, duration: length, ease: 'none', onUpdate: render });
}

function poseAt({ delay, poses }: Track, time: number) {
	const at = Math.min(Math.max((time - delay) / STEP, 0), poses.length - 1);
	const from = poses[Math.floor(at)];
	const to = poses[Math.ceil(at)];
	const mix = at - Math.floor(at);
	return {
		x: from.x + (to.x - from.x) * mix,
		y: from.y + (to.y - from.y) * mix,
		angle: from.angle + (to.angle - from.angle) * mix
	};
}

function finish({ delay, poses }: Track) {
	return delay + (poses.length - 1) * STEP;
}

function extent(hull: Point[], center: Point, pose: Pose): Box {
	const corners = hull.map((corner) => turn(corner, pose.angle));
	const xs = corners.map((corner) => corner.x);
	const ys = corners.map((corner) => corner.y);
	return {
		left: center.x + pose.x + Math.min(...xs),
		right: center.x + pose.x + Math.max(...xs),
		top: center.y + pose.y + Math.min(...ys)
	};
}

function apart(box: Box, slot: DOMRect) {
	return box.top > slot.bottom || box.right < slot.left || box.left > slot.right;
}

function turn({ x, y }: Point, angle: number) {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return { x: x * cos - y * sin, y: x * sin + y * cos };
}

function piecesOf(board: HTMLElement) {
	return [...board.querySelectorAll<HTMLElement>('[data-piece]')];
}

function reduced() {
	return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function sum(values: number[]) {
	return values.reduce((total, value) => total + value, 0);
}
