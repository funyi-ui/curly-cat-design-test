(() => {
  const room = document.querySelector('.room');
  const canvas = document.getElementById('roomMotion');
  const ctx = canvas.getContext('2d');
  const image = new Image();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // getHours() uses the visitor's device timezone, never the server timezone.
  function isLocalDay(date = new Date()) {
    const hour = date.getHours();
    return hour >= 6 && hour < 18;
  }
  let daytime = isLocalDay();
  function refreshDaytime() {
    const next = isLocalDay();
    if (next !== daytime) {
      daytime = next;
      request();
    }
  }
  const dayImage = new Image();
  let dayLoaded = false;
  function drawWindow() {
    if (!daytime || !dayLoaded) return;
    // Only replace the window region; the room and central cat stay unchanged.
    ctx.drawImage(dayImage, 1086, 94, 318, 426, 1086, 94, 318, 426);
  }
  dayImage.onload = () => { dayLoaded = true; request(); };
  dayImage.src = 'room-day.png';
  const eyes = [{x:726,y:368,rx:16.5,ry:17.5}, {x:802,y:382,rx:16,ry:16.5}];
  const objects = [
    {id:'roomTarot',x:518,y:549,w:176,h:108,poly:[[0,68],[81,0],[173,15],[159,84],[109,108],[14,94]]},
    {id:'roomNip',x:688,y:572,w:192,h:105,poly:[[0,80],[13,55],[36,40],[49,0],[71,20],[103,0],[124,18],[155,10],[176,34],[191,60],[168,84],[119,104],[53,99]]},
    {id:'roomBook',x:181,y:281,w:133,h:127,poly:[[0,2],[119,0],[133,117],[9,127]]}
  ];
  let loaded=false, hover=null, face=false, blinkStart=-Infinity;
  let gaze={x:0,y:0}, target={x:0,y:0}, raf=0, nextBlink=Infinity, hoverStart=0;
  function pupilOffset(px,py,e){
    const dx=px-e.x,dy=py-e.y,dist=Math.hypot(dx,dy);
    const amount=Math.min(5.2,dist/80);
    return dist?{x:dx/dist*amount,y:dy/dist*amount}:{x:0,y:0};
  }
  function request(){if(!raf&&loaded)raf=requestAnimationFrame(draw)}
  function blink(){if(reduced.matches)return;blinkStart=performance.now();request()}
  function patch(o,scale){
    ctx.save();const cx=o.x+o.w/2,cy=o.y+o.h/2;
    ctx.translate(cx,cy);ctx.scale(scale,scale);ctx.translate(-cx,-cy);
    ctx.beginPath();o.poly.forEach(([x,y],i)=>i?ctx.lineTo(o.x+x,o.y+y):ctx.moveTo(o.x+x,o.y+y));ctx.closePath();ctx.clip();
    ctx.drawImage(image,o.x,o.y,o.w,o.h,o.x,o.y,o.w,o.h);ctx.restore();
  }
  function draw(now){
    raf=0;if(!loaded)return;ctx.clearRect(0,0,1536,1024);drawWindow();
    gaze.x+=(target.x-gaze.x)*.2;gaze.y+=(target.y-gaze.y)*.2;
    if(face&&now>nextBlink){blinkStart=now;nextBlink=now+3200+Math.random()*2000}
    const elapsed=now-blinkStart;
    const close=elapsed>=0&&elapsed<230?Math.sin(Math.PI*elapsed/230):0;
    const openness=1-close;
    eyes.forEach(e=>{
      ctx.save();ctx.beginPath();ctx.ellipse(e.x,e.y,e.rx,e.ry,0,0,Math.PI*2);ctx.clip();
      ctx.fillStyle='#181817';ctx.fillRect(e.x-e.rx-1,e.y-e.ry-1,e.rx*2+2,e.ry*2+2);
      if(openness>.015){ctx.translate(e.x,e.y);ctx.scale(1,openness);ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,0,e.rx,e.ry,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#111';ctx.beginPath();ctx.ellipse(gaze.x,gaze.y,10.5,12.2,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(gaze.x+3,gaze.y-5,3.1,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    });
    if(hover&&!reduced.matches){const o=objects.find(o=>o.id===hover);if(o){const wave=Math.sin(Math.min(1,(now-hoverStart)/250)*Math.PI/2);patch(o,1+.025*wave+.004*Math.sin((now-hoverStart)/220))}}
    if(!reduced.matches&&(face||hover||elapsed<230||Math.abs(gaze.x-target.x)+Math.abs(gaze.y-target.y)>.02))request();
  }
  room.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'||reduced.matches)return;
    const r=room.getBoundingClientRect();const px=(e.clientX-r.left)/r.width*1536,py=(e.clientY-r.top)/r.height*1024;
    target=pupilOffset(px,py,{x:764,y:375});request();
  });
  room.addEventListener('pointerleave',()=>{target={x:0,y:0};face=false;hover=null;request()});
  objects.forEach(o=>{const el=document.getElementById(o.id);el.addEventListener('pointerenter',()=>{hover=o.id;hoverStart=performance.now();request()});el.addEventListener('pointerleave',()=>{hover=null;request()});el.addEventListener('focus',()=>{hover=o.id;hoverStart=performance.now();request()});el.addEventListener('blur',()=>{hover=null;request()})});
  document.getElementById('roomCat').addEventListener('pointerenter',()=>{face=true;nextBlink=performance.now()+3500;blink()});
  document.getElementById('roomCat').addEventListener('pointerleave',()=>{face=false;request()});
  reduced.addEventListener('change',()=>{target={x:0,y:0};gaze={x:0,y:0};blinkStart=-Infinity;hover=null;face=false;request()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else {refreshDaytime();request()}});
  setInterval(refreshDaytime, 30000);
  window.addEventListener('focus', refreshDaytime);
  image.onload=()=>{loaded=true;request()};image.src='room.png';
})();
