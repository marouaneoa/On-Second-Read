function mountTools(c){
  for(const [link,target] of [['graph-link','ontology-tool'],['model-link','model-tool']]){
    document.getElementById(link).onclick=e=>{e.preventDefault();document.getElementById(target).scrollIntoView();};
  }
  mountGraph(c);
  mountWorkbench(c);
}
function mountGraph(c){
  const root=document.querySelector('#ontology-tool');
  root.innerHTML='<h2>Ontology explorer</h2><p>Choose a node to explore its incoming and outgoing relationships. Switch to case evidence to follow the original dossier.</p><div class="controls"><label>Graph<select class="view"><option>Vocabulary</option><option>Case evidence</option></select></label><label>Focus node<select class="node"></select></label></div><div class="diagram"></div><p class="description" aria-live="polite"></p>';
  const view=root.querySelector('.view'), node=root.querySelector('.node');
  function draw(){
    const {nodes,edges}=c.views[view.value], focus=node.value;
    const related=edges.filter(([a,,b])=>a===focus || b===focus);
    const diagram=root.querySelector('.diagram');
    diagram.replaceChildren();
    for(const [a,p,b] of related){
      const line=document.createElement('div');line.className='edge';
      for(const [i,id] of [a,b].entries()){
        if(i){const edge=document.createElement('span');edge.textContent='── '+p+' →';line.append(edge);}
        const button=document.createElement('button');button.textContent=nodes[id][0];button.disabled=id===focus;
        button.onclick=()=>{node.value=id;draw();node.focus();};line.append(button);
      }
      diagram.append(line);
    }
    root.querySelector('.description').textContent=nodes[focus].join(' · ');
  }
  function populate(){
    const nodes=c.views[view.value].nodes;
    node.replaceChildren(...Object.entries(nodes).map(([id,[label]])=>new Option(label,id)));
    node.value=view.value==='Vocabulary'?'Judgment':'jA';draw();
  }
  view.onchange=populate;node.onchange=draw;populate();
}
function mountWorkbench(c){
  const {schema,ontology}=JSON.parse(document.querySelector('#data').textContent);
  const root=document.querySelector('#model-tool');
  root.innerHTML='<h2>LLM workbench</h2><p>Ask a model which passage each reviewer used. Inspect its proposed links against the source before accepting its interpretation.</p><div class="controls"><label>Provider<select class="provider"><option>OpenRouter</option><option>Gemini</option><option>OpenAI</option></select></label><label>Model<input class="model"></label><label>Personal API key<input type="password" autocomplete="off" class="secret"></label></div><p class="sendto"></p><button class="primary run">Extract judgments</button><span role="status" class="status"></span><details><summary>Use another chat or local model</summary><p>Copy the prompt into your model and paste its JSON reply below.</p><textarea readonly class="prompt" aria-label="Extraction prompt"></textarea></details><label>Model response<textarea class="reply" placeholder=\'{"judgments": [...]}\'></textarea></label><button class="check">Inspect proposed evidence</button><div class="inspected" aria-live="polite"></div>';
  const q=s=>root.querySelector(s), provider=q('.provider'), model=q('.model'), secret=q('.secret'), reply=q('.reply'), status=q('.status');
  const sources=Object.fromEntries(Object.entries(c.passages).filter(([,p])=>p.original).map(([id,p])=>[id,p.text]));
  const reviews={'Reviewer A':c.reviews[0],'Reviewer B':c.reviews[1]};
  const system='Extract judgments using the OWL vocabulary. Copy wording exactly from the named review. Cite a supplied passage ID. Use the published criterion label when applicable. Omit unsupported links. Respond with JSON conforming to '+JSON.stringify(schema)+'\n'+ontology;
  const dossier=JSON.stringify({title:c.title,context:c.guide.context,rubric:[c.rubric],passages:sources,reviews},null,2);
  q('.prompt').value=system+'\n'+dossier;
  const defaults={OpenRouter:'openai/gpt-4o-mini',Gemini:'gemini-flash-latest',OpenAI:'gpt-4o-mini'};
  function select(){secret.value='';model.value=defaults[provider.value];q('.sendto').textContent='Extraction sends this dossier and your key directly to '+provider.value+'. Your provider account covers usage. The page does not save the key.';}
  provider.onchange=select;select();
  function inspect(){
    const output=q('.inspected');output.replaceChildren();
    try{
      const rows=JSON.parse(reply.value).judgments;
      if(!Array.isArray(rows))throw Error('Expected a judgments array.');
      if(!rows.length){output.textContent='The model proposed no judgments.';return;}
      for(const [i,r] of rows.entries()){
        if(!r || !['reviewer','wording','criterion','passage'].every(k=>typeof r[k]==='string'&&r[k].trim()))throw Error('Incomplete judgment '+(i+1));
        const ok=Object.hasOwn(reviews,r.reviewer)&&reviews[r.reviewer].includes(r.wording);
        const passage=Object.hasOwn(sources,r.passage)?sources[r.passage]:null;
        const div=document.createElement('div');div.className='note';
        for(const text of [r.reviewer+' · '+r.criterion, 'Proposed wording: '+r.wording,ok?'Exact excerpt found.':'Wording or reviewer does not match the dossier.',r.passage+' · '+(passage||'Unknown passage ID.')]){
          const p=document.createElement('p');p.textContent=text;div.append(p);
        }output.append(div);
      }
    }catch{output.textContent='Enter JSON with a judgments array. Each row needs reviewer, wording, criterion and passage strings.';}
  }
  q('.check').onclick=inspect;
  q('.run').onclick=async()=>{
    const name=provider.value,key=secret.value.trim(),id=model.value.trim();
    if(!key||!id){status.textContent=' Enter a model and a key for '+name+'.';return;}
    const btn=q('.run');btn.disabled=true;provider.disabled=true;status.textContent=' Extracting…';secret.value='';
    let url,body,headers={'Content-Type':'application/json'};
    if(name==='Gemini'){
      url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(id)+':generateContent';headers['x-goog-api-key']=key;
      body={systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:dossier}]}],generationConfig:{responseMimeType:'application/json',responseJsonSchema:schema}};
    }else{
      url=name==='OpenRouter'?'https://openrouter.ai/api/v1/chat/completions':'https://api.openai.com/v1/chat/completions';
      headers.Authorization='Bearer '+key;body={model:id,messages:[{role:'system',content:system},{role:'user',content:dossier}],response_format:{type:'json_schema',json_schema:{name:'judgments',strict:true,schema}}};
      if(name==='OpenRouter')body.provider={require_parameters:true};
    }
    const panel=btn.closest('section'), currentReply=reply;
    try{
      const res=await fetch(url,{method:'POST',headers,body:JSON.stringify(body),redirect:'error',credentials:'omit',signal:AbortSignal.timeout(120000)});
      if(!res.ok)throw Error('HTTP '+res.status+'. Check key, model access and quota.');
      const data=await res.json();
      const text=name==='Gemini'?data.candidates?.[0]?.content?.parts?.filter(p=>!p.thought).map(p=>p.text).join(''):data.choices?.[0]?.message?.content;
      if(!text)throw Error('Provider returned no judgment text.');
      if(panel.contains(currentReply)){currentReply.value=text;inspect();status.textContent=' Response received.';}
    }catch(e){status.textContent=' '+e.message+' You can also use the prompt and paste a response.';}
    finally{btn.disabled=false;provider.disabled=false;}
  };
}
