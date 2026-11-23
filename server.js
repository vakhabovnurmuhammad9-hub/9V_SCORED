const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const DATA = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const BACKUP = DATA + '.bak';
const SESS = path.join(path.dirname(DATA), 'sessions.json');
const PORT = process.env.PORT || 3000;
const sessions = new Map();
try { for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(SESS, 'utf8')))) sessions.set(k, v); } catch (e) {}
function saveSessions() { try { atomicWrite(SESS, JSON.stringify(Object.fromEntries(sessions))); } catch (e) { console.error('sessions:', e.message); } }
function atomicWrite(file, text) { const tmp = file + '.tmp'; fs.writeFileSync(tmp, text); fs.renameSync(tmp, file); }

function seed() {
  if (fs.existsSync(DATA)) return;
  const admin = { id: 'admin', name: 'Administrator', email: 'admin@gmai.com',
    passwordHash: hash('12345678'), role: 'admin', avatar: '9V' };
  fs.writeFileSync(DATA, JSON.stringify({ users: [admin], teams: [], lineups: [], matches: [] }, null, 2));
}
function hash(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function read() {
  seed();
  try { return JSON.parse(fs.readFileSync(DATA, 'utf8')); }
  catch (e) {
    // data.json buzilgan bo'lsa, ma'lumotni yo'qotmaslik uchun zaxira nusxadan o'qiymiz
    console.error('data.json o\'qilmadi, zaxira nusxa ishlatilmoqda:', e.message);
    return JSON.parse(fs.readFileSync(BACKUP, 'utf8'));
  }
}
function write(d) {
  const text = JSON.stringify(d, null, 2);
  if (fs.existsSync(DATA)) { try { fs.copyFileSync(DATA, BACKUP); } catch (e) {} }
  atomicWrite(DATA, text);
}
function send(res, code, obj) { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'same-origin'}); res.end(JSON.stringify(obj)); }
function body(req) { return new Promise((resolve,reject)=>{ let s=''; req.on('data',c=>s+=c); req.on('end',()=>{try{resolve(s?JSON.parse(s):{});}catch(e){reject(e);}}); }); }
function current(req) { const token = (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('sid='))?.slice(4); return token && sessions.get(token); }
function requireUser(req,res,admin=false) { const u=current(req); if(!u){send(res,401,{error:'Avval tizimga kiring'});return null;} if(admin&&u.role!=='admin'){send(res,403,{error:'Faqat admin uchun'});return null;} return u; }
function clampInt(n,max){return Math.min(max,Math.max(0,Math.floor(Number(n)||0)));}
function cleanStats(arr,n){
  return Array.from({length:n},(_,i)=>{
    const s=Array.isArray(arr)?arr[i]:null; if(!s||typeof s!=='object')return null;
    let r=(s.rating===null||s.rating===undefined||s.rating==='')?null:Math.round(Number(s.rating)*10)/10;
    if(r!==null)r=Number.isFinite(r)?Math.min(10,Math.max(0,r)):null;
    return {rating:r,goals:clampInt(s.goals,30),assists:clampInt(s.assists,30)};
  });
}
function applyResult(d,l,raw){
  const hs=cleanStats(raw.homeStats,l.home.length), as=cleanStats(raw.awayStats,l.away.length);
  const sum=(a,k)=>a.reduce((t,x)=>t+(x?x[k]:0),0);
  const score=(v,goals)=>(v===undefined||v===null||v==='')?goals:Math.max(goals,clampInt(v,99));
  l.result={homeStats:hs,awayStats:as,homeScore:score(raw.homeScore,sum(hs,'goals')),awayScore:score(raw.awayScore,sum(as,'goals')),finishedAt:new Date().toISOString()};
  const apply=(slots,stats)=>slots.forEach((v,i)=>{
    if(!v)return; const u=d.users.find(x=>x.id===v&&x.role==='user'); if(!u)return;
    const st=stats[i]||{rating:null,goals:0,assists:0};
    u.matches=(u.matches||0)+1; u.goals=(u.goals||0)+st.goals; u.assists=(u.assists||0)+st.assists;
    if(st.rating!==null){u.ratingTotal=Math.round(((u.ratingTotal||0)+st.rating)*10)/10;u.rated=(u.rated||0)+1;}
  });
  apply(l.home,hs); apply(l.away,as);
  d.matches=d.matches||[];
  d.matches.unshift({id:crypto.randomUUID(),lineupId:l.id,name:l.name,homeScore:l.result.homeScore,awayScore:l.result.awayScore,finishedAt:l.result.finishedAt});
}
seed();

