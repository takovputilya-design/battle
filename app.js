// ==== Language packs ====
const LANG = {
  en: {
    choose: "Choose",
    name1: "Name 1",
    name2: "Name 2",
    start: "Start Battle",
    fight: "Fight!",
    winner: "Winner:",
    over: "Battle finished!",
    heal: "Heal",
    spike: "Spike",
    upload1: "Choose 1",
    upload2: "Choose 2",
    time: "Time",
    vs: "VS"
  },
  ru: {
    choose: "Выбрать",
    name1: "Имя 1",
    name2: "Имя 2",
    start: "Начать битву",
    fight: "Бой!",
    winner: "Победитель:",
    over: "Битва завершена!",
    heal: "Лечение",
    spike: "Шипы",
    upload1: "Выбрать 1",
    upload2: "Выбрать 2",
    time: "Время",
    vs: "VS"
  }
};

let lang = "en";
let l = LANG[lang];

const $ = (id) => document.getElementById(id);

// ==== UI LOGIC ====
const setupPanel = $("setup");
const langBtns = document.querySelectorAll("#lang-select button");
const uploadSection = $("upload-section");
const previews = [ $("preview1"), $("preview2") ];
const imgInputs = [ $("img1"), $("img2") ];
const uploadLabels = [ $("label1"), $("label2") ];
const namesRow = $("names-row");
const nameInputs = [ $("name1"), $("name2") ];
const startBtn = $("start-btn");
const battleUI = $("battle-ui");
const hpBars = [ $("hp1"), $("hp2") ];
const nameUIs = [ $("name1-ui"), $("name2-ui") ];
const canvas = $("game");
const ctx = canvas.getContext("2d");
const countdown = $("countdown");
const winnerDiv = $("winner");
const battleTimer = $("battle-timer");

// For VS intro
let vsIntroDiv = null;

// Sounds
const sounds = {
  bounce: $("audio-bounce"),
  hit: $("audio-hit"),
  heal: $("audio-heal"),
  spike: $("audio-spike"),
};

// Images
let playerImgs = [null, null];
let playerNames = ["",""];

// Battle timer
let timerStart = 0;
let timerInterval = null;
function resetBattleTimer() {
  timerStart = Date.now();
  updateBattleTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateBattleTimer, 200);
}
function stopBattleTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}
function updateBattleTimer() {
  let t = Math.floor((Date.now() - timerStart)/1000);
  let min = Math.floor(t/60), sec = t%60;
  battleTimer.textContent = `${l.time}: ${min}:${sec<10?"0":""}${sec}`;
}

// Language selection
langBtns.forEach(btn => {
  btn.onclick = () => {
    lang = btn.dataset.lang;
    l = LANG[lang];
    langBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    uploadSection.classList.remove("hidden");
    nameInputs[0].placeholder = l.name1;
    nameInputs[1].placeholder = l.name2;
    uploadLabels[0].textContent = l.upload1;
    uploadLabels[1].textContent = l.upload2;
    startBtn.textContent = l.start;
  }
});

// Avatar image upload (без двойного нажатия)
imgInputs.forEach((input, idx) => {
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      previews[idx].style.backgroundImage = `url(${e.target.result})`;
      previews[idx].classList.add("uploaded");
      playerImgs[idx] = new window.Image();
      playerImgs[idx].src = e.target.result;
      checkAvatars();
    };
    reader.readAsDataURL(file);
  };
  // Не нужно кликать на preview или label — работает через label по стандарту!
});

function checkAvatars() {
  if (playerImgs[0] && playerImgs[1]) {
    namesRow.classList.remove("hidden");
    startBtn.classList.remove("hidden");
  }
}

// Start battle
startBtn.onclick = () => {
  setupPanel.classList.add("hidden");
  battleUI.classList.remove("hidden");
  playerNames[0] = nameInputs[0].value.trim() || l.name1;
  playerNames[1] = nameInputs[1].value.trim() || l.name2;
  nameUIs[0].textContent = playerNames[0];
  nameUIs[1].textContent = playerNames[1];
  setHP(0, HP_MAX); setHP(1, HP_MAX);
  battleTimer.textContent = `${l.time}: 0:00`;
  setTimeout(() => showVSIntro(), 400);
  setTimeout(resizeCanvas, 100);
};

