// __________________________________________________________________
//      Sound Effects
// ==================================================================
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

// __________________________________________________________________
//      Music
// ==================================================================
const GameMusicPlayer = (function(){

    const RED_BALLOONS_FILEPATH = "sounds/Nena-99-Red-Balloons.mp3"
    let redBalloonsAudio = new Audio(RED_BALLOONS_FILEPATH)

    // add audio bar to the page and start it after a short delay.
    redBalloonsAudio.id = "floating_music"
    redBalloonsAudio.controls = true
    document.body.appendChild(redBalloonsAudio)
    redBalloonsAudio.addEventListener('canplay', ()=>{
        redBalloonsAudio.play()
        setTimeout(function(){
            redBalloonsAudio.play()
        }, 5000);
    });

    return {
        redBalloonsAudio,
    }
}())
