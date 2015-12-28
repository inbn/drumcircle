var context = new AudioContext();

var tempo = 120;
var barTime = 240 / tempo;
var angularSpeed = 360/barTime;
var drumBuffers = [];
var playing = false;

var nextBarStartTime;
var timerID = null;

var samples = [
			'samples/808 Kick.wav',
			'samples/808 Snare.wav',
			'samples/808 Closed Hihat.wav',
			'samples/808 Clap.wav',
			'samples/808 Low Tom.wav',
			'samples/808 Mid Tom.wav',
			'samples/808 High Tom.wav',
			'samples/808 Cowbell.wav'
			];

function init() {
	loadSoundFile(samples[0], 0);
	loadSoundFile(samples[1], 1);
	loadSoundFile(samples[2], 2);
	loadSoundFile(samples[3], 3);
	loadSoundFile(samples[4], 4);
}

function loadSoundFile(url, drumNumber) {
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';
	request.onload = function(e) {
		initSound(this.response, drumNumber); // this.response is an ArrayBuffer.
	};
	request.send();
}

function initSound(arrayBuffer, drumNumber) {
	context.decodeAudioData(arrayBuffer, function(buffer) {
		drumBuffers[drumNumber] = buffer;
		console.log('sampleLoaded');
	}, function(e) {
		console.log('Error decoding file', e);
	});
}

function playDrum(time, bufferNumber) {
	source = context.createBufferSource();
	source.buffer = drumBuffers[bufferNumber];
	source.loop = false;
	source.connect(context.destination);
	source.start(time);
	console.log('playing drum number: ' + bufferNumber);
}

function togglePlay() {
	var now = context.currentTime;
	if (playing === false) {
		playing = true;
		nextBarStartTime = now;
		scheduler();
		anim.start();
		imageObj.src = 'img/stop_64.png';
	}
	else {
		playing = false;
		window.clearTimeout( timerID );
		//stop animation at end of bar (most probably a bad way of doing this)
		setTimeout(function(){
			anim.stop();
			clockHand.rotation(247.5);
			clockHandLayer.draw();
			imageObj.src = 'img/play_64.png';
		}, (nextBarStartTime - now)*1000);
	}
}

function scheduler() {
	while (nextBarStartTime < context.currentTime + 0.1 ) {
		scheduleNextBar();
	}
	//check for next bar every 10th of a second
	timerID = window.setTimeout( scheduler, 100 );
}

function scheduleNextBar() {
	//calculate bar duration and rotational speed
	barTime = 240 / tempo;
	angularSpeed = 360/barTime;

	//for each drum
	for(var i = 0; i < numberOfDrums; i += 1) {
		//check whether there is a drum to play in each sector
		for(var j = 0; j < barDivisions[i]; j += 1) {
			if (drumPattern[i][j] === 1) {
				playDrum(nextBarStartTime + (j * (barTime / barDivisions[i])), i);
			}
		}
	}
	nextBarStartTime += barTime;
}

function changeDrumSample(element, drum) {
	samples[drum] = element.value;
	loadSoundFile(samples[drum], drum);
}

init();
