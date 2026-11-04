'use strict';
import { movementFromView, rotateXZ, orbitBy, cameraEye, orbitByKey, facingFromMovement } from './controls.js';
import {chapterZones,addedStations} from './chapter2.js';
import {labConfigV6,drawChapterLab} from './lab-v6.js';
import {renderStationEffect,effectTags} from './effects-v7.js';
const $=id=>document.getElementById(id);
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const state={token:localStorage.getItem('sv_token')||'',user:null,room:localStorage.getItem('sv_room')||'11A1-SONG',ws:null,others:new Map(),x:0,z:0,rotation:0,keys:new Set(),camAngle:0.65,camPitch:0.08,camDistance:9,t:0,station:null,near:null,authMode:'register',avatar:null,lab:{f:2,v:4,A:.52,d:0.5,soundFrequency:500,timbre:1,distance:5,power:10,decibel:50,wavelengthNm:550,slitGap:.6,screenDistance:1.5,sourceSpacing:7,waveLength:5,phaseMode:0,harmonic:2,boundary:0,speedRatio:1,aperture:1.1,soundSpeed:340,vacuum:1,spectrum:3},lastMove:0,isWalking:false,gl:null,notice:null,drag:false,dragX:0,dragY:0,connection:'offline',stick:{x:0,y:0,pointer:null},reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
const stations=[
{id:'intro',x:0,z:-11,emoji:'🌊',name:'Bản chất của sóng',label:'BẢN CHẤT SÓNG',intro:'Hãy nhìn gợn sóng lan ra trên hồ. Điều đang lan truyền là trạng thái dao động và năng lượng, chứ không phải mọi giọt nước cùng chạy theo ngọn sóng.',explain:'Theo trang 3: Sóng là sự lan truyền dao động trong không gian theo thời gian. Sóng cơ cần môi trường vật chất đàn hồi; phần tử môi trường chỉ dao động quanh vị trí cân bằng. Đừng nhầm tốc độ truyền sóng với tốc độ của phần tử!',quiz:[['intro-1','Bản chất của sóng cơ là gì?',['Sự di chuyển toàn bộ vật chất','Sự lan truyền dao động trong môi trường','Mọi phần tử đứng yên'],1,'Sóng cơ truyền dao động và năng lượng; vật chất không đi theo toàn bộ sóng.'],['intro-2','Khi sóng lan truyền trên dây, phát biểu nào đúng?',['Mọi phần tử chuyển từ đầu dây đến cuối dây','Tốc độ phần tử luôn bằng tốc độ truyền sóng','Dao động và năng lượng được truyền đi'],2,'Các phần tử dây dao động quanh vị trí cân bằng, còn nhiễu loạn truyền sang phần tử kế tiếp.']]},
{id:'ngang',x:-14,z:-7,emoji:'🎀',name:'Sóng ngang',label:'SÓNG NGANG',intro:'Quan sát sợi dây: ngọn sóng đi theo phương ngang trong khi các phần tử của dây nhô lên và hạ xuống.',explain:'Theo trang 3: phương dao động vuông góc với phương truyền sóng. Hãy bật/tắt “dấu vị trí cân bằng” để thấy mỗi phần tử chỉ rung lên xuống tại vị trí riêng của nó.',quiz:[['ngang-1','Trong sóng ngang, phương dao động so với phương truyền sóng là...',['Song song','Vuông góc','Trùng nhau'],1,'Sóng ngang được định nghĩa bằng hai phương vuông góc.'],['ngang-2','Ví dụ đặc trưng cho sóng ngang là...',['Sóng âm trong khí','Sóng trên dây căng được rung vuông góc','Sóng nén dọc theo lò xo'],1,'Rung dây lên xuống tạo sóng truyền dọc dây: dao động vuông góc phương truyền.']]},
{id:'doc',x:14,z:-7,emoji:'🌀',name:'Sóng dọc',label:'SÓNG DỌC',intro:'Quan sát các hạt khí giả lập hoặc vòng lò xo. Các vùng nén, giãn chạy sang phải; từng hạt chuyển động qua lại theo chiều ngang.',explain:'Theo trang 3: sóng dọc có phương dao động trùng phương truyền sóng. Sóng nén truyền trong lò xo là ví dụ trực quan. Vùng nén và giãn là đặc trưng lan truyền, không phải một hạt đi từ đầu đến cuối.',quiz:[['doc-1','Trong sóng dọc, phương dao động của phần tử là...',['Song song phương truyền sóng','Vuông góc phương truyền sóng','Luôn hướng thẳng đứng'],0,'Phương dao động cùng phương với phương truyền sóng.'],['doc-2','Điều gì lan truyền trong một sóng nén?',['Vật chất chạy xa vô hạn','Sóng cơ truyền được trong chân không','Vùng nén – giãn và trạng thái dao động'],2,'Hạt dao động quanh chỗ cũ; vùng nén, giãn mới lan đi.']]},
{id:'lambda',x:-14,z:11,emoji:'📏',name:'Bước sóng & tốc độ',label:'BƯỚC SÓNG',intro:'Thay đổi tần số f hoặc tốc độ truyền v. Xem bước sóng λ tự thay đổi. Hai đỉnh liên tiếp cách nhau đúng một λ.',explain:'Trang 5: λ = vT = v/f và v = λf. Khi giữ tốc độ truyền v cố định, tăng f làm λ giảm. Trong 1 chu kì, sóng đi đúng 1 bước sóng. Bài đếm: 5 đỉnh liên tiếp tạo 4 khoảng λ.',quiz:[['lambda-1','5 ngọn sóng liên tiếp trải dài 12 m. Bước sóng là...',['2,4 m','3 m','4 m'],1,'Có 4 khoảng bước sóng: λ = 12 / (5−1) = 3 m (Đề số 2, trang 25).'],['lambda-2','Công thức nào thể hiện quan hệ tốc độ, bước sóng và tần số?',['v = λf','v = λ/f','λ = vf'],0,'Trong một chu kì T sóng đi λ: v = λ/T = λf.']]},
{id:'pha',x:14,z:11,emoji:'🎭',name:'Cùng pha – ngược pha',label:'ĐỘ LỆCH PHA',intro:'Hai chấm M và N cùng dao động. Kéo thanh khoảng cách d/λ để kiểm tra khi nào chúng cùng lên, ngược chiều, hoặc vuông pha.',explain:'Trang 6: |Δφ| = 2πd/λ. Cùng pha gần nhất: d=λ; ngược pha gần nhất: d=λ/2; vuông pha gần nhất: d=λ/4. Khi cách λ/2, một điểm lên đỉnh thì điểm kia xuống đáy.',quiz:[['pha-1','Hai điểm gần nhau nhất dao động ngược pha cách nhau...',['λ/4','λ','λ/2'],2,'2πd/λ = π ⇒ d = λ/2.'],['pha-2','Hai điểm gần nhau nhất cách nhau λ/2 có độ lệch pha bằng...',['π/2 rad','π rad','2π rad'],1,'Δφ = 2π(λ/2)/λ = π rad.']]},
{id:'thuthach',x:0,z:18,emoji:'🏆',name:'Thử thách đề số 2',label:'THỬ THÁCH',intro:'Vận dụng kiến thức vào bài tập đúng với Đề luyện tập thường xuyên Số 2, trang 25–26. Hãy tự phân tích đồ thị hoặc hình dung các đỉnh sóng trước khi chọn.',explain:'Câu 1 trang 26: giữa hai vị trí cân bằng liên tiếp có chiều cắt trục trái nhau là λ/2. Câu 5 trang 26: 7 gợn lồi có 6 khoảng λ. Mẹo quan trọng: số khoảng giữa n đỉnh liên tiếp là n−1.',quiz:[['thuthach-1','Hai điểm cắt vị trí cân bằng liên tiếp ở x = 9 cm và x = 33 cm. Bước sóng bằng...',['24 cm','48 cm','96 cm'],1,'Khoảng cách 24 cm là λ/2 nên λ = 48 cm (trang 26, câu 1).'],['thuthach-2','f = 10 Hz, 7 gợn lồi liên tiếp trải dài 30 cm. Tốc độ v là...',['50 cm/s','30 cm/s','70 cm/s'],0,'6λ = 30 ⇒ λ = 5 cm. v = λf = 5×10 = 50 cm/s (trang 26, câu 5).']]}
,{id:'amnguon',x:-20,z:-17,emoji:'🔔',name:'Nguồn âm & truyền âm',label:'NGUỒN ÂM',intro:'Gõ âm thoa hoặc rung dây đàn: vật dao động làm không khí xung quanh nén – giãn; các vùng nén và giãn lan tới tai.',explain:'Trang 32: vật dao động phát ra âm được gọi là nguồn âm. Âm là sóng cơ nên không truyền được trong chân không. Trong khí/lỏng, sóng âm là sóng dọc; trong chất rắn có thể truyền sóng dọc hoặc ngang. Màng nhĩ rung khi sóng âm truyền tới. Dự đoán: trong chân không, âm thoa rung nhưng người nghe ở xa có nghe được không?',quiz:[['amnguon-1','Nguồn âm là gì?',['Vật đang dao động và phát ra âm','Bất kì vật nào có nhiệt độ cao','Vật chỉ phát sáng'],0,'Nguồn âm là vật dao động làm môi trường xung quanh dao động và tạo sóng âm (trang 32).'],['amnguon-2','Trong chân không, âm từ một chiếc chuông có truyền tới tai không?',['Có, truyền nhanh hơn','Không, vì sóng âm cần môi trường vật chất','Có, chỉ cần âm đủ to'],1,'Sóng âm là sóng cơ và không truyền được trong chân không (trang 32).']]}
,{id:'amtanso',x:0,z:-20,emoji:'🎚️',name:'Tần số: hạ âm – siêu âm',label:'TẦN SỐ ÂM',intro:'Kéo thang tần số qua ba vùng: hạ âm, âm nghe được và siêu âm. Sau đó thử phát nốt âm trong khoảng nghe được ở mức âm lượng an toàn.',explain:'Trang 32: theo tài liệu, hạ âm f < 16 Hz, âm nghe được khoảng 16–20 000 Hz, siêu âm f > 20 000 Hz. Đây là mốc phân loại gần đúng, không có nghĩa tất cả mọi người đều nghe được toàn bộ dải. Tăng tần số làm âm có độ cao tăng, không nhất thiết làm âm to hơn (trang 33).',quiz:[['amtanso-1','Theo tài liệu, âm 25 000 Hz thuộc loại nào?',['Hạ âm','Âm nghe được','Siêu âm'],2,'25 000 Hz lớn hơn 20 000 Hz nên là siêu âm (trang 32).'],['amtanso-2','Khi tăng tần số của nhạc âm mà giữ điều kiện khác không đổi, ta nghe...',['Cao hơn','To hơn một cách chắc chắn','Trầm hơn'],0,'Tần số liên hệ với độ cao; cường độ âm và độ to là các khái niệm khác (trang 33).']]}
,{id:'amsac',x:20,z:-17,emoji:'🎹',name:'Độ cao & âm sắc',label:'ÂM SẮC',intro:'Hai nhạc cụ có thể phát cùng nốt nhưng âm nghe khác nhau. Thay hình dạng sóng (thành phần họa âm) và nghe so sánh nhạc âm.',explain:'Trang 33: tần số liên hệ với độ cao, còn âm sắc giúp phân biệt các nguồn phát âm; hình dạng dao động là tổng hợp các họa âm nên khác nhau có thể cho âm sắc khác nhau. Mô phỏng chỉ minh họa phổ họa âm, không tái tạo chính xác piano/organ thực.',quiz:[['amsac-1','Hai nhạc cụ cùng phát một nốt nhưng nghe khác nhau chủ yếu vì...',['Âm sắc khác nhau','Cùng tần số thì âm bắt buộc giống nhau','Âm truyền nhanh chậm khác nhau'],0,'Âm sắc phản ánh thành phần họa âm và dạng sóng khác nhau của nguồn âm (trang 33).'],['amsac-2','Đặc trưng sinh lí gắn trực tiếp với tần số âm là...',['Độ to','Độ cao','Khoảng cách từ loa'],1,'Âm có tần số lớn thường được nghe cao hơn (trang 33).']]}
,{id:'amcuongdo',x:-21,z:3,emoji:'📡',name:'Cường độ & khoảng cách',label:'CƯỜNG ĐỘ ÂM',intro:'Đi xa loa: cùng công suất, năng lượng lan trên diện tích mặt cầu lớn hơn. Kéo khoảng cách để xem cường độ giảm.',explain:'Trang 33–35: với nguồn điểm phát đều theo mọi hướng, không hấp thụ, I = P/(4πR²). Vì thế R tăng gấp 2 thì I giảm 4 lần. Theo mô hình trong tài liệu, I tỉ lệ với A² khi các điều kiện khác giống nhau. Hai công thức chỉ đúng trong giả thiết tương ứng.',quiz:[['amcuongdo-1','Ở xa nguồn âm điểm gấp 2 lần, cùng P và không hấp thụ, cường độ âm...',['Tăng 4 lần','Giảm 2 lần','Giảm 4 lần'],2,'I = P/(4πR²), nên khi R gấp 2 thì mẫu số gấp 4 (trang 33–35).'],['amcuongdo-2','Nếu biên độ sóng tăng gấp đôi (điều kiện khác không đổi), cường độ...',['Tăng 4 lần','Tăng 2 lần','Không đổi'],0,'Vì I ∝ A² nên I₂/I₁=(A₂/A₁)²=4 (trang 33–34).']]}
,{id:'amdecibel',x:21,z:3,emoji:'📊',name:'Mức cường độ âm (dB)',label:'DECIBEL',intro:'Thay mức L tính bằng dB rồi quan sát tỉ số I/I₀. Học cách đọc thang logarit: tăng 10 dB nghĩa là cường độ gấp 10 lần.',explain:'Trang 33: L(dB)=10 log₁₀(I/I₀). Suy ra I/I₀=10^(L/10). Ví dụ tăng từ 40 dB lên 50 dB thì tỉ số cường độ bằng 10; điều đó KHÔNG có nghĩa tai cảm giác to hơn đúng 10 lần. Khi minh họa dùng I₀=10⁻¹² W/m², là giá trị chuẩn thường dùng trong bài tập.',quiz:[['amdecibel-1','Khi mức cường độ âm tăng 10 dB, cường độ I tăng...',['10 lần','2 lần','100 lần'],0,'ΔL = 10 log₁₀(I₂/I₁)=10 ⇒ I₂/I₁=10 (trang 33).'],['amdecibel-2','Đại lượng mức cường độ âm L(dB) dùng hàm gì?',['Hàm logarit cơ số 10','Hàm căn bậc hai','Hàm sin'],0,'Công thức L=10 log₁₀(I/I₀) ở trang 33.']]}
];
// Physics 11 full Chapter 2: extend the original 11 stations to 34.
stations.forEach((s,i)=>{s.chapter=i<6?1:2});
stations.push(...addedStations);
const stationGroups=chapterZones.map(z=>({...z,stations:stations.filter(s=>s.chapter===z.number)}));
for(const g of stationGroups){
 const n=g.stations.length;
 g.stations.forEach((s,i)=>{
  // Dedicated campus zones, curved walking paths and clear spacing.
  const theta=2*Math.PI*i/n-Math.PI/2;
  const radius=n>=8?15:12;
  s.x=g.x+Math.cos(theta)*radius;
  s.z=g.z+Math.sin(theta)*radius;
 });
}
const WORLD_BOUNDS={minX:-58,maxX:58,minZ:-50,maxZ:91};
const isTouchUI=()=>matchMedia('(hover:none) and (pointer:coarse), (max-width:1100px)').matches;
const TOTAL_QUESTIONS=stations.reduce((sum,station)=>sum+station.quiz.length,0);
const optionSets={skin:['#F9DCC4','#F6C6A8','#CE8D68','#976342','#6E4436'],hair:['#3D2B30','#6E4830','#F4C45E','#A25965','#554AB4','#222938'],outfit:['#5966D8','#EF7199','#39A99B','#EB9A48','#9B70CC','#355A8A'],style:['bob','spiky','bun','short'],accessory:['none','cat','star','glasses']};
const avatarLabels={style:{bob:'Tóc bob',spiky:'Tóc nhọn',bun:'Búi tóc',short:'Tóc ngắn'},accessory:{none:'Không',cat:'Tai mèo',star:'Ngôi sao',glasses:'Mắt kính'}};
function toast(s){const t=$('toast');t.textContent=s;t.classList.remove('hidden');clearTimeout(state.notice);state.notice=setTimeout(()=>t.classList.add('hidden'),3500)}
async function api(endpoint,body,authenticated=true){const headers={'Content-Type':'application/json'};if(authenticated&&state.token)headers.Authorization='Bearer '+state.token;const r=await fetch('/api/'+endpoint,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error||'Có lỗi xảy ra');return data}
function cleanRoom(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,18)}
function showAuth(){unreadMobileChat=0;$('chatPanel')?.classList.remove('chat-visible');syncMobileChat();state.user=null;$('gameUI').classList.add('hidden');$('authOverlay').classList.remove('hidden');$('roomInput').value=state.room}
function loginReady(data){state.token=data.token;state.user=data.user;state.avatar={...data.user.avatar};localStorage.setItem('sv_token',data.token);state.room=cleanRoom($('roomInput').value)||state.room;localStorage.setItem('sv_room',state.room);startGame()}
async function startGame(){
 $('authOverlay').classList.add('hidden');$('gameUI').classList.remove('hidden');$('roomName').textContent=state.room;updateProgress();initUI();if(!state.gl)init3D();connectWs();
 fetch('/api/health').then(r=>r.json()).then(cfg=>{if(cfg.chatEnabled===false){$('chatPanel').classList.add('hidden');$('mobileChatFab')?.classList.add('hidden');$('chatOpenBtn')?.classList.add('hidden');toast('Phòng học đang tắt trò chuyện để tập trung học tập')}else{$('mobileChatFab')?.classList.remove('hidden');$('chatOpenBtn')?.classList.remove('hidden')}}).catch(()=>{});
 if(isTouchUI()){$('chatPanel').classList.add('collapsed');$('chatPanel').classList.remove('chat-visible');syncMobileChat()};toast('Chào mừng '+state.user.nickname+'! Hãy dự đoán, thí nghiệm và giải thích 🌊');
}
function updateProgress(){const c=(state.user?.cleared||[]).filter(id=>stations.some(s=>s.quiz.some(q=>q[0]===id))).length;$('xp').textContent='✦ '+(c*100)+' XP';$('progressFill').style.width=(100*c/TOTAL_QUESTIONS)+'%';$('progressText').textContent=c+'/'+TOTAL_QUESTIONS+' câu hoàn thành';$('badgeLabel').textContent=c===TOTAL_QUESTIONS?'🏆 Bậc thầy sóng':c>=Math.ceil(TOTAL_QUESTIONS*.65)?'🌟 Nhà khoa học':c>=Math.ceil(TOTAL_QUESTIONS*.25)?'🔎 Nhà khám phá':'Tân binh sóng';if($('profileScore'))$('profileScore').textContent=(c*100)+' XP đã đạt';updateStationLinks()}
function updateStationLinks(){
 const panel=$('stationLinks');panel.replaceChildren();
 for(const g of stationGroups){
  const head=document.createElement('div');head.className='chapter-heading';
  head.textContent=g.emoji+' BÀI '+g.number+' · '+g.name+' ('+g.stations.length+' trạm)';panel.append(head);
  for(const s of g.stations){
   const row=document.createElement('div');row.className='station-row';
   const button=document.createElement('button');button.className='station-link';button.type='button';
   const n=s.quiz.filter(q=>(state.user?.cleared||[]).includes(q[0])).length;
   const symbol=document.createElement('span');symbol.className='symbol';symbol.textContent=s.emoji;
   const desc=document.createElement('span');const bold=document.createElement('b');bold.textContent=s.name;
   const small=document.createElement('small');small.textContent=n+'/'+s.quiz.length+' thử thách';desc.append(bold,small);
   const done=document.createElement('span');done.className='done';done.textContent=n===s.quiz.length?'✓':'';
   button.append(symbol,desc,done);
   button.addEventListener('click',()=>{document.querySelector('.quest-panel').classList.remove('mobile-open');openLesson(s.id)});
   const travel=document.createElement('button');travel.className='travel-btn';travel.type='button';travel.title='Dịch chuyển tới trạm '+s.name;travel.textContent='📍';travel.setAttribute('aria-label','Đi tới trạm '+s.name);
   travel.addEventListener('click',()=>travelToStation(s));
   row.append(button,travel);panel.append(row);
  }
 }
}
// Mobile-first station selection: no need to aim precisely or walk across the large map.
function travelToStation(s){
 state.x=s.x;state.z=s.z+3.4;state.keys.clear();state.stick.x=0;state.stick.y=0;resetStick();
 $('quickStations')?.classList.remove('is-open');$('quickStations')?.setAttribute('aria-hidden','true');
 document.querySelector('.quest-panel')?.classList.remove('mobile-open');
 const group=stationGroups.find(g=>g.number===s.chapter);
 const index=group?.stations.indexOf(s)??-1;
 if(state.ws?.readyState===1&&index>=0)state.ws.send(JSON.stringify({type:'travel',chapter:s.chapter,index}));
 toast('📍 Đã tới '+s.name+' · chạm Vào học để bắt đầu');
}
function openQuickStations(){
 if(!state.user)return;
 const pane=$('quickStations'),list=$('quickStationsList');list.replaceChildren();
 $('chatPanel').classList.remove('chat-visible');$('cameraController').classList.remove('is-open');
 document.querySelector('.quest-panel').classList.remove('mobile-open');
 const choices=[...stations].sort((a,b)=>Math.hypot(a.x-state.x,a.z-state.z)-Math.hypot(b.x-state.x,b.z-state.z)).slice(0,5);
 for(const s of choices){
  const card=document.createElement('div');card.className='quick-station-row';
  const info=document.createElement('div');info.className='quick-station-info';
  const title=document.createElement('b');title.textContent=s.emoji+' '+s.name;
  const desc=document.createElement('small');desc.textContent='Bài '+s.chapter+' · '+effectTags[s.id]+' · '+s.quiz.filter(q=>(state.user.cleared||[]).includes(q[0])).length+'/'+s.quiz.length+' câu';
  info.append(title,desc);
  const learn=document.createElement('button');learn.className='quick-learn';learn.type='button';learn.textContent='📝 Học & làm bài';
  learn.addEventListener('click',()=>{pane.classList.remove('is-open');pane.setAttribute('aria-hidden','true');openLesson(s.id)});
  const go=document.createElement('button');go.className='quick-travel';go.type='button';go.textContent='📍 Đến';go.addEventListener('click',()=>travelToStation(s));
  card.append(info,learn,go);list.append(card);
 }
 pane.classList.add('is-open');pane.setAttribute('aria-hidden','false');
}
function closeQuickStations(){const el=$('quickStations');el?.classList.remove('is-open');el?.setAttribute('aria-hidden','true')}
function updateTouchAction(){
 if(!state.user)return;
 const button=$('mobileInteract');if(!button)return;
 const near=state.near,now=near?.id||'';
 if(button.dataset.near===now)return;
 button.dataset.near=now;
 button.textContent=near?'✦ Vào học · '+near.name:'🎯 Chọn trạm & học';
 button.setAttribute('aria-label',near?'Vào học trạm '+near.name:'Chọn trạm để học và trả lời câu hỏi');
}
function initTouchHotspots(){
 if(touchHotspots.length)return;
 const root=$('stationHotspots');if(!root)return;
 for(const s of stations){
  const button=document.createElement('button');button.type='button';button.className='station-hotspot';
  const icon=document.createElement('span');icon.textContent=s.emoji;icon.className='hotspot-emoji';
  const info=document.createElement('span');info.className='hotspot-title';info.textContent=s.name;
  const action=document.createElement('span');action.className='hotspot-action';action.textContent='VÀO HỌC';
  button.append(icon,info,action);
  button.setAttribute('aria-label','Mở bài học '+s.name);
  button.addEventListener('click',e=>{e.stopPropagation();openLesson(s.id)});
  root.append(button);touchHotspots.push({s,button});
 }
}
function updateTouchHotspots(){
 if(!touchHotspots.length)return;
 const show=isTouchUI()&&state.user&&!isDrawerOpen()&&!$('quickStations').classList.contains('is-open')&&!document.querySelector('.quest-panel').classList.contains('mobile-open')&&!$('chatPanel').classList.contains('chat-visible');
 let count=0;const placed=[];
 const ranked=show?touchHotspots.map(a=>({...a,d:Math.hypot(a.s.x-state.x,a.s.z-state.z)})).filter(a=>a.d<21).sort((a,b)=>a.d-b.d):[];
 for(const a of touchHotspots)a.button.style.display='none';
 for(const a of ranked){
  if(count>=3)break;
  const q=project(a.s.x,3.9,a.s.z);if(!q?.visible||q.y<63||q.y>innerHeight-102||q.x<45||q.x>innerWidth-45)continue;
  if(placed.some(p=>Math.hypot(p.x-q.x,p.y-q.y)<98))continue;
  a.button.style.left=q.x+'px';a.button.style.top=q.y+'px';a.button.style.display='flex';
  a.button.classList.toggle('is-near',a.d<6.3);
  placed.push(q);count++;
 }
}
function setupImmersiveMode(){
 const button=$('fullscreenBtn'),help=$('fullscreenHelp');
 const close=()=>help.classList.add('hidden');
 $('fullscreenHelpClose')?.addEventListener('click',close);
 button?.addEventListener('click',async()=>{
  if(document.fullscreenElement){try{await document.exitFullscreen()}catch{}return}
  if(window.matchMedia('(display-mode: standalone)').matches){toast('SóngVerse đang ở chế độ ứng dụng toàn màn hình');return}
  if(document.documentElement.requestFullscreen){
   try{
    await document.documentElement.requestFullscreen({navigationUI:'hide'});
    if(screen.orientation?.lock)try{await screen.orientation.lock('landscape')}catch{}
    toast('🎮 Đã mở chế độ toàn màn hình');
    return;
   }catch{}
  }
  help.classList.remove('hidden');
 });
 const fit=()=>{
  const h=window.visualViewport?.height||window.innerHeight;
  document.documentElement.style.setProperty('--game-viewport-height',h+'px');
  document.body.classList.toggle('game-landscape',window.innerWidth>window.innerHeight);
 };
 fit();window.addEventListener('resize',fit);window.addEventListener('orientationchange',fit);
 window.visualViewport?.addEventListener('resize',fit);
}
function jumpLessonTo(id){
 const target=$(id);if(!target||$('lessonDrawer').classList.contains('hidden'))return;
 const isLandscape=isTouchUI()&&window.innerWidth>window.innerHeight;
 if(id==='quizArea'){$('lessonDrawer').classList.add('show-quiz');if(isLandscape){target.scrollTop=0;target.querySelector('.choices button:not([disabled])')?.focus({preventScroll:true});return;}}
 else $('lessonDrawer').classList.remove('show-quiz');
 target.scrollIntoView({behavior:'smooth',block:'start'});
}


