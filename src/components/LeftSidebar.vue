<template>
  <div class="sidebar">
    <h2>User Controls</h2>

    <h2>Select Dataset</h2>

    <div v-if="isLoading">Loading...</div>
    <div v-else>
      <ul class="dataset-list">
        <li
          v-for="file in datasets"
          :key="file"
          :class="{ active: file === datasetStore.selectedDataset }"
          @click="selectDataset(file)"
        >
          {{ file }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchAvailableDatasets } from '@/services/api'
import { useDatasetStore } from '@/stores/datasetStore'

const datasetStore = useDatasetStore()

const datasets = ref<string[]>([])
const isLoading = ref(true)

async function selectDataset(file: string) {
  await datasetStore.load(file)
}

onMounted(async () => {
  try {
    const response = await fetchAvailableDatasets()
    datasets.value = response
    if (datasets.value.length > 0) {
      await selectDataset(datasets.value[0])
    }
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.sidebar {
  padding: 1rem;
  background: #2e2d2d;
}

.dataset-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.dataset-list li {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.dataset-list li:hover {
  background-color: #212433;
}

.dataset-list li.active {
  font-weight: bold;
  background-color: #212433;
}
</style>
