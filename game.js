(() => {
  'use strict';
  const canvas = document.querySelector('#battle');
  const ctx = canvas.getContext('2d');
  const W = 1440, H = 760, ground = 624;
  const goldEl = document.querySelector('#goldValue');
  const incomeEl = document.querySelector('#incomeValue');
  const roster = document.querySelector('#unitRoster');
  const waveLabel = document.querySelector('#waveLabel');
  const waveProgress = document.querySelector('#waveProgress');
  const enemyHpLabel = document.querySelector('#enemyHpLabel');
  const statusText = document.querySelector('#statusText');
  const battleTime = document.querySelector('#battleTime');
  const toast = document.querySelector('#toast');
  const pauseLayer = document.querySelector('#pauseLayer');
  const endLayer = document.querySelector('#endLayer');
  const rand = (a,b) => a + Math.random() * (b-a);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const types = {
    miner: {name:'Miner',cost:50,hp:95,speed:49,damage:0,range:0,rate:0,icon:'⚒',color:'#c7a86c',role:'gold gatherer'},
    sword: {name:'Swordwrath',cost:90,hp:150,speed:65,damage:25,range:34,rate:1.05,icon:'⚔',color:'#a7c7b0',role:'frontline fighter'},
    archer: {name:'Archidon',cost:120,hp:95,speed:43,damage:19,range:285,rate:1.65,icon:'➶',color:'#94b69a',role:'ranged support'},
    spear: {name:'Spearton',cost:150,hp:230,speed:38,damage:39,range:53,rate:1.35,icon:'⟐',color:'#b8c5a5',role:'armored guard'}
  };
  let gold=250, units=[], projectiles=[], particles=[], order='advance', paused=false, ended=false, soundOn=false;
  let elapsed=0, wave=1, nextWave=17, mineTimer=0, toastTimer=0, last=performance.now(), kills=0, trained=0;
  let friendlyCastle=3000, enemyCastle=3000, waveSpawned=0, waveSize=3;
  const castles={friendly:{x:105,side:'friendly'},enemy:{x:1336,side:'enemy'}};
  let audio;
  function beep(freq=420,duration=.08,type='sine'){ if(!soundOn)return; try{audio ||= new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch{} }
  function showToast(message){toast.textContent=message;toast.classList.add('show');toastTimer=2.2}
  function setStatus(message){statusText.textContent=message}
  function makeUnit(type,side,x){const config=types[type];return {type,side,x,y:ground,hp:config.hp,maxHp:config.hp,cool:rand(.15,.7),anim:rand(0,8),gather:0,carrying:0,dead:false,hitFlash:0,id:Math.random()}}
  function spawn(type){const config=types[type];if(ended||paused)return;if(gold<config.cost){showToast(`NOT ENOUGH GOLD · NEED ${config.cost}`);beep(170,.12,'square');return}gold-=config.cost;trained++;units.push(makeUnit(type,'friendly',245+rand(-12,10)));beep(350,.08);setStatus(`${config.name} joins the ${order==='advance'?'advance':'citadel guard'}.`);updateHud()}
  function spawnEnemy(type,x=1175){units.push(makeUnit(type,'enemy',x));}
  const unitChoices=['miner','sword','archer','spear'];
  unitChoices.forEach((type,index)=>{const t=types[type],button=document.createElement('button');button.className='unit-card';button.dataset.type=type;button.title=`Train ${t.name} · ${t.role} · costs ${t.cost} gold · hotkey ${index+1}`;button.innerHTML=`<span class="unit-hotkey">${index+1}</span><span class="unit-symbol">${t.icon}</span><span class="unit-name">${t.name}</span><span class="unit-cost">◈ ${t.cost} GOLD</span>`;button.addEventListener('click',()=>spawn(type));roster.append(button)});
  units.push(makeUnit('miner','friendly',236),makeUnit('miner','friendly',250),makeUnit('sword','friendly',278));
  spawnEnemy('sword',1110);spawnEnemy('archer',1170);
  function updateHud(){goldEl.textContent=Math.floor(gold).toLocaleString();const miners=units.filter(u=>u.side==='friendly'&&u.type==='miner'&&!u.dead).length;incomeEl.textContent=`+${miners*30}`;roster.querySelectorAll('button').forEach(button=>button.disabled=gold<types[button.dataset.type].cost||ended);enemyHpLabel.textContent=`${Math.max(0,Math.ceil(enemyCastle)).toLocaleString()} HP`;waveLabel.innerHTML=`WAVE ${String(wave).padStart(2,'0')} <span>·</span> ${wave<3?'SCOUTS':wave<6?'IRON GUARD':'ELITE'}`;}
  function setOrder(next){order=next;document.querySelectorAll('.order-btn').forEach(b=>b.classList.toggle('active',b.dataset.order===order));if(order==='advance'){setStatus('Attack order: your troops are pushing toward Ironhold.');showToast('ADVANCE · PUSH TO THE ENEMY CITADEL')}else{setStatus('Defend order: your troops are holding near your citadel.');showToast('DEFEND · HOLD THE FRONTIER')}beep(order==='advance'?460:300,.09)}
  document.querySelectorAll('.order-btn').forEach(b=>b.addEventListener('click',()=>setOrder(b.dataset.order)));
  document.querySelector('#pauseBtn').addEventListener('click',togglePause);
  document.querySelector('#resumeBtn').addEventListener('click',togglePause);
  document.querySelector('#restartBtn').addEventListener('click',()=>location.reload());
  document.querySelector('#soundBtn').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.classList.toggle('sound-on',soundOn);e.currentTarget.textContent=soundOn?'♫':'♩';if(soundOn)beep(550,.08)});
  function togglePause(){if(ended)return;paused=!paused;pauseLayer.classList.toggle('hidden',!paused);document.querySelector('#pauseBtn').textContent=paused?'▶':'Ⅱ';last=performance.now()}
  window.addEventListener('keydown',e=>{if(e.repeat)return;if(['1','2','3','4'].includes(e.key)){spawn(unitChoices[Number(e.key)-1]);}else if(e.code==='Space'){e.preventDefault();togglePause()}else if(e.key.toLowerCase()==='a')setOrder('advance');else if(e.key.toLowerCase()==='d')setOrder('defend')});
  canvas.addEventListener('click',e=>{const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*W;if(x>W*.4&&x<W*.64){setOrder(order==='advance'?'defend':'advance')}});
  function getOpponents(u){return units.filter(v=>!v.dead&&v.side!==u.side)}
  function nearestOpponent(u){let best=null,dist=Infinity;for(const v of units){if(v.dead||v.side===u.side)continue;const d=Math.abs(v.x-u.x);if(d<dist){dist=d;best=v}}return best?{unit:best,dist}:null}
  function shoot(u,target){const cfg=types[u.type],direction=u.side==='friendly'?1:-1;projectiles.push({x:u.x+(direction*9),y:ground-45-(u.type==='archer'?7:0),vx:direction*(u.type==='archer'?380:300),vy:u.type==='archer'?-60:0,damage:cfg.damage,side:u.side,target,life:2,type:u.type});u.cool=cfg.rate;u.anim+=1}
  function damageTarget(target,amount,source){if(!target||target.dead)return;target.hp-=amount;target.hitFlash=.14;for(let i=0;i<4;i++)particles.push({x:target.x+rand(-6,6),y:ground-30+rand(-8,4),vx:rand(-38,38),vy:rand(-75,-15),life:rand(.18,.4),color:target.side==='enemy'?'#d97d68':'#d6c48c'});if(target.hp<=0){target.dead=true;kills++;if(target.type==='miner'&&target.side==='enemy')gold+=12;beep(120,.12,'triangle');if(kills%5===0)showToast('IRONHOLD REINFORCEMENTS DEFEATED');}}
  function updateUnits(dt){
    for(const u of units){if(u.dead)continue;const cfg=types[u.type];u.anim+=dt*(u.type==='miner'?4:6);u.cool=Math.max(0,u.cool-dt);u.hitFlash=Math.max(0,u.hitFlash-dt);
      if(u.type==='miner'&&u.side==='friendly'){const mineX=712;if(u.carrying>0){const goal=250;if(Math.abs(goal-u.x)>9)u.x+=Math.sign(goal-u.x)*cfg.speed*dt;else{gold+=u.carrying;u.carrying=0;setStatus('Your miners brought in gold. Keep the pressure on.');beep(670,.06)}}else if(Math.abs(mineX-u.x)>10){u.x+=Math.sign(mineX-u.x)*cfg.speed*dt}else{u.gather+=dt;if(u.gather>=4.2){u.gather=0;u.carrying=30;showToast('GOLD VEIN MINED · +30 GOLD')}}continue}
      const targetInfo=nearestOpponent(u);const engageDistance=u.type==='archer'?cfg.range:Math.max(cfg.range,35);
      if(targetInfo&&targetInfo.dist<engageDistance){if(u.cool<=0)shoot(u,targetInfo.unit);continue}
      if(u.type==='archer'&&targetInfo&&targetInfo.dist<cfg.range+95){u.x+= (u.side==='friendly'?-1:1)*cfg.speed*dt*.2;continue}
      let direction=u.side==='friendly'?1:-1,goal;
      if(u.side==='friendly'){goal=order==='advance'?1290:380;if(order==='defend'&&u.x>goal)direction=-1;else if(order==='advance'&&u.x>goal)direction=0}
      else{goal=150;if(u.x<goal)direction=0}
      if(direction!==0)u.x+=direction*cfg.speed*dt;
      u.x=clamp(u.x,150,1290);
      const castleTarget=u.side==='friendly'?enemyCastle:friendlyCastle,castleX=u.side==='friendly'?1295:145;
      if(Math.abs(u.x-castleX)<(u.type==='archer'?cfg.range:42)&&castleTarget>0&&u.cool<=0){if(u.type==='archer')shootCastle(u);else{if(u.side==='friendly')enemyCastle=Math.max(0,enemyCastle-cfg.damage);else friendlyCastle=Math.max(0,friendlyCastle-cfg.damage);u.cool=cfg.rate;u.anim+=1;}}
    }
  }
  function shootCastle(u){const c=types[u.type];if(u.side==='friendly')enemyCastle=Math.max(0,enemyCastle-c.damage);else friendlyCastle=Math.max(0,friendlyCastle-c.damage);u.cool=c.rate}
  function updateProjectiles(dt){for(const p of projectiles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=250*dt;if(p.target&&!p.target.dead&&Math.abs(p.x-p.target.x)<18){damageTarget(p.target,p.damage);p.life=0}else if(p.target?.dead){p.life=0}else if(!p.target){const cX=p.side==='friendly'?1295:145;if(Math.abs(p.x-cX)<22){if(p.side==='friendly')enemyCastle=Math.max(0,enemyCastle-p.damage);else friendlyCastle=Math.max(0,friendlyCastle-p.damage);p.life=0}}}projectiles=projectiles.filter(p=>p.life>0&&p.x>0&&p.x<W)}
  function updateParticles(dt){for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=210*dt;p.life-=dt}particles=particles.filter(p=>p.life>0)}
  function updateGame(dt){elapsed+=dt;mineTimer+=dt;toastTimer-=dt;if(toastTimer<=0)toast.classList.remove('show');if(mineTimer>=1){mineTimer=0;updateHud()}
    if(elapsed>=nextWave){wave++;waveSpawned=0;waveSize=Math.min(3+wave,9);nextWave=elapsed+Math.max(17,30-wave*1.1);showToast(`WAVE ${String(wave).padStart(2,'0')} · IRONHOLD ADVANCES`);setStatus('Enemy reinforcements are marching in. Hold the line!')}
    if(waveSpawned<waveSize&&elapsed>=nextWave-(waveSize-waveSpawned)*1.45){const pick=wave<3?['sword','sword','archer']:['sword','archer','spear'];spawnEnemy(pick[Math.floor(Math.random()*pick.length)],1180+rand(-10,30));waveSpawned++}
    updateUnits(dt);updateProjectiles(dt);updateParticles(dt);
    if(enemyCastle<=0)finish(true);else if(friendlyCastle<=0)finish(false);
    updateHud();waveProgress.style.width=`${clamp((elapsed-(nextWave-(waveSize*1.45)))/(waveSize*1.45),0,1)*100}%`;
    const mins=Math.floor(elapsed/60),secs=Math.floor(elapsed%60);battleTime.textContent=`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }
  function finish(win){ended=true;endLayer.classList.remove('hidden');document.querySelector('#endIcon').textContent=win?'✦':'✕';document.querySelector('#endEyebrow').textContent=win?'VICTORY · IRONHOLD HAS FALLEN':'DEFEAT · THE CITADEL HAS FALLEN';document.querySelector('#endTitle').textContent=win?'The frontier is yours.':'The frontier is lost.';document.querySelector('#endCopy').textContent=win?`You trained ${trained} soldiers and defeated ${kills} enemy troops in ${battleTime.textContent}.`:`Your army fought bravely. Train a balanced force and try again.`;setStatus(win?'The Ironhold has fallen. The frontier is yours.':'Your citadel has fallen. Regroup and try again.');}
  function polygon(points,fill,stroke=null,width=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
  function drawBackground(t){
    const sky=ctx.createLinearGradient(0,0,0,ground);sky.addColorStop(0,'#273b3b');sky.addColorStop(.52,'#78806a');sky.addColorStop(1,'#c19a67');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    const sun=ctx.createRadialGradient(1080,180,8,1080,180,220);sun.addColorStop(0,'#e7cf9b66');sun.addColorStop(1,'#e7cf9b00');ctx.fillStyle=sun;ctx.fillRect(800,0,500,450);ctx.beginPath();ctx.arc(1080,180,42,0,Math.PI*2);ctx.fillStyle='#f0d7a2';ctx.globalAlpha=.58;ctx.fill();ctx.globalAlpha=1;
    for(let i=0;i<5;i++){const x=((i*350+150-t*5)%1700)-120;ctx.fillStyle='#e2d9be12';ctx.beginPath();ctx.ellipse(x,135+i%3*38,90,16,0,0,Math.PI*2);ctx.fill()}
    polygon([[0,410],[145,282],[230,365],[382,236],[530,384],[710,270],[837,378],[1005,230],[1175,385],[1290,280],[1440,390],[1440,600],[0,600]],'#667064');
    polygon([[0,465],[180,360],[325,440],[520,317],[715,449],[925,335],[1110,446],[1270,340],[1440,420],[1440,624],[0,624]],'#4b5a4d');
    polygon([[0,516],[180,465],[345,504],[530,440],[690,503],[870,452],[1050,488],[1250,430],[1440,482],[1440,624],[0,624]],'#35483e');
    ctx.globalAlpha=.24;for(let i=0;i<48;i++){const x=(i*173+40)%1440,y=408+((i*67)%172);ctx.fillStyle=i%2?'#b8b08a':'#273b32';ctx.beginPath();ctx.ellipse(x,y,rand(12,40),rand(2,7),-.12,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
    // Scrub trees and broken stonework lend scale to the old battlefield.
    for(const x of [330,455,558,844,990,1080]){const h=45+(x%4)*10;ctx.fillStyle='#24342b';ctx.fillRect(x,ground-h*.55,5,h*.55);for(let n=0;n<3;n++){ctx.beginPath();ctx.arc(x+2,ground-h+n*9,13-n*2,0,Math.PI*2);ctx.fillStyle=n===0?'#394c3b':'#314536';ctx.fill()}}
    ctx.fillStyle='#27302a';ctx.fillRect(0,ground,W,H-ground);const earth=ctx.createLinearGradient(0,ground,0,H);earth.addColorStop(0,'#5b4935');earth.addColorStop(.17,'#3b3429');earth.addColorStop(1,'#211f1a');ctx.fillStyle=earth;ctx.fillRect(0,ground,W,H-ground);
    ctx.fillStyle='#8c7651';ctx.fillRect(0,ground,W,3);
    for(let i=0;i<90;i++){const x=(i*97+21)%W,y=ground+14+(i*53%(H-ground-24));ctx.fillStyle=i%3?'#c5a57724':'#1319134a';ctx.fillRect(x,y,3+(i%4),1+(i%3))}
    // A soft track through the grass.
    ctx.fillStyle='#ab8a5640';ctx.beginPath();ctx.ellipse(W/2,ground+7,310,22,0,0,Math.PI*2);ctx.fill();
  }
  function drawCastle(side,hp,maxHp){const friendly=side==='friendly',x=friendly?48:1288,dir=friendly?1:-1;ctx.save();ctx.translate(x,0);ctx.scale(dir,1);
    const stone=friendly?'#4b5950':'#584544',light=friendly?'#788070':'#84635a',dark=friendly?'#2d3831':'#3b302f';
    ctx.fillStyle='#11140f77';ctx.beginPath();ctx.ellipse(70,ground+5,118,20,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=dark;ctx.fillRect(10,ground-152,117,154);ctx.fillStyle=stone;ctx.fillRect(17,ground-148,105,144);ctx.fillStyle=light;ctx.fillRect(17,ground-148,105,9);
    ctx.fillStyle=dark;ctx.fillRect(0,ground-211,51,212);ctx.fillRect(93,ground-224,48,225);ctx.fillStyle=stone;ctx.fillRect(5,ground-206,40,204);ctx.fillRect(98,ground-219,38,217);ctx.fillStyle=light;ctx.fillRect(5,ground-206,40,7);ctx.fillRect(98,ground-219,38,7);
    for(const tx of [0,93]){ctx.fillStyle=dark;ctx.fillRect(tx-4,ground-(tx?245:231),57,21);for(let n=0;n<4;n++)ctx.fillRect(tx-4+n*15,ground-(tx?253:239),9,15)}
    ctx.fillStyle='#1b211e';ctx.beginPath();ctx.moveTo(43,ground);ctx.lineTo(43,ground-68);ctx.quadraticCurveTo(68,ground-108,92,ground-68);ctx.lineTo(92,ground);ctx.fill();ctx.fillStyle='#c89f52';ctx.fillRect(65,ground-72,4,72);
    for(const wx of [22,110]){ctx.fillStyle='#252b27';ctx.fillRect(wx,ground-131,12,23);ctx.fillStyle='#d2b37a55';ctx.fillRect(wx+3,ground-127,6,14)}
    ctx.strokeStyle='#c5aa70';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(26,ground-230);ctx.lineTo(26,ground-277);ctx.stroke();ctx.fillStyle=friendly?'#8aa38a':'#c56b59';ctx.beginPath();ctx.moveTo(27,ground-276);ctx.lineTo(63,ground-266);ctx.lineTo(27,ground-253);ctx.fill();
    // base health rail
    const barX=12,barY=ground-294,barW=122;ctx.fillStyle='#101513bb';ctx.fillRect(barX-2,barY-3,barW+4,10);ctx.fillStyle=friendly?'#90bc8e':'#d57c68';ctx.fillRect(barX,barY,barW*clamp(hp/maxHp,0,1),4);ctx.strokeStyle='#e4dcc0';ctx.globalAlpha=.35;ctx.strokeRect(barX,barY,barW,4);ctx.globalAlpha=1;ctx.restore();}
  function drawMiner(u,phase){ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#20231f';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(u.x-1,ground-32);ctx.lineTo(u.x-5+Math.sin(phase)*5,ground-14);ctx.lineTo(u.x-12+Math.sin(phase)*9,ground-2);ctx.moveTo(u.x-3,ground-14);ctx.lineTo(u.x+6-Math.sin(phase)*7,ground-2);ctx.moveTo(u.x,ground-48);ctx.lineTo(u.x+Math.sin(phase)*5,ground-33);ctx.lineTo(u.x+8,ground-25);ctx.stroke();ctx.fillStyle='#d8c6a0';ctx.beginPath();ctx.arc(u.x,ground-56,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8b7654';ctx.beginPath();ctx.arc(u.x,ground-58,10,Math.PI,Math.PI*2);ctx.fill();ctx.strokeStyle='#b9a170';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(u.x+10,ground-26);ctx.lineTo(u.x+19,ground-6);ctx.lineTo(u.x+24,ground-36);ctx.stroke();ctx.fillStyle='#796747';ctx.fillRect(u.x+17,ground-39,12,4);if(u.carrying){ctx.fillStyle='#f0c767';ctx.beginPath();ctx.arc(u.x+20,ground-36,4,0,Math.PI*2);ctx.fill()}}
  function drawUnit(u){const phase=u.anim,run=Math.sin(phase)*6,side=u.side,color=side==='friendly'?'#d8e1cf':'#ded0c0',armor=side==='friendly'?'#6c8c79':'#96645d',dark=side==='friendly'?'#25342d':'#3b2928';ctx.save();ctx.globalAlpha=u.hp<=0?0:1;ctx.fillStyle='#10130f75';ctx.beginPath();ctx.ellipse(u.x,ground+1,u.type==='spear'?18:14,4,0,0,Math.PI*2);ctx.fill();if(u.type==='miner'){drawMiner(u,phase);ctx.restore();return}
    const moving=true,legSwing=moving?run:0,bodyY=ground-38;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=dark;ctx.lineWidth=u.type==='spear'?7:6;
    ctx.beginPath();ctx.moveTo(u.x-2,bodyY+16);ctx.lineTo(u.x-5-legSwing*.45,ground-14);ctx.lineTo(u.x-10-legSwing,ground-2);ctx.moveTo(u.x+3,bodyY+16);ctx.lineTo(u.x+4+legSwing*.45,ground-14);ctx.lineTo(u.x+11+legSwing,ground-2);ctx.stroke();
    ctx.strokeStyle=armor;ctx.lineWidth=u.type==='spear'?11:9;ctx.beginPath();ctx.moveTo(u.x,ground-48);ctx.lineTo(u.x+1,bodyY+17);ctx.stroke();ctx.strokeStyle=dark;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(u.x-2,bodyY-2);ctx.lineTo(u.x-12,bodyY+12);ctx.lineTo(u.x-8+run*.2,ground-25);ctx.stroke();
    ctx.strokeStyle=armor;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(u.x+3,bodyY-1);ctx.lineTo(u.x+12,bodyY+9);ctx.lineTo(u.x+19,bodyY+15);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.arc(u.x,ground-58,10,0,Math.PI*2);ctx.fill();
    // Helmet and face slit.
    ctx.fillStyle=armor;ctx.beginPath();ctx.arc(u.x,ground-60,11,Math.PI,Math.PI*2);ctx.lineTo(u.x+10,ground-58);ctx.lineTo(u.x-10,ground-58);ctx.fill();ctx.fillStyle='#202520';ctx.fillRect(u.x+2,ground-60,6,2);
    if(u.type==='sword'){ctx.strokeStyle='#c9d0c0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(u.x+18,bodyY+16);ctx.lineTo(u.x+30,bodyY-11);ctx.stroke();ctx.strokeStyle='#9c8357';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(u.x+14,bodyY+12);ctx.lineTo(u.x+23,bodyY+16);ctx.stroke()}
    if(u.type==='archer'){ctx.strokeStyle='#b99d66';ctx.lineWidth=2;ctx.beginPath();ctx.arc(u.x+22,bodyY+4,12,-1.1,1.1);ctx.stroke();ctx.strokeStyle='#dfd1af';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(u.x+22,bodyY-7);ctx.lineTo(u.x+22,bodyY+15);ctx.stroke();ctx.strokeStyle='#b89a5c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(u.x+13,bodyY+4);ctx.lineTo(u.x+34,bodyY+4);ctx.stroke()}
    if(u.type==='spear'){ctx.strokeStyle='#c4b583';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(u.x+14,ground-14);ctx.lineTo(u.x+33,ground-78);ctx.stroke();polygon([[u.x+33,ground-79],[u.x+28,ground-67],[u.x+37,ground-72]],'#d0d0b5');ctx.fillStyle='#9b8150';ctx.beginPath();ctx.arc(u.x-11,bodyY+1,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d3bb81';ctx.lineWidth=2;ctx.beginPath();ctx.arc(u.x-11,bodyY+1,7,0,Math.PI*2);ctx.stroke()}
    const hp=u.hp/u.maxHp;if(hp<.98){ctx.fillStyle='#161a17dd';ctx.fillRect(u.x-13,ground-78,26,3);ctx.fillStyle=hp>.4?'#b6c285':'#d37963';ctx.fillRect(u.x-13,ground-78,26*clamp(hp,0,1),3)}if(u.hitFlash>0){ctx.globalAlpha=u.hitFlash*3;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(u.x,ground-57,11,0,Math.PI*2);ctx.fill()}ctx.restore();}
  function drawEffects(){for(const p of projectiles){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));ctx.strokeStyle=p.side==='friendly'?'#d8c99e':'#d48e79';ctx.lineWidth=p.type==='archer'?2.2:3;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(9,0);ctx.stroke();ctx.fillStyle=p.side==='friendly'?'#e1d6b7':'#e4ad92';polygon([[11,0],[5,-3],[5,3]],ctx.fillStyle);ctx.restore()}for(const p of particles){ctx.globalAlpha=clamp(p.life*3,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3)}ctx.globalAlpha=1;
    // Gold vein marker, glinting under the old road.
    const pulse=.5+.5*Math.sin(elapsed*2.7);ctx.globalAlpha=.35+pulse*.45;ctx.fillStyle='#e9bf6a';ctx.beginPath();ctx.arc(712,ground+20,4+pulse*2,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.font='9px DM Mono, monospace';ctx.fillStyle='#ead39a';ctx.textAlign='center';ctx.fillText('GOLD VEIN',712,ground+38);ctx.textAlign='left';}
  function render(){ctx.clearRect(0,0,W,H);drawBackground(elapsed);drawCastle('friendly',friendlyCastle,3000);drawCastle('enemy',enemyCastle,3000);drawEffects();for(const u of units.slice().sort((a,b)=>a.x-b.x)){if(!u.dead)drawUnit(u)}
    // Atmospheric drifting embers over the far hills.
    ctx.globalAlpha=.35;for(let i=0;i<8;i++){const x=(i*183+elapsed*(8+i%3)*-1+1600)%W,y=235+(i*79)%280;ctx.fillStyle=i%2?'#ead6a0':'#d7a268';ctx.fillRect(x,y,2,2)}ctx.globalAlpha=1;
  }
  function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;if(!paused&&!ended)updateGame(dt);render();requestAnimationFrame(frame)}
  updateHud();requestAnimationFrame(frame);
})();
