(function(){

// canvas constants
const q = document.querySelector.bind(document);
const canvas = q("#game");
const ctx = canvas.getContext("2d");
const GAME_WIDTH  = 1000;
const GAME_HEIGHT = 1000;
ctx.lineWidth = 8;
ctx.lineCap = 'round';

// retrieve images.
const IMG_BALLOON = q("#img_balloon");
const IMG_STAND   = q("#img_stand");
const IMG_GRAB    = q("#img_grab");
const IMG_JUMP    = q("#img_jump");

// enums: animation
const ANIM_STAND = 101;  // player is standing on a platform
const ANIM_GRAB  = 102;  // player is holding a balloon
const ANIM_JUMP  = 103;  // player is somewhere in the air



// /**
//  * COMMANDS_REQUESTED maps a game commmand to it's current requested state.
//  * When a human uses some input method to say "please jump", the value of
//  * CMD_JUMP would become true.  After each frame, all the values are refreshed
//  * back to false.
//  * @type {Map}
//  */
// let COMMANDS_REQUESTED = new Map([
//     [CMD_ACTION, false],
//     [CMD_JUMP, false],
//     [CMD_GRAB, false],
//     [CMD_LEFT, false],
//     [CMD_RIGHT, false],
//     [CMD_UP, false],
//     [CMD_DOWN, false],
// ])

/**
 * ANIMS maps a player's action to the image that will be drawn on the screen.
 * This is likely to expand during development as more animations are added.
 * @type {Map}
 */
const ANIMS = new Map([
    [ANIM_STAND, IMG_STAND],
    [ANIM_GRAB,  IMG_GRAB],
    [ANIM_JUMP,  IMG_JUMP],
]);





/**
 * balloon object is a single balloon and its attributes.
 * There will be many instances of these, and many will be created
 * and deleted throughout the game.
 */
class Balloon {
    /**
     * Create a balloon of a specific size at a specific location.
     * @param {Number} x middle of balloon
     * @param {Number} y middle of balloon (also y-axis of string.)
     * @param {Number} r radius of the balloon
     */
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }

    draw() {
        ctx.drawImage(IMG_BALLOON,
            0, 0, 500, 1000,
            (this.x - this.r), (this.y - this.r), (2*this.r), (4*this.r)
        );
    }
}



/**
 * player is the class object of the main player.
 * There should only be 1 instance of player: You.
 * Representing the player in the form of a class is mainly for convenience,
 * and for collision detection.
 */
class Player {
    /**
     * The constructor is used to determine the size of the image
     * as it is drawn on the canvas.
     * @param {Number} x upper-left corner
     * @param {Number} y upper-left corner
     * @param {Number} w width
     * @param {Number} h height.
     */
    constructor(x,y,w,h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vx = 0;
        this.vy = 0;
        this.isFalling = false;
        this.anim = ANIM_STAND;
    }

    jump() {
        if ((this.y > 0) && (this.isFalling !== true)) {
            this.anim = ANIM_JUMP;
            this.vy -= 20;
            this.isFalling = true;
        }
    }

    moveLeft() {
        if (this.x > 0) {
            this.x -= 5;
        }
    }

    moveRight() {
        if (this.x < (GAME_WIDTH - this.w)) {
            this.x += 5;
        }
    }

    step() {
        if ((this.y + this.vy) > (GAME_HEIGHT - this.h)) {
            this.y = GAME_HEIGHT - this.h + 1
            this.vy = 0;
            this.isFalling = false;
            this.anim = ANIM_STAND;
        } else {
            this.vy += 1
        }
        this.y += this.vy;
    }

    draw() {
        ctx.drawImage(ANIMS.get(this.anim),
            0, 0, 250, 500,
            this.x, this.y, this.w, this.h
        );
    }
}


function drawCircle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2*Math.PI);
    ctx.fill();
}

function drawLine(x0, y0, xf, yf) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(xf, yf);
    ctx.stroke();
}

function clearCanvas() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
}


