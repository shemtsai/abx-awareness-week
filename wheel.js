import { esc, shuffle, root, $, $$, BACK, wireBack, award, confetti, menu, setCleanup } from '../core.js';

/* ---------- STEWARDSHIP WHEEL ---------- */
var PUZ=[
  {c:'Slogan',p:'NARROW IS THE NEW BROAD',e:'Use the narrowest agent that covers the likely or confirmed pathogen.'},
  {c:'Phrase',p:'SHORTER IS SMARTER',e:'Short courses work as well as long ones for CAP, cellulitis, pyelonephritis and Gram-negative bacteremia.'},
  {c:'Best practice',p:'CULTURES BEFORE ANTIBIOTICS',e:'Cultures drawn before the first dose make de-escalation possible later.'},
  {c:'Phrase',p:"DON'T TREAT THE URINE",e:'Asymptomatic bacteriuria usually should not be treated, except in pregnancy or before urologic procedures that cause mucosal trauma.'},
  {c:'Best practice',p:'IV TO PO CONVERSION',e:'Many antibiotics are highly bioavailable orally. Switching cuts line days and can shorten length of stay.'},
  {c:'Thing',p:'PENICILLIN ALLERGY DELABELING',e:'More than 90% of people labeled penicillin-allergic can safely take penicillins.'},
  {c:'Phrase',p:'RIGHT DRUG RIGHT DOSE RIGHT DURATION',e:'The core of antimicrobial stewardship.'},
  {c:'Event',p:'ANTIBIOTIC TIME OUT',e:'Reassess at 48–72 hours: still needed, right drug, ready to narrow, switch to PO or stop?'}
];
export function wheel(){
  var SEG=[300,500,'BANKRUPT',400,600,700,'LOSE A TURN',800,250,900,350,1000],COL=['#1f6f8b','#27ae60','#eb5757','#9b51e0','#2d9cdb','#e67e22','#16a085'];
  var ps=shuffle(PUZ).slice(0,2),pi=0,total=0,solved=0,bank,strikes,val,phase,used,rot=0,spinning,done,dead=false,VOW='AEIOU';
  setCleanup(function(){dead=true});
  function letters(){return ps[pi].p.replace(/[^A-Z]/g,'')}
  function left(v){return letters().split('').filter(function(L){return !used[L]&&(VOW.indexOf(L)>=0)===v}).length}
  function say(t){$('.fb').innerHTML='<div class="exp">'+t+'</div>'}
  function round(){
    bank=0;strikes=0;val=0;phase='spin';used={};spinning=false;done=false;
    root.innerHTML='<div class="card">'+BACK+'<div class="meta"><span>Puzzle '+(pi+1)+' of '+ps.length+'</span><span>Total: $<b class="wt">'+total+'</b></span></div>'+
      '<span class="tag">Category: '+esc(ps[pi].c)+'</span><div class="board"></div>'+
      '<div class="meta"><span>This round: $<b class="wb">0</b></span><span class="ws"></span></div>'+
      '<div class="whw"><div class="ptr"></div><canvas class="wc" width="560" height="560"></canvas></div>'+
      '<div class="wctl"><button class="btn sp">🎡 Spin</button><button class="btn ghost bv">Buy a vowel ($250)</button><button class="btn ghost so">Solve</button></div>'+
      '<div class="kb"></div><div class="slv"></div><div class="fb"></div></div>';
    wireBack();
    var kb='';for(var i=0;i<26;i++){var L=String.fromCharCode(65+i);kb+='<button class="key" data-l="'+L+'">'+L+'</button>'}
    $('.kb').innerHTML=kb;
    $$('.key').forEach(function(k){k.onclick=function(){guess(k.dataset.l)}});
    $('.sp').onclick=spin;
    $('.bv').onclick=function(){if(bank<250)return say('You need $250 in this round to buy a vowel.');bank-=250;phase='vowel';ui();say('Pick a vowel.')};
    $('.so').onclick=solveBox;
    drawW();ui();say('Spin the wheel to start! 3 strikes ends the puzzle.');
  }
  function ui(){
    var b='';
    ps[pi].p.split(' ').forEach(function(wd){b+='<span class="wd">';wd.split('').forEach(function(ch){var isL=/[A-Z]/.test(ch);b+='<span class="lt'+(isL?'':' pn')+'">'+(!isL||used[ch]||done?ch:'')+'</span>'});b+='</span>'});
    $('.board').innerHTML=b;$('.wt').textContent=total;$('.wb').textContent=bank;
    $('.ws').textContent='Strikes: '+(strikes?Array(strikes+1).join('❌'):'none');
    $$('.key').forEach(function(k){var L=k.dataset.l,v=VOW.indexOf(L)>=0;k.disabled=done||!!used[L]||!((phase==='guess'&&!v)||(phase==='vowel'&&v));k.classList.toggle('used',!!used[L])});
    var busy=done||spinning||phase!=='spin';
    $('.sp').disabled=busy||left(false)===0;$('.bv').disabled=busy||left(true)===0;$('.so').disabled=busy;
  }
  function drawW(){
    var c=$('.wc');if(!c)return;var x=c.getContext('2d'),R=280,n=SEG.length,a=2*Math.PI/n;
    x.clearRect(0,0,560,560);
    for(var i=0;i<n;i++){
      var s=SEG[i],str=typeof s==='string',st=rot+i*a;
      x.beginPath();x.moveTo(R,R);x.arc(R,R,R-8,st,st+a);x.closePath();
      x.fillStyle=s==='BANKRUPT'?'#222':s==='LOSE A TURN'?'#fff':COL[i%COL.length];x.fill();x.strokeStyle='#fff';x.lineWidth=3;x.stroke();
      x.save();x.translate(R,R);x.rotate(st+a/2);x.textAlign='right';x.textBaseline='middle';
      x.fillStyle=s==='LOSE A TURN'?'#c62828':'#fff';x.font='bold '+(str?22:34)+'px system-ui,sans-serif';
      x.fillText(str?s:'$'+s,R-26,0);x.restore();
    }
    x.beginPath();x.arc(R,R,R-5,0,2*Math.PI);x.strokeStyle='#1f6f8b';x.lineWidth=10;x.stroke();
    x.beginPath();x.arc(R,R,36,0,2*Math.PI);x.fillStyle='#fff';x.fill();x.lineWidth=6;x.stroke();
    x.font='30px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText('🦠',R,R+2);
  }
  function spin(){
    if(spinning||phase!=='spin'||done)return;
    spinning=true;ui();$('.slv').innerHTML='';say('Spinning…');
    var from=rot,to=rot+Math.PI*2*(4+Math.random()*2),t0=performance.now(),D=3200;
    (function f(t){if(dead)return;var p=Math.min(1,(t-t0)/D);rot=from+(to-from)*(1-Math.pow(1-p,3));drawW();if(p<1)requestAnimationFrame(f);else land()})(t0);
  }
  function land(){
    spinning=false;var n=SEG.length,a=2*Math.PI/n,T=2*Math.PI,idx=Math.floor((((1.5*Math.PI-rot)%T)+T)%T/a),s=SEG[idx];
    if(s==='BANKRUPT'){bank=0;ui();say('💸 <b>BANKRUPT!</b> Your round winnings are gone. Spin again.')}
    else if(s==='LOSE A TURN')strike('🚫 <b>Lose a turn!</b>');
    else{val=s;phase='guess';ui();say('🎉 <b>$'+s+'</b>! Pick a consonant.')}
  }
  function guess(L){
    if(used[L]||done)return;
    var vow=phase==='vowel';used[L]=1;phase='spin';
    var n=letters().split('').filter(function(x){return x===L}).length;
    if(!vow){if(!n)return strike('No '+L+'.');bank+=val*n;say('✅ '+n+' '+L+(n>1?"'s":'')+'! +$'+(val*n)+'.')}
    else say(n?'✅ '+n+' '+L+(n>1?"'s":'')+'.':'No '+L+'. (Vowels never cost a strike.)');
    ui();if(left(true)+left(false)===0)win();
  }
  function strike(m){
    strikes++;
    if(strikes>=3){done=true;bank=0;ui();say(m+' That\'s 3 strikes. The answer was <b>'+esc(ps[pi].p)+'</b>.<span class="src">💡 '+esc(ps[pi].e)+'</span>'+nextBtn());wireNext()}
    else{ui();say(m+' Strike '+strikes+' of 3.')}
  }
  function solveBox(){
    if(phase!=='spin'||done)return;
    $('.slv').innerHTML='<input class="in" placeholder="Type the full answer" autocomplete="off"><button class="btn ck">Submit</button>';
    var i=$('.in');i.focus();
    function go(){var g=i.value.toUpperCase().replace(/[^A-Z]/g,'');if(!g)return;$('.slv').innerHTML='';if(g===letters())win();else strike('❌ Not quite.')}
    $('.ck').onclick=go;i.onkeydown=function(e){if(e.key==='Enter')go()};
  }
  function win(){done=true;solved++;total+=bank;ui();$('.slv').innerHTML='';say('🏆 <b>Solved!</b> +$'+bank+' banked.<span class="src">💡 '+esc(ps[pi].e)+'</span>'+nextBtn());wireNext();confetti()}
  function nextBtn(){return '<button class="btn nx">'+(pi<ps.length-1?'Next puzzle →':'See results')+'</button>'}
  function wireNext(){$('.nx').onclick=function(){
    pi++;if(pi<ps.length)return round();
    root.innerHTML='<div class="card center">'+BACK+'<h2>🎡 Final winnings</h2><div class="big">$'+total+'</div><p>'+(total>=3000?'Stewardship millionaire! 🏆':total>0?'Nice spinning!':'Better luck next spin!')+'</p><p class="sub">Puzzles solved: '+solved+' of '+ps.length+'</p>'+award('wheel',solved>=2,'Solve both puzzles')+'<button class="btn again">Play again</button><button class="btn ghost home">More games</button></div>';
    wireBack();$('.again').onclick=wheel;$('.home').onclick=menu;if(total>0)confetti();
  }}
  round();
}
