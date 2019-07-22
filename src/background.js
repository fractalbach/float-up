const GameBackground = (function(){

    const q = document.querySelector.bind(document);

    const BACKGROUND_STARS = q("#img_background_chunk_5");

    const DATA_LIST = [
        [q("#img_background_chunk_1"), 6, 0   ],
        // [q("#img_background_chunk_2"), 8, 200 ],
        // [q("#img_background_chunk_3"), 10, 600 ],
        [q("#img_background"), 10, 0],
        // [q("#img_background_chunk_4"), 1<<5, 600],
    ];

    const NUM_CHUNKS = DATA_LIST.length;


    class GameBackground {

        constructor() {
            this.pos = 0;
            this.starBackground = new StarBackground();
            this.chunkList = []
            for (let j = 0; j < NUM_CHUNKS; j++) {
                let i = NUM_CHUNKS - j - 1
                this.chunkList.push(
                    new GameBackgroundChunk(
                        DATA_LIST[i][0],
                        DATA_LIST[i][1],
                        DATA_LIST[i][2],
                    )
                );
            }
        }

        _drawChunks(ctx) {
            for (let chunk of this.chunkList) {
                chunk.setPosition(currentAltitude/100);
                chunk.draw(ctx);
            }
        }

        draw(ctx) {
            ctx.save();
            this.starBackground.draw(ctx);
            this._drawChunks(ctx);
            this._drawOverlay(ctx);
        }

        _drawOverlay(ctx) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = 'white';
            ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
            ctx.restore()
        }
    }


    class GameBackgroundChunk {

        constructor(image, multiplier, offset) {
            this.image = image;
            this.multiplier = multiplier;
            this.offsetPos = offset;
            this.actualPos = 0;
        }

        setPosition(pos) {
            this.actualPos = pos - this.offsetPos;
        }

        draw(ctx) {
            let x = 0;
            let y = GAME_HEIGHT - this.image.height - this.offsetPos + (currentAltitude / this.multiplier);
            let w = GAME_WIDTH;
            let h = this.image.height;
            ctx.drawImage(this.image, x, y, w, h);
        }
    }


    // the starry background is the default.  It will always appear behind
    // everything else, and will just keep moving past you the higher you go.
    class StarBackground {

        constructor() {
            this.image = BACKGROUND_STARS;
            this.height = this.image.height - 1;
            this.ratioBackgroundToPlayer = 1/10;
            this.nChunks = Math.round(GAME_HEIGHT / this.height) + 1;
            this.yFirst = GAME_HEIGHT;
        }

        draw() {
            this.yFirst = GAME_HEIGHT + ((this.ratioBackgroundToPlayer * currentAltitude) % this.height);
            for (let i = 0; i < this.nChunks; i++) {
                let x = 0;
                let y = this.yFirst - (i+1)*this.height;
                ctx.drawImage(this.image, x, y);
            }
        }
    }


    return GameBackground;

}());
