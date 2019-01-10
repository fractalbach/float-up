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
const overlay = q("#overlay");
const overlayContext = overlay.getContext("2d");

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
window.addEventListener("keydown", function(event) {
    switch (event.code) {
        case 'ArrowUp':     REQUEST_UP = true; return;
        case 'ArrowDown':   REQUEST_DOWN = true; return;
        case 'ArrowLeft':   REQUEST_LEFT = true; return;
        case 'ArrowRight':  REQUEST_RIGHT = true; return;
        case 'Space':       REQUEST_ACTION = true;  return; // might need cooldown.
    }
});

window.addEventListener("keyup", function(event) {
    switch (event.code) {
        case 'ArrowUp':     REQUEST_UP = false; return;
        case 'ArrowDown':   REQUEST_DOWN = false; return;
        case 'ArrowLeft':   REQUEST_LEFT = false; return;
        case 'ArrowRight':  REQUEST_RIGHT = false; return;
    }
});





// __________________________________________________________________
//      Touch Controls  ~  Setup
// ==================================================================
let touchTimeStart = 0;
let touchTime = 0;
let isTouching = 0;
let firstTouch;

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
    let dx = event.touches[0].clientX - firstTouch.clientX;
    let dy = event.touches[0].clientY - firstTouch.clientY;
    let uv = unitVector(dx, dy);
    let uvx = uv[0]
    let uvy = uv[1]
    requestDirectionalMove(uvx, uvy);
}


// __________________________________________________________________
//      Touch Controls  ~  Events
// ==================================================================

function whenTouchStarts(event) {
    restartTimer();
    isTouching = 1;
    firstTouch = event.touches[0];
}

function whenTouchMoves(event) {
    event.preventDefault();
    updateTouchTime();
    calculateDirectionAndRequest(event);
}

function whenTouchEnds(event) {
    touchTime = performance.now() - touchTimeStart;
    if (touchTime < TAP_DELAY) {
        REQUEST_ACTION = true;
        return;
    }
    isTouching = 0;
    firstTouch = undefined;
    REQUEST_MOVE = false
}

function whenTouchCancels(event) {
    isTouching = 0;
    firstTouch = undefined;
    REQUEST_MOVE = false
}

// __________________________________________________________________
//      Drawing on the Controller's Overlay
// ==================================================================

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
function drawOverlay() {
    // draw joystick on the screen if neccessary.
    if (firstTouch !== undefined) {
        let x = firstTouch.clientX;
        let y = firstTouch.clientY;
        drawJoyBase(this.overlayContext, x, y);
        drawJoyStick(this.overlayContext, x, y, (x + 15*directionX), (y + 15*directionY));
    }
}

/**
 * Clears the overlay canvas entirely.  Call this at beginning of game loop.
 */
function clearOverlay() {
    clearCanvasComputed(overlay, overlayContext)
}



// __________________________________________________________________
//      Click/Tap to jump in that direction
// ==================================================================

function addClickEventListener(player) {
    function whenClicked(event) {
        let rec = q('#game').getBoundingClientRect();
        let playerX = rec.x + (player.x + player.w/2)*rec.width/1000;
        let playerY = rec.y + (player.y + player.h/2)*rec.height/1000;
        let dx = event.clientX - playerX;
        let dy = event.clientY - playerY;
        let [uvx, uvy] = unitVector(dx, dy);
        requestDirectionalMove(uvx, uvy);
        REQUEST_ACTION = true;
    };
    overlay.addEventListener('click', whenClicked);
}



// __________________________________________________________________
//      GameController Public Interfaces
// ==================================================================

// add the event listeners
function addControlEventListeners() {
    overlay.addEventListener("touchstart" , whenTouchStarts);
    overlay.addEventListener("touchmove"  , whenTouchMoves);
    overlay.addEventListener("touchend"   , whenTouchEnds);
    overlay.addEventListener("touchcancel", whenTouchCancels);
}

function init(player) {
    addClickEventListener(player);
    // addControlEventListeners();
}

return {
    init,
    processInputsAndStep,
    drawOverlay,
    clearOverlay,
    touchTime,
    resetAllRequests,
}

}());
