(function(){ // BEGIN

const q = document.querySelector.bind(document);
const canvas = q("#game");
const ctx = canvas.getContext("2d");

// retrieve images.
const IMG_BALLOON = q("#img_balloon");
const IMG_STAND   = q("#img_stand");
const IMG_GRAB    = q("#img_grab");
const IMG_JUMP    = q("#img_jump");

// animation enums
const ANIM_STAND = 111;
const ANIM_GRAB  = 112;
const ANIM_JUMP  = 113;


/**
 * ANIMS maps a player's action to the image that will be drawn on the screen.
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
     * @param {Number} x position on x-axis of the balloon's string.
     * @param {Number} y position on the y-axis of the top of the balloon.
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
        this.anim = ANIM_STAND;
    }

    draw() {
        ctx.drawImage(ANIMS.get(this.anim),
            0, 0, 250, 500,
            this.x, this.y, this.w, this.h
        );
    }
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
    m.set('player', new Player(g(2), g(3), g(1), g(2)))
    m.set('example', new Balloon(g(3), g(3), g(1)))

    // Draw all objects
    for (let o of m.values()) {
        o.draw();
    }


}

// run main only after the DOM elements have finished loading.
// this gives a chance for the images to load.
window.addEventListener('load', main);

}()); // END