http.createServer(async (req,res)=>{
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'same-origin','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS'});return res.end();}
  const url = new URL(req.url, 'http://localhost');
  try {
    if(url.pathname==='/api/login'&&req.method==='POST'){
      const b=await body(req), d=read(), u=d.users.find(x=>x.email.toLowerCase()===String(b.email||'').toLowerCase()&&x.passwordHash===hash(String(b.password||'')));
      if(!u)return send(res,401,{error:'Login yoki parol noto‘g‘ri'});
      const token=crypto.randomBytes(24).toString('hex'); sessions.set(token,{id:u.id,role:u.role});saveSessions();
      res.writeHead(200,{'Content-Type':'application/json','Set-Cookie':`sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`}); return res.end(JSON.stringify({ok:true}));
    }
    if(url.pathname==='/api/logout'&&req.method==='POST'){const u=current(req); if(u) {sessions.forEach((v,k)=>{if(v.id===u.id)sessions.delete(k)});saveSessions();} res.writeHead(200,{'Set-Cookie':'sid=; Max-Age=0; Path=/','Content-Type':'application/json'});return res.end('{"ok":true}');}
    if(url.pathname==='/api/me'){const u=requireUser(req,res);if(!u)return;const d=read();const me=d.users.find(x=>x.id===u.id);return send(res,200,{id:me.id,name:me.name,email:me.email,role:me.role,avatar:me.avatar});}
    if(url.pathname==='/api/players'&&req.method==='GET'){if(!requireUser(req,res))return;const d=read();return send(res,200,d.users.filter(x=>x.role==='user').map(({passwordHash,...x})=>x));}
    if(url.pathname==='/api/players'&&req.method==='POST'){
      if(!requireUser(req,res,true))return;const b=await body(req),d=read();
      if(d.users.filter(x=>x.role==='user').length>=16)return send(res,400,{error:'Maksimum 16 ta user mumkin'});
      if(!b.name||!b.email||!b.password)return send(res,400,{error:'Ism, login va parol majburiy'});
      if(d.users.some(x=>x.email===b.email))return send(res,400,{error:'Bu login band'});
      const p={id:crypto.randomUUID(),name:b.name,email:b.email,passwordHash:hash(b.password),role:'user',avatar:b.avatar||'⚽',number:Number(b.number)||0,position:b.position||'—',matches:0,goals:0,assists:0,yellow:0,red:0,ratingTotal:0,rated:0};
      d.users.push(p);write(d);return send(res,201,{id:p.id});
    }
    const playerMatch=url.pathname.match(/^\/api\/players\/([^/]+)$/);
    if(playerMatch){
      if(!requireUser(req,res,true))return;const d=read(),i=d.users.findIndex(x=>x.id===playerMatch[1]&&x.role==='user');if(i<0)return send(res,404,{error:'Futbolchi topilmadi'});
      if(req.method==='PUT'){const b=await body(req);for(const k of ['name','email','avatar','position'])if(b[k]!==undefined)d.users[i][k]=b[k];for(const k of ['number','matches','goals','assists','yellow','red'])if(b[k]!==undefined)d.users[i][k]=Math.max(0,Number(b[k])||0);if(b.password)d.users[i].passwordHash=hash(b.password);write(d);return send(res,200,{ok:true});}
      if(req.method==='DELETE'){d.users.splice(i,1);write(d);return send(res,200,{ok:true});}
    }
    if(url.pathname==='/api/draft'){
      if(!requireUser(req,res,true))return;
      if(req.method==='GET')return send(res,200,{draft:read().draft||null});
      if(req.method==='PUT'){const b=await body(req),d=read();d.draft=b.draft&&typeof b.draft==='object'?b.draft:null;write(d);return send(res,200,{ok:true});}
      if(req.method==='DELETE'){const d=read();delete d.draft;write(d);return send(res,200,{ok:true});}
    }
    if(url.pathname==='/api/lineups'&&req.method==='GET'){if(!requireUser(req,res))return;return send(res,200,read().lineups);}
    if(url.pathname==='/api/lineups'&&req.method==='POST'){if(!requireUser(req,res,true))return;const b=await body(req),d=read();const l={id:crypto.randomUUID(),name:b.name||'Yangi tarkib',formation:b.formation||'4-3-3',homeFormation:b.homeFormation||b.formation||'4-3-3',awayFormation:b.awayFormation||b.formation||'4-3-3',home:b.home||[],away:b.away||[],createdAt:new Date().toISOString()};if(b.result&&typeof b.result==='object')applyResult(d,l,b.result);d.lineups.unshift(l);write(d);return send(res,201,l);}
    if(url.pathname.startsWith('/api/lineups/')&&req.method==='DELETE'){if(!requireUser(req,res,true))return;const d=read();d.lineups=d.lineups.filter(x=>x.id!==url.pathname.split('/').pop());write(d);return send(res,200,{ok:true});}
    if(url.pathname.startsWith('/api/'))return send(res,404,{error:'API topilmadi'});
    const f=url.pathname==='/'?'index.html':url.pathname.slice(1), full=path.join(__dirname,'public',f);
    if(!full.startsWith(path.join(__dirname,'public')))return send(res,403,{error:'Forbidden'});
    fs.readFile(full,(e,data)=>{if(e){res.writeHead(404);return res.end('Not found');}const ext=path.extname(full);res.writeHead(200,{'Content-Type':({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'}[ext]||'application/octet-stream')});res.end(data);});
  } catch(e) { console.error(e); send(res,500,{error:'Server xatosi'}); }
}).listen(PORT,()=>console.log(`9-V SCORED: http://localhost:${PORT}`));
