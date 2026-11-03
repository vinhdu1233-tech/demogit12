import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
async function run(env){return new Promise((resolve,reject)=>{const p=spawn(process.execPath,['server.mjs'],{cwd:ROOT,env:{...process.env,PORT:'38001',RAILWAY_PROJECT_ID:'',RAILWAY_VOLUME_MOUNT_PATH:'',DATABASE_URL:'',...env}});let stderr='';p.stderr.on('data',b=>stderr+=b);p.on('exit',code=>resolve({code,stderr}));p.on('error',reject);setTimeout(()=>{p.kill();reject(new Error('unexpected server startup'))},3000).unref();});}
test('Render refuses to run without persistent database',async()=>{
 const r=await run({RENDER:'true'});
 assert.equal(r.code,1);assert.match(r.stderr,/Thiếu DATABASE_URL/);
});
test('Online Postgres mode requires stable session secret',async()=>{
 const r=await run({RENDER:'true',DATABASE_URL:'postgresql://dummy.invalid:5432/test',SESSION_SECRET:''});
 assert.equal(r.code,1);assert.match(r.stderr,/SESSION_SECRET/);
});
