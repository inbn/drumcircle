var canvas = null;
var context = null;
var stage = null;

var centerX;
var centerY;

var layers = [];
var clockHand;
var playSymbol;
var stopSymbol;

var numberOfDrums = 6;
var arcWidth = 30;

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

//event handler for window resize
window.addEventListener('resize', resizeCanvas, false);

var $container = $('.js-canvas-container');
var $canvas = $('.js-canvas');

//resize calculates dimensions then calls draw canvas
function resizeCanvas() {
    var canvasWidth = $canvas.width();
    var canvasHeight = $canvas.height() - 10;
    // Set css calculated values as attributes on the element
    $canvas.attr({ width: canvasWidth, height: canvasHeight });
    centerX = canvasWidth / 2;
	centerY = canvasHeight / 2;
    drawCanvas(canvasWidth, canvasHeight);
    updateDrumNumber();
}

function drawCanvas(canvasWidth, canvasHeight) {

	stage = new createjs.Stage('canvas');

	// stage.enableMouseOver(60);

	// add Start/Stop circle
	var playButton = new createjs.Shape();
	playButton.graphics.beginFill('grey').drawCircle(centerX, centerY, 40);
	stage.addChild(playButton);

	playButton.addEventListener('click', function(event) {
		togglePlay();
	});

	// playButton.addEventListener('mouseover', function(event) {
	// 	document.body.style.cursor = 'pointer';

	// 	var target = event.target;
 //    	target.graphics.clear().beginFill('black').drawCircle(centerX, centerY, 40);
 //    	stage.update();
	// });

	// playButton.addEventListener('mouseout', function(event) {
	// 	document.body.style.cursor = 'default';

	// 	var target = event.target;
 //    	target.graphics.clear().beginFill('grey').drawCircle(centerX, centerY, 40);
 //    	stage.update();
	// });

	// add rotating clock hand
	clockHand = new createjs.Shape();

	clockHand.x = centerX;
	clockHand.y = centerY;

	clockHand.graphics.beginLinearGradientStroke(['#26294a','#FFF'], [0, 1], -50, 0, 50, -10)
            .setStrokeStyle((arcWidth + 2) * numberOfDrums)
            .arc(0, 0, (arcWidth + 2) * numberOfDrums, Math.PI * 1.375, Math.PI * 1.5);
	// clockHandLayer = new Kinetic.Layer();
	stage.addChild(clockHand);

	drawPlaySymbol();

	createjs.Ticker.addEventListener('tick', tick);
	createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
	createjs.Ticker.setPaused(true);

	//create all of the drum layers
	for (var i = 0; i < numberOfDrums; i += 1) {
		drawDrumLayer(i);
	}

	stage.update();
}

function drawPlaySymbol() {
	if (stopSymbol) {
		stopSymbol.graphics.clear();
	}

	playSymbol = new createjs.Shape();
	playSymbol.x = centerX;
	playSymbol.y = centerY;
	playSymbol.graphics.beginStroke('white');
	playSymbol.graphics.moveTo(-15, 20).lineTo(20, 0).lineTo(-15, -20).lineTo(-15, 20);

	stage.addChild(playSymbol);
	stage.update();
}

function drawStopSymbol() {
	if (playSymbol) {
		playSymbol.graphics.clear();
	}

	stopSymbol = new createjs.Shape();
	stopSymbol.x = centerX;
	stopSymbol.y = centerY;
	stopSymbol.graphics.beginStroke('white');
	stopSymbol.graphics.drawRect(-15, -15, 30, 30);

	stage.addChild(stopSymbol);
	stage.update();
}

function tick(event) {
	if (createjs.Ticker.getPaused() === false) {
		var angleDiff = event.delta * angularSpeed / 1000;
		clockHand.rotation = (clockHand.rotation += angleDiff) % 360;
	    stage.update();
	}
}


