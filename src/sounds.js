const GameSoundEffects = (function(){

    const BALLOON_POP_FILEPATH = "sounds/balloon_pop.wav"

    let balloonIndex = 0
    let balloonList = [
        new Audio(BALLOON_POP_FILEPATH),
        new Audio(BALLOON_POP_FILEPATH),
        new Audio(BALLOON_POP_FILEPATH)
    ]

    function playBalloonPopSound() {
        balloonIndex = (balloonIndex + 1) % (balloonList.length)
        balloonList[balloonIndex].play()
    }

    return {
        playBalloonPopSound,
    }
}())
