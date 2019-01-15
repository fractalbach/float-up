// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                              Chapter 3
//
//                        The Game Controller
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Although this is not literally a game controller, it implements one. This
// chapter enables the humans to interact with the game.

const GameController = (function(){


// the canvas overlay where the controls are interacted with.
const q = document.querySelector.bind(document);
const canvas = q("#game");
const overlay = q("#overlay");
const ctx = canvas.getContext("2d");

// TODO:
// define this in a better way.
// currently, it's left undefined until GameController.init(player) is called.
let myPlayer = undefined;

// constant values
const TAP_DELAY = 250;

// specific requests
let REQUEST_UP     = false
let REQUEST_DOWN   = false
let REQUEST_RIGHT  = false
let REQUEST_LEFT   = false
let REQUEST_JUMP   = false
let REQUEST_GRAB   = false

// less-sepcific requests
let REQUEST_ACTION = false
let REQUEST_MOVE   = false


// variables
let savedUnitVectorX = 0;
let savedUnitVectorY = 0;


// make a request to move in a specific direction.
function requestDirectionalMove(unitVectorX, unitVectorY) {
    REQUEST_MOVE = true;
    savedUnitVectorX = unitVectorX;
    savedUnitVectorY = unitVectorY;
}

// step will go through the requests and actually execute commands.
// This function should only be executed during the main game loop, in
// order to maintain temporal consistency with the rest of the game.
function processInputsAndStep(game) {
    if (REQUEST_ACTION === true) {
        game.determinePlayerAction();
    }
    if (REQUEST_MOVE === true) {
        game.player.directionalMove(savedUnitVectorX, savedUnitVectorY);
        resetActionRequests();
        return;
    }
    if (REQUEST_UP === true) {
        game.determinePlayerAction();
        // game.player.moveUp();
    }
    if (REQUEST_DOWN === true) {
        game.player.moveDown();
    }
    if (REQUEST_LEFT === true) {
        game.player.moveLeft();
    }
    if (REQUEST_RIGHT === true) {
        game.player.moveRight();
    }
    resetActionRequests();
}

function resetActionRequests() {
    REQUEST_JUMP   = false
    REQUEST_GRAB   = false
    REQUEST_ACTION = false
}

function resetAllRequests() {
    REQUEST_UP     = false
    REQUEST_DOWN   = false
    REQUEST_RIGHT  = false
    REQUEST_LEFT   = false
    REQUEST_JUMP   = false
    REQUEST_GRAB   = false
    REQUEST_ACTION = false
    REQUEST_MOVE   = false
}


// __________________________________________________________________
//      Math Functions
// ==================================================================

function unitVector(a,b) {
    let norm = Math.sqrt(a*a + b*b);
    return [a/norm, b/norm];
}

// __________________________________________________________________
//      Keyboard Controls
// ==================================================================

// add event listeners to trigger the input manager.

function whenKeyGoesDown(event) {
    switch (event.code) {
        case 'ArrowUp':     REQUEST_UP = true; return;
        case 'ArrowDown':   REQUEST_DOWN = true; return;
        case 'ArrowLeft':   REQUEST_LEFT = true; return;
        case 'ArrowRight':  REQUEST_RIGHT = true; return;
        case 'Space':       REQUEST_ACTION = true;  return; // might need cooldown.
    }
}


function whenKeyGoesUp(event) {
    switch (event.code) {
        case 'ArrowUp':     REQUEST_UP = false; return;
        case 'ArrowDown':   REQUEST_DOWN = false; return;
        case 'ArrowLeft':   REQUEST_LEFT = false; return;
        case 'ArrowRight':  REQUEST_RIGHT = false; return;
    }
}




// __________________________________________________________________
//      Touch Controls  ~  Setup
// ==================================================================
let touchTimeStart = 0;
let touchTime = 0;
let isTouching = 0;
let firstTouch;
let lastTouch;

function restartTimer() {
    touchTimeStart = performance.now();
    touchTime = 0;
}
function updateTouchTime() {
    touchTime = performance.now() - touchTimeStart;
}

function debugUnitVectors(uvx, uvy) {
    uvx = Math.floor(uv[0] * 100)/100;
    uvy = Math.floor(uv[1] * 100)/100;
    q('#debug_uvx').innerText = (uvx<0?"":"+") + uvx;
    q('#debug_uvy').innerText = (uvy<0?"":"+") + uvy;
}

function calculateDirectionAndRequest(event) {
    let [x,y] = getMousePos(canvas, event.touches[0])
    let dx = x - (myPlayer.x + myPlayer.w/2)
    let dy = y - (myPlayer.y + myPlayer.h/2)
    let uv = unitVector(dx, dy);
    let uvx = uv[0]
    let uvy = uv[1]
    requestDirectionalMove(uvx, uvy);
}


// __________________________________________________________________
//      Touch Controls  ~  Events
// ==================================================================

function displayTouch(touchEvent) {
    for (let touch of touchEvent.touches) {
        let [x, y] = getMousePos(canvas, touch)
        ClickSpotTracker.addClickLocation(x, y);
    }
}

function whenTouchStarts(event) {
    event.preventDefault();
    displayTouch(event)
    restartTimer();
    isTouching = 1;
    lastTouch = firstTouch = event.touches[0];
    whenClicked(lastTouch);
}

function whenTouchMoves(event) {
    event.preventDefault();
    displayTouch(event)
    updateTouchTime();
    calculateDirectionAndRequest(event);
    lastTouch = event.touches[0];
}

function whenTouchEnds(event) {
    touchTime = performance.now() - touchTimeStart;
    if (touchTime < TAP_DELAY) {

        // return;
    }
    whenClicked(lastTouch)
    isTouching = 0;
    firstTouch = undefined;
    REQUEST_MOVE = false
    // whenClicked(lastTouch);
}

function whenTouchCancels(event) {
    isTouching = 0;
    firstTouch = undefined;
    REQUEST_MOVE = false
}

// __________________________________________________________________
//      Drawing on the Controller's Overlay
// ==================================================================

function drawCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2*Math.PI);
    ctx.fill();
}

