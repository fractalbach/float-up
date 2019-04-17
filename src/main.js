var GAME;
(function(){

// main elements and constants
const q = document.querySelector.bind(document);

// numerical constants used throughout the game.
const GAME_WIDTH        = 1000;
const GAME_HEIGHT       = 1000;
const SCREEN_MIDDLE     = 400;

const MAX_PLAYER_SPEED  = 8;    // player's vx max
const MAX_JUMP_SPEED    = 20;   // player's vy max
const TERMINAL_VELOCITY = 10;   // can't fall faster than TERMINAL_VELOCITY.
const GRAVITY_VELOCITY  = 0.5;  // yes, in this game, gravity is a velocity.

const FEEDBACK_BUFFER   = 20;   // in # of frames
const MIN_BALLOON_LIFE  = 30;  // in # of frames
const MAX_BALLOON_LIFE  = 140;  // in # of frames
const BALLOON_RADIUS    = 100;  // pixels per frame
const BALLOON_RISING    = 5;    // pixels per frame: how fast the ballon rises

const EASY_MIN_BALLOON_LIFE = 80;

const MIN_BALLOON_INTERVAL = 100
const MAX_BALLON_INTERVAL  = 400

// altitude keeps track of how high the player has gone through the game.
// this is directly related to the score.
let currentAltitude = SCREEN_MIDDLE;

// retrieve images.
const IMG_BALLOON = q("#img_balloon");
const IMG_STAND   = q("#img_stand");
const IMG_GRAB    = q("#img_grab");
const IMG_JUMP    = q("#img_jump");
const IMG_POP     = q("#img_pop");

// enums: animation
const ANIM_STAND = 101;  // player is standing on a platform
const ANIM_GRAB  = 102;  // player is holding a balloon
const ANIM_JUMP  = 103;  // player is somewhere in the air


// ANIMS maps a player's action to the image that will be drawn on the screen.
// This is likely to expand during development as more animations are added.
const ANIMS = new Map([
    [ANIM_STAND, IMG_STAND],
    [ANIM_GRAB,  IMG_GRAB],
    [ANIM_JUMP,  IMG_JUMP],
]);


// helpful math
function randbetween(min, max) {
    return Math.random()*(max - min) + min
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                              Chapter 1
//
//                      The Balloon and the Player
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// __________________________________________________________________
//      Balloon
// ==================================================================

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
    constructor(x, y, r, easyMode) {
        this.type = 'Balloon';
        this.x = x;
        this.y = y;
        this.r = r;
        this.altitude = y;
        this.id = 0;
        this.has_been_touched = false;
        this.has_popped = false;
        this.rising_speed = BALLOON_RISING;
        this.min_altitude = this.altitude;
        if (easyMode === true) {
            this.max_altitude = this.altitude + randbetween(EASY_MIN_BALLOON_LIFE, MAX_BALLOON_LIFE) * this.rising_speed;
        } else {
            this.max_altitude = this.altitude + randbetween(MIN_BALLOON_LIFE, MAX_BALLOON_LIFE) * this.rising_speed;
        }
    }

    step() {
        if (this.has_been_touched === true) {
            if (this.altitude >= this.max_altitude) {
                this._pop();
            } else {
                this._rise();
            }
        }
    }

    _rise() {
        this.y -= this.rising_speed;
        this.altitude += this.rising_speed;
    }

    _pop() {
        if (this.has_popped === false) {
            GameSoundEffects.playBalloonPopSound()
        }
        this.has_popped = true;
    }

    touch() {
        this.has_been_touched = true;
    }

    isRising() {
        return this.has_been_touched;
    }

    hasPopped() {
        return this.has_popped;
    }

    // TODO: rename "string" in "BalloonString" to "rope" or "twine".
    //       it's WAY TOO CONFUSING to have the word "string" everywhere.

    // TODO: seperate out Balloon and the BalloonString
    //       do this when you need the balloons to collide with each other.

    // Bounds for the BalloonString.
    stringX() {return this.x - 0.5*this.r/2;}
    stringY() {return this.y + 2*this.r;}
    stringW() {return this.r/2;}
    stringH() {return this.r;}

    // Currently detecting collisions with the string, which is what is
    // needed right now.
    lowX()  {return this.stringX()}
    lowY()  {return this.stringY()}
    highX() {return this.stringX() + this.stringW()}
    highY() {return this.stringY() + this.stringH()}

    // Bounds for the Balloon itself.
    // lowX(){return this.x - this.r;}
    // lowY(){return this.y - this.r;}
    // highX(){return this.x + this.r;}
    // highY(){return this.y + this.r;}

}


// __________________________________________________________________
//      Player
// ==================================================================


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
        this.type = 'Player';
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vx = 0;
        this.vy = 0;
        this.isFalling = false;
        this.isGrabbing = false;
        this.anim = ANIM_STAND;
        this.myBalloon = undefined;
        this.friction = 0.5;
        this.altitude = 0;
        this.cooldown = 0;
    }

    jump(unitVectorY) {
        if ((this.y > 0) && (this.isFalling !== true)) {
            this.anim = ANIM_JUMP;
            this.vy = -MAX_JUMP_SPEED;
            this.isFalling = true;
            this.isGrabbing = false;
            this.cooldown = 20;
        }
    }

    grab(balloon) {
        // this.y = balloon.y;
        // console.log("grab!")
        this.anim = ANIM_GRAB;
        this.vy = 0;
        this.vx = 0;
        this.isFalling = false;
        this.isGrabbing = true;
        this.myBalloon = balloon;
        balloon.touch();
    }

    moveLeft() {
        if (this.x > 0) {
            this.vx = -MAX_PLAYER_SPEED;
        }
        if (this.isGrabbing === true) {
            this.x += this.vx;
        }
    }

    moveRight() {
        if (this.x < GAME_WIDTH - this.w) {
            this.x += MAX_PLAYER_SPEED
            // this.vx = MAX_PLAYER_SPEED;
        }
        // if (this.isGrabbing === true) {
        //     this.x += this.vx;
        // }
    }

    moveUp() {}

    moveDown() {}

    directionalMove(unitVectorX, unitVectorY, lastX) {
        this.jump(unitVectorY);
        if (Math.abs((this.x + this.w/2) - lastX) < MAX_PLAYER_SPEED) {
            return;
        }
        let move = unitVectorX * MAX_PLAYER_SPEED;
        if (((move < 0) && (this.x + move > 0)) ||
            ((move > 0) && (this.x + move < GAME_WIDTH - this.w))
        ){
            // this.x = this.x + move;
            this.vx = move;
        }
    }

    step() {
        // this.doFriction();
        if (this.isGrabbing === true) {
            // check to see if the balloon has popped.
            if (this.myBalloon.hasPopped() === false) {
                // rise with the balloon
                this.y -= this.myBalloon.rising_speed;
                // check if you are still holding onto the balloon
                if (GameObjectManager.hasCollision(this, this.myBalloon)) {
                    return;
                }
            }
            // uh oh, you've lost your balloon!
            this.myBalloon = undefined;
            this.isGrabbing = false;
        }
        if ((this.y + this.vy) > (GAME_HEIGHT - this.h)) {
            // hurray! you aren't falling.
            this.y = GAME_HEIGHT - this.h + 1
            this.vy = 0;
            this.isFalling = false;
            this.anim = ANIM_STAND;
        }
        if (this.cooldown <= 0) {
            let collisions = GameObjectManager.findCollisionsWith(this);
            if (collisions.length > 0) {
                this.grab(collisions[0])
                GameController.resetAllRequests();
                return;
            }
        }
        if (this.cooldown > 0) {
            this.cooldown--
        }
        this._doGravity();
        this._stepY()
        this._doFriction();
        this._stepX();
    }

    _stepY() {
        this.y += this.vy;
    }

    _stepX() {
        if ((this.x + this.vx < 0) || (this.x + this.vx > GAME_WIDTH - this.w)){
            this.vx = 0;
        } else {
            this.x += this.vx;
        }
    }

    _doGravity() {
        if (this.vy < TERMINAL_VELOCITY) {
            this.vy += GRAVITY_VELOCITY
        }
    }

    _doFriction() {
        let s = Math.sign(this.vx)
        let v = Math.abs(this.vx)
        let next = v - this.friction;
        if (next < 0) {
            this.vx = 0;
        } else {
            this.vx = s * next;
        }
    }

    lowX(){return this.x}
    lowY(){return this.y}
    highX(){return this.x + this.w}
    highY(){return this.y + this.h}
}