function setHP(idx, hp) {
  let hearts = "";
  for (let i = 0; i < HP_MAX; i++) {
    hearts += `<span class="hp-cell${i<hp?" filled":""}"></span>`;
  }
  hpBars[idx].innerHTML = `<div class="hp-bar-cells">${hearts}</div>`;
}

// ==== CANVAS SIZE ====
function resizeCanvas() {
  // Для мобильных: ширина 95vw, aspect 1:1.1, но не выше 50vh
  let screenW = window.innerWidth;
  let screenH = window.innerHeight;
  let w = Math.min(screenW * 0.95, 440);
  let h = w * 1.1;

  if (h > screenH * 0.5) {
    h = screenH * 0.5;
    w = h / 1.1;
  }

  canvas.width = w * window.devicePixelRatio;
  canvas.height = h * window.devicePixelRatio;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(window.devicePixelRatio,0,0,window.devicePixelRatio,0,0);
}
window.onresize = resizeCanvas;

// ==== GAME STATE ====
let game = null;
let animFrame = null;

// ==== VS INTRO AND COUNTDOWN ====
function showVSIntro() {
  if (vsIntroDiv && vsIntroDiv.parentNode) vsIntroDiv.parentNode.removeChild(vsIntroDiv);
  vsIntroDiv = document.createElement("div");
  vsIntroDiv.id = "vs-intro";
  vsIntroDiv.innerHTML = `
    <div class="vs-wrap">
      <div class="vs-player">
        <div class="vs-avatar" style="background-image:url('${playerImgs[0].src}')"></div>
        <div class="vs-name">${escapeHTML(playerNames[0])}</div>
      </div>
      <div class="vs-vs">${l.vs}</div>
      <div class="vs-player">
        <div class="vs-avatar" style="background-image:url('${playerImgs[1].src}')"></div>
        <div class="vs-name">${escapeHTML(playerNames[1])}</div>
      </div>
    </div>
    <div id="vs-countdown"></div>
  `;
  vsIntroDiv.className = "vs-intro";
  document.body.appendChild(vsIntroDiv);
  let vsCount = $("vs-countdown");
  let steps = [3,2,1,l.fight];
  let i = 0;
  function next() {
    vsCount.textContent = steps[i];
    vsCount.style.opacity = "1";
    if (i < 3) {
      vsCount.animate([{transform:"scale(2)",opacity:0}, {transform:"scale(1)",opacity:1}], {duration:300});
      setTimeout(()=>{
        vsCount.style.opacity = "0";
        setTimeout(()=>{i++;next()},350);
      },650);
    } else {
      vsCount.animate([{transform:"scale(2)",opacity:0}, {transform:"scale(1.2)",opacity:1}], {duration:300});
      setTimeout(()=>{
        if (vsIntroDiv && vsIntroDiv.parentNode) vsIntroDiv.parentNode.removeChild(vsIntroDiv);
        doRealBattleStart();
      },570);
    }
  }
  next();
}

