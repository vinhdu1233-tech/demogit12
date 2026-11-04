/* SóngVerse V7 — distinctive low-poly 3D micro-laboratories.
   Every one of 34 stations has its own symbol and physics animation.
   Only nearby station effects are rendered; density drops for touch devices. */
const PI=Math.PI;
const palettes={wave:'#62e0c3',amber:'#ffbb82',blue:'#85adf2',ice:'#a0f4ff',pink:'#f7a8da',gold:'#ffe19a'};
export const effectTags={
intro:'MẶT SÓNG LAN TRUYỀN',ngang:'DAO ĐỘNG VUÔNG GÓC',doc:'NÉN & GIÃN',lambda:'ĐO BƯỚC SÓNG',pha:'HAI DAO ĐỘNG LỆCH PHA',thuthach:'CỔNG THỬ THÁCH',
phanxa:'PHẢN XẠ XUNG',khucxa:'BẺ HƯỚNG TIA',nhieuxa:'KHE HẸP NHIỄU XẠ',
amnguon:'CHUÔNG NGÂN',amtanso:'VÒNG TẦN SỐ',amsac:'DÀN HỌA ÂM',amcuongdo:'NĂNG LƯỢNG LAN TỎA',amdecibel:'ĐỒNG HỒ DECIBEL',amphanxa:'ECHO TỪ VÁCH',amsieudung:'SONAR SIÊU ÂM',
emdientu:'ĐIỆN TRƯỜNG ⟂ TỪ TRƯỜNG',emchankhong:'CHÂN KHÔNG',empho:'CẦU VỒNG ĐIỆN TỪ',emungdung:'ANTEN & ỨNG DỤNG',
nuocnguon:'HAI NGUỒN GỢN SÓNG',nuoccucdai:'ĐƯỜNG CỰC ĐẠI',nuoccuctieu:'ĐƯỜNG CỰC TIỂU',nuocdemvan:'VẠCH GIAO THOA',
anhsangyoung:'THIẾT BỊ HAI KHE',anhsangkhoangvan:'ĐO KHOẢNG VÂN',anhsangvansang:'DẢI VÂN SÁNG',anhsangvantoi:'VÂN TỐI ĐỐI XỨNG',anhsangmau:'LĂNG KÍNH SẮC MÀU',
dungphanxa:'SÓNG ĐỔI PHA',dungnutbung:'NÚT & BỤNG RUNG',dungcodinh:'DÂY HAI ĐẦU NÚT',dungtudo:'DÂY MỘT ĐẦU BỤNG',dunghoam:'HỌA ÂM TRÊN DÂY'};
export function renderStationEffect(draw,s,t,lowPower=false){
 const x=s.x,z=s.z,id=s.id; const phase=t*2.2;const detail=lowPower?7:12;
 const ball=(dx,dy,dz,r,c)=>draw('sphere',c,x+dx,dy,z+dz,r,r,r);
 const bar=(dx,dy,dz,sx,sy,sz,c)=>draw('box',c,x+dx,dy,z+dz,sx,sy,sz);
 const pole=(dx,dy,dz,r,h,c)=>draw('cyl',c,x+dx,dy,z+dz,r,h,r);
 const orbit=(radius,y,col,count=detail,ang=t)=>{for(let j=0;j<count;j++){const theta=2*PI*j/count;ball(Math.cos(theta)*radius,y+Math.sin(t*2+j)*.09,Math.sin(theta)*radius,.085,col)}};
 const arc=(r,y,col,stepCount=detail,spin=0)=>{for(let j=0;j<stepCount;j++){const a=(j/stepCount)*PI*2+spin;ball(Math.cos(a)*r,y,Math.sin(a)*r,.075,col)}};
 const path=(points,col,size=.085)=>{for(const [dx,dy,dz] of points)ball(dx,dy,dz,size,col)};
 const waved=(axis,n,amp,col,mode=1)=>{for(let j=0;j<n;j++){const u=j/(n-1),v=(u-.5)*4,osc=Math.sin(u*PI*2*mode-phase)*amp;
  if(axis==='x')ball(v,3.45+osc,-.38,.1,col);else ball(v,3.45,-.38+osc,.1,col)}};
 const ripple=(xOff,zOff,rate=1,col=palettes.ice)=>{for(let k=0;k<2;k++){const rr=.5+((t*rate+k*1.5)%2.8);for(let j=0;j<(lowPower?7:11);j++){const a=j*2*PI/(lowPower?7:11);ball(xOff+rr*Math.cos(a),.48,zOff+rr*Math.sin(a),.078,col)}}};
 const string=(mode=2,free=false,reverse=false,col=palettes.gold)=>{
  bar(-2.2,3.6,-.6,.16,2,.2,'#8792bb');if(!free)bar(2.2,3.6,-.6,.16,2,.2,'#8792bb');
  for(let j=0;j<(lowPower?12:18);j++){const u=j/(lowPower?11:17),envelope=free?Math.sin((2*mode-1)*PI*u/2):Math.sin(mode*PI*u);
   const y=3.5+(.64*envelope*Math.sin(t*4.1+(reverse?PI:0)));
   ball(-2.1+4.2*u,y,-.7,.10,col);
  }
 };
 const ray=(y,offset,col)=>{for(let j=0;j<(lowPower?7:11);j++){const u=j/(lowPower?6:10);ball(-1.7+u*3.4,y+u*offset,0,.08,col)}};
 const EM=(isVacuum=false)=>{for(let j=0;j<(lowPower?12:20);j++){const u=j/(lowPower?11:19),v=(u-.5)*4.6,osc=Math.sin(u*PI*3-t*2.6);
   ball(v,3.45+osc*.5,-.4,.095,'#ed8db3');ball(v,3.45,-.4+osc*.5,.095,'#85bfff')}
   if(isVacuum){draw('sphere','#eaf1ff',x,3.5,z,1.5,.08,1.5);ball(0,4.45,0,.22,'#f6d8ff')}
 };
 const interferometer=(mode='sources')=>{
  pole(-1.45,.55,-.3,.25,.65,'#86bfe5');pole(1.45,.55,-.3,.25,.65,'#86bfe5');
  ripple(-1.45,-.3,1.02);ripple(1.45,-.3,1.02,'#b4f7df');
  if(mode==='max')arc(2.1,.49,'#f9e997');
  if(mode==='min'){for(let j=0;j<5;j++)ball(-1.5+j*.75,.5,0,.15,'#677dbd')}
  if(mode==='count')for(let j=-3;j<=3;j++)bar(j*.55,.42,2,.1,.07,.45,j%2?'#ffffff':'#a4aefb');
 };
 switch(id){
 case 'intro':ripple(0,0,.95);ball(0,3.6,0,.45,palettes.wave);break;
 case 'ngang':waved('x',lowPower?12:17,.64,palettes.pink);bar(0,3.45,-.4,4.3,.055,.055,'#7ad8c4');break;
 case 'doc':for(let j=0;j<(lowPower?10:18);j++){const u=j/(lowPower?9:17);ball(-2+u*4+.2*Math.sin(phase+u*PI*5),3.36,-.4,.13,(j%4?'#6ac6e8':'#e7a3e6'))}break;
 case 'lambda':waved('x',lowPower?12:18,.5,'#7ad9c6');bar(0,4.2,-.45,3.6,.04,.07,'#ffe6aa');for(let j=0;j<5;j++)bar(-1.7+j*.85,4.16,-.45,.05,.15,.08,'#fff');break;
 case 'pha':for(let row=0;row<2;row++)for(let j=0;j<10;j++){const u=j/9;ball(-2+u*4,3.1+row*.64+Math.sin(u*PI*2-phase+row*PI)*.23,-.1,.1,row?'#ffbd77':'#83b2ee')}break;
 case 'thuthach':for(let j=0;j<6;j++){const a=2*PI*j/6+t*.2;ball(Math.cos(a)*1.45,3.6+Math.sin(a*3+t)*.3,Math.sin(a)*1.45,.2,j%2?'#f9df91':'#a9a4ff')}break;
 case 'phanxa':bar(1.75,3.5,0,.2,2.5,1.6,'#b9c2dd');for(let j=0;j<9;j++){const u=j/8;ball(-1.9+u*3.4,3.5+.38*Math.sin(u*PI*2-phase),-.3,.09,'#f9a8a4')}break;
 case 'khucxa':bar(0,3.6,0,.14,2.2,1.8,'#c5deee');ray(3.8,-.7,'#efb57d');for(let j=0;j<8;j++){const u=j/7;ball(u*2.1,3.3+u*.9,.25,.1,'#6c91e3')}break;
 case 'nhieuxa':bar(0,4.25,0,.2,1.0,1.8,'#98abc9');bar(0,2.8,0,.2,.8,1.8,'#98abc9');for(let j=0;j<3;j++)arc(.6+j*.45,3.5,'#8ae1e5');break;
 case 'amnguon':pole(0,3.45,-.4,.52,.85,'#f2bd6f');ball(0,3.9,-.4,.38,'#ffe5b1');orbit(1.4,3.55,'#f6e1ac',detail);break;
 case 'amtanso':for(let j=0;j<10;j++){const f=j*.22;ball(-2+j*.45,3.4+.54*Math.sin(phase*(j%2+1)+j),-.4,.13,j%2?'#f1be95':'#8de2ee')}break;
 case 'amsac':for(let j=0;j<6;j++){const h=.25+.8*Math.abs(Math.sin(j*.92+phase));bar(-1.5+j*.6,3.1+h/2,-.4,.32,h,.25,j%2?'#f2acbb':'#99ddeb')}break;
 case 'amcuongdo':for(let k=0;k<3;k++)arc(.7+k*.7,3.2,'#ffd49a',detail);ball(0,3.35,0,.5,'#f3a97d');break;
 case 'amdecibel':pole(0,3.5,0,1.0,.16,'#fce3b1');for(let j=0;j<7;j++){const a=(j-3)*.35;ball(Math.sin(a)*.72,3.7+Math.cos(a)*.2,.75,.1,j<3?'#84d8bb':j<5?'#f3c173':'#e88086')}break;
 case 'amphanxa':bar(2,3.2,0,.28,2.4,1.7,'#c2c5c6');for(let j=0;j<7;j++){const u=j/6;ball(-1.6+u*3.4,3.6+.17*Math.sin(phase+u*6),.6,.1,u<.5?'#9ce6e5':'#f6c080')}break;
 case 'amsieudung':pole(0,3.4,0,.55,.55,'#d4b7ea');for(let k=0;k<3;k++)arc(.7+k*.55,3.65,'#8ee5ea',detail,t*.3);ball(1.8,4.1,0,.4,'#ffcf98');break;
 case 'emdientu':EM();break;
 case 'emchankhong':EM(true);break;
 case 'empho':{const colors=['#d86bc3','#8b83ee','#70b3f4','#83d5b9','#f6e17d','#f5a778'];for(let j=0;j<6;j++){bar(-1.6+j*.65,3.4+Math.sin(t*1.2+j)*.18,0,.42,.9,.20,colors[j])}}break;
 case 'emungdung':pole(0,3.45,0,.22,2.1,'#9da6c1');ball(0,4.75,0,.31,'#e8a4d1');orbit(1.1,4.1,'#85cff4',lowPower?6:10);orbit(1.9,3.7,'#c7b1fc',lowPower?7:12);break;
 case 'nuocnguon':interferometer('sources');break;
 case 'nuoccucdai':interferometer('max');break;
 case 'nuoccuctieu':interferometer('min');break;
 case 'nuocdemvan':interferometer('count');break;
 case 'anhsangyoung':bar(-1.05,3.45,0,.22,2.2,1.8,'#b5a2e2');bar(1.65,3.45,0,.22,2.2,2.2,'#bac4de');ray(3.8,0,'#f4d5ed');break;
 case 'anhsangkhoangvan':for(let j=-4;j<=4;j++){bar(j*.45,3.3,0,.10,.85,.19,j%2?'#f7b7cb':'#f6edb4')}bar(0,4.15,0,3.4,.06,.12,'#fff');break;
 case 'anhsangvansang':for(let j=0;j<7;j++){const h=1.1+.4*Math.sin(phase+j*.8);bar(-1.8+j*.6,3.3,0,.16,h,.15,j%2?'#ffd88e':'#f9efff')}break;
 case 'anhsangvantoi':for(let j=0;j<8;j++){bar(-2+j*.55,3.2,0,.27,1.4,.18,j%2?'#2c3856':'#ffd59a')}break;
 case 'anhsangmau':{const colors=['#ff7f92','#f6b779','#f8dd8a','#8bdd9b','#80bdf5','#bb9bea'];for(let j=0;j<6;j++){const a=(j-2.5)*.16;for(let k=0;k<4;k++)ball(-1.7+k*1.1,3.6+a*k,0,.1,colors[j])}}break;
 case 'dungphanxa':string(1,false,true,'#f6b6c1');break;
 case 'dungnutbung':string(3,false,false,'#f5d996');for(let j=0;j<4;j++)ball(-2.1+j*1.4,3.5,-.7,.16,'#fcaaaa');break;
 case 'dungcodinh':string(2,false,false,'#a2d7ee');break;
 case 'dungtudo':string(2,true,false,'#c7a2e9');break;
 case 'dunghoam':string(4,false,false,'#ebc18a');for(let j=0;j<4;j++)ball(-1.55+j,4.45+Math.sin(t*2+j)*.18,.6,.12,'#fde8a6');break;
 default:orbit(1.2,3.5,palettes.blue);
 }
}
