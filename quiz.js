import { esc, shuffle, root, $, $$, BACK, wireBack, finish, MSGS, award, menu } from '../core.js';

/* ---------- QUIZ ENGINE (Myth/Fact, Dash, Duration) ---------- */
export const MYTHS=[
  {t:'Myth or Fact',q:'About 10% of patients report a penicillin allergy, and most of them are truly allergic.',o:['Myth','Fact'],a:0,e:'About 10% report it, but fewer than 1 in 10 of them are truly allergic when evaluated. Delabeling opens up first-line, narrower-spectrum options.',s:'CDC, Is It Really a Penicillin Allergy?'},
  {t:'Myth or Fact',q:"A patient with a penicillin allergy label can't receive cefazolin.",o:['Myth','Fact'],a:0,e:'Cefazolin has a unique side chain and very low cross-reactivity with penicillins. It can usually be given even with a history of penicillin anaphylaxis.',s:'AAAAI/ACAAI Drug Allergy Practice Parameter, 2022'},
  {t:'Myth or Fact',q:'Asymptomatic bacteriuria in a non-pregnant adult should usually be treated.',o:['Myth','Fact'],a:0,e:'Screening and treatment are recommended only in pregnancy and before urologic procedures that cause mucosal trauma.',s:'IDSA ASB Guideline, 2019'},
  {t:'Myth or Fact',q:'A positive C. difficile PCR in a patient without diarrhea means they need treatment.',o:['Myth','Fact'],a:0,e:'PCR detects the organism, not active disease, and colonization is common. Test only patients with ≥3 unformed stools in 24 hours and no laxatives.',s:'IDSA/SHEA CDI Guideline'},
  {t:'Myth or Fact',q:'Each additional day of antibiotic therapy adds to the risk of adverse drug events.',o:['Myth','Fact'],a:1,e:'In hospitalized adults, every additional 10 days of therapy was linked to about a 3% higher risk of an adverse drug event.',s:'Tamma et al., JAMA Intern Med 2017'},
  {t:'Myth or Fact',q:'A negative MRSA nasal PCR makes MRSA pneumonia unlikely, which supports stopping empiric anti-MRSA therapy.',o:['Myth','Fact'],a:1,e:'MRSA nares PCR has a negative predictive value of about 96–99% for MRSA pneumonia.',s:'Parente et al., Clin Infect Dis 2018'},
  {t:'Myth or Fact',q:'Antibiotics help most cases of acute bronchitis in otherwise healthy adults.',o:['Myth','Fact'],a:0,e:"Acute bronchitis is usually viral. Antibiotics don't meaningfully shorten symptoms, and they do cause side effects.",s:'ACP/CDC High-Value Care Advice, 2016'},
  {t:'Myth or Fact',q:'Reassessing antibiotics at 48–72 hours (a "time-out") is a core stewardship practice.',o:['Myth','Fact'],a:1,e:'With cultures and the clinical course in hand, ask: still needed? Right drug? De-escalate? IV-to-PO? Planned stop date?',s:'CDC Core Elements of Hospital Antibiotic Stewardship'}
];
export const DASH=[
  {t:'Culture is back',q:'MSSA bacteremia. The patient is on vancomycin + piperacillin-tazobactam. Best targeted therapy?',o:['Cefazolin','Continue vancomycin','Meropenem','Daptomycin'],a:0,e:'Beta-lactams (cefazolin or an antistaphylococcal penicillin) outperform vancomycin for MSSA. Stop the pip-tazo too.',s:'IDSA MRSA/S. aureus guidance; McDanel et al., CID 2015'},
  {t:'Culture is back',q:'Pyelonephritis with pan-susceptible E. coli. The patient is on meropenem, now improving and eating. Best next step?',o:['Oral TMP-SMX (susceptible)','Continue meropenem','Switch to ertapenem','Add vancomycin'],a:0,e:'Step down to a susceptible oral agent. Save carbapenems for when you really need them.',s:'IDSA Complicated UTI Guidance, 2025'},
  {t:'Culture is back',q:'CAP with penicillin-susceptible S. pneumoniae. The patient is on ceftriaxone + azithromycin and is stable. Best step-down?',o:['Oral amoxicillin','Oral levofloxacin','Oral cefdinir','Continue IV therapy'],a:0,e:"Penicillin-susceptible pneumococcus means amoxicillin. It's narrow, well absorbed, and effective.",s:'ATS/IDSA CAP Guideline, 2019'},
  {t:'Culture is back',q:'CAP on vancomycin + ceftriaxone. MRSA nares PCR is negative and cultures show no MRSA. What do you do?',o:['Stop vancomycin','Switch vancomycin to linezolid','Continue vancomycin 7 days','Add cefepime'],a:0,e:'A negative MRSA nares result plus negative cultures supports stopping anti-MRSA coverage.',s:'ATS/IDSA CAP Guideline, 2019'},
  {t:'Culture is back',q:'Ampicillin-susceptible E. faecalis cystitis. The patient is on daptomycin. Best targeted therapy?',o:['Amoxicillin / ampicillin','Continue daptomycin','Linezolid','Ceftriaxone'],a:0,e:"Ampicillin is the drug of choice for susceptible E. faecalis. Note that cephalosporins don't cover enterococci.",s:'IDSA Complicated UTI Guidance, 2025'},
  {t:'Clinical course',q:'Nonpurulent cellulitis without MRSA risk factors, improving on IV vancomycin. Best oral step-down?',o:['Cephalexin','Linezolid','Levofloxacin','Amoxicillin-clavulanate + doxycycline'],a:0,e:'Nonpurulent cellulitis is mostly streptococcal. Cephalexin covers it, and routine MRSA coverage is not needed.',s:'IDSA SSTI Guideline, 2014'}
];
export const DUR=[
  {t:'Duration',q:'Hospitalized (non-ICU) community-acquired pneumonia, clinically stable by day 3 on a beta-lactam. What duration was noninferior to 8 days in an RCT?',o:['3 days','5 days','10 days','14 days'],a:0,e:'Stopping beta-lactam therapy at day 3 in clinically stable patients was noninferior to continuing for 8 days.',s:'Dinh et al., Lancet 2021 (PTC trial)'},
  {t:'Duration',q:'Uncomplicated Gram-negative bacteremia (urinary source) with a good response. Which duration was noninferior to 14 days?',o:['3 days','7 days','10 days','21 days'],a:1,e:'7 days was noninferior to 14 days in patients who were improving.',s:'Yahav et al., Clin Infect Dis 2019'},
  {t:'Duration',q:'Uncomplicated cellulitis, improving. What is the typical recommended duration?',o:['5–6 days','10 days','14 days','21 days'],a:0,e:'5–6 days is usually enough. Extend only if the infection has not improved.',s:'IDSA SSTI Guideline, 2014; ACP Best Practice Advice, 2021'},
  {t:'Duration',q:'Acute uncomplicated cystitis in a woman, treated with nitrofurantoin. What duration?',o:['5 days','7 days','10 days','14 days'],a:0,e:'Nitrofurantoin for 5 days is a first-line regimen.',s:'IDSA Uncomplicated Cystitis Guideline, 2010'},
  {t:'Duration',q:'Intra-abdominal infection with adequate source control. Which duration was as good as a longer course (STOP-IT)?',o:['About 4 days','About 10 days','About 14 days','Until WBC normalizes'],a:0,e:'About 4 days after source control was as good as treating until physiologic abnormalities resolved.',s:'Sawyer et al., NEJM 2015 (STOP-IT)'},
  {t:'Duration',q:'Hospital-acquired or ventilator-associated pneumonia. What is the recommended duration for most patients?',o:['7 days','10 days','14 days','21 days'],a:0,e:'7 days is recommended for most patients with HAP or VAP.',s:'IDSA/ATS HAP/VAP Guideline, 2016'}
];
export function quiz(title,bank,id){
  var qs=shuffle(bank),i=0,score=0;
  function show(){
    var q=qs[i],order=q.o.length>2?shuffle(q.o.map(function(_,k){return k})):[0,1];
    var h='<div class="card">'+BACK+'<div class="bar"><i style="width:'+(i/qs.length*100)+'%"></i></div>'+
      '<div class="meta"><span>'+title+': '+(i+1)+' of '+qs.length+'</span><span class="sc">Score: '+score+'</span></div>'+
      '<span class="tag">'+esc(q.t)+'</span><p class="q">'+esc(q.q)+'</p><div class="opts">';
    order.forEach(function(k){h+='<button class="opt" data-k="'+k+'">'+esc(q.o[k])+'</button>'});
    root.innerHTML=h+'</div><div class="fb"></div></div>';wireBack();
    $$('.opt').forEach(function(b){b.onclick=function(){pick(+b.dataset.k)}});
  }
  function pick(k){
    var q=qs[i],right=k===q.a;if(right)score++;
    $$('.opt').forEach(function(b){var j=+b.dataset.k;b.disabled=true;if(j===q.a)b.classList.add('ok');else if(j===k)b.classList.add('bad')});
    $('.sc').textContent='Score: '+score;
    $('.fb').innerHTML='<div class="exp"><b class="'+(right?'ok">Correct!':'bad">Not quite.')+'</b> '+esc(q.e)+'<span class="src">Source: '+esc(q.s)+'</span></div>'+
      '<button class="btn nx">'+(i<qs.length-1?'Next →':'See results')+'</button>';
    $('.nx').onclick=function(){i++;i<qs.length?show():end()};
  }
  function end(){var need=Math.ceil(qs.length*.7);root.innerHTML=finish(title,score,qs.length,MSGS,award(id,score>=need,'Score '+need+'/'+qs.length+' or better'));wireBack();$('.again').onclick=function(){quiz(title,bank,id)};$('.home').onclick=menu}
  show();
}
