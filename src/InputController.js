const InputController = (function(){

    let UP    = false;
    let DOWN  = false;
    let LEFT  = false;
    let RIGHT = false;
    let SPACE = false;
    let REQUESTJUMP = false;
    let TAP = [0,0];        // The most recently TAPPED location.
    let TAPVALID = false;  // Indicates that TAP should be used.
    let TAPSTART = false;  // Indicates the first TAP in a series of TAPs.

    let isMouseDown = false;
    let isTouchDown = false;
    const tapdelay = 1000;
    let tapstart = 0;

    let player = null;
    let canvas = null;

    function reset() {
        TAPVALID = false;
        REQUESTJUMP = false;
        TAPSTART = false;
    }

    function getData() {
        TAPVALID = ((isTouchDown === true) || (isMouseDown === true));
        return {
            up: UP,
            down: DOWN,
            left: LEFT,
            right: RIGHT,
            space: SPACE,
            tapvalid: TAPVALID,
            tapx: TAP[0],
            tapy: TAP[1],
            requestjump: REQUESTJUMP,
        }
    }

    function init(_player, _canvas) {
        player = _player;
        canvas = _canvas;
        document.addEventListener("keyup", whenKeyGoesUp);
        document.addEventListener("keydown", whenKeyGoesDown);
        canvas.addEventListener("click", whenClick);
        canvas.addEventListener('mousedown', whenMouseDown);
        canvas.addEventListener('mousemove', whenMouseMove);
        canvas.addEventListener('mouseup', whenMouseUp);
        canvas.addEventListener("touchstart" , whenTouchStarts);
        canvas.addEventListener("touchmove"  , whenTouchMoves);
        canvas.addEventListener("touchend"   , whenTouchEnds);
        canvas.addEventListener("touchcancel", whenTouchCancels);
    }

    // __________________________________________________________________
    //      Keyboard
    // ==================================================================

    function whenKeyGoesDown(event) {
        switch (event.code) {
            case 'ArrowUp':     UP    = true; return;
            case 'ArrowDown':   DOWN  = true; return;
            case 'ArrowLeft':   LEFT  = true; return;
            case 'ArrowRight':  RIGHT = true; return;
            case 'Space':       SPACE = true; return;
        }
    }

    function whenKeyGoesUp(event) {
        switch (event.code) {
            case 'ArrowUp':     UP    = false; return;
            case 'ArrowDown':   DOWN  = false; return;
            case 'ArrowLeft':   LEFT  = false; return;
            case 'ArrowRight':  RIGHT = false; return;
            case 'Space':       SPACE = false; return;
        }
    }

    // __________________________________________________________________
    //      Generic Click Event
    // ==================================================================

    function whenClick(event) {
        // nothing
    }

    // __________________________________________________________________
    //      Touch
    // ==================================================================

    function whenTouchStarts(event) {
        event.preventDefault();
        setTapValueFromEvent(event.touches[0]);
        isTouchDown = true;
        tapstart = performance.now();
    }

    function whenTouchMoves(event) {
        setTapValueFromEvent(event.touches[0]);
    }

    function whenTouchEnds(event) {
        // REQUESTJUMP = ((performance.now() - tapstart) < tapdelay)
        isTouchDown = false;
    }

    function whenTouchCancels(event) {
        whenTouchEnds();
    }

    // __________________________________________________________________
    //      Mouse
    // ==================================================================

    function whenMouseDown(event) {
        setTapValueFromEvent(event);
        isMouseDown = true;
        tapstart = performance.now();
    }

    function whenMouseMove(event) {
        // isMouseDown = true;
        // setTapValueFromEvent(event);
        if (isMouseDown === true) {
            setTapValueFromEvent(event);
        }
    }

    function whenMouseUp(event) {
        isMouseDown = false;
        // REQUESTJUMP = ((performance.now() - tapstart) < tapdelay)
    }

    // __________________________________________________________________
    //      Other functions
    // ==================================================================

    function setTapValueFromEvent(event) {
        let [x,y] = convertToCanvasPosition(canvas, event);
        displayTap(x, y);
        // [x,y] = convertToRelativePlayerPosition(x, y);
        TAP[0] = x;
        TAP[1] = y;
        TAPVALID = true;
    }

    function convertToCanvasPosition(canvas, event) {
        let rect = canvas.getBoundingClientRect();
        let x = (event.clientX - rect.left) * 1000 / rect.width;
        let y = (event.clientY - rect.top) * 1000 / rect.height;
        return [x, y];
    }

    function convertToRelativePlayerPosition(x, y) {
        let rx = x - (player.x + player.w/2)
        let ry = y - (player.y + player.h/2)
        return [rx, ry];
    }

    function displayTap(x, y) {
        TapLocationDebugger.addLocation(x, y);
    }

    return {
        init,
        reset,
        getData,
    }

}());
