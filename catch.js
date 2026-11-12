import { esc, root, $, BACK, wireBack, award, confetti, overlay, AGAIN, setCleanup } from '../core.js';

/* ---------- STEWARDSHIP CATCH ---------- */
export function catcher(){
  var GOOD=[{e:'🧫',t:'Cultures first'},{e:'💊',t:'IV → PO'},{e:'⏱️',t:'48–72h time-out'},{e:'📉',t:'De-escalate'},{e:'🩺',t:'Allergy delabel'},{e:'✂️',t:'Short course'},{e:'📊',t:'Check antibiogram'}];
  var BAD=[{e:'🤧',t:'Abx for a cold',w:"Viral URIs don't need antibiotics."},{e:'🚽',t:'Treat ASB',w:"Asymptomatic bacteriuria usually shouldn't be treated."},{e:'📆',t:'14d cellulitis',w:'5–6 days is usually enough for cellulitis.'},
    {e:'💣',t:'Meropenem for susceptible E. coli',w:'Use the narrowest active agent.'},{e:'🔁',t:'Double anaerobe coverage',w:'Pip-tazo already covers anaerobes. Skip the metronidazole.'},{e:'🧻',t:'C. diff test, formed stool',w:'Only test unformed stools.'}];
  root.innerHTML='<div class="card">'+BACK+'<h2>🛡️ Stewardship Catch</h2>'+
    '<div class="meta"><span>Score: <b class="cs">0</b> <span class="cm"></span></span><span>⏱ <b class="ct">60</b>s</span><span class="cl">❤️❤️❤️</span></div>'+
    '<div class="bw"><canvas class="bc" style="touch-action:none;cursor:ew-resize"></canvas></div><p class="sub bm" style="margin:8px 0 0;min-height:2.8em">Drag, or use the ← → arrow keys.</p></div>';
  wireBack();
  var cv=$('.bc'),ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1,w,h,px,PW=120,items=[],fx=[],score,lives,combo,el,spawn,running=false,raf,last,keys={};
  function size(){w=cv.clientWidth;h=cv.clientHeight;cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);if(px==null)px=w/2;draw()}
  function msg(t){$('.bm').innerHTML=t}
  function hud(){$('.cs').textContent=score;$('.cl').textContent=lives>0?Array(lives+1).join('❤️'):'💀';var m=Math.min(5,1+Math.floor(combo/5));$('.cm').textContent=m>1?'· combo ×'+m:''}
  function start(){items=[];fx=[];score=0;lives=3;combo=0;el=0;spawn=.3;running=true;last=performance.now();hud();overlay(null);msg('Catch the good practices! 🛡️');raf=requestAnimationFrame(loop)}
  function loop(t){
    if(!running)return;var dt=Math.min(.05,(t-last)/1000);last=t;el+=dt;spawn-=dt;
    $('.ct').textContent=Math.max(0,Math.ceil(60-el));if(el>=60)return over(1);
    if(keys.ArrowLeft)px-=480*dt;if(keys.ArrowRight)px+=480*dt;px=Math.max(PW/2,Math.min(w-PW/2,px));
    if(spawn<=0){spawn=Math.max(.5,1.25-el*.012);var g=Math.random()<.55,d=g?GOOD[Math.floor(Math.random()*GOOD.length)]:BAD[Math.floor(Math.random()*BAD.length)];
      items.push({g:g,d:d,x:40+Math.random()*(w-80),y:-30,v:90+el*2.5+Math.random()*30})}
    var py=h-34;
    for(var i=items.length-1;i>=0;i--){var it=items[i];it.y+=it.v*dt;
      if(it.y>py-14&&it.y<py+10&&Math.abs(it.x-px)<PW/2+14){items.splice(i,1);
        if(it.g){combo++;var m=Math.min(5,1+Math.floor(combo/5)),p=50*m;score+=p;fx.push({t:'+'+p,x:it.x,y:py-30,vy:50,life:1,c:'#2e7d32'})}
        else{lives--;combo=0;fx.push({t:'Ouch!',x:it.x,y:py-30,vy:50,life:1,c:'#c62828'});msg('❌ <b>'+esc(it.d.t)+'</b>: '+esc(it.d.w))}
        hud();if(lives<=0)return over()}
      else if(it.y>h+30){items.splice(i,1);if(it.g&&combo){combo=0;hud()}}}
    fx.forEach(function(f){f.life-=dt;f.y-=f.vy*dt});fx=fx.filter(function(f){return f.life>0});
    draw();raf=requestAnimationFrame(loop);
  }
  function draw(){
    if(!w)return;ctx.clearRect(0,0,w,h);ctx.textAlign='center';
    items.forEach(function(it){
      ctx.beginPath();ctx.arc(it.x,it.y,20,0,6.283);ctx.fillStyle=it.g?'rgba(46,125,50,.15)':'rgba(198,40,40,.15)';ctx.fill();
      ctx.lineWidth=2;ctx.strokeStyle=it.g?'#2e7d32':'#c62828';ctx.stroke();
      ctx.font='22px system-ui';ctx.textBaseline='middle';ctx.fillText(it.d.e,it.x,it.y+1);
      ctx.font='bold 11px system-ui,sans-serif';ctx.textBaseline='alphabetic';ctx.lineWidth=3;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.strokeText(it.d.t,it.x,it.y+34);ctx.fillStyle=it.g?'#1b5e20':'#b71c1c';ctx.fillText(it.d.t,it.x,it.y+34);
    });
    var py=h-34;ctx.fillStyle='#1f6f8b';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(px-PW/2,py-8,PW,18,9);else ctx.rect(px-PW/2,py-8,PW,18);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 12px system-ui,sans-serif';ctx.textBaseline='middle';ctx.fillText('🛡️ ASP',px,py+1);ctx.textBaseline='alphabetic';
    fx.forEach(function(f){ctx.globalAlpha=Math.max(0,f.life);ctx.font='bold 16px system-ui,sans-serif';ctx.fillStyle=f.c;ctx.fillText(f.t,f.x,f.y);ctx.globalAlpha=1});
  }
  function over(timeUp){running=false;cancelAnimationFrame(raf);draw();overlay('<h2>'+(timeUp?'⏱ Time\'s up!':'Game over')+'</h2><div class="big">'+score+'</div><p class="sub">Tip: 5 good catches in a row raises your multiplier.</p>'+award('catch',score>=1000,'Score 1,000+')+AGAIN,start);if(score>=2000)confetti()}
  function mv(e){var r=cv.getBoundingClientRect();px=e.clientX-r.left}
  function kd(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){keys[e.key]=1;if(running)e.preventDefault()}}
  function ku(e){keys[e.key]=0}
  cv.addEventListener('pointermove',mv);cv.addEventListener('pointerdown',mv);
  document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);window.addEventListener('resize',size);
  setCleanup(function(){running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);window.removeEventListener('resize',size)});
  size();
  overlay('<h2>🛡️ Stewardship Catch</h2><p>You have 60 seconds. Move the ASP shield to catch good practices (green) and dodge bad ones (red).</p><p class="sub">🟢 Catch: +50, with a combo multiplier up to ×5<br>🔴 Catch a bad one: lose a ❤️<br>Drag on the game, or use the ← → keys.</p><button class="btn go">Start</button>',start);
}
