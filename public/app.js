const $=s=>document.querySelector(s);let me=null,players=[],lineups=[],page='overview',draft=null,flushDraft=null;window.addEventListener('pagehide',()=>flushDraft&&flushDraft());
const api=async(url,opts={})=>{const r=await fetch(url,{headers:{'Content-Type':'application/json'},...opts});const d=await r.json();if(!r.ok)throw Error(d.error||'Xatolik');return d};
function toast(t){let e=document.createElement('div');e.className='toast';e.textContent=t;document.body.append(e);setTimeout(()=>e.remove(),2600)}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function login(){ $('#app').innerHTML=`<div class="login-wrap"><form class="login" id="login"><div class="brand">9-V <b>SCORED</b></div><div class="sub">CLASS FOOTBALL MANAGEMENT SYSTEM</div><div class="field"><label>LOGIN / EMAIL</label><input name="email" type="email" placeholder="Email manzilingiz" required></div><div class="field"><label>PAROL</label><input name="password" type="password" placeholder="Parolingiz" required></div><div class="error" id="err"></div><button class="btn full">Tizimga kirish →</button></form></div>`;$('#login').onsubmit=async e=>{e.preventDefault();let f=new FormData(e.target);try{await api('/api/login',{method:'POST',body:JSON.stringify(Object.fromEntries(f))});await boot()}catch(x){$('#err').textContent=x.message}}}
async function boot(){try{me=await api('/api/me');players=await api('/api/players');lineups=await api('/api/lineups');draft=me.role==='admin'?(await api('/api/draft')).draft:null;render()}catch(e){login()}}
function shell(content){$('#app').innerHTML=`<div class="layout"><aside class="sidebar"><div class="brand">9-V <b>SCORED</b></div><div class="sub">FOOTBALL MANAGEMENT</div><nav class="nav">${(me.role==='admin'?[['overview','◈ Overview'],['players','♙ Players'],['lineup','⚽ Lineup Builder'],['teams','▣ Saved Lineups']]:[['overview','◈ Overview'],['players','♙ Players'],['teams','▣ Team Lineups']]).map(([id,n])=>`<button class="${page===id?'active':''}" data-page="${id}">${n}</button>`).join('')}</nav><div class="side-foot">SIGNED IN AS<br><b>${esc(me.name)}</b><br><br>9-V SCORED © 2026</div></aside><main class="main"><div class="top"><div><div class="muted" style="font-size:12px">9-V SCORED / ${me.role.toUpperCase()}</div><h1>${({overview:'Dashboard',players:'Players & Statistics',lineup:'Tactical Lineup Builder',teams:'Saved Team Lineups'})[page]}</h1></div><button class="btn secondary" id="logout">Chiqish ↗</button></div>${content}</main></div>`;document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{flushDraft&&flushDraft();flushDraft=null;page=b.dataset.page;render()});$('#logout').onclick=async()=>{flushDraft&&flushDraft();flushDraft=null;await api('/api/logout',{method:'POST'});me=null;login()}}
function render(){if(page==='players')return playersPage();if(page==='lineup')return lineupPage();if(page==='teams')return teamsPage();overviewPage()}
function overviewPage(){let total=k=>players.reduce((a,p)=>a+(Number(p[k])||0),0),top=[...players].sort((a,b)=>b.goals-a.goals)[0];shell(`<div class="grid"><div class="card stat"><small>JAMI FUTBOLCHI</small><strong>${players.length}/16</strong></div><div class="card stat"><small>JAMI GOLLAR</small><strong>${total('goals')}</strong></div><div class="card stat"><small>JAMI ASSISTLAR</small><strong>${total('assists')}</strong></div><div class="card stat"><small>JAMI O'YINLAR</small><strong>${total('matches')}</strong></div></div><div class="section grid grid-2-1"><div class="card"><h2>🏆 Top Scorer</h2>${top?`<h1 style="color:var(--green)">${esc(top.name)}</h1><p class="muted">${top.goals} ta gol · ${top.assists} ta assist</p>`:'<p class="muted">Hozircha futbolchilar qo‘shilmagan.</p>'}</div><div class="card"><h2>TEAM STATUS</h2><div class="brand">9-V <b>SCORED</b></div><p class="muted">Class football platform</p><span class="pill">SYSTEM ONLINE</span></div></div><div class="section card"><h2>So'nggi futbolchilar</h2>${players.slice(0,5).map(p=>`<p>⚽ ${esc(p.name)} <span class="muted">— ${p.goals} gol, ${p.assists} assist</span></p>`).join('')||'<p class="muted">Futbolchilar hali qo‘shilmagan.</p>'}</div>`)}
function playersPage(){shell(`<div class="toolbar"><input id="search" placeholder="Futbolchi qidirish...">${me.role==='admin'?'<button class="btn" id="add">+ Futbolchi qo‘shish</button>':''}</div><div class="player-grid" id="cards">${playerCards(players)}</div>`);$('#search').oninput=e=>$('#cards').innerHTML=playerCards(players.filter(p=>p.name.toLowerCase().includes(e.target.value.toLowerCase())));if(me.role==='admin')$('#add').onclick=()=>playerModal()}
function playerCards(arr){return arr.map(p=>`<div class="card player"><div class="avatar">${esc(p.avatar||'⚽')}</div><h3>${esc(p.name)}</h3><span class="pill">${esc(p.position||'PLAYER')} · #${p.number||'—'}</span><div class="nums"><div><b>${p.goals||0}</b>GOLLAR</div><div><b>${p.assists||0}</b>ASSIST</div><div><b>${p.matches||0}</b>O'YIN</div><div><b>${p.rated?(p.ratingTotal/p.rated).toFixed(1):'–'}</b>BAHO</div></div>${me.role==='admin'?`<div class="actions" style="justify-content:center;margin-top:14px"><button class="btn secondary small" onclick="editPlayer('${p.id}')">Tahrirlash</button><button class="btn danger small" onclick="delPlayer('${p.id}')">O'chirish</button></div>`:''}</div>`).join('')||'<p class="muted">Futbolchilar topilmadi.</p>'}
function modal(title,html,submit){let bg=document.createElement('div');bg.className='modal-bg';bg.innerHTML=`<div class="modal"><div class="modal-head"><h2>${title}</h2><button class="close">×</button></div>${html}</div>`;document.body.append(bg);bg.querySelector('.close').onclick=()=>bg.remove();bg.onclick=e=>{if(e.target===bg)bg.remove()};if(submit)bg.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await submit(new FormData(e.target));bg.remove();await boot();toast('Saqlandi!')}catch(x){toast(x.message)}}}
function playerModal(p={}){modal(p.id?'Futbolchini tahrirlash':'Yangi futbolchi',`<form><div class="field"><label>ISM FAMILIYA</label><input name="name" value="${esc(p.name||'')}" required></div><div class="field"><label>LOGIN / EMAIL</label><input name="email" type="email" value="${esc(p.email||'')}" required></div><div class="field"><label>${p.id?'Yangi parol (ixtiyoriy)':'PAROL'}</label><input name="password" type="password" ${p.id?'':'required'}></div><div class="field"><label>AVATAR / LOGO (emoji yoki qisqa belgi)</label><input name="avatar" value="${esc(p.avatar||'⚽')}"></div><div class="field"><label>RAQAM</label><input name="number" type="number" value="${p.number||''}"></div><div class="field"><label>POZITSIYA</label><select name="position">${['GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST'].map(x=>`<option ${p.position===x?'selected':''}>${x}</option>`).join('')}</select></div>${['matches','goals','assists','yellow','red'].map(k=>`<div class="field"><label>${k.toUpperCase()}</label><input name="${k}" type="number" min="0" value="${p[k]||0}"></div>`).join('')}<button class="btn full">Saqlash</button></form>`,async f=>{let o=Object.fromEntries(f);if(!o.password)delete o.password;await api(p.id?'/api/players/'+p.id:'/api/players',{method:p.id?'PUT':'POST',body:JSON.stringify(o)})})}
window.editPlayer=id=>playerModal(players.find(p=>p.id===id));window.delPlayer=async id=>{if(confirm('Futbolchini o‘chirishni tasdiqlaysizmi?')){await api('/api/players/'+id,{method:'DELETE'});await boot();toast('O‘chirildi')}}
const fmtR=r=>r===null||r===undefined?'–':Number(r).toFixed(1);
const rClass=r=>r===null||r===undefined?'r-none':r>=9?'r-top':r>=7.5?'r-great':r>=6.5?'r-good':r>=5?'r-mid':'r-low';
const icons=(n,e)=>!n?'':n<=3?e.repeat(n):e+'×'+n;
const statIcons=s=>`${icons(s.goals,'⚽')}${icons(s.assists,'👟')}`;
function lineupPage(){
  shell(`<div class="card"><div class="toolbar"><input id="lname" placeholder="Tarkib nomi" value="Asosiy tarkib"><button class="btn" id="saveLineup">Tarkibni saqlash</button><button class="btn gold" id="finishMatch">🏁 O'yin tugadi</button><button class="btn danger" id="clearBuilder">🗑 Tozalash</button></div>
  <div class="match-bar hidden" id="matchBar"><div class="scoreboard"><div class="sb-side"><span class="sb-team">9-V SCORED</span><div class="stepper"><button type="button" data-sc="home" data-d="-1">−</button><output id="scHome">0</output><button type="button" data-sc="home" data-d="1">+</button></div></div><span class="sb-colon">:</span><div class="sb-side"><span class="sb-team">RAQIB</span><div class="stepper"><button type="button" data-sc="away" data-d="-1">−</button><output id="scAway">0</output><button type="button" data-sc="away" data-d="1">+</button></div></div></div><div class="scorers-grid"><div><button type="button" class="btn secondary small" id="pickHomeScorers">⚽ Gol urganlarni tanlash</button><div class="scorers" id="scorersHome"></div></div><div><button type="button" class="btn secondary small" id="pickAwayScorers">⚽ Gol urganlarni tanlash</button><div class="scorers" id="scorersAway"></div></div></div><p class="muted" style="text-align:center;margin:10px 0 0">1) Hisobni belgilang (− / +). 2) “Gol urganlarni tanlash” orqali kim necha gol urganini belgilang. Baho va assist uchun futbolchi kartasini bosing.</p><div class="toolbar" style="justify-content:center;margin-bottom:0"><button class="btn secondary" id="backEdit">← Tarkibga qaytish</button><button class="btn" id="saveResult">✅ Natijani saqlash</button></div></div>
  <p class="muted">Har ikki jamoaning sxemasini alohida belgilang. “O'zim tuzaman” orqali 3-1-1 kabi: himoyachi-yarim himoyachi-hujumchi sonini kiriting. Darvozabon avtomatik bitta qo'shiladi.</p>
  <div class="grid lineup-grid">
    <div><h3>9-V SCORED</h3><div class="toolbar"><select id="homeFormation" class="formation-select"><option>4-3-3</option><option>4-4-2</option><option>3-5-2</option><option>4-2-3-1</option><option>5v5</option><option>7v7</option><option value="custom">O'zim tuzaman</option></select><input id="homeCustom" class="custom-formation hidden" placeholder="Masalan: 3-1-1"></div><div class="pitch" id="home"></div></div>
    <div><h3>RAQIB JAMOASI</h3><div class="toolbar"><select id="awayFormation" class="formation-select"><option>4-3-3</option><option>4-4-2</option><option>3-5-2</option><option>4-2-3-1</option><option>5v5</option><option>7v7</option><option value="custom">O'zim tuzaman</option></select><input id="awayCustom" class="custom-formation hidden" placeholder="Masalan: 2-1-1"></div><div class="pitch" id="away"></div></div>
  </div></div>`);
  let home=[],away=[];let finished=false;const stats={home:[],away:[]};const score={home:0,away:0};let tm=null,restoredFinished=false;
  const snapshot=()=>({name:$('#lname').value,homeSel:$('#homeFormation').value,awaySel:$('#awayFormation').value,homeCustom:$('#homeCustom').value,awayCustom:$('#awayCustom').value,home:[...home],away:[...away],finished,score:{...score},stats:{home:Array.from(stats.home,x=>x||null),away:Array.from(stats.away,x=>x||null)}});
  const flush=()=>{clearTimeout(tm);tm=null;const d=snapshot();draft=d;fetch('/api/draft',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:d}),keepalive:true}).catch(()=>{})};
  const persist=()=>{clearTimeout(tm);tm=setTimeout(flush,250)};
  flushDraft=()=>{if(tm)flush()};
  const cfg={
    home:{select:$('#homeFormation'),input:$('#homeCustom'),arr:()=>home,set:v=>home=v,target:$('#home'),side:'home'},
    away:{select:$('#awayFormation'),input:$('#awayCustom'),arr:()=>away,set:v=>away=v,target:$('#away'),side:'away'}
  };
  function rowsFor(side){
    const c=cfg[side];
    if(c.select.value==='custom'){
      const raw=c.input.value.trim();
      if(!/^\d+-\d+-\d+$/.test(raw))return [1,3,1,1];
      const nums=raw.split('-').map(Number);
      if(nums.some(n=>!Number.isInteger(n)||n<1||n>15)||nums.reduce((x,y)=>x+y,0)>15)return [1,3,1,1];
      return [1,...nums];
    }
    return ({'5v5':[1,2,1,1],'7v7':[1,2,3,1],'4-4-2':[1,4,2,3,1],'3-5-2':[1,3,5,2],'4-2-3-1':[1,4,2,3,1],'4-3-3':[1,4,3,3]}[c.select.value]||[1,4,3,3]);
  }
  function draw(side){
    const c=cfg[side],arr=c.arr(),rows=rowsFor(side);let idx=0;
    c.target.innerHTML=rows.map((count,ri)=>`<div class="pitch-row">${Array.from({length:count},()=>{
      const i=idx++,value=arr[i],p=players.find(x=>x.id===value);
      const st=finished&&value?getStat(side,i):null;
      const label=p?p.name:(value&&side==='away'?String(value):'Tanlash');
      return `<button class="slot ${value?'selected':''}" data-i="${i}">${st?`<span class="rating-badge ${rClass(st.rating)}">${fmtR(st.rating)}</span>`:''}<span>${value?esc(p?.avatar||'⚽'):'+'}</span><span class="slot-name">${esc(label)}</span>${p?`<span class="slot-number">#${p.number||'—'} · ${esc(p.position||'')}</span>`:''}${st?`<span class="slot-icons">${statIcons(st)}</span>`:''}</button>`;
    }).join('')}</div>`).join('');
    c.target.classList.toggle('finish-mode',finished);persist();
    c.target.querySelectorAll('.slot').forEach(btn=>btn.onclick=()=>finished?openStats(side,+btn.dataset.i):openPicker(+btn.dataset.i,arr,c.target,side));
  }
  function resize(side){
    const c=cfg[side],count=rowsFor(side).reduce((x,y)=>x+y,0),arr=c.arr().slice(0,count);
    while(arr.length<count)arr.push(null);c.set(arr);draw(side);
  }
  function openPicker(index,arr,target,side){
    const isAway=side==='away',already=arr.filter((v,i)=>i!==index&&v&&players.some(p=>p.id===v));
    let bg=document.createElement('div');bg.className='modal-bg';
    bg.innerHTML=`<div class="modal"><div class="modal-head"><div><h2>${isAway?'Raqib futbolchisini tanlash':'Futbolchini tanlash'}</h2><div class="muted" style="font-size:12px">${isAway?'Bazadagi futbolchini tanlang yoki tashqi raqib qo‘shing':'Admin qo‘shgan futbolchilar ro‘yxati'}</div></div><button class="close">×</button></div><input class="picker-search" id="pickerSearch" placeholder="Ism bo‘yicha qidirish..."><div class="picker-list" id="pickerList"></div>${isAway?`<div class="section" style="border-top:1px solid var(--line);padding-top:12px"><h3>Tashqi raqib futbolchisi</h3><form id="externalForm"><div class="field"><label>ISM FAMILIYA</label><input name="name" placeholder="Masalan: Aziz Karimov" required></div><div class="field"><label>RAQAM (ixtiyoriy)</label><input name="number" type="number" placeholder="10"></div><button class="btn full">Raqibni qo'shish</button></form></div>`:''}<button class="btn danger full" id="clearSlot">Pozitsiyani bo'shatish</button></div>`;
    document.body.append(bg);const close=()=>bg.remove();bg.querySelector('.close').onclick=close;bg.onclick=e=>{if(e.target===bg)close()};
    function renderList(filter=''){
      const list=players.filter(p=>!already.includes(p.id)&&p.name.toLowerCase().includes(filter.toLowerCase()));
      bg.querySelector('#pickerList').innerHTML=list.map(p=>`<button class="picker-card" data-id="${p.id}"><div class="avatar">${esc(p.avatar||'⚽')}</div><strong>${esc(p.name)}</strong><small>#${p.number||'—'} · ${esc(p.position||'PLAYER')}</small><div class="picker-stats"><span>⚽ ${p.goals||0}</span><span>🅰 ${p.assists||0}</span><span>▣ ${p.matches||0}</span></div></button>`).join('')||'<div class="picker-empty">Mos futbolchi topilmadi.</div>';
      bg.querySelectorAll('[data-id]').forEach(card=>card.onclick=()=>{arr[index]=card.dataset.id;draw(side);close()});
    }
    renderList();bg.querySelector('#pickerSearch').oninput=e=>renderList(e.target.value);
    bg.querySelector('#clearSlot').onclick=()=>{arr[index]=null;draw(side);close()};
    if(isAway)bg.querySelector('#externalForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),name=String(f.get('name')).trim(),num=String(f.get('number')||'').trim();if(name){arr[index]=num?`${name} (#${num})`:name;draw(side);close()}};
  }
  (function restore(){
    const D=draft;if(!D||typeof D!=='object')return;
    const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-/i,clean=(arr,side)=>(Array.isArray(arr)?arr:[]).map(v=>typeof v!=='string'||!v?null:players.some(p=>p.id===v)?v:(side==='away'&&!uuid.test(v)?v:null));
    if(typeof D.name==='string')$('#lname').value=D.name;
    for(const [side,sel,cus] of [['home',D.homeSel,D.homeCustom],['away',D.awaySel,D.awayCustom]]){
      const c=cfg[side];if(typeof sel==='string'){c.select.value=sel;if(c.select.value!==sel)c.select.selectedIndex=0}
      if(typeof cus==='string')c.input.value=cus;c.input.classList.toggle('hidden',c.select.value!=='custom');
    }
    home=clean(D.home,'home');away=clean(D.away,'away');
    const n=v=>Math.min(99,Math.max(0,Math.floor(Number(v)||0)));
    score.home=n(D.score&&D.score.home);score.away=n(D.score&&D.score.away);
    stats.home=Array.isArray(D.stats&&D.stats.home)?D.stats.home:[];stats.away=Array.isArray(D.stats&&D.stats.away)?D.stats.away:[];
    restoredFinished=!!D.finished&&home.some(Boolean);
  })();
  for(const side of ['home','away']){
    const c=cfg[side];
    c.select.onchange=()=>{persist();c.input.classList.toggle('hidden',c.select.value!=='custom');if(c.select.value==='custom'&&!c.input.value)c.input.value=side==='home'?'3-1-1':'2-1-1';resize(side)};
    c.input.oninput=()=>{if(c.select.value==='custom'&&/^\d+-\d+-\d+$/.test(c.input.value.trim()))resize(side);persist()};
    resize(side);
  }
  $('#lname').oninput=persist;
  const getStat=(side,i)=>{const v=cfg[side].arr()[i];let t=stats[side][i];if(!t||t.key!==v)t=stats[side][i]={key:v,rating:null,goals:0,assists:0};return t};
  const assigned=side=>cfg[side].arr().reduce((t,v,i)=>t+(v?getStat(side,i).goals:0),0);
  const nameOf=(side,i)=>{const v=cfg[side].arr()[i],p=players.find(x=>x.id===v);return p?p.name:String(v)};
  function updateScore(){
    for(const [side,key] of [['home','Home'],['away','Away']]){
      $('#sc'+key).textContent=score[side];
      const list=cfg[side].arr().map((v,i)=>v&&getStat(side,i).goals>0?esc(nameOf(side,i))+(getStat(side,i).goals>1?' ×'+getStat(side,i).goals:''):'').filter(Boolean),left=score[side]-assigned(side);
      $('#scorers'+key).innerHTML=(list.length?'⚽ '+list.join(', '):'<span class="muted">Gol urganlar tanlanmagan</span>')+(left>0?` <span class="warn">· belgilanmagan: ${left}</span>`:'');
    }
    persist();
  }
  document.querySelectorAll('[data-sc]').forEach(b=>b.onclick=()=>{
    const side=b.dataset.sc,n=score[side]+Number(b.dataset.d);
    if(n<0||n>99)return;
    if(n<assigned(side)){toast('Gol urganlar hisobdan ko‘p bo‘lib qoladi. Avval gol urganlarni kamaytiring.');return}
    score[side]=n;updateScore();
  });
  function openScorers(side){
    const bg=document.createElement('div');bg.className='modal-bg';
    bg.innerHTML=`<div class="modal stats-modal"><div class="modal-head"><div><h2>⚽ Gol urganlar — ${side==='home'?'9-V SCORED':'RAQIB'}</h2><div class="muted" id="scInfo" style="font-size:12px"></div></div><button class="close">×</button></div><div id="scList"></div><button class="btn full" id="scDone">Tayyor</button></div>`;
    document.body.append(bg);const close=()=>bg.remove();bg.querySelector('.close').onclick=close;bg.querySelector('#scDone').onclick=close;bg.onclick=e=>{if(e.target===bg)close()};
    function paint(){
      const arr=cfg[side].arr(),filled=arr.map((v,i)=>v?i:-1).filter(i=>i>=0);
      bg.querySelector('#scInfo').textContent=`Hisob: ${score[side]} · Belgilandi: ${assigned(side)} · Qoldi: ${score[side]-assigned(side)}`+(score[side]===0?' — avval hisobni belgilang':'');
      bg.querySelector('#scList').innerHTML=filled.map(i=>{const g=getStat(side,i).goals;return `<div class="stat-row scorer-row ${g?'has-goal':''}"><label>${esc(nameOf(side,i))}</label><div class="stepper"><button type="button" data-i="${i}" data-d="-1">−</button><output>${g}</output><button type="button" data-i="${i}" data-d="1">+</button></div></div>`}).join('')||'<div class="picker-empty">Bu jamoada futbolchi tanlanmagan.</div>';
      bg.querySelectorAll('#scList button').forEach(b=>b.onclick=()=>{
        const i=+b.dataset.i,d=+b.dataset.d,t=getStat(side,i),n=t.goals+d;
        if(n<0)return;
        if(d>0&&assigned(side)>=score[side]){toast(score[side]?'Hisobdagi barcha gollar belgilangan.':'Avval hisobni belgilang.');return}
        t.goals=n;paint();draw(side);updateScore();
      });
    }
    paint();
  }
  $('#pickHomeScorers').onclick=()=>openScorers('home');$('#pickAwayScorers').onclick=()=>openScorers('away');
  function openStats(side,i){
    const v=cfg[side].arr()[i];if(!v){toast('Avval bu pozitsiyaga futbolchi qo‘ying');return}
    const p=players.find(x=>x.id===v),name=p?p.name:String(v),cur=getStat(side,i),s={goals:cur.goals,assists:cur.assists};
    const bg=document.createElement('div');bg.className='modal-bg';
    bg.innerHTML=`<div class="modal stats-modal"><div class="modal-head"><div><h2>${esc(name)}</h2><div class="muted" style="font-size:12px">${p?`#${p.number||'—'} · ${esc(p.position||'')}`:'Raqib futbolchisi'}</div></div><button class="close">×</button></div>
    <div class="stat-row"><label>⭐ BAHO (0–10)</label><div class="stepper"><button type="button" data-k="rating" data-d="-0.5">−</button><input id="stRating" type="number" min="0" max="10" step="0.1" placeholder="–" value="${cur.rating??''}"><button type="button" data-k="rating" data-d="0.5">+</button></div></div>
    <div class="stat-row"><label>⚽ GOLLAR</label><div class="stepper"><button type="button" data-k="goals" data-d="-1">−</button><output id="stGoals">${s.goals}</output><button type="button" data-k="goals" data-d="1">+</button></div></div>
    <div class="stat-row"><label>👟 ASSISTLAR</label><div class="stepper"><button type="button" data-k="assists" data-d="-1">−</button><output id="stAssists">${s.assists}</output><button type="button" data-k="assists" data-d="1">+</button></div></div>
    <button class="btn full" id="stSave">Saqlash</button></div>`;
    document.body.append(bg);const close=()=>bg.remove();bg.querySelector('.close').onclick=close;bg.onclick=e=>{if(e.target===bg)close()};
    const ri=bg.querySelector('#stRating');
    bg.querySelectorAll('.stepper button').forEach(b=>b.onclick=()=>{
      const k=b.dataset.k,d=Number(b.dataset.d);
      if(k==='rating'){const base=ri.value===''?6:Number(ri.value)||0;ri.value=Math.min(10,Math.max(0,Math.round((base+d)*10)/10)).toFixed(1)}
      else{if(k==='goals'&&d>0&&assigned(side)-cur.goals+s.goals>=score[side]){toast(score[side]?'Hisobdagi barcha gollar belgilangan. Avval hisobni oshiring.':'Avval hisobni belgilang.');return}s[k]=Math.min(30,Math.max(0,s[k]+d));bg.querySelector(k==='goals'?'#stGoals':'#stAssists').textContent=s[k]}
    });
    bg.querySelector('#stSave').onclick=()=>{
      let r=ri.value===''?null:Math.min(10,Math.max(0,Math.round(Number(ri.value)*10)/10));if(Number.isNaN(r))r=null;
      Object.assign(getStat(side,i),{rating:r,goals:s.goals,assists:s.assists});
      draw(side);updateScore();close();
    };
  }
  function setFinished(on,scroll=true){
    finished=on;
    document.querySelectorAll('.formation-select,.custom-formation').forEach(e=>e.disabled=on);
    $('#matchBar').classList.toggle('hidden',!on);$('#finishMatch').classList.toggle('hidden',on);$('#saveLineup').classList.toggle('hidden',on);$('#clearBuilder').classList.toggle('hidden',on);
    draw('home');draw('away');updateScore();
    if(on&&scroll)$('#matchBar').scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  const formations=()=>{
    for(const side of ['home','away'])if(cfg[side].select.value==='custom'&&!/^\d+-\d+-\d+$/.test(cfg[side].input.value.trim())){toast('Har ikki sxemani 3-1-1 ko‘rinishida to‘g‘ri kiriting.');return null}
    const f=side=>cfg[side].select.value==='custom'?cfg[side].input.value.trim():cfg[side].select.value;
    return {hf:f('home'),af:f('away')};
  };
  async function save(result){
    const f=formations();if(!f)return false;
    await api('/api/lineups',{method:'POST',body:JSON.stringify({name:$('#lname').value,formation:f.hf,homeFormation:f.hf,awayFormation:f.af,home,away,...(result?{result}:{})})});
    return true;
  }
  $('#saveLineup').onclick=async()=>{try{if(await save()){lineups=await api('/api/lineups');toast('Ikkala jamoa tarkibi saqlandi!')}}catch(e){toast(e.message)}};
  $('#finishMatch').onclick=()=>{
    if(!formations())return;
    if(!home.some(Boolean)){toast('Avval 9-V SCORED tarkibini tuzing');return}
    setFinished(true);
  };
  $('#backEdit').onclick=()=>setFinished(false);
  $('#clearBuilder').onclick=async()=>{if(!confirm('Tarkib builderidagi hamma narsa tozalansinmi?'))return;clearTimeout(tm);tm=null;flushDraft=null;try{await api('/api/draft',{method:'DELETE'});draft=null;lineupPage()}catch(e){toast(e.message)}};
  setFinished(restoredFinished,false);
  $('#saveResult').onclick=async e=>{
    const btn=e.currentTarget,pick=side=>cfg[side].arr().map((v,i)=>{if(!v)return null;const t=getStat(side,i);return {rating:t.rating,goals:t.goals,assists:t.assists}});
    btn.disabled=true;
    try{if(await save({homeStats:pick('home'),awayStats:pick('away'),homeScore:score.home,awayScore:score.away})){clearTimeout(tm);tm=null;flushDraft=null;await api('/api/draft',{method:'PUT',body:JSON.stringify({draft:{...snapshot(),finished:false,score:{home:0,away:0},stats:{home:[],away:[]}}})});page='teams';await boot();toast('O‘yin natijasi saqlandi, statistika yangilandi!');return}}catch(x){toast(x.message)}
    btn.disabled=false;
  };
}
function teamsPage(){
  const names=(arr,st)=>(arr||[]).map((v,i)=>{if(!v)return '';const p=players.find(x=>x.id===v),t=st&&st[i],n=p?`${p.name} (#${p.number||'—'})`:String(v);return `<span class="res-player">${esc(n)}${t?` <span class="res-badges"><span class="rb ${rClass(t.rating)}">${fmtR(t.rating)}</span>${statIcons(t)}</span>`:''}</span>`}).filter(Boolean);
  const list=(arr,st)=>{const n=names(arr,st);const sc=st?(arr||[]).map((v,i)=>{const t=st[i];if(!v||!t||!t.goals)return '';const p=players.find(x=>x.id===v);return esc((p?p.name:String(v))+(t.goals>1?' ×'+t.goals:''))}).filter(Boolean):[];return st?`<div class="res-list">${n.join('')||'—'}</div>${sc.length?`<p class="scorers-line">⚽ ${sc.join(', ')}</p>`:''}`:`<p>${n.join(' · ')||'—'}</p>`};
  shell(`<div class="section">${lineups.map(l=>{const r=l.result;return `<div class="card" style="margin-bottom:12px"><div class="top"><div><h2>${esc(l.name)}</h2><span class="pill">Biz: ${esc(l.homeFormation||l.formation)} · Raqib: ${esc(l.awayFormation||l.formation)}</span>${r?` <span class="pill score">🏁 ${r.homeScore} : ${r.awayScore}</span>`:''}</div>${me.role==='admin'?`<button class="btn danger small" onclick="deleteLineup('${l.id}',${!!r})">O'chirish</button>`:''}</div><p class="muted">Yaratilgan: ${new Date(l.createdAt).toLocaleString('uz-UZ')}</p><div class="grid grid-2"><div><b>9-V SCORED</b>${list(l.home,r&&r.homeStats)}</div><div><b>RAQIB JAMOASI</b>${list(l.away,r&&r.awayStats)}</div></div></div>`}).join('')||'<div class="card muted">Hozircha saqlangan tarkib yo‘q.</div>'}</div>`)}
window.deleteLineup=async(id,fin)=>{if(confirm(fin?'Tarkib va o‘yin natijasi o‘chiriladi (futbolchilar statistikasi o‘zgarmaydi). Davom etasizmi?':'Tarkib o‘chirilsinmi?')){await api('/api/lineups/'+id,{method:'DELETE'});lineups=await api('/api/lineups');teamsPage();toast('O‘chirildi')}};
boot();