'use strict';

require('konva')
var Mustache = require('mustache')
var drumTracks = require('./drumTracks.json');

var canvas = null;
var context = null;
var stage = null;

var centerX;
var centerY;

var layers = [];
var clockHandLayer;
var clockHand;
var stopStartLayer;
var stopStartSymbol;

var numberOfDrums = 5;
var arcWidth = 40;
var innerRadius = 40;

var samplesPath = 'samples/';

var anim;

var context = new AudioContext();

var tempo = 120;
var barTime = 240 / tempo;
var angularSpeed = 360 / barTime;
var drumBuffers = [];
var playing = false;

var nextBarStartTime;
var timerID = null;

for (var drumArcs = []; drumArcs.length <= 8; drumArcs.push([]));

var $container = $('.js-canvas-container');
var $statusArea = $('.js-status');

// Resize calculates dimensions then calls draw canvas
function resizeCanvas() {
    var canvasWidth = $container.width();
    var canvasHeight = $container.height() - 10;
    centerX = canvasWidth / 2;
    centerY = canvasHeight / 2;
    calculateArcWidth();
    drawCanvas(canvasWidth, canvasHeight);
    updateDrumNumber();
}

function calculateArcWidth() {
    var padding = 10;
    var min = Math.min(centerX, centerY);
    arcWidth = (min - innerRadius - padding) / 8;
}

function drawCanvas(canvasWidth, canvasHeight) {

    stage = new Konva.Stage({
        container: 'container',
        width: canvasWidth,
        height: canvasHeight
    });

    drawClockHand();
    drawPlayToggle('start');

    anim = new Konva.Animation(function(frame) {
        var angleDiff = frame.timeDiff * angularSpeed / 1000;
        clockHand.rotate(angleDiff);
    }, clockHandLayer);

    // create all of the drum layers
    for (var i = 0; i < 8; i += 1) {
        drawDrumLayer(i);
    }
}

// Add rotating clock hand
function drawClockHand() {

    clockHandLayer = new Konva.Layer();

    clockHand = new Konva.Arc({
        x: stage.width() / 2,
        y: stage.height() / 2,
        innerRadius: 42,
        outerRadius: 65 + (arcWidth * numberOfDrums),
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 0, y: 80 },
        fillLinearGradientColorStops: [0, '#26294a', 1, 'white'],
        angle: 22.5,
        rotation: 247.5
    });

    clockHandLayer.add(clockHand);
    stage.add(clockHandLayer);
}

// Add circular play/stop button
function drawPlayToggle(action) {

    // Destroy old layer
    if (stopStartLayer) {
        stopStartLayer.destroy();
    }

    stopStartLayer = new Konva.Layer();

    var circle = new Konva.Circle({
        x: centerX,
        y: centerY,
        radius: 40,
        fill: '#110141',
        stroke: '#fff',
        strokeWidth: 1
    });

    stopStartLayer.add(circle);

    if (action == 'stop') {
        stopStartSymbol = new Konva.Rect({
            x: centerX - 15,
            y: centerY - 15,
            width: 30,
            height: 30,
            fill: '#fff'
        });
    } else {
        stopStartSymbol = new Konva.RegularPolygon({
            x: centerX,
            y: centerY,
            sides: 3,
            radius: 20,
            fill: '#fff',
            rotation: 90
        });
    }

    stopStartLayer.add(stopStartSymbol);

    stopStartLayer.on('click touchstart', function() {
        togglePlay();
    });

    stopStartLayer.draw();

    stage.add(stopStartLayer);
}

// Add one layer of drum sectors
function drawDrumLayer(drumNumber) {
    // Destroy old layer
    if (layers[drumNumber]) {
        layers[drumNumber].destroy();
    }

    // Create new layer
    layers[drumNumber] = new Konva.Layer();
    // Calculate angle in degrees for each sector
    var beatAngle = 360 / drumTracks[drumNumber].divisions;

    // Create drum sector arcs
    for (var i = 0; i < drumTracks[drumNumber].divisions; i += 1) {

        drumArcs[drumNumber][i] = new Konva.Arc({
            x: stage.width() / 2,
            y: stage.height() / 2,
            innerRadius: innerRadius + (arcWidth * drumNumber),
            outerRadius: (innerRadius + arcWidth) + (arcWidth * drumNumber),
            fill: drumTracks[drumNumber].colours.inactive,
            stroke: '#26294a',
            strokeWidth: 2,
            angle: beatAngle,
            opacity: 0.8,
            rotation: (270 + (beatAngle * i))%360,
        });

        if (drumTracks[drumNumber].pattern[i] === 1) {
            drumArcs[drumNumber][i].fill(drumTracks[drumNumber].colours.active);
        }

        // Create event listener for click and touchstart events
        drumArcs[drumNumber][i].on('click touchstart', function() {
            // Find drum selected and array position
            var drumSelected;

            for (var j = 0; j < drumArcs.length; j += 1) {
                if (drumArcs[j].indexOf(this) !== -1) {
                    drumSelected = j;
                    break;
                }
            }

            var arrayPosition = drumArcs[drumSelected].indexOf(this);

            // Switch value of item in drumPattern array
            if (drumTracks[drumSelected].pattern[arrayPosition] === 0) {
                this.fill(drumTracks[drumSelected].colours.active);
                drumTracks[drumSelected].pattern[arrayPosition] = 1;
            } else if (drumTracks[drumSelected].pattern[arrayPosition] === 1) {
                this.fill(drumTracks[drumSelected].colours.inactive);
                drumTracks[drumSelected].pattern[arrayPosition] = 0;
            }

            layers[drumNumber].draw();
        });

        layers[drumNumber].add(drumArcs[drumNumber][i]);
    }

    stage.add(layers[drumNumber]);
}

