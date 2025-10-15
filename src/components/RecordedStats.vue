<template>
  <div class="scores-page">
    <h1><ins>Fiches individuelles</ins></h1>

    <div v-for="(player, index) in stats" :key="index" class="player-card">
      <h2 class="player-name">
        <span class="medal" :class="'medal-' + index">{{ getMedal(index) }}</span>
        {{ player.name }}
      </h2>
      <div class="games-played">Parties jouées : {{ player.games_played }}</div>
      <hr/>
      <ul class="score-stats">
        <li>⭐ Score moyen : <span class="emphase">{{ player.mean_score }}</span> pts</li>
        <li>💥 Split moyens par partie : <span class="emphase">{{ player.mean_splits }}</span></li>
        <li>👍 Meilleur score : {{ player.best_score }} pts</li>
        <li>👎 Plus mauvais score : {{ player.worst_score }} pts</li>
        <li>🎯 Flèches réussies par partie : {{ player.mean_hits }}</li>
        <li>❌ Flèches ratées par partie : {{ player.mean_fails }}</li>
      </ul>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';

const stats = ref([]);

function getMedal(index) {
  switch(index) {
    case 0: return '🥇';
    case 1: return '🥈';
    case 2: return '🥉';
    case 3: return '🍫';
    default: return '';
  }
}

function processStats(data) {
  const grouped = {};
  data.forEach(d => {
    if (!grouped[d.name]) grouped[d.name] = { name: d.name, scores: [], hits: [] };
    grouped[d.name].scores.push(d.score);
    grouped[d.name].hits.push(JSON.parse(d.hits));
  });

  const players = Object.values(grouped).map(player => {
    const totalScore = player.scores.reduce((a, b) => a + b, 0);
    const meanScore = (totalScore / player.scores.length).toFixed(1);
    const bestScore = Math.max(...player.scores);
    const worstScore = Math.min(...player.scores);

    // Nombre de parties
    const gamesPlayed = player.scores.length;

    // Splits = coups où somme des 3 flèches = 0
    const splitsPerPartie = player.hits.map(partie =>
      partie.filter(hit => hit.darts.reduce((a, b) => a + b, 0) === 0).length
    );
    const meanSplits = (splitsPerPartie.reduce((a, b) => a + b, 0) / splitsPerPartie.length).toFixed(1);

    // Hits = flèches > 0, Fails = flèches = 0
    const hitsPerPartie = player.hits.map(partie =>
      partie.reduce((acc, hit) => acc + hit.darts.filter(d => d > 0).length, 0)
    );
    const failsPerPartie = player.hits.map(partie =>
      partie.reduce((acc, hit) => acc + hit.darts.filter(d => d === 0).length, 0)
    );

    const meanHits = (hitsPerPartie.reduce((a, b) => a + b, 0) / hitsPerPartie.length).toFixed(1);
    const meanFails = (failsPerPartie.reduce((a, b) => a + b, 0) / failsPerPartie.length).toFixed(1);

    return {
      ...player,
      mean_score: Number(meanScore),
      best_score: bestScore,
      worst_score: worstScore,
      mean_splits: meanSplits,
      mean_hits: meanHits,
      mean_fails: meanFails,
      games_played: gamesPlayed
    };
  });

  // Tri par score moyen décroissant
  players.sort((a, b) => b.mean_score - a.mean_score);
  return players;
}

async function fetchScores() {
  const { data, error } = await supabase.from('scores').select('*');
  if (error) return console.error('Erreur :', error);
  if (!data.length) return;
  stats.value = processStats(data);
}

onMounted(() => fetchScores());
</script>

<style scoped>
.scores-page {  
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 900px;
  margin: 1.5rem auto;
  padding: 1rem 1.5rem;
  color: #13171F;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  text-align: center;
  min-height: 100vh;
  box-sizing: border-box;
}

.player-card {
  background-color: white;          
  color: #13171F;                   
  border: 1px solid rgba(0,0,0,0.1); 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  padding: 20px 24px;
  width: 100%;
  max-width: 480px;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  text-align: left;
  margin-bottom: 2rem;
}

.player-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.player-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
  color: #e6a400; 
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.games-played {
  font-size: 0.75rem;
  color: #878787;       /* gris */
  text-align: center;
  margin-bottom: 1rem;
}

.score-stats {
  list-style-type: none;
  padding-left: 0;
  font-size: 0.95rem;
}

.score-stats li {
  margin-bottom: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.emphase {
  font-weight: 700;
  text-decoration: underline;
  color:#e6a400; 
}

.medal {
  font-size: 1.3rem;
}
</style>
