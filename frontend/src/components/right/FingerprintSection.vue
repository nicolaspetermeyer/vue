<script setup lang="ts">
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { usePointFilterStore } from '@/stores/pointFilterStore'
import { useAttributeFilterStore } from '@/stores/attributeFilterStore'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { SelectionMode } from '@/pixi/interactions/controllers/SelectionController'

const fingerprintStore = useFingerprintStore()
const { fingerprints } = storeToRefs(fingerprintStore)
const { addFingerprint, removeFingerprint } = fingerprintStore

const projectionStore = useProjectionStore()
const { projectionInstance } = storeToRefs(projectionStore)

const pointFilterStore = usePointFilterStore()
const { activePointFilter } = storeToRefs(pointFilterStore)

const currentMode = ref<SelectionMode>(SelectionMode.RECTANGLE)
const selectionModeText = computed(() =>
  currentMode.value === SelectionMode.RECTANGLE ? 'Rectangle Selection' : 'Lasso Selection',
)

const hasactivePointFilters = computed(() => {
  return activePointFilter.value.category && activePointFilter.value.values.length > 0
})

const filterDescription = computed(() => {
  if (!activePointFilter.value.category || activePointFilter.value.values.length === 0) {
    return ''
  }

  const values = activePointFilter.value.values

  if (values.length === 1) {
    return `Fingerprint = ${values[0]}`
  } else if (values.length <= 3) {
    return `Fingerprint = ${values.join(', ')}`
  } else {
    return `Fingerprint (${values.length} values)`
  }
})

function clear() {
  for (const fingerprint of fingerprints.value) {
    removeFingerprint(fingerprint.id, projectionInstance.value)
  }
}

const toggleSelectionMode = () => {
  if (projectionInstance.value) {
    projectionInstance.value.toggleSelectionMode()
    currentMode.value =
      currentMode.value === SelectionMode.RECTANGLE ? SelectionMode.LASSO : SelectionMode.RECTANGLE
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
      <span v-if="hasactivePointFilters">
        <span class="font-medium">Filter applied:</span> {{ filterDescription }}
      </span>
      <span v-else> If no selection, will create fingerprint from all points. </span>
    </div>

    <div class="flex items-center space-x-2 mb-2">
      <button @click="clear()" class="btn btn-sm btn-primary flex-1">Clear Fingerprints</button>
    </div>
    <button @click="toggleSelectionMode" class="btn btn-sm btn-primary flex-1">
      <a>{{ selectionModeText }}</a>
    </button>
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
