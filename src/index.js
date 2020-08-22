import { Display, draw } from './display/index.js';
import { State } from './state.js';
import { cycle } from './cpu/index.js';

import { sprites, IBMLogo } from './assets.js';

const TIMER_SCALER = 12;

const context = document.querySelector('canvas').getContext('2d');
const display = Display();

const state = State({ timerScaler: TIMER_SCALER });

state.memory.set(sprites, 0);
state.memory.set(IBMLogo, 0x200);
state.programCounter = 0x200;

setInterval(() => {
	for (let i = 0; i < TIMER_SCALER; i++) {
		cycle({ state, display });
	}

	draw(display, context, { background: '#99c6ff', foreground: '#001633' });
}, 1000 / 60);

