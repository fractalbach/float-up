var GAME;
(function(){

// main elements and constants
const q = document.querySelector.bind(document);
const canvas = q("#game");
const ctx = canvas.getContext("2d");
const GAME_WIDTH  = 1000;
const GAME_HEIGHT = 1000;
const MAX_PLAYER_SPEED = 8;

// canvas context settings init.
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


// global variables.
// middle of the screen.
let currentAltitude = 500;


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                              Chapter 1
//
//                            The Game Model
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// The Game Model is part of the MVC (Model-View-Controller) architecture
// pattern. It is the "logic" part of the game. It lives in a world that
// is independent from what is visual on the screen.
//
//    In reality, the objects within have draw() functions in their model,
// even though this breaks the rule above. This is because it's written in
// javascript, but when ported to another language, these could be supplied
// as "abstract functions" to be determined later in the View part.
//


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
    constructor(x, y, r) {
        this.type = 'Balloon';
        this.x = x;
        this.y = y;
        this.r = r;
        this.altitude = y;
        this.id = 0;
    }

    // TODO: rename "string" in "BalloonString" to "rope" or "twine".
    //       it's WAY TOO CONFUSING to have the word "string" everywhere.

    // TODO: seperate out Balloon and the BalloonString
    //       do this when you need the balloons to collide with each other.

    // Bounds for the BalloonString.
    stringX() {return this.x - 0.5*this.r/2;}
    stringY() {return this.y + 2.5*this.r;}
    stringW() {return this.r/2;}
    stringH() {return this.r/2;}

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
        this.actionCooldown = 0;
        this.friction = 0.5;
        this.altitude = 0;
    }

    jump() {
        if ((this.y > 0) && (this.isFalling !== true)) {
            this.anim = ANIM_JUMP;
            this.vy -= 20;
            this.isFalling = true;
            this.isGrabbing = false;
        }
    }

    grab(balloon) {
        // this.y = balloon.y;
        console.log("grab!")
        this.anim = ANIM_GRAB;
        this.vy = 0;
        this.isFalling = false;
        this.isGrabbing = true;
        this.myBalloon = balloon;
    }

    moveLeft() {
        if (this.x > 0) {
            this.x -= MAX_PLAYER_SPEED;
        }
    }

    moveRight() {
        if (this.x < this.w + GAME_WIDTH) {
            this.x += MAX_PLAYER_SPEED;
        }
    }

    moveUp() {}

    moveDown(){}

    directionalMove(unitVectorX, unitVectorY) {
        let move = unitVectorX * MAX_PLAYER_SPEED;
        if (((move < 0) && (this.x + move > 0)) ||
            ((move > 0) && (this.x + move < GAME_WIDTH - this.w))
        ){
            this.x = this.x + move;
        }
    }

    step() {
        // this.doFriction();
        if (this.isGrabbing === true) {
            if (GameObjectManager.hasCollision(this, this.myBalloon)) {
                return;
            }
            // uh oh, you've lost your balloon!
            this.myBalloon = undefined;
            this.isGrabbing = false;
        }
        if ((this.y + this.vy) > (GAME_HEIGHT - this.h)) {
            this.y = GAME_HEIGHT - this.h + 1
            this.vy = 0;
            this.isFalling = false;
            this.anim = ANIM_STAND;
        } else {
            this.vy += 1
        }
        this.y += this.vy;
        // this.doXmovement();
    }

    doXmovement() {
        if ((this.x + this.vx < 0) || (this.x + this.vx > (GAME_WIDTH - this.w))) {
            this.vx = 0;
        }
        this.x += this.vx;
    }

    doFriction() {
        if (Math.abs(this.vx) < this.friction) {
            this.vx = 0;
            return;
        }
        if (this.vx > 0) {
            this.vx -= this.friction
        } else {
            this.vx += this.friction
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

GameObjectManager = (function(){

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

const GameView = (function(){

    let cameraY = 0;

    // moves the screen upwards (increases altitude) when the Player
    // is more than halfway up the screen.
    function updateAltitude(player) {
        if (player.y < 500) {
            let n = (500 - player.y);
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
        ctx.drawImage(IMG_BALLOON,
            0, 0, 500, 1000,
            (b.x - b.r), (b.y - b.r), (2*b.r), (4*b.r)
        );
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
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'
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

// __________________________________________________________________
//      Game Object
// ==================================================================

class Game {
    constructor() {
        this.GOM        = GameObjectManager
        this.player     = new Player(500, 500, 100, 150)
        this.controller = GameController
        this.controller.addControlEventListeners();
        this.initDebugger()
        this.score = 0;
        this.highestScore = 0;
    }

    step() {
        this.controller.processInputsAndStep(this);
        this.player.step();
        GameView.updateAltitude(this.player);
        GameObjectManager.forEach((object)=>{
            if (object.y > GAME_HEIGHT) {
                GameObjectManager.remove(object.id);
                this.makeRandBalloonAtTopOfScreen();
            }
        })
        // updateScore
        if (this.score > this.highestScore) {
            this.highestScore = this.score;
        }
        if (this.player.y >= GAME_HEIGHT - this.player.h) {
            this.score = 0;
            currentAltitude = 500;
        } else {
            this.score = Math.floor((currentAltitude - 500) / 100)
        }
    }

    clearScreen() {
        clearCanvas(ctx);
        this.controller.clearOverlay();
    }

    drawScreen() {
        // draw the player.
        GameView.drawPlayer(this.player);
        drawPlayerBoundingBox(ctx, this.player);
        // draw each of the objects onto the screen.
        this.GOM.forEach(function(object){
            GameView.draw(object);
            drawBoundingBox(ctx, object);
        });
    }

    determinePlayerAction() {
        if (this.player.isGrabbing !== true) {
            let collisions = this.GOM.findCollisionsWith(this.player);
            if (collisions.length > 0) {
                this.player.grab(collisions[0])
                this.controller.resetAllRequests();
                return;
            }
        }
        this.player.jump()
    }

    initDebugger() {
        Debugger.add('hig', 'Highest Score');
        Debugger.add('alt', 'Altitude');
        Debugger.add('sco', 'Score');
    }

    updateDebugger() {
        Debugger.set('hig', this.highestScore);
        Debugger.set('alt', currentAltitude - 500);
        Debugger.set('sco', this.score);
    }

    makeRandBalloonAtTopOfScreen() {
        this.GOM.add(new Balloon((Math.random()*(900-100)+100), -210, 70));
    }

    initExample1() {
        let g = (n)=>70*n
        let b = new Balloon(g(3), g(8), g(1))
        this.GOM.add(b);
        for (let i=0; i<20; i++) {
            this.GOM.add(new Balloon(
                900*Math.random()-50,
                850 - (i * 50),
                g(1)
            ));
        }
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
        game.clearScreen()
        game.step();
        game.drawScreen()
        game.updateDebugger();
        window.requestAnimationFrame(loop);
    }

    window.requestAnimationFrame(loop);
}



// run main only after the DOM elements have finished loading.
// this gives a chance for the images to load.
window.addEventListener('load', main);

}());
