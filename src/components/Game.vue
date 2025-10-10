<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import GameStats from './GameStats.vue';

// --- Scroll mobile (global page reste fixe) ---
let startY = 0;
function onTouchStart(e) { startY = e.touches[0].clientY; }
function onTouchMove(e) {
  const currentY = e.touches[0].clientY;
  if (window.scrollY === 0 && currentY > startY) e.preventDefault();
}
onMounted(() => {
  window.addEventListener('touchstart', onTouchStart, { passive: false });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
});
onBeforeUnmount(() => {
  window.removeEventListener('touchstart', onTouchStart);
  window.removeEventListener('touchmove', onTouchMove);
});

// --- Props ---
const props = defineProps({
  players: Array,
  role: String
});

// --- SPLIT visual effect ---
const showSplit = ref(false);
function triggerSplit() {
  showSplit.value = true;
  setTimeout(() => (showSplit.value = false), 1200);
}

// --- Rounds & players ---
const roundsTargets = ["15","16","double","17","18","triple","19","20","Bull’s eye"];
const currentRoundIndex = ref(0);
const currentPlayerIndex = ref(0);
const darts = ref([0,0,0]);

props.players.forEach(player => {
  if (!player.scores) player.scores = [];
  if (!player.curses) player.curses = 0;
  if (player.totalScore === undefined) player.totalScore = 0;
});

// --- Helper for target value ---
function targetValue(target) {
  if(target==="Bull’s eye") return 25;
  if(!isNaN(Number(target))) return Number(target);
  return 0;
}

// --- Dart buttons ---
function dartButtonsForTarget(target) {
  if (target === "double" || target === "triple") {
    const buttons = Array.from({ length: 21 }, (_, i) => i===0 ? "Miss" : i);
    buttons.push("Bull’s eye");
    return buttons;
  }
  return ["Miss","Single","Double","Triple"];
}

// --- Set dart value ---
function setDart(index, value){
  if(value==="Miss") darts.value[index] = 0;
  else if(value==="Single") darts.value[index] = 1;
  else if(value==="Double") darts.value[index] = 2;
  else if(value==="Triple") darts.value[index] = 3;
  else darts.value[index] = value;
  if(navigator.vibrate) navigator.vibrate(30);
}

// --- Check active button ---
function isActive(dartValue, btn){
  if(currentTarget.value==="double"||currentTarget.value==="triple"){
    if(btn==="Miss") return dartValue===0;
    return dartValue===btn;
  } else {
    if(btn==="Miss") return dartValue===0;
    if(btn==="Single") return dartValue===1;
    if(btn==="Double") return dartValue===2;
    if(btn==="Triple") return dartValue===3;
  }
  return false;
}

// --- Current target ---
const currentTarget = computed(()=>roundsTargets[currentRoundIndex.value]);

// --- Compute turn score ---
function computeTurnScore(dartsArr, target){
  let score=0;
  const base = targetValue(target);

  dartsArr.forEach(d => {
    if(d===0){ 
      score += 0; 
    }
    else if(target === "double"){ 
      if(d === "Bull’s eye") score += 50;
      else score += d*2;
    }
    else if(target === "triple"){ 
      if(d === "Bull’s eye") score += 75;
      else score += d*3;
    }
    else { 
      if(d === 1) score += base;
      else if(d === 2) score += base*2;
      else if(d === 3) score += base*3;
      else if(d === "Bull’s eye") score += 25;
      else score += d;
    }
  });

  return score;
}

const currentTurnScore = computed(()=> computeTurnScore(darts.value, currentTarget.value));

// --- Submit turn ---
function submitTurn(){
  if(navigator.vibrate) navigator.vibrate(30);
  const player = props.players[currentPlayerIndex.value];

  player.scores.push({
    darts: [...darts.value],
    target: currentTarget.value
  });

  const allMiss = darts.value.every(d=>d===0);
  let turnScore = computeTurnScore(darts.value, currentTarget.value);
  if(allMiss && player.totalScore>0){
    player.totalScore = Math.ceil(player.totalScore/2);
    triggerSplit();
  } else {
    player.totalScore += turnScore;
  }

  darts.value = [0,0,0];
  if(currentPlayerIndex.value < props.players.length-1) currentPlayerIndex.value++;
  else{
    currentPlayerIndex.value=0;
    currentRoundIndex.value++;
  }
}

// --- Undo turn ---
function undoTurn(){
  if(currentRoundIndex.value===0 && currentPlayerIndex.value===0) return;

  let playerIndex = currentPlayerIndex.value;
  let roundIndex = currentRoundIndex.value;
  if(playerIndex===0){ roundIndex--; playerIndex=props.players.length-1;}
  else playerIndex--;

  currentPlayerIndex.value=playerIndex;
  currentRoundIndex.value=roundIndex;

  const player = props.players[playerIndex];
  player.scores.pop();
  player.totalScore = player.scores.reduce((acc, turn) => acc + computeTurnScore(turn.darts, turn.target), 0);

  darts.value=[0,0,0];
}

// --- Count curses ---
function countCurses(){
  props.players[currentPlayerIndex.value].curses++;
}

