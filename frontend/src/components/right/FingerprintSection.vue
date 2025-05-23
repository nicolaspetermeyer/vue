<script setup lang="ts">
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const fingerprintStore = useFingerprintStore()

const { fingerprints } = storeToRefs(fingerprintStore)

const projectionStore = useProjectionStore()
const { projectionInstance, activeFilter } = storeToRefs(projectionStore)
const { addFingerprint, removeFingerprint } = fingerprintStore

const hasActiveFilters = computed(() => {
  return activeFilter.value.category && activeFilter.value.values.length > 0
})

const filterDescription = computed(() => {
  if (!activeFilter.value.category || activeFilter.value.values.length === 0) {
    return ''
  }

  const category = activeFilter.value.category
  const values = activeFilter.value.values

  if (values.length === 1) {
    return `${category} = ${values[0]}`
  } else if (values.length <= 3) {
    return `${category} = ${values.join(', ')}`
  } else {
    return `${category} (${values.length} values)`
  }
})

function clear() {
  for (const fingerprint of fingerprints.value) {
    removeFingerprint(fingerprint.id, projectionInstance.value)
  }
}
</script>

<template>
  <section class="section">
    <h3 class="section-title">Actions</h3>
    <div class="flex items-center space-x-2 mb-2">
      <button @click="addFingerprint()" class="btn btn-sm btn-primary flex-1">
        Create Fingerprint
      </button>
    </div>

    <div class="text-xs text-gray-500">
      <span v-if="hasActiveFilters">
        <span class="font-medium">Filter applied:</span> {{ filterDescription }}
      </span>
      <span v-else> If no selection, will create fingerprint from all points. </span>
    </div>

    <div class="flex items-center space-x-2 mb-2">
      <button @click="clear()" class="btn btn-sm btn-primary flex-1">Clear Fingerprints</button>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}
</style>
