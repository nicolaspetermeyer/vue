<template>
  <!-- <Scatterplot :points="datasetStore.projection" /> -->
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useDataset } from '@/composables/useDataset'
import Scatterplot from '@/components/ScatterPlot.vue'
import { useDatasetStore } from '@/stores/datasetStore'
import RadialBarChart from './RadialBarChart.vue'

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const { projection } = useDataset() // live projection data
const datasetStore = useDatasetStore()
let resizeObserver: ResizeObserver

function resizeCanvas() {
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!canvas || !container) return

  const { width, height } = container.getBoundingClientRect()
  canvas.width = width
  canvas.height = height
}

// Watch for projection updates or resize
watch(projection, (newProj) => {})

onMounted(() => {
  resizeObserver = new ResizeObserver(resizeCanvas)
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
  resizeCanvas()
})

onBeforeUnmount(() => {
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  }
})
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
}
canvas {
  display: block;
  background-color: white;
}
</style>
