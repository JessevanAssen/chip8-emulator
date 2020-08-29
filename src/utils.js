export function randomInt({ min = 0, max = Number.MAX_SAFE_INTEGER }) {
	return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Returns the currently pressed key, or undefined if no keys are pressed.
 *
 * If multiple keys are pressed, it will return the first index of the pressed keys
 * (e.g. if keys 2 and 4 are pressed, it will return 2).
 * @param {Uint16Array} keyboard
 * @returns {number}
 */
export function getPressedKey(keyboard) {
	for (let i = 0; i < 0x10; i++) {
		if ((keyboard[0] >> i) & 1) {
			return i;
		}
	}
}
