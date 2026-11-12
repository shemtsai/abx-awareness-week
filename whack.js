import { esc, root, $, $$, BACK, wireBack, award, confetti, overlay, AGAIN, setCleanup } from '../core.js';

/* ---------- ORDER WHACK ---------- */
var ORDERS=[
  {t:'Cipro for asymptomatic bacteriuria',b:1,w:'Asymptomatic bacteriuria usually should not be treated.'},
  {t:'Vancomycin for MSSA bacteremia',b:1,w:'Switch to cefazolin. Beta-lactams outperform vancomycin for MSSA.'},
  {t:'Meropenem for pan-susceptible E. coli',b:1,w:'Narrow to the most targeted active agent.'},
  {t:'Treat C. diff PCR+ with formed stools',b:1,w:'That is colonization. Test and treat only with diarrhea.'},
  {t:'Azithromycin for acute bronchitis',b:1,w:"It's usually viral, so antibiotics don't help."},
  {t:'Metronidazole added to pip-tazo',b:1,w:'Pip-tazo already covers anaerobes.'},
  {t:'Daptomycin for MRSA pneumonia',b:1,w:'Pulmonary surfactant inactivates daptomycin.'},
  {t:'Nitrofurantoin for pyelonephritis',b:1,w:"It doesn't reach adequate levels in kidney tissue."},
  {t:'14 days for uncomplicated cellulitis',b:1,w:'5–6 days is usually enough.'},
  {t:'Cefepime + pip-tazo together',b:1,w:'Redundant beta-lactams add toxicity, not benefit.'},
  {t:'Cefazolin for MSSA bacteremia',b:0,w:'Cefazolin is a drug of choice for MSSA.'},
  {t:'Stop vanc: MRSA nares negative (CAP)',b:0,w:'A negative nares PCR supports stopping MRSA coverage.'},
  {t:'Amoxicillin for pen-S pneumococcal CAP',b:0,w:'Narrow, oral and effective.'},
  {t:'Nitrofurantoin x5 days for cystitis',b:0,w:'A first-line regimen for cystitis.'},
  {t:'Blood cultures before first dose',b:0,w:'Cultures make de-escalation possible later.'},
  {t:'Cephalexin for nonpurulent cellulitis',b:0,w:'Streptococci are the usual cause, and cephalexin covers them.'},
  {t:'7 days for uncomplicated GN bacteremia',b:0,w:'Noninferior to 14 days (Yahav et al., 2019).'},
  {t:'IV-to-PO switch for a stable patient',b:0,w:'Good oral bioavailability means fewer line days.'},
  {t:'Refer penicillin allergy for testing',b:0,w:'Most penicillin allergy labels can be removed.'}
];
export function whack(){
  var LEN=60;
  root.innerHTML='<div class="card">'+BACK+'<h2>🔨 Order Whack</h2>'+
    '<div class="meta"><span>Score: <b class="ws2">0</b></span><span>⏱ <b class="wt2">'+LEN+'</b>s</span></div>'+
    '<div class="bar"><i class="wtb" style="width:100%"></i></div><div class="bw"><div class="wg"></div></div><p class="sub bm" style="margin:8px 0 0;min-height:2.8em"></p></div>';
  wireBack();
  var g='';for(var i=0;i<9;i++)g+='<div class="hole"><button class="pop"></button></div>';$('.wg').innerHTML=g;
  var H=[].slice.call($$('.pop')).map(function(el){return{el:el,o:null}}),score,t0,next,raf,running=false,misses;
  function msg(t){$('.bm').innerHTML=t}
  H.forEach(function(h){h.el.onclick=function(){
    if(!running||!h.o||h.done)return;h.done=true;h.exp=performance.now()+600;
    if(h.o.b){score+=100;h.el.classList.add('good');h.el.textContent='✅ Stopped! +100';msg('✅ '+esc(h.o.w))}
    else{score-=50;misses.push(h.o);h.el.classList.add('oops');h.el.textContent='🙅 That was a good order! −50';msg('🙅 <b>'+esc(h.o.t)+'</b> was appropriate. '+esc(h.o.w))}
    $('.ws2').textContent=score;
  }});
  function clear(h){h.el.classList.remove('up');setTimeout(function(){if(!h.el.classList.contains('up')){h.el.className='pop';h.el.textContent=''}},160);h.o=null}
  function start(){score=0;misses=[];t0=performance.now();next=0;running=true;H.forEach(clear);overlay(null);msg('Whack the <b>bad</b> orders. Let the good ones go!');$('.ws2').textContent=0;raf=requestAnimationFrame(loop)}
  function loop(now){
    if(!running)return;var t=(now-t0)/1000,rem=Math.max(0,LEN-t);
    $('.wt2').textContent=Math.ceil(rem);$('.wtb').style.width=(rem/LEN*100)+'%';
    H.forEach(function(h){if(h.o&&now>h.exp){
      if(!h.done){if(h.o.b){score-=25;misses.push(h.o);msg('😬 Missed one: <b>'+esc(h.o.t)+'</b>. '+esc(h.o.w))}else score+=10;$('.ws2').textContent=score}
      clear(h)}});
    if(now>=next){
      var free=H.filter(function(h){return !h.o&&!h.el.classList.contains('up')});
      if(free.length){
        var h=free[Math.floor(Math.random()*free.length)],showing=H.map(function(x){return x.o}),pool=ORDERS.filter(function(o){return showing.indexOf(o)<0&&(Math.random()<.6?o.b:!o.b)});
        if(!pool.length)pool=ORDERS.filter(function(o){return showing.indexOf(o)<0});
        h.o=pool[Math.floor(Math.random()*pool.length)];h.done=false;h.exp=now+1000*Math.max(1.3,2.6-t*.03);
        h.el.className='pop up';h.el.textContent=h.o.t;
      }
      next=now+1000*Math.max(.45,1.1-t*.015);
    }
    if(rem<=0)return over();
    raf=requestAnimationFrame(loop);
  }
  function over(){
    running=false;H.forEach(clear);
    var seen=[],les='';misses.forEach(function(m){if(seen.indexOf(m)<0&&seen.length<4){seen.push(m);les+='<li><b>'+esc(m.t)+'</b>: '+esc(m.w)+'</li>'}});
    overlay('<h2>⏱ Time!</h2><div class="big">'+score+'</div>'+(les?'<div class="sub" style="text-align:left;max-width:460px"><b>Worth reviewing:</b><ul style="margin:6px 0 0;padding-left:18px">'+les+'</ul></div>':'<p>Perfect run! 🏆</p>')+award('whack',score>=2000,'Score 2,000+')+AGAIN,start);
    if(score>=1500||!misses.length)confetti();
  }
  setCleanup(function(){running=false;cancelAnimationFrame(raf)});
  overlay('<h2>🔨 Order Whack</h2><p>Antibiotic orders pop up for '+LEN+' seconds.</p><p class="sub">🔨 Whack an inappropriate order: +100<br>🙅 Whack an appropriate one: −50<br>😬 Let a bad order through: −25</p><button class="btn go">Start</button>',start);
}
