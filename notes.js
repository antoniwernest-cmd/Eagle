/* Local, per-student teacher notes and downloadable assessment records. */
(() => {
  const root=document.getElementById('app');
  const grade=document.body.dataset.grade;
  if(!root||!grade)return;
  const gradeLabel=grade==='inspire'?'Grade 3 · Inspire':'Grade 2 · Excite';
  const storageKey=`maze-waze-teacher-notes-${grade}-v1`;
  const studentKey=`maze-waze-student-name-${grade}-v1`;
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const noteChoices={
    sort:['Identified the shape and stripe features on the Venn cards.','Used both rules to choose a Venn region.','Practise checking both rules before placing each card.'],
    tree:['Identified the three features on each maze sign.','Followed shape, then colour, then symbol.','Practise tracing every branch before choosing a final pad.'],
    'route-sort':['Identified the path shown on each vote card.','Sorted a card, then made one tally mark for that vote.','Practise matching tally totals to the sorted cards.'],
    table:['Recorded the number of votes for each maze path.','Counted cards in each pad before filling the row.','Practise checking each table entry against the sorted cards.'],
    picto:['Showed path votes with pictures in the matching rows.','Used the pictograph key to work out pictures needed.','Practise checking picture totals against vote counts.'],
    vertical:['Built vertical bars for the path-vote counts.','Used the scale to choose each bar height.','Practise checking heights against the vote totals.'],
    horizontal:['Built horizontal bars for the path-vote counts.','Used the scale to choose each bar length.','Practise checking lengths against the vote totals.'],
    reason:grade==='inspire'?
      ['Identified the most-chosen path and common run time.','Used equal sharing for the mean and repetition for the mode.','Practise explaining a decision with numbers from the graph.']:
      ['Identified the most- and least-chosen paths.','Compared their vote counts to make a recommendation.','Practise explaining the recommendation with graph evidence.'],
    'mean-four':['Counted cans for all four children.','Used the squares and equal sharing to find the mean.','Practise explaining what the equal share means.'],
    'mean-five':['Counted cans for all five children.','Used the squares and equal sharing to find the mean.','Practise explaining what the equal share means.'],
    'name-one':['Identified the hundreds, tens, and ones shown.','Combined each block value to name the number.','Practise recounting each place before choosing.'],
    'name-two':['Identified the hundreds, tens, and ones shown.','Combined each block value to name the number.','Practise recounting each place before choosing.'],
    'name-three':['Identified the hundreds, tens, and ones shown.','Combined each block value to name the number.','Practise recounting each place before choosing.'],
    combine:['Recognized the block values in both starting sets.','Moved blocks between Set A and Set B to help count the combined amount.','Practise counting all the block values across both sets before naming the total.'],
    'line-one':['Identified the start and amount to add.','Used jumps and added blocks to track the change.','Practise checking that all jumps add to the target amount.'],
    'line-two':['Identified the start and amount to add.','Used jumps and added blocks to track the change.','Practise checking that all jumps add to the target amount.'],
    stem:['Matched ones digits to their tens stems.','Ordered the leaves within each stem.','Practise using the key to read values from the plot.'],
    multiple:['Compared the two classes at each maze path.','Used two votes per block for both sets of bars.','Practise checking each class bar against the source table.']
  };
  const supportChoices=['A few prompts','Some assistance'];
  const noteKinds=['Observation','Strategy','Next step','Support','Support'];
  const allChoices=id=>[...(noteChoices[id]||[]),...supportChoices];
  let allNotes={};
  try{allNotes=JSON.parse(localStorage.getItem(storageKey)||'{}')||{};}catch{allNotes={};}
  const bar=document.createElement('section');
  bar.className='teacher-record-bar';
  bar.innerHTML=`<label>Student name <input type="text" autocomplete="off" data-student-name placeholder="Enter name before saving notes" aria-label="Student name for assessment notes"></label><div class="teacher-export-actions"><button type="button" data-export-pdf>Download assessment PDF</button><button type="button" data-export-xlsx>Download assessment Excel</button></div><p class="teacher-record-status" data-record-status role="status">Notes stay in this browser until you download them.</p>`;
  root.querySelector('.activity-head').after(bar);
  const studentInput=bar.querySelector('[data-student-name]');
  try{studentInput.value=localStorage.getItem(studentKey)||'';}catch{}
  const studentName=()=>studentInput.value.trim();
  function studentBucket(){const name=studentName();return name?(allNotes[name]??={}):null;}
  const status=message=>{bar.querySelector('[data-record-status]').textContent=message;};
  function save(){try{localStorage.setItem(storageKey,JSON.stringify(allNotes));return true;}catch{status('Browser storage is unavailable. Download your assessment record now.');return false;}}
  for(const section of root.querySelectorAll('.activity')){
    const id=section.id,title=section.querySelector('h2')?.textContent||id;
    const button=document.createElement('button');
    button.type='button';button.className='cat-note-button';button.dataset.catButton=id;
    button.setAttribute('aria-label',`Teacher notes for ${title}`);
    button.setAttribute('aria-expanded','false');
    button.innerHTML='<img src="teacher-cat.png" alt="" aria-hidden="true"><span>Notes</span>';
    section.querySelector('.activity-top').append(button);
    const panel=document.createElement('div');panel.className='cat-note-panel';panel.dataset.catPanel=id;panel.hidden=true;
    panel.innerHTML=`<h3>Teacher notes · ${escapeHtml(title)}</h3><p>Tick any observation, strategy, or next step that applies. Ticks save immediately for the named student and appear beside this question in PDF and Excel. You can also add as many personal notes as needed.</p><fieldset class="note-checklist"><legend>Question-specific checklist</legend>${(noteChoices[id]||[]).map((choice,index)=>`<label><input type="checkbox" data-note-check="${id}" value="${index}"><span><strong>${noteKinds[index]}:</strong> ${escapeHtml(choice)}</span></label>`).join('')}</fieldset><form data-note-form="${id}"><label for="note-${id}">Your own observation, strategy, or next step (optional)</label><textarea id="note-${id}" rows="3" maxlength="2000" placeholder="Write your own observation, strategy, or next step"></textarea><div class="cat-note-actions"><button type="submit">Add personal note</button><button type="submit" data-note-save-close>Save &amp; close</button></div></form><ol class="cat-note-list" data-note-list="${id}"></ol>`;
    const noteRow=document.createElement('div');noteRow.className='note-comment-row';
    const form=panel.querySelector('[data-note-form]');form.before(noteRow);
    noteRow.innerHTML=`<fieldset class="note-help-checklist"><legend>Support observed</legend><p>Tick any that apply. The grey slider records the overall level separately.</p>${supportChoices.map((choice,index)=>`<label><input type="checkbox" data-note-check="${id}" value="${index+3}"><span>${escapeHtml(choice)}</span></label>`).join('')}</fieldset>`;
    noteRow.append(form);
    section.querySelector('.expectation,.preview-label').after(panel);
  }
  function renderNotes(){
    const bucket=studentBucket();
    root.querySelectorAll('[data-note-check]').forEach(box=>{box.checked=(bucket?._checks?.[box.dataset.noteCheck]||[]).includes(Number(box.value));});
    root.querySelectorAll('[data-note-list]').forEach(list=>{
      const items=bucket?.[list.dataset.noteList]||[];
      list.innerHTML=items.map(item=>`<li><time>${escapeHtml(new Date(item.at).toLocaleString())}</time><p>${escapeHtml(item.text).replace(/\n/g,'<br>')}</p></li>`).join('')||'<li class="empty">No personal notes for this question yet.</li>';
    });
  }
  studentInput.addEventListener('input',()=>{try{localStorage.setItem(studentKey,studentName());}catch{}renderNotes();status(studentName()?`Assessment record for ${studentName()}.`:'Enter a student name before saving notes.');});
  root.addEventListener('change',event=>{
    const box=event.target.closest?.('[data-note-check]');if(!box)return;
    if(!studentName()){box.checked=false;studentInput.focus();status('Enter the student name before ticking observations.');return;}
    const id=box.dataset.noteCheck;
    const bucket=studentBucket();bucket._checks??={};
    bucket._checks[id]=[...root.querySelectorAll(`[data-note-check="${id}"]:checked`)].map(item=>Number(item.value));
    if(save())status(`Checklist saved for ${studentName()} · ${root.querySelector(`#${id} h2`).textContent}.`);
  });
  root.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-cat-button]');if(!button)return;
    const panel=root.querySelector(`[data-cat-panel="${button.dataset.catButton}"]`);
    if(!panel.hidden&&panel.querySelector('textarea').value.trim()){
      status('Press Save & close to keep this note before closing.');
      panel.querySelector('textarea').focus();
      return;
    }
    panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));
    if(!panel.hidden)panel.querySelector('textarea').focus();
  });
  root.addEventListener('submit',event=>{
    const form=event.target.closest?.('[data-note-form]');if(!form)return;
    event.preventDefault();
    const closeAfterSave=event.submitter?.hasAttribute('data-note-save-close');
    const text=form.querySelector('textarea').value.trim();
    if(text&&!studentName()){studentInput.focus();status('Enter the student name before saving a note.');return;}
    if(text){
      (studentBucket()[form.dataset.noteForm]??=[]).push({at:new Date().toISOString(),text});
      if(!save())return;
      form.reset();renderNotes();
    }
    if(closeAfterSave){
      const panel=form.closest('[data-cat-panel]');panel.hidden=true;
      root.querySelector(`[data-cat-button="${form.dataset.noteForm}"]`).setAttribute('aria-expanded','false');
      status(text?'Note saved and closed. Download the assessment record to keep a separate copy.':'Teacher notes closed. Saved notes remain in this browser.');
    }else if(text)status('Note saved in this browser. Add another note or press Save & close.');
  });
  function selectedChecklist(id,bucket=studentBucket()||{}){const choices=allChoices(id);return (bucket._checks?.[id]||[]).map(index=>choices[index]?`${noteKinds[index]}: ${choices[index]}`:null).filter(Boolean);}
  function assessmentRows(){
    const bucket=studentBucket()||{};
    return [...root.querySelectorAll('.activity')].flatMap((section,index)=>{
      const id=section.id,title=section.querySelector('h2')?.textContent||id;
      const slider=section.querySelector('[data-assist]');
      const level=slider?.getAttribute('aria-valuetext')||'100% independent work';
      const locked=section.querySelector('[data-assist-lock]')?.getAttribute('aria-pressed')==='true';
      const feedback=section.querySelector('[data-feedback]');
      const checked=feedback?.classList.contains('good')?'Correct':feedback?.classList.contains('try')?'Tried; not yet correct':'Not checked';
      const notes=bucket[id]||[];
      return (notes.length?notes:[{at:'',text:''}]).map((note,noteIndex)=>({number:index+1,question:title,checklist:selectedChecklist(id,bucket).join('\n'),preview:section.classList.contains('preview'),assistance:level,locked:locked?'Yes':'No',checked,when:note.at?new Date(note.at).toLocaleString():'',note:note.text,noteIndex:noteIndex+1}));
    });
  }
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  function safeName(){return studentName().replace(/[^\p{L}\p{N}._ -]/gu,'').trim().replace(/\s+/g,'_').slice(0,45)||'Student';}
  const xmlEscape=value=>String(value??'').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function column(n){let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
  async function exportExcel(){
    if(!window.JSZip)throw new Error('Excel export library did not load.');
    const rows=[['Game Day assessment record'],['Student',studentName()],['Grade',gradeLabel],['Exported',new Date().toLocaleString()],[],['Question #','Question','Ticked observation / strategy / next step','Personal note','Note date','Assistance level','Slider locked','Check status','Optional preview']];
    for(const r of assessmentRows())rows.push([r.number,r.question,r.checklist,r.note,r.when,r.assistance,r.locked,r.checked,r.preview?'Yes':'No']);
    const sheetRows=rows.map((row,i)=>{
      const noteLines=i>5?Math.max(...[row[2],row[3]].map(value=>String(value||'').split('\n').reduce((total,line)=>total+Math.max(1,Math.ceil(line.length/65)),0))):1;
      const rowHeight=i>5?Math.min(390,Math.max(27,14+13*Math.max(noteLines,Math.ceil(String(row[1]||'').length/32)))):undefined;
      return `<row r="${i+1}"${rowHeight?` ht="${rowHeight}" customHeight="1"`:''}>${row.map((cell,j)=>`<c r="${column(j)}${i+1}" t="inlineStr" s="${i===0?1:i===5?2:i>5&&[1,2,3].includes(j)?3:0}"><is><t xml:space="preserve">${xmlEscape(cell)}</t></is></c>`).join('')}</row>`;
    }).join('');
    const zip=new JSZip();
    zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
    zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zip.file('xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Assessment record" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    zip.file('xl/styles.xml','<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/></font><font><b/><sz val="16"/><color rgb="FF183247"/></font><font><b/><color rgb="FFFFFFFF"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF176B63"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
    zip.file('xl/worksheets/sheet1.xml',`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="6" topLeftCell="A7" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="12" customWidth="1"/><col min="2" max="2" width="35" customWidth="1"/><col min="3" max="4" width="70" customWidth="1"/><col min="5" max="5" width="24" customWidth="1"/><col min="6" max="9" width="22" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData><autoFilter ref="A6:I${rows.length}"/></worksheet>`);
    download(await zip.generateAsync({type:'blob',compression:'DEFLATE'}),`Game_Day_${gradeLabel.split(' ')[1]}_${safeName()}_Assessment.xlsx`);
  }
  function wrapText(ctx,text,maxWidth){
    const lines=[];
    for(const paragraph of String(text).split('\n')){
      let line='';for(const originalWord of paragraph.split(/\s+/)){
        let word=originalWord;
        while(word&&ctx.measureText(word).width>maxWidth){
          if(line){lines.push(line);line='';}
          let cut=1;while(cut<word.length&&ctx.measureText(word.slice(0,cut+1)).width<=maxWidth)cut++;
          lines.push(word.slice(0,cut));word=word.slice(cut);
        }
        const attempt=line&&word?`${line} ${word}`:line||word;
        if(line&&word&&ctx.measureText(attempt).width>maxWidth){lines.push(line);line=word;}else line=attempt;
      }lines.push(line);
    }return lines;
  }
  async function exportPdf(){
    if(!window.PDFLib)throw new Error('PDF export library did not load.');
    const doc=await PDFLib.PDFDocument.create();
    const width=1275,height=1650,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');let y=0,pageNo=0;
    const flush=async()=>{if(!pageNo)return;const png=await doc.embedPng(canvas.toDataURL('image/png'));const page=doc.addPage([612,792]);page.drawImage(png,{x:0,y:0,width:612,height:792});};
    const start=async()=>{if(pageNo)await flush();pageNo++;ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle='#173b4d';ctx.font='bold 40px Arial';ctx.fillText('Game Day · Assessment record',65,80);ctx.font='26px Arial';ctx.fillText(`${gradeLabel}   |   Student: ${studentName()}`,65,123);ctx.font='19px Arial';ctx.fillStyle='#526875';ctx.fillText(`Exported ${new Date().toLocaleString()} · Page ${pageNo}`,65,156);ctx.fillStyle='#176b63';ctx.fillRect(65,176,1145,4);y=220;};
    await start();
    const groups=[...root.querySelectorAll('.activity')];const bucket=studentBucket()||{};
    for(let i=0;i<groups.length;i++){
      const section=groups[i],id=section.id,title=section.querySelector('h2')?.textContent||id;
      const level=section.querySelector('[data-assist]')?.getAttribute('aria-valuetext')||'100% independent work';
      const locked=section.querySelector('[data-assist-lock]')?.getAttribute('aria-pressed')==='true'?'locked':'unlocked';
      const feedback=section.querySelector('[data-feedback]');const checked=feedback?.classList.contains('good')?'Correct':feedback?.classList.contains('try')?'Tried; not yet correct':'Not checked';
      const notes=bucket[id]||[];
      const checks=selectedChecklist(id,bucket);
      const noteRows=[];
      if(checks.length){noteRows.push({text:'Ticked checklist',kind:'date'});ctx.font='21px Arial';for(const choice of checks)for(const line of wrapText(ctx,choice,505))noteRows.push({text:line,kind:'note'});noteRows.push({text:'',kind:'space'});}
      if(!notes.length)noteRows.push({text:checks.length?'No personal note recorded':'No teacher notes recorded',kind:'muted'});
      for(const [noteIndex,item] of notes.entries()){
        noteRows.push({text:`Note ${noteIndex+1} - ${new Date(item.at).toLocaleString()}`,kind:'date'});
        ctx.font='21px Arial';
        for(const line of wrapText(ctx,item.text,505))noteRows.push({text:line,kind:'note'});
        noteRows.push({text:'',kind:'space'});
      }
      let cursor=0,part=0;
      while(cursor<noteRows.length){
        ctx.font='bold 25px Arial';
        const heading=`${i+1}. ${title}${part?' (continued)':section.classList.contains('preview')?' (optional preview)':''}`;
        const titleLines=wrapText(ctx,heading,510);
        const leftHeight=115+titleLines.length*34;
        if(height-90-y<Math.max(220,leftHeight))await start();
        const available=height-90-y;
        const maxRows=Math.max(1,Math.floor((available-80)/28));
        const chunk=noteRows.slice(cursor,cursor+maxRows);
        const cardHeight=Math.max(leftHeight,80+chunk.length*28);
        ctx.fillStyle='#f4f8f5';ctx.fillRect(65,y,1145,cardHeight);
        ctx.strokeStyle='#b9d0c5';ctx.lineWidth=2;ctx.strokeRect(65,y,1145,cardHeight);
        ctx.beginPath();ctx.moveTo(635,y);ctx.lineTo(635,y+cardHeight);ctx.stroke();
        ctx.fillStyle='#173b4d';ctx.font='bold 25px Arial';
        titleLines.forEach((line,lineIndex)=>ctx.fillText(line,82,y+38+lineIndex*34));
        const detailY=y+52+titleLines.length*34;
        ctx.font='20px Arial';ctx.fillText(`Assistance: ${level}`,82,detailY);
        ctx.fillText(`Slider ${locked} - ${checked}`,82,detailY+30);
        ctx.font='bold 21px Arial';ctx.fillStyle='#176b63';ctx.fillText(`Teacher notes · ${checks.length} tick${checks.length===1?'':'s'}, ${notes.length} personal`,658,y+36);
        chunk.forEach((row,rowIndex)=>{
          ctx.font=row.kind==='date'?'bold 18px Arial':'21px Arial';
          ctx.fillStyle=row.kind==='muted'?'#657775':row.kind==='date'?'#41665e':'#173b4d';
          if(row.text)ctx.fillText(row.text,658,y+69+rowIndex*28);
        });
        y+=cardHeight+20;cursor+=chunk.length;part++;
      }
    }
    await flush();
    download(new Blob([await doc.save()],{type:'application/pdf'}),`Game_Day_${gradeLabel.split(' ')[1]}_${safeName()}_Assessment.pdf`);
  }
  async function runExport(kind){
    if(!studentName()){studentInput.focus();status('Enter the student name before downloading an assessment record.');return;}
    try{status(`Preparing ${kind.toUpperCase()} assessment record…`);await(kind==='pdf'?exportPdf():exportExcel());status(`${kind.toUpperCase()} assessment record downloaded. Saved notes remain in this browser.`);}
    catch(error){status(`Could not create the ${kind.toUpperCase()} record: ${error.message}`);}
  }
  bar.querySelector('[data-export-pdf]').addEventListener('click',()=>runExport('pdf'));
  bar.querySelector('[data-export-xlsx]').addEventListener('click',()=>runExport('xlsx'));
  renderNotes();
})();
