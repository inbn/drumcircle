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

var anim;

for (var drumArcs = []; drumArcs.length < 10; drumArcs.push([]));

var drumPattern = [
		[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
	];

var barDivisions = [16, 16, 16, 16, 16, 16, 16, 16];

var drumColours = [
	//	 inactive    active
		['#e2bfce', '#a12a5e'],
		['#f9b3c7', '#ed0345'],
		['#fad2c1', '#ef6a32'],
		['#fdebc7', '#fbbf45'],
		['#e5f3cf', '#aad962'],
		['#b3edd9', '#03c383'],
		['#b2d5ca', '#017351'],
		['#b2cbcd', '#01545a']
	];

/* colours used
#1a1334    #26294a    #01545a
#017351    #03c383    #aad962
#fbbf45    #ef6a32    #ed0345
#a12a5e    #710162    #110141
*/

var $container = $('.js-canvas-container');
var $statusArea = $('.js-status');

//event handler for window resize
window.addEventListener('resize', resizeCanvas, false);

//resize calculates dimensions then calls draw canvas
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
    var beatAngle = 360 / barDivisions[drumNumber];

    // Create drum sector arcs
    for (var i = 0; i < barDivisions[drumNumber]; i += 1) {

    	drumArcs[drumNumber][i] = new Konva.Arc({
	    	x: stage.width() / 2,
	    	y: stage.height() / 2,
	    	innerRadius: innerRadius + (arcWidth * drumNumber),
	    	outerRadius: (innerRadius + arcWidth) + (arcWidth * drumNumber),
	    	fill: drumColours[drumNumber][0],
	    	stroke: '#26294a',
	    	strokeWidth: 2,
	    	angle: beatAngle,
	    	opacity: 0.8,
	    	rotation: (270 + (beatAngle * i))%360,
    	});

    	if (drumPattern[drumNumber][i] === 1) {
    		drumArcs[drumNumber][i].fill(drumColours[drumNumber][1]);
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
        	if (drumPattern[drumSelected][arrayPosition] === 0) {
        		this.fill(drumColours[drumSelected][1]);
        		drumPattern[drumSelected][arrayPosition] = 1;
        	} else if (drumPattern[drumSelected][arrayPosition] === 1) {
        		this.fill(drumColours[drumSelected][0]);
        		drumPattern[drumSelected][arrayPosition] = 0;
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

    for (var i = 1; i <= numberOfDrums; i += 1) {
    	// Add options for this drum to page
        $target.append(Mustache.render(template, {
        	num: i,
        	arrayNum: i - 1,
        	sectorCount: barDivisions[i - 1]
        }));
        // Change value of select element to match that in samples array
        var targetID = "#drum" + i + "Sample";
        $(targetID).val(samples[i-1]);
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
		barDivisions[index] = parseInt($(this).val());
		drawDrumLayer(index);
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

// Create event listeners
$('#tempo').change(function() {
	tempo = $(this).val();
});

$('.js-options-toggle').click(function(event) {
	event.preventDefault();
	$('#controls').toggle();
});

$(document).ready(function () {
	resizeCanvas();
    $('#drumCount').change(updateDrumNumber);
});
