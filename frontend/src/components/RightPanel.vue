<script setup lang="ts">
import { ref } from 'vue'
import FingerprintList from '@/components/right/FingerprintList.vue'
import FingerprintSection from '@/components/right/FingerprintSection.vue'
import StatisticsPanel from '@/components/right/StatisticsPanel.vue'

const showStatistics = ref(false)

const toggleStatisticsPanel = () => {
  showStatistics.value = !showStatistics.value
}
</script>

<template>
  <div class="panel">
    <div class="flex flex-col gap-2">
      <div class="flex justify-between items-center"></div>
      <h2 class="text-xl font-bold">Fingerprints</h2>

      <FingerprintSection />
      <button
        @click="toggleStatisticsPanel"
        class="btn btn-sm btn-primary"
        :class="{ 'btn-active': showStatistics }"
        title="Show Statistics Panel"
      >
        Statistics
      </button>
      <StatisticsPanel v-if="showStatistics" @close="showStatistics = false" />
      <FingerprintList />
    </div>
  </div>
</template>

<style scoped>
.panel {
  padding: 1rem;
  background: #f1f1f1;
}

.fingerprint-list li.selected {
  background-color: #d1e3ff;
  font-weight: bold;
}
</style>
