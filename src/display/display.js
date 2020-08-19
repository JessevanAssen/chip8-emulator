const width = 64;
const height = 32;

export function Display() {
	const display = new Uint32Array(64).fill(0);

	const getPixel = (x, y) => {
		return !!(display[index(x, y)] >> bit(x) & 1);
	};

	const flipPixel = (x, y) => {
		return !!(display[index(x, y)] ^= 1 << bit(x));
	};

	const clear = () => { display.fill(0); };

	const values = function*() {
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				yield { x, y, value: getPixel(x, y) };
			}
		}
	};


	return {
		get width() { return width; },
		get height() { return height; },
		getPixel, flipPixel, clear,
		[Symbol.iterator]: values,
	};
}

export function draw(display, context2d) {
	context2d.clearRect(0, 0, context2d.canvas.width, context2d.canvas.height);

	context2d.fillStyle = 'black';
	for (const { x, y, value } of display) {
		if (value) {
			context2d.fillRect(x, y, 1, 1);
		}
	}
}

function index(x, y) {
	return Math.floor(y * 2 + x / 32);
}

function bit(x) {
	return (63 - x) % 32;
}
