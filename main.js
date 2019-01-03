const q = document.querySelector.bind(document);
const c = document.querySelector("#game");
const ctx = c.getContext("2d");
const bal = q("#balloon")
const player = q("#drift_right");

for (let i=0; i<10; i++) {
    ctx.beginPath();
    ctx.moveTo(i*100, 0);
    ctx.lineTo(i*100, 1000);
    ctx.stroke();

    ctx.beginPath()
    ctx.moveTo(0, i*100);
    ctx.lineTo(1000, i*100);
    ctx.stroke();
}

// source unit = 250
let u = 100;

window.addEventListener('load', ()=>{
    
    ctx.drawImage(
	bal,
	0, 0, 500, 1000,
	2*u, 0, 2*u, 4*u
    );
    
    ctx.drawImage(
	player,
	0,0,250,500,
	u, u, u, 2*u,
    );

    
})

//ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
