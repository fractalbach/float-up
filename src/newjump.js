// newjump.js
// provides the mechanics for "Where you Tap is Where you Jump",
// the procedure that determines the best initial velocities
// when given the TAP point.
//

const NEWJUMP = (function(){

    function _isReachable(v, g, x, y) {
        return (y <= ((v*v)/(2*g) - (x*x*g)/(2*v*v)));
    }

    /**
     * Calculates initial velocity for the character's jump.
     * @param  {[type]} v Maximum Initial Velocity
     * @param  {[type]} g Gravity
     * @param  {[type]} x x-coordinate of TAP
     * @param  {[type]} y y-coordinate of TAP
     * @return {[type]}   [description]
     */
    function calculateInitialVelocity(v, g, x, y) {
        console.log(`==============================`)
        console.log(`Given: ${v}, ${g}, ${x}, ${y}`)
        // BEGIN HAXORS ~~~~~~~~~~
        let oldx = x;
        let oldy = y;
        let oldg = g;
        let oldv = v;
        x = x / v;
        y = y / v;
        g = g / v;
        v = 1;
        // END  HAXORS ~~~~~~~~~~
        if ((x === 0) && (y === 0)) { return [0,0] }
        if (x === 0) { return [0, v] }
        if (y === 0) { return [v, 0] }
        let negative = (x < 0);
        x = Math.abs(x);
        let reachable = _isReachable(v,g,x,y);
        console.log(`Negative: ${negative}, Reachable: ${reachable}`);
        if (reachable === false) {
            for (let i=0; i<10; i++) {
                x = x/2
                y = y/2
                if (_isReachable(v,g,x,y) === true) { break }
            }
            console.log(`Recalculated (x,y): (${x},${y})`);
            if (_isReachable(v,g,x,y) === false) {
                console.warn("Error in Reculation of Reachable point !");
                return [0,0];
            }
        }
        let v4 = v*v*v*v
        let gg = g*g*x*x + g*2*y*v*v
        let middleterm = (v4 - gg);
        let rootzors = Math.sqrt(middleterm);
        let tantheta = (v*v - rootzors)/(g*x);
        let theta = Math.atan(tantheta);
        let vx = oldv * Math.cos(theta);
        let vy = oldv * Math.sin(theta);
        if (negative) {
            vx = -vx;
        }
        console.log(`Calculating Theta....
    v4:         ${v4}
    gg:         ${gg}
    middleterm: ${middleterm}
    rootzors:   ${rootzors}
    Tan(Theta): ${tantheta}
    Theta:      ${theta}`);
        console.log(`INITIAL VELOCITY: [${vx}, ${vy}]`)
        if (isNaN(vx) || isNaN(vy)) {
            console.warn("Error in the calculation of initial velocity.")
            return [0,0];
        }
        return [vx, vy];
    }

    return{
        calculateInitialVelocity,
    }

}())
