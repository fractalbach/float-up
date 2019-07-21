var GAME;
// (function(){

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

    function draw(object) { object.draw() }

    return {
        draw,
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
    ctx.fillStyle = 'rgba(0, 0, 255, 0.1)'
    ctx.fillRect(
        object.lowX(),
        object.lowY(),
        object.highX() - object.lowX(),
        object.highY() - object.lowY()
    );
}



// __________________________________________________________________
//      The Game Object
// ==================================================================
//
const STATE_ON    = 201;
const STATE_FALL  = 202;

class Game {
    constructor() {
        this.player       = new Player(SCREEN_MIDDLE + 10, GAME_HEIGHT - 150, 100, 150)
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
        TapLocationDebugger.init(canvas);
        InputController.init(this.player, canvas);
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
        // GameController.processInputsAndStep(this);
        this.player.step();


        GameObjectManager.stepAll();
        GameObjectManager.cleanOffscreenObjects();

        // delete balloons that have already poppped
        GameObjectManager.forEach((obj)=>{
            if ((obj.type === OBJ_TYPE_BALLOON) && (obj.hasPopped() === true)) {
                GameObjectManager.remove(obj.id);
                return;
            }
        })

        GameView.updateAltitude(this.player);

        this._handleRandomObjectGeneration();

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
        q('#endgame_score').innerText = this.savedLastScore;
        q('#endgame_message').classList.remove('hidden');
        // q('#score_prompt_score_txt').innerText = this.savedLastScore;
        // GameHighscores.handle(this.savedLastScore);
    }

