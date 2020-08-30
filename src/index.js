import { Display, draw } from './display/index.js';
import { Speaker } from './speaker.js';
import { State } from './state.js';
import { cycle } from './cpu/index.js';
import { disassemble } from './cpu/index.js';
import { sprites } from './assets/index.js';

const TIMER_SCALER = 12;
const DISPLAY_FOREGROUND = '#001633', DISPLAY_BACKGROUND = '#99c6ff';

const context = document.querySelector('canvas').getContext('2d');

let stopLoop, state;

const speaker = setupSpeaker();
const display = Display();
const keyboard = new Uint16Array(1);

const pauseButton = document.querySelector('button#pause'),
	stepOverButton = document.querySelector('button#step-over'),
	resumeButton = document.querySelector('button#resume');

pauseButton.addEventListener('click', pause);
stepOverButton.addEventListener('click', stepOver);
resumeButton.addEventListener('click', resume);

setupKeyboard();

onNewProgram(newProgram => {
	if (stopLoop) {
		stopLoop();
		stopLoop = undefined;
	}

	state = newProgram.state;
	resume();
});


function onNewProgram(callback) {
	document.querySelector('#file').addEventListener('change', async ({ target: { files } }) => {
		if (files.length === 0)
			return;

		display.clear();

		const program = new Uint8Array(await files[0].arrayBuffer());

		state = State({ timerScaler: TIMER_SCALER });
		state.memory.set(sprites, 0);
		state.memory.set(program, 0x200);
		state.programCounter = 0x200;

		callback({ state });
	});
}

function loop() {
	const interval = setInterval(() => {
		for (let i = 0; i < TIMER_SCALER; i++) {
			cycle({ state, display, keyboard });
		}

		draw(display, context, { background: DISPLAY_BACKGROUND, foreground: DISPLAY_FOREGROUND });
		speaker.setPlaying(state.soundTimer > 0);
	}, 1000 / 60);
	return () => clearInterval(interval);
}

function pause() {
	if (stopLoop) {
		stopLoop();
		stopLoop = undefined;
	}

	speaker.pause();

	pauseButton.disabled = true;
	stepOverButton.disabled = false;
	resumeButton.disabled = false;

	renderInstructions(state.memory);

	stepOver();
}

function stepOver() {
	cycle({ state, display, keyboard });
	draw(display, context, { background: DISPLAY_BACKGROUND, foreground: DISPLAY_FOREGROUND });
	markInstruction(Math.floor(state.programCounter / 2));
	renderValues(state);
}

function resume() {
	stopLoop = loop();

	pauseButton.disabled = false;
	stepOverButton.disabled = true;
	resumeButton.disabled = true;

	renderValues();
	renderInstructions([]);
}

function markInstruction(index) {
	const target = document.querySelector('#instructions');
	for (const i of target.querySelectorAll('.active')) {
		i.classList.remove('active');
	}
	if (target.children.length >= index) {
		target.children[index].classList.add('active');
		target.children[index].scrollIntoView({ block: 'center', behavior: 'auto' });
	}
}

function renderValues(state) {
	const target = document.querySelector('#values');
	target.innerHTML = '';

	if (!state) return;

	const output = Element('table');

	output.append(Row('PC', hex(state.programCounter, 3)));

	output.append(Row('I', hex(state.addressRegister[0], 4)));

	output.append(
		...Array.from(state.registers)
			.map((registerValue, i) =>
				Row(`V${i.toString(16).toUpperCase()}`, hex(registerValue, 2))));

	output.append(Row('DT', hex(Math.floor(state.delayTimer / state.timerScaler), 2)));
	output.append(Row('ST', hex(Math.floor(state.soundTimer / state.timerScaler), 2)));

	target.appendChild(output);

	function Row(...values) {
		return Element('tr', undefined,
			...values.map(value => Element('td', undefined, value)));
	}
}

function renderInstructions(memory) {
	const target = document.querySelector('#instructions');
	target.innerHTML = '';

	const output = document.createDocumentFragment();
	for (let i = 0; i < memory.length; i += 2) {
		const optCode = memory[i] << 8 | memory[i + 1];
		const line = hex(i, 3);
		const instruction = hex(optCode, 4);
		const disassembled = disassemble(optCode);
		const text = disassembled ? `${instruction}: ${disassembled}` : instruction;
		output.appendChild(Element(
			'div',
			{ dataset: { line } },
			text,
		));
	}
	target.appendChild(output);
}

function Element(tagName, { dataset = {}, ...props} = {}, ...children) {
	const element = document.createElement(tagName);
	Object.assign(element, props);
	Object.assign(element.dataset, dataset);
	element.append(...children);
	return element;
}

function setupSpeaker() {
	const speaker = Speaker();
	document.querySelector('#enableAudio').addEventListener('change', ({ target }) => {
		if (target.checked) {
			speaker.enable();
		} else {
			speaker.disable();
		}
	});
	return speaker;
}

function setupKeyboard() {
	const keyboardContainer = document.querySelector('#keyboard');

	function enableKey(keyCode) {
		keyboard[0] |= 1 << keyCode;
	}

	function disableKey(keyCode) {
		keyboard[0] &= ~(1 << keyCode);
	}

	keyboardContainer.addEventListener('mousedown', event => {
		if (!event.target.dataset['key']) return;

		const key = Number.parseInt(event.target.dataset['key'], 16);
		enableKey(key);

		document.body.addEventListener('mouseup', () => {
			disableKey(key);
		}, { once: true, passive: true });

	}, { passive: true });

	keyboardContainer.addEventListener('keydown', event => {
		if (event.repeat === true || event.code !== 'Enter' && event.code !== 'Space') return;
		if (!event.target.dataset['key']) return;

		const key = Number.parseInt(event.target.dataset['key'], 16);
		enableKey(key);

		document.body.addEventListener('keyup', () => {
			disableKey(key);
		}, { once: true, passive: true });

	}, { passive: true });
}

function hex(data, maxLength) {
	return `0x${data.toString(16).toUpperCase().padStart(maxLength, 0)}`;
}
