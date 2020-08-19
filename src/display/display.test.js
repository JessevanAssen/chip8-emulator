import { Display } from './display.js';

describe('flipPixel', () => {
	test('flips a pixel', () => {
		const display = Display();

		display.flipPixel(10, 20);

		for (const { x, y, value } of display) {
			expect(value).toBe(x === 10 && y === 20);
		}
	});

	test('returns the new state of the pixel', () => {
		const display = Display();
		expect(display.flipPixel(10, 20)).toBe(true);
		expect(display.flipPixel(10, 20)).toBe(false);
	});
});

describe('clearDisplay', () => {
	test('clears the display', () => {
		const display = Display();

		expect([...display].every(({ value }) => value === false)).toBeTruthy();

		for (const { x, y } of display) {
			display.flipPixel(x, y);
		}

		expect([...display].every(({ value }) => value === true)).toBeTruthy();

		display.clear();

		expect([...display].every(({ value }) => value === false)).toBeTruthy();
	});
});
