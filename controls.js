const InputManager = (function(){

// enums: game commands
// uses a bitset because multiple commands can be requested at same time.
const CMD = {
    ACTION : 1<<0,   // can be either grab or jump
    JUMP   : 1<<1,   // jumps and lets go of balloon
    GRAB   : 1<<2,   // grab balloon
    LEFT   : 1<<3,   // move left
    RIGHT  : 1<<4,   // move right
    UP     : 1<<5,   // move up (only if holding a balloon)
    DOWN   : 1<<6,   // move down (only if holding a balloon)
}

// enums: keys codes for default settings
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
const KEY = {
    UP     : 'ArrowUp',
    DOWN   : 'ArrowDown',
    LEFT   : 'ArrowLeft',
    RIGHT  : 'ArrowRight',
    SPACE  : 'Space',
}

/**
 * manages human input such as keyboard, clicks, touches, and how each
 * of these translate to iternal game commands.
 */
class InputManager {

    constructor() {

        /**
         * represents which actions are currently requested by the player.
         * @type {Number}
         */
        this.state = 0;

        /**
         * maps user input to game commands. When input happens, this
         * table will be referenced to determine what game command to use.
         * Enables easy modification of input rules.
         * @type {Map}
         */
        this.inputCommandMap = new Map([
            [KEY.SPACE, CMD.ACTION],
            [KEY.LEFT, CMD.LEFT],
            [KEY.RIGHT, CMD.RIGHT],
            [KEY.UP, CMD.UP],
            [KEY.DOWN, CMD.DOWN],
        ]);

        this.commandFunctionMap = new Map([

        ]);
    }

    get CMD () {
        return CMD;
    }

    get KEY () {
        return KEY;
    }

    clear() {
        this.state = 0;
    }

    // Returns true if the command is being requested, Otherwise false.
    check(command) {
        return ((this.state & command) > 0);
    }

    // Sets the command to "being requested" state.
    turnOn(command) {
        this.state = this.state | command;
    }

    // Sets the command to initial state: not being requested.
    turnOff(command) {
        this.state = this.state &~ command;
    }

    setCommandFunction(command, callback) {
        this.commandFunctionMap.set(command, callback);
    }

    setInputToCommand(keycode, command) {
        this.inputCommandMap.set(keycode, command);
    }

    // specific to keyboard. press a key.
    pressKey(keycode) {
        if (this.inputCommandMap.has(keycode)) {
            this.turnOn(this.inputCommandMap.get(keycode));
        }
    }

    // specific to keyboard. release a key.
    releaseKey(keycode) {
        if (this.inputCommandMap.has(keycode)) {
            this.turnOff(this.inputCommandMap.get(keycode));
        }
    }

    runCommands() {
        for (let [key, cmd] of this.inputCommandMap.entries()) {
            if (this.check(cmd) && this.commandFunctionMap.has(cmd)) {
                (this.commandFunctionMap.get(cmd))();
            }
        }
    }

    stateString() {
        let s = (this.state >>> 0).toString(2);
        while (s.length < 7) {
            s = '0' + s;
        }
        return s;
    }
}

return InputManager;
}());