function updateDrumNumber() {
    var template = $('#template').html();
    var $target = $('#individualDrumSettings');

    numberOfDrums = $('#drumCount').val();
    Mustache.parse(template);
    $target.empty();

    for (var i = 0; i < numberOfDrums; i += 1) {
        // Add options for this drum to page
        $target.append(Mustache.render(template, Object.assign(drumTracks[i], { index: i })));
        // Change value of select element to match that in samples array
        $('#drum' + i + 'Sample').val(drumTracks[i].sample);
    }

    for (var j = 0; j < 8; j += 1) {
        if (j < numberOfDrums) {
            layers[j].show();
        }
        else {
            layers[j].hide();
        }
    }

    // Create event listeners for each sector count input
    $('.js-drum-sector-count').change(function() {
        var index = $('.js-drum-sector-count').index(this);
        drumTracks[index].divisions = parseInt($(this).val());
        drawDrumLayer(index);
    });

    $('.js-drum-sample').change(function() {
        var index = $('.js-drum-sample').index(this);
        loadSoundFile(this.value, index);
    });

    // Update clockHand radius
    clockHand.outerRadius(innerRadius + (arcWidth * numberOfDrums));
    clockHandLayer.draw();
}

function updateStatus(message) {
    $statusArea.removeClass('hidden');
    $statusArea.html(message);
    setTimeout(function(){
        $statusArea.addClass('hidden');
    }, 5000);
}

function init() {
    for (var i = 0; i < drumTracks.length; i++ ) {
        loadSoundFile(drumTracks[i].sample, i);
    }
}

function loadSoundFile(url, drumNumber) {
    var request = new XMLHttpRequest();
    request.open('GET', samplesPath + url, true);
    request.responseType = 'arraybuffer';
    request.onload = function(e) {
        initSound(this.response, drumNumber); // this.response is an ArrayBuffer.
    };
    request.send();
}

function initSound(arrayBuffer, drumNumber) {
    context.decodeAudioData(arrayBuffer, function(buffer) {
        drumBuffers[drumNumber] = buffer;
        updateStatus('Sample loaded: ' + drumTracks[drumNumber].sample);
    }, function(e) {
        console.log('Error decoding file', e);
        updateStatus('Error decoding file: ' + drumTracks[drumNumber].sample);
    });
}

function scheduleHit(bufferNumber, time) {
    var source = context.createBufferSource();
    source.buffer = drumBuffers[bufferNumber];
    source.loop = false;
    source.connect(context.destination);
    source.start(time);
}

function togglePlay() {
    var now = context.currentTime;
    if (playing === false) {
        playing = true;
        nextBarStartTime = now;
        scheduler();
        anim.start();
        drawPlayToggle('stop');
    }
    else {
        playing = false;
        window.clearTimeout( timerID );
        // Stop animation at end of bar (most probably a bad way of doing this)
        setTimeout(function(){
            anim.stop();
            clockHand.rotation(247.5);
            clockHandLayer.draw();
            drawPlayToggle('start');
        }, (nextBarStartTime - now) * 1000);
    }
}

function scheduler() {
    while (nextBarStartTime < context.currentTime + 0.1 ) {
        scheduleNextBar();
    }
    // Check for next bar every 10th of a second
    timerID = window.setTimeout( scheduler, 100 );
}

function scheduleNextBar() {
    // Calculate bar duration and rotational speed
    barTime = 240 / tempo;
    angularSpeed = 360 / barTime;

    // For each drum
    for (var i = 0; i < numberOfDrums; i += 1) {
        // Check whether there is a drum to play in each sector
        for (var j = 0; j < drumTracks[i].divisions; j += 1) {
            if (drumTracks[i].pattern[j] === 1) {
                scheduleHit(i, nextBarStartTime + (j * (barTime / drumTracks[i].divisions)));
            }
        }
    }

    nextBarStartTime += barTime;
}

$(document).ready(function () {
    resizeCanvas();
    $('#drumCount').change(updateDrumNumber);
});

//event handler for window resize
window.addEventListener('resize', resizeCanvas, false);

// Create event listeners
$('#tempo').change(function() {
    tempo = $(this).val();
});

$('.js-options-toggle').click(function(event) {
    event.preventDefault();
    $('#controls').toggle();
});

init();
