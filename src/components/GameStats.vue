<template>
  <div>
    <h2>Partie terminée</h2>
    <ul class="final-scores">
      <li
        v-for="(player, index) in sortedPlayers"
        :key="player.name"
        class="final-score-item"
      >
        <div class="final-player-name-above">
          <span v-if="index===0">🥇</span>
          <span v-else-if="index===1">🥈</span>
          <span v-else-if="index===2">🥉</span>
          {{ player.name }}
        </div>

        <span class="final-player-score">{{ computeStats(player).totalScore }} pts</span>
        <img :src="player.avatar" alt="avatar" class="final-avatar-large" />

        <div class="final-player-info">
          <div class="final-player-stats">
            <span class="stat-badge">Hits : {{ computeStats(player).hits }}</span>
            <span class="stat-badge">Miss : {{ computeStats(player).miss }}</span>
            <span class="stat-badge">Single : {{ computeStats(player).single }}</span>
            <span class="stat-badge">Double : {{ computeStats(player).double }}</span>
            <span class="stat-badge">Triple : {{ computeStats(player).triple }}</span>
            <span class="stat-badge awsome-badge" v-if="computeStats(player).split>0">
              SPLIT : {{ computeStats(player).split }}
            </span>
          </div>
        </div>
      </li>
    </ul>
    <div v-if="role==='admin'" class="action-buttons">
      <a href="#" @click.prevent="$emit('view-scores')" class="link-button">Voir le classement</a>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  sortedPlayers: Array,
  role: String
});

function targetValue(target) {
  if(target==="Bull’s eye") return 25;
  if(!isNaN(Number(target))) return Number(target);
  return 0;
}

function computeStats(player) {
  let hits=0, miss=0, single=0, doubleCount=0, triple=0, split=0, totalScore=0;

  player.scores.forEach(turnObj => {
    if(!turnObj || !turnObj.darts) return; // sécurité
    const { darts, target } = turnObj;
    const base = targetValue(target);
    const allMiss = darts.every(d=>d===0);
    if(allMiss) split++;

    darts.forEach(d => {
      // stats hits/miss
      if(d===0) miss++;
      else {
        hits++;
        if(d===1) single++;
        else if(d===2) doubleCount++;
        else if(d===3) triple++;
        else if(d==="Bull’s eye") hits++;
        else {
          if(target==="double") doubleCount++;
          else if(target==="triple") triple++;
          else single++;
        }
      }

      // score calcul
      if(d===0) totalScore+=0;
      else if(target==="double") totalScore += (d==="Bull’s eye"?50:d*2);
      else if(target==="triple") totalScore += (d==="Bull’s eye"?75:d*3);
      else if(d===1) totalScore+=base;
      else if(d===2) totalScore+=base*2;
      else if(d===3) totalScore+=base*3;
      else if(d==="Bull’s eye") totalScore+=25;
      else totalScore+=d;
    });

    // gérer SPLIT
    if(allMiss && totalScore>0) totalScore=Math.ceil(totalScore/2);
  });

  return { totalScore, hits, miss, single, double: doubleCount, triple, split };
}
</script>

<style scoped>
/* ton style reste inchangé */
.final-score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.final-player-name-above {
  font-weight: bold;
  font-size: 1.3rem;
  margin-bottom: 4px;
  text-align: center;
}

.final-player-info {
  width: 100%;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.final-player-stats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.final-avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-bottom: 8px;
}

.final-player-score {
  font-style: italic;
  font-weight: bold;
  text-align: center;
  margin-top: 8px;
  font-size: 1.1rem;
}

.stat-badge {
  display: inline-block;
  padding: 3px 8px;
  margin: 2px 4px;
  border: 1px solid #ccc;
  border-radius: 12px;
  background-color: #fafafa;
  font-size: 0.75rem;
  color: #333;
  box-shadow: 1px 1px 2px rgba(0,0,0,0.04);
}

.awsome-badge {
  background-color: #ffeb3b;
  font-weight: bold;
}
</style>