// Mobile chat is a first-class classroom action, not a tiny top-bar icon.
let unreadMobileChat=0;
function syncMobileChat(){
 const panel=$('chatPanel'),opened=panel?.classList.contains('chat-visible')&&!panel?.classList.contains('hidden');
 const fab=$('mobileChatFab'),top=$('chatOpenBtn');
 if(fab)fab.setAttribute('aria-expanded',String(Boolean(opened)));
 if(top)top.setAttribute('aria-expanded',String(Boolean(opened)));
 document.body.classList.toggle('mobile-chat-open',Boolean(opened));
 const count=$('mobileChatUnread');
 if(opened)unreadMobileChat=0;
 if(count){count.textContent=unreadMobileChat>99?'99+':String(unreadMobileChat);count.classList.toggle('hidden',!unreadMobileChat);}
 if(opened)$('chatMessages').scrollTop=$('chatMessages').scrollHeight;
}
function setMobileChat(open){
 if(!state.user)return;
 const panel=$('chatPanel');if(!panel||panel.classList.contains('hidden')){toast('Chat lớp đang được giáo viên tắt.');return}
 closeQuickStations();document.querySelector('.quest-panel').classList.remove('mobile-open');
 $('cameraController').classList.remove('is-open');
 panel.classList.toggle('chat-visible',Boolean(open));
 panel.classList.remove('collapsed');
 syncMobileChat();
}

