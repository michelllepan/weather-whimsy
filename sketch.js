const CAP_WIDTH = 1200;					// capture video width
const CAP_HEIGHT = 900;					// capture video height
const PADDING = 100;						// padding at edges of screen

// define sun attributes
const SUN_SPEED = 0.4;
const SUN_SIZE = 300;

// define cloud 1 attributes
const CLOUD1_SPEED = -0.3;
const CLOUD1_SIZE = 300;

// define cloud 2 attributes
const CLOUD2_SPEED = 0.2;
const CLOUD2_SIZE = 400;

// define camera feed, hand position, and object variables
let capture;
let handPos, oldHandPos;
let sun, cloud1, cloud2;

function setup () {
  createCanvas(windowWidth, windowHeight);
	
	// create video capture
	capture = createCapture(VIDEO);
	capture.size(CAP_WIDTH, CAP_HEIGHT);
	capture.hide();
  
	// initialize Handsfree library to detect one hand
  handsfree = new Handsfree({
    showDebug: true,
    hands: {
			enabled: true,
			maxNumHands: 1,
			minDetectionConfidence: 0.7,
		}
  })
	
	// initalize grab gesture
	handsfree.useGesture({
		"name": "grab",
		"algorithm": "fingerpose",
		"models": "hands",
		"confidence": 5.0,
		"description": [
			["addCurl", "Thumb", "HalfCurl", 0.9],
			["addCurl", "Index", "FullCurl", 0.9],
			["addCurl", "Middle", "FullCurl", 0.9],
			["addCurl", "Ring", "FullCurl", 0.9],
			["addCurl", "Pinky", "FullCurl", 0.9],
		],
		"enabled": true
	})
	handsfree.start();
	
	// initialize hand postions
	handPos = createVector(0, 0);
	oldHandPos = createVector(0, 0);
	
	// initialize object positions
	sun = new Sun(5/6 * CAP_WIDTH, 1/4 * CAP_HEIGHT, SUN_SPEED, 1/2 * SUN_SIZE);
	cloud1 = new Cloud1(1/6 * CAP_WIDTH, 1/3 * CAP_HEIGHT, CLOUD1_SPEED, 1/2 * CLOUD1_SIZE);
	cloud2 = new Cloud2(1/3 * CAP_WIDTH, 5/6 * CAP_HEIGHT, CLOUD2_SPEED, 1/2 * CLOUD2_SIZE);
}


function draw () {
  background(0);
	
	// flip video feed horizontally so user sees a mirror image, and position at the center of the screen
	scale(-1, 1);
	image(capture, -windowWidth/2 - CAP_WIDTH/2, windowHeight/2 - CAP_HEIGHT/2, CAP_WIDTH, CAP_HEIGHT);
	scale(-1, 1);
	
	// update hand position
	oldHandPos = handPos;
	handPos = getHandPos();

	// check if hand is grabbing and update object positions
	const isGrab = oldHandPos ? detectGesture("grab") : false;
	sun.updatePos(isGrab);
	cloud1.updatePos(isGrab);
	cloud2.updatePos(isGrab);
	
	// draw objects
	sun.draw();
	cloud1.draw();
	cloud2.draw();
}


// a general class for grabbable objects
class Grabbable {
	
	constructor(x, y, speed, radius) {
		this.pos = makePos(x, y);
		this.speed = speed;
		this.radius = radius;
	}
	
	updatePos(isGrab) {
		if (isGrab && handPos.dist(this.pos) < this.radius) {
			// if hand is grabbing and intersecting the object, 
			// move object in the direction of hand movement
			const dHandPos = p5.Vector.sub(handPos, oldHandPos);
			this.pos.add(dHandPos);
		} else {
			// move object horizontally at specified speed
			this.pos.x += this.speed;
			if (this.pos.x > windowWidth + PADDING) this.pos.x = -PADDING;
			if (this.pos.x < -PADDING) this.pos.x = windowWidth + PADDING;
		}
	}
}


class Sun extends Grabbable {
	draw () {
		fill("rgb(255,219,21)");
		stroke("rgb(255,161,22)");
		strokeWeight(10);
		circle(this.pos.x, this.pos.y, 2 * this.radius);
	}
}


class Cloud1 extends Grabbable {
	draw () {
		fill(255);
		strokeWeight(0);
		circle(this.pos.x, this.pos.y, this.radius);
		circle(this.pos.x - 30, this.pos.y - 30, this.radius);
		circle(this.pos.x + 30, this.pos.y - 10, this.radius);
		circle(this.pos.x - 50, this.pos.y + 20, this.radius);
		circle(this.pos.x + 10, this.pos.y + 20, this.radius);
	}
}


class Cloud2 extends Grabbable {
	draw () {
		fill(230);
		strokeWeight(0);
		circle(this.pos.x, this.pos.y, this.radius);
		circle(this.pos.x - 50, this.pos.y - 50, this.radius);
		circle(this.pos.x + 40, this.pos.y - 20, this.radius * 4/5);
		circle(this.pos.x - 30, this.pos.y + 20, this.radius);
		circle(this.pos.x + 40, this.pos.y + 40, this.radius * 2/3);
	}
}


function getHandPos () {
	const hands = handsfree.data?.hands;
	if (!hands?.landmarks) return;
	
	// landmark #21 is the center of the hand
	// reference: https://handsfreejs.netlify.app/ref/model/hands.html#data
	const center = hands.landmarks.find(hand => hand[21]);
  if (center) {
		return makePos(
			center[21].x * CAP_WIDTH,
			center[21].y * CAP_HEIGHT,
		);
  }
}


function detectGesture (name) {
	const hands = handsfree.data?.hands;
	if (!hands?.landmarks) return;
	
	if (hands?.gesture) {
		// check if left or right hand is grabbing 
		if (hands.gesture[0] && hands.gesture[0].name === name) {
			return true;
		} else if (hands.gesture[1] && hands.gesture[1].name === name) {
			return true;
		}
	}
}

function makePos (x, y) {
	// transform coordinates in the capture space to the window space
	return createVector(
		-x + windowWidth/2 + CAP_WIDTH/2,
		y + windowHeight/2 - CAP_HEIGHT/2,
	);
}