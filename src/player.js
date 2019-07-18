// __________________________________________________________________
//      Player
// ==================================================================
const Player = (function(){


MAX_HITPOINTS = 0;

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
        this.grabCooldown = 0;
        this.jumpCooldown = 0;
        this.hitpoints = MAX_HITPOINTS;
    }

    jump(unitVectorY) {
        if (this.jumpCooldown > 0) { return; }
        if ((this.y > 0) && (this.isFalling !== true)) {
            this.anim = ANIM_JUMP;
            this.vy = -MAX_JUMP_SPEED;
            this.isFalling = true;
            this.isGrabbing = false;
            this.grabCooldown = MAX_GRAB_COOLDOWN;
        }
    }

    grab(balloon) {
        if (this.grabCooldown > 0) { return; }
        // this.y = balloon.y;
        // console.log("grab!")
        this.anim = ANIM_GRAB;
        this.vy = 0;
        this.vx = 0;
        this.isFalling = false;
        this.isGrabbing = true;
        this.myBalloon = balloon;
        balloon.touch();
        this.jumpCooldown = MAX_JUMP_COOLDOWN;
    }

    moveLeft() {
        if (this.x < 0) { return; }
        this.vx = 0;
        this.x -= MAX_PLAYER_SPEED;
        // if (this.isGrabbing === false) { this.vx = -MAX_PLAYER_SPEED /3 }
        // if (this.isGrabbing) { this.x -= MAX_PLAYER_SPEED; }
        // else { this.vx = -MAX_PLAYER_SPEED }
    }

    moveRight() {
        if (this.x > GAME_WIDTH - this.w) { return; }
        this.vx = 0;
        this.x += MAX_PLAYER_SPEED;
        // if (this.isGrabbing === false) { this.vx = MAX_PLAYER_SPEED /3 }
        // if (this.isGrabbing) { this.x += MAX_PLAYER_SPEED; }
        // else { this.vx = MAX_PLAYER_SPEED; }
    }

    moveUp() {}

    moveDown() {
        this.y += MAX_PLAYER_SPEED / 4;
    }

    specialMove(dx) {
        if ((dx < 0) && (this.x < 0)) { return; }
        if ((dx > 0) && (this.x > GAME_WIDTH)) { return; }
        return;
    }

    directionalMove(unitVectorX, unitVectorY, lastX, dx, dy) {
        this.jump(unitVectorY);
        if (Math.abs((this.x + this.w/2) - lastX) < MAX_PLAYER_SPEED) {
            return;
        }
        if (dx) {
            let multiplier = Math.abs(dx) / 200
            if (multiplier > 1) { multiplier = 1}
            unitVectorX = unitVectorX * multiplier
        }
        let move = unitVectorX * MAX_PLAYER_SPEED;
        // if (dx === null) { dx = GAME_WIDTH/2; }
        if (((move < 0) && (this.x + move > 0)) ||
            ((move > 0) && (this.x + move < GAME_WIDTH - this.w))
        ){
            // this.x = this.x + move;
            this.vx = move;
        }
    }

    step() {
        this.handleInputData();
        if (this.jumpCooldown > 0) { this.jumpCooldown-- }
        if (this.isGrabbing === true) {
            if (this.myBalloon.hasPopped() === false) {

                if (GameObjectManager.hasCollision(this, this.myBalloon)) {
                    this.y -= this.myBalloon.rising_speed;
                    this.vx = 0;
                    return;
                }
                // FALLTHROUGH: you've let go of your ballon.
            }
            // uh oh, you've lost your balloon!
            this.myBalloon = undefined;
            this.isGrabbing = false;
            // Since your ballon is now gone, the cooldowns reset.
            this.jumpCooldown = 0;
            this.grabCooldown = 0;
        }
        this._handleCollisions();
        if (this.grabCooldown > 0) { this.grabCooldown-- }
        // this._doFriction();
        this._doGravity();
        this._stepY();
        this._stepX();
    }

    _handleCollisions() {
        let collisions = GameObjectManager.findCollisionsWith(this);
        let gotHitByEnemey = false;
        for (let other of collisions) {
            if (other.type === OBJ_TYPE_ENEMY) {
                this._getRekt();
                gotHitByEnemey = true;
            }
        }
        if (gotHitByEnemey === false) {
            this._resetHitpoints();
        }
        for (let other of collisions) {
            if (other.type === OBJ_TYPE_BALLOON) {
                this.grab(other);
                return;
            }
        }
    }

    // getRekt by an enemy and lose hitpoints.  If you dont have any: you lose.
    _getRekt() {
        this.hitpoints--;
        if (this.hitpoints > 0) { return; }
        this.y = GAME_HEIGHT + 1;
        return;
    }

    _resetHitpoints() {
        this.hitpoints = MAX_HITPOINTS;
    }

    _stepY() {
        this.y += this.vy;
        if ((this.y + this.vy) < (GAME_HEIGHT - this.h)) { return }
        // hurray! you aren't falling.
        this.y = GAME_HEIGHT - this.h + 1
        this.vy = 0;
        this.isFalling = false;
        this.anim = ANIM_STAND;

    }

    _stepX() {
        if ((this.x + this.vx < 0) || (this.x + this.vx > GAME_WIDTH - this.w)){
            this.vx = 0;
        } else {
            this.x += this.vx;
        }
    }

    _doGravity() { this.vy += GRAVITY; }

    // _doGravity() {
    //     if (this.vy < TERMINAL_VELOCITY) { this.vy += GRAVITY; }
    // }

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

    handleInputData() {
        let data = InputController.getData();
        if (data.requestjump === true) { this.jump(); }
        if (data.tapvalid === true) {
            this.handleTapInput(data);
        } else {
            this.handleKeyboardInput(data);
        }
        InputController.reset();
    }

    handleTapInput(data) {
        let dx = data.tapx - (this.x + this.w/2)   // HANDLE X DIRECTION
        if (dx < -20) { this.moveLeft(); }
        else if (dx > 20) { this.moveRight(); }
        else { this.vx = 0; }
        let dy = data.tapy - (this.y + this.h/2)   // HANDLE Y DIRECTION
        if ((dy < -50)) { this.jump(); }
    }

    handleKeyboardInput(data) {
        if (data.left === true) { this.moveLeft(); }
        if (data.right === true) { this.moveRight(); }
        if ((data.space === true)||(data.up === true)) { this.jump(); }
    }

    draw(ctx) {
        ctx.drawImage(ANIMS.get(this.anim),
            0, 0, 250, 500,
            this.x, this.y, this.w, this.h
        );
    }

    lowX() { return this.x }
    lowY() { return this.y }
    highX() { return this.x + this.w }
    highY() { return this.y + this.h }
}


return Player;
}());
