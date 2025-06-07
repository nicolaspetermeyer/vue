<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProjectionStore } from '@/stores/projectionStore'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import type { AttributeStats } from '@/models/data'

const projectionStore = useProjectionStore()
const fingerprintStore = useFingerprintStore()

const globalStats = computed(() => projectionStore.globalStats)
const fingerprints = computed(() => fingerprintStore.fingerprints)

// Get all attribute keys from global statistics
const attributeKeys = computed(() =>
  Object.keys(globalStats.value).filter((key) => !['id', 'label'].includes(key.toLowerCase())),
)

const isExpanded = ref(false)
const expandedAttributes = ref<Set<string>>(new Set())

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const toggleAttributeExpansion = (attribute: string) => {
  if (expandedAttributes.value.has(attribute)) {
    expandedAttributes.value.delete(attribute)
  } else {
    expandedAttributes.value.add(attribute)
  }
}

const toggleAllAttributes = () => {
  if (expandedAttributes.value.size === attributeKeys.value.length) {
    expandedAttributes.value.clear()
  } else {
    attributeKeys.value.forEach((attr) => expandedAttributes.value.add(attr))
  }
}

const areAllExpanded = computed(() => {
  return expandedAttributes.value.size === attributeKeys.value.length
})

// Format number for display
const formatNumber = (num: number | undefined): string => {
  if (num === undefined) return 'N/A'
  return num.toFixed(2)
}

// Emit event to close the panel
defineEmits(['close'])
</script>

