import { jest } from '@jest/globals';

import { decodeOptcode, cycle } from './cpu.js';
import { State } from '../state.js';


describe('decodeOptcode', () => {
	const { instruction, NNN, NN, N, X, Y } = decodeOptcode(0b0011110001011010);

	test('extracts the instruction', () => {
		expect(instruction)
			.toBe(0b0011);
	});
	test('extracts NNN', () => {
		expect(NNN)
			.toBe(0b110001011010);
	});
	test('extracts NN', () => {
		expect(NN)
			.toBe(0b01011010);
	});
	test('extracts N', () => {
		expect(N)
			.toBe(0b1010);
	});
	test('extracts X', () => {
		expect(X)
			.toBe(0b1100);
	});
	test('extracts Y', () => {
		expect(Y)
			.toBe(0b0101);
	});
});

describe('cycle', () => {
	describe('0x00E0', () => {
		const program = [0x00E0];

		test('clears the display', () => {
			const setup = Setup({ program });

			cycle(setup);
			expect(setup.display.clear).toHaveBeenCalled();
		});

		test('increments the program counter', () => {
			const setup = Setup({ program });

			cycle(setup);
			expect(setup.state.programCounter).toBe(2);
		});
	});

	describe('0x1NNN', () => {
		test('sets the program counter to NNN', () => {
			const setup = Setup({ program: [0x1234] });

			cycle(setup);
			expect(setup.state.programCounter).toBe(0x234);
		});
	});

	describe('0x6XNN', () => {
		const register = randomInt({ max: 0x10 });
		const value = randomInt({ max: 0x100 });
		const program = [0x6000 | register << 8 | value];

		test('assigns NN to register X', () => {
			const setup = Setup({ program });

			cycle(setup);
			expect(setup.state.registers[register]).toBe(value);
		});

		test('increments the program counter', () => {
			const setup = Setup({ program });

			cycle(setup);
			expect(setup.state.programCounter).toBe(2);
		});
	});

	describe('0x7XNN', () => {
		const register = 0x8;
		const value = 75;
		const program = new Array(4).fill(0x7000 | register << 8 | value);

		test('adds NN to register X', () => {
			const setup = Setup({ program });

			cycle(setup);
			expect(setup.state.registers[register]).toBe(value);

			cycle(setup);
			expect(setup.state.registers[register]).toBe(value * 2);
		});

		test('overflows when larger than 255', () => {
			const setup = Setup({ program });

			for (let i = 0; i < 4; i++) {
				cycle(setup);
			}

			expect(setup.state.registers[register]).toBe((value * 4) % 0x100);
		});

		test('increments the program counter', () => {
			const setup = Setup({ program });

			cycle(setup);
			expect(setup.state.programCounter).toBe(2);
		});
	});

	describe('0xANNN', () => {
		const address = randomInt({ max: 0x1000 });
		const program = [0xA000 | address];

		test('assigns NNN to address register', () => {
			const setup = Setup({ program });

			cycle(setup);
			expect(setup.state.addressRegister[0]).toBe(address);
		});

		test('increments the program counter', () => {
			const setup = Setup({ program });

			cycle(setup);
			expect(setup.state.programCounter).toBe(2);
		});
	});

	describe('0xDXYN', () => {
		const program = [0x6005, 0x610A, 0xA008, 0xD012, 0b1010101001010101];

		test('draws a sprite', () => {
			const setup = Setup({ program });

			for (let i = 0; i < 4; i++)
				cycle(setup);

			expect(setup.display.flipPixel).toHaveBeenCalledWith(5,  10);
			expect(setup.display.flipPixel).toHaveBeenCalledWith(7,  10);
			expect(setup.display.flipPixel).toHaveBeenCalledWith(9,  10);
			expect(setup.display.flipPixel).toHaveBeenCalledWith(11, 10);
			expect(setup.display.flipPixel).toHaveBeenCalledWith(6,  11);
			expect(setup.display.flipPixel).toHaveBeenCalledWith(8,  11);
			expect(setup.display.flipPixel).toHaveBeenCalledWith(10, 11);
			expect(setup.display.flipPixel).toHaveBeenCalledWith(12, 11);
		});

		test('sets register F to 0 if a pixel is not flipped to false', () => {
			const setup = Setup({ program });

			for (let i = 0; i < 4; i++)
				cycle(setup);

			expect(setup.state.registers[0xF]).toBe(0);
		});

		test('sets register F to 1 if a pixel is flipped to false', () => {
			const setup = Setup({ program });
			setup.display.flipPixel.mockReturnValue(false);

			for (let i = 0; i < 4; i++)
				cycle(setup);

			expect(setup.state.registers[0xF]).toBe(1);
		});

		test('increments the program counter', () => {
			const setup = Setup({ program });

			for (let i = 0; i < 4; i++)
				cycle(setup);

			expect(setup.state.programCounter).toBe(8);
		});
	});

	test('decrements the timers if they are above 0', () => {
		const setup = Setup({ program: [0x00E0, 0x00E0, 0x00E0] });
		setup.state.delayTimer = 2;
		setup.state.soundTimer = 1;

		cycle(setup);
		expect(setup.state).toEqual(expect.objectContaining({ delayTimer: 1, soundTimer: 0 }));

		cycle(setup);
		expect(setup.state).toEqual(expect.objectContaining({ delayTimer: 0, soundTimer: 0 }));

		cycle(setup);
		expect(setup.state).toEqual(expect.objectContaining({ delayTimer: 0, soundTimer: 0 }));
	});
});

function Setup({ program = required('program') } = {}) {
	const state = State();

	for (let i = 0; i < program.length; i++) {
		state.memory[i * 2] = (program[i] >> 8) & 0xFF;
		state.memory[i * 2 + 1] = program[i] & 0xFF;
	}

	const display = {
		clear: jest.fn(),
		flipPixel: jest.fn().mockReturnValue(true),
	};

	return { state, display };
}

function required(parameter) {
	throw new Error(`[Setup] Parameter "${parameter}" is required`);
}

function randomInt({ min = 0, max = 1} = {}) {
	return Math.floor(Math.random() * (max - min) + min);
}
