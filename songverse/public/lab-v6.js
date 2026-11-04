// Animated laboratory canvases: intuitive models, not real-time physical measurements.
const wave=(x,t,k=1)=>Math.sin(x*k-t);
const label=(c,text,x,y,size=13)=>{c.fillStyle='#304b74';c.font='800 '+size+'px system-ui';c.fillText(text,x,y)};
const line=(c,a,b,color='#5b91d9',th=3)=>{c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=color;c.lineWidth=th;c.stroke()};
const circle=(c,x,y,r,color)=>{c.beginPath();c.arc(x,y,Math.max(.5,r),0,Math.PI*2);c.fillStyle=color;c.fill()};
const wavePlot=(c,w,h,fn,color='#6186d8')=>{c.beginPath();for(let x=18;x<w-18;x+=3){const y=h/2-70*fn(x);if(x===18)c.moveTo(x,y);else c.lineTo(x,y)}c.lineWidth=3.5;c.strokeStyle=color;c.stroke()};
export function labConfigV6(id){
 const f=['f','Tần số mô phỏng',.5,5,.5], w=['wavelengthNm','Bước sóng λ (nm)',400,700,10],
 a=['slitGap','Khe a (mm)',.2,2,.1],D=['screenDistance','Màn D (m)',.5,3,.1],
 sep=['sourceSpacing','Khoảng 2 nguồn',3,15,1], harmonic=['harmonic','Số bó / mode k',1,6,1];
 if(['phanxa','dungphanxa'].includes(id))return [['boundary','Đầu cố định(0) / tự do(1)',0,1,1],f];
 if(id==='khucxa')return [['speedRatio','v₂/v₁',.5,1.5,.1],f];
 if(id==='nhieuxa')return [['aperture','Độ rộng khe / λ',.3,5,.1],f];
 if(['amphanxa','amsieudung'].includes(id))return [['distance','Khoảng cách (m)',1,25,1],['soundSpeed','Tốc độ âm (m/s)',300,1500,100]];
 if(id==='emdientu')return [f,['A','Biên độ trường',.2,1,.1]];
 if(id==='emchankhong')return [['vacuum','Chân không (1) / không khí (0)',0,1,1],f];
 if(id==='empho')return [['spectrum','Vùng phổ điện từ (1–6)',1,6,1]];
 if(id==='emungdung')return [['spectrum','Chọn sóng (1–6)',1,6,1]];
 if(['nuocnguon','nuoccucdai','nuoccuctieu','nuocdemvan'].includes(id))return [sep,['waveLength','Bước sóng (đ.v.)',2,10,1],['phaseMode','Hai nguồn ngược pha (1)',0,1,1]];
 if(['anhsangyoung','anhsangkhoangvan','anhsangvansang','anhsangvantoi','anhsangmau'].includes(id))return [w,a,D];
 if(['dungnutbung','dungcodinh','dunghoam','dungtudo'].includes(id))return [harmonic,['A','Biên độ',.2,1,.1]];
 return [f];
}
export function drawChapterLab(c,w,h,s,l,t){
 const id=s.id;
 if(!s.chapter || (s.chapter===1&&!['phanxa','khucxa','nhieuxa'].includes(id)) || (s.chapter===2&&!['amphanxa','amsieudung'].includes(id)))return false;
 c.save();c.clearRect(0,0,w,h);c.fillStyle='#f1f7ff';c.fillRect(0,0,w,h);
 c.strokeStyle='#dce8fa';c.lineWidth=1;
 for(let y=32;y<h;y+=32){c.beginPath();c.moveTo(14,y);c.lineTo(w-14,y);c.stroke()}
 const mid=h/2,x0=30;
 if(['phanxa','dungphanxa'].includes(id)){
   const boundary=w-72,travel=((t*.38)%1)*2,reflect=travel>1,coord=reflect?boundary-(travel-1)*(boundary-45):45+travel*(boundary-45);
   line(c,[boundary,22],[boundary,h-15],'#e09b91',7);
   wavePlot(c,w,h,x=>{const d=(x-coord)/46;const pulse=Math.exp(-d*d*4);return pulse*(reflect&&l.boundary===0?-1:1)*l.A},'#7884dd');
   label(c,l.boundary===0?'ĐẦU CỐ ĐỊNH · XUNG ĐẢO PHA':'ĐẦU TỰ DO · XUNG CÙNG PHA',20,23,12);
   label(c,reflect?'↖ Sóng phản xạ':'Sóng tới →',w*.42,h-16,12);
 }else if(id==='khucxa'){
   c.fillStyle='#d6eee8';c.fillRect(w/2,25,w/2,h-50);line(c,[w/2,25],[w/2,h-25],'#8eafc5',3);
   const r=l.speedRatio||1,dx=Math.min(185,105*r);line(c,[30,h-28],[w/2,mid],'#d58e67',6);line(c,[w/2,mid],[w/2+dx,mid-78*r],'#5c84c9',6);
   circle(c,w/2,mid,8,'#fff');label(c,'MÔI TRƯỜNG 1',45,31);label(c,'MÔI TRƯỜNG 2',w/2+22,31);
   label(c,'v₂/v₁ = '+r.toFixed(1)+' · f không đổi',w/2+20,h-18);
 }else if(id==='nhieuxa'){
   const ap=l.aperture||1;
   line(c,[w*.43,16],[w*.43,mid-9*ap],'#67778f',8);line(c,[w*.43,mid+9*ap],[w*.43,h-15],'#67778f',8);
   for(let j=0;j<5;j++){const x=16+((t*45+j*68)%(w*.43-23));line(c,[x,35],[x,h-35],'#91c7e4',2)}
   for(let j=0;j<4;j++){const r=(t*35+j*50)%270;c.beginPath();c.arc(w*.43,mid,r,-Math.PI/2,Math.PI/2);c.strokeStyle='#72bcd9';c.lineWidth=2;c.stroke()}
   label(c,'SÓNG TỚI',27,22);label(c,'SAU KHE: LAN TỎA',w*.57,22);
 }else if(['amphanxa','amsieudung'].includes(id)){
   const boundary=w-80,travel=((t*.34)%1)*2,px=travel<1?38+travel*(boundary-38):boundary-(travel-1)*(boundary-38);
   line(c,[boundary,37],[boundary,h-15],'#d1a06e',8);
   for(let j=0;j<3;j++){const r=(j*24+(t*30)%25);c.beginPath();c.arc(px,mid,r,0,Math.PI*2);c.strokeStyle='#75b5da77';c.lineWidth=2;c.stroke()}
   circle(c,38,mid,14,'#e6aa76');label(c,'NGUỒN',15,mid-22,12);
   label(c,'D = '+l.distance+' m',w*.48,40);
   const delay=2*l.distance/l.soundSpeed;label(c,'Δt = 2D/v = '+delay.toFixed(3)+' s',w*.40,h-22);
   label(c,travel<1?'TÍN HIỆU ĐI →':'← PHẢN HỒI',w*.40,mid-22);
 }else if(['emdientu','emchankhong','empho','emungdung'].includes(id)){
   if(['emdientu','emchankhong'].includes(id)){
     const activeEM=true,activeSound=id==='emchankhong'&&l.vacuum===0;
     line(c,[25,mid],[w-30,mid],'#8b96b0',2);
     c.beginPath();for(let x=25;x<w-25;x+=4){const y=mid-46*wave(x*.035,t*3)*l.A;c.lineTo(x,y)}c.strokeStyle='#ec7f9c';c.lineWidth=3;c.stroke();
     c.beginPath();for(let x=25;x<w-25;x+=4){const y=mid+28*wave(x*.035,t*3)*l.A;c.lineTo(x,y)}c.strokeStyle='#5c9bd5';c.lineWidth=3;c.stroke();
     label(c,id==='emdientu'?'E ↕  ⟂  B  ·  CẢ HAI ⟂ HƯỚNG TRUYỀN':'SÓNG ĐIỆN TỪ VẪN TRUYỀN',20,24,13);
     if(id==='emchankhong'){label(c,l.vacuum===1?'CHÂN KHÔNG: SÓNG ÂM KHÔNG TRUYỀN':'KHÔNG KHÍ: SÓNG ÂM CÓ THỂ TRUYỀN',25,h-15,12);}
   }else{
     const bands=['Vô tuyến','Hồng ngoại','Ánh sáng','Tử ngoại','Tia X','Gamma'],colors=['#98bceb','#e6b28c','#e1d176','#b59add','#84b3cf','#7b87bb'];
     const bw=(w-34)/6;bands.forEach((b,i)=>{c.fillStyle=colors[i];c.fillRect(17+i*bw,70,bw-3,50);c.save();c.translate(22+i*bw,139);c.rotate(-.25);label(c,b,0,0,10);c.restore()});
     const k=l.spectrum||3;c.strokeStyle='#ec5984';c.lineWidth=5;c.strokeRect(17+(k-1)*bw,67,bw-3,56);
     label(c,'CHỌN: '+bands[k-1],20,37,14);label(c,id==='empho'?'λ giảm → f tăng →':'Ứng dụng: truyền tin / cảm biến / chẩn đoán',20,h-17,12);
   }
 }else if(['nuocnguon','nuoccucdai','nuoccuctieu','nuocdemvan'].includes(id)){
   const x1=w/2-l.sourceSpacing*9,x2=w/2+l.sourceSpacing*9,y0=mid,k=2*Math.PI/(l.waveLength*8),phase=l.phaseMode*Math.PI;
   const cell=11;for(let y=22;y<h-19;y+=cell)for(let x=12;x<w-12;x+=cell){
     const r1=Math.hypot(x-x1,y-y0),r2=Math.hypot(x-x2,y-y0);
     const u=Math.sin(k*r1-t*3)+Math.sin(k*r2-t*3+phase);
     let v=Math.min(1,Math.abs(u)/2);
     if(id==='nuoccucdai'||id==='nuoccuctieu'){v=Math.abs(Math.cos((k*(r1-r2)+phase)/2));if(id==='nuoccuctieu')v=1-v;}
     const q=Math.floor(100+115*v);c.fillStyle='rgb('+Math.floor(q*.55)+','+Math.floor(q*.86)+','+q+')';c.fillRect(x,y,cell-1,cell-1)
   }
   circle(c,x1,y0,8,'#ffe3a9');circle(c,x2,y0,8,'#ffe3a9');
   label(c,id==='nuoccucdai'?'CỰC ĐẠI SÁNG':'nuoccuctieu'===id?'CỰC TIỂU SÁNG':id==='nuocdemvan'?'ĐẾM THEO HIỆU ĐƯỜNG ĐI':'GỢN SÓNG TỪ 2 NGUỒN',19,19,12);
 }else if(id.startsWith('anhsang')){
   const a=l.slitGap||.5,D=l.screenDistance||1.5,lambda=l.wavelengthNm||550;
   const gapPx=Math.max(9,Math.min(125,lambda/550*D/a*35)),center=w/2;
   const grad=c.createLinearGradient(0,0,w,0);grad.addColorStop(0,'#152438');grad.addColorStop(.5,'#254763');grad.addColorStop(1,'#152438');c.fillStyle=grad;c.fillRect(16,42,w-32,h-72);
   for(let x=18;x<w-17;x+=2){const phase=Math.PI*(x-center)/gapPx,bright=Math.cos(phase)**2;
     if(id==='anhsangvantoi') { /* dark bands remain visually identifiable */ }
     const color=lambda>600?[255,99,66]:lambda<480?[117,118,249]:[85,217,165];
     c.fillStyle='rgba('+color.join(',')+','+(.12+.82*bright)+')';c.fillRect(x,50,2,h-90)
   }
   line(c,[center,42],[center,h-30],'#ffffff66',2);
   label(c,'VÂN SÁNG ⇆ VÂN TỐI  •  i = λD/a',20,26,12);
   const iMm=lambda*1e-6*D/a*1e3;label(c,'i = '+iMm.toFixed(2)+' mm · λ = '+lambda+' nm',20,h-12,12);
 }else if(id.startsWith('dung')){
   const n=Math.max(1,l.harmonic||2),free=id==='dungtudo',start=30,end=w-30;
   for(let x=start;x<=end;x+=2){
     const u=(x-start)/(end-start),envelope=free?Math.sin((n*2-1)*Math.PI*u/2):Math.sin(n*Math.PI*u);
     const y=mid-71*l.A*envelope*Math.sin(t*3.8);
     if(x===start)c.beginPath(),c.moveTo(x,y);else c.lineTo(x,y)
   }
   c.strokeStyle='#6489d9';c.lineWidth=4;c.stroke();
   const nodes=free?n: n+1;for(let j=0;j<nodes;j++){const x=start+(free?(j*2/(2*n-1)):j/n)*(end-start);circle(c,x,mid,5,'#e67f90')}
   line(c,[start,mid-83],[start,mid+83],'#6f7185',7);if(!free)line(c,[end,mid-83],[end,mid+83],'#6f7185',7);
   label(c,free?'1 ĐẦU CỐ ĐỊNH – 1 ĐẦU TỰ DO':'DÂY HAI ĐẦU CỐ ĐỊNH',18,22,12);
   label(c,free?'ℓ = (2k−1)λ/4':'ℓ = kλ/2',20,h-12,13);
 }
 c.restore();return true;
}