    _doFallingAnimation() {
        this.fallAnim.iter++;
        let x = 255 - 2*this.fallAnim.iter;
        if (x > 0) { canvas.style.background = `rgb(${x},${x},${x})`; }
        else { canvas.style.background = `rgb(0,0,0)`; }
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

    _drawBackground() {
        let x = 0
        let y = GAME_HEIGHT - IMG_BACKGROUND.height + currentAltitude/100;
        let w = GAME_WIDTH;
        let h = IMG_BACKGROUND.height
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(IMG_BACKGROUND, x, y, w, h);
        ctx.restore()
    }

    drawScreen() {
        this._drawBackground();
        TapLocationDebugger.draw();
        drawPlayerBoundingBox(ctx, this.player);
        GameObjectManager.forEach(function(object){
            object.draw(ctx);
            drawBoundingBox(ctx, object);
        });
        this.player.draw(ctx);
    }

    clearScreen() {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }

    determinePlayerAction() {
        // this.player.jump()
    }

    initDebugger() {
        Debugger.add('high', 'Highest');
        Debugger.add('score', 'Score');
        // Debugger.add('hp', 'Hitpoints');
        // Debugger.add('vx', 'vx');
        // Debugger.add('vy', 'vy');
        // Debugger.add('fixedSteps', 'Steps/Frame');
        // Debugger.add('occurencesOfTooSlow', 'occurencesOfTooSlow')
        // Debugger.add('stepsPerSecond', 'Steps/Sec')
        // Debugger.add('actual_step_duration', 'ms/Step')
    }

    updateDebugger() {
        Debugger.set('high', this.highestScore);
        Debugger.set('score', this.score);
        // Debugger.set('hp', this.player.hitpoints);
        // Debugger.set('vx', GAME.player.vx.toFixed(2));
        // Debugger.set('vy', GAME.player.vy.toFixed(2));
    }
    //
    // makeRandBalloon(minX, maxX) {
    //     GameObjectManager.add(new Balloon(
    //         (Math.random()*(maxX - minX) + minX),
    //         -3*BALLOON_RADIUS,
    //         BALLOON_RADIUS
    //     ));
    // }

    // randomly generates a new balloon, ensuring that new balloons
    // don't appear directly above you. (otherwise it would be too easy.)
    // if you aren't holding a balloon, it can just appear anywhere.
    makeRandBalloonAtTopOfScreen() {
        let r = randbetween(2*BALLOON_RADIUS, GAME_WIDTH-BALLOON_RADIUS)
        if (this.player.isGrabbing === true) {
            let buff = 4*BALLOON_RADIUS;
            let lowX = this.player.myBalloon.x - buff/2;
            r = randbetween(2*BALLOON_RADIUS, GAME_WIDTH-BALLOON_RADIUS-buff)
            if (r > lowX) {
                r += buff;
            }
        }
        let easymode = (this.score < 100);
        let nextBalloon = new Balloon(r, -3*BALLOON_RADIUS, BALLOON_RADIUS, easymode);
        GameObjectManager.add(nextBalloon)
        // this.makeRandBalloon(2*BALLOON_RADIUS, 1000-BALLOON_RADIUS)
    }

    // handles the random generation of balloons and enemies based on how high
    // you have traveled.
    _handleRandomObjectGeneration() {
        if (currentAltitude - this.lastNewBalloonAltitude > this.nextBallonInterval) {
            this.nextBallonInterval = randbetween(MIN_BALLOON_INTERVAL, MAX_BALLON_INTERVAL);
            this.makeRandBalloonAtTopOfScreen();
            if (Math.random() < 0.3) { this._generateEnemy(); }
            this.lastNewBalloonAltitude = currentAltitude;
        }
    }

    _generateEnemy() {
        GameObjectManager.add( Enemy.NewRandomEnemy() )
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
    //      Original Game Loop
    // ==================================================================
    function loop() {
        game.step();
        game.clearScreen();
        game.drawScreen();
        game.updateDebugger();
        window.requestAnimationFrame(loop);
    }

    function sleep(milliseconds) {
        let start = new Date().getTime();
        for (let i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) { break; }
        }
    }


    // __________________________________________________________________
    //      Running Average Loop
    // ==================================================================
    const DESIRED_DURATION = 15
    const INITIAL_AVERAGE_VALUE = 0
    let running_average_100 = INITIAL_AVERAGE_VALUE;
    let running_average_1k = INITIAL_AVERAGE_VALUE;
    let running_average_10k = INITIAL_AVERAGE_VALUE;
    let actual_step_duration = 0;
    let total_steps_taken = 0;
    let lastTimestamp = performance.now();

    // Debugger.add('running_average_100', 'running_average_100');
    // Debugger.add('running_average_1k', 'running_average_1k');
    // Debugger.add('running_average_10k', 'running_average_10k');
    // Debugger.add('actual_step_duration', 'actual_step_duration');
    // Debugger.add('total_steps_taken', 'total_steps_taken');

    function RunningAverageLoop(timestamp) {
        let t0 = performance.now();
        let nSteps = Math.floor((timestamp - lastTimestamp)/DESIRED_DURATION);
        for (let i = 0; i < nSteps; i++) {
            doFixedStep();
        }
        total_steps_taken++;
        lastTimestamp += nSteps*DESIRED_DURATION;
        // Debugger.set('running_average_100', running_average_100.toFixed(3) + ' ms');
        // Debugger.set('running_average_1k', running_average_1k.toFixed(3) + ' ms');
        // Debugger.set('running_average_10k', running_average_10k.toFixed(3) + ' ms');
        // Debugger.set('actual_step_duration', actual_step_duration.toFixed(3) + ' ms');
        // Debugger.set('total_steps_taken', total_steps_taken);
        game.clearScreen();
        game.drawScreen();
        game.updateDebugger();
        // let t_diff = performance.now() - t0;
        // actual_step_duration = t_diff
        // running_average_100 = 0.9 * running_average_100 + 0.1 * t_diff;
        // running_average_1k = 0.99 * running_average_1k + 0.01 * t_diff;
        // running_average_10k = 0.999 * running_average_10k + 0.001 * t_diff;
        window.requestAnimationFrame(RunningAverageLoop);
    }

    function doFixedStep() {
        let t0 = performance.now();
        game.step();
        let t_diff = performance.now() - t0;
    }

    window.requestAnimationFrame(RunningAverageLoop)

    // __________________________________________________________________
    //      Better Game Loop
    // ==================================================================
    // let t0 = performance.now()
    // let t1 = performance.now()
    // let diff = t1 - t0;
    // let nStepsPrev = 0;
    // let nSteps = 0;
    // const DESIRED_STEP_DURATION = 15;
    // let start_step_time = 0;
    // let actual_step_duration = 0;
    // const TOO_MANY_NSTEPS = 20;    // used for epic framerate fail mitigation.
    // let nStepsIncreased = 0;
    // let occurencesOfTooSlow = 0; // tracks epic framerate fails
    // let totalSteps = 0;
    // let startTime = performance.now()
    // let stepsPerUnitTime = 0;
    // function BETTERloop() {
    //     t1 = performance.now();
    //     nStepsPrev = nSteps;
    //     nSteps = Math.floor( (t1 - t0) / DESIRED_STEP_DURATION );
    //     if (nSteps < 0) { nSteps = 0; }
    //     totalSteps += nSteps;
    //     if ((nSteps > TOO_MANY_NSTEPS) && (nStepsPrev > TOO_MANY_NSTEPS)) { occurencesOfTooSlow++ };
    //     if (occurencesOfTooSlow > 5) {
    //         console.warn("Abandon Ship! We are moving to a simpler animation loop!")
    //         return window.requestAnimationFrame(loop);
    //     }
    //     // Debugger.set('occurencesOfTooSlow', occurencesOfTooSlow)
    //     for (let i = 0; i < nSteps; i++) {
    //         start_step_time = performance.now();
    //         game.step();
    //         //sleep(10);
    //         actual_step_duration = performance.now() - start_step_time;
    //         // Debugger.set('actual_step_duration', actual_step_duration.toFixed(2))
    //     }
    //     if (nSteps > 0) { t0 += DESIRED_STEP_DURATION * nSteps; }
    //     stepsPerUnitTime = totalSteps / ((performance.now() - startTime)/1000)
    //     // Debugger.set('stepsPerSecond', Math.floor(stepsPerUnitTime))
    //     // Debugger.set('fixedSteps', nSteps)
    //     game.clearScreen();
    //     game.drawScreen();
    //     game.updateDebugger();
    //     window.requestAnimationFrame(BETTERloop);
    // }
    //
    //
    // window.requestAnimationFrame(BETTERloop);
    //
}



// run main only after the DOM elements have finished loading.
// this gives a chance for the images to load.
window.addEventListener('load', main);
//
// }());
