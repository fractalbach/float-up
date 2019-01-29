const GameSoundEffects = (function(){

    const BALLOON_POP_FILEPATH = "sounds/balloon_pop.wav"

    function playBalloonPopSound() {
        (new Audio(BALLOON_POP_FILEPATH)).play()
    }

    return {
        playBalloonPopSound,
    }
}())
