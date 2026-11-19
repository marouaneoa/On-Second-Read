const {cases, queries} = JSON.parse(document.querySelector('#data').textContent);
const desk = document.querySelector('#desk');
const nav = document.querySelector('#cases');
const labels = ['Source trace', 'Same criterion, different evidence', 'A criterion outside the rubric', 'Same criterion and citation, different wording'];
const briefs = {
  'missing-credit': ['What changes between these two leadership assessments?', 'Which detail would you put before the panel?', ['The project title identifies who delegated tasks.', 'The diary describes assigning jobs and resolving a missed handoff.', 'The diary proves both reviewers reached the same verdict.'], 1, 'The cover identifies a lead. Only the diary describes the coordination work.'],
  'moving-goalpost': ['Which requirement did the panel actually publish?', 'What would you ask the panel to justify?', ['Why the launch report mentions a deadline.', 'Whether the candidate worked alone.', 'Why management experience enters a delivery assessment.'], 2, 'The release addresses delivery. The second judgment introduces management experience, which is absent from the complete rubric.'],
  'same-reasoning': ['Does different wording change the evidence trail?', 'Which conclusion can you defend from the file?', ['Both cite the recorded replay under the verification criterion.', 'Both would make the same hiring decision.', 'The wording shows that they used different tests.'], 0, 'The trace converges on the same passage and criterion. The file records no overall hiring recommendation.']
};
const key = 'on-second-read.answers.v2';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
let current;
const esc = s => String(s).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const valid = c => Array.isArray(saved[c.id]) && [1,2,3].includes(saved[c.id][0]) && [0,1,2].includes(saved[c.id][1]);
function store(){try {localStorage.setItem(key, JSON.stringify(saved));} catch {}}
function choices(name, items, offset){
  return items.map((text,i)=>`<label class="choice"><input required type="radio" name="${name}" value="${i+offset}">${esc(text)}</label>`).join('');
}
function openCase(){
  current = cases.find(c => c.id === location.hash.slice(1)) || cases[0];
  const c=current, brief=c.guide.brief || briefs[c.id], done=valid(c);
  document.querySelector('#progress').textContent = cases.filter(valid).length+' / '+cases.length+' cases reviewed';
  nav.innerHTML = cases.map(item=>`<button aria-current="${item.id===c.id}" data-case="${item.id}">${valid(item)?'✓ ':''}${esc(item.title)}</button>`).join('');
  const baseline=c.variants[c.base.join('|')][0];
  desk.innerHTML=`<section class="intro"><div class="meta">Case file · ${esc(c.rubric)}</div><h1>${esc(c.title)}</h1><p>${esc(c.guide.context)}</p><p><strong>${esc(brief[0])}</strong></p></section>
  <div class="grid"><section class="panel"><h2>Candidate dossier</h2><p><b>Published rubric</b> · ${esc(c.rubric)}</p><p>${esc(c.guide.rule)}</p>
  ${Object.entries(c.passages).filter(([,p])=>p.original).map(([id,p])=>`<div class="note"><small>${esc(id)} / ${esc(p.source)}</small><p>${esc(p.text)}</p></div>`).join('')}</section>
  <section class="panel"><h2>Panel notes</h2>${c.reviews.map((w,i)=>`<div class="note"><small>${esc(baseline[i][0])} · cites ${esc(baseline[i][2])}</small><p>“${esc(w)}”</p></div>`).join('')}</section></div>
  <section class="panel" id="decision"><h2>Your assessment</h2><p>First ask what each reviewer wanted to see. Then check which passage each one used. A criterion is the standard they applied. A citation points to the passage they relied on.</p>${done?feedback(c):`<form><fieldset><legend>Which pattern connects the reviews?</legend>${choices('pattern',labels.slice(1),1)}</fieldset><fieldset><legend>${esc(brief[1])}</legend>${choices('reason',brief[2],0)}</fieldset><button class="primary">Check my reasoning</button></form>`}</section>${done?'<section class="panel" id="lab"></section>':''}`;
  mountTools(c);
  const form=desk.querySelector('form');
  if(form) form.onsubmit=e=>{e.preventDefault(); const values=new FormData(form);saved[c.id]=['pattern','reason'].map(k=>Number(values.get(k)));store();openCase();desk.querySelector('#decision').scrollIntoView();};
  if(done){
    desk.querySelector('#retry').onclick=()=>{delete saved[c.id];store();openCase();};
    showLab(c);
  }
}
function feedback(c){
  const [p,r]=saved[c.id], brief=c.guide.brief || briefs[c.id];
  const score=Number(p===c.answer)+Number(r===brief[3]);
  return `<div class="feedback"><strong>${score} of 2 supported by the record</strong>
  <p>Your pattern: ${esc(labels[p])}.<br>Your evidence: ${esc(brief[2][r])}</p>
  <p><b>Finding</b> · ${esc(labels[c.answer])}. ${esc(c.guide.walk)}</p></div>
  <p><b>For discussion</b> · ${esc(c.question)}</p><button id="retry">Try this case again</button>`;
}
function showLab(c){
  const lab=desk.querySelector('#lab');
  const options=(entries,base)=>entries.map(([v,label])=>`<option value="${esc(v)}" ${v===base?'selected':''}>${esc(label)}</option>`).join('');
  lab.innerHTML=`<h2>Evidence lab</h2><p>Change Reviewer B’s recorded citation or criterion. Compare the resulting graph with the original panel notes above.</p>
  <div class="controls"><label>Cited passage<select id="citation">${options(Object.entries(c.passages).map(([id,p])=>[id,p.source]),c.base[0])}</select></label>
  <label>Applied criterion<select id="criterion">${options(Object.entries(c.criteria),c.base[1])}</select></label><button id="restore">Restore original</button></div>
  <div id="outcome" aria-live="polite"></div>
  <details><summary>Inspect a SPARQL query and its rows</summary><select aria-label="Query" id="query">${options(labels.map((s,i)=>[i,s]),0)}</select><pre id="sparql"></pre><pre id="rows"></pre></details>
  <details><summary>Read the original Turtle file</summary><pre>${esc(c.turtle)}</pre></details>`;
  const citation=lab.querySelector('#citation'), criterion=lab.querySelector('#criterion'), query=lab.querySelector('#query');
  function update(){
    const result=c.variants[[citation.value,criterion.value].join('|')], original=c.variants[c.base.join('|')];
    const modified=citation.value!==c.base[0] || criterion.value!==c.base[1];
    const active=labels.slice(1).flatMap((name,i)=>result[i+1].length?[name]:[]);
    const changes=labels.slice(1).flatMap((name,i)=>Boolean(original[i+1].length)===Boolean(result[i+1].length)?[]:[(result[i+1].length?'Added':'Removed')+' · '+name]);
    lab.querySelector('#outcome').innerHTML=`<h3>${modified?'Hypothetical evidence trail':'Original evidence trail'}</h3>
    ${result[0].map(([who,crit,id,quote,src])=>`<div class="trail"><b>${esc(who)}</b> → ${esc(crit)} → ${esc(src)} <small>(${esc(id)})</small><br>“${esc(quote)}”</div>`).join('')}
    <p><b>Matching patterns</b> · ${esc(active.join(' / ')||'None')}</p>${modified?`<p>${esc(changes.join(' / ')||'The matching patterns are unchanged.')}</p>`:''}`;
    lab.querySelector('#sparql').textContent=queries[query.value];
    lab.querySelector('#rows').textContent=result[query.value].map(row=>row.join(' | ')).join('\n')||'0 matching rows';
    lab.querySelector('#restore').disabled=!modified;
  }
  for(const control of [citation,criterion,query]) control.onchange=update;
  lab.querySelector('#restore').onclick=()=>{[citation.value,criterion.value]=c.base;update();};
  update();
}
nav.onclick=e=>{if(e.target.dataset.case)location.hash=e.target.dataset.case;};
window.addEventListener('hashchange',openCase);
openCase();
