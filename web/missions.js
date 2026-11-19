function documentMission(root){
  const c=cases.find(item=>item.id==='missing-credit');
  const documents=[
    {name:'Delivery receipt',quote:'11:47. All eighteen boxes received at the depot. Count checked against the route sheet. Signed by the receiving clerk.',id:'receiptExcerpt',why:'The clerk witnessed the boxes arriving. The receipt helps you judge delivery, but it gives no account of who directed the volunteers.'},
    {name:'Volunteer shift diary',quote:c.passages.p2.text,id:'p2',why:'Sam assigned Jo and Eli different tasks, then redirected Eli when work was duplicated. You can cite a specific act of leadership.'},
    {name:'Coordinator’s sign-off',quote:'I approved Sam Reed as the person accountable for Saturday’s run. Sam could change volunteer assignments if a route failed. Signed on Friday, before the shift.',id:'signoffExcerpt',why:'The sign-off establishes what Sam was authorised to do. Whether Sam actually exercised that authority on Saturday remains open.'}
  ];
  const question='What evidence is there that Sam directed the volunteers during Saturday’s shift?';
  root.innerHTML=`<section class="intro"><p class="kicker">Document investigation · The missing credit</p><h1>What would change your mind?</h1><p>${question}</p></section>
  <section class="panel"><h2>The file so far</h2><p>${esc(c.guide.rule)}</p><blockquote class="note">${esc(c.passages.p1.text)}</blockquote>
  <label>Your initial assessment<select class="position"><option value="">Choose an assessment</option><option>Sam’s leadership is established.</option><option>I need more evidence of what Sam did.</option><option>I think someone else led the shift.</option></select></label>
  <h3>You can request one document</h3><p>Choose the source most likely to answer your question. Opening it commits your choice for this round.</p>
  <div class="controls options"></div></section><div class="reveal"></div><p><a href="#missing-credit">Read the full case</a> · <a href="#home">Casebook home</a></p>`;
  const position=root.querySelector('.position'), options=root.querySelector('.options'), reveal=root.querySelector('.reveal');
  documents.forEach((d,index)=>{
    const b=document.createElement('button');b.textContent=d.name;b.disabled=true;options.append(b);
    b.onclick=()=>{
      position.disabled=true;for(const button of options.children)button.disabled=true;
      reveal.innerHTML=`<section class="panel"><h2>${esc(d.name)}</h2><blockquote class="note">${esc(d.quote)}</blockquote>
      <h3>Your evidence trail</h3><div class="edge"><b>Your leadership judgment</b><span>cites →</span><mark>${esc(d.id)}</mark><span>partOf →</span><b>${esc(d.name)}</b></div>
      <p>You began with “${esc(position.value)}”</p><label>How did the document affect your assessment?<select class="reflection"><option value="">Choose a response</option><option>It changed my view.</option><option>It strengthened my view.</option><option>My question remains open.</option></select></label>
      <div class="interpretation" aria-live="polite"></div></section><section class="panel model-choice" hidden></section><button class="again">Start another round</button>`;
      const reflection=reveal.querySelector('.reflection');
      reflection.onchange=()=>{
        reveal.querySelector('.interpretation').textContent=reflection.value?d.why:'';
        const panel=reveal.querySelector('.model-choice');panel.hidden=!reflection.value;
        if(reflection.value&&!panel.children.length)documentComparison(panel,c,documents,index,question);
      };
      reveal.querySelector('.again').onclick=()=>documentMission(root);
      reveal.scrollIntoView();
    };
  });
  position.onchange=()=>{for(const button of options.children)button.disabled=!position.value;};
}
function documentComparison(panel,c,documents,index,question){
  panel.innerHTML='<h2>Which record would a model request?</h2><p>The model sees the cover sheet, rubric, question and document titles. Your choice and the sealed documents stay out of its prompt.</p><div class="controls"><label>Provider<select><option>OpenRouter</option><option>Gemini</option><option>OpenAI</option></select></label><label>Model<input class="model"></label><label>Personal API key<input class="secret" type="password" autocomplete="off"></label></div><p>The request goes directly to your selected provider using your account.</p><button>Ask the model</button><p role="status"></p>';
  const provider=panel.querySelector('select'),model=panel.querySelector('.model'),secret=panel.querySelector('.secret'),run=panel.querySelector('button'),status=panel.querySelector('[role=status]');
  const names=documents.map(d=>d.name);
  provider.onchange=()=>{model.value=({Gemini:'gemini-3.8-flash',OpenRouter:'openai/gpt-4o-mini',OpenAI:'gpt-4o-mini'})[provider.value];secret.value='';};
  provider.onchange();
  run.onclick=async()=>{
    const key=secret.value.trim(),id=model.value.trim(),name=provider.value;
    if(!key||!id){status.textContent='Enter a key and model to request a comparison.';return;}
    const schema={type:'object',properties:{document:{type:'string',enum:names},reason:{type:'string'}},required:['document','reason'],additionalProperties:false};
    run.disabled=true;provider.disabled=true;secret.value='';status.textContent='Waiting for '+name+' (120s limit)…';
    try{
      const answer=JSON.parse(await requestModel(name,key,id,'Choose one document title and explain what you hope to learn from it. Return JSON matching the schema.',JSON.stringify({question,rubric:c.guide.rule,cover:c.passages.p1.text,available:names}),schema));
      if(!names.includes(answer.document)||typeof answer.reason!=='string')throw Error('Unexpected model response.');
      status.textContent='You requested '+names[index]+'. '+name+' / '+id+' requested '+answer.document+'. Its reason: '+answer.reason;
    }catch(e){status.textContent=e.message;}finally{run.disabled=false;provider.disabled=false;}
  };
}
function repairMission(root){
  const {repair}=JSON.parse(document.querySelector('#data').textContent);
  const c=cases.find(item=>item.id==='moving-goalpost');
  const notes=['This removes what B actually asked for. The graph loses the judgment you are investigating.','The rubric lists delivery alone. Removing this link preserves B’s judgment while letting the query find the unlisted criterion.','This removes the published delivery rule. A now appears to have introduced a requirement, and the unsupported management rule remains.'];
  root.innerHTML=`<section class="intro"><p class="kicker">Ontology repair · The moving goalpost</p><h1>Repair the rubric</h1><p>An importer recorded every criterion mentioned by a reviewer as a published hiring requirement. Can you correct one relationship while preserving what each reviewer said?</p></section>
  <section class="grid"><div class="panel"><h2>Published rule</h2><p>${esc(c.guide.rule)}</p></div><div class="panel"><h2>Reviewer B’s note</h2><p>${esc(c.reviews[1])}</p></div></section>
  <section class="panel"><h2>Remove one statement</h2><p><code>:criterion</code> means delivery and <code>:extra</code> means prior management experience. <code>:jB</code> identifies B’s judgment.</p><p>Before editing, the outside-rubric query returns <b>${repair.before.length} rows</b>.</p><form><fieldset><legend>Which triple misrepresents the source?</legend>${repair.edits.map((edit,i)=>`<label class="choice"><input required type="radio" name="edit" value="${i}"><code>${esc(':'+edit.triple[0]+' os:'+edit.triple[1]+' :'+edit.triple[2]+' .')}</code></label>`).join('')}</fieldset><button class="primary">Apply edit and inspect query result</button></form><div class="result" aria-live="polite"></div>
  <details><summary>Read the SPARQL query</summary><pre>${esc(queries[2])}</pre></details><small>Each choice starts from the same faulty graph. The offline edition includes RDFLib’s query result for each edit.</small></section><a href="#moving-goalpost">Read the full case</a> · <a href="#home">Casebook home</a>`;
  const form=root.querySelector('form'),result=root.querySelector('.result');
  form.onchange=()=>result.replaceChildren();
  form.onsubmit=e=>{
    e.preventDefault();const i=Number(new FormData(form).get('edit')),rows=repair.edits[i].rows;
    result.innerHTML=`<div class="feedback"><strong>${i===1?'Graph repaired':'Inspect the consequence'}</strong><p>${esc(notes[i])}</p><b>Query output · ${rows.length} row(s)</b><pre>${esc(rows.length?'judgment | criterion\n'+rows.map(row=>row.join(' | ')).join('\n'):'No matching judgments.')}</pre></div>`;
  };
}
