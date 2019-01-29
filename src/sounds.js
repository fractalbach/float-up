const GameSoundEffects = (function(){

    const BALLOON_POP_FILEPATH = "sounds/balloon_pop.wav"

    function playBalloonPopSound() {
        let audio = new Audio(BALLOON_POP_FILEPATH)
        audio.addEventListener('loadeddata', ()=>{
            audio.play()
        })
    }

    return {
        playBalloonPopSound,
    }
}())
