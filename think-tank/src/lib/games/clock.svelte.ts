export class Clock {
	seconds = $state(0);
	paused = $state(false);
	running = $state(false);

	#banked = 0;
	#since: number | undefined;
	#timer: ReturnType<typeof setInterval> | undefined;

	start() {
		this.reset();
		this.running = true;
		this.sync();
	}

	stop() {
		this.running = false;
		this.sync();
	}

	reset() {
		this.stop();
		this.#banked = 0;
		this.paused = false;
		this.seconds = 0;
	}

	toggle = () => {
		this.paused = !this.paused;
		this.sync();
	};

	sync = () => {
		const ticking = this.running && !this.paused && !document.hidden;
		if (ticking && this.#since === undefined) {
			this.#since = performance.now();
			this.#timer = setInterval(this.#tick, 250);
		} else if (!ticking && this.#since !== undefined) {
			this.#banked += performance.now() - this.#since;
			this.#since = undefined;
			clearInterval(this.#timer);
		}
		this.#tick();
	};

	#tick = () => {
		const live = this.#since === undefined ? 0 : performance.now() - this.#since;
		this.seconds = Math.floor((this.#banked + live) / 1000);
	};
}