// __________________________________________________________________
//      Game Object Manager
// ==================================================================
// The game object manager abstracts away the data structures used
// to hold and compare game objects.  One of it's main goals is to
// support collision detection, which often relies upon special
// structures that are un-natural to work with at a higher level.

// Currently:
// is NOT implemented efficiently because there aren't that many
// objects that need collision detection.  When needed, swap out
// the underlying structures here.

// For better efficiency (once it's needed):
// TODO: use a self-balancing binary search tree instead of sorted list.
// TODO: make sure that tree is able to re-sort itself once objects move.

const GameObjectManager = (function(){

    let nextid = 333;
    let objects = new Map();

    function size() {
        return objects.size;
    }

    function _makeUID() {
        nextid++;
        return nextid;
    }

    function compareX (object1, object2) {
        return (object1.lowX() - object2.lowX())
    }

    function compareY (object1, object2) {
        return (object1.lowY() - object2.lowY())
    }

    function hasCollision(A, B) {
        if (!A || !B) {
            return false;
        }
        if (
            A.lowX() < B.highX() &&
            B.lowX() < A.highX() &&
            A.lowY() < B.highY() &&
            B.lowY() < A.highY()
        ){
            return true;
        }
        return false;
    }

    function add(object) {
        let id = _makeUID();
        object.id = id;
        objects.set(id, object);
        return id;
    }

    function remove(id) {
        let result = objects.delete(id);
        return result;
    }

    // forEach has similar behavior to Array.forEach
    function forEach(fn) {
        for (let v of objects.values()) {
            fn(v);
        }
    }

    // return all objects that are colliding with the given object.
    // A is a reference to an object.
    function findCollisionsWith(A) {
        let results = new Array();
        // TODO: use binary search instead.
        for (let B of objects.values()) {
            if (A == B) {
                continue;
            }
            if (hasCollision(A,B)) {
                results.push(B);
            }
        }
        return results;
    }

    // GameObjectManager public interfaces.
    return {
        size,
        add,
        remove,
        forEach,
        findCollisionsWith,
        hasCollision,
        compareX,
        compareY,
    }

}());



// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                              Chapter 2
//
//                            The Game View
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// The Game View is in regards to how the game itself is displayed.  This
// is where special drawing functions are declared.


// canvas context settings.
const canvas = q("#game");
const ctx = canvas.getContext("2d");
ctx.lineWidth = 5;
ctx.lineCap = 'round';


const GameView = (function(){

    let cameraY = 0;

    // moves the screen upwards (increases altitude) when the Player
    // is more than halfway up the screen.
    function updateAltitude(player) {
        if (player.y < SCREEN_MIDDLE) {
            let n = (SCREEN_MIDDLE - player.y);
            currentAltitude += n;
            player.y +=n;
            GameObjectManager.forEach(function(object){
                object.y += n;
            })
        }
    }

    function draw(object) {
        switch (object.type) {
            case 'Balloon': return drawBalloon(object);
            case 'Player':  return drawPlayer(object);
        }
    }

    function drawPlayer(player) {
        ctx.drawImage(ANIMS.get(player.anim),
            0, 0, 250, 500,
            player.x, player.y, player.w, player.h
        );
    }


    function drawBalloon(b) {
        ctx.strokeStyle = 'black'

        // draw the balloon's string
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + 3*b.r)
        ctx.lineTo(b.x, b.y + b.r)
        ctx.stroke();

        // draw triangle thing that connects balloon to its string.
        ctx.beginPath();
        ctx.moveTo(b.x - 15,   b.y + b.r)
        ctx.lineTo(b.x + 15,   b.y + b.r)
        ctx.lineTo(b.x,        b.y + b.r - 30)
        ctx.lineTo(b.x - 15,   b.y + b.r)
        ctx.stroke();

        // determine how close the ballon is to it's pop altitude.
        let rat = (b.altitude - b.min_altitude) / (b.max_altitude - b.min_altitude);

        // if the balloon is about to be popped, show a pop image.
        if (rat > 0.9) {
            ctx.drawImage(
                IMG_POP,
                0, 0, 461, 452,
                (b.x - b.r), (b.y - b.r), (2*b.r), (2*b.r)
            );
            return;
        }

        // set fill color based on the remaining lifetime of the balloon.
        let v = 255 * rat;
        ctx.fillStyle = `rgba(255, ${255 - v}, ${255 - v}, ${rat})`;

        // draw balloon twice: once for inner fill, and another for outline.
        for (let i=0; i<2; i++) {
            // left half of balloon
            ctx.beginPath();
            ctx.moveTo(b.x,  b.y + b.r - 30);
            ctx.bezierCurveTo(
                b.x - b.r/1.2,  b.y + b.r /3,   // control point 1
                b.x - b.r/1.2,  b.y - b.r,      // control point 2
                b.x,            b.y - b.r       // top of balloon
            );
            // right half of balloon
            ctx.moveTo(b.x,  b.y + b.r - 30);
            ctx.bezierCurveTo(
                b.x + b.r/1.2,  b.y + b.r / 3,  // control point 1
                b.x + b.r/1.2,  b.y - b.r,      // control point 2
                b.x,            b.y - b.r       // top of balloon
            );
            // determine if we are drawing the outline or the filling.
            if (i==0) {
                ctx.fill();
            } else {
                ctx.stroke();
            }
        }


        // ctx.drawImage(IMG_BALLOON,
        //     0, 0, 500, 1000,
        //     (b.x - b.r), (b.y - b.r), (2*b.r), (4*b.r)
        // );
    }

    return {
        draw,
        drawPlayer,
        drawBalloon,
        updateAltitude,
    }

}())

