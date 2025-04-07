<script setup lang="ts">
import { PixiApp } from '@/pixi/PixiApp'
import { Application } from 'pixi.js'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { PixiProjection } from '@/pixi/PixiProjection'
import { initDevtools } from '@pixi/devtools'
import { useProjectionStore } from '@/stores/projectionStore'
import { useDataStore } from '@/stores/dataStore'
import { storeToRefs } from 'pinia'

const dataStore = useDataStore()
const { globalStats } = storeToRefs(dataStore)

const projectionStore = useProjectionStore()
const { rawProjection, projectionMatch, matchedPoints, projectionInstance } =
  storeToRefs(projectionStore)

const wrapperRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let app: PixiApp | null = null
let resizeObserver: ResizeObserver | null = null

function update() {
  console.log('update')
}

async function init() {
  console.log('init')
  console.log('Canvas size', wrapperRef.value?.getBoundingClientRect())
  if (!canvasRef.value || !wrapperRef.value) return

  // Initialize dimensions
  const { width, height } = wrapperRef.value.getBoundingClientRect()

  // Create Pixi App
  app = new PixiApp()
  await app.setup(canvasRef.value, width, height, 0xeeeeee)

  initDevtools({ app: app as Application })

  // Create DR projection renderer
  const projection = new PixiProjection(matchedPoints.value, globalStats.value)
  projectionStore.setProjectionInstance(projection)

  // Add to root
  app.addContainer(projection)

  // Setup ResizeObserver
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      if (app) {
        app.resizeApp(width, height)
      }
    }
  })

  resizeObserver.observe(wrapperRef.value)
}

watch(
  () => projectionStore.matchedPoints,
  (matchedPoints) => {
    if (!app) return

    projectionStore.clearProjectionInstance()

    const projection = new PixiProjection(matchedPoints, globalStats.value)

    app.addContainer(projection)

    projectionStore.setProjectionInstance(projection)
  },
)

onMounted(() => {
  init()
  update()
})

onBeforeUnmount(() => {
  if (resizeObserver && wrapperRef.value) {
    resizeObserver.unobserve(wrapperRef.value)
    resizeObserver.disconnect()
  }
})

function debug() {
  app?.debugSceneGraphRecursive(app.root, 0)
}
</script>

<template>
  <div ref="wrapperRef" class="relative w-full h-full">
    <canvas class="w-full h-full" ref="canvasRef" @contextmenu.prevent></canvas>
    <button @click="debug" class="btn btn-xs btn-content absolute bottom-0 right-0">
      Log Pixi Scene Graph
    </button>
  </div>
</template>

<style scoped></style>
