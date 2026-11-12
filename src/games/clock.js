import { esc, shuffle, root, $, BACK, wireBack, finish, MSGS, award, confetti, menu, setCleanup } from '../core.js';

/* ---------- STOP THE CLOCK ---------- */
var CLOCK=[
  {q:'Hospitalized (non-ICU) community-acquired pneumonia, clinically stable by day 3',lo:3,hi:3,e:'Stopping beta-lactam therapy at day 3 in clinically stable patients was noninferior to 8 days.',s:'Dinh et al., Lancet 2021 (PTC trial)'},
  {q:'Uncomplicated cellulitis, improving',lo:5,hi:6,e:'5–6 days is usually enough.',s:'IDSA SSTI Guideline, 2014'},
  {q:'Acute cystitis treated with nitrofurantoin',lo:5,hi:5,e:'Nitrofurantoin for 5 days.',s:'IDSA Uncomplicated Cystitis Guideline, 2010'},
  {q:'Uncomplicated Gram-negative bacteremia, improving',lo:7,hi:7,e:'7 days was noninferior to 14.',s:'Yahav et al., Clin Infect Dis 2019'},
  {q:'Hospital-acquired or ventilator-associated pneumonia',lo:7,hi:7,e:'7 days for most patients.',s:'IDSA/ATS HAP/VAP Guideline, 2016'},
  {q:'Intra-abdominal infection with adequate source control',lo:4,hi:4,e:'About 4 days after source control.',s:'Sawyer et al., NEJM 2015 (STOP-IT)'},
  {q:'Uncomplicated S. aureus bacteremia',lo:14,hi:14,e:'At least 14 days from the first negative blood culture.',s:'IDSA MRSA Guideline, 2011'},
  {q:'C. difficile, initial episode (fidaxomicin or oral vancomycin)',lo:10,hi:10,e:'10 days.',s:'IDSA/SHEA CDI Guideline, 2021'},
  {q:'Group A strep pharyngitis (penicillin or amoxicillin)',lo:10,hi:10,e:'10 days, to prevent rheumatic fever.',s:'IDSA GAS Pharyngitis Guideline, 2012'},
  {q:'COPD exacerbation needing antibiotics',lo:5,hi:5,e:'5 days.',s:'ACP Best Practice Advice, 2021'},
  {q:'Pyelonephritis treated with a fluoroquinolone',lo:5,hi:7,e:'5–7 days, depending on the agent.',s:'IDSA Pyelonephritis Guideline, 2010'},
  {q:'Acute bacterial sinusitis in an adult',lo:5,hi:7,e:'5–7 days.',s:'IDSA Rhinosinusitis Guideline, 2012'}
];
export function clock(){
  var rs=shuffle(CLOCK).slice(0,6),ri=0,score=0,pos,dir,spd,raf,last,running=false,stopped,MAX=21,cv,ctx,w,h,dpr=window.devicePixelRatio||1;
  function size(){if(!cv)return;w=cv.clientWidth;h=cv.clientHeight;cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
  function X(d){return 20+(w-40)*d/MAX}
  function draw(){
    if(!w)return;var r=rs[ri],y=70;ctx.clearRect(0,0,w,h);
    if(stopped){ctx.fillStyle='rgba(46,125,50,.25)';var a=X(r.lo-.5),b=X(r.hi+.5);ctx.fillRect(a,y-16,b-a,32)}
    ctx.fillStyle='#dde8ee';ctx.fillRect(20,y-6,w-40,12);
    ctx.fillStyle='#5a6b76';ctx.textAlign='center';ctx.font='12px system-ui,sans-serif';
    for(var d=0;d<=MAX;d++){var x=X(d);ctx.fillRect(x-.5,y+8,1,d%7===0?10:5);if([0,3,5,7,10,14,21].indexOf(d)>=0)ctx.fillText(d,x,y+32)}
    var mx=X(pos);ctx.fillStyle=stopped?'#1d2a33':'#c62828';ctx.fillRect(mx-2,y-22,4,44);
    ctx.beginPath();ctx.moveTo(mx-9,y-32);ctx.lineTo(mx+9,y-32);ctx.lineTo(mx,y-20);ctx.fill();
    ctx.font='bold 14px system-ui,sans-serif';ctx.fillText(pos.toFixed(1)+' d',Math.max(30,Math.min(w-30,mx)),y-38);
  }
  function round(){
    var r=rs[ri];stopped=false;pos=0;dir=1;spd=6+ri*1.6;
    root.innerHTML='<div class="card">'+BACK+'<div class="meta"><span>⏱️ Stop the Clock: '+(ri+1)+' of '+rs.length+'</span><span>Score: '+score+'</span></div>'+
      '<span class="tag">How many days of antibiotics?</span><p class="q">'+esc(r.q)+'</p>'+
      '<div class="bw" style="background:#fff"><canvas class="bc" style="height:120px;cursor:pointer"></canvas></div>'+
      '<button class="btn stop">⏹ STOP</button><div class="fb"></div></div>';
    wireBack();cv=$('.bc');ctx=cv.getContext('2d');size();
    $('.stop').onclick=stop;cv.onclick=stop;
    running=true;last=performance.now();raf=requestAnimationFrame(loop);
  }
  function loop(t){if(!running)return;var dt=Math.min(.05,(t-last)/1000);last=t;pos+=dir*spd*dt;if(pos>MAX){pos=MAX;dir=-1}if(pos<0){pos=0;dir=1}draw();raf=requestAnimationFrame(loop)}
  function stop(){
    if(stopped||!running)return;stopped=true;running=false;cancelAnimationFrame(raf);
    var r=rs[ri],d=pos<r.lo?r.lo-pos:pos>r.hi?pos-r.hi:0,pts=Math.max(0,Math.round(100-d*40));score+=pts;draw();
    $('.stop').disabled=true;$('.meta span:last-child').textContent='Score: '+score;
    $('.fb').innerHTML='<div class="exp"><b class="'+(pts>=80?'ok">🎯 Bullseye!':pts>0?'ok">Close!':'bad">Missed!')+'</b> You stopped at '+pos.toFixed(1)+' days. Target: <b>'+r.lo+(r.hi>r.lo?'–'+r.hi:'')+' days</b>. +'+pts+
      '<br>'+esc(r.e)+'<span class="src">Source: '+esc(r.s)+'</span></div><button class="btn nx">'+(ri<rs.length-1?'Next →':'See results')+'</button>';
    if(pts>=80)confetti();
    $('.nx').onclick=function(){ri++;if(ri<rs.length)round();else{root.innerHTML=finish('⏱️ Stop the Clock',score,rs.length*100,MSGS,award('clock',score>=420,'Score 420+'));wireBack();$('.again').onclick=clock;$('.home').onclick=menu;if(score>=rs.length*70)confetti()}};
  }
  function key(e){if((e.key===' '||e.key==='Enter')&&running){e.preventDefault();stop()}}
  document.addEventListener('keydown',key);window.addEventListener('resize',size);
  setCleanup(function(){running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',key);window.removeEventListener('resize',size)});
  round();
}