function escapeHTML(s) {
  return (""+s).replace(/[&<>"]/g, t => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[t]));
}

function doRealBattleStart() {
  resetBattleTimer();
  game = createGameState();
  winnerDiv.classList.add("hidden");
  loop();
}

// ==== GAMEPLAY LOGIC ====
const PLAYER_RAD = 36;
const FIELD_MARGIN = 24, ITEM_SIZE = 38;
const FIELD_COLOR = "#4ae";
const PLAYER_COLORS = ["#3ed680","#e44"];
const SPIKE_COLOR = "#5cf";
const SPIKE_OUTLINE = "#166";
const HP_MAX = 5;

const HEAL_ITEM_DELAY_MIN = 4800; // ~80 сек
const HEAL_ITEM_DELAY_MAX = 6000; // ~100 сек
const SPIKE_ITEM_DELAY_MIN = 120; // ~2 сек
const SPIKE_ITEM_DELAY_MAX = 220; // ~3.7 сек
const SPIKE_MAX_ON_FIELD = 3;

function createGameState() {
  const w = canvas.width, h = canvas.height;
  let players = [
    {
      x: w/3, y: h/2, vx: randV(), vy: randV(), hp: HP_MAX, img: playerImgs[0],
      spike: false, spikeAnim: 0, shake:0
    },
    {
      x: w*2/3, y: h/2, vx: -randV(), vy: randV(), hp: HP_MAX, img: playerImgs[1],
      spike: false, spikeAnim: 0, shake:0
    }
  ];
  function randV() { return (Math.random()-0.5)*2.8 + (Math.random()>0.5?2.2:-2.2); }
  const state = {
    w, h,
    players,
    items: [],
    t: 0,
    healDelay: randomHealDelay(),
    spikeDelay: randomSpikeDelay(),
    finished: false,
    winner: null,
  };

  // Первый итем "spike" в центре
  state.items.push({
    type: "spike",
    x: w / 2,
    y: h / 2,
    t: 0
  });

  return state;
}

function randomHealDelay() {
  return Math.floor(HEAL_ITEM_DELAY_MIN + Math.random()*(HEAL_ITEM_DELAY_MAX-HEAL_ITEM_DELAY_MIN));
}
function randomSpikeDelay() {
  return Math.floor(SPIKE_ITEM_DELAY_MIN + Math.random()*(SPIKE_ITEM_DELAY_MAX-SPIKE_ITEM_DELAY_MIN));
}

// ==== GAMELOOP ====
function loop() {
  if (!game) return;
  updateGame();
  drawGame();
  if (!game.finished) animFrame = requestAnimationFrame(loop);
}

function updateGame() {
  const g = game;
  g.t++;
  g.players.forEach((p,i) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x-PLAYER_RAD < FIELD_MARGIN) { 
      p.x = FIELD_MARGIN+PLAYER_RAD; p.vx*=-1;
      playSound("bounce");
    }
    if (p.x+PLAYER_RAD > g.w-FIELD_MARGIN) {
      p.x = g.w-FIELD_MARGIN-PLAYER_RAD; p.vx*=-1;
      playSound("bounce");
    }
    if (p.y-PLAYER_RAD < FIELD_MARGIN) {
      p.y = FIELD_MARGIN+PLAYER_RAD; p.vy*=-1;
      playSound("bounce");
    }
    if (p.y+PLAYER_RAD > g.h-FIELD_MARGIN) {
      p.y = g.h-FIELD_MARGIN-PLAYER_RAD; p.vy*=-1;
      playSound("bounce");
    }
    if (p.spikeAnim>0) p.spikeAnim--;
    if (p.shake>0) p.shake--;
  });

  let p1= g.players[0], p2=g.players[1];
  let dx=p2.x-p1.x,dy=p2.y-p1.y,dist=Math.hypot(dx,dy);
  if (dist<PLAYER_RAD*2) {
    let angle = Math.atan2(dy,dx), overlap = PLAYER_RAD*2-dist+1;
    let nx = Math.cos(angle), ny = Math.sin(angle);
    p1.x -= nx*overlap/2; p1.y -= ny*overlap/2;
    p2.x += nx*overlap/2; p2.y += ny*overlap/2;
    let v1=[p1.vx,p1.vy], v2=[p2.vx,p2.vy];
    let dot1 = v1[0]*nx + v1[1]*ny, dot2 = v2[0]*nx + v2[1]*ny;
    let m1 = dot2, m2 = dot1;
    p1.vx += (m1-dot1)*nx; p1.vy += (m1-dot1)*ny;
    p2.vx += (m2-dot2)*nx; p2.vy += (m2-dot2)*ny;
    triggerShake(0); triggerShake(1); playSound("bounce");
    let hit = false;
    if (p1.spike) { p2.hp--; p1.spike=false; p1.spikeAnim=18; hit = true; }
    if (p2.spike) { p1.hp--; p2.spike=false; p2.spikeAnim=18; hit = true; }
    if (hit) {
      playSound("hit");
      setHP(0, Math.max(0,p1.hp));
      setHP(1, Math.max(0,p2.hp));
    }
    if (p1.hp<=0 || p2.hp<=0) {
      game.finished = true;
      endBattle();
    }
  }

  g.items.forEach((item, idx) => {
    if (item.t<10) item.t++;
    g.players.forEach((p,i) => {
      let d = Math.hypot(p.x-item.x, p.y-item.y);
      if (d<PLAYER_RAD+ITEM_SIZE/2-8 && !item.gone) {
        if (item.type=="heal" && p.hp<HP_MAX) {
          p.hp++; setHP(i, p.hp); playSound("heal");
          item.gone = true;
        }
        if (item.type=="spike" && !p.spike) {
          p.spike=true; p.spikeAnim=24; playSound("spike");
          item.gone = true;
        }
      }
    });
  });
  g.items = g.items.filter(item=>!item.gone || item.t<14);

  // Подсчёт текущих не собранных пил:
  const spikesOnField = g.items.filter(item => item.type==="spike" && !item.gone).length;

  if (!game.finished && --g.healDelay<=0) {
    let x = FIELD_MARGIN+PLAYER_RAD+ITEM_SIZE/2+Math.random()*(g.w-2*(FIELD_MARGIN+PLAYER_RAD+ITEM_SIZE/2));
    let y = FIELD_MARGIN+PLAYER_RAD+ITEM_SIZE/2+Math.random()*(g.h-2*(FIELD_MARGIN+PLAYER_RAD+ITEM_SIZE/2));
    g.items.push({type:"heal",x,y,t:0});
    g.healDelay = randomHealDelay();
  }
  if (!game.finished && spikesOnField < SPIKE_MAX_ON_FIELD && --g.spikeDelay<=0) {
    let x = FIELD_MARGIN+PLAYER_RAD+ITEM_SIZE/2+Math.random()*(g.w-2*(FIELD_MARGIN+PLAYER_RAD+ITEM_SIZE/2));
    let y = FIELD_MARGIN+PLAYER_RAD+ITEM_SIZE/2+Math.random()*(g.h-2*(FIELD_MARGIN+PLAYER_RAD+ITEM_SIZE/2));
    g.items.push({type:"spike",x,y,t:0});
    g.spikeDelay = randomSpikeDelay();
  }
}

