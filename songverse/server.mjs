import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
// Render Free's disk is ephemeral. Never store pupil accounts on it.
// Neon provides durable Postgres storage, with no database secrets shipped to browsers.
const IS_RENDER = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_HOSTNAME);
const USE_POSTGRES = Boolean(process.env.DATABASE_URL);
if (IS_RENDER && !USE_POSTGRES) {
  console.error('SóngVerse: Thiếu DATABASE_URL. Chưa có cơ sở dữ liệu lưu tài khoản; từ chối chạy trên Render Free.');
  process.exit(1);
}
if (process.env.RAILWAY_PROJECT_ID && !process.env.RAILWAY_VOLUME_MOUNT_PATH && !USE_POSTGRES) {
  console.error('SóngVerse: Chưa có Railway Volume hoặc DATABASE_URL. Hãy thiết lập lưu trữ bền vững trước khi triển khai.');
  process.exit(1);
}
const DIR = path.resolve(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(ROOT, 'data'));
let pool = null;
let db = { users: [] };
let SECRET;
if (USE_POSTGRES) {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    console.error('SóngVerse: SESSION_SECRET cần ít nhất 32 ký tự khi dùng cơ sở dữ liệu online.');
    process.exit(1);
  }
  SECRET = Buffer.from(process.env.SESSION_SECRET, 'utf8');
  try {
    const { Pool } = await import('pg');
    pool = new Pool({connectionString: process.env.DATABASE_URL,
      ssl: {rejectUnauthorized:true}, max:4, connectionTimeoutMillis:12000,
      idleTimeoutMillis:20000, keepAlive:true});
    await pool.query(`CREATE TABLE IF NOT EXISTS songverse_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      profile JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const {rows} = await pool.query('SELECT profile FROM songverse_users');
    db.users = rows.map(r=>r.profile);
    if (!db.users.every(u=>u && typeof u.id==='string' && typeof u.username==='string'))
      throw new Error('Dữ liệu tài khoản không hợp lệ.');
    console.log(`SóngVerse: Đã kết nối Postgres, khôi phục ${db.users.length} tài khoản.`);
  } catch(e) {
    console.error('SóngVerse: Không kết nối được Postgres:',e.message);
    await pool?.end().catch(()=>{});
    process.exit(1);
  }
} else {
  fs.mkdirSync(DIR, { recursive: true });
  const DB_PATH = path.join(DIR,'users.json');
  const SECRET_PATH = path.join(DIR,'secret.key');
  SECRET=fs.existsSync(SECRET_PATH)?fs.readFileSync(SECRET_PATH):crypto.randomBytes(32);
  if (!fs.existsSync(SECRET_PATH)) fs.writeFileSync(SECRET_PATH,SECRET,{mode:0o600});
  try {if (fs.existsSync(DB_PATH)) db = JSON.parse(fs.readFileSync(DB_PATH,'utf8'));}
  catch(e) {console.error('Database error:',e.message); process.exit(1);}
  if (!Array.isArray(db.users)) throw new Error('Invalid users database');
}
// Serialize asynchronous writes so simultaneous quiz submissions cannot overwrite later updates.
let writeTail = Promise.resolve();
async function save(user) {
  if (pool) {
    const profile=JSON.stringify(user);
    const job=writeTail.catch(()=>{}).then(()=>pool.query(
      'INSERT INTO songverse_users (id,username,profile) VALUES ($1,$2,$3::jsonb) ON CONFLICT (id) DO UPDATE SET username=EXCLUDED.username,profile=EXCLUDED.profile,updated_at=NOW()',
      [user.id,user.username,profile]));
    writeTail=job;
    await job;
  } else {
    const file=path.join(DIR,'users.json'), tmp=file+'.tmp';
    fs.writeFileSync(tmp,JSON.stringify(db,null,2),{mode:0o600});
    fs.renameSync(tmp,file);
  }
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) { return salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex'); }
function verifyPassword(password, stored) { const [salt, hex] = stored.split(':'); const a = crypto.scryptSync(password, salt, 64); const b = Buffer.from(hex, 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); }
function b64(x) { return Buffer.from(x).toString('base64url'); }
function makeToken(user) { const payload = b64(JSON.stringify({ id: user.id, exp: Date.now() + 30*86400e3 })); return payload + '.' + crypto.createHmac('sha256', SECRET).update(payload).digest('base64url'); }
function getUser(token) {
  try {
    if (!token || typeof token !== 'string' || token.length > 1500) return null;
    const [p,s] = token.split('.'); if (!p || !s) return null;
    const a = Buffer.from(s, 'base64url'), b = crypto.createHmac('sha256',SECRET).update(p).digest();
    if (a.length!==b.length || !crypto.timingSafeEqual(a,b)) return null;
    const data=JSON.parse(Buffer.from(p,'base64url').toString('utf8'));
    if (data.exp < Date.now()) return null;
    return db.users.find(u=>u.id===data.id) || null;
  } catch { return null; }
}
const clean = (s,n=32) => String(s ?? '').normalize('NFKC').replace(/[<>\x00-\x1f\x7f]/g,'').trim().slice(0,n);
const defaults = {skin:'#F6C6A8',hair:'#3D2B30',outfit:'#5966D8',style:'bob',accessory:'none'};
const palette = {
  skin:['#F9DCC4','#F6C6A8','#CE8D68','#976342','#6E4436'],
  hair:['#3D2B30','#6E4830','#F4C45E','#A25965','#554AB4','#222938'],
  outfit:['#5966D8','#EF7199','#39A99B','#EB9A48','#9B70CC','#355A8A'],
  style:['bob','spiky','bun','short'], accessory:['none','cat','star','glasses']
};
function safeAvatar(a) { const out={}; for(const k of Object.keys(defaults))out[k]=(a && palette[k].includes(a[k]))?a[k]:defaults[k]; return out; }
function summary(u){return {id:u.id,username:u.username,nickname:u.nickname,avatar:u.avatar,cleared:u.cleared||[],score:(u.cleared||[]).length*100};}
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj));}
function readBody(req){return new Promise((resolve,reject)=>{let body=''; req.on('data',c=>{body+=c; if(body.length>10000){reject(Error('Dữ liệu quá dài'));req.destroy();}});req.on('end',()=>{try{resolve(JSON.parse(body||'{}'))}catch{reject(Error('Dữ liệu JSON không hợp lệ'))}});req.on('error',reject);});}
const ipHits = new Map();
const loginHits = new Map();
function rateLimit(map,key,max,windowMs=60000) {
  const now=Date.now(); const hits=(map.get(key)||[]).filter(t=>now-t<windowMs);
  hits.push(now); map.set(key,hits);
  // Prune old keys occasionally to prevent an unbounded in-memory map.
  if (map.size>1000) for (const [k,v] of map) if(v[v.length-1]<now-windowMs) map.delete(k);
  return hits.length>max;
}
function clientIP(req) {
  // Railway places the service behind its reverse proxy. If deployed elsewhere,
  // do not trust user-supplied forwarding headers.
  if(process.env.RAILWAY_PROJECT_ID || IS_RENDER) return String(req.headers['x-forwarded-for']||'').split(',')[0].trim().slice(0,64)||req.socket.remoteAddress||'?';
  return req.socket.remoteAddress||'?';
}
const CHAT_ENABLED=process.env.CHAT_ENABLED!=='false';
const QUIZZES={
 'intro-1':1,'intro-2':2,'ngang-1':1,'ngang-2':1,'doc-1':0,'doc-2':2,
 'lambda-1':1,'lambda-2':0,'pha-1':2,'pha-2':1,'thuthach-1':1,'thuthach-2':0,
 'amnguon-1':0,'amnguon-2':1,'amtanso-1':2,'amtanso-2':0,'amsac-1':0,'amsac-2':1,
 'amcuongdo-1':2,'amcuongdo-2':0,'amdecibel-1':0,'amdecibel-2':0
};
const active = new Map(); // each socket -> {user,room,x,z,...}
const rosters = () => [...active.values()];
function peerView(p){return {id:p.user.id,nickname:p.user.nickname,avatar:p.user.avatar,x:p.x,z:p.z,rot:p.rot,score:(p.user.cleared||[]).length*100};}
function broadcast(room,obj,except=null){let packet=JSON.stringify(obj);for(const [ws,p] of active)if(p.room===room&&ws!==except)sendFrame(ws,packet);}
function roomState(room){return rosters().filter(p=>p.room===room).map(peerView);}
const headers={
 '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml',
 '.png':'image/png','.ico':'image/x-icon','.json':'application/json; charset=utf-8'
};
const server=http.createServer(async (req,res)=>{
  const host=req.headers.host||'localhost'; let url;
  try{url=new URL(req.url, 'http://'+host)}catch{return json(res,400,{error:'URL không hợp lệ'});}
  res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer');
  if(url.pathname.startsWith('/api/')){
    const ip=clientIP(req);
    if(rateLimit(ipHits,ip,240))return json(res,429,{error:'Thao tác quá nhanh, hãy thử lại sau.'});
    try{
      if(req.method==='GET' && url.pathname==='/api/health')return json(res,200,{ok:true,chatEnabled:CHAT_ENABLED,storage:pool?'postgres':'local'});
      if(req.method==='POST' && url.pathname==='/api/register'){
        const data=await readBody(req);
        const username=String(data.username||'').toLowerCase().trim(), pass=String(data.password||'');
        if(!/^[a-z0-9_]{3,18}$/.test(username))return json(res,400,{error:'Tên tài khoản: 3–18 kí tự, chỉ dùng a-z, 0-9 hoặc _.'});
        if(rateLimit(loginHits,'register:'+ip,50))return json(res,429,{error:'Quá nhiều tài khoản được tạo. Vui lòng thử lại sau.'});
        if(pass.length<8||pass.length>128)return json(res,400,{error:'Mật khẩu cần 8–128 kí tự.'});
        if(db.users.some(x=>x.username===username))return json(res,409,{error:'Tên tài khoản đã tồn tại.'});
        const user={id:crypto.randomUUID(),username,nickname:clean(data.nickname,20)||username,passhash:hashPassword(pass),avatar:{...defaults},cleared:[]};
        db.users.push(user);try{await save(user)}catch(e){db.users=db.users.filter(x=>x.id!==user.id);throw e;}return json(res,201,{token:makeToken(user),user:summary(user)});
      }
      if(req.method==='POST' && url.pathname==='/api/login'){
        const data=await readBody(req);const username=String(data.username||'').toLowerCase().trim();
        if(rateLimit(loginHits,'login:'+ip+':'+username,12))return json(res,429,{error:'Bạn thử đăng nhập quá nhiều lần. Hãy đợi một phút.'});
        const u=db.users.find(x=>x.username===username);
        if(!u||!verifyPassword(String(data.password||''),u.passhash))return json(res,401,{error:'Tài khoản hoặc mật khẩu không đúng.'});
        return json(res,200,{token:makeToken(u),user:summary(u)});
      }
      const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');const u=getUser(token);
      if(!u)return json(res,401,{error:'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'});
      if(req.method==='GET' && url.pathname==='/api/me')return json(res,200,{user:summary(u)});
      if(req.method==='POST' && url.pathname==='/api/profile'){
        const data=await readBody(req);
        if(data.nickname!==undefined)u.nickname=clean(data.nickname,20)||u.username;
        if(data.avatar!==undefined)u.avatar=safeAvatar(data.avatar);
        await save(u); for(const p of active.values())if(p.user.id===u.id)broadcast(p.room,{type:'profile',player:peerView(p)});
        return json(res,200,{user:summary(u)});
      }
      if(req.method==='POST' && url.pathname==='/api/answer'){
        const data=await readBody(req); const id=String(data.id||'');
        if(!Object.hasOwn(QUIZZES,id))return json(res,400,{error:'Câu hỏi không tồn tại.'});
        if(data.choice!==QUIZZES[id])return json(res,200,{correct:false,user:summary(u)});
        if(!u.cleared.includes(id)){u.cleared.push(id);await save(u);for(const p of active.values())if(p.user.id===u.id)broadcast(p.room,{type:'profile',player:peerView(p)});}
        return json(res,200,{correct:true,user:summary(u)});
      }
      if(req.method==='GET' && url.pathname==='/api/health')return json(res,200,{ok:true});
      return json(res,404,{error:'Không tìm thấy API.'});
    }catch(e){console.error('API error',e);return json(res,400,{error:'Dữ liệu yêu cầu không hợp lệ.'});}
  }
  if(req.method!=='GET' && req.method!=='HEAD')return json(res,405,{error:'Method not allowed'});
  let filePath=path.join(PUBLIC,decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!filePath.startsWith(PUBLIC+path.sep)||filePath.includes('\0'))return json(res,403,{error:'Forbidden'});
  try{let st=fs.statSync(filePath);if(!st.isFile())throw Error('Not file');
    const ext=path.extname(filePath);res.writeHead(200,{'Content-Type':headers[ext]||'application/octet-stream','Cache-Control': ['.html','.js','.css'].includes(ext)?'no-store':'public, max-age=600'});
    if(req.method==='HEAD')return res.end();fs.createReadStream(filePath).pipe(res);
  }catch{json(res,404,{error:'Không tìm thấy trang.'});}
});

// WebSocket RFC6455 minimal no dependency: browser sends masked, single-frame JSON payloads.
function sendFrame(sock,msg,op=1){if(sock.destroyed)return;const body=Buffer.from(msg||'');const len=body.length;let head;
 if(len<126){head=Buffer.alloc(2);head[1]=len;}
 else if(len<65536){head=Buffer.alloc(4);head[1]=126;head.writeUInt16BE(len,2);}
 else return;
 head[0]=0x80|op;try{sock.write(Buffer.concat([head,body]));}catch{}
}
function parseFrames(sock,chunk){sock.wsBuf=Buffer.concat([sock.wsBuf||Buffer.alloc(0),chunk]);
 while(sock.wsBuf.length>=2){const a=sock.wsBuf;const op=a[0]&15;const fin=Boolean(a[0]&128);const masked=Boolean(a[1]&128);let len=a[1]&127,offset=2;
 if(!fin||!masked){sock.destroy();return;}
 if(len===126){if(a.length<4)return;len=a.readUInt16BE(2);offset=4;}
 if(len===127){sock.destroy();return;}
 if(len>8192){sock.destroy();return;}
 if(a.length<offset+4+len)return;
 const mask=a.subarray(offset,offset+4);offset+=4;let payload=Buffer.from(a.subarray(offset,offset+len));sock.wsBuf=a.subarray(offset+len);
 for(let i=0;i<payload.length;i++)payload[i]^=mask[i%4];
 if(op===8){sendFrame(sock,'',8);sock.end();return;}
 if(op===9){sendFrame(sock,payload,10);continue;}
 if(op===10)continue;
 if(op!==1){sock.destroy();return;}
 try{onMessage(sock,JSON.parse(payload.toString('utf8')))}catch{}
 }
}
function onMessage(ws,msg){if(!msg||typeof msg!=='object')return;
 if(msg.type==='join'){
    if(active.has(ws))return;const user=getUser(msg.token);if(!user){sendFrame(ws,JSON.stringify({type:'error',message:'Cần đăng nhập lại.'}));return ws.end();}
    const room=String(msg.room||'').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,18);
    if(room.length<3){sendFrame(ws,JSON.stringify({type:'error',message:'Mã lớp cần ít nhất 3 kí tự.'}));return;}
    const prior=[...active].filter(([,p])=>p.user.id===user.id);
    for(const [other,p] of prior){broadcast(p.room,{type:'leave',id:user.id},other);active.delete(other);other.end();}
    active.set(ws,{user,room,x:0,z:0,rot:0,lastMove:0,lastChat:0});sendFrame(ws,JSON.stringify({type:'welcome',room,id:user.id,players:roomState(room)}));broadcast(room,{type:'enter',player:peerView(active.get(ws))},ws);return;
 }
 const p=active.get(ws);if(!p)return;
 if(msg.type==='move'){
  const now=Date.now();if(now-p.lastMove<60)return;const x=Number(msg.x),z=Number(msg.z),rot=Number(msg.rot);
  if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(rot))return;
  const dt=Math.min(1.5, Math.max(.07,(now-p.lastMove)/1000));
  const delta=Math.hypot(x-p.x,z-p.z);if(delta>9*dt+3)return;
  p.lastMove=now;p.x=Math.max(-23,Math.min(23,x));p.z=Math.max(-23,Math.min(23,z));p.rot=rot;
  broadcast(p.room,{type:'move',id:p.user.id,x:p.x,z:p.z,rot:p.rot},ws);
 }
 if(msg.type==='chat' && CHAT_ENABLED){
   const now=Date.now();if(now-p.lastChat<1200)return;p.lastChat=now;
   const message=clean(msg.message,120);if(!message)return; if(/https?:\/\/|www\.|@|(?:\+?\d[\d .-]{7,}\d)/i.test(message))return;
   broadcast(p.room,{type:'chat',from:p.user.nickname,id:p.user.id,message,at:now});
 }
}
server.on('upgrade',(req,socket,head)=>{
 if(req.url!=='/ws'||req.headers.upgrade?.toLowerCase()!=='websocket'||req.headers['sec-websocket-version']!=='13')return socket.destroy();
 const key=req.headers['sec-websocket-key'];if(typeof key!=='string'||!/^[-a-zA-Z0-9+/]{22}==$/.test(key))return socket.destroy();
 const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
 socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
 socket.wsBuf=Buffer.alloc(0);socket.on('data',chunk=>parseFrames(socket,chunk));
 const leave=()=>{const p=active.get(socket);if(p){active.delete(socket);broadcast(p.room,{type:'leave',id:p.user.id});}};
 socket.on('close',leave);socket.on('error',leave);if(head?.length)parseFrames(socket,head);
});
const port=Number(process.env.PORT||3000), bind=process.env.HOST||'0.0.0.0';
server.on('error',e=>{if(e.code==='EADDRINUSE'){console.error(`Cổng ${port} đã được dùng. Thử chạy: PORT=3001 node server.mjs`);process.exit(1)}else throw e});
server.listen(port,bind,()=>console.log(`🌊 SóngVerse 3D đang chạy tại http://localhost:${port}`));
process.on('SIGINT',()=>{server.close();process.exit(0)});
