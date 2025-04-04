<script setup>
import { ref, onMounted, computed } from 'vue'
//import RadialBarChart from './RadialBarChart.vue'

import DataTable from '../Archive/DataTable.vue'
import ScatterPlot from './ScatterPlot.vue'
import { useFileStore } from '@/stores/FileStore'
import { useDataStore } from '@/stores/DataStore'

const fileStore = useFileStore()
const dataStore = useDataStore()

const getFiles = computed(() => {
  return fileStore.getFiles
})
const getData = computed(() => {
  return dataStore.fileData
})
const getPCAData = computed(() => {
  return dataStore.pcaData
})
const selected = ref('')
onMounted(() => {
  fileStore.fetchFiles()
})

function handleGetData() {
  if (selected.value) {
    dataStore.fetchData(selected.value)
  }
}

function handlePCA() {
  if (selected.value) {
    dataStore.fetchPCAData(selected.value)
  }
}
</script>

<template>
  <div id="grid-container">
    <div id="left-column">
      <span>Select Dataset: </span>
      <select v-model="selected">
        <option v-for="file in getFiles" :key="file.id">
          {{ file }}
        </option>
      </select>

      <button @click="handleGetData">Get Data</button>
      <button @click="handlePCA">PCA</button>
    </div>
    <div class="middle-column"><ScatterPlot :data="getPCAData"></ScatterPlot></div>

    <div class="middle-column">
      <DataTable :data="getPCAData" />
    </div>
    <div id="right-column">
      <DataTable :data="getData" />
    </div>

    <!-- <RadialBarChart :data="chartData" /> -->
  </div>
</template>

<style scoped>
.grid-container {
  display: grid;
  grid-template-rows: 1fr 1fr 2fr;
  gap: 16px;
  width: 100%;
  align-items: start;
  padding: 16px;
  box-sizing: border-box;
}
.left-column,
.middle-column,
.right-column {
  border: 1px solid #ddd;
  padding: 16px;
}
.right-column {
  overflow-x: auto;
}
</style>
