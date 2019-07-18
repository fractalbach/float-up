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
        this.type = OBJ_TYPE_BALLOON;
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

    draw(ctx) {
        ctx.strokeStyle = 'black'
        let b = this;

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
    }

    // Bounds for the BalloonString.
    stringX() { return this.x - 0.5*this.r/2; }
    stringY() { return this.y + 2*this.r; }
    stringW() { return this.r/2; }
    stringH() { return this.r; }

    // Collision area for the balloon string.
    lowX()  { return this.stringX() }
    lowY()  { return this.stringY() }
    highX() { return this.stringX() + this.stringW() }
    highY() { return this.stringY() + this.stringH() }

    // Bounds for the Balloon itself.
    // lowX(){return this.x - this.r;}
    // lowY(){return this.y - this.r;}
    // highX(){return this.x + this.r;}
    // highY(){return this.y + this.r;}

}
