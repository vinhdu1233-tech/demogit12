// Pure math shared by the 3D game and regression tests. Y is up; +Z is avatar forward.
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function rotateXZ(x,z,angle){return {x:x*Math.cos(angle)+z*Math.sin(angle),z:-x*Math.sin(angle)+z*Math.cos(angle)}}
export function movementFromView(strafe,forward,camAngle){
 const magnitude=Math.hypot(strafe,forward);
 if(magnitude<.001)return {x:0,z:0};
 const right=strafe/Math.max(1,magnitude),up=forward/Math.max(1,magnitude);
 return {x:right*Math.cos(camAngle)-up*Math.sin(camAngle),z:-right*Math.sin(camAngle)-up*Math.cos(camAngle)};
}
export const facingFromMovement=(x,z)=>Math.atan2(x,z);
export function orbitBy(angle,pitch,dx,dy){
 return {angle:((angle+dx*.009)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),pitch:clamp(pitch+dy*.006,-.18,1.32)};
}
export function orbitByKey(angle,pitch,direction){
 const increments={left:[-.21,0],right:[.21,0],up:[0,.15],down:[0,-.15]};
 const [yaw,tilt]=increments[direction]||[0,0];
 return {angle:((angle+yaw)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),pitch:clamp(pitch+tilt,-.18,1.32)};
}
export function cameraEye(x,z,angle,pitch,distance){
 const y=Math.max(.75,1.42+Math.sin(pitch)*distance);
 const range=Math.cos(pitch)*distance;
 return [x+Math.sin(angle)*range,y,z+Math.cos(angle)*range];
}
