import { esc, root, $, $$, BACK, wireBack, award, confetti, overlay, setCleanup } from '../core.js';

/* ---------- BUG BLASTER ---------- */
export function blaster(){
  var W=[{n:'Cefazolin',c:'#27ae60'},{n:'Ceftriaxone',c:'#2d9cdb'},{n:'Cefepime',c:'#9b51e0'},{n:'Meropenem',c:'#c62828'},{n:'Vancomycin',c:'#e67e22'}];
  var B=[
    {n:'MSSA',best:0,ok:[1,2,3,4],col:'#f2c94c',tip:'MSSA → cefazolin. Beta-lactams beat vancomycin for MSSA.'},
    {n:'MRSA',best:4,ok:[],col:'#eb5757',tip:'MRSA → vancomycin. None of the beta-lactams here cover it.'},
    {n:'Pseudomonas',best:2,ok:[3],col:'#27ae60',tip:'Pseudomonas → cefepime. Save meropenem for when you need it.'},
    {n:'ESBL E. coli',best:3,ok:[],col:'#9b51e0',tip:'ESBL E. coli bacteremia → meropenem (MERINO trial).'},
    {n:'H. influenzae',best:1,ok:[2,3],col:'#2d9cdb',tip:'H. influenzae → ceftriaxone. No need for cefepime or meropenem.'},
    {n:'N. gonorrhoeae',best:1,ok:[2,3],col:'#e67e22',tip:'N. gonorrhoeae → ceftriaxone (CDC STI guidelines).'}
  ];
  root.innerHTML='<div class="card">'+BACK+'<h2>💥 Bug Blaster</h2>'+
    '<div class="meta"><span>Score: <b class="bs">0</b></span><span>⏱ <b class="bt">60</b>s</span><span class="bl">❤️❤️❤️</span></div>'+
    '<div class="meta" style="align-items:center;gap:8px"><span>Resistance</span><div class="bar" style="flex:1;margin:0"><i class="br" style="width:0%;background:var(--bad)"></i></div></div>'+
    '<div class="bw"><canvas class="bc"></canvas></div><div class="wp"></div><p class="sub bm" style="margin:8px 0 0;min-height:2.8em"></p></div>';
  wireBack();
  var wp='';W.forEach(function(w,i){wp+='<button class="wbtn" data-i="'+i+'" style="--w:'+w.c+'"><small>'+(i+1)+'</small> '+w.n+'</button>'});
  $('.wp').innerHTML=wp;
  var cv=$('.bc'),ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1,w,h,bugs=[],fx=[],score,lives,res,el,spawn,running=false,raf,last,sel=0;
  function size(){w=cv.clientWidth;h=cv.clientHeight;cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
  function setSel(i){sel=i;$$('.wbtn').forEach(function(b){b.classList.toggle('on',+b.dataset.i===i)})}
  function hud(){$('.bs').textContent=score;$('.bl').textContent=lives>0?Array(lives+1).join('❤️'):'💀';$('.br').style.width=Math.min(100,res)+'%'}
  function msg(t){$('.bm').innerHTML=t}
  function ov(html){overlay(html,start)}
  function start(){bugs=[];fx=[];score=0;lives=3;res=0;el=0;spawn=.4;running=true;last=performance.now();hud();ov(null);msg('Pick a drug, then tap a bug!');raf=requestAnimationFrame(loop)}
  function loop(t){
    if(!running)return;
    var dt=Math.min(.05,(t-last)/1000);last=t;el+=dt;spawn-=dt;
    $('.bt').textContent=Math.max(0,Math.ceil(60-el));if(el>=60)return over('⏱ Time\'s up! Infections contained.');
    if(spawn<=0){spawn=Math.max(.75,2.2-el*.025);bugs.push({k:Math.floor(Math.random()*B.length),x:34+Math.random()*(w-68),y:-26,r:20,v:22+el*.7+Math.random()*10,ph:Math.random()*6})}
    bugs.forEach(function(b){b.y+=b.v*dt;b.ph+=dt*3});
    for(var i=bugs.length-1;i>=0;i--){var b=bugs[i];if(b.y-b.r>h){bugs.splice(i,1);lives--;hud();msg('😷 <b>'+B[b.k].n+'</b> got away! '+esc(B[b.k].tip));if(lives<=0)return over('Too many infections got away.')}}
    fx.forEach(function(f){f.life-=dt;f.y-=f.vy*dt;f.x+=(f.vx||0)*dt});fx=fx.filter(function(f){return f.life>0});
    draw();raf=requestAnimationFrame(loop);
  }
  function bx(b){return b.x+Math.sin(b.ph)*6}
  function draw(){
    if(!w)return;ctx.clearRect(0,0,w,h);
    bugs.forEach(function(b){
      var x=bx(b),y=b.y,d=B[b.k];
      ctx.strokeStyle=d.col;ctx.lineWidth=2;
      for(var j=0;j<10;j++){var a=j/10*6.283+b.ph*.3;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*b.r,y+Math.sin(a)*b.r);ctx.lineTo(x+Math.cos(a)*(b.r+7),y+Math.sin(a)*(b.r+7));ctx.stroke()}
      ctx.beginPath();ctx.arc(x,y,b.r,0,6.283);ctx.fillStyle=d.col;ctx.fill();
      if(b.m){ctx.setLineDash([4,4]);ctx.strokeStyle='#c62828';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,b.r+10,0,6.283);ctx.stroke();ctx.setLineDash([])}
      [-1,1].forEach(function(s){ctx.beginPath();ctx.arc(x+s*7,y-4,5,0,6.283);ctx.fillStyle='#fff';ctx.fill();ctx.beginPath();ctx.arc(x+s*7,y-3,2.4,0,6.283);ctx.fillStyle='#222';ctx.fill()});
      ctx.beginPath();ctx.arc(x,y+6,6,.15*Math.PI,.85*Math.PI);ctx.strokeStyle='#222';ctx.lineWidth=2;ctx.stroke();
      ctx.font='bold 12px system-ui,sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.strokeText(d.n,x,y+b.r+18);ctx.fillStyle='#1d2a33';ctx.fillText(d.n,x,y+b.r+18);
    });
    fx.forEach(function(f){ctx.globalAlpha=Math.max(0,Math.min(1,f.life*1.5));
      if(f.t){ctx.font='bold 14px system-ui,sans-serif';ctx.textAlign='center';ctx.fillStyle=f.c;ctx.fillText(f.t,f.x,f.y)}
      else{ctx.beginPath();ctx.arc(f.x,f.y,3,0,6.283);ctx.fillStyle=f.c;ctx.fill()}
      ctx.globalAlpha=1});
  }
  function kill(b,t,c){
    bugs.splice(bugs.indexOf(b),1);var x=bx(b);
    for(var i=0;i<14;i++){var a=Math.random()*6.283,s=60+Math.random()*120;fx.push({x:x,y:b.y,vx:Math.cos(a)*s,vy:-Math.sin(a)*s,life:.5,c:B[b.k].col})}
    fx.push({t:t,x:x,y:b.y,vy:40,life:1.1,c:c});
  }
  function hit(e){
    if(!running)return;
    var r=cv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,best=null,bd=1e9;
    bugs.forEach(function(b){var d=Math.hypot(bx(b)-px,b.y-py);if(d<b.r+14&&d<bd){bd=d;best=b}});
    if(!best)return;var d=B[best.k];
    if(sel===d.best){score+=100;res=Math.max(0,res-4);kill(best,'+100 🎯','#2e7d32');msg('✅ Narrowest effective choice for <b>'+d.n+'</b>!')}
    else if(d.ok.indexOf(sel)>=0){score+=25;res+=12;kill(best,'+25 too broad','#e67e22');msg('⚠️ '+W[sel].n+' works, but it\'s broader than needed. '+esc(d.tip))}
    else{res+=8;best.v*=1.25;best.r=Math.min(30,best.r+3);best.m=1;fx.push({t:'No coverage!',x:bx(best),y:best.y-best.r,vy:30,life:1.1,c:'#c62828'});msg('❌ '+W[sel].n+' doesn\'t cover <b>'+d.n+'</b>, and now it\'s stronger! '+esc(d.tip))}
    hud();if(res>=100)over('Resistance took over! Too much broad-spectrum use.');
  }
  function over(why){
    running=false;cancelAnimationFrame(raf);draw();
    ov('<h2>'+(el>=60?'Nice work!':'Game over')+'</h2><p>'+why+'</p><div class="big">'+score+'</div><p class="sub">Every 🎯 narrow kill also lowers resistance.</p>'+award('blast',score>=1000,'Score 1,000+')+'<div><button class="btn go">Play again</button><button class="btn ghost home">More games</button></div>');
    if(score>=1500)confetti();
  }
  function key(e){var n=+e.key;if(n>=1&&n<=W.length)setSel(n-1)}
  $$('.wbtn').forEach(function(b){b.onclick=function(){setSel(+b.dataset.i)}});
  cv.addEventListener('pointerdown',hit);document.addEventListener('keydown',key);window.addEventListener('resize',size);
  setCleanup(function(){running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',key);window.removeEventListener('resize',size)});
  setSel(0);size();
  ov('<h2>💥 Bug Blaster</h2><p>Bugs are invading for 60 seconds! Pick a drug below (or press 1–5), then tap a bug to treat it.</p>'+
    '<p class="sub">🎯 Narrowest effective drug: +100 and resistance drops<br>⚠️ Works but too broad: +25 and resistance rises<br>❌ No coverage: the bug gets bigger and faster<br>Lose all 3 ❤️ or hit 100% resistance and it\'s game over.</p><button class="btn go">Start</button>');
}