function drawCircleOutline(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2*Math.PI);
    ctx.stroke();
}

function drawJoyBase(ctx, x, y) {
    ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
    drawCircle(ctx, x, y, 20);
}

function drawJoyStick(ctx, x0, y0, xf, yf) {
    ctx.strokeStyle = 'lightgray';
    drawLine(ctx, x0, y0, xf, yf);
    ctx.fillStyle = 'black';
    drawCircle(ctx, xf, yf, 10);
}


// __________________________________________________________________
//      Drawing Click/Tap Locations on the screeen.
// ==================================================================

const ClickSpotTracker = (function(){

    // private data members of ClickSpotTracker
    const NUM_CIRCLES_TO_TRACK = 20;
    const DEFAULT_CIRCLE_RADIUS = 50;
    const CIRCLE_COLOR = 'rgba(77, 184, 255, 0.2)';
    let listOfCircles = new Array(NUM_CIRCLES_TO_TRACK);
    let head = 0;

    // ClickSpotCircle is a single visible circle that appears when you
    // interact with the screen.  It will diminish over time until it's radius
    // is less than 0.  It can be reset after another click.
    class ClickSpotCircle {
        constructor() {
            this.x = 0;
            this.y = 0;
            this.r = DEFAULT_CIRCLE_RADIUS;
        }
        draw() {
            ctx.fillStyle = CIRCLE_COLOR;
            drawCircle(ctx, this.x, this.y, this.r);
        }
        isFullyDiminished() {
            return this.r < 0;
        }
        diminish() {
            this.r--;
        }
        resetLocation(x, y) {
            this.x = x;
            this.y = y;
            this.r = DEFAULT_CIRCLE_RADIUS;
        }
    }

    // initialize list of Circles
    for (let i = 0; i < NUM_CIRCLES_TO_TRACK; i++) {
        listOfCircles[i] = new ClickSpotCircle();
    }

    // public function that sets a new draw location.
    function addClickLocation(x, y) {
        head++;
        if (head > NUM_CIRCLES_TO_TRACK - 1) {
            head = 0;
        }
        listOfCircles[head].resetLocation(x, y);
    }

    // public function that is called every frame to draw the circles
    // onto the screen in their current state.
    function drawAll() {
        for (let x of listOfCircles) {
            if (x.isFullyDiminished() === false) {
                x.draw();
                x.diminish();
            }
        }
    }

    return {
        addClickLocation,
        drawAll,
    }

}());

