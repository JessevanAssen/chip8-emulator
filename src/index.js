import { Display, draw } from './display/index.js';
import { Speaker } from './speaker.js';
import { State } from './state.js';
import { cycle } from './cpu/index.js';

import { sprites } from './assets/index.js';

const TIMER_SCALER = 12;

const context = document.querySelector('canvas').getContext('2d');
let stopCurrentProgram;

const speaker = Speaker();

document.querySelector('#enableAudio').addEventListener('change', ({ target }) => {
	if (target.checked) {
		speaker.enable();
	} else {
		speaker.disable();
	}
});

document.querySelector('#file').addEventListener('change', async ({ target: { files } }) => {
	if (stopCurrentProgram) {
		stopCurrentProgram();
		stopCurrentProgram = undefined;
	}

	if (files.length === 0)
		return;

	const program = new Uint8Array(await files[0].arrayBuffer());
	stopCurrentProgram = startProgram({ program });
});

function startProgram({ program }) {
	const display = Display();

	const state = State({ timerScaler: TIMER_SCALER });
	state.memory.set(sprites, 0);
	state.memory.set(program, 0x200);
	state.programCounter = 0x200;

	const interval = setInterval(() => {
		for (let i = 0; i < TIMER_SCALER; i++) {
			cycle({ state, display });
		}

		draw(display, context, { background: '#99c6ff', foreground: '#001633' });

		if (state.soundTimer > 0) {
			speaker.play();
		} else {
			speaker.pause();
		}
	}, 1000 / 60);

	return () => { clearInterval(interval); };
}
