<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import GameStats from './GameStats.vue';

// --- Scroll mobile ---
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
  else darts.value[index] = value; // number 1-20 or "Bull’s eye"
  if(navigator.vibrate) navigator.vibrate(30);
}

// --- Check active button ---
function isActive(dartValue, btn){
  if(currentTarget.value==="double"||currentTarget.value==="triple"){
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

// --- Current turn score (for display) ---
const currentTurnScore = computed(()=>{
  let score = 0;
  const base = targetValue(currentTarget.value);
  darts.value.forEach(d => {
    if(d===0) score+=0;
    else if(d===1) score+=base;
    else if(d===2) score+=base*2;
    else if(d===3) score+=base*3;
    else if(d==="Bull’s eye"){
      if(currentTarget.value==="double") score+=50;
      else if(currentTarget.value==="triple") score+=75;
      else score+=25;
    } else {
      if(currentTarget.value==="double") score += d*2;
      else if(currentTarget.value==="triple") score += d*3;
      else score += d;
    }
  });

  // Affichage seulement : si toutes les fléchettes sont miss, on montre la moitié
  const allMiss = darts.value.every(d => d===0);
  if(allMiss && score>0) score = Math.ceil(score/2);

  return score;
});

// --- Submit turn ---
function submitTurn(){
  if(navigator.vibrate) navigator.vibrate(30);

  const player = props.players[currentPlayerIndex.value];
  player.scores.push([...darts.value]);

  // Calcul du score du tour
  let turnScore = 0;
  const base = targetValue(currentTarget.value);
  darts.value.forEach(d => {
    if(d===0) turnScore += 0;
    else if(d===1) turnScore += base;
    else if(d===2) turnScore += base*2;
    else if(d===3) turnScore += base*3;
    else if(d==="Bull’s eye"){
      if(currentTarget.value==="double") turnScore+=50;
      else if(currentTarget.value==="triple") turnScore+=75;
      else turnScore+=25;
    } else {
      if(currentTarget.value==="double") turnScore += d*2;
      else if(currentTarget.value==="triple") turnScore += d*3;
      else turnScore += d;
    }
  });

  // Split rule : si toutes les fléchettes du tour sont Miss, diviser le total du joueur
  const allMiss = darts.value.every(d => d===0);
  if(allMiss && player.totalScore>0){
    player.totalScore = Math.ceil(player.totalScore/2);
  } else {
    player.totalScore += turnScore;
  }

  darts.value = [0,0,0];

  if(currentPlayerIndex.value<props.players.length-1) currentPlayerIndex.value++;
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
  const lastTurn = player.scores.pop();
  if(lastTurn){
    let score=0;
    const base = targetValue(currentTarget.value);
    lastTurn.forEach(d => {
      if(d===0) score+=0;
      else if(d===1) score+=base;
      else if(d===2) score+=base*2;
      else if(d===3) score+=base*3;
      else if(d==="Bull’s eye"){
        if(currentTarget.value==="double") score+=50;
        else if(currentTarget.value==="triple") score+=75;
        else score+=25;
      } else {
        if(currentTarget.value==="double") score += d*2;
        else if(currentTarget.value==="triple") score += d*3;
        else score += d;
      }
    });
    const allMiss = lastTurn.every(d => d===0);
    if(allMiss && player.totalScore>0) player.totalScore = Math.ceil(player.totalScore/2);
    else player.totalScore -= score;
  }
  darts.value=[0,0,0];
}

// --- Curses ---
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
        <div class="buttons" :class="{'double-triple-grid': currentTarget==='double'||currentTarget==='triple'}">
          <button
            v-for="btn in dartButtonsForTarget(currentTarget)"
            :key="btn"
            class="dart-button"
            :class="[isActive(darts[index],btn)?'active':'',(currentTarget==='double'||currentTarget==='triple')?'small-button':'']"
            @click="setDart(index,btn)">
            {{btn}}
          </button>
        </div>
      </div>

      <p id="submitScoreContainer">
        <button @click="countCurses" class="curseCounter">🤬 ! {{props.players[currentPlayerIndex].curses}}</button>
        <button @click="submitTurn" class="validate">Valider ce tour (+{{currentTurnScore}} pts)</button>
      </p>

      <p><button @click="undoTurn" class="undo-button">&#8592;</button></p>
    </div>

    <div v-else>
      <GameStats :sortedPlayers="sortedPlayers" :stats="stats" :role="props.role" @view-scores="$emit('view-scores')"/>
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
.dart-button{height:70px;font-size:1.2rem;display:flex;align-items:center;justify-content:center;}
.small-button{height:36px;min-width:28px;font-size:0.75rem;padding:2px 2px;}
.double-triple-grid{display:grid;grid-template-columns:repeat(11,minmax(28px,1fr));gap:4px;justify-items:center;margin-bottom:4px;}
.buttons{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}
button.active{background-color:var(--primary,#007BFF);color:white;font-weight:bold;}
#submitScoreContainer{display:flex;flex-direction:row;justify-content:space-evenly;margin-top:1rem;}
.undo-button{margin-top:1rem;margin-left:12px;background-color:#ccc;color:#333;font-weight:normal;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;}
.undo-button:hover{background-color:#bbb;}
.validate{background-color:rgba(233,30,99);}
</style>