let uiInit=false;
function initUI(){if(uiInit)return;uiInit=true;
 document.querySelectorAll('.auth-tabs button').forEach(b=>b.addEventListener('click',()=>setAuthMode(b.dataset.mode)));
 $('authForm').addEventListener('submit',async e=>{e.preventDefault();const button=$('authSubmit');button.disabled=true;$('authError').classList.add('hidden');try{const endpoint=state.authMode==='register'?'register':'login';const data=await api(endpoint,{username:$('username').value,password:$('password').value,nickname:$('nickname').value},false);loginReady(data);}catch(err){$('authError').textContent=err.message;$('authError').classList.remove('hidden');}finally{button.disabled=false}});
 $('profileBtn').addEventListener('click',openProfile);$('helpBtn').addEventListener('click',()=>openDrawer('help'));
 $('cameraResetBtn').addEventListener('click',resetCamera);
 setupCameraControls();
 setupMusic();
 const cameraToggle=$('mobileCameraBtn');if(cameraToggle)cameraToggle.addEventListener('click',()=>{$('cameraController').classList.toggle('is-open');cameraToggle.setAttribute('aria-expanded',String($('cameraController').classList.contains('is-open')))});
 const chatOpen=$('chatOpenBtn');if(chatOpen)chatOpen.addEventListener('click',()=>setMobileChat(!$('chatPanel').classList.contains('chat-visible')));
 $('mobileChatFab')?.addEventListener('click',()=>setMobileChat(!$('chatPanel').classList.contains('chat-visible')));
 new MutationObserver(syncMobileChat).observe($('chatPanel'),{attributes:true,attributeFilter:['class']});
 syncMobileChat();
 $('logoutBtn').addEventListener('click',()=>{state.ws?.close();state.ws=null;state.token='';localStorage.removeItem('sv_token');state.others.clear();showAuth();});
 $('mobileHelpBtn')?.addEventListener('click',()=>{$('helpBtn').click()});
 $('mobileLogoutBtn')?.addEventListener('click',()=>{$('logoutBtn').click()});
 $('shade').addEventListener('click',closeDrawer);document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeDrawer));
 $('toggleChat').addEventListener('click',()=>{if(isTouchUI())setMobileChat(false);else{$('chatPanel').classList.toggle('collapsed');$('toggleChat').textContent=$('chatPanel').classList.contains('collapsed')?'+':'−'}});
 $('chatForm').addEventListener('submit',e=>{e.preventDefault();const text=$('chatInput').value.trim();if(text){if(state.ws?.readyState===1)state.ws.send(JSON.stringify({type:'chat',message:text}));else toast('Chưa kết nối phòng chung.');$('chatInput').value='';}});
 $('saveProfile').addEventListener('click',async()=>{try{const d=await api('profile',{nickname:$('editNickname').value,avatar:state.avatar});state.user=d.user;updateProgress();closeDrawer();toast('Đã lưu nhân vật chibi! 🎨')}catch(e){toast(e.message)}});
 // Use physical keyboard codes: movement stays predictable across input languages.
 const physical={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ArrowUp:'arrowup',ArrowDown:'arrowdown',ArrowLeft:'arrowleft',ArrowRight:'arrowright'};
 const cameraKeys={KeyJ:'left',KeyL:'right',KeyI:'up',KeyK:'down'};
 window.addEventListener('keydown',e=>{
  if(document.activeElement?.matches('textarea,select,input:not([type=range]),[contenteditable=true]'))return; // Range sliders should not disable WASD
  if(document.activeElement?.matches('input[type=range]')&&e.code.startsWith('Arrow'))return; // Preserve keyboard adjustment of sliders
  if(e.code==='Escape'){closeDrawer();return}
  if(e.code==='KeyE'&&state.near&&!isDrawerOpen()){e.preventDefault();openLesson(state.near.id);return}
  if(e.code==='KeyR'&&!isDrawerOpen()){e.preventDefault();resetCamera();return}
  if(isDrawerOpen())return;
  if(physical[e.code]){e.preventDefault();state.keys.add(physical[e.code]);return}
  if(cameraKeys[e.code]){e.preventDefault();if(!e.repeat)orbitCamera(cameraKeys[e.code]);return}
 });
 window.addEventListener('keyup',e=>{if(physical[e.code])state.keys.delete(physical[e.code])});
 window.addEventListener('blur',()=>{state.keys.clear();state.isWalking=false;});
 document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;const map={up:'w',down:'s',left:'a',right:'d'};const down=e=>{e.preventDefault();state.keys.add(map[k]);b.setPointerCapture(e.pointerId)};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',()=>state.keys.delete(map[k]));b.addEventListener('pointercancel',()=>state.keys.delete(map[k]));});
 $('mobileInteract').addEventListener('click',()=>{if(state.near)openLesson(state.near.id);else openQuickStations()});
 $('quickStationsClose')?.addEventListener('click',closeQuickStations);
 $('jumpToQuiz')?.addEventListener('click',()=>jumpLessonTo('quizArea'));
 $('jumpToDemo')?.addEventListener('click',()=>jumpLessonTo('lessonDemo'));
 setupImmersiveMode();
 initTouchHotspots();
 $('mobileMapBtn').addEventListener('click',()=>{$('cameraController').classList.remove('is-open');$('chatPanel').classList.remove('chat-visible');document.querySelector('.quest-panel').classList.toggle('mobile-open')});
 $('closeMapBtn').addEventListener('click',()=>document.querySelector('.quest-panel').classList.remove('mobile-open'));
 $('saveReflection').addEventListener('click',saveReflection);
 setupJoystick();

 // Drag anywhere on the bare world, or use the dedicated camera pad / arrow buttons.
 const canvas=$('world');canvas.style.touchAction='none';
 attachCameraDrag(canvas);
 canvas.addEventListener('wheel',e=>{if(!state.user||isDrawerOpen())return;e.preventDefault();zoomCamera(e.deltaY>0?1:-1)},{passive:false});
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 document.addEventListener('visibilitychange',()=>{if(document.hidden){state.stick.x=0;state.stick.y=0;state.keys.clear();state.isWalking=false;resetStick()}});

}

