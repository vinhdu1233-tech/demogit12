import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=mkdtempSync(path.join(tmpdir(),'songverse-test-'));
const port=32480+Math.floor(Math.random()*600);
const server=spawn(process.execPath,['server.mjs'],{cwd:ROOT,env:{...process.env,PORT:String(port),DATA_DIR:dataDir}});
const base='http://127.0.0.1:'+port;
async function ready(){for(let i=0;i<50;i++){try{const r=await fetch(base+'/');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Server not ready');}
function waitMessage(ws,where,timeout=5000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Timeout '+where)),timeout);function cb(ev){const m=JSON.parse(ev.data);if(m.type===where){clearTimeout(timer);ws.removeEventListener('message',cb);resolve(m)}}ws.addEventListener('message',cb)})}
async function api(endpoint,data,token){const r=await fetch(base+'/api/'+endpoint,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,...await r.json()}}
test('tài khoản, điểm, tùy biến và nhiều người cùng phòng',async()=>{
 await ready();
 const u=await api('register',{username:'student_01',password:'mypassword123',nickname:'Hạt sóng'});assert.equal(u.status,201);assert.ok(u.token);
 const duplicate=await api('register',{username:'student_01',password:'mypassword123'});assert.equal(duplicate.status,409);
 const wrong=await api('login',{username:'student_01',password:'badpassword'});assert.equal(wrong.status,401);
 const login=await api('login',{username:'student_01',password:'mypassword123'});assert.equal(login.status,200);
 const profile=await api('profile',{nickname:'Sóng nhỏ',avatar:{skin:'#976342',hair:'#554AB4',outfit:'#39A99B',style:'bun',accessory:'cat'}},u.token);assert.equal(profile.user.avatar.accessory,'cat');
 const q1=await api('answer',{id:'intro-1',choice:0},u.token);assert.equal(q1.correct,false);assert.equal(q1.user.score,0);
 const q2=await api('answer',{id:'intro-1',choice:1},u.token);assert.equal(q2.correct,true);assert.equal(q2.user.score,100);
 const q3=await api('answer',{id:'intro-1',choice:1},u.token);assert.equal(q3.user.score,100);
 const v=await api('register',{username:'student_02',password:'pass123456',nickname:'Mây tím'});
 const a=new WebSocket(`ws://127.0.0.1:${port}/ws`),b=new WebSocket(`ws://127.0.0.1:${port}/ws`);
 await Promise.all([new Promise(r=>a.addEventListener('open',r)),new Promise(r=>b.addEventListener('open',r))]);
 const aw=waitMessage(a,'welcome');a.send(JSON.stringify({type:'join',room:'11A1-SONG',token:u.token}));await aw;
 const enter=waitMessage(a,'enter');const bw=waitMessage(b,'welcome');b.send(JSON.stringify({type:'join',room:'11A1-SONG',token:v.token}));await bw;const en=await enter;assert.equal(en.player.nickname,'Mây tím');
 const chatting=waitMessage(a,'chat');b.send(JSON.stringify({type:'chat',message:'Chào bạn!'}));const message=await chatting;assert.equal(message.message,'Chào bạn!');
 const moved=waitMessage(a,'move');b.send(JSON.stringify({type:'move',x:1,z:0,rot:0}));assert.equal((await moved).x,1);
 a.close();b.close();
 const html=await(await fetch(base+'/')).text();assert.match(html,/SóngVerse/);const js=await(await fetch(base+'/game.js')).text();assert.match(js,/Bước sóng & tốc độ/);
});
after(()=>{server.kill('SIGTERM');rmSync(dataDir,{recursive:true,force:true});});