<template>
  <div class="stats-panel">
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-lg font-semibold">Descriptive Statistics</h3>
      <div class="flex gap-2">
        <button @click="toggleExpanded" class="btn btn-sm btn-primary">
          {{ isExpanded ? 'Collapse' : 'Expand' }}
        </button>
        <button @click="$emit('close')" class="btn btn-sm btn-ghost">×</button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <div class="flex justify-end mb-2">
        <button @click="toggleAllAttributes" class="btn btn-xs btn-outline">
          {{ areAllExpanded ? 'Collapse All' : 'Expand All' }}
        </button>
      </div>
      <table class="table table-xs table-zebra w-full">
        <thead>
          <tr>
            <th class="w-36">Source</th>
            <th>Attribute</th>
            <th>Min</th>
            <th>Max</th>
            <th>Mean</th>
            <th>StdDev</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="attr in attributeKeys.slice(0, 5)" :key="attr">
            <!-- Global row for this attribute -->
            <tr class="cursor-pointer hover:bg-gray-100" @click="toggleAttributeExpansion(attr)">
              <td class="font-medium">
                Global
                <span class="ml-1 text-xs">{{ expandedAttributes.has(attr) ? '▼' : '▶' }}</span>
              </td>
              <td class="font-medium">{{ attr }}</td>
              <td>{{ formatNumber(globalStats[attr]?.min) }}</td>
              <td>{{ formatNumber(globalStats[attr]?.max) }}</td>
              <td>{{ formatNumber(globalStats[attr]?.mean) }}</td>
              <td>{{ formatNumber(globalStats[attr]?.std) }}</td>
            </tr>
            <!-- Fingerprint rows for this attribute (shown when expanded) -->
            <template v-if="expandedAttributes.has(attr)">
              <tr v-for="fp in fingerprints" :key="`${attr}-${fp.id}`" class="bg-gray-50">
                <td class="text-sm">{{ fp.name }}</td>
                <td class="pl-6 text-sm"></td>
                <td>{{ formatNumber(fp.localStats[attr]?.min) }}</td>
                <td>{{ formatNumber(fp.localStats[attr]?.max) }}</td>
                <td>{{ formatNumber(fp.localStats[attr]?.localMean) }}</td>
                <td>{{ formatNumber(fp.localStats[attr]?.std) }}</td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
      <div v-if="attributeKeys.length > 5" class="text-center text-sm text-gray-500 mt-2">
        And {{ attributeKeys.length - 5 }} more attributes...
      </div>
    </div>

    <!-- Expanded Modal View -->
    <div
      v-if="isExpanded"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-4/5 h-4/5 max-w-6xl flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Complete Descriptive Statistics</h2>
          <div class="flex items-center gap-2">
            <button @click="toggleAllAttributes" class="btn btn-sm btn-outline">
              {{ areAllExpanded ? 'Collapse All' : 'Expand All' }}
            </button>
            <button @click="toggleExpanded" class="btn btn-sm btn-ghost">×</button>
          </div>
        </div>

        <div class="overflow-auto flex-grow">
          <table class="table table-compact table-zebra w-full">
            <thead class="sticky top-0 bg-white">
              <tr>
                <th class="w-36">Source</th>
                <th>Attribute</th>
                <th>Mean</th>
                <th>Median</th>
                <th>Min</th>
                <th>Max</th>
                <th>StdDev</th>
                <th>Q25</th>
                <th>Q75</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="attr in attributeKeys" :key="attr">
                <!-- Global row for this attribute -->
                <tr
                  class="cursor-pointer hover:bg-gray-100"
                  @click="toggleAttributeExpansion(attr)"
                >
                  <td class="font-medium">
                    Global
                    <span class="ml-1 text-xs">{{
                      expandedAttributes.has(attr) ? '▼' : '▶'
                    }}</span>
                  </td>
                  <td class="font-medium">{{ attr }}</td>
                  <td>{{ formatNumber(globalStats[attr]?.mean) }}</td>
                  <td>{{ formatNumber(globalStats[attr]?.median) }}</td>
                  <td>{{ formatNumber(globalStats[attr]?.min) }}</td>
                  <td>{{ formatNumber(globalStats[attr]?.max) }}</td>
                  <td>{{ formatNumber(globalStats[attr]?.std) }}</td>
                  <td>{{ formatNumber(globalStats[attr]?.q25) }}</td>
                  <td>{{ formatNumber(globalStats[attr]?.q75) }}</td>
                </tr>
                <!-- Fingerprint rows for this attribute (shown when expanded) -->
                <template v-if="expandedAttributes.has(attr)">
                  <tr v-for="fp in fingerprints" :key="`${attr}-${fp.id}`" class="bg-gray-50">
                    <td class="text-sm">{{ fp.name }}</td>
                    <td class="pl-6 text-sm"></td>
                    <td>{{ formatNumber(fp.localStats[attr]?.localMean) }}</td>
                    <td>{{ formatNumber(fp.localStats[attr]?.median) }}</td>
                    <td>{{ formatNumber(fp.localStats[attr]?.min) }}</td>
                    <td>{{ formatNumber(fp.localStats[attr]?.max) }}</td>
                    <td>{{ formatNumber(fp.localStats[attr]?.std) }}</td>
                    <td>{{ formatNumber(fp.localStats[attr]?.q25) }}</td>
                    <td>{{ formatNumber(fp.localStats[attr]?.q75) }}</td>
                  </tr>
                </template>
              </template>
            </tbody>
          </table>
        </div>

        <div class="mt-4 text-sm text-gray-500">
          <p>
            Click on a global statistics row to expand/collapse fingerprint details. Global
            statistics are calculated across all data points, while fingerprint statistics are
            calculated only for points in each fingerprint.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-panel {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-height: 400px;
  overflow-y: auto;
}

.table {
  font-size: 0.8rem;
}

/* Custom scrollbar */
.stats-panel ::-webkit-scrollbar,
.overflow-auto::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.stats-panel ::-webkit-scrollbar-track,
.overflow-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.stats-panel ::-webkit-scrollbar-thumb,
.overflow-auto::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.stats-panel ::-webkit-scrollbar-thumb:hover,
.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* Ensure sticky header works properly */
thead.sticky {
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
