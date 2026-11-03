import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('Railway refuses startup without persistent Volume',async()=>{
 const child=spawn(process.execPath,['server.mjs'],{cwd:ROOT,env:{...process.env,RAILWAY_PROJECT_ID:'railway-demo-project',RAILWAY_VOLUME_MOUNT_PATH:'',DATA_DIR:'/tmp/test-bad-path'}});
 let err='';child.stderr.on('data',c=>err+=c.toString());
 const exit=await new Promise(resolve=>child.once('exit',resolve));
 assert.equal(exit,1);assert.match(err,/Railway Volume/);
});
