import { esc, shuffle, root, $, $$, BACK, wireBack, finish, MSGS, award, menu } from '../core.js';

/* ---------- BUG–DRUG MATCH ---------- */
var PAIRS=[
  {b:'MSSA',d:'Cefazolin',p:'For MSSA, beta-lactams beat vancomycin.'},
  {b:'MRSA',d:'Vancomycin',p:'Use dosing guided by AUC.'},
  {b:'Pseudomonas aeruginosa',d:'Cefepime',p:'Check susceptibilities. Avoid double coverage once they are known.'},
  {b:'ESBL-producing E. coli (bacteremia)',d:'Meropenem',p:'MERINO: carbapenem beat pip-tazo for ESBL bacteremia.'},
  {b:'Stenotrophomonas maltophilia',d:'TMP-SMX',p:'Intrinsically resistant to carbapenems.'},
  {b:'E. faecalis (amp-susceptible)',d:'Ampicillin',p:"Cephalosporins don't cover enterococci."},
  {b:'C. difficile (initial episode)',d:'Oral fidaxomicin',p:'Preferred by IDSA/SHEA 2021. Oral vancomycin is an alternative.'}
];
export function match(){
  var bugs=shuffle(PAIRS),drugs=shuffle(PAIRS),sel=null,done=0,miss=0;
  var h='<div class="card">'+BACK+'<h2>🎯 Bug–Drug Match</h2><p class="sub">Tap an organism, then its preferred targeted therapy.</p>'+
    '<div class="meta"><span class="dn">Matched: 0/'+PAIRS.length+'</span><span class="ms">Misses: 0</span></div><div class="cols"><div class="opts">';
  bugs.forEach(function(p){h+='<button class="opt bug" data-b="'+esc(p.b)+'">🦠 '+esc(p.b)+'</button>'});
  h+='</div><div class="opts">';
  drugs.forEach(function(p){h+='<button class="opt drug" data-b="'+esc(p.b)+'">💊 '+esc(p.d)+'</button>'});
  root.innerHTML=h+'</div></div><div class="fb"></div></div>';wireBack();
  $$('.bug').forEach(function(b){b.onclick=function(){$$('.bug').forEach(function(x){x.classList.remove('sel')});b.classList.add('sel');sel=b}});
  $$('.drug').forEach(function(d){d.onclick=function(){
    if(!sel){$('.fb').innerHTML='<div class="exp">Pick an organism first.</div>';return}
    if(d.dataset.b===sel.dataset.b){
      [sel,d].forEach(function(x){x.classList.remove('sel');x.classList.add('ok');x.disabled=true});
      var p=PAIRS.filter(function(x){return x.b===d.dataset.b})[0];
      $('.fb').innerHTML='<div class="exp"><b class="ok">Match!</b> '+esc(p.b)+' → '+esc(p.d)+'. '+esc(p.p)+'</div>';
      sel=null;done++;$('.dn').textContent='Matched: '+done+'/'+PAIRS.length;
      if(done===PAIRS.length){var s=Math.max(0,PAIRS.length-miss);setTimeout(function(){root.innerHTML=finish('Bug–Drug Match',s,PAIRS.length,MSGS,'<p class="sub">Misses: '+miss+'</p>'+award('match',miss<=2,'Finish with 2 or fewer misses'));wireBack();$('.again').onclick=match;$('.home').onclick=menu},1200)}
    }else{
      miss++;$('.ms').textContent='Misses: '+miss;d.classList.add('bad','shake');
      setTimeout(function(){d.classList.remove('bad','shake')},600);
    }
  }});
}
