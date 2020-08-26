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

export function disassemble(optcode) {
	const { instruction, NNN, NN, N, X, Y } = decodeOptcode(optcode);
	const nnn = '0x' + hex(NNN, 3),
		nn = '0x' + hex(NN, 2),
		n = '0x' + hex(N, 1),
		x = hex(X, 1),
		y = hex(Y, 1);

	switch (instruction) {
	case 0x0:
		switch (NN) {
		case 0xE0: return 'CLS';
		case 0xEE: return 'RET';
		}
		break;
	case 0x1: return `SYS ${nnn}`;
	case 0x2: return `CALL ${nnn}`;
	case 0x3: return `SE V${x}, ${nn}`;
	case 0x4: return `SNE V${x}, ${nn}`;
	case 0x5: return `SE V${x}, V${y}`;
	case 0x6: return `LD V${x}, ${nn}`;
	case 0x7: return `ADD V${x}, ${nn}`;
	case 0x8:
		switch(N) {
		case 0x0: return `LD V${x}, V${y}`;
		case 0x1: return `OR V${x}, V${y}`;
		case 0x2: return `AND V${x}, V${y}`;
		case 0x3: return `XOR V${x}, V${y}`;
		case 0x4: return `ADD V${x}, V${y}`;
		case 0x5: return `SUB V${x}, V${y}`;
		case 0x6: return `SHR V${x}, V${y}`;
		case 0x7: return `SUBN V${x}, V${y}`;
		case 0xE: return `SHL V${x}, V${y}`;
		}
		break;
	case 0x9: return `SNE V${x}, V${y}`;
	case 0xA: return `LD I, ${nnn}`;
	case 0xB: return `JP V${x}, V${y}`;
	case 0xC: return `RND V${x}, ${nn}`;
	case 0xD: return `DRW V${x}, V${y}, ${n}`;
	case 0xE:
		switch(NN) {
		case 0x9E: return `SKP V${x}`;
		case 0xA1: return `SKNP V${x}`;
		}
		break;
	case 0xF:
		switch (NN) {
		case 0x07: return `LD V${x}, DT`;
		case 0x0A: return `LD V${x}, K`;
		case 0x15: return `LD DT, V${x}`;
		case 0x18: return `LD ST, V${x}`;
		case 0x1E: return `ADD I, V${x}`;
		case 0x29: return `LD F, V${x}`;
		case 0x33: return `LD B, V${x}`;
		case 0x55: return `LD [I], V${x}`;
		case 0x65: return `LD V${x}, [I]`;
		}
		break;
	}
}

function hex(int, length) {
	return int.toString(16).toUpperCase().padStart(length, '0');
}
