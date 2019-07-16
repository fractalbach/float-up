const TapLocationDebugger = (function(){

    const NUM_CIRCLES_TO_TRACK = 20;
    const DEFAULT_CIRCLE_RADIUS = 50;
    const CIRCLE_COLOR = 'rgba(77, 184, 255, 0.2)';

    let listOfCircles = new Array(NUM_CIRCLES_TO_TRACK);
    let head = 0;

    let canvas = null;
    let ctx = null;

    function init(_canvas) {
        canvas = _canvas;
        ctx = canvas.getContext('2d');
    }

    // __________________________________________________________________
    //      Drawing Circles
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

    // __________________________________________________________________
    //      The Tap Location Circles
    // ==================================================================

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
    function addLocation(x, y) {
        head++;
        if (head > NUM_CIRCLES_TO_TRACK - 1) {
            head = 0;
        }
        listOfCircles[head].resetLocation(x, y);
    }

    // public function that is called every frame to draw the circles
    // onto the screen in their current state.
    function draw() {
        for (let x of listOfCircles) {
            if (x.isFullyDiminished() === false) {
                x.draw();
                x.diminish();
            }
        }
    }

    return {
        init,
        addLocation,
        draw,
    }

}());
