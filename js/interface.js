var canvas = null;
var context = null;
var stage = null;

var centerX;
var centerY;

var layers = [];
var clockHandLayer; 
var clockHand;
var imageObj;

var numberOfDrums = 6;
var arcWidth = 30;

var anim;

for(var drumArcs = []; drumArcs.length < 10; drumArcs.push([]));

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
 
//resize calculates dimensions then calls draw canvas
function resizeCanvas() {
    var canvasWidth = window.innerWidth;
    var canvasHeight = window.innerHeight - 10;
    centerX = canvasWidth / 2;
	centerY = canvasHeight / 2;
    drawCanvas(canvasWidth,canvasHeight);
    updateDrumNumber();
}
 
function drawCanvas(canvasWidth,canvasHeight) {
 
	stage = new Kinetic.Stage({
        container: 'container',
        width: canvasWidth,
        height: canvasHeight
    });

	//add Start/Stop circle
    var circleLayer = new Kinetic.Layer();

    var circle = new Kinetic.Circle({
    	x: centerX,
    	y: centerY,
	  	radius: 40,
	  	fill: 'grey',
	  	stroke: 'white',
	  	strokeWidth: 2
	});

	circleLayer.on('click touchstart', function() {
		togglePlay();
	});

	circleLayer.on('mouseover', function () {
		document.body.style.cursor = 'pointer';
		circle.fill('black');
		circleLayer.draw();
	});

	circleLayer.on('mouseout', function () {
		document.body.style.cursor = 'default';
		circle.fill('grey');
		circleLayer.draw();
	});

	circleLayer.add(circle);

	//playPause = new Kinetic.Layer();

	imageObj = new Image();
	imageObj.onload = function() {
 		var image = new Kinetic.Image({
		    x: centerX - 16,
		    y: centerY - 16,
		    image: imageObj,
		    width: 32,
		    height: 32
		});
	 	
	 	circleLayer.add(image);
	 	circleLayer.draw();
	};
	imageObj.src = 'img/play_64.png';

	stage.add(circleLayer);

	//add rotating clock hand
	clockHandLayer = new Kinetic.Layer();

	clockHand = new Kinetic.Arc({
		x: stage.width()/2,
	    y: stage.height()/2,
	    innerRadius: 42,
	    outerRadius: 65 + (arcWidth * numberOfDrums),
	    fillLinearGradientStartPoint: {x:0, y:0},
        fillLinearGradientEndPoint: {x:0,y:80},
        fillLinearGradientColorStops: [0, '#26294a', 1, 'white'],
	    angle: 22.5,
	    rotationDeg: 247.5
	});

	clockHandLayer.add(clockHand);
	stage.add(clockHandLayer);

	anim = new Kinetic.Animation(function(frame) {
        var angleDiff = frame.timeDiff * angularSpeed / 1000;
        clockHand.rotate(angleDiff);
    }, clockHandLayer);

	//create all of the drum layers
	for (var i = 0; i < 8; i += 1) {
		drawDrumLayer(i);
	}
    
}

function drawDrumLayer(drumNumber) {
	//destroy old layer
	if(layers[drumNumber]) {
		layers[drumNumber].destroy();
	}

	layers[drumNumber] = new Kinetic.Layer();

    //var numBeats = 16;
    var beatAngle = 360 / barDivisions[drumNumber];

    //create drum sectors
    for (var i = 0; i < barDivisions[drumNumber]; i += 1) {
    	drumArcs[drumNumber][i] = new Kinetic.Arc({
	    	x: stage.width()/2,
	    	y: stage.height()/2,
	    	innerRadius: 65 + (arcWidth * drumNumber),
	    	outerRadius: (65 + arcWidth) + (arcWidth * drumNumber),
	    	fill: drumColours[drumNumber][0],
	    	stroke: '#26294a',
	    	strokeWidth: 2,
	    	angle: beatAngle,
	    	opacity: 0.8,
	    	rotationDeg: (270 + (beatAngle * i))%360,
    	});

    	if (drumPattern[drumNumber][i] === 1) {
    		drumArcs[drumNumber][i].fill(drumColours[drumNumber][1]);
    	}

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
	
		//check for click events
        drumArcs[drumNumber][i].on('click touchstart', function() {
        	//find drum selected and array position
        	var drumSelected;
        	for (var j = 0; j < drumArcs.length; j += 1) {
        		if (drumArcs[j].indexOf(this) !== -1) {
        			drumSelected = j;
        			break;
        		}
        	}
      		var arrayPosition = drumArcs[drumSelected].indexOf(this);

      		//switch value of item in drumPattern array
        	if (drumPattern[drumSelected][arrayPosition] === 0) {
        		this.fill(drumColours[drumSelected][1]);
        		drumPattern[drumSelected][arrayPosition] = 1;
        	}
        	else if (drumPattern[drumSelected][arrayPosition] === 1) {
        		this.fill(drumColours[drumSelected][0]);
        		drumPattern[drumSelected][arrayPosition] = 0;
        	}
        	console.log(drumPattern[drumSelected][arrayPosition]);

            layers[drumNumber].draw();
        });

    	layers[drumNumber].add(drumArcs[drumNumber][i]);	
    }

    stage.add(layers[drumNumber]);
}

function redrawDrumLayer(element, layer) {
	barDivisions[layer] = element.value;
	drawDrumLayer(layer);
}

function updateDrumNumber() {
	var template = $('#template').html();
	var target = $('#individualDrumSettings');

	numberOfDrums = $('#drumCount').val();
	Mustache.parse(template);
	target.empty();

    for (var i = 1; i <= numberOfDrums; i += 1) {
    	//add options for this drum to page
        target.append(Mustache.render(template, {num: i, arrayNum: i-1})); 
        //change value of select element to match that in samples array
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

    //update clockHand radius
	clockHand.outerRadius(65 + (arcWidth * numberOfDrums));
	clockHandLayer.draw();
}

//event listeners

$('#tempo').change(function() {
	tempo = $(this).val();
});

$('#options-toggle').click(function(event) {
	event.preventDefault();
	$('#controls').toggle();
});

$(document).ready(function () {
	resizeCanvas();
    $('#drumCount').change(updateDrumNumber);
    $('#dismiss-alert').click(function() {
    	$('#alert').slideToggle(500);
    });
}); 

