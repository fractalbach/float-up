// __________________________________________________________________
//      Enemy
// ==================================================================
class Enemy {
    static NewRandomEnemy() {
        let w = randbetween(20,40)
        let h = randbetween(20,40)
        let x = randbetween( 0, GAME_WIDTH );
        let y = -3 * h;
        let vx, vy;
        if (x < (GAME_WIDTH/2)) {
            vx = randbetween(0, 4)
            vy = randbetween(0, 2)
        } else {
            vx = randbetween(-4, 0)
            vy = randbetween(0, 2)
        }
        return new Enemy(x,y,w,h,vx,vy)
    }

    constructor(x,y,w,h, vx, vy) {
        this.type = OBJ_TYPE_ENEMY
        this.w = w;
        this.h = h;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }

    step() {
        this.x += this.vx
        this.y += this.vy
    }

    draw(ctx) {
        let x = this.x - 5
        let y = this.y - 5
        let w = this.w + 10
        let h = this.h + 10
        let redval = Math.floor(performance.now()) % 200 + 55
        ctx.fillStyle = `rgb( ${redval}, 0, 0 )`
        // ctx.strokeStyle = 'rgb(0, 0, 0)'
        ctx.fillRect(x,y,w,h)
        // ctx.strokeRect(x,y,w,h)
    }

    lowX() { return this.x }
    lowY() { return this.y }
    highX() { return this.x + this.w }
    highY() { return this.y + this.h }
}

class EnemyPool {
    constructor() {
        this.poolsize = 10;
        this.pool = new Array(poolsize)
        this.index = 0;
    }

    push(enemy) {
        this.pool.push(enemy)
        this.index = (this.index % this.poolsize);
    }

    createNew() {
        this.push(Enemy.NewRandomEnemy())
    }

    stepAll() {
        for (let i=0; i<this.poolsize; i++) {
            if (this.pool[i]) { this.pool[i].step() }
        }
    }

    drawAll() {
        for (let i=0; i<this.poolsize; i++) {
            if (this.pool[i]) { this.pool[i].draw() }
        }
    }
}
