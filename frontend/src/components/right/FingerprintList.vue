<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { useDrillDownStore } from '@/stores/drillDownStore'
import { computed } from 'vue'

import FingerprintItem from './FingerprintItem.vue'

const fingerprintStore = useFingerprintStore()
const { fingerprints } = storeToRefs(fingerprintStore)

const drillDownStore = useDrillDownStore()
const { currentParentId, currentViewLevel } = storeToRefs(drillDownStore)

const topLevelFingerprints = computed(() => {
  return fingerprints.value.filter((fp) => fp.parentId === currentParentId.value)
})
</script>

<template>
  <div class="fingerprint-list">
    <div class="fingerprint-header">
      <h2 class="text-lg font-semibold mb-2">Subsets</h2>
      <div v-if="currentParentId" class="drilled-down-indicator">
        Drilled down level {{ currentViewLevel }}
      </div>
    </div>

    <div v-if="topLevelFingerprints.length === 0" class="text-sm text-gray-500">
      No subsets created {{ currentParentId ? 'in this view' : 'yet' }}.
    </div>

    <ul v-else class="space-y-1 fingerprint-tree">
      <!-- Use the recursive component -->
      <FingerprintItem
        v-for="fp in topLevelFingerprints"
        :key="fp.id"
        :fingerprint="fp"
        :level="0"
      />
    </ul>
  </div>
</template>
<style scoped>
.fingerprint-list {
  padding: 0.75rem;
  background: #d1d1d1;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.fingerprint-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.drilled-down-indicator {
  font-size: 0.8em;
  color: #888;
  padding: 2px 6px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}
</style>
