// The worked answer was written by Codex during casebook development.
function startPractice(){
  const phrases=['found the returns desk','without asking for help'];
  const steps=[
    ['Review → containsJudgment → Judgment','The reviewer concludes that this visitor could use the signs independently.'],
    ['Judgment → appliesCriterion → Criterion','The standard is clarity: could a visitor follow the directions unaided?'],
    ['Judgment → cites → Passage','The quoted library observation contains both the outcome and the detail about help.']
  ];
  const $=id=>document.getElementById(id);
  const historyKey='on-second-read.practice.v1';
  let pick, step, comparison, generation=0, records=[];
  try{const parsed=JSON.parse(localStorage.getItem(historyKey));if(Array.isArray(parsed))records=parsed;}catch{}
  function history(){
    const area=$('practice-history').querySelector('div');
    area.replaceChildren();
    for(const r of records){
      const item=document.createElement('p');
      item.textContent='You: “'+r.reader+'” · '+r.source+': “'+r.phrase+'” — '+r.reason+' Your reflection: '+r.reflection;
      area.append(item);
    }
    if(!area.children.length)area.textContent='Your saved comparisons will appear here.';
  }
  function clearPair(){
    generation++;comparison=null;$('practice-pair').replaceChildren();$('practice-note').hidden=true;
    $('practice-note').reset();$('practice-status').textContent='';$('practice-compare').disabled=false;
  }
  function graph(){
    const area=$('practice-result');
    area.innerHTML='<p>'+ (pick===1?'Yes. Those words tell us the visitor needed no help.':'Those words show that the visitor reached the destination. Someone might still have helped them.')+' Read both phrases together: one establishes arrival, the other establishes independence.</p><ol></ol>';
    const list=area.querySelector('ol');
    for(const [link,meaning] of steps.slice(0,step)){
      const li=document.createElement('li'),strong=document.createElement('strong');strong.textContent=link;li.append(strong,document.createElement('br'),meaning);list.append(li);
    }
    if(step<steps.length){
      const next=document.createElement('button');next.textContent=step?'Reveal next link':'Trace this judgment in the ontology';
      next.onclick=()=>{step++;graph();};area.append(next);
    }else{
      const compare=document.createElement('button');compare.textContent='Compare with a model';compare.onclick=()=>$('practice-source').focus();area.append(compare);
    }
  }
  $('practice-choices').onclick=e=>{
    if(!e.target.hasAttribute('data-pick'))return;
    pick=Number(e.target.dataset.pick);step=0;clearPair();graph();
    for(const b of $('practice-choices').querySelectorAll('button'))b.setAttribute('aria-pressed',String(Number(b.dataset.pick)===pick));
    $('practice-lab').hidden=false;
  };
  $('practice-source').onchange=()=>{
    clearPair();const source=$('practice-source').value;
    $('practice-live').hidden=source==='example';$('practice-key').value='';
    $('practice-model').value=({OpenAI:'gpt-4o-mini',OpenRouter:'openai/gpt-4o-mini',Gemini:'gemini-flash-latest'})[source]||'';
    $('practice-compare').textContent=source==='example'?'Reveal comparison':'Request model answer';
  };
  $('practice-compare').onclick=async()=>{
    clearPair();const revision=generation,source=$('practice-source').value,id=$('practice-model').value.trim();
    let phrase=phrases[1],reason='Reaching the desk establishes the outcome. The words about help establish that the visitor reached it independently.',name='Codex · worked example';
    if(source!=='example'){
      const key=$('practice-key').value.trim();if(!id||!key){$('practice-status').textContent='Enter a model and key first.';return;}
      $('practice-key').value='';$('practice-compare').disabled=true;$('practice-status').textContent='Waiting for '+source+'…';
      try{
        const schema={type:'object',properties:{phrase:{type:'string',enum:phrases},reason:{type:'string'}},required:['phrase','reason'],additionalProperties:false};
        const answer=JSON.parse(await requestModel(source,key,id,'Choose the exact phrase that most directly answers the question and explain why. Return JSON matching the schema.',JSON.stringify({excerpt:document.querySelector('.paper blockquote').textContent,question:$('practice-choices').querySelector('legend').textContent,options:phrases}),schema));
        if(revision!==generation)return;
        if(!phrases.includes(answer.phrase)||typeof answer.reason!=='string'||!answer.reason.trim())throw Error('Incomplete model answer.');
        phrase=answer.phrase;reason=answer.reason;name=source+' / '+id;
      }catch(e){if(revision===generation)$('practice-status').textContent=e.message;return;}
      finally{if(revision===generation)$('practice-compare').disabled=false;}
    }
    comparison={reader:phrases[pick],source:name,phrase,reason};
    $('practice-status').textContent=phrase===phrases[pick]?'You selected the same phrase.':'You selected different phrases.';
    for(const [title,body] of [['Your selection',phrases[pick]],[name,phrase+' — '+reason]]){
      const box=document.createElement('div'),label=document.createElement('strong');box.className='note';label.textContent=title;box.append(label,document.createElement('br'),body);$('practice-pair').append(box);
    }
    $('practice-note').hidden=false;
  };
  $('practice-note').onsubmit=e=>{
    e.preventDefault();const reflection=e.target.elements.reflection.value.trim();if(!comparison||!reflection)return;
    const updated=[{...comparison,reflection},...records];
    try{localStorage.setItem(historyKey,JSON.stringify(updated));records=updated;history();$('practice-note').hidden=true;$('practice-status').textContent='Comparison saved on this device.';}
    catch{$('practice-status').textContent='Browser storage is unavailable. Copy your reflection to keep it.';}
  };
  history();
}
startPractice();
