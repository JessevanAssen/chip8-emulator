import { decodeOptcode } from './optcode.js';

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
