export function Speaker() {
	let context;

	function enable() {
		context = new AudioContext();

		const gainNode = context.createGain();
		gainNode.gain.setValueAtTime(0.1, context.currentTime);
		gainNode.connect(context.destination);

		const oscillator = context.createOscillator(440, context.currentTime);
		oscillator.type = 'square';
		oscillator.connect(gainNode);
		oscillator.start();

		context.suspend();
	}

	function disable() {
		context.close();
		context = undefined;
	}

	function play() {
		if (context)
			context.resume();
	}

	function pause() {
		if (context)
			context.suspend();
	}

	function setPlaying(shouldPlay) {
		if (shouldPlay)
			play();
		else
			pause();
	}

	return {
		enable, disable,
		play, pause, setPlaying,
	};
}