function triggerShake(i) {
  game.players[i].shake = 7;
}

function playSound(key) {
  let el = sounds[key];
  if(!el) return;
  el.currentTime = 0; el.play();
}

function drawGame() {
  const g = game, w=g.w, h=g.h;
  ctx.clearRect(0,0,w,h);
  ctx.save();
  ctx.strokeStyle = FIELD_COLOR; ctx.lineWidth=5;
  ctx.shadowColor = "#4ae7"; ctx.shadowBlur=16;
  roundRect(ctx, FIELD_MARGIN/2, FIELD_MARGIN/2, w-FIELD_MARGIN, h-FIELD_MARGIN, 28);
  ctx.stroke();
  ctx.restore();
  g.items.forEach(item=>{
    if (item.t<10) {
      ctx.save();
      ctx.globalAlpha = item.t/10;
      ctx.translate(item.x,item.y);
      ctx.scale(item.t/10,item.t/10);
      drawItem(item.type);
      ctx.restore();
    } else if (!item.gone) {
      ctx.save();
      ctx.translate(item.x,item.y);
      drawItem(item.type);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = 1-(item.t-10)/4;
      ctx.translate(item.x,item.y);
      ctx.scale(1+(item.t-10)/6,1+(item.t-10)/6);
      drawItem(item.type);
      ctx.restore();
      item.t++;
    }
  });
  g.players.forEach((p,i)=>{
    ctx.save();
    if (p.shake>0) {
      ctx.translate(Math.random()*6-3,Math.random()*6-3);
    }
    ctx.beginPath();
    ctx.arc(p.x,p.y,PLAYER_RAD+3,0,2*Math.PI);
    ctx.shadowColor = PLAYER_COLORS[i]+"bb";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = PLAYER_COLORS[i];
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.closePath();
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x,p.y,PLAYER_RAD,0,2*Math.PI);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(p.img, p.x-PLAYER_RAD, p.y-PLAYER_RAD, PLAYER_RAD*2, PLAYER_RAD*2);
    ctx.restore();

    if (p.spike||p.spikeAnim>0) {
      drawSpikes(p.x,p.y,PLAYER_RAD,p.spikeAnim);
    }
    if (p.spikeAnim>12) {
      ctx.save();
      ctx.globalAlpha = (p.spikeAnim-12)/12*0.6;
      ctx.beginPath();
      ctx.arc(p.x,p.y,PLAYER_RAD+10,0,2*Math.PI);
      ctx.fillStyle="#fff";
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  });
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function drawItem(type) {
  if (type=="heal") {
    ctx.save();
    ctx.scale(1.1,1.1);
    ctx.beginPath();
    ctx.moveTo(0,12);
    ctx.bezierCurveTo(-18,-10,-22,18,0,28);
    ctx.bezierCurveTo(22,18,18,-10,0,12);
    ctx.closePath();
    ctx.fillStyle = "#e44";
    ctx.shadowColor = "#fff7"; ctx.shadowBlur=10;
    ctx.fill();
    ctx.shadowBlur=0;
    ctx.lineWidth=3; ctx.strokeStyle="#fff8";
    ctx.stroke();
    ctx.restore();
  } else if (type=="spike") {
    ctx.save();
    let N = 12, r1 = ITEM_SIZE/2-5, r2 = ITEM_SIZE/2-2;
    for(let i=0;i<N;i++){
      ctx.save();
      ctx.rotate(i*Math.PI*2/N);
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(-7,r1);
      ctx.lineTo(0,r2);
      ctx.lineTo(7,r1);
      ctx.closePath();
      ctx.fillStyle=SPIKE_COLOR;
      ctx.strokeStyle=SPIKE_OUTLINE;
      ctx.lineWidth=2;
      ctx.shadowColor="#fff2"; ctx.shadowBlur=4;
      ctx.fill(); ctx.shadowBlur=0;
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0,0,ITEM_SIZE/5,0,2*Math.PI);
    ctx.fillStyle="#2ad9fa";
    ctx.shadowColor="#fff5"; ctx.shadowBlur=8;
    ctx.fill();
    ctx.shadowBlur=0;
    ctx.lineWidth=1.5; ctx.strokeStyle="#fff8";
    ctx.stroke();
    ctx.restore();
  }
}

function drawSpikes(x,y,r,anim) {
  ctx.save();
  ctx.translate(x,y);
  let a = (anim||0)*0.13;
  let N = 12, r1 = r+8, r2 = r+22;
  for(let i=0;i<N;i++){
    ctx.save();
    ctx.rotate(a+i*Math.PI*2/N);
    ctx.beginPath();
    ctx.moveTo(0,r1);
    ctx.lineTo(-6,r2);
    ctx.lineTo(6,r2);
    ctx.closePath();
    ctx.fillStyle=SPIKE_COLOR;
    ctx.strokeStyle=SPIKE_OUTLINE;
    ctx.lineWidth=1;
    ctx.shadowColor="#fff3"; ctx.shadowBlur=4;
    ctx.fill(); ctx.shadowBlur=0;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function endBattle() {
  cancelAnimationFrame(animFrame);
  stopBattleTimer();
  let p1=game.players[0],p2=game.players[1];
  let msg = `<div>${l.winner} <span style="color:${p1.hp>p2.hp?PLAYER_COLORS[0]:PLAYER_COLORS[1]};">${p1.hp>p2.hp?playerNames[0]:playerNames[1]}</span></div>
  <div style="font-size:1.2em;font-weight:600;margin-top:6px;">${l.over}</div>
  <div style="margin-top:0.7em; font-size:1.1em; color:#fff">${l.time}: ${battleTimer.textContent.split(':').slice(1).join(':')}</div>`;
  winnerDiv.innerHTML = msg;
  winnerDiv.classList.remove("hidden");
  setTimeout(()=>location.reload(), 4200);
}