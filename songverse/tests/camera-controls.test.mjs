import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rotateXZ,movementFromView,orbitBy,orbitByKey,cameraEye,facingFromMovement} from '../public/controls.js';
const js=readFileSync(new URL('../public/game.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const near=(actual,expected,where)=>assert.ok(Math.abs(actual-expected)<1e-9,`${where}: wanted ${expected}, got ${actual}`);
const expectVector=(v,x,z)=>{near(v.x,x,'x');near(v.z,z,'z')};
test('W always goes away from viewer and D stays screen-right at ALL orbital angles',()=>{
 for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI,3*Math.PI/2,2*Math.PI]){
  const w=movementFromView(0,1,angle),s=movementFromView(0,-1,angle);
  const d=movementFromView(1,0,angle),a=movementFromView(-1,0,angle);
  expectVector({x:w.x+s.x,z:w.z+s.z},0,0);
  expectVector({x:d.x+a.x,z:d.z+a.z},0,0);
  near(w.x*d.x+w.z*d.z,0,'screen axes orthogonal');
  near(Math.hypot(w.x,w.z),1,'forward unit length');
  near(Math.hypot(d.x,d.z),1,'right unit length');
  near(facingFromMovement(w.x,w.z),Math.atan2(w.x,w.z),'facing tracks world movement');
 }
 expectVector(movementFromView(0,1,0),0,-1);
 expectVector(movementFromView(0,1,Math.PI/2),-1,0);
 expectVector(movementFromView(1,0,0),1,0);
 expectVector(movementFromView(1,0,Math.PI/2),0,-1);
});
test('diagonal movement stays normalized (no boost) and obeys screen axes',()=>{
 const v=movementFromView(1,1,.71);near(Math.hypot(v.x,v.z),1,'diagonal');
});
test('camera supports full 360 degree orbit and low/high elevation',()=>{
 const start=.10, big=orbitBy(start,.20,700,500);
 assert.ok(big.angle>=0&&big.angle<2*Math.PI);
 near(big.pitch,1.32,'max pitch');
 const below=orbitBy(start,.20,-700,-500);near(below.pitch,-.18,'min pitch');
 const eye1=cameraEye(0,0,0,.20,10),eye2=cameraEye(0,0,Math.PI,.20,10);
 near(eye1[0]+eye2[0],0,'opposite x');near(eye1[2]+eye2[2],0,'opposite z');
 assert.ok(orbitByKey(0,.5,'left').angle>5);
 assert.ok(orbitByKey(0,.5,'up').pitch>.5);
});
test('all avatar hair and face locations rotate within same head rig',()=>{
 const point=rotateXZ(.5,.25,Math.PI/2);expectVector(point,.25,-.5);
 const original=rotateXZ(.5,.25,0);expectVector(original,.5,.25);
 const rig=js.slice(js.indexOf('function chibi('),js.indexOf('function move('));
 assert.match(rig,/const head=.+=>part\(/);
 for(const item of ["head('sphere',skin", "head('sphere',hair", "head('sphere','#29334A'", "head('sphere','#9A5A62'", "head('cone',hair"]){assert.ok(rig.includes(item),'missing head-rig mesh: '+item)}
 assert.match(rig,/const point=rotateXZ\(lx,lz,r\)/);
});
test('real camera interactions available by drag, touch and visible buttons, plus soundtrack',()=>{
 assert.match(html,/id="cameraPad"/);assert.match(html,/data-orbit="left"/);assert.match(html,/id="cameraZoomOut"/);
 assert.match(js,/attachCameraDrag\(canvas\)/);assert.match(js,/attachCameraDrag\(\$\('cameraPad'\)\)/);
 assert.match(js,/movementFromView\(strafe,forward,state.camAngle\)/);
 assert.match(js,/function scheduleMusic/);assert.match(html,/id="musicBtn"/);
});