function drawDrumLayer(drumNumber) {
	//destroy old layer
	destroyDrumLayer(drumNumber);

    var beatAngle = (2 * Math.PI) / barDivisions[drumNumber];

    var startAngle = (2 * Math.PI) * 0.75;
    var endAngle = startAngle + beatAngle;

    //create drum sectors
    for (var i = 0; i < barDivisions[drumNumber]; i += 1) {
    	// check whether this beat contains a note
    	fillColor = drumPattern[drumNumber][i] ? drumColours[drumNumber][1] : drumColours[drumNumber][0];

    	drumArcs[drumNumber][i] = new createjs.Shape();
    	drumArcs[drumNumber][i].x = centerX;
    	drumArcs[drumNumber][i].y = centerY;

    	drumArcs[drumNumber][i].graphics.beginStroke(fillColor)
            .setStrokeStyle(arcWidth)
            .arc(0, 0, 65 + ((arcWidth + 2) * drumNumber), startAngle, endAngle);

    	// drumArcs[drumNumber][i] = new Kinetic.Arc({
	    // 	x: stage.width()/2,
	    // 	y: stage.height()/2,
	    // 	innerRadius: 65 + (arcWidth * drumNumber),
	    // 	outerRadius: (65 + arcWidth) + (arcWidth * drumNumber),
	    // 	fill: drumColours[drumNumber][0],
	    // 	stroke: '#26294a',
	    // 	strokeWidth: 2,
	    // 	angle: beatAngle,
	    // 	opacity: 0.8,
	    // 	rotationDeg: (270 + (beatAngle * i))%360,
    	// });

    	// if (drumPattern[drumNumber][i] === 1) {
    	// 	drumArcs[drumNumber][i].fill(drumColours[drumNumber][1]);
    	// }

    	/*
    	drumArcs[drumNumber][i].on('mouseover', function () {
    		this.opacity(1);
    		layers[drumNumber].draw();
    	});

    	drumArcs[drumNumber][i].on('mouseout', function () {
    		this.opacity(0.8);
    		layers[drumNumber].draw();
    	});
		*/

		drumArcs[drumNumber][i].addEventListener('click', function(event) {

			// find drum selected and array position
	    	var drumSelected;
	    	var target = event.target;

	    	for (var j = 0; j < drumArcs.length; j += 1) {
	    		if (drumArcs[j].indexOf(target) !== -1) {
	    			drumSelected = j;
	    			break;
	    		}
	    	}

	  		var arrayPosition = drumArcs[drumSelected].indexOf(target);

	  		// get start and end angles of arc
	  		var targetStartAngle = target.graphics.command.startAngle;
	  		var targetEndAngle = target.graphics.command.endAngle;

	  		console.log(targetEndAngle);

	  		if (drumPattern[drumSelected][arrayPosition] === 0) {
	  			drumPattern[drumSelected][arrayPosition] = 1;
	  			target.graphics.clear().beginStroke(drumColours[drumSelected][1])
            	.setStrokeStyle(arcWidth)
            	 .arc(0, 0, 65 + ((arcWidth + 2) * drumNumber), targetStartAngle, targetEndAngle);
	  		} else if (drumPattern[drumSelected][arrayPosition] === 1) {
	  			drumPattern[drumSelected][arrayPosition] = 0;
	  			target.graphics.clear().beginStroke(drumColours[drumSelected][0])
            	.setStrokeStyle(arcWidth)
            	 .arc(0, 0, 65 + ((arcWidth + 2) * drumNumber), targetStartAngle, targetEndAngle);
	  		}

	  		stage.update();
		});

		startAngle = (startAngle + beatAngle) % (2 * Math.PI);
        endAngle = (endAngle + beatAngle) % (2 * Math.PI);

    	stage.addChild(drumArcs[drumNumber][i]);
    }

    stage.update();
}

function destroyDrumLayer(layer) {
	for (var i = 0; i < barDivisions[layer]; i += 1) {
		if (drumArcs[layer][i]) {
			drumArcs[layer][i].graphics.clear();
		}
	}

	stage.update();
}

function updateDrumNumber() {
	var template = $('#template').html();
	var target = $('#individualDrumSettings');

	numberOfDrums = $('#drumCount').val();
	Mustache.parse(template);
	target.empty();

    for (var i = 1; i <= numberOfDrums; i += 1) {
    	//add options for this drum to page
        target.append(Mustache.render(template, {
        	num: i,
        	arrayNum: i - 1
        }));
        //change value of select element to match that in samples array
        var targetID = '#drum' + i + 'Sample';
        $(targetID).val(samples[i-1]);
    }

    for (var j = 0; j < 8; j += 1) {
    	if (j < numberOfDrums) {
    		drawDrumLayer(j);
    	}
    	else {
			destroyDrumLayer(j);
    	}
    }

    //update clockHand radius
	// clockHand.outerRadius(65 + (arcWidth * numberOfDrums));
	// clockHandLayer.draw();
}

//event listeners
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

