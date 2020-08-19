export function State() {
	return {
		memory: new Uint8Array(4096),
		registers: new Uint8Array(0x10),
		addressRegister: new Uint16Array(1),
		stack: [],
		programCounter: 0,
		delayTimer: 0,
		soundTimer: 0,
	};
}
