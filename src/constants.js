const q = document.querySelector.bind(document);


// numerical constants used throughout the game.
const GAME_WIDTH        = 1000;
const GAME_HEIGHT       = 1000;
const SCREEN_MIDDLE     = 400;

const MAX_PLAYER_SPEED  = 10;   // player's vx max
const MAX_JUMP_SPEED    = 20;   // player's vy max
const TERMINAL_VELOCITY = 10;   // can't fall faster than TERMINAL_VELOCITY.
const GRAVITY = 0.4;
const V_MAX = 10;

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
const IMG_BACKGROUND = q("#img_background");

// enums: animation
const ANIM_STAND = 101;  // player is standing on a platform
const ANIM_GRAB  = 102;  // player is holding a balloon
const ANIM_JUMP  = 103;  // player is somewhere in the air

// enums: enemy types
const OBJ_TYPE_PLAYER = 901;
const OBJ_TYPE_BALLOON = 902;
const OBJ_TYPE_ENEMY = 903;


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