// --- Computed ---
const gameOver = computed(()=>currentRoundIndex.value>=roundsTargets.length);
const topScore = computed(()=>Math.max(...props.players.map(p=>p.totalScore)));
const sortedPlayers = computed(()=>[...props.players].sort((a,b)=>b.totalScore-a.totalScore));
</script>

<template>
  <p v-if="role==='admin'" style="font-size:0.8rem;color:gray;text-align:center;margin-bottom:-10px;">
    Partie officielle et enregistrée
  </p>

  <!-- SPLIT overlay -->
  <transition name="fade">
    <div v-if="showSplit" class="split-overlay">
      <div class="split-text">SPLIT 💥</div>
    </div>
  </transition>

  <div class="container">
    <div v-if="!gameOver">
      <h2 class="round-circle">{{currentTarget}}</h2>
      <h1>{{props.players[currentPlayerIndex].name}}</h1>

      <div class="avatar-lineup">
        <div v-for="(player,index) in props.players" :key="player.name" class="avatar-wrapper">
          <img :src="player.avatar" :alt="player.name" class="avatar" :class="{current: index===currentPlayerIndex}"/>
          <div class="score-badge" :class="{ 'bestscore-badge': player.totalScore===topScore && topScore!==0 }">
            {{player.totalScore}}
          </div>
        </div>
      </div>

      <hr/>

      <div v-for="(dart,index) in darts" :key="index" class="dart-controls">
        <!-- Carousel horizontal -->
        <div class="carousel-wrapper">
          <div class="carousel">
            <button
              v-for="btn in dartButtonsForTarget(currentTarget)"
              :key="btn"
              class="dart-button"
              :class="[isActive(darts[index],btn)?'active':'']"
              @click="setDart(index,btn)">
              {{btn}}
            </button>
          </div>
        </div>
      </div>

      <p id="submitScoreContainer">
        <button @click="countCurses" class="curseCounter">🤬 ! {{props.players[currentPlayerIndex].curses}}</button>
        <button @click="submitTurn" class="validate">
          <template v-if="darts.every(d => d === 0)">Valider ce tour (SPLIT)</template>
          <template v-else>Valider ce tour (+{{ currentTurnScore }} pts)</template>
        </button>
      </p>

      <p><button @click="undoTurn" class="undo-button">&#8592;</button></p>
    </div>

    <div v-else>
      <GameStats :sortedPlayers="sortedPlayers" :role="props.role" @view-scores="$emit('view-scores')" @replay="$emit('replay')"/>
    </div>
  </div>
</template>

<style scoped>
html,body{overscroll-behavior-y:contain;overflow:hidden;height:100%;margin:0;padding:0;}
.container{display:flex;flex-direction:column;align-items:center;padding:20px;text-align:center;box-sizing:border-box;}
.avatar-lineup{display:inline-flex;flex-wrap:wrap;gap:8px;max-width:400px;padding:8px 0;justify-content:center;}
.avatar-wrapper{position:relative;display:inline-block;margin-right:12px;}
.avatar{width:60px;height:60px;border-radius:50%;object-fit:cover;filter:grayscale(30%);opacity:0.6;transition:all 0.3s ease;}
.avatar.current{filter:none;opacity:1;border:3px solid rgba(233,30,99);transform:scale(1.2);z-index:1;}
.score-badge{position:absolute;bottom:-10px;right:-10px;background-color:#2196f3;color:white;padding:4px 9px;border-radius:14px;font-size:0.75rem;font-weight:600;white-space:nowrap;user-select:none;box-shadow:0 0 5px rgba(0,0,0,0.3);}
.bestscore-badge{background-color:#e91e63;font-weight:bold;}
.dart-controls{margin:0.5rem 0;display:flex;justify-content:center;align-items:center;gap:6px;}
.carousel-wrapper{width:100%; overflow-x:auto;}
.carousel{display:inline-flex;gap:6px;white-space:nowrap;scroll-behavior:smooth;}
.dart-button{height:70px;min-width:50px;font-size:1.2rem;flex-shrink:0;}
button.active{background-color:var(--primary,#007BFF);color:white;font-weight:bold;}
#submitScoreContainer{display:flex;flex-direction:row;justify-content:space-evenly;margin-top:1rem;}
.undo-button{margin-top:1rem;margin-left:12px;background-color:#ccc;color:#333;font-weight:normal;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;}
.undo-button:hover{background-color:#bbb;}
.validate{background-color:rgba(233,30,99);}

/* --- SPLIT animation --- */
.split-overlay{
  position:fixed;
  top:0;left:0;width:100%;height:100%;
  display:flex;justify-content:center;align-items:center;
  background:rgba(255,0,0,0.1);
  z-index:999;
}
.split-text{
  font-size:4rem;
  font-weight:900;
  color:#e91e63;
  text-shadow:0 0 20px rgba(255,0,0,0.7);
  animation:shake 0.3s infinite alternate;
}
@keyframes shake{
  from{transform:translateX(-10px);}
  to{transform:translateX(10px);}
}
.fade-enter-active,.fade-leave-active{transition:opacity 0.5s;}
.fade-enter-from,.fade-leave-to{opacity:0;}
</style>