// __________________________________________________________________
//      General Drawing Functions
// ==================================================================

function drawCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2*Math.PI);
    ctx.fill();
}

function drawLine(ctx, x0, y0, xf, yf) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(xf, yf);
    ctx.stroke();
}

function clearCanvas(ctx) {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
}

// __________________________________________________________________
//      Specialized Drawing Functions
// ==================================================================

function drawBoundingBox(ctx, object) {
    ctx.fillStyle = 'rgba(0, 0, 255, 0.1)'
    ctx.fillRect(
        object.lowX(),
        object.lowY(),
        object.highX() - object.lowX(),
        object.highY() - object.lowY()
    );
}

function drawPlayerBoundingBox(ctx, object) {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'
    ctx.fillRect(
        object.lowX(),
        object.lowY(),
        object.highX() - object.lowX(),
        object.highY() - object.lowY()
    );
}




// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                              Chapter 4
//
//                      Putting it all Together
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// The Game Object helps wrap together all of the bits and peices.
// The Game Loop is what runs every frame.
// The Main Function is called once all of the resources on the web page
// are loaded, creates the Game Object, and then kicks off the Game Loop!

// enums:
const STATE_ON    = 201;
const STATE_FALL  = 202;

// __________________________________________________________________
//      Game Object
// ==================================================================

class Game {
    constructor() {
        this.player       = new Player(SCREEN_MIDDLE + 10, GAME_HEIGHT - 150, 100, 150)
        this.controller   = GameController
        this.score        = 0;
        this.highestScore = 0;
        this.state        = STATE_ON;
        this.fallAnim = {
            iter: 0,
            saved_background: ''
        }
        this.startTime = (new Date()).getTime()
        this.savedLastScore;
        this.savedLastTime;
        this.lastNewBalloonAltitude = currentAltitude;
        this.nextBallonInterval = randbetween(MIN_BALLOON_INTERVAL, MAX_BALLON_INTERVAL);
        this.controller.init(this.player);
        this.initDebugger()
    }

    initExample1() {
        // create a convenient balloon that you can always reach.
        GameObjectManager.add(new Balloon(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 5*BALLOON_RADIUS,
            BALLOON_RADIUS
        ));
        // make some random balloons
        for (let i=0; i<7; i++) {
            GameObjectManager.add(new Balloon(
                randbetween(0, GAME_WIDTH - BALLOON_RADIUS),
                GAME_HEIGHT - 5*BALLOON_RADIUS - (i * 100),
                BALLOON_RADIUS
            ));
        }
    }

    step() {
        // TODO: better state changes.
        if (this.state === STATE_FALL) {
            this._doFallingAnimation();
            return;
        }
        //
        GameController.processInputsAndStep(this);
        this.player.step();
        GameObjectManager.forEach((balloon)=>{
            balloon.step();
            // delete objects that have gone below the screen.
            if (balloon.y > GAME_HEIGHT) {
                GameObjectManager.remove(balloon.id);
                return;
            }
            // delete balloons that have already poppped
            if (balloon.hasPopped() === true) {
                GameObjectManager.remove(balloon.id);
                return;
            }
        })
        GameView.updateAltitude(this.player);
        //
        // make a new balloon after a certain amount of distance has passed.
        if (currentAltitude - this.lastNewBalloonAltitude > this.nextBallonInterval) {
            this.nextBallonInterval = randbetween(MIN_BALLOON_INTERVAL, MAX_BALLON_INTERVAL);
            this.makeRandBalloonAtTopOfScreen();
            this.lastNewBalloonAltitude = currentAltitude;
        }
        //
        // update game score and check for losing state.
        if (this.score > this.highestScore) {
            this.highestScore = this.score;
        }
        if (this.player.y >= GAME_HEIGHT - this.player.h) {
            this.savedLastScore = this.score;
            this.savedLastTime = (new Date).getTime() - this.startTime;
            this.score = 0;
            if (currentAltitude > SCREEN_MIDDLE + 1) {
                this._startFallAnimation();
            }
            currentAltitude = SCREEN_MIDDLE;
            this.lastNewBalloonAltitude = currentAltitude;
        } else {
            this.score = Math.floor((currentAltitude - SCREEN_MIDDLE) / 100)
        }
    }

