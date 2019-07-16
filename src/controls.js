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
let targetX          = 0;

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



// make a request to move in a specific direction.
function requestDirectionalMove(unitVectorX, unitVectorY, x, dx, dy) {
    REQUEST_MOVE = true;
    savedUnitVectorX = unitVectorX;
    savedUnitVectorY = unitVectorY;
    saveddx = dx;
    saveddy = dy;
    targetX = x;
}

// step will go through the requests and actually execute commands.
// This function should only be executed during the main game loop, in
// order to maintain temporal consistency with the rest of the game.
function processInputsAndStep(game) {
    gamepadLoop(game);
    if (REQUEST_ACTION === true) {
        game.determinePlayerAction();
    }
    if (REQUEST_MOVE === true) {
        game.player.directionalMove(savedUnitVectorX, savedUnitVectorY, targetX, saveddx, saveddy);
        resetActionRequests();
        // return;
    }
    if (REQUEST_UP === true) {
        game.player.jump();
        // game.determinePlayerAction();
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
    // REQUEST_UP     = false
    // REQUEST_DOWN   = false
    // REQUEST_RIGHT  = false
    // REQUEST_LEFT   = false
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

function arrayAverage(arr) {
    let sum = 0;
    for (let v of arr) {
        sum += v;
    }
    return sum / arr.length;
}


// __________________________________________________________________
//      Keyboard Controls
// ==================================================================

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
//      Touch Controls  - Tracking differences between touches.
// ==================================================================
const DiffTracker = (function(){

    let listX = [];
    let listY = [];

    function add(x, y) {
        listX.push(x);
        listY.push(y);
    }

    function clear() {
        listX = [];
        listY = [];
    }

    function _averageDiff(arr) {
        let len = arr.length
        if (len < 2) {
            return 0;
        }
        let diffs = [];
        for (let i = 0; i < (len - 1); i++) {
            diffs.push(arr[i+1] - arr[i]);
        }
        return arrayAverage(diffs);
    }

    function averageDifferenceX() {
        return _averageDiff(listX);
    }

    function averageDifferenceY() {
        return _averageDiff(listY);
    }

    return {
        add,
        clear,
        averageDifferenceX,
        averageDifferenceY,
    }

}());



// __________________________________________________________________
//      Touch Controls  -  Setup
// ==================================================================
let touchTimeStart = 0;
let touchTime = 0;
let firstTouch;
let lastTouch;
let target = [-1, -1];


// __________________________________________________________________
//      Touch Controls  -  Support Functions
// ==================================================================

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
    requestDirectionalMove(uvx, uvy, x);
}


// __________________________________________________________________
//      Touch Controls  -  Events
// ==================================================================

function whenTouchStarts(event) {
    event.preventDefault();
    displayTouch(event)
    restartTimer();
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
    }
    firstTouch = undefined;
    // REQUEST_MOVE = false
    // whenClicked(lastTouch);
}

function whenTouchCancels(event) {
    firstTouch = undefined;
    REQUEST_MOVE = false
}

function displayTouch(touchEvent) {
    for (let touch of touchEvent.touches) {
        let [x, y] = getMousePos(canvas, touch)
        ClickSpotTracker.addClickLocation(x, y);
    }
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
            this.r = 0;
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

// __________________________________________________________________
//      Click/Tap to jump in that direction
// ==================================================================

function whenClicked(event) {
    let [x, y] = getMousePos(canvas, event);
    let playerCenterX = (myPlayer.x + myPlayer.w/2);
    let playerCenterY = (myPlayer.y + myPlayer.h/2);
    let dx = x - playerCenterX;
    let dy = y - playerCenterY;
    let [uvx, uvy] = unitVector(dx, dy);
    requestDirectionalMove(uvx, uvy, x, dx, dy);
    REQUEST_ACTION = true;
    // GAME.player.specialJump(dx, dy);
    ClickSpotTracker.addClickLocation(x, y);
};



// __________________________________________________________________
//      Game Pad API Controls
// ==================================================================

window.addEventListener("gamepadconnected", function(e) {
    console.log(
        "Gamepad connected at index %d: %s. %d buttons, %d axes.",
        e.gamepad.index, e.gamepad.id,
        e.gamepad.buttons.length, e.gamepad.axes.length
    );
});

window.addEventListener("gamepaddisconnected", function(e){
    console.log("Gamepad has been disconnected.")
});

function gamepadLoop(game) {
    if (navigator.getGamepads().length !== 1) {
        return;
    }
    let gp = navigator.getGamepads()[0];
    let moveX = gp.axes[0];
    let moveY = gp.axes[1];
    let pressA = gp.buttons[0].pressed;
    let pressB = gp.buttons[1].pressed;
    let pressX = gp.buttons[2].pressed;
    let pressY = gp.buttons[3].pressed;
    if (moveX < -0.5) {
        game.player.moveLeft();
    }
    if (moveX > 0.5) {
        game.player.moveRight();
    }
    if ((moveY < -0.5) || pressA || pressB || pressX || pressY) {
        game.player.jump();
    }
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
    canvas.addEventListener('mousedown', whenClicked);
    addControlEventListeners(canvas);
}

function draw() {
    ClickSpotTracker.drawAll();
}

return {
    init,
    processInputsAndStep,
    draw,
    touchTime,
    resetAllRequests,
    gamepadLoop,
}

}());
