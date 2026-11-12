import { esc, shuffle, root, $, $$, BACK, wireBack, finish, award, MSGS, menu } from '../core.js';

/* ---------- SCRAMBLE ---------- */
var WORDS=[
  {w:'STEWARDSHIP',h:'Optimizing antimicrobial use. The theme of this week!'},
  {w:'ANTIBIOGRAM',h:'Annual summary of local susceptibility data.'},
  {w:'DEESCALATION',h:'Narrowing therapy once cultures return.'},
  {w:'RESISTANCE',h:'What overuse breeds.'},
  {w:'SUSCEPTIBLE',h:'The "S" on a culture report.'},
  {w:'SPECTRUM',h:'Narrow vs broad ______.'},
  {w:'PROPHYLAXIS',h:'Antibiotics given to prevent infection, e.g., before surgery.'},
  {w:'TIMEOUT',h:'The 48–72 hour antibiotic reassessment (2 words, no space).'}
];
export function scramble(){
  var ws=shuffle(WORDS).slice(0,6),i=0,score=0;
  function mix(w){var s;do{s=shuffle(w.split('')).join('')}while(s===w);return s}
  function show(){
    var x=ws[i];
    root.innerHTML='<div class="card center">'+BACK+'<div class="bar"><i style="width:'+(i/ws.length*100)+'%"></i></div>'+
      '<div class="meta"><span>Word '+(i+1)+' of '+ws.length+'</span><span>Score: '+score+'</span></div>'+
      '<div class="scr">'+mix(x.w)+'</div><input class="in" placeholder="Your answer" autocomplete="off">'+
      '<div><button class="btn ck">Check</button><button class="btn ghost hn">Hint</button><button class="btn ghost sk">Skip</button></div><div class="fb"></div></div>';
    wireBack();var inp=$('.in');inp.focus();
    function next(){i++;i<ws.length?show():end()}
    function check(){
      if(inp.value.toUpperCase().replace(/[^A-Z]/g,'')===x.w){score++;inp.disabled=true;$('.fb').innerHTML='<div class="exp"><b class="ok">Correct!</b> '+x.w+'</div>';setTimeout(next,900)}
      else{inp.classList.add('shake');setTimeout(function(){inp.classList.remove('shake')},600)}
    }
    $('.ck').onclick=check;inp.onkeydown=function(e){if(e.key==='Enter')check()};
    $('.hn').onclick=function(){$('.fb').innerHTML='<div class="exp">💡 '+esc(x.h)+'</div>'};
    $('.sk').onclick=function(){$('.fb').innerHTML='<div class="exp">The answer was <b>'+x.w+'</b>.</div>';inp.disabled=true;setTimeout(next,1200)};
  }
  function end(){root.innerHTML=finish('Stewardship Scramble',score,ws.length,MSGS,award('scr',score>=4,'Unscramble 4 or more words'));wireBack();$('.again').onclick=scramble;$('.home').onclick=menu}
  show();
}