    _startFallAnimation() {
        this.state = STATE_FALL;
        this.fallAnim.iter = 0;
        this.player.anim = ANIM_JUMP;
        this.fallAnim.saved_background = canvas.style.background;
        GameController.resetAllRequests();
        q('#endgame_score').innerText = this.savedLastScore;
        q('#endgame_message').classList.remove('hidden');
        // q('#score_prompt_score_txt').innerText = this.savedLastScore;
        // GameHighscores.handle(this.savedLastScore);
    }

    _doFallingAnimation() {
        this.fallAnim.iter++;
        let x = 255 - 2*this.fallAnim.iter;
        if (x > 0) {
            canvas.style.background = `rgb(${x},${x},${x})`;
        } else {
            canvas.style.background = `rgb(0,0,0)`;
        }
        GameObjectManager.forEach((balloon)=>{
            balloon.y -= this.fallAnim.iter;
            if (balloon.y < 0) {
                GameObjectManager.remove(balloon.id);
            }
        });
        if (this.fallAnim.iter > 50  && GameObjectManager.size() <= 0) {
            this._endFallAnimation();
        }
    }

    _endFallAnimation() {
        this.state = STATE_ON;
        this.initExample1();
        canvas.style.background = this.fallAnim.saved_background;
        q('#endgame_message').classList.add('hidden');
        this.startTime = (new Date()).getTime()
    }

    drawScreen() {
        GameController.draw();
        // draw the player.
        drawPlayerBoundingBox(ctx, this.player);
        // draw each of the objects onto the screen.
        GameObjectManager.forEach(function(object){
            GameView.draw(object);
            drawBoundingBox(ctx, object);
        });
        GameView.drawPlayer(this.player);
    }

    clearScreen() {
        // GameController.clearOverlay();
        clearCanvas(ctx);
    }

    determinePlayerAction() {
        // this.player.jump()
    }

    initDebugger() {
        Debugger.add('high', 'Highest');
        Debugger.add('score', 'Score');
    }

    updateDebugger() {
        Debugger.set('high', this.highestScore);
        Debugger.set('score', this.score);
    }
    //
    // makeRandBalloon(minX, maxX) {
    //     GameObjectManager.add(new Balloon(
    //         (Math.random()*(maxX - minX) + minX),
    //         -3*BALLOON_RADIUS,
    //         BALLOON_RADIUS
    //     ));
    // }

    makeRandBalloonAtTopOfScreen() {
        // randomly generates a new balloon, ensuring that new balloons
        // don't appear directly above you. (otherwise it would be too easy.)
        // if you aren't holding a balloon, it can just appear anywhere.
        //
        let r = randbetween(2*BALLOON_RADIUS, 1000-BALLOON_RADIUS)
        if (this.player.isGrabbing === true) {
            let buff = 4*BALLOON_RADIUS;
            let lowX = this.player.myBalloon.x - buff/2;
            r = randbetween(2*BALLOON_RADIUS, 1000-BALLOON_RADIUS-buff)
            if (r > lowX) {
                r += buff;
            }
        }
        let easymode = (this.score < 100);
        let nextBalloon = new Balloon(r, -3*BALLOON_RADIUS, BALLOON_RADIUS, easymode);
        GameObjectManager.add(nextBalloon)
        // this.makeRandBalloon(2*BALLOON_RADIUS, 1000-BALLOON_RADIUS)
    }
}




// __________________________________________________________________
//      Main  (executed when page finishes loading.)
// ==================================================================

function main() {
    let game = new Game()
    game.initExample1()
    GAME = game;

    // __________________________________________________________________
    //      Game Loop
    // ==================================================================
    function loop() {
        game.clearScreen();
        game.step();
        game.drawScreen();
        game.updateDebugger();
        window.requestAnimationFrame(loop);
    }

    window.requestAnimationFrame(loop);
}



// run main only after the DOM elements have finished loading.
// this gives a chance for the images to load.
window.addEventListener('load', main);

}());
