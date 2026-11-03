import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function boot(port,dir){
 const child=spawn(process.execPath,['server.mjs'],{cwd:ROOT,env:{...process.env,PORT:String(port),DATA_DIR:dir,RAILWAY_PROJECT_ID:'',RAILWAY_VOLUME_MOUNT_PATH:''}});
 for(let i=0;i<80;i++){try{let r=await fetch('http://127.0.0.1:'+port+'/api/health');if(r.ok)return child;}catch{}await pause(80)}
 child.kill('SIGTERM');throw Error('Server not ready');
}
async function stop(child){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));}
test('Account, signing secret and XP survive restart when DATA_DIR is persistent',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'songverse-durable-'));
 const port=33210+Math.floor(Math.random()*350);
 let child;
 try{
 child=await boot(port,dir); const root='http://127.0.0.1:'+port;
 let r=await fetch(root+'/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'student_persist',password:'a_secure_password_123',nickname:'Hạt sóng'})});
 assert.equal(r.status,201); const {token}=await r.json();
 r=await fetch(root+'/api/answer',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({id:'intro-1',choice:1})});
 assert.equal((await r.json()).user.score,100);
 assert.ok(existsSync(path.join(dir,'secret.key'))&&existsSync(path.join(dir,'users.json')));
 const secret=readFileSync(path.join(dir,'secret.key')).toString('hex');
 await stop(child);child=null;
 child=await boot(port,dir);
 r=await fetch(root+'/api/me',{headers:{Authorization:'Bearer '+token}});
 assert.equal(r.status,200);assert.equal((await r.json()).user.score,100);
 assert.equal(readFileSync(path.join(dir,'secret.key')).toString('hex'),secret);
 }finally{if(child)await stop(child);rmSync(dir,{force:true,recursive:true})}
});