// Camera camera-controller: the visible pad works even when UI layers cover the WebGL canvas.
function updateCameraLabel(){
 const el=$('cameraAngleLabel');if(!el)return;
 const degrees=((Math.round(state.camAngle*180/Math.PI)%360)+360)%360;
 el.textContent=`${degrees}° · ${Math.round(state.camPitch*180/Math.PI)}°`;
 const yaw=$('yawSlider'),pitch=$('pitchSlider');if(yaw&&document.activeElement!==yaw)yaw.value=String(degrees);if(pitch&&document.activeElement!==pitch)pitch.value=String(Math.round(state.camPitch*180/Math.PI));
}
function resetCamera(){state.camAngle=.65;state.camPitch=.08;state.camDistance=9;updateCameraLabel();toast('Đã trả camera về góc nhìn mặc định 📷')}
function orbitCamera(dir){const next=orbitByKey(state.camAngle,state.camPitch,dir);state.camAngle=next.angle;state.camPitch=next.pitch;updateCameraLabel()}
function zoomCamera(direction){state.camDistance=clamp(state.camDistance+direction*1.25,4.5,25);updateCameraLabel()}
function attachCameraDrag(target){
 let pointer=null,prevX=0,prevY=0;
 target.style.touchAction='none';
 target.addEventListener('pointerdown',e=>{
  if(!state.user||isDrawerOpen()||pointer!==null)return;
  if(e.pointerType==='mouse'&&e.button!==0&&e.button!==2)return;
  e.preventDefault();pointer=e.pointerId;prevX=e.clientX;prevY=e.clientY;
  target.classList.add('dragging');
  try{target.setPointerCapture(e.pointerId)}catch{}
 });
 target.addEventListener('pointermove',e=>{
  if(pointer!==e.pointerId||isDrawerOpen())return;
  e.preventDefault();
  const next=orbitBy(state.camAngle,state.camPitch,e.clientX-prevX,e.clientY-prevY);
  state.camAngle=next.angle;state.camPitch=next.pitch;
  prevX=e.clientX;prevY=e.clientY;updateCameraLabel();
 });
 const end=e=>{if(e.pointerId!==pointer)return;pointer=null;target.classList.remove('dragging')};
 target.addEventListener('pointerup',end);target.addEventListener('pointercancel',end);target.addEventListener('lostpointercapture',end);
}
function setupCameraControls(){
 attachCameraDrag($('cameraPad'));
 for(const b of document.querySelectorAll('[data-orbit]'))b.addEventListener('click',()=>orbitCamera(b.dataset.orbit));
 $('cameraZoomIn').addEventListener('click',()=>zoomCamera(-1));
 $('cameraZoomOut').addEventListener('click',()=>zoomCamera(1));
 const yaw=$('yawSlider'),pitch=$('pitchSlider');
 const sync=()=>{yaw.value=String(Math.round(state.camAngle*180/Math.PI));pitch.value=String(Math.round(state.camPitch*180/Math.PI));};
 yaw.addEventListener('input',()=>{state.camAngle=Number(yaw.value)*Math.PI/180;updateCameraLabel()});
 pitch.addEventListener('input',()=>{state.camPitch=Number(pitch.value)*Math.PI/180;updateCameraLabel()});
 document.addEventListener('pointerup',sync);
 sync(); updateCameraLabel();
}
function resetStick(){const el=$('joystickStick');if(el)el.style.transform='translate(-50%,-50%)'}
function setupJoystick(){
 const zone=$('joystickZone'),knob=$('joystickStick');if(!zone||!knob)return;
 const update=e=>{const b=zone.querySelector('.joystick-base').getBoundingClientRect();const cx=b.left+b.width/2,cy=b.top+b.height/2;let x=e.clientX-cx,y=e.clientY-cy;const max=b.width*.35,dist=Math.hypot(x,y);if(dist>max){x*=max/dist;y*=max/dist}state.stick.x=x/max;state.stick.y=y/max;knob.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`};
 zone.addEventListener('pointerdown',e=>{if(state.stick.pointer!==null)return;e.preventDefault();state.stick.pointer=e.pointerId;zone.setPointerCapture(e.pointerId);update(e)});
 zone.addEventListener('pointermove',e=>{if(state.stick.pointer===e.pointerId){e.preventDefault();update(e)}});
 const stop=e=>{if(state.stick.pointer!==e.pointerId)return;state.stick.pointer=null;state.stick.x=0;state.stick.y=0;resetStick()};
 zone.addEventListener('pointerup',stop);zone.addEventListener('pointercancel',stop);zone.addEventListener('lostpointercapture',stop);
}
function noteKey(){return 'sv_note_'+state.user.id+'_'+state.station.id}
function loadReflection(){const n=$('reflectionInput');n.value=localStorage.getItem(noteKey())||'';$('reflectionStatus').textContent=n.value?'Đã có ghi chú':'Chưa ghi chú'}
function saveReflection(){if(!state.station||!state.user)return;const value=$('reflectionInput').value.trim();try{localStorage.setItem(noteKey(),value);$('reflectionStatus').textContent=value?'Đã lưu trên thiết bị ✓':'Đã xóa ghi chú';toast('Đã lưu nhật kí học tập trên thiết bị này')}catch{toast('Không thể lưu trên thiết bị này')}}

function setAuthMode(m){state.authMode=m;document.querySelectorAll('.auth-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));$('nicknameWrap').classList.toggle('hidden',m==='login');$('authSubmit').textContent=m==='login'?'Đăng nhập & vào thế giới ➜':'Tạo nhân vật & vào thế giới ➜';$('password').autocomplete=m==='login'?'current-password':'new-password';}
function connectWs(){if(state.ws)state.ws.close();state.others.clear();const url=(location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws';const ws=new WebSocket(url);state.ws=ws;
 ws.onopen=()=>{state.connection='online';ws.send(JSON.stringify({type:'join',token:state.token,room:state.room}));$('chatOnline').textContent='Đã kết nối 🌱';if($('mobileChatStatus'))$('mobileChatStatus').textContent='Đã kết nối · '+state.room};
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return};if(m.type==='welcome'){state.others.clear();for(const p of m.players)if(p.id!==state.user.id)state.others.set(p.id,p);$('playerCount').textContent=1+state.others.size;systemMessage('Đã vào phòng '+m.room+'. Mời các bạn cùng tham quan!')}
 if(m.type==='enter'){if(m.player.id!==state.user.id){state.others.set(m.player.id,m.player);systemMessage(m.player.nickname+' vừa tham gia phòng ✨');}countPlayers();}
 if(m.type==='leave'){state.others.delete(m.id);countPlayers();}
 if(m.type==='move'){const p=state.others.get(m.id);if(p){p.x=m.x;p.z=m.z;p.rot=m.rot;}}
 if(m.type==='profile'){const p=state.others.get(m.player.id);if(p)Object.assign(p,m.player);}
 if(m.type==='chat')message(m.from,m.message);
 if(m.type==='error')toast(m.message);
 };
 ws.onclose=()=>{if(state.ws!==ws||!state.user)return;state.connection='offline';$('chatOnline').textContent='Mất kết nối – đang thử lại';if($('mobileChatStatus'))$('mobileChatStatus').textContent='Đang kết nối lại…';setTimeout(()=>{if(state.ws===ws&&state.user)connectWs()},3500)};
}
function countPlayers(){$('playerCount').textContent=1+state.others.size;}
function message(from,txt){if(isTouchUI()&&!$('chatPanel').classList.contains('chat-visible')&&from!==state.user?.nickname){unreadMobileChat++;syncMobileChat();}const m=document.createElement('div');m.className='message';const b=document.createElement('b');b.textContent=from;m.append(b,document.createTextNode(txt));$('chatMessages').append(m);$('chatMessages').scrollTop=100000;while($('chatMessages').children.length>30)$('chatMessages').firstChild.remove();}
function systemMessage(t){const d=document.createElement('div');d.className='message system';d.textContent='✦ '+t;$('chatMessages').append(d);$('chatMessages').scrollTop=100000;}
function openDrawer(which){closeQuickStations();document.querySelector('.quest-panel').classList.remove('mobile-open');$('cameraController').classList.remove('is-open');$('chatPanel').classList.remove('chat-visible');state.stick.x=0;state.stick.y=0;resetStick();$('shade').classList.remove('hidden');$('lessonDrawer').classList.toggle('hidden',which!=='lesson');$('profileDrawer').classList.toggle('hidden',which!=='profile');$('helpDrawer').classList.toggle('hidden',which!=='help');state.keys.clear();}
function closeDrawer(){$('lessonDrawer').classList.remove('show-quiz');$('shade').classList.add('hidden');for(const id of ['lessonDrawer','profileDrawer','helpDrawer'])$(id).classList.add('hidden');state.station=null;}
function isDrawerOpen(){return !$('shade').classList.contains('hidden')}
function openLesson(id){if(!state.user)return;closeQuickStations();const s=stations.find(x=>x.id===id);if(!s)return;state.station=s;$('lessonEyebrow').textContent=s.emoji+' TRẠM '+String(stations.indexOf(s)+1).padStart(2,'0');$('lessonTitle').textContent=s.name;$('lessonIntro').textContent=s.intro;$('lessonExplain').textContent=s.explain;buildLab(s);buildQuizzes(s);openDrawer('lesson');loadReflection();}
function buildLab(s){
 const box=$('lessonDemo');box.replaceChildren();
 
 const div=document.createElement('div');div.className='lab-card';div.innerHTML='<h3>🧪 Thí nghiệm tương tác</h3><p class="lab-guidance">Bước 1: Dự đoán. Bước 2: kéo thanh tham số. Bước 3: quan sát đồ thị/số liệu và giải thích.</p><canvas id="labCanvas" class="lab-canvas" width="650" height="220"></canvas><div id="labControls"></div><div id="labMetrics" class="lab-metric"></div>';box.append(div);
 const soundConfigs={
  amnguon:[['f','Tần số dao động (mô phỏng)',1,5,.5],['A','Biên độ dao động (mô phỏng)',.15,1.1,.1]],
  amtanso:[['soundFrequency','Tần số minh họa (Hz)',0,30000,100]],
  amsac:[['timbre','Dạng âm sắc (1–3)',1,3,1],['soundFrequency','Tần số (Hz)',200,1000,50]],
  amcuongdo:[['distance','Khoảng cách R (m)',1,20,.5],['power','Công suất P (W)',1,20,1]],
  amdecibel:[['decibel','Mức L (dB)',0,100,5]]
 };
 const config=soundConfigs[s.id]|| (addedStations.some(x=>x.id===s.id)?labConfigV6(s.id):s.id==='pha'?[['d','Khoảng cách d/λ',0,1.5,.25]]:s.id==='intro'?[['f','Tần số (Hz)',.5,5,.5]]:s.id==='ngang'||s.id==='doc'?[['A','Biên độ (đ.v.)',.15,1.1,.1],['f','Tần số (Hz)',.5,5,.5]]:[['f','Tần số (Hz)',.5,5,.5],['v','Tốc độ v (đ.v./s)',1,8,.5]]);
 for(const [k,label,min,max,step] of config){const row=document.createElement('label');row.className='control';const name=document.createElement('span');name.textContent=label;const out=document.createElement('output');out.textContent=state.lab[k];const inp=document.createElement('input');Object.assign(inp,{type:'range',min,max,step,value:state.lab[k]});inp.addEventListener('input',()=>{state.lab[k]=Number(inp.value);out.textContent=state.lab[k];updateLabMetrics(s)});row.append(name,out,inp);$('labControls').append(row);}
 if(s.id==='amtanso'){const presets=document.createElement('div');presets.className='sound-presets';for(const [hz,label] of [[8,'8 Hz · Hạ âm'],[440,'440 Hz · Nghe được'],[25000,'25 000 Hz · Siêu âm']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{state.lab.soundFrequency=hz;const range=$('labControls').querySelector('input');if(range){range.value=String(hz);range.parentElement.querySelector('output').textContent=String(hz)}updateLabMetrics(s)});presets.append(b)}div.append(presets)}
 if(['amtanso','amsac'].includes(s.id)){
  const soundButton=document.createElement('button');soundButton.type='button';soundButton.className='try-sound-btn';soundButton.textContent='🔊 Nghe thử âm trong dải nghe được';soundButton.addEventListener('click',()=>playSoundExample(s));div.append(soundButton);
  const safety=document.createElement('p');safety.className='lab-guidance';safety.textContent='🔈 Âm mẫu phát ngắn, âm lượng thấp. Không dùng để kiểm tra thính lực; không phát hạ âm/siêu âm.';div.append(safety);
 }
 updateLabMetrics(s);
}
function formatNumber(v){return v.toExponential(2).replace('e+', ' ×10^').replace('e-', ' ×10^-');}
function updateLabMetrics(s){
 const l=state.lab,lambda=l.v/l.f,m=$('labMetrics');if(!m)return;let metrics;
 if(addedStations.some(x=>x.id===s.id)){
  if(s.chapter===5)metrics=[['λ',l.wavelengthNm+' nm'],['i=λD/a',(l.wavelengthNm*1e-3*l.screenDistance/l.slitGap).toFixed(3)+' mm'],['Quan sát','Vân sáng / tối']];
  else if(s.chapter===4)metrics=[['Hai nguồn',l.sourceSpacing+' đ.v.'],['λ',l.waveLength+' đ.v.'],['Pha nguồn',l.phaseMode?'Ngược pha':'Cùng pha']];
  else if(s.chapter===6)metrics=[['Mode',String(l.harmonic)],['Biên độ',l.A.toFixed(2)],['Dây',s.id==='dungtudo'?'Cố định – tự do':'Hai đầu cố định']];
  else if(s.chapter===3)metrics=[['Bước sóng',s.id==='empho'?'Giảm → f tăng':'Sóng ngang'],['Truyền','Được trong chân không'],['Tốc độ c','3×10⁸ m/s']];
  else if(s.chapter===2)metrics=[['Quãng đường tới–lui',(2*l.distance).toFixed(1)+' m'],['Độ trễ Δt',(2*l.distance/l.soundSpeed).toFixed(3)+' s'],['Công thức','Δt = 2D/v']];
  else metrics=[['Chương 2','Sóng cơ'],['Mô phỏng','Phản xạ / khúc xạ / nhiễu xạ'],['Gợi ý','Kéo để đổi tham số']];
 }
 else if(s.id==='pha')metrics=[['d / λ',l.d.toFixed(2)],['|Δφ|',(2*Math.PI*l.d).toFixed(2)+' rad'],['Trạng thái',Math.abs(l.d-Math.round(l.d))<.01?'Cùng pha':Math.abs(l.d-(Math.floor(l.d)+.5))<.01?'Ngược pha':Math.abs(l.d*2-Math.round(l.d*2))>.4?'Vuông pha':'Lệch pha']];
 else if(s.id==='amtanso')metrics=[['f',l.soundFrequency+' Hz'],['Phân loại',l.soundFrequency<16?'Hạ âm':l.soundFrequency<=20000?'Dải nghe được (theo tài liệu)':'Siêu âm'],['Độ cao','f tăng → âm cao hơn']];
 else if(s.id==='amsac')metrics=[['f',l.soundFrequency+' Hz'],['Dạng âm sắc',String(l.timbre)],['Kiến thức','Họa âm → dạng sóng → âm sắc']];
 else if(s.id==='amcuongdo')metrics=[['R',l.distance.toFixed(1)+' m'],['P',l.power+' W'],['I=P/(4πR²)',(l.power/(4*Math.PI*l.distance*l.distance)).toExponential(2)+' W/m²']];
 else if(s.id==='amdecibel')metrics=[['L',l.decibel+' dB'],['I/I₀',Math.pow(10,l.decibel/10).toExponential(2)],['I, với I₀=10⁻¹²',(Math.pow(10,l.decibel/10)*1e-12).toExponential(2)+' W/m²']];
 else if(s.id==='amnguon')metrics=[['f giả lập',l.f.toFixed(1)],['Phương hạt','↔ (sóng dọc)'],['Truyền đi','Vùng nén–giãn']];
 else metrics=[['f',l.f.toFixed(1)+' Hz'],['λ = v/f',lambda.toFixed(2)+' đ.v.'],['A',l.A.toFixed(2)]];
 m.replaceChildren();for(const [a,b] of metrics){const span=document.createElement('span');const small=document.createElement('small');small.textContent=a;span.append(small,document.createTextNode(b));m.append(span)};
}
function playSoundExample(s){
 const f=state.lab.soundFrequency;
 if(f<40||f>4000){toast('Chỉ phát mẫu 40–4000 Hz để tránh thử âm quá thấp/cao trên thiết bị.');return}
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC){toast('Trình duyệt không hỗ trợ âm thanh');return}
 try{const ctx=new AC();ctx.resume();setTimeout(()=>ctx.close().catch(()=>{}),900);const start=ctx.currentTime+.025;const fundamental=ctx.createOscillator();const bus=ctx.createGain();bus.gain.setValueAtTime(.0001,start);bus.gain.exponentialRampToValueAtTime(.055,start+.05);bus.gain.exponentialRampToValueAtTime(.0001,start+.6);fundamental.type='sine';fundamental.frequency.value=f;fundamental.connect(bus);bus.connect(ctx.destination);fundamental.start(start);fundamental.stop(start+.62);
  if(s.id==='amsac'&&state.lab.timbre>1)for(let n=2;n<=Math.min(4,state.lab.timbre+1);n++){if(n*f>5000)break;const osc=ctx.createOscillator(),g=ctx.createGain();osc.type='sine';osc.frequency.value=n*f;g.gain.value=.18/n;osc.connect(g);g.connect(bus);osc.start(start);osc.stop(start+.62)}
 }catch{toast('Không phát được âm mẫu trên thiết bị này')}
}
function buildQuizzes(s){const el=$('quizContainer');el.replaceChildren();for(const [id,question,opts,answer,why] of s.quiz){const wrap=document.createElement('div');wrap.className='quiz-block';const h=document.createElement('h4');h.textContent=question;const choices=document.createElement('div');choices.className='choices';const detail=document.createElement('div');detail.className='answer-detail hidden';wrap.append(h,choices,detail);const answered=state.user.cleared.includes(id);if(answered){detail.classList.remove('hidden');detail.textContent='✓ Đã hoàn thành +100 XP · '+why;}
 opts.forEach((v,index)=>{const b=document.createElement('button');b.textContent=String.fromCharCode(65+index)+'. '+v;if(answered){b.disabled=true;if(index===answer)b.classList.add('correct')}
 b.addEventListener('click',async()=>{for(const ch of choices.children)ch.disabled=true;try{const result=await api('answer',{id,choice:index});detail.classList.remove('hidden');if(result.correct){b.classList.add('correct');state.user=result.user;detail.textContent='✅ Chính xác! '+why;updateProgress();toast('+100 XP ✨ Tuyệt lắm!')}else{b.classList.add('wrong');detail.textContent='💡 Chưa đúng. '+why+' Hãy thử lại!';setTimeout(()=>{for(const ch of choices.children)ch.disabled=false;b.classList.remove('wrong')},900);}}catch(err){detail.textContent=err.message;for(const ch of choices.children)ch.disabled=false;}});choices.append(b);});el.append(wrap);}}
function openProfile(){state.avatar={...state.user.avatar};$('profileName').textContent=state.user.nickname;$('profileScore').textContent=state.user.score+' XP đã đạt';$('editNickname').value=state.user.nickname;drawOptions();openDrawer('profile');}
function drawOptions(){const el=$('customControls');el.replaceChildren();for(const [name,title] of [['skin','Màu da'],['hair','Màu tóc'],['outfit','Màu trang phục'],['style','Kiểu tóc'],['accessory','Phụ kiện']]){const h=document.createElement('div');h.className='swatch-title';h.textContent=title;const row=document.createElement('div');row.className=optionSets[name][0].startsWith('#')?'swatches':'option-row';for(const val of optionSets[name]){const b=document.createElement('button');b.type='button';b.className=(val.startsWith('#')?'swatch ':'')+(state.avatar[name]===val?'selected':'');if(val.startsWith('#')){b.style.background=val;b.title=val;}else b.textContent=avatarLabels[name]?.[val]||val;b.addEventListener('click',()=>{state.avatar[name]=val;drawOptions();});row.append(b)}el.append(h,row)}$('avatarPreview').textContent=state.avatar.accessory==='cat'?'🐱':state.avatar.accessory==='star'?'🌟':state.avatar.accessory==='glasses'?'🤓':'🧑‍🎓';}
// -- minimal in-browser WebGL renderer, no external libraries or build step --
const VERT=`attribute vec3 aPos;attribute vec3 aNormal;uniform mat4 uP,uV,uM;varying float vLight;varying vec3 vWorld;void main(){vec4 w=uM*vec4(aPos,1.);vec3 n=normalize(mat3(uM)*aNormal);vLight=.62+.38*max(dot(n,normalize(vec3(-.5,1.,.7))),0.);vWorld=w.xyz;gl_Position=uP*uV*w;}`;
const FRAG=`precision mediump float;uniform vec3 uColor;varying float vLight;varying vec3 vWorld;void main(){float fog=clamp((length(vWorld.xz)-80.)/160.,0.,.12);vec3 c=uColor*vLight;gl_FragColor=vec4(mix(c,vec3(.76,.88,.94),fog),1.);}`;
const I=()=>new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
function multiply(a,b){let o=new Float32Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)o[j*4+i]+=a[k*4+i]*b[j*4+k];return o}
function model(x,y,z,sx,sy,sz,r=0){const c=Math.cos(r),s=Math.sin(r);return new Float32Array([c*sx,0,-s*sx,0, 0,sy,0,0, s*sz,0,c*sz,0, x,y,z,1]);}
function perspective(fovy,aspect,near,far){let f=1/Math.tan(fovy/2),n=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*n,-1,0,0,2*far*near*n,0])}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)};
function lookAt(eye,at){const z=norm(eye.map((v,i)=>v-at[i]));const x=norm([z[2],0,-z[0]]);const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x.reduce((a,v,i)=>a+v*eye[i],0),-y.reduce((a,v,i)=>a+v*eye[i],0),-z.reduce((a,v,i)=>a+v*eye[i],0),1]);}
function meshData(type){const p=[],n=[];const tri=(a,b,c,na,nb=na,nc=na)=>{p.push(...a,...b,...c);n.push(...na,...nb,...nc)};
 if(type==='box'){const sides=[[[1,0,0],[.5,-.5,-.5],[.5,-.5,.5],[.5,.5,.5],[.5,.5,-.5]],[[-1,0,0],[-.5,-.5,.5],[-.5,-.5,-.5],[-.5,.5,-.5],[-.5,.5,.5]],[[0,1,0],[-.5,.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,.5,.5]],[[0,-1,0],[-.5,-.5,.5],[.5,-.5,.5],[.5,-.5,-.5],[-.5,-.5,-.5]],[[0,0,1],[.5,-.5,.5],[-.5,-.5,.5],[-.5,.5,.5],[.5,.5,.5]],[[0,0,-1],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]]];for(const [nr,a,b,c,d] of sides){tri(a,b,c,nr);tri(a,c,d,nr)}}
 if(type==='sphere'){const S=14,R=10;const pt=(i,j)=>{const theta=Math.PI*j/R,phi=2*Math.PI*i/S;return [Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)]};for(let j=0;j<R;j++)for(let i=0;i<S;i++){const a=pt(i,j),b=pt(i+1,j),c=pt(i+1,j+1),d=pt(i,j+1);tri(a,b,c,a,b,c);tri(a,c,d,a,c,d)}}
 if(type==='cyl'||type==='cone'){const S=16;const top=type==='cone'?.06:.5;for(let i=0;i<S;i++){const a=i*2*Math.PI/S,b=(i+1)*2*Math.PI/S;const c=[Math.cos(a),0,Math.sin(a)],d=[Math.cos(b),0,Math.sin(b)];const p0=[c[0]*.5,-.5,c[2]*.5],p1=[d[0]*.5,-.5,d[2]*.5],p2=[d[0]*top,.5,d[2]*top],p3=[c[0]*top,.5,c[2]*top];tri(p0,p1,p2,c,d,d);tri(p0,p2,p3,c,d,c);tri([0,.5,0],p3,p2,[0,1,0]);tri([0,-.5,0],p1,p0,[0,-1,0]);}}
 return {p:new Float32Array(p),n:new Float32Array(n)};
}
function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
const colorCache={};function rgb(hex){if(colorCache[hex])return colorCache[hex];const v=parseInt(hex.slice(1),16);return colorCache[hex]=[(v>>16&255)/255,(v>>8&255)/255,(v&255)/255]}
let R=null,worldLabels=[],touchHotspots=[];
function init3D(){const canvas=$('world');const gl=canvas.getContext('webgl',{antialias:true,alpha:false})||canvas.getContext('experimental-webgl');if(!gl){$('fallback').classList.remove('hidden');return}state.gl=gl;
 const program=gl.createProgram();gl.attachShader(program,shader(gl,gl.VERTEX_SHADER,VERT));gl.attachShader(program,shader(gl,gl.FRAGMENT_SHADER,FRAG));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const meshes={};for(const type of ['box','sphere','cyl','cone']){const data=meshData(type);const pb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,data.p,gl.STATIC_DRAW);const nb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,nb);gl.bufferData(gl.ARRAY_BUFFER,data.n,gl.STATIC_DRAW);meshes[type]={pb,nb,count:data.p.length/3}}
 R={gl,program,meshes,loc:{a:gl.getAttribLocation(program,'aPos'),n:gl.getAttribLocation(program,'aNormal'),P:gl.getUniformLocation(program,'uP'),V:gl.getUniformLocation(program,'uV'),M:gl.getUniformLocation(program,'uM'),C:gl.getUniformLocation(program,'uColor')},view:I(),proj:I()};
 gl.enable(gl.DEPTH_TEST);gl.clearColor(.77,.89,.96,1);for(const s of stations){const label=document.createElement('button');label.className='world-billboard';label.textContent=s.emoji+' '+s.label;label.addEventListener('click',()=>openLesson(s.id));$('gameUI').append(label);worldLabels.push({s,label});}
 let then=performance.now();function tick(now){if(now-then<(isTouchUI()?43:24)){requestAnimationFrame(tick);return;}const dt=Math.min(.04,(now-then)/1000);then=now;if(state.user&&!isDrawerOpen()){move(dt);}state.t+=dt;render();drawLab();requestAnimationFrame(tick)}requestAnimationFrame(tick);
}
function draw(type,color,x,y,z,sx=1,sy=1,sz=1,rot=0){if(!R)return;const {gl,loc,meshes}=R,mesh=meshes[type];gl.bindBuffer(gl.ARRAY_BUFFER,mesh.pb);gl.enableVertexAttribArray(loc.a);gl.vertexAttribPointer(loc.a,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,mesh.nb);gl.enableVertexAttribArray(loc.n);gl.vertexAttribPointer(loc.n,3,gl.FLOAT,false,0,0);gl.uniformMatrix4fv(loc.M,false,model(x,y,z,sx,sy,sz,rot));gl.uniform3fv(loc.C,rgb(color));gl.drawArrays(gl.TRIANGLES,0,mesh.count)}
const lowPower=(isTouchUI()||Number(navigator.deviceMemory||8)<=4);
// Larger six-zone campus, with draw distance culling for low-power phones.
function ground(){
 draw('box','#8ac6a0',0,-.42,20,124,.76,160);
 // Main promenade and cross-campus routes.
 draw('box','#f6e5d0',0,.015,20,3.2,.07,148);
 for(const zone of chapterZones){
   const tint=zone.number===1?'#c9f4e4':zone.number===2?'#fce3c6':zone.number===3?'#dcd9fa':zone.number===4?'#b8ebf5':zone.number===5?'#ffe1eb':'#fae9b5';
   draw('box','#f5dfc9',0,.018,zone.z,72,.045,3.1);
   draw('cyl',tint,zone.x,.006,zone.z,48,.045,48);
   draw('cyl','#ffffff',zone.x,.06,zone.z,31,.052,31);
   draw('cyl',tint,zone.x,.084,zone.z,30.4,.036,30.4);
   // Zone icon tower near center.
   if(Math.hypot(zone.x-state.x,zone.z-state.z)<55){
     draw('cyl','#fbfcff',zone.x,.87,zone.z,1.35,1.66,1.35);
     draw('sphere',zone.color,zone.x,1.87+Math.sin(state.t*1.5+zone.number)*.08,zone.z,1.1,.48,1.1);
     for(let j=0;j<9;j++){
       const a=j*Math.PI*2/9+state.t*.28;
       draw('sphere',zone.color,zone.x+Math.cos(a)*2.2,1.48+.14*Math.sin(state.t*2+j),zone.z+Math.sin(a)*2.2,.15,.15,.15);
     }
   }
   for(let j=0;j<9;j++){
     const a=(j+.4)*Math.PI*2/9;const x=zone.x+Math.cos(a)*24,z=zone.z+Math.sin(a)*24;
     if(Math.hypot(x-state.x,z-state.z)>35)continue;
     draw('cyl','#a78d6d',x,.6,z,.28,1.2,.28);
     draw('sphere',j%3?'#74c5a7':'#f3cfbd',x,1.65,z,1.2,1.35,1.2);
   }
 }
 // Water ripple plaza at the center of the water-interference district.
 if(Math.hypot(state.x-31,state.z-23)<48){
   draw('cyl','#66bfdd',31,.12,23,13,.16,13);
   draw('cyl','#9de0f1',31,.22,23,11,.04,11);
   for(let r=0;r<3;r++){const rad=.6+((state.t*.7+r*1.6)%5);for(let k=0;k<12;k++){const a=k*Math.PI/6;draw('sphere','#d1faff',31+Math.cos(a)*rad,.27,23+Math.sin(a)*rad,.085,.035,.085)}}
 }
 // Tiny flowers only near player to avoid thousands of triangles on phones.
 for(let i=0;i<(lowPower?35:80);i++){
   const x=Math.sin(i*17.53)*54,z=20+Math.cos(i*12.17)*68;
   if(Math.hypot(x-state.x,z-state.z)>22)continue;
   draw('sphere',i%2?'#ffdaee':'#fff4b8',x,.09,z,.12,.1,.12);
 }
}
function fxOrbit(s,i,color,t){
 const count=lowPower?6:10;
 const radius=1.56+Math.sin(t*.95+i)*.18;
 for(let j=0;j<count;j++){const a=j*Math.PI*2/count+t*.5+i;
   draw('sphere',color,s.x+Math.cos(a)*radius,2.86+.12*Math.sin(a*2+t),s.z+Math.sin(a)*radius,.11,.11,.11);
 }
}
// V7: each micro-station now has its own model and motion vocabulary.
function stationStructures(){
 const t=state.t;
 for(const s of stations){
  const dist=Math.hypot(s.x-state.x,s.z-state.z);
  if(dist>(lowPower?25:32))continue;
  const palette=chapterZones[s.chapter-1].color;
  const selected=state.near?.id===s.id;
  draw('cyl','#fbfeff',s.x,.14,s.z,4.8,.22,4.8);
  draw('cyl',palette,s.x,.24,s.z,4.0,.16,4.0);
  draw('cyl','#fffaf1',s.x,1.1,s.z,1.22,1.4,1.22);
  draw('sphere',palette,s.x,2.06+Math.sin(t*2+s.x*.2)*.07,s.z,1.0,.28,1.0);
  if(selected)for(let k=0;k<7;k++){const a=k*2*Math.PI/7+t*.6;draw('sphere','#ffe5a2',s.x+Math.cos(a)*2.9,1.15,s.z+Math.sin(a)*2.9,.12,.12,.12)}
  renderStationEffect(draw,s,t,lowPower);
 }
}
function chibi(p,t,own=false){
 const a=p.avatar||{},skin=a.skin||'#F6C6A8',hair=a.hair||'#3D2B30',shirt=a.outfit||'#5966D8';
 const x=p.x||0,z=p.z||0,r=p.rot||0;
 const moving=own&&state.isWalking;
 const bob=(moving?Math.sin(t*12)*.042:Math.sin(t*2)*.018);
 // Every mesh in the head (face, forehead, hair, fringe, locks, accessories)
 // is child of ONE rigid transform. All local positions rotate with the head.
 const part=(type,color,lx,ly,lz,sx,sy,sz,extraRot=0)=>{
   const point=rotateXZ(lx,lz,r);
   draw(type,color,x+point.x,ly+bob,z+point.z,sx,sy,sz,r+extraRot);
 };
 const head=(type,color,lx,ly,lz,sx,sy,sz,extraRot=0)=>part(type,color,lx,1.63+ly,lz,sx,sy,sz,extraRot); // all hair, eyes, ears and accessories are child of this head transform
 // Torso and legs in the body's local coordinate system.
 part('sphere','#78AD81',0,.045,0,.54,.035,.38);
 for(const side of [-1,1])part('sphere','#58647F',side*.18,.24,0,.19,.27,.24);
 part('sphere',shirt,0,.79,0,.51,.61,.39);
 part('sphere','#FFFFFF',0,.76,.34,.2,.28,.08);
 for(const side of [-1,1])part('sphere',skin,side*.48,.88,0,.17,.36,.18);
 // Head rig: all facial features and HAIR use the same local forward (+Z).
 head('sphere',skin,0,0,0,.61,.58,.54);
 for(const side of [-1,1])head('sphere',skin,side*.53,-.03,0,.14,.18,.13);
 for(const side of [-1,1]){
   head('sphere','#29334A',side*.21,.01,.50,.075,.098,.045);
   head('sphere','#EDA2A5',side*.32,-.15,.49,.12,.06,.028);
 }
 head('sphere','#9A5A62',0,-.20,.535,.085,.028,.03);
 // Cap + asymmetric sweeping bangs make orientation obvious from any camera angle.
 head('sphere',hair,0,.38,-.09,.65,.32,.60);
 head('sphere',hair,-.30,.26,.46,.34,.21,.18);
 head('sphere',hair,-.51,.02,.28,.18,.37,.20); // side-lock anchored to the head (not world)
 head('sphere','#FFDBF0',.42,.43,.29,.10,.12,.08); // asymmetric hair clip: visual rotation marker
 head('sphere',hair,.20,.34,.46,.29,.15,.18);
 if(a.style==='spiky'){
   for(let i=-2;i<=2;i++)head('cone',hair,i*.20,.67,-.10,.21,.46,.20);
   head('sphere',hair,.45,.17,.13,.15,.29,.25);
 }else if(a.style==='bun'){
   head('sphere',hair,0,.72,-.30,.29,.34,.33);
   head('sphere','#E9A4B8',0,.70,-.58,.12,.12,.05);
   for(const side of [-1,1])head('sphere',hair,side*.46,-.02,.06,.22,.36,.27);
 }else if(a.style==='bob'){
   for(const side of [-1,1])head('sphere',hair,side*.48,-.12,.10,.23,.41,.30);
   head('sphere',hair,-.11,.40,.48,.35,.15,.18);
 }else{
   head('sphere',hair,-.43,.18,-.08,.24,.20,.29);
   head('sphere',hair,.36,.15,.10,.24,.20,.29);
 }
 if(a.accessory==='cat')for(const side of [-1,1])head('cone',hair,side*.43,.80,-.03,.29,.51,.28);
 if(a.accessory==='star')head('sphere','#F7D578',.45,.58,.30,.15,.15,.14);
 if(a.accessory==='glasses')for(const side of [-1,1]){
   head('sphere','#515771',side*.21,.01,.57,.15,.15,.025);
   head('sphere','#D1E7F2',side*.21,.01,.608,.10,.10,.044);
 }
}
function move(dt){
 // W/↑ means 'away from the camera', S/↓ means 'towards the camera'.
 // A/D and mobile joystick are aligned with the screen, never fixed map axes.
 let strafe=(state.keys.has('d')||state.keys.has('arrowright')?1:0)-(state.keys.has('a')||state.keys.has('arrowleft')?1:0);
 let forward=(state.keys.has('w')||state.keys.has('arrowup')?1:0)-(state.keys.has('s')||state.keys.has('arrowdown')?1:0);
 strafe+=state.stick.x;forward-=state.stick.y;
 const v=movementFromView(strafe,forward,state.camAngle);
 state.isWalking=Math.hypot(v.x,v.z)>.12;
 if(state.isWalking){
  const speed=isTouchUI()?8.2:8.8;
  state.x=clamp(state.x+v.x*dt*speed,WORLD_BOUNDS.minX,WORLD_BOUNDS.maxX);
  state.z=clamp(state.z+v.z*dt*speed,WORLD_BOUNDS.minZ,WORLD_BOUNDS.maxZ);
  state.rotation=facingFromMovement(v.x,v.z); // unified avatar pivot: head + hair use this same yaw
 }
 state.near=stations.reduce((a,s)=>{const dist=Math.hypot(s.x-state.x,s.z-state.z);return dist<6.3&&(!a||dist<a.d)?{...s,d:dist}:a},null);
 updateTouchAction();
 $('actionHint').classList.toggle('hidden',!state.near);
 if(state.near){$('actionHint').innerHTML='Nhấn <kbd>E</kbd> để mở '+state.near.name;$('nearHint').textContent='Bạn đang ở '+state.near.name;}
 else $('nearHint').textContent='Khám phá cùng bạn bè!';
 const now=Date.now();if(state.ws?.readyState===1&&now-state.lastMove>110){state.lastMove=now;state.ws.send(JSON.stringify({type:'move',x:state.x,z:state.z,rot:state.rotation}))}
}
function project(x,y,z){if(!R)return null;const m=multiply(R.proj,R.view);const q=[x,y,z,1],v=[0,0,0,0];for(let i=0;i<4;i++)for(let j=0;j<4;j++)v[i]+=m[j*4+i]*q[j];if(v[3]<=0)return null;return {x:(v[0]/v[3]+1)*innerWidth/2,y:(1-v[1]/v[3])*innerHeight/2,visible:Math.abs(v[0]/v[3])<1.2&&Math.abs(v[1]/v[3])<1.2};}
function render(){if(!R||!state.user)return;const {gl,loc}=R;const w=$('world').clientWidth,h=$('world').clientHeight,dpr=Math.min(1.6,devicePixelRatio||1);if(gl.canvas.width!==Math.floor(w*dpr)||gl.canvas.height!==Math.floor(h*dpr)){gl.canvas.width=Math.floor(w*dpr);gl.canvas.height=Math.floor(h*dpr)}gl.viewport(0,0,gl.canvas.width,gl.canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(R.program);
 const eye=cameraEye(state.x,state.z,state.camAngle,state.camPitch,state.camDistance);
 const target=[state.x,1.42,state.z];
 R.proj=perspective(Math.PI/3.4,w/h,.1,210);R.view=lookAt(eye,target);gl.uniformMatrix4fv(loc.P,false,R.proj);gl.uniformMatrix4fv(loc.V,false,R.view);
 ground();stationStructures();chibi({x:state.x,z:state.z,rot:state.rotation,avatar:state.avatar},state.t,true);
 for(const p of state.others.values())chibi(p,state.t,false);
 updateTouchHotspots();
 for(const {s,label} of worldLabels){const d=Math.hypot(s.x-state.x,s.z-state.z);const q=d<22?project(s.x,3.05,s.z):null;label.style.display=q?.visible&&!isTouchUI()?'block':'none';if(q){label.style.left=q.x+'px';label.style.top=q.y+'px';}}
 const holder=$('friendLabels');holder.replaceChildren();for(const p of state.others.values()){const q=project(p.x,2.75,p.z);if(q?.visible){const d=document.createElement('div');d.className='friend-label';d.style.left=q.x+'px';d.style.top=q.y+'px';d.textContent=p.nickname+' ✦'+p.score;holder.append(d)}}
}
function drawLab(){if(!state.station)return;const cv=$('labCanvas');if(!cv)return;const c=cv.getContext('2d');if(!c)return;const w=cv.width,h=cv.height,l=state.lab,s=state.station;const t=state.t;if(drawChapterLab(c,w,h,s,l,t))return;c.clearRect(0,0,w,h);c.fillStyle='#FFFFFF';c.fillRect(0,0,w,h);
 c.strokeStyle='#E8EEF7';c.lineWidth=1;for(let y=20;y<h;y+=32){c.beginPath();c.moveTo(10,y);c.lineTo(w-10,y);c.stroke()}
 c.strokeStyle='#9BAFC8';c.lineWidth=1.4;c.beginPath();c.moveTo(8,h/2);c.lineTo(w-8,h/2);c.stroke();
 const period= Math.max(32,Math.min(420,80*l.v/l.f));
 if(['amnguon','amtanso','amsac','amcuongdo','amdecibel'].includes(s.id)){
  c.save();c.strokeStyle='#4779AF';c.lineWidth=3;c.font='bold 13px Nunito, sans-serif';c.fillStyle='#36516C';
  if(s.id==='amnguon'){
   c.fillText('Nguồn rung → nén / giãn lan truyền → tai',15,22);
   const q=l.f*t;for(let i=0;i<37;i++){const base=18+i*16;const dx=l.A*11*Math.sin(2*Math.PI*(q-i/14));const x=base+dx;c.fillStyle=i%3===0?'#277FA3':'#5BB3D1';c.beginPath();c.arc(x,h/2,4.5,0,7);c.fill();c.strokeStyle='#D1D8E3';c.beginPath();c.moveTo(base,h/2-27);c.lineTo(base,h/2+27);c.stroke()}
  }else if(s.id==='amtanso'){
   c.fillText('Phân loại theo tần số (trang 32)',16,22);
   const W=w-42,X=20,Y=75,cutLow=Math.log10(17)/Math.log10(30001),cutHigh=Math.log10(20001)/Math.log10(30001);c.fillStyle='#B2C8E3';c.fillRect(X,Y,W*cutLow,26);c.fillStyle='#A5DAD6';c.fillRect(X+W*cutLow,Y,W*(cutHigh-cutLow),26);c.fillStyle='#F7C7A1';c.fillRect(X+W*cutHigh,Y,W*(1-cutHigh),26);
   for(const [txt,x] of [['Hạ âm',X+3],['Âm nghe được',X+W*.45],['Siêu âm',X+W*.84]]){c.fillStyle='#304A64';c.fillText(txt,x,Y+18)}
   const normalized=Math.log10(1+l.soundFrequency)/Math.log10(30001);const mx=X+normalized*W;c.fillStyle='#C25375';c.beginPath();c.moveTo(mx,59);c.lineTo(mx-8,45);c.lineTo(mx+8,45);c.fill();c.fillText('f = '+l.soundFrequency+' Hz',X,142);
  }else if(s.id==='amsac'){
   c.fillText('Giữ f cơ bản, thay thành phần họa âm',15,22);
   c.beginPath();const wave=k=>Math.sin(k)+ (l.timbre>1?.28*Math.sin(2*k):0)+(l.timbre>2?.14*Math.sin(3*k):0);
   for(let i=0;i<w;i++){const y=h/2-56*wave(i*.032+l.soundFrequency*t*.006);if(i===0)c.moveTo(i,y);else c.lineTo(i,y)}c.stroke();
  }else if(s.id==='amcuongdo'){
   c.fillText('Nguồn điểm: I=P/(4πR²)',16,22);const cx=w*.35,cy=h*.57,rad=12+l.distance*4;c.strokeStyle='#7BC3D5';for(let n=1;n<=3;n++){c.beginPath();c.arc(cx,cy,rad*n/3,0,Math.PI*2);c.stroke()}
   c.fillStyle='#E39E67';c.beginPath();c.arc(cx,cy,12,0,7);c.fill();c.fillStyle='#49637A';c.fillText('R tăng → mặt cầu lớn hơn → I giảm',15,h-16);
  }else{
   c.fillText('Thang logarit: ΔL = 10 dB ↔ cường độ ×10',16,22);const barWidth=(w-60)*l.decibel/100;c.fillStyle='#D7E3F1';c.fillRect(30,85,w-60,25);c.fillStyle='#6E9EE2';c.fillRect(30,85,barWidth,25);c.fillStyle='#36516C';c.fillText('L = '+l.decibel+' dB',30,75);c.fillText('I/I₀ = '+Math.pow(10,l.decibel/10).toExponential(1),30,148);
  }
  c.restore();return;
 }
 if(s.id==='doc'){for(let i=0;i<30;i++){const x=20+i*(w-40)/29,shift=22*l.A*Math.sin(2*Math.PI*(l.f*t-i/14));c.fillStyle='#D4DDE8';c.beginPath();c.arc(x,h/2,3,0,Math.PI*2);c.fill();c.fillStyle='#419BCA';c.beginPath();c.arc(x+shift,h/2,8,0,Math.PI*2);c.fill()}c.fillStyle='#51748A';c.font='700 13px Nunito';c.fillText('← dao động →',14,23);c.fillText('Truyền sóng →',w-155,23);}
 else if(s.id==='pha'){const phase=2*Math.PI*l.d,ay=Math.sin(t*2*Math.PI*l.f),by=Math.sin(t*2*Math.PI*l.f-phase),xs=[w*.31,w*.7];for(const [i,u,col] of [[0,ay,'#7581E4'],[1,by,'#DE83B7']]){c.strokeStyle='#D8DFEA';c.beginPath();c.moveTo(xs[i],25);c.lineTo(xs[i],h-22);c.stroke();c.fillStyle=col;c.beginPath();c.arc(xs[i],h/2-u*75,13,0,7);c.fill();c.fillStyle='#576887';c.font='800 14px Nunito';c.fillText(i===0?'M':'N',xs[i]-5,h-9);}c.fillStyle='#536681';c.font='bold 13px Nunito';c.fillText('Hai điểm chuyển động theo pha khác nhau',10,20);}
 else {c.beginPath();for(let i=0;i<w;i++){let u=Math.sin(2*Math.PI*(l.f*t-i/period))*l.A*(s.id==='lambda'?.65:1);let y=h/2-u*72;if(i===0)c.moveTo(i,y);else c.lineTo(i,y)}c.strokeStyle=s.id==='ngang'?'#EA87AE':'#5E8CDF';c.lineWidth=4;c.stroke();if(s.id==='ngang'){for(let i=30;i<w;i+=55){c.strokeStyle='#C7D4E3';c.setLineDash([4,5]);c.beginPath();c.moveTo(i,22);c.lineTo(i,h-22);c.stroke();c.setLineDash([]);const y=h/2-Math.sin(2*Math.PI*(l.f*t-i/period))*l.A*72;c.fillStyle='#E76C9E';c.beginPath();c.arc(i,y,6.5,0,7);c.fill()}}c.fillStyle='#566F90';c.font='bold 13px Nunito';c.fillText(s.id==='ngang'?'Phần tử ↑↓ ; sóng →':s.id==='lambda'?'Tăng f khi v cố định → λ ngắn lại':'Nhiễu loạn lan truyền →',18,23);}
}
// Original procedural soundtrack, composed for SóngVerse (no third-party audio assets).
// Browsers require a user gesture before starting AudioContext.
const music={ctx:null,timer:null,enabled:false,volume:Number(localStorage.getItem('sv_music_volume')||.26),step:0,next:0,master:null};
const melody=[0,2,4,7,4,2,0,null, 2,4,7,9,7,4,2,null, 4,7,9,11,9,7,4,2, 0,4,7,4,2,0,null,null];
const bass=[0,0,5,5,7,7,5,5];
function noteHz(semitones){return 261.625565*Math.pow(2,semitones/12)}
function soundTone(hz,when,duration,kind='triangle',gain=.08){
 if(!music.ctx||!music.master)return;
 const osc=music.ctx.createOscillator(),envelope=music.ctx.createGain();
 osc.type=kind;osc.frequency.setValueAtTime(hz,when);
 envelope.gain.setValueAtTime(.0001,when);
 envelope.gain.exponentialRampToValueAtTime(gain,when+.014);
 envelope.gain.exponentialRampToValueAtTime(.0001,when+duration);
 osc.connect(envelope);envelope.connect(music.master);
 osc.start(when);osc.stop(when+duration+.035);
}
function scheduleMusic(){
 if(!music.enabled||!music.ctx)return;
 const eighth=60/116/2;
 while(music.next<music.ctx.currentTime+.18){
  const beat=music.step,idx=beat%melody.length,n=melody[idx];
  if(n!==null)soundTone(noteHz(n+12),music.next,eighth*.85,'triangle',.12);
  if(beat%4===0){const root=bass[Math.floor(beat/4)%bass.length];soundTone(noteHz(root-24),music.next,eighth*3.2,'sine',.16)}
  if(beat%2===1)soundTone(880,music.next,.045,'sine',.012);
  music.step++;music.next+=eighth;
 }
}
function setMusicEnabled(on){
 const btn=$('musicBtn');
 if(!on){music.enabled=false;if(music.timer){clearInterval(music.timer);music.timer=null}music.master?.gain.setTargetAtTime(0,music.ctx.currentTime,.025);btn.textContent='🔇';btn.setAttribute('aria-pressed','false');btn.title='Bật nhạc nền';return}
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC){toast('Trình duyệt chưa hỗ trợ âm thanh Web Audio');return}
 try{
  if(!music.ctx){music.ctx=new AC();music.master=music.ctx.createGain();music.master.connect(music.ctx.destination)}
  music.ctx.resume();music.master.gain.setTargetAtTime(music.volume,music.ctx.currentTime,.025);
  music.enabled=true;music.step=0;music.next=music.ctx.currentTime+.08;
  music.timer=setInterval(scheduleMusic,55);scheduleMusic();
  btn.textContent='🎵';btn.setAttribute('aria-pressed','true');btn.title='Tắt nhạc nền';
 }catch{toast('Không mở được âm thanh trên thiết bị này')}
}
function setupMusic(){
 $('musicBtn').addEventListener('click',()=>setMusicEnabled(!music.enabled));
 const vol=$('musicVolume');vol.value=String(music.volume);
 vol.addEventListener('input',()=>{music.volume=Number(vol.value);localStorage.setItem('sv_music_volume',String(music.volume));if(music.enabled)music.master.gain.setTargetAtTime(music.volume,music.ctx.currentTime,.025)});
 document.addEventListener('visibilitychange',()=>{if(music.ctx){if(document.hidden)music.ctx.suspend();else if(music.enabled){music.ctx.resume().then(()=>{music.next=music.ctx.currentTime+.07})}}});
}

if(new URLSearchParams(location.search).get('debug')==='1'){window.__svDebug={state,stations,rotateAvatar:(angle)=>{state.rotation=angle;},setCamera:(angle,pitch)=>{state.camAngle=angle;state.camPitch=pitch;updateCameraLabel();},stepMovement:(dx,dz)=>{const v=movementFromView(dx,dz,state.camAngle);return v;}}}
// Login handlers should be available before rendering starts.
initUI();
(async()=>{if(state.token){try{const d=await api('me');state.user=d.user;state.avatar={...d.user.avatar};$('roomInput').value=state.room;startGame();return}catch{state.token='';localStorage.removeItem('sv_token')}}showAuth();})();