// used for overlay because you need to compute the current width/height.
function clearCanvasComputed(canvas, ctx) {
    let cs = getComputedStyle(canvas);
    let width = parseInt(cs.getPropertyValue('width'), 10);
    let height = parseInt(cs.getPropertyValue('height'), 10);
    ctx.clearRect(0, 0, width, height)
}

/**
 * drawOverlay handles all drawing events that occur on the controller overlay.
 * call this function from the main game loop when drawing other things.
 */
function draw() {
    // draw the click spots if they exist.
    ClickSpotTracker.drawAll();
    // draw joystick on the screen if neccessary.
    // if (firstTouch !== undefined) {
    //     let x = firstTouch.clientX;
    //     let y = firstTouch.clientY;
    //     drawJoyBase(ctx, x, y);
    //     drawJoyStick(ctx, x, y, (x + 15*directionX), (y + 15*directionY));
    // }
}

/**
 * Clears the overlay canvas entirely.  Call this at beginning of game loop.
 */
function clearOverlay(ctx) {
    ctx.clearRect(0, 0, 1000, 1000)
}



// __________________________________________________________________
//      Click/Tap to jump in that direction
// ==================================================================

// converts event.clientX and event.clientY to the correct position on the
// canvas.  This is needed because the canvas is resized based on the
// screen it is viewed on.  The canvas is not always 1000 x 1000 pixels,
// despite the fact that the drawing functions behave like it is.
function getMousePos(canvas, clickEvent) {
    let rect = canvas.getBoundingClientRect();
    let x = (clickEvent.clientX - rect.left) * 1000 / rect.width;
    let y = (clickEvent.clientY - rect.top) * 1000 / rect.height;
    // console.log(`(${clickEvent.clientX}, ${clickEvent.clientY}) -> (${x}, ${y})`)
    return [x, y];
}

function whenClicked(event) {
    let [x, y] = getMousePos(canvas, event);
    let playerCenterX = (myPlayer.x + myPlayer.w/2);
    let playerCenterY = (myPlayer.y + myPlayer.h/2);
    let dx = x - playerCenterX;
    let dy = y - playerCenterY;
    let [uvx, uvy] = unitVector(dx, dy);
    requestDirectionalMove(uvx, uvy);
    REQUEST_ACTION = true;
    ClickSpotTracker.addClickLocation(x, y);
};

function addClickEventListener(canvas, player) {
    canvas.addEventListener('click', whenClicked);
}



// __________________________________________________________________
//      GameController Public Interfaces
// ==================================================================

// add the event listeners
function addControlEventListeners(element) {
    element.addEventListener("touchstart" , whenTouchStarts);
    element.addEventListener("touchmove"  , whenTouchMoves);
    element.addEventListener("touchend"   , whenTouchEnds);
    element.addEventListener("touchcancel", whenTouchCancels);
}

function init(player) {
    myPlayer = player;
    document.addEventListener("keyup", whenKeyGoesUp);
    document.addEventListener("keydown", whenKeyGoesDown);
    addClickEventListener(canvas, player);
    addControlEventListeners(canvas);
}

return {
    init,
    processInputsAndStep,
    draw,
    touchTime,
    resetAllRequests,
}

}());
