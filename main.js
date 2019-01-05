(function(){

// main elements and constants
const q = document.querySelector.bind(document);
const overlay = q("#overlay");
const canvas = q("#game");
const overctx = overlay.getContext("2d");
const ctx = canvas.getContext("2d");
const GAME_WIDTH  = 1000;
const GAME_HEIGHT = 1000;

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
        this.actionCooldown = 0;
    }

    moveLeft() {
        if (this.x > 0) {
            this.x -= 10;
        }
    }

    moveRight() {
        if (this.x < (GAME_WIDTH - this.w)) {
            this.x += 10;
        }
    }

    moveUp() {
        if (this.isGrabbing===true) {
            this.y += 10;
        }
    }

    step() {
        if (this.actionCooldown > 0) {
            this.actionCooldown--;
        }
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
    }

    draw() {
        ctx.drawImage(ANIMS.get(this.anim),
            0, 0, 250, 500,
            this.x, this.y, this.w, this.h
        );
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

let nextid = 333;

class GameObjectManager {

    static compareX (object1, object2) {
        return (object1.lowX() - object2.lowX())
    }

    static compareY (object1, object2) {
        return (object1.lowY() - object2.lowY())
    }

    static makeUID() {
        nextid++;
        return nextid;
    }

    static hasCollision(A, B) {
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

    constructor() {
        this.objects = new Map();
        // this._sortedObjectsX = new Array();
        // this._sortedObjectsY = new Array();
    }

    add(object) {
        let id = GameObjectManager.makeUID();
        this.objects.set(id, object);
        // this._rebuild();
        return id;
    }

    delete(id) {
        let result = this.objects.delete(id);
        // this._rebuild();
        return result;
    }

    // update whenever the underlying objects have moved around.
    update() {
        // this._sortedObjectsX.sort(GameObjectManager.compareX);
        // this._sortedObjectsY.sort(GameObjectManager.compareX);
    }

    // forEach has similar behavior to Array.forEach
    forEach(fn) {
        for (let v of this.objects.values()) {
            fn(v);
        }
    }

    // return all objects that are colliding with the given object.
    // A is a reference to an object.
    findCollisionsWith(A) {
        let results = new Array();
        // TODO: use binary search instead.
        for (let B of this.objects.values()) {
            if (A == B) {
                continue;
            }
            if (GameObjectManager.hasCollision(A,B)) {
                results.push(B);
            }
        }
        return results;
    }


    _rebuild() {
        // this._sortedObjectsX = Array.from(this.objects.values(GameObjectManager.compareX));
        // this._sortedObjectsY = Array.from(this.objects.values(GameObjectManager.compareY));
    }


}





// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                              Chapter 2
//
//                            The Game View
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// The Game View is in regards to how the game itself is displayed.  This
// is where special drawing functions are declared.


class GameObject {
    static drawBoundingBox(ctx, object) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'
        ctx.fillRect(
            object.lowX(),
            object.lowY(),
            object.highX() - object.lowX(),
            object.highY() - object.lowY()
        );
    }
}

// __________________________________________________________________
//      Drawing Functions
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

function clearCanvas(ctx) {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
}

// used for overlay because you need to compute the current width/height.
function clearOverlay(overlay, ctx) {
    let cs = getComputedStyle(overlay);
    let width = parseInt(cs.getPropertyValue('width'), 10);
    let height = parseInt(cs.getPropertyValue('height'), 10);
    ctx.clearRect(0, 0, width, height)
}

// function drawGrid(ctx, sideLength, canvasLength) {
//     let u = sideLength
//     let max = canvasLength
//     for (let i=0; i<(Math.floor(max/u)); i++) {
//         // vertical lines:
//         ctx.beginPath();
//         ctx.moveTo(i*u, 0);
//         ctx.lineTo(i*u, max);
//         ctx.stroke();
//         // horizontal lines:
//         ctx.beginPath()
//         ctx.moveTo(0, i*u);
//         ctx.lineTo(max, i*u);
//         ctx.stroke();
//     }
// }


// __________________________________________________________________
//      Math Functions
// ==================================================================


function unitVector(a,b) {
    let norm = Math.sqrt(a*a + b*b);
    return [a/norm, b/norm];
}


// __________________________________________________________________
//      Main  (executed when page finishes loading.)
// ==================================================================

function main() {

    // arbitrary conversion function to get relative sizes
    // of example objects the same.
    let g = (n)=>70*n

    // Init example object map.
    let GOM = new GameObjectManager();

    let p = new Player(g(2), g(3), g(1), g(2))
    let b = new Balloon(g(3), g(8), g(1))


    GOM.add(p);
    GOM.add(b);
    for (let i=0; i<10; i++) {
        GOM.add(new Balloon(
            900*Math.random()+50,
            600*Math.random(),
            g(1)
        ));
    }

    // Initialize the input manager and the input event listeners.
    let IM = new InputManager();
    console.log(IM);

    const debug_state = q("#debug_state");

    const playerAction = function() {
        if (p.actionCooldown > 0) {
            // if (p.isGrabbing) {
            //     p.moveUp();
            // }
            return;
        }
        if (p.isGrabbing !== true) {
            let collisions = GOM.findCollisionsWith(p);
            if (collisions.length > 0) {
                p.grab(collisions[0])
                p.actionCooldown = 5;
            } else {
                p.jump()
            }
        } else {
            p.jump();
        }
        IM.turnOff(IM.CMD.ACTION);
    }

    // define the game command functions.
    IM.setCommandFunction(IM.CMD.ACTION, playerAction);
    IM.setCommandFunction(IM.CMD.UP, playerAction);
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



    // __________________________________________________________________
    //      Touch Controls
    // ==================================================================

    let touchTimeStart = 0;
    let touchTime = 0;
    let isTouching = 0;
    let direction = 0;
    let firstTouch;


    overlay.addEventListener("touchstart", function(event) {
        touchTimeStart = performance.now();
        touchTime = 0;

        // makes a joystick appear.
        isTouching = 1;
        firstTouch = event.touches[0];
    });


    overlay.addEventListener("touchmove", function(event) {
        event.preventDefault();
        touchTime = (performance.now() - touchTimeStart);

        // caclulate distance from the joystick
        let diff = event.touches[0].clientX - firstTouch.clientX;
        let diffY = event.touches[0].clientY - firstTouch.clientY;
        let uv = unitVector(diff, diffY);
        let uvx = Math.floor(uv[0] * 100)/100;
        let uvy = Math.floor(uv[1] * 100)/100;
        let floordiff = Math.floor(diff);
        q('#debug_diff').innerText = (floordiff<0?"":"+") + floordiff ;
        q('#debug_uvx').innerText = (uvx<0?"":"+") + uvx;
        q('#debug_uvy').innerText = (uvy<0?"":"+") + uvy;

        // TODO: Change to using unit vectors instead.
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

    overlay.addEventListener("touchend", function(event){
        touchTime = (performance.now() - touchTimeStart);
        if (touchTime < 100) {
            IM.turnOn(IM.CMD.ACTION);
            if (p.isFalling === false) {
                return;
            }
        }
        IM.turnOff(IM.CMD.LEFT);
        IM.turnOff(IM.CMD.RIGHT);
        isTouching = 0;
        direction = 0;
        firstTouch = undefined;
    });


    overlay.addEventListener("touchcancel", function(event){
        IM.turnOff(IM.CMD.LEFT);
        IM.turnOff(IM.CMD.RIGHT);
        isTouching = 0;
        direction = 0;
        firstTouch = undefined;
    });


    // __________________________________________________________________
    //      Game Loop
    // ==================================================================

    const loop = function() {

        // clear screen of all the junk that is currently on it.
        clearCanvas(ctx);
        clearOverlay(overlay, overctx);

        // run commands based on what the user is requesting.
        IM.runCommands();
        debug_state.innerText = IM.stateString();

        // do a step through the game state.
        p.step();

        // redraw things.
        GOM.forEach(function(object){
            object.draw();
            GameObject.drawBoundingBox(ctx, object);
        });

        // draw joystick on the screen.
        // TODO: MOVE THIS.
        if (firstTouch !== undefined) {
            // let rect = canvas.getBoundingClientRect();
            // let x = firstTouch.clientX - rect.left;
            // let y = firstTouch.clientY - rect.top;
            let x = firstTouch.clientX;
            let y = firstTouch.clientY;
            drawJoyBase(overctx, x, y);
            if (direction === -1) {
                drawJoyStick(overctx, x, y, x-15, y);
            } else if (direction === 1) {
                drawJoyStick(overctx, x, y, x+15, y);
            }
        }

        // KLUDGE:
        // turn off jump because we don't want it firing constantly.
        // TODO:  find a better way to do this.
        IM.turnOff(IM.CMD.ACTION);

        // additional debugging features.
        q('#debug_touchTime').innerText = Math.floor(touchTime) + ' ms'

        window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);
    console.log(GOM);
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                              Chapter 3
//
//                        The Game Controller
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Although this is not literally a game controller, it implements one. This
// chapter enables the humans to interact with the game.



// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                              Chapter 4
//
//                          The Main Game Loop
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// The Game Loop is when everything gets wrapped together and kicked off.




// run main only after the DOM elements have finished loading.
// this gives a chance for the images to load.
window.addEventListener('load', main);

}());
