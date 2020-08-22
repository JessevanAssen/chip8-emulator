export function decodeOptcode(optcode) {
	return {
		instruction: optcode >> 12 & 0x000F,
		NNN: optcode & 0x0FFF,
		NN: optcode & 0x00FF,
		N: optcode & 0x000F,
		X: optcode >> 8 & 0x000F,
		Y: optcode >> 4 & 0x000F,
	};
}

export function cycle({ state, display }) {
	const incrementProgramCounter = (n = 2) => { state.programCounter += n; };

	const optcode = (state.memory[state.programCounter] << 8) | state.memory[state.programCounter + 1];
	const { instruction, NNN, NN, N, X, Y } = decodeOptcode(optcode);

	switch (instruction) {
	case 0x0:
		switch (optcode) {
		case 0x00E0:
			display.clear();
			incrementProgramCounter();
			break;
		case 0x00EE:
			state.programCounter = state.stack.pop();
			incrementProgramCounter();
			break;
		}
		break;
	case 0x1:
		state.programCounter = NNN;
		break;
	case 0x2:
		state.stack.push(state.programCounter);
		state.programCounter = NNN;
		break;
	case 0x3:
		incrementProgramCounter(state.registers[X] === NN ? 4 : 2);
		break;
	case 0x4:
		incrementProgramCounter(state.registers[X] !== NN ? 4 : 2);
		break;
	case 0x5:
		incrementProgramCounter(state.registers[X] === state.registers[Y] ? 4 : 2);
		break;
	case 0x6:
		state.registers[X] = NN;
		incrementProgramCounter();
		break;
	case 0x7:
		state.registers[X] += NN;
		incrementProgramCounter();
		break;
	case 0x8:
		switch(N) {
		case 0x0:
			state.registers[X] = state.registers[Y];
			break;
		case 0x1:
			state.registers[X] |= state.registers[Y];
			break;
		case 0x2:
			state.registers[X] &= state.registers[Y];
			break;
		case 0x3:
			state.registers[X] ^= state.registers[Y];
			break;
		case 0x4: {
			const result = state.registers[X] + state.registers[Y];
			state.registers[X] = result;
			state.registers[0xF] = (result >> 8) & 1;
			break;
		}
		case 0x5: {
			const result = state.registers[X] - state.registers[Y];
			state.registers[X] = result;
			state.registers[0xF] = result < 0 ? 1 : 0;
			break;
		}
		case 0x6:
			state.registers[0xF] = state.registers[X] & 1;
			state.registers[X] >>= 1;
			break;
		case 0x7: {
			const result = state.registers[Y] - state.registers[X];
			state.registers[X] = result;
			state.registers[0xF] = result < 0 ? 1 : 0;
			break;
		}
		case 0xE:
			state.registers[0xF] = (state.registers[X] >> 7) & 1;
			state.registers[X] <<= 1;
			break;
		}
		incrementProgramCounter();
		break;
	case 0x9:
		state.programCounter += (state.registers[X] !== state.registers[Y] ? 4 : 2);
		break;
	case 0xA:
		state.addressRegister[0] = NNN;
		incrementProgramCounter();
		break;
	case 0xB:
		state.programCounter = NNN + state.registers[0];
		break;
	case 0xC:
		break;
	case 0xD: {
		let pixelFlippedOff = false;

		for (let y = 0; y < N; y++) {
			const sprite = state.memory[state.addressRegister[0] + y];
			for (let x = 0; x < 8; x++) {
				const pixel = (sprite >> (7 - x)) & 1;
				if (pixel) {
					const pixelState = display.flipPixel(
						state.registers[X] + x,
						state.registers[Y] + y);
					pixelFlippedOff |= !pixelState;
				}
			}
		}

		state.registers[0xF] = pixelFlippedOff ? 1 : 0;

		incrementProgramCounter();
		break;
	}
	case 0xE:
		break;
	case 0xF:
		switch (NN) {
		case 0x07:
			state.registers[X] = Math.ceil(state.delayTimer / state.timerScaler);
			incrementProgramCounter();
			break;
		case 0x15:
			state.delayTimer = state.registers[X] * state.timerScaler;
			incrementProgramCounter();
			break;
		case 0x18:
			state.soundTimer = state.registers[X] * state.timerScaler;
			incrementProgramCounter();
			break;
		case 0x55:
			state.memory.set(
				state.registers.slice(0, X + 1),
				state.addressRegister[0]);
			incrementProgramCounter();
			break;
		case 0x65:
			state.registers.set(
				state.memory.slice(state.addressRegister[0], state.addressRegister[0] + X + 1),
				0);
			incrementProgramCounter();
			break;
		case 0x1E:
			state.addressRegister[0] += state.registers[X];
			incrementProgramCounter();
			break;
		}
		break;
	}

	if (state.delayTimer > 0) state.delayTimer--;
	if (state.soundTimer > 0) state.soundTimer--;
}
