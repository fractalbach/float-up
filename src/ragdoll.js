// ragdoll.js
// creates ragdoll effects for the limbs of player.

const RagdollEffects = (function(){



    function drawCircle(ctx, x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2*Math.PI);
        ctx.fill();
    }


class Thing {
    constructor() {
        this.neck = [0,0];
        this.pelvis = [0,0];
        this.leftKnee = [0,0];
        this.rightKnee = [0,0];
        this.leftAnkle = [0,0];
        this.rightAnkle = [0,0];
    }
}


}());