function main() {

    let u   = 100;      // side length of a gridline.
    let max = 1000;     // width/height of canvas.
    let g   = (n)=>n*u  // conversion function: grids --> pixels

    // Draw a grid just for debugging and development.
    for (let i=0; i<(Math.floor(max/u)); i++) {
        // vertical lines:
        ctx.beginPath();
        ctx.moveTo(i*u, 0);
        ctx.lineTo(i*u, max);
        ctx.stroke();
        // horizontal lines:
        ctx.beginPath()
        ctx.moveTo(0, i*u);
        ctx.lineTo(max, i*u);
        ctx.stroke();
    }

    // Init example object map.
    let m = new Map();  // all of the objects in the game.
    let p = new Player(g(2), g(3), g(1), g(2))
    let b = new Balloon(g(3), g(3), g(1))
    m.set('player', p)
    m.set('example', b)

    // Initialize the input manager and the input event listeners.
    let IM = new InputManager();
    console.log(IM)

    const debug_state = q("#debug_state");

    // define the game command functions.
    IM.setCommandFunction(IM.CMD.ACTION, function(){
        p.jump()
    });
    IM.setCommandFunction(IM.CMD.LEFT, function(){
        p.moveLeft()
    });
    IM.setCommandFunction(IM.CMD.RIGHT, function(){
        p.moveRight()
    });

    // add event listeners to trigger the input manager.
    window.addEventListener("keydown", function(event) {
        IM.pressKey(event.code);
    });
    window.addEventListener("keyup", function(event) {
        IM.releaseKey(event.code);
    });



    //  ~~~~~~~~~~~~~~~~ Dealing with Touch Interfaces ~~~~~~~~~~~~~~~~~~~~~~

    let touchTimeStart = 0;
    let isTouching = 0;
    let direction = 0;
    let firstTouch;

    canvas.addEventListener("touchstart", function(event){
        touchTimeStart = performance.now();
        isTouching = 1;
        firstTouch = event.touches[0];
    });

    canvas.addEventListener("touchmove", function(event){
        event.preventDefault();
        let diff = event.touches[0].clientX - firstTouch.clientX;
        q('#debug_diff').innerText = Math.floor(diff);
        if (diff > 0) {
            direction = 1
            IM.turnOn(IM.CMD.RIGHT);
        } else {
            IM.turnOff(IM.CMD.RIGHT);
        }
        if (diff < 0) {
            direction = -1;
            IM.turnOn(IM.CMD.LEFT);
        } else {
            IM.turnOff(IM.CMD.LEFT);
        }
    });

    canvas.addEventListener("touchend", function(event){
        let touchTime = (performance.now() - touchTimeStart);
        if (touchTime < 100) {
            IM.turnOn(IM.CMD.ACTION);
        }
        q('#debug_touchTime').innerText = Math.floor(touchTime) + ' ms'
        IM.turnOff(IM.CMD.LEFT);
        IM.turnOff(IM.CMD.RIGHT);
        isTouching = 0;
        direction = 0;
        firstTouch = undefined;
    });

    canvas.addEventListener("touchcancel", function(event){
        IM.turnOff(IM.CMD.LEFT);
        IM.turnOff(IM.CMD.RIGHT);
        isTouching = 0;
        direction = 0;
        firstTouch = undefined;
    });

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



    // THE LOOP
    const loop = function() {
        clearCanvas();
        IM.runCommands();
        debug_state.innerText = IM.stateString();

        p.step();
        for (let o of m.values()) {
            o.draw();
        }
        if (firstTouch !== undefined) {
            let rect = canvas.getBoundingClientRect();
            let x = firstTouch.clientX - rect.left;
            let y = firstTouch.clientY - rect.top;
            ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
            drawCircle(x, y, 20);
            ctx.fillStyle = 'black';
            if (direction === (-1)) {
                ctx.strokeStyle = 'lightgray';
                drawLine(x, y, x-15, y);
                drawCircle(x-20, y, 10);
            } else if (direction === 1) {
                ctx.strokeStyle = 'lightgray';
                drawLine(x, y, x+15, y);
                drawCircle(x+20, y, 10);
            }
        }
        IM.turnOff(IM.CMD.ACTION);
        window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);

}

// run main only after the DOM elements have finished loading.
// this gives a chance for the images to load.
window.addEventListener('load', main);

}());
