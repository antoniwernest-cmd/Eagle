(() => {
  const gradeKey = document.body.dataset.grade;
  const data = window.MAZE_WAZE_DATA?.[gradeKey];
  const root = document.getElementById("app");
  if (!data || !root) return;
  const isInspire = gradeKey === "inspire";
  const ids = isInspire ? ["sort", "tree", "route-sort", "table", "picto", "vertical", "horizontal", "reason", "mean-four", "mean-five", "name-one", "name-two", "name-three", "combine", "line-one", "line-two", "stem", "multiple"] : ["sort", "route-sort", "picto", "vertical", "horizontal", "reason", "name-one", "name-two", "name-three", "combine", "line-one", "line-two"];
  const names = {sort:"Venn sort",tree:"Maze-sign tree","route-sort":"Sort path cards",table:"Frequency table",picto:"Pictograph",vertical:"Vertical bars",horizontal:"Horizontal bars",reason:"Read the data","mean-four":"Mean: four children","mean-five":"Mean: five children","name-one":"Name that number 1","name-two":"Name that number 2","name-three":"Name that number 3",combine:"Combine two sets","line-one":"Addition line 1","line-two":"Addition line 2",stem:"Stem-and-leaf",multiple:"Multiple bars"};
  const state = {
    selected: null,
    vennPadSelected: null,
    venn: data.venn.map(() => null),
    treeSelected: null,
    treeAssignments: isInspire ? data.signTree.map(() => null) : [],
    routeSelected: null,
    routePadSelected: null,
    routeAssignments: data.routeCards.map(() => null),
    routeTallies: data.categories.map(() => 0),
    picto: data.counts.map(() => 0),
    vertical: data.counts.map(() => 0),
    horizontal: data.counts.map(() => 0),
    morning: data.categories.map(() => 0),
    afternoon: data.categories.map(() => 0),
    meanMarks: {'mean-four':Array(30).fill(false),'mean-five':Array(30).fill(false)},
    numberChoices: {},
    blockSelected: null,
    blockLocations: {},
    blockMoveHistory: [],
    lineJumps: {'line-one':[],'line-two':[]},
    solved: new Set()
  };
  const coreCount = isInspire ? 16 : 12;
  const assistanceLevels = {0:'100% independent work',1:'Some assistance',2:'A lot of assistance'};
  const assistanceKey = `maze-waze-teacher-assistance-${gradeKey}`;
  const assistanceLockKey = `maze-waze-teacher-assistance-locks-${gradeKey}-v2`;
  let savedAssistance = {};
  try { savedAssistance = JSON.parse(localStorage.getItem(assistanceKey) || '{}') || {}; } catch { savedAssistance = {}; }
  const assistance = Object.fromEntries(ids.map(id=>{
    const stored=savedAssistance[id];
    const value=savedAssistance._scale===2?(Number.isInteger(stored)&&stored>=0&&stored<=2?stored:0):({1:0,2:1,3:1,4:2})[stored]??0;
    return [id,value];
  }));
  let savedAssistanceLocks = {};
  try { savedAssistanceLocks = JSON.parse(localStorage.getItem(assistanceLockKey) || '{}') || {}; } catch { savedAssistanceLocks = {}; }
  const assistanceLocks = Object.fromEntries(ids.filter(id=>savedAssistanceLocks[id]===true).map(id=>[id,true]));
  const escapeHtml = s => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function section(id, number, title, description, expectation, body, preview=false) {
    const assist=`<div class="assistance-control" aria-label="Teacher assistance recording"><span class="assistance-mark" aria-hidden="true">T</span><input type="range" min="0" max="2" step="1" value="0" data-assist="${id}" aria-label="Teacher assistance for ${escapeHtml(title)}" aria-valuetext="100% independent work"><button type="button" class="assistance-clear" data-assist-clear="${id}" aria-label="Reset teacher assistance to independent for ${escapeHtml(title)}" title="Reset to 100% independent">×</button><button type="button" class="assistance-lock" data-assist-lock="${id}" aria-label="Lock teacher assistance for ${escapeHtml(title)}" aria-pressed="false" title="Lock slider (teacher code required)">🔓</button><form class="assistance-code" data-assist-code="${id}" hidden><label>Teacher code <input type="text" inputmode="numeric" autocomplete="off" maxlength="1" aria-label="Teacher code for ${escapeHtml(title)}" required></label><button type="submit">OK</button><span class="assistance-code-error" role="status"></span></form></div>`;
    return `<section class="activity${preview ? ' preview' : ''}" id="${id}" aria-labelledby="${id}-title"><div class="activity-top"><span class="activity-number">${String(number).padStart(2,'0')}</span><div><h2 id="${id}-title">${title}</h2><p>${description}</p></div>${assist}</div><p class="${preview ? 'preview-label' : 'expectation'}">${expectation}</p>${body}<div class="controls"><button type="button" class="action-button primary" data-check="${id}">Check my work</button><button type="button" class="action-button ghost" data-reset="${id}">Start again</button></div><p class="feedback" data-feedback="${id}" role="status" aria-live="polite">Build your answer, then check it.</p></section>`;
  }
  function story() {
    return `<section class="story-card"><div><h2>${data.title}</h2><p>${data.subtitle} Sort the individual vote cards by path. Then count the votes with <strong>your own tallies</strong> and use those counts to make graphs. No path totals are given in advance.</p></div><span class="source-tag">Fictional example</span></section><p class="source-line">Source: ${window.MAZE_WAZE_DATA.source}. These votes were invented for practice; no students were surveyed.</p>`;
  }
  function routeSortMarkup() {
    return `<div class="workspace"><h3>Sort each student's path vote</h3><p class="instructions">Each numbered card is one student's choice for the school maze. Tap a path pad to turn it red, then tap cards to place them there. Or tap a card first and then its pad. You can also drag cards to a matching pad; a wrong pad rejects the card. The cards in each pad overlap by half their width. Tap the tally area or <strong>+ Tally</strong> once for each vote; the fifth mark crosses the first four. Tap <strong>Undo tally</strong> to fix a count.</p><div class="route-cards">${data.routeCards.map((name,i)=>`<button type="button" class="chip route-card" data-route-card="${i}" aria-pressed="false"><small>${i+1}</small>${name}</button>`).join('')}</div><div class="route-pads">${data.categories.map(name=>`<div class="route-pad" data-route-pad="${name}"><span class="pad-corner pad-face" aria-hidden="true">🙂</span><span class="pad-corner pad-clipboard" aria-hidden="true">📋</span><button type="button" class="route-drop" data-route-drop="${name}" aria-label="${name} card pad: tap to select this pad, or drag a card here" aria-pressed="false"><strong>${name}</strong><span class="pad-card-stack" data-route-pad-cards="${name}"></span></button><span class="route-tally-count" data-route-tally="${name}">0 cards · 0 tallied</span><button type="button" class="tally-strip" data-tally-marks="${name}" data-tally-add="${name}" aria-label="Add one ${name} tally by tapping the tally area"></button><span class="tally-controls"><button type="button" class="tally-add" data-tally-add="${name}" aria-label="Add one ${name} tally">+ Tally</button><button type="button" class="tally-remove" data-tally-remove="${name}" aria-label="Undo one ${name} tally">Undo tally</button></span></div>`).join('')}</div><p class="sort-hint" data-route-hint role="status" aria-live="polite">Choose a path pad and place the matching vote cards.</p><p class="source-line">After all cards are placed, a graph will show the votes you sorted. Compare it with your tally marks; these counts are the source for the graph questions below.</p></div>`;
  }
  function vennPicture(object,index){
    const stripe=`venn-stripe-${gradeKey}-${index}`;
    const flag=isInspire?index===4||index===5:index===4;
    const arrow=!isInspire&&index===6;
    const square=!object.round&&!flag&&!arrow;
    const shape=object.round?'<circle cx="50" cy="40" r="27"/>':flag?'<rect x="25" y="18" width="56" height="43" rx="3"/>':arrow?'<path d="M18 26 H56 V17 L83 40 56 63 V54 H18 Z"/>':'<rect x="25" y="15" width="50" height="50" rx="5"/>';
    const fill=object.striped?`url(#${stripe})`:object.round?(index===2?'#f7cf68':'#b8d9ed'):square?'#b8d9ed':'#a7d6c4';
    let detail='';
    if(!isInspire&&index===0)detail='<circle cx="50" cy="40" r="12" fill="#fff8e9" stroke="#2c6171" stroke-width="2"/><path d="M50 25 L55 40 L50 55 L45 40 Z" fill="#c9575a" stroke="#315465" stroke-width="1.5"/><circle cx="50" cy="40" r="3" fill="#315465"/>';
    else if(!isInspire&&index===1)detail='<circle cx="50" cy="40" r="17" fill="#fff8e9" stroke="#2c6171" stroke-width="3"/><path d="M50 23v34 M33 40h34 M38 28l24 24 M62 28L38 52" stroke="#2c6171" stroke-width="2"/><circle cx="50" cy="40" r="4" fill="#2c6171"/>';
    else if(index===2)detail='<circle cx="50" cy="40" r="13" fill="#ffeb7b" stroke="#bd813e" stroke-width="2"/><path d="M50 21v-7 M50 59v7 M31 40h-7 M69 40h7 M37 27l-5-5 M63 53l5 5 M63 27l5-5 M37 53l-5 5" stroke="#d28a2e" stroke-width="3" stroke-linecap="round"/>';
    else if(index===3)detail='<circle cx="47" cy="39" r="17" fill="#f9efb9"/><circle cx="55" cy="33" r="16" fill="#b8d9ed"/>';
    else if(flag)detail='<path d="M21 13v58" stroke="#526758" stroke-width="4" stroke-linecap="round"/>';
    else if(!isInspire&&index===5)detail='<path d="M35 40h24 M52 31l9 9-9 9" fill="none" stroke="#234b63" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>';
    else if(isInspire&&(index===0||index===1))detail='<circle cx="50" cy="40" r="14" fill="#fff9e8" stroke="#376478" stroke-width="2"/><path d="M50 28l3.5 8 8.5 1-6.5 5.5 2 8.5-7.5-4.5-7.5 4.5 2-8.5-6.5-5.5 8.5-1z" fill="#e0ad47"/>';
    else if(isInspire&&(index===6||index===7))detail='<path d="M50 27l12 13-12 13-12-13z" fill="#f6e7a9" stroke="#436878" stroke-width="2"/>';
    else if(!isInspire&&index===7)detail='<rect x="36" y="26" width="28" height="28" rx="3" fill="#f6e7a9" stroke="#436878" stroke-width="2"/>';
    const glow=object.glow?'<circle cx="50" cy="40" r="34" fill="none" stroke="#efc94c" stroke-width="3" stroke-dasharray="4 4"/><path d="M79 7l2.7 6.3L88 16l-6.3 2.7L79 25l-2.7-6.3L70 16l6.3-2.7z" fill="#e9b843" stroke="#946118" stroke-width="1"/>':'';
    return `<svg class="venn-card-picture" viewBox="0 0 100 80" aria-hidden="true" focusable="false"><defs><pattern id="${stripe}" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="12" height="12" fill="#f8e5a8"/><rect width="5" height="12" fill="#d46c67"/></pattern></defs>${flag?'<path d="M21 13v58" stroke="#526758" stroke-width="4"/>':''}<g fill="${fill}" stroke="#426b78" stroke-width="3">${shape}</g>${detail}${glow}</svg>`;
  }
  function vennMarkup() {
    const zones = [['round','Round · not striped'],['both','Round · striped'],['striped','Not round · striped'],['neither','Not round · not striped']];
    const chips = data.venn.map((o,i)=>`<button type="button" class="chip venn-chip" data-chip="${i}" aria-pressed="false" aria-label="Object ${i+1}: ${escapeHtml(o.name)}${isInspire && o.glow ? ', glowing' : ''}; drag into the diagram or tap to select"><span class="venn-card-number" aria-hidden="true">${i+1}</span>${vennPicture(o,i)}</button>`).join('');
    return `<div class="workspace"><h3>Sort eight designs for maze signs</h3><p class="instructions">Students made eight picture designs for signs at the school maze. Look at each design for <strong>two features</strong>: is its main shape <strong>round or not round</strong>, and does it have <strong>stripes or no stripes</strong>? Stripes are the coloured lines drawn across a design. Place a card in the overlap if it is both round and striped. Tap a region pad and then a card, or drag the card into the diagram. You can move a card and use Check my work when ready.${isInspire ? ' A sparkle ✦ marks a glow-in-the-dark design; count that third feature after sorting.' : ''}</p>
      <div class="venn-layout"><div class="venn-visual"><svg class="simple-svg venn-diagram" data-venn-diagram viewBox="0 0 620 238" role="img" aria-label="Drop objects into the Venn diagram: round and not striped; round and striped; not round and striped; or not round and not striped."><rect x="4" y="4" width="612" height="230" rx="18" fill="#f7faf7" stroke="#b2cbc1" stroke-width="2"/><circle cx="250" cy="113" r="94" fill="#dceafa" fill-opacity=".8" stroke="#397aab" stroke-width="3"/><circle cx="371" cy="113" r="94" fill="#fce6d7" fill-opacity=".7" stroke="#ca8155" stroke-width="3"/><text x="204" y="46" font-size="18" font-weight="bold" fill="#183247">Round</text><text x="363" y="46" font-size="18" font-weight="bold" fill="#183247">Striped</text><text x="205" y="82" text-anchor="middle" font-size="13" font-weight="bold" fill="#183247">Round<tspan x="205" dy="17">NOT striped</tspan></text><text x="310" y="82" text-anchor="middle" font-size="13" font-weight="bold" fill="#183247">Round<tspan x="310" dy="17">Striped</tspan></text><text x="420" y="82" text-anchor="middle" font-size="13" font-weight="bold" fill="#183247">NOT round<tspan x="420" dy="17">Striped</tspan></text><text x="25" y="31" font-size="13" font-weight="bold" fill="#183247">NOT round<tspan x="25" dy="17">NOT striped</tspan></text><g data-svg-tokens></g></svg><p class="venn-hint" data-venn-hint>Drag a numbered object onto the diagram, or tap to place it.</p></div>
      <div class="venn-bank"><h4>Maze-sign design cards</h4><p>Look at each picture. Sort by shape and stripes.</p><div class="chips" data-chips>${chips}</div></div></div>
      <div class="venn-board" data-venn-board>${zones.map(([key,label])=>`<button type="button" class="venn-zone ${key}" data-zone="${key}" aria-pressed="false"><span class="pad-corner pad-face" aria-hidden="true">🙂</span><span class="pad-corner pad-clipboard" aria-hidden="true">📋</span><strong>${label}</strong><span data-zone-items="${key}">Tap this pad, then an object</span></button>`).join('')}</div>${isInspire ? '<div class="input-row"><label>How many glowing objects are both round and striped?<input type="number" min="0" max="8" inputmode="numeric" data-answer="glow-both" aria-label="Glowing, round, and striped objects"></label></div>' : ''}</div>`;
  }
  const treeShapes=['Round','Square'];
  const treeColours=['Blue','Yellow'];
  const treeSymbols=['Star','Arrow'];
  const treeKey=sign=>`${sign.shape}-${sign.colour}-${sign.symbol}`;
  function treeMarkup() {
    const branchLines=[
      'M 40 320 L 160 160','M 40 320 L 160 480',
      'M 390 160 L 450 80','M 390 160 L 450 240','M 390 480 L 450 400','M 390 480 L 450 560',
      ...[80,240,400,560].flatMap(y=>[`M 680 ${y} L 740 ${y-40}`,`M 680 ${y} L 740 ${y+40}`])
    ].map(d=>`<path d="${d}"/>`).join('');
    const leaves=treeShapes.flatMap((shape,si)=>treeColours.flatMap((colour,ci)=>treeSymbols.map((symbol,yi)=>{
      const row=si*4+ci*2+yi,key=treeKey({shape,colour,symbol});
      return `<div class="tree-leaf" style="top:${(row+.5)*12.5}%"><span>${symbol}</span><button type="button" data-tree-pad="${key}" aria-label="${shape}, ${colour}, ${symbol}: place matching maze sign here"><span class="tree-pad-placeholder">Place sign here</span><span class="tree-pad-card" data-tree-pad-card="${key}"></span></button></div>`;
    })));
    const cards=data.signTree.map((sign,i)=>`<button type="button" class="tree-card" data-tree-card="${i}" aria-pressed="false" aria-label="Sign ${String.fromCharCode(65+i)}: ${sign.shape}, ${sign.colour}, ${sign.symbol}; tap or drag to sort"><span class="tree-sign-icon ${sign.shape.toLowerCase()} ${sign.colour.toLowerCase()}" aria-hidden="true">${sign.symbol==='Star'?'★':'➜'}</span><b class="tree-card-letter" aria-hidden="true">${String.fromCharCode(65+i)}</b></button>`).join('');
    return `<div class="workspace"><h3>Sort signs for the school maze</h3><p class="instructions">The sign-making team made eight designs for a pretend school maze. Each sign has a <strong>shape</strong>, a <strong>background colour</strong>, and a <strong>symbol</strong>. Follow the branches in order: shape → colour → symbol. Drag each card to its final pad, or tap a card and then its pad. A pad rejects a card that does not match all three clues.</p><div class="tree-scroll" aria-label="Three-level maze-sign sorting tree; scroll sideways on a small screen"><div class="tree-headings"><strong>1 · Shape</strong><strong>2 · Colour</strong><strong>3 · Symbol</strong></div><div class="tree-board"><svg viewBox="0 0 1000 640" preserveAspectRatio="none" aria-hidden="true"><g>${branchLines}</g><circle cx="40" cy="320" r="7"/></svg>${treeShapes.map((shape,i)=>`<div class="tree-branch tree-shape" style="top:${i?75:25}%">${shape}</div>`).join('')}${treeShapes.flatMap((shape,si)=>treeColours.map((colour,ci)=>`<div class="tree-branch tree-colour" style="top:${(si*2+ci+.5)*25}%">${colour}</div>`)).join('')}${leaves.join('')}</div></div><div class="tree-bank"><h4>Maze-sign card bank</h4><p>Select a card, then tap the matching final pad. Select a placed card and press Return to bank if you want to move it.</p><div class="tree-cards">${cards}</div><button type="button" class="tree-return" data-tree-return>Return selected card to bank</button></div><p class="sort-hint" data-tree-hint role="status" aria-live="polite">Choose a sign card, then follow its three clues.</p><p class="source-line">Source: eight fictional sign designs made for this sorting activity.</p></div>`;
  }
  function tableMarkup() {
    return `<div class="workspace"><h3>Count the Grade 3 path votes</h3><p class="instructions">Each of the 28 vote cards records one student's chosen school-maze path. Count the cards in each path pad, then enter the number of students who chose that path. You can fill this table at any time.</p><table class="table-blank"><thead><tr><th scope="col">Maze path</th><th scope="col">Number of student votes</th></tr></thead><tbody>${data.categories.map((name,i)=>`<tr><td>${name}</td><td><input type="number" min="0" max="28" inputmode="numeric" data-frequency="${i}" aria-label="Number of students who voted for ${name}"></td></tr>`).join('')}</tbody></table></div>`;
  }
  function pictographMarkup() {
    const slots = isInspire ? 7 : 8;
    return `<div class="workspace"><h3>Graph the students' path votes</h3><p class="instructions">Use the number of students who voted for each path. Tap a square to add or remove a picture, and keep each row lined up with its path.</p><p class="key-note">Key: ${data.symbol} = ${data.scale} student vote${data.scale===1?'':'s'}</p><div data-picto-grid>${data.categories.map((name,i)=>`<div class="picto-row"><strong>${name}</strong><div class="picto-slots">${Array.from({length:slots},(_,j)=>`<button type="button" class="picto-slot" data-picto-row="${i}" data-picto-slot="${j+1}" aria-label="${name}, ${j+1} picture${j?'s':''}">◆</button>`).join('')}</div></div>`).join('')}</div><p class="axis-note">Title: Grade ${data.grade} school-maze path votes · Source: fictional student votes</p></div>`;
  }
  function verticalMarkup() {
    const units = isInspire ? 7 : 8;
    return `<div class="workspace"><h3>Build a vertical bar graph of path votes</h3><p class="instructions">Show how many Grade ${data.grade} students voted for each school-maze path. Tap a block in each column to set its height. Tap that block again to clear the column.</p><p class="key-note">Vertical scale: each block = ${data.scale} student vote${data.scale===1?'':'s'}</p><div class="vertical-graph" data-graph="vertical">${data.categories.map((name,i)=>`<div class="vbar-col"><div class="bar-slots">${Array.from({length:units},(_,j)=>`<button type="button" class="bar-slot" data-bar="vertical" data-row="${i}" data-units="${j+1}" aria-label="${name}: ${j+1} block${j?'s':''}, ${data.scale*(j+1)} student votes"></button>`).join('')}</div><strong>${name}</strong></div>`).join('')}</div><p class="axis-note">Horizontal axis: maze path · Vertical axis: number of student votes · Title: Grade ${data.grade} school-maze path votes</p></div>`;
  }
  function horizontalMarkup() {
    const units = isInspire ? 7 : 8;
    return `<div class="workspace"><h3>Build a horizontal bar graph of path votes</h3><p class="instructions">Show the same Grade ${data.grade} students' path votes with bars that go across. Tap a block to set each path's bar length.</p><p class="key-note">Horizontal scale: each block = ${data.scale} student vote${data.scale===1?'':'s'}</p><div data-graph="horizontal">${data.categories.map((name,i)=>`<div class="hbar-row"><strong>${name}</strong><div class="bar-slots">${Array.from({length:units},(_,j)=>`<button type="button" class="bar-slot" data-bar="horizontal" data-row="${i}" data-units="${j+1}" aria-label="${name}: ${j+1} block${j?'s':''}, ${data.scale*(j+1)} student votes"></button>`).join('')}</div></div>`).join('')}</div><p class="axis-note">Vertical axis: maze path · Horizontal axis: number of student votes · Title: Grade ${data.grade} school-maze path votes</p></div>`;
  }
  function reasonMarkup() {
    if (isInspire) return `<div class="workspace"><h3>What do the votes and practice times tell us?</h3><p class="instructions">At a pretend school fun day, 28 Grade 3 students each voted for one maze path to try first; your path graph shows those votes. In a <strong>separate practice test</strong>, four pairs of students each completed one maze run. The teacher timed their runs at <strong>${data.practiceRuns.join(', ')} minutes</strong>, for 24 minutes altogether. Use the vote graph to compare paths. Use the four times to find the mean and the most common time.</p><div class="input-row"><label>Which path received the most student votes?<select data-answer="route-mode"><option value="">Choose…</option>${data.categories.map(x=>`<option>${x}</option>`).join('')}</select></label><label>Mean time for one practice run (minutes)<input type="number" min="0" max="30" inputmode="numeric" data-answer="mean"></label><label>Most common practice-run time (minutes)<input type="number" min="0" max="30" inputmode="numeric" data-answer="number-mode"></label><label>How many more students voted for Bridge than Tunnel?<input type="number" min="0" max="30" inputmode="numeric" data-answer="difference"></label></div><div class="input-row"><label>What does the mean practice time tell us?<select data-answer="mean-meaning"><option value="">Choose…</option><option value="equal-share">The four runs averaged 6 minutes; 24 total minutes shared equally across four runs is 6 minutes each.</option><option value="all-six">Every run took exactly 6 minutes.</option><option value="fastest">The fastest run took 6 minutes.</option></select></label><label>What does the mode of the run times tell us?<select data-answer="number-mode-meaning"><option value="">Choose…</option><option value="most-often">Six minutes occurred more often than any other run time.</option><option value="average">Six minutes was the longest run.</option><option value="all-six">All four runs took 6 minutes.</option></select></label><label>Which path should the class try first, based on the votes?<select data-answer="decision"><option value="">Choose…</option><option value="loop">Try Loop because more students voted for it than for any other path.</option><option value="tunnel">Try Tunnel because more students voted for it than for any other path.</option><option value="equal">Every path received the same number of votes.</option></select></label></div><p class="source-line">Source: two fictional data sets - Grade 3 path votes and four timed practice runs.</p></div>`;
    return `<div class="workspace"><h3>What do the Grade 2 path votes tell us?</h3><p class="instructions">Eighteen Grade 2 students each chose one path they would like to try first at a pretend school fun day. Use the graph of their votes to find the most popular path, compare it with the least popular path, and recommend a path for the class.</p><div class="input-row"><label>Which path received the most votes (the mode)?<select data-answer="route-mode"><option value="">Choose…</option>${data.categories.map(x=>`<option>${x}</option>`).join('')}</select></label><label>How many more votes did it receive than the least-chosen path?<input type="number" min="0" max="18" inputmode="numeric" data-answer="difference"></label><label>What does the mode tell us?<select data-answer="mode-meaning"><option value="">Choose…</option><option value="most">Garden received more votes than any other path.</option><option value="fewest">Garden received the fewest votes.</option><option value="same">Every path received the same number of votes.</option></select></label><label>Which path should the class try first, based on the votes?<select data-answer="decision"><option value="">Choose…</option><option value="garden">Choose Garden because it received the most votes.</option><option value="tunnel">Choose Tunnel because it received the most votes.</option><option value="same">All paths are equally popular.</option></select></label></div><p class="source-line">Source: fictional votes from 18 Grade 2 students.</p></div>`;
  }
  function meanMarkup(id) {
    const children=data.foodDrive[id==='mean-four'?'four':'five'];
    const count=children.length;
    return `<div class="workspace mean-workspace"><h3>School food-drive cans</h3><p class="instructions">At a pretend school food drive, these ${count} children brought cans from home. Each can picture stands for one can. The <strong>mean</strong> is how many cans each child would have if they shared all the cans equally. There are no leftover cans in this question.</p><div class="mean-children">${children.map(child=>`<div class="mean-child"><strong>${child.name}: ${child.cans} can${child.cans===1?'':'s'}</strong><span class="mean-cans" aria-label="${child.cans} cans">${'<span aria-hidden="true">🥫</span>'.repeat(child.cans)}</span></div>`).join('')}</div><p class="instructions"><strong>Count with squares:</strong> tap one square for each can you see. The array has two rows of 15 squares. Tap a marked square again to fix it.</p><div class="mean-grid-wrap"><div class="mean-grid" aria-label="Thirty counting squares">${Array.from({length:30},(_,i)=>`<button type="button" class="mean-square" data-mean-square="${id}" data-square-index="${i}" aria-pressed="false" aria-label="Counting square ${i+1}"></button>`).join('')}</div></div><p class="mean-mark-count" data-mean-mark-count="${id}">Squares marked: 0</p><div class="mean-calculator"><label>Total cans counted<input type="number" min="0" max="30" inputmode="numeric" data-mean-total="${id}" aria-label="Total cans for ${count} children"></label><span class="mean-operator">÷ ${count} children =</span><button type="button" class="action-button ghost" data-mean-divide="${id}">Calculate</button><output data-mean-calculation="${id}" aria-live="polite">?</output></div><div class="input-row"><label>Mean cans per child<input type="number" min="0" max="30" inputmode="numeric" data-mean-answer="${id}"></label></div><p class="source-line">Source: fictional food-drive collection for this counting activity.</p></div>`;
  }
  const valueOfBlocks = blocks => blocks.hundreds*100 + blocks.tens*10 + blocks.ones;
  const blockTypeValue = {hundreds:100,tens:10,ones:1};
  function blockTiles(blocks, prefix='', movable=false) {
    return ['hundreds','tens','ones'].map(type=>Array.from({length:blocks[type]},(_,i)=>{
      const label=type==='hundreds'?'100 flat':type==='tens'?'10 rod':'1 cube';
      const face=`<span class="place-block-face ${type}" aria-hidden="true"></span><span class="place-block-caption">${label}</span>`;
      return movable?`<button type="button" draggable="true" class="place-block movable" data-move-block="${prefix}-${type}-${i}" data-block-type="${type}" aria-label="Move ${label} from set ${prefix}">${face}</button>`:`<span class="place-block" aria-label="${label}">${face}</span>`;
    }).join('')).join('');
  }
  function choiceMarkup(id,choices){return `<div class="number-choices" role="group" aria-label="Choose the number">${choices.map(n=>`<button type="button" class="number-choice" data-number-choice="${id}" data-choice-value="${n}" aria-pressed="false">${n}</button>`).join('')}</div>`;}
  function nameNumberMarkup(index){
    const q=data.numberQuestions[index],id=['name-one','name-two','name-three'][index];
    return `<div class="workspace"><h3>Look at the place-value blocks</h3><p class="instructions">Each blue flat means 100, each green rod means 10, and each yellow cube means 1. Count the blocks and press the number they show.</p><div class="place-block-display">${blockTiles(q)}</div>${choiceMarkup(id,q.choices)}</div>`;
  }
  function combineMarkup(){
    const q=data.combineQuestion;
    for(const [set,blocks] of Object.entries({a:q.a,b:q.b}))for(const type of Object.keys(blockTypeValue))for(let i=0;i<blocks[type];i++)state.blockLocations[`${set}-${type}-${i}`]=set;
    return `<div class="workspace"><h3>Add two sets of blocks</h3><p class="instructions">Set A shows ${valueOfBlocks(q.a)} and Set B shows ${valueOfBlocks(q.b)}. Move blocks between the two sets to help you count the combined amount. Tap a block, then tap the other set's <strong>Move selected block here</strong> button, or drag it across. A moved block changes colour. When you are ready, press the number that both sets show altogether.</p><div class="block-combine-pads">${[['a','Set A'],['b','Set B']].map(([key,label])=>`<div class="block-combine-pad" data-block-pad="${key}"><strong>${label}</strong><button type="button" class="block-drop-button" data-block-drop="${key}">Move selected block here</button><div class="block-combine-stack" data-block-stack="${key}"></div></div>`).join('')}</div><p class="block-move-status" data-block-status role="status">Move blocks between Set A and Set B if it helps you count. Then choose the total below.</p><p class="combine-answer-prompt">${valueOfBlocks(q.a)} + ${valueOfBlocks(q.b)} = ?</p>${choiceMarkup('combine',q.choices)}</div>`;
  }
  function lineMarkup(index){
    const id=index===0?'line-one':'line-two',q=data.additionLines[index];
    return `<div class="workspace addition-workspace"><h3>${q.start} + ${q.add} = ?</h3><p class="instructions">Start at ${q.start}. <strong>Drag a jump onto the line</strong>, or tap a jump button. Each jump adds differently coloured blocks beside the line. Use the starting blocks and added blocks to work out the answer, then choose one of the five numbers.</p><div class="line-jump-buttons" role="group" aria-label="Choose a jump"><strong class="line-equation-prompt">${q.start} + ${q.add} = ?</strong>${[1,2,5,10,20,50,100].filter(n=>n<=q.add).map(n=>`<button type="button" data-line-jump="${id}" data-jump-value="${n}" aria-label="Tap or drag jump plus ${n} onto the number line">+${n}</button>`).join('')}<label>My jump <input type="number" min="1" max="${q.add}" inputmode="numeric" data-custom-jump="${id}"></label><button type="button" data-custom-add="${id}">Add jump</button></div><div class="line-visual-layout"><div class="line-track"><p class="line-drop-instruction">Drop a jump anywhere on the line</p><svg class="addition-line-svg" data-line-svg="${id}" viewBox="0 0 800 160" role="img" aria-label="Drop a jump here. Addition number line shows the start and your jumps but hides the final answer."></svg><div class="addition-line-actions"><button type="button" data-line-undo="${id}">Undo last jump</button><span data-line-progress="${id}"></span></div></div><aside class="line-block-panel" aria-label="Place-value blocks beside the jumps"><h4>Starting blocks</h4><div class="place-block-display line-blocks" data-line-start-blocks="${id}"></div><h4>Blocks added by jumps</h4><div class="place-block-display line-blocks line-added-blocks" data-line-added-blocks="${id}"></div></aside></div><p class="combine-answer-prompt">${q.start} + ${q.add} = ?</p>${choiceMarkup(id,q.choices)}<p class="source-line">Ontario Number strand: addition with a number line and place-value blocks. Choose one number, then use Check my work.</p></div>`;
  }
  function stemMarkup() {
    return `<div class="workspace"><h3>Sort the walking-step counts</h3><p class="instructions">In a separate pretend class activity, eight students counted their own steps from the classroom door to the maze starting line. Their counts were <strong>${data.preview.values.join(', ')}</strong> steps. Different stride lengths can lead to different counts. Choose each ones digit and put the leaves in order beside their tens stem.</p><table class="stem-table"><thead><tr><th scope="col">Tens stem</th><th scope="col">Ones leaves · choose each digit</th></tr></thead><tbody>${Object.keys(data.preview.stems).map(stem=>`<tr><td>${stem}</td><td><div class="stem-selects" data-stem="${stem}">${data.preview.stems[stem].split(' ').map((_,i)=>`<label><span>Leaf ${i+1}</span><select aria-label="Leaf ${i+1} for tens stem ${stem}"><option value="">Choose</option>${Array.from({length:10},(_,digit)=>`<option value="${digit}">${digit}</option>`).join('')}</select></label>`).join('')}</div></td></tr>`).join('')}</tbody></table><p class="key-note">Key: 1 | 2 means 12 steps. A leaf is the ones digit. Source: fictional step counts.</p></div>`;
  }
  function multiMarkup() {
    const units = 6;
    return `<div class="workspace"><h3>Compare two classes' path votes</h3><p class="instructions">At the same pretend school fun day, Class A and Class B each have 20 students. Every student voted <strong>once</strong> for the maze path they would like to try first. The table shows how many students in each class chose each path. These are <strong>new votes from two other classes</strong>, not the 28 Grade 3 vote cards above. Build one bar for each class at every path.</p><table class="data-table"><caption>Fictional first-choice maze-path votes from two classes of 20 students</caption><thead><tr><th>Maze path</th><th>Class A student votes</th><th>Class B student votes</th></tr></thead><tbody>${data.categories.map((name,i)=>`<tr><td>${name}</td><td>${data.preview.morning[i]}</td><td>${data.preview.afternoon[i]}</td></tr>`).join('')}</tbody></table><p class="key-note">Vertical scale: each block = 2 student votes. Tap a block to set each bar’s height.</p><div class="multi-graph">${data.categories.map((name,i)=>`<div class="multi-category"><div class="multi-pair">${['morning','afternoon'].map(series=>`<div class="bar-slots ${series}">${Array.from({length:units},(_,j)=>`<button type="button" class="bar-slot" data-multi="${series}" data-row="${i}" data-units="${j+1}" aria-label="${name} ${series==='morning'?'Class A':'Class B'}: ${2*(j+1)} votes"></button>`).join('')}</div>`).join('')}</div><strong>${name}</strong></div>`).join('')}</div><div class="legend"><span><i class="morning"></i>Class A</span><span><i class="afternoon"></i>Class B</span></div><p class="axis-note">Title: First-choice maze paths in two classes · Horizontal axis: maze path · Vertical axis: number of student votes · Source: fictional Class A and Class B votes</p></div>`;
  }
  const sectionBodies = [
    section('sort',1,'Sort the maze-sign designs','Which sample signs are round, striped, both, or neither?',isInspire?'Grade 3 · D1.1 (part) · Two-attribute Venn plus third-attribute check':'Grade 2 · D1.1 · Sort with two attributes',vennMarkup()),
    ...(isInspire ? [section('tree',2,'Build a maze-sign sorting tree','Follow three clues to sort eight school-maze signs.','Grade 3 · D1.1 · Sort by three attributes using a tree diagram',treeMarkup())] : []),
    section('route-sort',2,'Sort the path-choice cards',`Each of ${isInspire?28:18} fictional students voted once for a school-maze path. Sort the individual votes and make tallies.`,`Grade ${data.grade} · Organize supplied data before graphing`,routeSortMarkup()),
    ...(isInspire ? [section('table',3,'Make a frequency table','Record how many students voted for each maze path.','Grade 3 · D1.2 (organization practice only)',tableMarkup())] : []),
    section('picto',isInspire?4:3,'Build a pictograph',`Show Grade ${data.grade} path votes: one symbol represents ${data.scale} student vote${data.scale===1?'':'s'}.` ,`Grade ${data.grade} · D1.3 · Pictograph`,pictographMarkup()),
    section('vertical',isInspire?5:4,'Graph it upward',`Build a vertical bar graph of Grade ${data.grade} students' first-choice maze paths.`,`Grade ${data.grade} · D1.3 · Vertical bar graph`,verticalMarkup()),
    section('horizontal',isInspire?6:5,'Graph it across',`Show those same Grade ${data.grade} path votes with horizontal bars.`,`Grade ${data.grade} · D1.3 · Horizontal bar graph`,horizontalMarkup()),
    section('reason',isInspire?7:6,'Explain the school-maze data',isInspire?'Compare students’ path votes and explain a separate set of timed practice runs.':'Use Grade 2 students’ path votes to recommend a path.',isInspire?'Grade 3 · D1.4 and D1.5 · Mean, mode, and analysis':'Grade 2 · D1.4 and D1.5 · Mode and analysis',reasonMarkup()),
    ...(isInspire ? [section('mean-four',8,'Find the mean for four children','Count food-drive cans, make an array, and share equally among four children.','Grade 3 · D1.4 · Find and explain the mean',meanMarkup('mean-four')),section('mean-five',9,'Find the mean for five children','Count a new food-drive collection and share equally among five children.','Grade 3 · D1.4 · Find and explain the mean',meanMarkup('mean-five'))] : []),
    ...['name-one','name-two','name-three'].map((id,i)=>section(id,(isInspire?10:7)+i,`Name that number ${i+1}`,'Read the hundreds, tens, and ones shown by the blocks.',`Grade ${data.grade} · B1.1 · Represent whole numbers with place-value blocks`,nameNumberMarkup(i))),
    section('combine',isInspire?13:10,'Combine two sets of blocks','Move blocks between the two sets and find their combined number.',`Grade ${data.grade} · ${isInspire?'B2.5 (tools component)':'B2.4'} · Place-value addition`,combineMarkup()),
    ...['line-one','line-two'].map((id,i)=>section(id,(isInspire?14:11)+i,`Addition number line ${i+1}`,'Use jumps and changing place-value blocks to solve a hidden-answer quiz.',`Grade ${data.grade} · ${isInspire?'B2.5 (tools component)':'B2.4'} · Addition with concrete and visual strategies`,lineMarkup(i))),
    ...(isInspire ? [section('stem',16,'Try a stem-and-leaf plot','A next-grade preview using fictional walking-step counts.','Grade 4 preview · D1.2 organization practice only · Not in the Grade 3 assessment',stemMarkup(),true),section('multiple',17,'Try a multiple-bar graph','Compare first-choice maze-path votes from two other classes.','Grade 4 preview · D1.3 graph-building practice only · Not in the Grade 3 assessment',multiMarkup(),true)] : [])
  ];
  root.innerHTML = `<div class="activity-head"><div><p class="eyebrow">${data.label} trail · Grade ${data.grade}</p><h1>Follow the data.</h1><p class="lead">${isInspire?'Build scaled graphs, find mean and mode, and explore two optional next-grade graph ideas.':'Sort clues and turn path votes into clear picture and bar graphs.'} All data here is fictional.</p></div><div class="grade-stamp" aria-hidden="true">${isInspire?'🗺️':'🧭'}<small>Grade ${data.grade}</small></div></div><p class="progress" data-progress>0 of ${coreCount} core activities checked</p><nav class="jump-nav" aria-label="Jump to an activity">${ids.map((id,i)=>`<a href="#${id}">${i+1}. ${names[id]}</a>`).join('')}</nav>${story()}${sectionBodies.join('')}<section class="expectations-panel" id="expectations"><h2>Curriculum connections on this trail</h2><p>These activities practise the listed parts of Ontario’s Data expectations; they do not assess every part of each expectation.</p><ul>${data.expectations.map(([code,description])=>`<li><b>${code}</b>${description}</li>`).join('')}</ul>${isInspire?'<p><strong>Curriculum boundary:</strong> Stem-and-leaf plots and multiple-bar graphs are Grade 4 ideas in Ontario’s 2020 curriculum. These are optional, ungraded practice, not full Grade 4 expectation assessments.</p>':''}<small>Ontario Mathematics Curriculum, Grades 1–8 (2020), Data strand D1. <a href="https://assets-us-01.kc-usercontent.com/fbd574c4-da36-0066-a0c5-849ffb2de96e/60e2b2c7-5a7a-4038-bc06-fb88ffd6c861/Data_AODA.pdf" target="_blank" rel="noopener">Read the official expectations ↗</a></small></section>`;
  root.querySelector('#sort .venn-layout').insertAdjacentHTML('beforebegin','<div class="venn-rule-key"><span><b>Rule 1</b> Round / not round</span><span><b>Rule 2</b> Striped / not striped</span></div>');
  root.querySelectorAll('.activity').forEach((activity,index)=>{activity.querySelector('.activity-number').textContent=String(index+1).padStart(2,'0');});
  root.querySelector('.story-card').insertAdjacentHTML('afterend',`<figure class="vote-scene"><img src="maze-voting-scene.png" alt="Four students placing votes in labelled boxes for Garden, Bridge, Tunnel, and Loop maze paths." loading="eager"><figcaption>Imagine a school fun day: each Grade ${data.grade} student chooses one maze path. The ballot boxes introduce the fictional vote cards you will sort and graph below.</figcaption></figure>`);
  for(const id of ['picto','vertical','horizontal'])root.querySelector(`#${id} .axis-note`).insertAdjacentHTML('afterend',`<p class="source-line">Source: fictional first-choice votes from ${isInspire?28:18} Grade ${data.grade} students.</p>`);
  root.querySelector('.expectations-panel>p').textContent='These activities practise selected Ontario Data and Number expectations. Each activity identifies its connection; no single activity assesses the entire expectation.';
  root.querySelector('.expectations-panel>p').insertAdjacentHTML('afterend',isInspire?'<p><strong>Assessment boundary:</strong> The new tree assesses three-attribute sorting in D1.1. The frequency-table activity practises only the organization part of D1.2; students do not collect the data here.</p>':'<p><strong>Assessment boundary:</strong> The vote-card tallies are practice with supplied data. They do not assess the Grade 2 D1.2 requirement to collect two pieces of information and organize them in a two-way tally table.</p>');
  root.querySelector('.expectations-panel small').insertAdjacentHTML('beforeend',' · <a href="https://assets-us-01.kc-usercontent.com/fbd574c4-da36-0066-a0c5-849ffb2de96e/c2dea171-e219-4ec0-b097-24c959fcc924/Number_AODA.pdf" target="_blank" rel="noopener">Read official Number expectations ↗</a>');
  root.querySelector('.route-pads').insertAdjacentHTML('afterend','<div class="sorted-graph" data-sorted-graph hidden aria-live="polite"></div>');
  root.querySelector('#sort .instructions').insertAdjacentHTML('beforeend','<span class="change-mind-tip"><strong>Change your mind?</strong> Tap a green card or a placed number to return it to the bank. You can also drag it to another Venn region.</span>');
  if(isInspire)root.querySelector('#tree .instructions').insertAdjacentHTML('beforeend','<span class="change-mind-tip"><strong>Change your mind?</strong> Tap a placed sign or its green card to return it to the bank, then sort it again. You can also drag it back.</span>');
  if(isInspire){root.querySelector('.tree-bank p').textContent='Tap or drag a sign to its matching pad. Tap a placed sign or a green bank card to return it.';root.querySelector('[data-tree-return]').remove();}
  root.querySelector('#route-sort .instructions').insertAdjacentHTML('beforeend','<span class="change-mind-tip"><strong>Change your mind?</strong> Tap a green vote card or a number in a pad to return it to the bank. If you already added a tally, use Undo tally too.</span>');
  root.querySelector('#combine .instructions').insertAdjacentHTML('beforeend','<span class="change-mind-tip">You can move a block back to Set A or Set B, or use <strong>Undo last block move</strong>.</span>');
  root.querySelector('#combine .block-move-status').insertAdjacentHTML('afterend','<button type="button" class="block-undo" data-block-undo disabled>Undo last block move</button>');
  for(const id of ['line-one','line-two'])root.querySelector(`#${id} .instructions`).insertAdjacentHTML('beforeend',' Tap any jump on the line to remove just that jump.');
  for(const id of ['line-one','line-two']){
    root.querySelector(`#${id} .instructions`).insertAdjacentHTML('beforeend',' Each jump button stays available to use again; reaching the target does not lock the choices.');
    root.querySelector(`[data-custom-jump="${id}"]`).max=String(999-lineQuestion(id).start);
  }
  const voteCardBank=root.querySelector('#route-sort .route-cards');
  voteCardBank.setAttribute('role','region');
  voteCardBank.setAttribute('aria-label','Vote cards. Scroll inside this panel while the sorting pads stay beside it.');
  voteCardBank.tabIndex=0;
  root.querySelector('#combine .instructions').insertAdjacentHTML('afterend','<p class="combine-steps"><strong>1.</strong> Look at both sets. <strong>2.</strong> Move blocks between A and B if that helps you count. <strong>3.</strong> Press the number that shows their combined total.</p>');
  root.querySelectorAll('[data-route-card]').forEach(btn=>{
    const index=Number(btn.dataset.routeCard),name=data.routeCards[index];
    btn.innerHTML=`<small>${index+1}</small><span class="route-card-picture ${name.toLowerCase()}" aria-hidden="true"></span><span class="route-card-label">${escapeHtml(name)}</span>`;
    btn.setAttribute('aria-label',`Vote card ${index+1}: ${name} maze path. Tap or drag to a matching pad.`);
  });
  if(isInspire)root.querySelector('#table .instructions').insertAdjacentHTML('afterend',`<div class="table-source" aria-live="polite"><h4>Your card counts and tallies from Activity 3</h4><p>These numbers come from the cards <em>you</em> sorted and the tally marks <em>you</em> made. Use them to fill the frequency table below.</p><div class="table-source-grid">${data.categories.map(name=>`<div class="table-source-item"><span class="route-card-picture ${name.toLowerCase()}" aria-hidden="true"></span><strong>${name}</strong><span data-table-count="${name}">0 cards sorted</span><span data-table-tally="${name}">0 tally marks</span></div>`).join('')}</div></div>`);
  const voteDataPanel=(includeTimes=false)=>`<aside class="graph-data-panel" aria-label="Vote counts from your sorted cards"><h4>Your sorted vote data</h4><p data-graph-progress>0 of ${data.routeCards.length} cards sorted. Finish sorting to get the full data.</p><table><thead><tr><th scope="col">Maze path</th><th scope="col">Cards</th><th scope="col">Tallies</th></tr></thead><tbody>${data.categories.map(name=>`<tr><th scope="row">${name}</th><td data-graph-count="${name}">0</td><td data-graph-tally="${name}">0</td></tr>`).join('')}</tbody></table><p>Use the <strong>Cards</strong> column to build your graph. Compare it with your tallies.</p>${includeTimes&&isInspire?`<p class="practice-source"><strong>Separate timing data:</strong> ${data.practiceRuns.join(', ')} minutes for four practice runs.</p>`:''}</aside>`;
  for(const [id,graphSelector] of [['picto','[data-picto-grid]'],['vertical','[data-graph="vertical"]'],['horizontal','[data-graph="horizontal"]']]){
    const workspace=root.querySelector(`#${id} .workspace`),key=workspace.querySelector('.key-note'),graph=workspace.querySelector(graphSelector),axis=workspace.querySelector('.axis-note'),source=workspace.querySelector('.source-line');
    const layout=document.createElement('div');layout.className='graph-task-layout';key.before(layout);
    layout.innerHTML=`${voteDataPanel()}<div class="graph-main"></div>`;
    layout.querySelector('.graph-main').append(key,graph,axis,source);
  }
  const reasonWorkspace=root.querySelector('#reason .workspace'),reasonFirstInput=reasonWorkspace.querySelector('.input-row');
  const reasonLayout=document.createElement('div');reasonLayout.className='graph-task-layout';reasonFirstInput.before(reasonLayout);
  reasonLayout.innerHTML=`${voteDataPanel(true)}<div class="graph-main"></div>`;
  reasonLayout.querySelector('.graph-main').append(...reasonWorkspace.querySelectorAll('.input-row,.source-line'));
  if(isInspire){
    const workspace=root.querySelector('#multiple .workspace'),table=workspace.querySelector('.data-table'),key=workspace.querySelector('.key-note'),graph=workspace.querySelector('.multi-graph'),legend=workspace.querySelector('.legend'),axis=workspace.querySelector('.axis-note');
    const layout=document.createElement('div');layout.className='graph-task-layout';table.before(layout);
    layout.innerHTML='<aside class="graph-data-panel"><h4>Data to graph · Class A and Class B</h4></aside><div class="graph-main"></div>';
    layout.querySelector('.graph-data-panel').append(table);
    layout.querySelector('.graph-main').append(key,graph,legend,axis);
  }
  root.querySelectorAll('[data-route-drop]').forEach(btn=>btn.setAttribute('aria-label',`${btn.dataset.routeDrop} pad. Tap to select this pad, or place a card selected first.`));
  function zoneFor(obj) {return obj.round && obj.striped ? 'both' : obj.round ? 'round' : obj.striped ? 'striped' : 'neither';}
  const vennLabels = {round:'Round and not striped',both:'Round and striped',striped:'Not round and striped',neither:'Not round and not striped'};
  const vennDiagram = root.querySelector('[data-venn-diagram]');
  const vennHint = root.querySelector('[data-venn-hint]');
  let vennDrag = null;
  let suppressChipClick = null;
  function diagramZoneAt(clientX, clientY) {
    const rect = vennDiagram.getBoundingClientRect();
    if(clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
    const point = vennDiagram.createSVGPoint();
    point.x = clientX; point.y = clientY;
    const matrix = vennDiagram.getScreenCTM();
    if(!matrix) return null;
    const {x,y} = point.matrixTransform(matrix.inverse());
    if(x < 4 || x > 616 || y < 4 || y > 234) return null;
    const round = (x-250)**2 + (y-113)**2 <= 94**2;
    const striped = (x-371)**2 + (y-113)**2 <= 94**2;
    return round && striped ? 'both' : round ? 'round' : striped ? 'striped' : 'neither';
  }
  function vennDropAt(clientX, clientY) {
    const diagramZone = diagramZoneAt(clientX, clientY);
    if(diagramZone) return diagramZone;
    return document.elementFromPoint(clientX,clientY)?.closest('[data-zone]')?.dataset.zone || null;
  }
  function placeVenn(index, zone) {
    state.venn[index] = zone;
    state.selected = null;
    state.vennPadSelected = zone;
    state.solved.delete('sort');
    root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;
    const result=root.querySelector('[data-feedback="sort"]');
    result.textContent='Build your answer, then check it.';
    result.classList.remove('good','try');
    vennHint.textContent=`Object ${index+1} placed in ${vennLabels[zone]}. Drag or tap it again to move it.`;
    refreshVenn();
  }
  function returnVenn(index) {
    if(state.venn[index]===null)return;
    state.venn[index]=null;
    state.selected=null;
    state.vennPadSelected=null;
    state.solved.delete('sort');
    root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;
    const result=root.querySelector('[data-feedback="sort"]');
    result.textContent='Build your answer, then check it.';
    result.classList.remove('good','try');
    vennHint.textContent=`Object ${index+1} returned to the card bank. Choose a region to place it again.`;
    refreshVenn();
  }
  function selectVennPad(zone) {
    if(state.selected!==null){placeVenn(state.selected,zone);return;}
    state.vennPadSelected=state.vennPadSelected===zone?null:zone;
    vennHint.textContent=state.vennPadSelected?`${vennLabels[zone]} pad selected. Tap an object card to place it here.`:'Choose a region pad, then tap an object card.';
    refreshVenn();
  }
  function refreshVenn() {
    root.querySelectorAll('[data-zone-items]').forEach(el=>{
      const list = state.venn.map((zone,i)=>zone===el.dataset.zoneItems?`<span class="placed" data-venn-return="${i}" title="Tap to return object ${i+1} to the card bank">${i+1}${isInspire && data.venn[i].glow?' ✦':''}</span>`:'').filter(Boolean);
      el.innerHTML = list.length ? list.join('') : 'Tap this pad, then an object';
      el.classList.toggle('pad-card-stack',list.length>0);
    });
    root.querySelectorAll('[data-zone]').forEach(pad=>{
      const active=pad.dataset.zone===state.vennPadSelected;
      pad.classList.toggle('active-target',active);
      pad.setAttribute('aria-pressed',String(active));
    });
    const tokenLayer=root.querySelector('[data-svg-tokens]');
    tokenLayer.replaceChildren();
    const columns={round:[188,215],both:[303,322],striped:[405,432],neither:[88,116]};
    const rows={round:[112,138,164,190],both:[112,138,164,190],striped:[112,138,164,190],neither:[112,138,164,190]};
    const ns='http://www.w3.org/2000/svg';
    for(const zone of Object.keys(columns)){
      state.venn.forEach((assigned,i)=>{
        if(assigned!==zone)return;
        const position=state.venn.slice(0,i).filter(x=>x===zone).length;
        const col=position%2,row=Math.floor(position/2);
        const x=columns[zone][col],y=rows[zone][row];
        const group=document.createElementNS(ns,'g');
        group.classList.add('venn-token');
        group.dataset.chip=String(i);
        group.setAttribute('transform',`translate(${x} ${y})`);
        group.setAttribute('role','button');
        group.setAttribute('tabindex','0');
        group.setAttribute('aria-label',`Move object ${i+1}: ${data.venn[i].name}; currently in ${vennLabels[zone]}`);
        const rect=document.createElementNS(ns,'rect');
        rect.setAttribute('x','-13');rect.setAttribute('y','-11');rect.setAttribute('width','26');rect.setAttribute('height','22');rect.setAttribute('rx','6');
        const number=document.createElementNS(ns,'text');
        number.setAttribute('text-anchor','middle');number.setAttribute('dominant-baseline','central');
        number.textContent=String(i+1);
        group.append(rect,number);
        tokenLayer.appendChild(group);
      });
    }
    root.querySelectorAll('[data-chip]').forEach(btn=>{
      const i = Number(btn.dataset.chip);
      btn.classList.toggle('selected', i===state.selected);
      btn.classList.toggle('assigned', state.venn[i]!==null);
      btn.setAttribute('aria-pressed', String(i===state.selected));
      btn.setAttribute('title',state.venn[i]===null?'Not placed yet':`Placed in ${vennLabels[state.venn[i]]}; tap to return or drag to move`);
    });
  }
  function clearVennDrag() {
    if(!vennDrag) return;
    vennDrag.source.classList.remove('drag-source');
    vennDrag.ghost?.remove();
    vennDrag=null;
    vennDiagram.removeAttribute('data-hover-zone');
    root.querySelectorAll('[data-zone]').forEach(el=>el.classList.remove('drop-preview'));
  }
  root.addEventListener('pointerdown',event=>{
    const chip=event.target.closest('[data-chip], [data-venn-return]');
    if(!chip || (event.pointerType==='mouse' && event.button!==0)) return;
    vennDrag={pointerId:event.pointerId,index:Number(chip.dataset.chip ?? chip.dataset.vennReturn),source:chip,startX:event.clientX,startY:event.clientY,active:false,ghost:null};
    chip.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove',event=>{
    if(!vennDrag || event.pointerId!==vennDrag.pointerId) return;
    if(!vennDrag.active && Math.hypot(event.clientX-vennDrag.startX,event.clientY-vennDrag.startY)<8) return;
    event.preventDefault();
    if(!vennDrag.active){
      vennDrag.active=true;
      vennDrag.source.classList.add('drag-source');
      vennDrag.ghost=document.createElement('div');
      vennDrag.ghost.className='venn-drag-ghost';
      vennDrag.ghost.innerHTML=vennDrag.source.innerHTML;
      document.body.appendChild(vennDrag.ghost);
    }
    vennDrag.ghost.style.left=`${event.clientX}px`;
    vennDrag.ghost.style.top=`${event.clientY}px`;
    const zone=vennDropAt(event.clientX,event.clientY);
    if(zone) vennDiagram.dataset.hoverZone=zone;
    else vennDiagram.removeAttribute('data-hover-zone');
    root.querySelectorAll('[data-zone]').forEach(el=>el.classList.toggle('drop-preview',el.dataset.zone===zone));
    vennHint.textContent=zone?`Release to place object ${vennDrag.index+1} in ${vennLabels[zone]}.`:'Move over the Venn diagram or a region pad.';
  });
  root.addEventListener('pointerup',event=>{
    if(!vennDrag || event.pointerId!==vennDrag.pointerId) return;
    if(vennDrag.active){
      event.preventDefault();
      const index=vennDrag.index,zone=vennDropAt(event.clientX,event.clientY);
      suppressChipClick=index;
      setTimeout(()=>{if(suppressChipClick===index)suppressChipClick=null;},0);
      clearVennDrag();
      if(zone) placeVenn(index,zone);
      else if(document.elementFromPoint(event.clientX,event.clientY)?.closest('.venn-bank'))returnVenn(index);
      else vennHint.textContent='Drop the object inside the diagram or on a region pad.';
    } else clearVennDrag();
  });
  root.addEventListener('pointercancel',()=>clearVennDrag());
  function refreshTree(){
    if(!isInspire)return;
    root.querySelectorAll('[data-tree-card]').forEach(card=>{
      const index=Number(card.dataset.treeCard);
      card.classList.toggle('selected',state.treeSelected===index);
      card.classList.toggle('assigned',state.treeAssignments[index]!==null);
      card.setAttribute('aria-pressed',String(state.treeSelected===index));
      card.setAttribute('aria-label',state.treeAssignments[index]===null?`Sign ${String.fromCharCode(65+index)}: ${data.signTree[index].shape}, ${data.signTree[index].colour}, ${data.signTree[index].symbol}; tap or drag to sort`:`Sign ${String.fromCharCode(65+index)} placed. Tap to return it to the bank or drag to move.`);
    });
    root.querySelectorAll('[data-tree-pad]').forEach(pad=>{
      const index=state.treeAssignments.indexOf(pad.dataset.treePad);
      pad.classList.toggle('filled',index!==-1);
      pad.setAttribute('aria-label',index===-1?`${pad.dataset.treePad.replaceAll('-', ', ')}: place matching maze sign here`:`Sign ${String.fromCharCode(65+index)} placed here. Tap to return it to the card bank.`);
      pad.querySelector('.tree-pad-placeholder').hidden=index!==-1;
      const placed=pad.querySelector('[data-tree-pad-card]');
      if(index===-1)placed.replaceChildren();
      else{
        const sign=data.signTree[index];
        placed.innerHTML=`<span class="tree-sign-icon ${sign.shape.toLowerCase()} ${sign.colour.toLowerCase()}" aria-hidden="true">${sign.symbol==='Star'?'★':'➜'}</span><b aria-hidden="true">${String.fromCharCode(65+index)}</b>`;
      }
    });
  }
  function treeEdited(){
    state.solved.delete('tree');
    root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;
    const result=root.querySelector('[data-feedback="tree"]');
    result.textContent='Build your answer, then check it.';
    result.classList.remove('good','try');
  }
  function returnTree(index){
    if(state.treeAssignments[index]===null)return;
    state.treeAssignments[index]=null;
    state.treeSelected=null;
    treeEdited();
    refreshTree();
    root.querySelector('[data-tree-hint]').textContent=`Sign ${String.fromCharCode(65+index)} returned to the card bank. Choose a branch to place it again.`;
  }
  function placeTree(index,padKey){
    const correct=treeKey(data.signTree[index]);
    const pad=root.querySelector(`[data-tree-pad="${padKey}"]`);
    if(padKey!==correct){
      pad?.classList.add('rejected-target');
      setTimeout(()=>pad?.classList.remove('rejected-target'),700);
      root.querySelector('[data-tree-hint]').textContent=`Sign ${String.fromCharCode(65+index)} does not match all three clues for that pad. Try another branch.`;
      return;
    }
    state.treeAssignments[index]=padKey;
    state.treeSelected=null;
    treeEdited();
    refreshTree();
    root.querySelector('[data-tree-hint]').textContent=`Sign ${String.fromCharCode(65+index)} placed at ${padKey.replaceAll('-', ' → ')}.`;
  }
  let treeDrag=null;
  let suppressTreeClick=null;
  function clearTreeDrag(){
    if(!treeDrag)return;
    treeDrag.source.classList.remove('drag-source');
    treeDrag.ghost?.remove();
    treeDrag=null;
    root.querySelectorAll('[data-tree-pad]').forEach(pad=>pad.classList.remove('drop-preview','drop-reject-preview'));
  }
  root.addEventListener('pointerdown',event=>{
    const card=event.target.closest?.('[data-tree-card], [data-tree-pad].filled');
    if(!card || (event.pointerType==='mouse' && event.button!==0))return;
    const index=card.dataset.treeCard!==undefined?Number(card.dataset.treeCard):state.treeAssignments.indexOf(card.dataset.treePad);
    if(index<0)return;
    treeDrag={pointerId:event.pointerId,index,source:card,startX:event.clientX,startY:event.clientY,active:false,ghost:null};
    card.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove',event=>{
    if(!treeDrag || event.pointerId!==treeDrag.pointerId)return;
    if(!treeDrag.active && Math.hypot(event.clientX-treeDrag.startX,event.clientY-treeDrag.startY)<8)return;
    event.preventDefault();
    if(!treeDrag.active){
      treeDrag.active=true;
      treeDrag.source.classList.add('drag-source');
      treeDrag.ghost=document.createElement('div');
      treeDrag.ghost.className='venn-drag-ghost tree-drag-ghost';
      treeDrag.ghost.innerHTML=treeDrag.source.innerHTML;
      document.body.appendChild(treeDrag.ghost);
    }
    treeDrag.ghost.style.left=`${event.clientX}px`;
    treeDrag.ghost.style.top=`${event.clientY}px`;
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-tree-pad]')?.dataset.treePad;
    const correct=treeKey(data.signTree[treeDrag.index]);
    root.querySelectorAll('[data-tree-pad]').forEach(pad=>{
      pad.classList.toggle('drop-preview',pad.dataset.treePad===target&&target===correct);
      pad.classList.toggle('drop-reject-preview',pad.dataset.treePad===target&&target!==correct);
    });
  });
  root.addEventListener('pointerup',event=>{
    if(!treeDrag || event.pointerId!==treeDrag.pointerId)return;
    if(treeDrag.active){
      event.preventDefault();
      const index=treeDrag.index,hit=document.elementFromPoint(event.clientX,event.clientY),target=hit?.closest('[data-tree-pad]')?.dataset.treePad;
      suppressTreeClick=index;
      setTimeout(()=>{if(suppressTreeClick===index)suppressTreeClick=null;},0);
      clearTreeDrag();
      if(target)placeTree(index,target);
      else if(hit?.closest('.tree-bank'))returnTree(index);
    }else clearTreeDrag();
  });
  root.addEventListener('pointercancel',()=>clearTreeDrag());
  function refreshRouteSort() {
    root.querySelectorAll('[data-route-pad]').forEach(pad=>{
      const active=pad.dataset.routePad===state.routePadSelected;
      pad.classList.toggle('active-target',active);
      pad.querySelector('[data-route-drop]').setAttribute('aria-pressed',String(active));
    });
    root.querySelectorAll('[data-route-card]').forEach(btn=>{
      const i=Number(btn.dataset.routeCard), assigned=state.routeAssignments[i];
      btn.classList.toggle('selected',i===state.routeSelected);
      btn.classList.toggle('assigned',assigned!==null);
      btn.setAttribute('aria-pressed',String(i===state.routeSelected));
      btn.setAttribute('aria-label',assigned===null?`Vote card ${i+1}: ${data.routeCards[i]} maze path. Tap or drag to a matching pad.`:`Vote card ${i+1}: ${data.routeCards[i]} maze path. Placed in ${assigned}. Tap to return it or drag to move.`);
      btn.title=assigned===null?'Not sorted yet':`Placed in ${assigned}; tap to return`;
    });
    root.querySelectorAll('[data-route-tally]').forEach(el=>{
      const count=state.routeAssignments.filter(x=>x===el.dataset.routeTally).length;
      const tallies=state.routeTallies[data.categories.indexOf(el.dataset.routeTally)];
      el.textContent=`${count} card${count===1?'':'s'} · ${tallies} tallied`;
    });
    if(isInspire)for(const name of data.categories){
      const count=state.routeAssignments.filter(x=>x===name).length;
      const tallies=state.routeTallies[data.categories.indexOf(name)];
      root.querySelector(`[data-table-count="${name}"]`).textContent=`${count} card${count===1?'':'s'} sorted`;
      root.querySelector(`[data-table-tally="${name}"]`).textContent=`${tallies} tally mark${tallies===1?'':'s'}`;
    }
    const sorted=state.routeAssignments.filter(name=>name!==null).length;
    root.querySelectorAll('[data-graph-progress]').forEach(el=>{el.textContent=sorted===data.routeCards.length?`All ${sorted} cards sorted. Use these counts to graph.`:`${sorted} of ${data.routeCards.length} cards sorted so far. These counts are not complete yet.`;});
    for(const name of data.categories){
      const count=state.routeAssignments.filter(assignment=>assignment===name).length;
      const tallies=state.routeTallies[data.categories.indexOf(name)];
      root.querySelectorAll(`[data-graph-count="${name}"]`).forEach(el=>{el.textContent=String(count);});
      root.querySelectorAll(`[data-graph-tally="${name}"]`).forEach(el=>{el.textContent=String(tallies);});
    }
    root.querySelectorAll('[data-tally-marks]').forEach(el=>{
      const count=state.routeTallies[data.categories.indexOf(el.dataset.tallyMarks)];
      const group=n=>`<span class="tally-group">${Array.from({length:Math.min(n,4)},(_,i)=>`<i class="tally-stroke tally-stroke-${i+1}"></i>`).join('')}${n===5?'<i class="tally-cross"></i>':''}</span>`;
      el.innerHTML=count?Array.from({length:Math.ceil(count/5)},(_,i)=>group(Math.min(5,count-i*5))).join(''):'Tap + Tally to start';
      el.setAttribute('aria-label',`${count} tally marks for ${el.dataset.tallyMarks}. Tap to add one.`);
    });
    root.querySelectorAll('[data-tally-remove]').forEach(btn=>btn.disabled=state.routeTallies[data.categories.indexOf(btn.dataset.tallyRemove)]===0);
    root.querySelectorAll('[data-tally-add]').forEach(btn=>btn.disabled=state.routeTallies[data.categories.indexOf(btn.dataset.tallyAdd)]>=data.routeCards.length);
    root.querySelectorAll('[data-route-pad-cards]').forEach(el=>{
      const cards=state.routeAssignments.map((name,i)=>name===el.dataset.routePadCards?`<span class="pad-mini-card" data-route-return="${i}" title="Tap to return card ${i+1} to the bank">${i+1}</span>`:'').filter(Boolean);
      el.innerHTML=cards.join('');
    });
    refreshSortedGraph();
  }
  function refreshSortedGraph() {
    const graph=root.querySelector('[data-sorted-graph]');
    const ready=state.routeAssignments.every(name=>name!==null);
    graph.hidden=!ready;
    if(!ready){graph.innerHTML='';return;}
    const counts=data.categories.map(name=>state.routeAssignments.filter(assignment=>assignment===name).length);
    const summary=data.categories.map((name,i)=>`${name}: ${counts[i]}`).join('; ');
    if(isInspire){
      const top=14;
      graph.innerHTML=`<h4>Your sorted votes as a scaled bar graph</h4><p>Each horizontal grid step represents 2 student votes. This graph shows the cards accepted by the path pads. Compare the bar heights with your tally marks.</p><div class="sorted-bar-chart" role="img" aria-label="Bar graph from your sorted vote cards: ${summary}"><div class="sorted-axis">${Array.from({length:8},(_,i)=>`<span>${top-i*2}</span>`).join('')}</div><div class="sorted-bars">${data.categories.map((name,i)=>`<div class="sorted-bar-column"><span class="sorted-bar-count">${counts[i]}</span><div class="sorted-bar" style="height:${counts[i]/top*180}px"></div><strong>${name}</strong></div>`).join('')}</div></div><p class="key-note">Vertical axis: student votes · Horizontal axis: maze path · Source: your sorted vote cards</p>`;
    }else{
      graph.innerHTML=`<h4>Your sorted cards as a pictograph</h4><p>Each dot represents 1 vote. This graph shows the cards accepted by the path pads. Compare the dots with your tally marks.</p><div class="sorted-picture-chart" role="img" aria-label="Pictograph from your sorted cards: ${summary}">${data.categories.map((name,i)=>`<div class="sorted-picture-row"><strong>${name}</strong><span class="sorted-dots">${'<span class="sorted-dot" aria-hidden="true">●</span>'.repeat(counts[i])}</span><b>${counts[i]}</b></div>`).join('')}</div><p class="key-note">Key: ● = 1 vote · Source: your sorted cards</p>`;
    }
  }
  let routeDrag=null;
  let suppressRouteClick=null;
  function placeRoute(index,pad) {
    if(data.routeCards[index]!==pad){
      const target=[...root.querySelectorAll('[data-route-pad]')].find(el=>el.dataset.routePad===pad);
      if(target){
        target.classList.remove('rejected-target');
        void target.offsetWidth;
        target.classList.add('rejected-target');
        setTimeout(()=>target.classList.remove('rejected-target'),750);
      }
      root.querySelector('[data-route-hint]').textContent=`Card ${index+1} says ${data.routeCards[index]}. The ${pad} pad rejects it; try a matching pad.`;
      return false;
    }
    state.routeAssignments[index]=pad;
    state.routeSelected=null;
    state.routePadSelected=pad;
    state.solved.delete('route-sort');
    const result=root.querySelector('[data-feedback="route-sort"]');
    result.textContent='Build your answer, then check it.';
    result.classList.remove('good','try');
    root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;
    root.querySelector('[data-route-hint]').textContent=`Card ${index+1} placed in the ${pad} pad.`;
    refreshRouteSort();
    return true;
  }
  function returnRoute(index){
    if(state.routeAssignments[index]===null)return;
    state.routeAssignments[index]=null;
    state.routeSelected=null;
    state.routePadSelected=null;
    state.solved.delete('route-sort');
    const result=root.querySelector('[data-feedback="route-sort"]');
    result.textContent='Build your answer, then check it.';
    result.classList.remove('good','try');
    root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;
    root.querySelector('[data-route-hint]').textContent=`Card ${index+1} returned to the bank. Place it again when ready; adjust its tally if needed.`;
    refreshRouteSort();
  }
  function selectRoutePad(pad) {
    if(state.routeSelected!==null){placeRoute(state.routeSelected,pad);return;}
    state.routePadSelected=state.routePadSelected===pad?null:pad;
    refreshRouteSort();
  }
  function changeTally(name,amount) {
    const index=data.categories.indexOf(name);
    if(index<0)return;
    const next=state.routeTallies[index]+amount;
    if(next<0 || next>data.routeCards.length)return;
    state.routeTallies[index]=next;
    state.solved.delete('route-sort');
    const result=root.querySelector('[data-feedback="route-sort"]');
    result.textContent='Build your answer, then check it.';
    result.classList.remove('good','try');
    root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;
    refreshRouteSort();
  }
  function clearRouteDrag() {
    if(!routeDrag)return;
    routeDrag.source.classList.remove('drag-source');
    routeDrag.ghost?.remove();
    routeDrag=null;
    root.querySelectorAll('[data-route-pad]').forEach(el=>el.classList.remove('drop-preview','drop-reject-preview'));
  }
  root.addEventListener('pointerdown',event=>{
    const card=event.target.closest('[data-route-card], [data-route-return]');
    if(!card || (event.pointerType==='mouse' && event.button!==0))return;
    routeDrag={pointerId:event.pointerId,index:Number(card.dataset.routeCard ?? card.dataset.routeReturn),source:card,startX:event.clientX,startY:event.clientY,active:false,ghost:null};
    card.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove',event=>{
    if(!routeDrag || event.pointerId!==routeDrag.pointerId)return;
    if(!routeDrag.active && Math.hypot(event.clientX-routeDrag.startX,event.clientY-routeDrag.startY)<8)return;
    event.preventDefault();
    if(!routeDrag.active){
      routeDrag.active=true;
      routeDrag.source.classList.add('drag-source');
      routeDrag.ghost=document.createElement('div');
      routeDrag.ghost.className='venn-drag-ghost';
      routeDrag.ghost.textContent=routeDrag.source.textContent;
      document.body.appendChild(routeDrag.ghost);
    }
    routeDrag.ghost.style.left=`${event.clientX}px`;
    routeDrag.ghost.style.top=`${event.clientY}px`;
    const pad=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-route-pad]')?.dataset.routePad;
    const matches=pad===data.routeCards[routeDrag.index];
    root.querySelectorAll('[data-route-pad]').forEach(el=>{
      el.classList.toggle('drop-preview',el.dataset.routePad===pad&&matches);
      el.classList.toggle('drop-reject-preview',el.dataset.routePad===pad&&!matches);
    });
    if(pad)root.querySelector('[data-route-hint]').textContent=matches?`Release card ${routeDrag.index+1} on ${pad}.`:`The ${pad} pad will reject card ${routeDrag.index+1}.`;
  });
  root.addEventListener('pointerup',event=>{
    if(!routeDrag || event.pointerId!==routeDrag.pointerId)return;
    if(routeDrag.active){
      event.preventDefault();
      const index=routeDrag.index;
      const pad=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-route-pad]')?.dataset.routePad;
      suppressRouteClick=index;
      setTimeout(()=>{if(suppressRouteClick===index)suppressRouteClick=null;},0);
      clearRouteDrag();
      if(pad)placeRoute(index,pad);
      else if(document.elementFromPoint(event.clientX,event.clientY)?.closest('.route-cards'))returnRoute(index);
    } else clearRouteDrag();
  });
  root.addEventListener('pointercancel',()=>clearRouteDrag());
  function refreshAssistance(){
    root.querySelectorAll('[data-assist]').forEach(slider=>{
      const id=slider.dataset.assist;
      const value=assistance[id];
      const locked=Boolean(assistanceLocks[id]);
      const control=slider.closest('.assistance-control');
      slider.value=String(value ?? 0);
      slider.disabled=locked;
      slider.style.setProperty('--assist-color',({1:'#dbeafa',2:'#ebe0fa'})[value] || '#aab5b0');
      slider.style.setProperty('--assist-progress',`${(value ?? 0)/2*100}%`);
      slider.classList.toggle('recorded',value>0);
      slider.setAttribute('aria-valuetext',assistanceLevels[value]);
      control.classList.toggle('recorded',value>0);
      control.classList.toggle('locked',locked);
      control.querySelector('[data-assist-clear]').disabled=locked;
      const lockButton=control.querySelector('[data-assist-lock]');
      lockButton.textContent=locked?'🔒':'🔓';
      lockButton.setAttribute('aria-pressed',String(locked));
      lockButton.setAttribute('aria-label',`${locked?'Unlock':'Lock'} teacher assistance for ${root.querySelector(`#${id}-title`).textContent}`);
      lockButton.title=`${locked?'Unlock':'Lock'} slider (teacher code required)`;
    });
  }
  function saveAssistance(){
    try {localStorage.setItem(assistanceKey,JSON.stringify({_scale:2,...assistance}));} catch {}
    refreshAssistance();
  }
  function saveAssistanceLocks(){
    try {localStorage.setItem(assistanceLockKey,JSON.stringify(assistanceLocks));} catch {}
    refreshAssistance();
  }
  function refreshPicto() {root.querySelectorAll('[data-picto-row]').forEach(btn=>{const row=Number(btn.dataset.pictoRow),slot=Number(btn.dataset.pictoSlot);btn.classList.toggle('filled',slot<=state.picto[row]);btn.setAttribute('aria-pressed',String(slot<=state.picto[row]));});}
  function refreshBars(kind) {root.querySelectorAll(`[data-bar="${kind}"]`).forEach(btn=>{const row=Number(btn.dataset.row),units=Number(btn.dataset.units);btn.classList.toggle('filled',units<=state[kind][row]);btn.setAttribute('aria-pressed',String(units<=state[kind][row]));});}
  function refreshMulti() {root.querySelectorAll('[data-multi]').forEach(btn=>{const series=btn.dataset.multi,row=Number(btn.dataset.row),units=Number(btn.dataset.units);btn.classList.toggle('filled',units<=state[series][row]);btn.setAttribute('aria-pressed',String(units<=state[series][row]));});}
  function refreshMean(id){
    root.querySelectorAll(`[data-mean-square="${id}"]`).forEach(btn=>{
      const marked=state.meanMarks[id][Number(btn.dataset.squareIndex)];
      btn.classList.toggle('marked',marked);
      btn.setAttribute('aria-pressed',String(marked));
    });
    root.querySelector(`[data-mean-mark-count="${id}"]`).textContent=`Squares marked: ${state.meanMarks[id].filter(Boolean).length}`;
  }
  function refreshNumbers(){
    root.querySelectorAll('[data-number-choice]').forEach(btn=>{
      const chosen=state.numberChoices[btn.dataset.numberChoice]===Number(btn.dataset.choiceValue);
      btn.classList.toggle('selected',chosen);btn.setAttribute('aria-pressed',String(chosen));
    });
  }
  function refreshCombine(){
    for(const pad of root.querySelectorAll('[data-block-stack]')){
      const destination=pad.dataset.blockStack;
      pad.innerHTML=Object.entries(state.blockLocations).filter(([,location])=>location===destination).map(([id])=>{
        const type=id.split('-')[1],label=type==='hundreds'?'100 flat':type==='tens'?'10 rod':'1 cube';
        return `<button type="button" draggable="true" class="place-block movable ${destination!==id[0]?'transferred':''} ${state.blockSelected===id?'selected':''}" data-move-block="${id}" aria-label="${label}, in set ${destination.toUpperCase()}"><span class="place-block-face ${type}" aria-hidden="true"></span><span class="place-block-caption">${label}</span></button>`;
      }).join('');
    }
    root.querySelectorAll('[data-block-pad]').forEach(pad=>pad.classList.toggle('active-target',state.blockSelected!==null));
    root.querySelector('[data-block-undo]').disabled=state.blockMoveHistory.length===0;
  }
  function moveBlock(id,destination){
    if(!Object.hasOwn(state.blockLocations,id)||!['a','b'].includes(destination))return;
    const from=state.blockLocations[id];
    if(from===destination)return;
    state.blockMoveHistory.push({id,from});
    state.blockLocations[id]=destination;state.blockSelected=null;refreshCombine();
    state.solved.delete('combine');
    root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;
    const result=root.querySelector('[data-feedback="combine"]');
    result.textContent='Build your answer, then check it.';
    result.classList.remove('good','try');
    root.querySelector('[data-block-status]').textContent=`Block moved to Set ${destination.toUpperCase()}. Count both sets together, then choose the total.`;
  }
  function undoBlockMove(){
    const last=state.blockMoveHistory.pop();
    if(!last)return;
    state.blockLocations[last.id]=last.from;
    state.blockSelected=null;
    refreshCombine();
    state.solved.delete('combine');
    root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;
    const result=root.querySelector('[data-feedback="combine"]');
    result.textContent='Build your answer, then check it.';
    result.classList.remove('good','try');
    root.querySelector('[data-block-status]').textContent=`Last move undone. The block is back in Set ${last.from.toUpperCase()}.`;
  }
  function lineQuestion(id){return data.additionLines[id==='line-one'?0:1];}
  function blocksForValue(value){return {hundreds:Math.floor(value/100),tens:Math.floor(value%100/10),ones:value%10};}
  function refreshLine(id){
    const q=lineQuestion(id),jumps=state.lineJumps[id],moved=jumps.reduce((sum,n)=>sum+n,0);
    const value=q.start+moved;
    root.querySelector(`[data-line-start-blocks="${id}"]`).innerHTML=blockTiles(blocksForValue(q.start));
    root.querySelector(`[data-line-added-blocks="${id}"]`).innerHTML=moved?blockTiles(blocksForValue(moved)):'<span class="line-empty-blocks">Make a jump to add blocks.</span>';
    const difference=q.add-moved;
    root.querySelector(`[data-line-progress="${id}"]`).textContent=difference>0?`You have jumped ${moved} of ${q.add}. ${difference} left to add.`:difference===0?`You have jumped ${moved} of ${q.add}. You can still add or remove a jump.`:`You have jumped ${moved}, which is ${-difference} too far. Tap a jump to remove it.`;
    const svg=root.querySelector(`[data-line-svg="${id}"]`);
    const scale=Math.max(q.add,moved);
    let x=42;
    const arcs=jumps.map((jump,index)=>{
      const next=x+jump/scale*714,mid=(x+next)/2;
      const markup=`<g class="line-step" data-line-step="${id}" data-step-index="${index}" role="button" tabindex="0" aria-label="Remove jump ${index+1}, plus ${jump}"><title>Tap to remove jump +${jump}</title><path d="M ${x} 110 Q ${mid} ${Math.max(16,65-index*3)} ${next} 110" fill="none" stroke="transparent" stroke-width="22"/><path d="M ${x} 110 Q ${mid} ${Math.max(16,65-index*3)} ${next} 110" fill="none" stroke="#287c72" stroke-width="3"/><path d="M ${next-11} 103 L ${next} 110 L ${next-11} 117" fill="none" stroke="#287c72" stroke-width="3"/><text x="${mid}" y="${Math.max(28,59-index*3)}" text-anchor="middle" fill="#174c48" font-size="18" font-weight="bold">+${jump}</text></g>`;
      x=next;return markup;
    }).join('');
    svg.innerHTML=`<line x1="35" y1="110" x2="765" y2="110" stroke="#83a99c" stroke-width="5"/><circle cx="42" cy="110" r="8" fill="#174c48"/><text x="42" y="145" text-anchor="middle" fill="#183247" font-size="20" font-weight="bold">${q.start}</text>${arcs}${jumps.length?`<circle cx="${x}" cy="110" r="8" fill="#e87654"/><text x="${x}" y="145" text-anchor="middle" fill="#183247" font-size="20" font-weight="bold">?</text>`:''}`;
    root.querySelectorAll(`[data-line-jump="${id}"]`).forEach(btn=>btn.disabled=Number(btn.dataset.jumpValue)>999-value);
    root.querySelector(`[data-custom-add="${id}"]`).disabled=value>=999;
    root.querySelector(`[data-line-undo="${id}"]`).disabled=jumps.length===0;
  }
  function addLineJump(id,value){
    const q=lineQuestion(id),moved=state.lineJumps[id].reduce((sum,n)=>sum+n,0);
    if(!Number.isInteger(value)||value<1||q.start+moved+value>999){
      const available=999-q.start-moved;
      root.querySelector(`[data-line-progress="${id}"]`).textContent=available>0?`Choose a whole-number jump between 1 and ${available}.`:'This three-digit number line is full. Tap a jump to remove it.';
      return;
    }
    state.lineJumps[id].push(value);refreshLine(id);
    state.solved.delete(id);
    root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;
    const result=root.querySelector(`[data-feedback="${id}"]`);
    result.textContent='Count the blocks, enter your landing number, then check it.';
    result.classList.remove('good','try');
  }
  function removeLineJump(id,index){
    if(!state.lineJumps[id] || index<0 || index>=state.lineJumps[id].length)return;
    state.lineJumps[id].splice(index,1);
    refreshLine(id);
    state.solved.delete(id);
    root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;
    const result=root.querySelector(`[data-feedback="${id}"]`);
    result.textContent='Jump removed. Count the blocks, enter your landing number, then check it.';
    result.classList.remove('good','try');
  }
  function feedback(id,ok,msg) {const el=root.querySelector(`[data-feedback="${id}"]`);el.textContent=msg;el.classList.toggle('good',ok);el.classList.toggle('try',!ok);if(ok && !['stem','multiple'].includes(id))state.solved.add(id);root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;}
  function check(id) {
    if(id==='sort'){
      const good=state.venn.every((zone,i)=>zone===zoneFor(data.venn[i]));
      const extra=!isInspire || Number(root.querySelector('[data-answer="glow-both"]').value)===1;
      return feedback(id,good&&extra,good&&extra?'Great sorting! Every object matches the rules.':'Check both rules for each card: round or not round, striped or not striped. A round striped card goes in the overlap.'+(isInspire?' Then count the glowing cards there.':''));
    }
    if(id==='tree'){
      const placed=state.treeAssignments.filter(Boolean).length;
      const good=state.treeAssignments.every((pad,i)=>pad===treeKey(data.signTree[i]));
      return feedback(id,good,good?'All eight signs follow the shape, colour, and symbol branches.':`You have placed ${placed} of 8 signs. Follow all three clues for each remaining card.`);
    }
    if(id==='route-sort'){
      const cardsGood=state.routeAssignments.every((name,i)=>name===data.routeCards[i]);
      const talliesGood=state.routeTallies.every((count,i)=>count===data.counts[i]);
      const good=cardsGood && talliesGood;
      return feedback(id,good,good?'Cards and tally marks match. Use your tallies to build the graphs!':!cardsGood?'Place every numbered card in its matching path pad.':'Check your tally marks against the cards in each pad. Use Undo tally to fix a count.');
    }
    if(id==='table'){
      const values=[...root.querySelectorAll('[data-frequency]')].map(el=>el.value===''?null:Number(el.value));
      const good=values.every((value,i)=>value===data.counts[i]);
      return feedback(id,good,good?'Your frequency table matches the path data.':'Count the path cards or compare each row with your tallies above.');
    }
    if(['picto','vertical','horizontal'].includes(id)){
      const answer=state[id].map(n=>n*data.scale),good=answer.every((v,i)=>v===data.counts[i]);
      return feedback(id,good,good?'Every path matches the data. Nice graph!':`Check the key: each ${id==='picto'?'picture':'block'} represents ${data.scale}.`);
    }
    if(id==='reason'){
      const get=name=>root.querySelector(`[data-answer="${name}"]`).value;
      const good=isInspire ? get('route-mode')==='Loop' && Number(get('mean'))===6 && Number(get('number-mode'))===6 && Number(get('difference'))===4 && get('mean-meaning')==='equal-share' && get('number-mode-meaning')==='most-often' && get('decision')==='loop' : get('route-mode')==='Garden' && Number(get('difference'))===3 && get('mode-meaning')==='most' && get('decision')==='garden';
      return feedback(id,good,good?'You used the data to explain the measures and support a decision.':'Check the greatest count, the difference, and what the mean or mode actually tells you.');
    }
    if(id==='mean-four'||id==='mean-five'){
      const children=data.foodDrive[id==='mean-four'?'four':'five'];
      const total=children.reduce((sum,child)=>sum+child.cans,0);
      const marked=state.meanMarks[id].filter(Boolean).length;
      const totalInput=root.querySelector(`[data-mean-total="${id}"]`).value;
      const meanInput=root.querySelector(`[data-mean-answer="${id}"]`).value;
      const good=marked===total && totalInput!=='' && Number(totalInput)===total && meanInput!=='' && Number(meanInput)===total/children.length;
      const hint=marked!==total?'Count all the can pictures and mark one square for each can.':totalInput===''||Number(totalInput)!==total?'Enter the total number of cans you counted.':'Divide the total by the number of children to find the equal share.';
      return feedback(id,good,good?`Correct: ${total} cans shared by ${children.length} children gives a mean of ${total/children.length} cans per child.`:hint);
    }
    if(id.startsWith('name-')){
      const index=['name-one','name-two','name-three'].indexOf(id),q=data.numberQuestions[index];
      const good=state.numberChoices[id]===valueOfBlocks(q);
      return feedback(id,good,good?'Yes! Count the hundreds, tens, and ones to name the number.':'Look at how many 100 flats, 10 rods, and 1 cubes are shown.');
    }
    if(id==='combine'){
      const total=valueOfBlocks(data.combineQuestion.a)+valueOfBlocks(data.combineQuestion.b);
      const good=state.numberChoices.combine===total;
      return feedback(id,good,good?'Correct! Both sets together show the combined number.':'Count the block values in Set A and Set B together, then choose the combined number.');
    }
    if(id==='line-one'||id==='line-two'){
      const q=lineQuestion(id),jumpTotal=state.lineJumps[id].reduce((sum,n)=>sum+n,0);
      const good=jumpTotal===q.add&&state.numberChoices[id]===q.start+q.add;
      return feedback(id,good,good?'Correct! Your jumps and chosen answer agree.':jumpTotal!==q.add?`Use jumps to add exactly ${q.add} altogether.`:'Count the starting and added blocks, then choose the matching number.');
    }
    if(id==='stem'){
      const good=Object.entries(data.preview.stems).every(([stem,leaves])=>[...root.querySelectorAll(`[data-stem="${stem}"] select`)].map(select=>select.value).join(' ')===leaves);
      return feedback(id,good,good?'The leaves are in order. Each stem shows the tens digit.':'Write each ones digit in increasing order beside its tens stem.');
    }
    if(id==='multiple'){
      const good=['morning','afternoon'].every(series=>state[series].every((v,i)=>v*2===data.preview[series][i]));
      return feedback(id,good,good?'Both classes’ bars match their vote counts.':'Read the Class A and Class B columns separately. Each block means two votes.');
    }
  }
  function reset(id) {
    if(id==='sort'){state.venn.fill(null);state.selected=null;state.vennPadSelected=null;clearVennDrag();vennHint.textContent='Tap a region pad, then tap an object; or drag an object into the diagram.';refreshVenn();}
    if(id==='tree'){state.treeAssignments.fill(null);state.treeSelected=null;clearTreeDrag();refreshTree();root.querySelector('[data-tree-hint]').textContent='Choose a sign card, then follow its three clues.';}
    if(id==='route-sort'){
      state.routeAssignments.fill(null);state.routeTallies.fill(0);state.routeSelected=null;state.routePadSelected=null;refreshRouteSort();
      root.querySelector('[data-route-hint]').textContent='Choose a path pad and place the matching vote cards.';
    }
    if(id==='table')root.querySelectorAll('[data-frequency]').forEach(x=>x.value='');
    if(id==='picto'){state.picto.fill(0);refreshPicto();}
    if(id==='vertical'||id==='horizontal'){state[id].fill(0);refreshBars(id);}
    if(id==='reason')root.querySelectorAll('[data-answer]').forEach(x=>{if(x.closest('#reason'))x.value='';});
    if(id==='mean-four'||id==='mean-five'){
      state.meanMarks[id].fill(false);refreshMean(id);
      root.querySelector(`[data-mean-total="${id}"]`).value='';
      root.querySelector(`[data-mean-answer="${id}"]`).value='';
      root.querySelector(`[data-mean-calculation="${id}"]`).textContent='?';
    }
    if(id.startsWith('name-')){delete state.numberChoices[id];refreshNumbers();}
    if(id==='combine'){
      for(const key of Object.keys(state.blockLocations))state.blockLocations[key]=key[0];
      state.blockSelected=null;state.blockMoveHistory=[];delete state.numberChoices.combine;refreshCombine();refreshNumbers();
      root.querySelector('[data-block-status]').textContent='Move blocks between Set A and Set B if it helps you count. Then choose the total below.';
    }
    if(id==='line-one'||id==='line-two'){
      state.lineJumps[id]=[];delete state.numberChoices[id];root.querySelector(`[data-custom-jump="${id}"]`).value='';refreshNumbers();refreshLine(id);
    }
    if(id==='stem')root.querySelectorAll('[data-stem] select').forEach(x=>x.value='');
    if(id==='multiple'){state.morning.fill(0);state.afternoon.fill(0);refreshMulti();}
    state.solved.delete(id);
    root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;
    const el=root.querySelector(`[data-feedback="${id}"]`);el.textContent='Build your answer, then check it.';el.classList.remove('good','try');
  }
  root.addEventListener('input',event=>{
    if(event.target.matches('[data-mean-total]'))root.querySelector(`[data-mean-calculation="${event.target.dataset.meanTotal}"]`).textContent='?';
    if(!event.target.matches('[data-assist]'))return;
    const id=event.target.dataset.assist;
    if(assistanceLocks[id]){refreshAssistance();return;}
    assistance[id]=Number(event.target.value);
    saveAssistance();
  });
  root.addEventListener('change',event=>{
    if(!event.target.matches('[data-assist]'))return;
    const id=event.target.dataset.assist;
    if(assistanceLocks[id])return;
    assistance[id]=Number(event.target.value);
    assistanceLocks[id]=true;
    saveAssistance();
    saveAssistanceLocks();
  });
  root.addEventListener('submit',event=>{
    const form=event.target.closest('[data-assist-code]');
    if(!form)return;
    event.preventDefault();
    const id=form.dataset.assistCode;
    if(form.querySelector('input').value.trim()!=='5'){
      form.querySelector('.assistance-code-error').textContent='Enter 5';
      return;
    }
    assistanceLocks[id]=!assistanceLocks[id];
    saveAssistanceLocks();
    form.reset();
    form.hidden=true;
    form.querySelector('.assistance-code-error').textContent='';
    root.querySelector(`[data-assist-lock="${id}"]`).focus();
  });
  function selectVennChip(chip){
    const i=Number(chip.dataset.chip);
    if(suppressChipClick===i){suppressChipClick=null;return;}
    if(state.venn[i]!==null){returnVenn(i);return;}
    if(state.vennPadSelected!==null){placeVenn(i,state.vennPadSelected);return;}
    state.selected=i;
    vennHint.textContent=`Object ${i+1} selected. Tap a region in the diagram or a pad.`;
    refreshVenn();
  }
  root.addEventListener('keydown',event=>{
    const token=event.target.closest?.('[data-svg-tokens] [data-chip]');
    if(!token || !['Enter',' '].includes(event.key))return;
    event.preventDefault();
    selectVennChip(token);
  });
  root.addEventListener('keydown',event=>{
    const step=event.target.closest?.('[data-line-step]');
    if(!step || !['Enter',' '].includes(event.key))return;
    event.preventDefault();
    removeLineJump(step.dataset.lineStep,Number(step.dataset.stepIndex));
  });
  let suppressLineClick=null;
  root.addEventListener('click', event=>{
    const step=event.target.closest?.('[data-line-step]');
    if(step){removeLineJump(step.dataset.lineStep,Number(step.dataset.stepIndex));return;}
    const vennPlaced=event.target.closest?.('[data-venn-return]');
    if(vennPlaced){const index=Number(vennPlaced.dataset.vennReturn);if(suppressChipClick===index){suppressChipClick=null;return;}returnVenn(index);return;}
    const routePlaced=event.target.closest?.('[data-route-return]');
    if(routePlaced){const index=Number(routePlaced.dataset.routeReturn);if(suppressRouteClick===index){suppressRouteClick=null;return;}returnRoute(index);return;}
    const treeCard=event.target.closest?.('[data-tree-card]');
    if(treeCard){
      const index=Number(treeCard.dataset.treeCard);
      if(suppressTreeClick===index){suppressTreeClick=null;return;}
      if(state.treeAssignments[index]!==null){returnTree(index);return;}
      state.treeSelected=state.treeSelected===index?null:index;
      refreshTree();
      root.querySelector('[data-tree-hint]').textContent=state.treeSelected===null?'Choose a sign card.':`Sign ${String.fromCharCode(65+index)} selected. Tap its final branch pad.`;
      return;
    }
    const treePad=event.target.closest?.('[data-tree-pad]');
    if(treePad){
      if(state.treeSelected!==null)placeTree(state.treeSelected,treePad.dataset.treePad);
      else {
        const index=state.treeAssignments.indexOf(treePad.dataset.treePad);
        if(index!==-1){if(suppressTreeClick===index){suppressTreeClick=null;return;}returnTree(index);}
        else root.querySelector('[data-tree-hint]').textContent='Choose a sign card first, then tap this pad.';
      }
      return;
    }
    const placeButton=event.target.closest?.('[data-block-drop]');
    if(placeButton){
      if(state.blockSelected)moveBlock(state.blockSelected,placeButton.dataset.blockDrop);
      return;
    }
    const chip=event.target.closest?.('[data-chip]');
    if(chip){selectVennChip(chip);return;}
    const diagram=event.target.closest?.('[data-venn-diagram]');
    if(diagram){
      const zone=diagramZoneAt(event.clientX,event.clientY);
      if(zone)selectVennPad(zone);
      return;
    }
    const padSurface=event.target.closest?.('[data-route-pad]');
    if(padSurface && !event.target.closest('button')){
      selectRoutePad(padSurface.dataset.routePad);
      return;
    }
    const btn=event.target.closest('button');if(!btn)return;
    if(btn.dataset.blockUndo!==undefined){undoBlockMove();return;}
    if(btn.dataset.moveBlock!==undefined){state.blockSelected=btn.dataset.moveBlock;refreshCombine();root.querySelector('[data-block-status]').textContent='Block selected. Tap the other set’s Move selected block here button.';return;}
    if(btn.dataset.numberChoice!==undefined){state.numberChoices[btn.dataset.numberChoice]=Number(btn.dataset.choiceValue);refreshNumbers();return;}
    if(btn.dataset.lineJump!==undefined){if(suppressLineClick===btn){suppressLineClick=null;return;}addLineJump(btn.dataset.lineJump,Number(btn.dataset.jumpValue));return;}
    if(btn.dataset.customAdd!==undefined){const id=btn.dataset.customAdd,input=root.querySelector(`[data-custom-jump="${id}"]`);addLineJump(id,Number(input.value));input.value='';return;}
    if(btn.dataset.lineUndo!==undefined){const id=btn.dataset.lineUndo;removeLineJump(id,state.lineJumps[id].length-1);return;}
    if(btn.dataset.assistLock!==undefined){
      const id=btn.dataset.assistLock;
      const form=root.querySelector(`[data-assist-code="${id}"]`);
      form.hidden=!form.hidden;
      form.querySelector('.assistance-code-error').textContent='';
      if(!form.hidden)form.querySelector('input').focus();
      return;
    }
    if(btn.dataset.assistClear!==undefined){if(assistanceLocks[btn.dataset.assistClear])return;assistance[btn.dataset.assistClear]=0;saveAssistance();return;}
    if(btn.dataset.meanSquare!==undefined){
      const id=btn.dataset.meanSquare,index=Number(btn.dataset.squareIndex);
      state.meanMarks[id][index]=!state.meanMarks[id][index];
      refreshMean(id);
      state.solved.delete(id);
      root.querySelector('[data-progress]').textContent=`${state.solved.size} of ${coreCount} core activities checked`;
      const result=root.querySelector(`[data-feedback="${id}"]`);
      result.textContent='Count all the cans, enter the total, then find the mean.';
      result.classList.remove('good','try');
      return;
    }
    if(btn.dataset.meanDivide!==undefined){
      const id=btn.dataset.meanDivide,children=data.foodDrive[id==='mean-four'?'four':'five'].length;
      const input=root.querySelector(`[data-mean-total="${id}"]`).value;
      const result=root.querySelector(`[data-mean-calculation="${id}"]`);
      const total=Number(input);
      result.textContent=input!==''&&Number.isInteger(total)&&total>=0&&total<=30?String(Number((total/children).toFixed(2))):'Enter a total from 0 to 30';
      return;
    }
    if(btn.dataset.zone!==undefined){selectVennPad(btn.dataset.zone);return;}
    if(btn.dataset.routeCard!==undefined){const i=Number(btn.dataset.routeCard);if(suppressRouteClick===i){suppressRouteClick=null;return;}if(state.routeAssignments[i]!==null){returnRoute(i);return;}if(state.routePadSelected!==null)placeRoute(i,state.routePadSelected);else{state.routeSelected=i;refreshRouteSort();}return;}
    if(btn.dataset.tallyAdd!==undefined){changeTally(btn.dataset.tallyAdd,1);return;}
    if(btn.dataset.tallyRemove!==undefined){changeTally(btn.dataset.tallyRemove,-1);return;}
    if(btn.dataset.routeDrop!==undefined){selectRoutePad(btn.dataset.routeDrop);return;}
    if(btn.dataset.pictoRow!==undefined){const row=Number(btn.dataset.pictoRow),slot=Number(btn.dataset.pictoSlot);state.picto[row]=state.picto[row]===slot?0:slot;refreshPicto();return;}
    if(btn.dataset.bar){const kind=btn.dataset.bar,row=Number(btn.dataset.row),units=Number(btn.dataset.units);state[kind][row]=state[kind][row]===units?0:units;refreshBars(kind);return;}
    if(btn.dataset.multi){const series=btn.dataset.multi,row=Number(btn.dataset.row),units=Number(btn.dataset.units);state[series][row]=state[series][row]===units?0:units;refreshMulti();return;}
    if(btn.dataset.check)check(btn.dataset.check);
    if(btn.dataset.reset)reset(btn.dataset.reset);
  });
  let lineDrag=null;
  function clearLineDrag(){
    if(!lineDrag)return;
    lineDrag.source.classList.remove('drag-source');
    lineDrag.ghost?.remove();
    root.querySelectorAll('[data-line-svg]').forEach(svg=>svg.classList.remove('drop-target'));
    lineDrag=null;
  }
  root.addEventListener('pointerdown',event=>{
    const jump=event.target.closest?.('[data-line-jump]');
    if(!jump || jump.disabled || (event.pointerType==='mouse' && event.button!==0))return;
    lineDrag={pointerId:event.pointerId,source:jump,id:jump.dataset.lineJump,value:Number(jump.dataset.jumpValue),startX:event.clientX,startY:event.clientY,active:false,ghost:null};
    jump.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove',event=>{
    if(!lineDrag || lineDrag.pointerId!==event.pointerId)return;
    if(!lineDrag.active && Math.hypot(event.clientX-lineDrag.startX,event.clientY-lineDrag.startY)<8)return;
    event.preventDefault();
    if(!lineDrag.active){
      lineDrag.active=true;
      lineDrag.source.classList.add('drag-source');
      lineDrag.ghost=document.createElement('div');
      lineDrag.ghost.className='venn-drag-ghost';
      lineDrag.ghost.textContent=`+${lineDrag.value}`;
      document.body.appendChild(lineDrag.ghost);
    }
    lineDrag.ghost.style.left=`${event.clientX}px`;
    lineDrag.ghost.style.top=`${event.clientY}px`;
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-line-svg]');
    root.querySelectorAll('[data-line-svg]').forEach(svg=>svg.classList.toggle('drop-target',svg===target&&svg.dataset.lineSvg===lineDrag.id));
  });
  root.addEventListener('pointerup',event=>{
    if(!lineDrag || lineDrag.pointerId!==event.pointerId)return;
    if(!lineDrag.active){clearLineDrag();return;}
    event.preventDefault();
    const {id,value,source}=lineDrag;
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-line-svg]');
    suppressLineClick=source;
    setTimeout(()=>{if(suppressLineClick===source)suppressLineClick=null;},400);
    clearLineDrag();
    if(target?.dataset.lineSvg===id)addLineJump(id,value);
    else root.querySelector(`[data-line-progress="${id}"]`).textContent='Drop the jump on the number line, or tap its button.';
  });
  root.addEventListener('pointercancel',()=>clearLineDrag());
  root.addEventListener('dragstart',event=>{
    const block=event.target.closest?.('[data-move-block]');if(!block)return;
    state.blockSelected=block.dataset.moveBlock;
    event.dataTransfer.setData('text/plain',block.dataset.moveBlock);event.dataTransfer.effectAllowed='move';
  });
  root.addEventListener('dragover',event=>{if(event.target.closest?.('[data-block-pad]'))event.preventDefault();});
  root.addEventListener('drop',event=>{const pad=event.target.closest?.('[data-block-pad]');if(!pad)return;event.preventDefault();moveBlock(event.dataTransfer.getData('text/plain')||state.blockSelected,pad.dataset.blockPad);});
  refreshVenn();if(isInspire)refreshTree();refreshRouteSort();refreshPicto();refreshBars('vertical');refreshBars('horizontal');if(isInspire){refreshMulti();refreshMean('mean-four');refreshMean('mean-five');}refreshNumbers();refreshCombine();refreshLine('line-one');refreshLine('line-two');refreshAssistance();
})();
