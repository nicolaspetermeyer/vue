<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LeftSidebar from '@/components/LeftSidebar.vue'
import MainCanvasView from '@/components/MainCanvasView.vue'
import Canvas from '@/components/Canvas.vue'
import RightPanel from '@/components/RightPanel.vue'

import { useDatasetStore } from '@/stores/datasetStore'

const datasetStore = useDatasetStore()
const { loadDatasets } = datasetStore

const isLoading = ref(true)

onMounted(async () => {
  await Promise.all([loadDatasets()])
  isLoading.value = false
})
</script>

<template>
  <div class="layout">
    <div class="left">
      <LeftSidebar />
    </div>
    <div class="h-full w-full flex-1 overflow-hidden">
      <Canvas></Canvas>
    </div>

    <div class="right">
      <RightPanel />
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.left {
  width: 280px;
  flex-shrink: 0;
  background-color: #f1f1f1;
  border-right: 1px solid #ddd;
  overflow-y: auto;
}

.right {
  width: 100px;
  flex-shrink: 0;
  background-color: #f1f1f1;
  border-left: 1px solid #ddd;
  overflow-y: auto;
}
</style>
