import { jest } from '@jest/globals';

import { cycle } from './cpu.js';
import { State } from '../state.js';
import { randomInt } from '../utils.js';


describe('cycle', () => {
	describe('0x00E0', () => {
		const program = [0x00E0];

		test('clears the display', () => {
			const setup = Setup({ program });

			cycle(setup);
			expect(setup.display.clear).toHaveBeenCalled();
		});

	});

	describe('0x00EE', () => {
		test('pops the last address of the stack, and sets it to the program counter, and steps to the next instruction', () => {
			const setup = Setup({ program: [0x00EE] });
			setup.state.stack.push(0x1234);

			cycle(setup);

			expect(setup.state.programCounter).toBe(0x1234 + 2);
			expect(setup.state.stack).toEqual([]);
		});
	});

	describe('0x1NNN', () => {
		test('sets the program counter to NNN', () => {
			const setup = Setup({ program: [0x1234] });

			cycle(setup);
			expect(setup.state.programCounter).toBe(0x234);
		});
	});


	describe('0x2NNN', () => {
		test('pushes the current program counter to the stack', () => {
			const setup = SetupTest();
			cycle(setup);
			expect(setup.state.stack).toEqual([0xA]);
		});

		test('sets the program counter to NNN', () => {
			const setup = SetupTest();
			cycle(setup);
			expect(setup.state.programCounter).toBe(0x345);
		});

		function SetupTest() {
			const setup = Setup({ program: [0, 0, 0, 0, 0, 0x2345] });
			setup.state.programCounter = 0xA;
			return setup;
		}
	});

	describe('0x3XNN', () => {
		const NN = 0x56;
		const X = 0x4;
		const program = [0x3000 | (X << 8) | NN];

		test('increments the program counter by 4 if the value in register X matches NN', () => {
			const setup = Setup({ program });
			setup.state.registers[X] = NN;

			cycle(setup);
			expect(setup.state.programCounter).toBe(4);
		});

		test('increments the program counter by 2 if the value in register X does not match NN', () => {
			const setup = Setup({ program });
			setup.state.registers[X] = NN + 1;

			cycle(setup);
			expect(setup.state.programCounter).toBe(2);
		});
	});

	describe('0x4XNN', () => {
		const NN = 0x56;
		const X = 0x5;
		const program = [0x4000 | (X << 8) | NN];

		test('increments the program counter by 2 if the value in register X matches NN', () => {
			const setup = Setup({ program });
			setup.state.registers[X] = NN;

			cycle(setup);
			expect(setup.state.programCounter).toBe(2);
		});

		test('increments the program counter by 4 if the value in register X does not match NN', () => {
			const setup = Setup({ program });
			setup.state.registers[X] = NN + 1;

			cycle(setup);
			expect(setup.state.programCounter).toBe(4);
		});
	});

	describe('0x5XY0', () => {
		const X = 0x6;
		const Y = 0x7;
		const program = [0x5000 | (X << 8) | (Y << 4)];

		test('increments the program counter by 4 if the value in register X matches the value in register Y', () => {
			const setup = Setup({ program });
			setup.state.registers[X] = 0xFF;
			setup.state.registers[Y] = 0xFF;

			cycle(setup);
			expect(setup.state.programCounter).toBe(4);
		});

		test('increments the program counter by 2 if the value in register X does not match the value in register Y', () => {
			const setup = Setup({ program });
			setup.state.registers[X] = 0xFF;
			setup.state.registers[Y] = 0xEE;

			cycle(setup);
			expect(setup.state.programCounter).toBe(2);
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

		testIncrementsProgramCounter({ program });
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

		testIncrementsProgramCounter({ program });
	});

	{
		const X = 0x1;
		const Y = 0x2;

		const SetupTest = ({ instruction, x = 0, y = 0 }) => {
			const program = [0x8000 | (X << 8) | (Y << 4) | instruction];
			const setup = Setup({ program });
			setup.state.registers[X] = x;
			setup.state.registers[Y] = y;
			return setup;
		};

		describe('0x8XY0', () => {
			test('assigns the value in register Y to register X', () => {
				const setup = SetupTest({ instruction: 0, y: 0xFF });
				cycle(setup);
				expect(setup.state.registers[X]).toBe(0xFF);
			});

			testIncrementsProgramCounter({ program: [0x8000] });
		});

		describe('0x8XY1', () => {
			test('does a bitwise OR between the values in registers X and Y, and assigns the value to register X', () => {
				const setup = SetupTest({ instruction: 1, x: 0b11110000, y: 0b11001100 });
				cycle(setup);
				expect(setup.state.registers[X]).toBe(0b11111100);
			});

			testIncrementsProgramCounter({ program: [0x8001] });
		});

		describe('0x8XY2', () => {
			test('does a bitwise AND between the values in registers X and Y, and assigns the value to register X', () => {
				const setup = SetupTest({ instruction: 2, x: 0b11110000, y: 0b11001100 });
				cycle(setup);
				expect(setup.state.registers[X]).toBe(0b11000000);
			});

			testIncrementsProgramCounter({ program: [0x8002] });
		});

		describe('0x8XY3', () => {
			test('does a bitwise XOR between the values in registers X and Y, and assigns the value to register X', () => {
				const setup = SetupTest({ instruction: 3, x: 0b11110000, y: 0b11001100 });
				cycle(setup);
				expect(setup.state.registers[X]).toBe(0b00111100);
			});

			testIncrementsProgramCounter({ program: [0x8003] });
		});

		describe('0x8XY4', () => {
			test('adds the value of register Y to the value of register X', () => {
				const x = 0b00111111, y = 0b1;
				const setup = SetupTest({ instruction: 4, x, y });
				cycle(setup);

				expect(setup.state.registers[X]).toBe(x + y);
				expect(setup.state.registers[0xF]).toBe(0);
			});

			test('stores the carry in register F', () => {
				const x = 0b11111111, y = 0b11111111;
				const setup = SetupTest({ instruction: 4, x, y });
				cycle(setup);

				expect(setup.state.registers[X]).toBe(0b11111110);
				expect(setup.state.registers[0xF]).toBe(1);
			});

			testIncrementsProgramCounter({ program: [0x8004] });
		});

		describe('0x8XY5', () => {
			test('subtracts the value in register Y from the value in register X, and stores the result in register X', () => {
				const x = 100, y = 25;
				const setup = SetupTest({ instruction: 5, x, y });

				cycle(setup);

				expect(setup.state.registers[X]).toBe(75);
				expect(setup.state.registers[0xF]).toBe(1);
			});

			test('makes the borrow bit 0 if the value becomes negative', () => {
				const x = 25, y = 100;
				const setup = SetupTest({ instruction: 5, x, y });

				cycle(setup);

				expect(setup.state.registers[X]).toBe(256 - 75);
				expect(setup.state.registers[0xF]).toBe(0);
			});

			testIncrementsProgramCounter({ program: [0x8005] });
		});

		describe('0x8XY6', () => {
			test('shifts the value in register X to the right', () => {
				const setup = Setup({ program: [0x8006, 0x8006] });
				setup.state.registers[0x0] = 0b11111110;

				cycle(setup);
				expect(setup.state.registers[0x0]).toBe(0b01111111);
				expect(setup.state.registers[0xF]).toBe(0);

				cycle(setup);
				expect(setup.state.registers[0x0]).toBe(0b00111111);
				expect(setup.state.registers[0xF]).toBe(1);
			});

			testIncrementsProgramCounter({ program: [0x8006] });
		});

		describe('0x8XY7', () => {
			test('subtracts the value in register Y from the value in register X, and stores the result in register X', () => {
				const x = 25, y = 100;
				const setup = SetupTest({ instruction: 7, x, y });

				cycle(setup);

				expect(setup.state.registers[X]).toBe(75);
				expect(setup.state.registers[0xF]).toBe(1);
			});

			test('makes the borrow bit 0 if the value becomes negative', () => {
				const x = 100, y = 25;
				const setup = SetupTest({ instruction: 7, x, y });

				cycle(setup);

				expect(setup.state.registers[X]).toBe(256 - 75);
				expect(setup.state.registers[0xF]).toBe(0);
			});

			testIncrementsProgramCounter({ program: [0x8007] });
		});

		describe('0x8XYE', () => {
			test('shifts the value in register X to the left', () => {
				const setup = Setup({ program: [0x800E, 0x800E] });
				setup.state.registers[0x0] = 0b01111111;

				cycle(setup);
				expect(setup.state.registers[0x0]).toBe(0b11111110);
				expect(setup.state.registers[0xF]).toBe(0);

				cycle(setup);
				expect(setup.state.registers[0x0]).toBe(0b11111100);
				expect(setup.state.registers[0xF]).toBe(1);
			});

			testIncrementsProgramCounter({ program: [0x800E] });
		});
	}

	describe('0x9XY0', () => {
		const X = 0x6;
		const Y = 0x7;
		const program = [0x9000 | (X << 8) | (Y << 4)];

		test('increments the program counter by 2 if the value in register X matches the value in register Y', () => {
			const setup = Setup({ program });
			setup.state.registers[X] = 0xFF;
			setup.state.registers[Y] = 0xFF;

			cycle(setup);
			expect(setup.state.programCounter).toBe(2);
		});

		test('increments the program counter by 4 if the value in register X does not match the value in register Y', () => {
			const setup = Setup({ program });
			setup.state.registers[X] = 0xFF;
			setup.state.registers[Y] = 0xEE;

			cycle(setup);
			expect(setup.state.programCounter).toBe(4);
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

		testIncrementsProgramCounter({ program });
	});

	describe('0xBNNN', () => {
		test('sets the program counter to NNN + the value in register 0', () => {
			const setup = Setup({ program: [0xB123] });
			setup.state.registers[0] = 1;

			cycle(setup);
			expect(setup.state.programCounter).toBe(0x124);
		});
	});

	describe('0xCXNN', () => {
		test('generates a random number', () => {
			const setup = Setup({ program: [0xC1FF] });

			cycle({ ...setup, random: () => 247 });
			expect(setup.state.registers[1]).toBe(247);
		});

		test('Does a bitwise AND between the random number and NN', () => {
			const setup = Setup({ program: [0xC100 | 0b00001111] });

			cycle({ ...setup, random: () => 0b11001100 });
			expect(setup.state.registers[1]).toBe(0b00001100);
		});

		testIncrementsProgramCounter({ program: [0xC000] });
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

	describe('0xFX07', () => {
		const X = 0x3;
		const program = [0xF007 | X << 8];

		test('stores the value of the delay timer in register X', () => {
			const timerScaler = randomInt({ min: 10, max: 20 });
			const setup = Setup({ program, timerScaler });
			setup.state.delayTimer = 5.5 * timerScaler;

			cycle(setup);

			expect(setup.state.registers[X]).toBe(6);
		});

		testIncrementsProgramCounter({ program });
	});

	describe('0xFX15', () => {
		const X = 0xB;
		const program = [0xF015 | X << 8];

		test('sets the delay timer to the value in register X', () => {
			const timerScaler = randomInt({ min: 10, max: 20 });
			const setup = Setup({ program, timerScaler });
			setup.state.registers[X] = 6;

			cycle(setup);

			const expected = 6 * timerScaler - 1; //  Subtract 1, because the timers are decremented at the end of the cycle
			expect(setup.state.delayTimer).toBe(expected);
		});

		testIncrementsProgramCounter({ program });
	});

	describe('0xFX18', () => {
		const X = 0xB;
		const program = [0xF018 | X << 8];

		test('sets the delay timer to the value in register X', () => {
			const timerScaler = randomInt({ min: 10, max: 20 });
			const setup = Setup({ program, timerScaler });
			setup.state.registers[X] = 6;

			cycle(setup);

			const expected = 6 * timerScaler - 1; //  Subtract 1, because the timers are decremented at the end of the cycle
			expect(setup.state.soundTimer).toBe(expected);
		});

		testIncrementsProgramCounter({ program });
	});

	describe('0xFX1E', () => {
		const address = randomInt({ max: 0x100 });
		const X = randomInt({ min: 0, max: 0xF });
		const program = [0xF01E | X << 8];

		test('adds the value in register X to the value in the address register', () => {
			const x = randomInt({ min: 1, max: 0x100 });
			const setup = Setup({ program });
			setup.state.addressRegister[0] = address;
			setup.state.registers[X] = x;

			cycle(setup);
			expect(setup.state.addressRegister[0]).toBe(address + x);
		});

		testIncrementsProgramCounter({ program });
	});

	describe('0xFX29', () => {
		const X = randomInt({ min: 0, max: 0xF });

		test('sets I to the location of the sprite for the character in VX', () => {
			for (let i = 0; i <= 0xF; i++) {
				const setup = Setup({ program: [0xF029 | X << 8] });
				setup.state.registers[X] = i;

				cycle(setup);
				expect(setup.state.addressRegister[0]).toBe(i * 5);
			}
		});

		testIncrementsProgramCounter({ program: [0xF029] });
	});

	describe('0xFX33', () => {
		const X = randomInt({ min: 0, max: 0x10 });
		test('dumps the registers to memory', () => {
			const setup = Setup({ program: [0xF033 | X << 8] });
			setup.state.registers[X] = 123;
			setup.state.addressRegister[0] = 0x100;

			cycle(setup);

			expect(setup.state.memory[0x100]).toBe(1);
			expect(setup.state.memory[0x101]).toBe(2);
			expect(setup.state.memory[0x102]).toBe(3);
		});

		testIncrementsProgramCounter({ program: [0xF033] });
	});

	describe('0xFX55', () => {
		test('dumps the registers to memory', () => {
			const count = randomInt({ min: 0, max: 0x10 });
			const setup = Setup({ program: [0xF055 | count << 8] });
			setup.state.addressRegister[0] = 0xFF;
			for (let i = 0; i <= 0xF; i++) {
				setup.state.registers[i] = i + 1;
			}

			cycle(setup);

			for (let i = 0; i <= 0xF; i++) {
				const expected = i <= count ? i + 1 : 0;
				expect(setup.state.memory[0xFF + i]).toBe(expected);
			}
		});

		testIncrementsProgramCounter({ program: [0xF055] });
	});

	describe('0xFX65', () => {
		test('loads the registers from memory', () => {
			const count = randomInt({ min: 0, max: 0x10 });
			const setup = Setup({ program: [0xF065 | count << 8] });
			setup.state.addressRegister[0] = 0xFF;
			for (let i = 0; i <= 0xF; i++) {
				setup.state.memory[0xFF + i] = i + 1;
			}

			cycle(setup);

			for (let i = 0; i <= 0xF; i++) {
				const expected = i <= count ? i + 1 : 0;
				expect(setup.state.registers[i]).toBe(expected);
			}
		});

		testIncrementsProgramCounter({ program: [0xF065] });
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

	function testIncrementsProgramCounter({ program, initialProgramCounter = 0, expectedIncrease = 2 }) {
		test(`increments the program counter by ${expectedIncrease}`, () => {
			const setup = Setup({ program });
			setup.state.programCounter = initialProgramCounter;

			cycle(setup);
			expect(setup.state.programCounter).toBe(initialProgramCounter + expectedIncrease);
		});
	}
});

function Setup({ program = required('program'), timerScaler = 10 } = {}) {
	const state = State({ timerScaler });

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
