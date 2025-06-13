<script setup lang="ts">
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { usePointFilterStore } from '@/stores/pointFilterStore'
import { projectionService } from '@/services/projectionService'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import StatisticsPanel from './StatisticsPanel.vue'
import GlyphIntroductionModal from './GlyphIntroductionModal.vue'

const fingerprintStore = useFingerprintStore()
const { fingerprints } = storeToRefs(fingerprintStore)
const { addFingerprint, removeFingerprint } = fingerprintStore

const projectionStore = useProjectionStore()
const { projectionInstance } = storeToRefs(projectionStore)

const pointFilterStore = usePointFilterStore()
const { activePointFilter } = storeToRefs(pointFilterStore)

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

const showStatistics = ref(false)
const showGlyphIntro = ref(false)

const toggleStatisticsPanel = () => {
  showStatistics.value = !showStatistics.value
}

const toggleGlyphIntro = () => {
  showGlyphIntro.value = !showGlyphIntro.value
}

const hasSelectedFingerprints = computed(() => {
  return fingerprintStore.selectedFingerprints.length > 1
})

const combineFingerprints = () => {
  if (!hasSelectedFingerprints.value) return

  const selectedFingerprints = fingerprintStore.selectedFingerprints

  // Create a Set to track unique point IDs
  const uniquePointIds = new Set<string>()
  const combinedPoints = []

  // Collect all points from selected fingerprints, avoiding duplicates
  for (const fingerprint of selectedFingerprints) {
    for (const point of fingerprint.projectedPoints) {
      if (!uniquePointIds.has(point.id)) {
        uniquePointIds.add(point.id)
        combinedPoints.push(point)
      }
    }
  }

  // Create a new fingerprint with the combined points
  if (combinedPoints.length > 0) {
    const fpNames = selectedFingerprints.map((fp) => fp.name).join(' + ')
    const name = fpNames.length > 30 ? fpNames.substring(0, 27) + '...' : fpNames
    fingerprintStore.setSelection(combinedPoints)
    fingerprintStore.addFingerprint(name)
  }
}

// Add these for K-means clustering
const isClusteringLoading = ref(false)
const numClusters = ref(3)

// Function to generate clusters
async function generateClusters() {
  isClusteringLoading.value = true
  try {
    await projectionService.createClusterFingerprints(numClusters.value)
  } catch (error) {
    console.error('Error generating clusters:', error)
  } finally {
    isClusteringLoading.value = false
  }
}
</script>

<template>
  <section class="section">
    <h3 class="section-title">Actions</h3>
    <div class="flex space-x-2 mb-1">
      <button @click="addFingerprint()" class="btn btn-sm btn-primary flex-1">Create Subset</button>

      <button @click="clear()" class="btn btn-sm btn-primary flex-1">Delete Subsets</button>
    </div>
    <div class="text-xs text-black-500">
      <span v-if="hasactivePointFilters">
        <span class="font-medium">Filter applied:</span> {{ filterDescription }}
      </span>
      <span v-else> If no selection, creates subset from all points. </span>
    </div>
    <!-- Fingerprint Combination Button -->
    <div class="flex space-x-2 mb-1">
      <button
        @click="combineFingerprints"
        class="btn btn-sm btn-primary flex-1 mt-2"
        :disabled="!hasSelectedFingerprints"
        title="Combine selected fingerprints into a new one"
      >
        Combine Subsets
      </button>
    </div>
    <div class="flex space-x-2 mb-1">
      <div class="w-16 flex items-center">
        <input
          type="number"
          v-model.number="numClusters"
          min="2"
          max="10"
          class="input input-sm input-bordered w-full"
          title="Number of clusters"
        />
      </div>
      <button
        @click="generateClusters"
        class="btn btn-sm btn-primary flex-1 mt-2"
        :disabled="isClusteringLoading"
        title="Generate fingerprints using K-means clustering"
      >
        <span v-if="isClusteringLoading">Clustering...</span>
        <span v-else>Create Clusters</span>
      </button>
    </div>
    <div class="flex space-x-2 mb-1">
      <button
        @click="toggleStatisticsPanel"
        class="btn btn-sm btn-primary flex-1 mt-2"
        :class="{ 'btn-active': showStatistics }"
        title="Show Statistics Panel"
      >
        Show Descriptive Statistics
      </button>
    </div>
    <!-- Glyph Introduction Button -->
    <div class="flex space-x-2 mb-1">
      <button
        @click="toggleGlyphIntro"
        class="btn btn-soft btn-sm btn-primary flex-1 mt-2"
        :class="{ 'btn-active': showGlyphIntro }"
        title="Learn about the glyph visualization"
      >
        <span class="mr-1">ℹ️</span> Glyph Introduction
      </button>
    </div>

    <StatisticsPanel v-if="showStatistics" @close="showStatistics = false" />
    <GlyphIntroductionModal v-if="showGlyphIntro" @close="showGlyphIntro = false" />
  </section>
</template>

<style scoped>
.section {
  padding: 0.75rem;
  background: #d1d1d1;
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
