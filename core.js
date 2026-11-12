// Shared pieces every game uses: code words, the menu, and small helpers.

/* ===== EDIT ME: link to your Microsoft Form for code submissions (leave '' to hide the link) ===== */
export const FORM_URL = '';

/* Secret code words, one per game */
export const CODES = {wheel:'NARROW',blast:'TARGETED',whack:'TIMEOUT',catch:'SHIELD',clock:'SHORTER',myth:'DELABEL',match:'PATHOGEN',dash:'DEESCALATE',dur:'DURATION',scr:'STEWARD'};

/* The list of games on the menu. main.js fills this in. */
export const GAMES = [];

export const root = document.getElementById('aaw-hub');
const got = {};
let cleanup = null;

/* Action games call this with a function that stops their animation loop and key listeners */
export function setCleanup(fn){cleanup = fn}

export function award(id,ok,need){
  if(!ok)return '<p class="sub">🎟️ '+need+' to unlock this game\'s secret code word.</p>';
  got[id]=1;var n=Object.keys(got).length,t=Object.keys(CODES).length;
  return '<div class="code">🎟️ Secret code unlocked!<b>'+CODES[id]+'</b><span class="sub">Write it down! You have '+n+' of '+t+' codes.</span></div>';
}

export function confetti(){
  var c=document.createElement('canvas');c.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:5';root.appendChild(c);
  var w=c.width=root.clientWidth,h=c.height=root.clientHeight,x=c.getContext('2d'),P=[],t0=performance.now();
  for(var i=0;i<140;i++)P.push({x:Math.random()*w,y:-20-Math.random()*h*.5,vx:(Math.random()-.5)*3,vy:2+Math.random()*3,r:Math.random()*6.28,s:5+Math.random()*5,c:['#1f6f8b','#f2c94c','#eb5757','#27ae60','#9b51e0'][i%5]});
  (function f(t){x.clearRect(0,0,w,h);P.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.r+=.1;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});
    if(t-t0<2600&&c.parentNode)requestAnimationFrame(f);else if(c.parentNode)c.parentNode.removeChild(c)})(t0);
}

export function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
export function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
export function $(s){return root.querySelector(s)}
export function $$(s){return root.querySelectorAll(s)}

export const BACK='<button class="back">← All games</button>';
export function wireBack(){var b=$('.back');if(b)b.onclick=menu}

export const MSGS=['Stewardship superstar! 🏆','Great work, stewardship ally!','Solid start. You picked up a few new pearls.','Thanks for playing! Every bit of awareness helps.'];
export function finish(title,score,total,msgs,extra){
  var p=score/total,msg=p===1?msgs[0]:p>=.7?msgs[1]:p>=.4?msgs[2]:msgs[3];
  return '<div class="card center">'+BACK+'<h2>'+title+'</h2><div class="big">'+score+' / '+total+'</div><p>'+msg+'</p>'+(extra||'')+
    '<button class="btn again">Play again</button><button class="btn ghost home">More games</button></div>';
}

/* Start/end screen laid over an action game's play area */
export function overlay(html,onGo){
  var o=$('.ov');if(o)o.parentNode.removeChild(o);if(!html)return;
  var d=document.createElement('div');d.className='ov';d.innerHTML=html;$('.bw').appendChild(d);
  var g=d.querySelector('.go');if(g)g.onclick=onGo;var hm=d.querySelector('.home');if(hm)hm.onclick=menu;
}
export const AGAIN='<div><button class="btn go">Play again</button><button class="btn ghost home">More games</button></div>';

export function menu(){
  if(cleanup){cleanup();cleanup=null}
  var h='<div class="card"><h2>🦠 Antibiotic Awareness Week Arcade</h2><p class="sub">Pick any game. Each takes about 1–2 minutes.</p><div class="menu">';
  GAMES.forEach(function(g,i){h+='<button class="tile'+(g.f?' feat':'')+'" data-i="'+i+'">'+(got[g.id]?'<span class="gotit">🎟️ ✓</span>':'')+'<div class="ic">'+g.ic+'</div><h3>'+g.name+'</h3><p>'+g.d+'</p></button>'});
  var ids=Object.keys(CODES),mine=ids.filter(function(k){return got[k]}),chips=mine.map(function(k){return '<span class="chip">'+CODES[k]+'</span>'}).join('');
  h+='</div><div class="pp"><b>🎟️ Code Word Passport: '+mine.length+' of '+ids.length+' collected</b><br>Hit the target score in any game to unlock its secret code word, and keep track of every code you earn. Whoever submits the most secret code words by the end of Antibiotic Awareness Week will be recognized! 🏆'+
    (chips?'<div style="margin-top:6px">'+chips+'</div>':'')+
    (FORM_URL?'<div style="margin-top:8px"><a href="'+FORM_URL+'" target="_blank" rel="noopener" style="color:var(--c);font-weight:700">Submit your codes →</a></div>':'')+
    '<div class="sub" style="margin:6px 0 0">Codes aren\'t saved when you leave or refresh the page, so write them down!</div></div>';
  root.innerHTML=h+'<p class="sub" style="margin:14px 0 0">Questions? Contact the Antimicrobial Stewardship Program.</p></div>';
  $$('.tile').forEach(function(b){b.onclick=function(){GAMES[+b.dataset.i].fn()}});
}
