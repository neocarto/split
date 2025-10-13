<template>


  <div class="scores-page">{{ stats }}</div>
</template>

  
  <script setup>
   import { ref, onMounted } from 'vue';
   import { supabase } from '../supabase';
   const stats = ref([]);


   async function fetchScores() {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('score', { ascending: false });
  
    if (error) {
      console.error('Erreur de récupération des scores :', error);
      return;
    }
    if (!data.length) return;
    stats.value = data


  }

  onMounted(() => {
    fetchScores();
  });


  </script>
  
  <style scoped>
 
  </style>
  