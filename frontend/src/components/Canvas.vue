<script setup lang="ts">
import { PixiApp } from '@/pixi/Base/PixiApp'
import { Application } from 'pixi.js'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { PixiProjection } from '@/pixi/PixiProjection'
import { initDevtools } from '@pixi/devtools'
import { useProjectionStore } from '@/stores/projectionStore'
import { useDataStore } from '@/stores/dataStore'
import { storeToRefs } from 'pinia'
import { Colors } from '@/config/Themes'

const dataStore = useDataStore()
const { globalStats } = storeToRefs(dataStore)

const projectionStore = useProjectionStore()
const { projectionMatch } = storeToRefs(projectionStore)

const wrapperRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let app: PixiApp | null = null

const currentProjection = ref<PixiProjection | null>(null)

function resetView() {
  if (currentProjection.value) {
    currentProjection.value.resetView()
  }
}

function update() {
  console.log('update')
}

async function init() {
  console.log('init')

  if (!canvasRef.value || !wrapperRef.value) return

  // Initialize dimensions
  const { width, height } = wrapperRef.value.getBoundingClientRect()

  // Create Pixi App
  app = new PixiApp()

  await app.setup(canvasRef.value, width, height, Colors.CANVAS_BACKGROUND)

  initDevtools({ app: app as Application })

  // Create DR projection renderer
  const projection = new PixiProjection(projectionMatch.value, globalStats.value)
  projectionStore.setProjectionInstance(projection)

  // Register keyboard events
  projection.registerKeyboardEvents()

  // Add to root
  app.addContainer(projection)
  currentProjection.value = projection
}

watch(
  () => projectionStore.projectionMatch,
  (projectionMatch) => {
    if (!app) return

    if (currentProjection.value) {
      currentProjection.value.unregisterKeyboardEvents()
    }

    app.clearRoot()

    const projection = new PixiProjection(projectionMatch, globalStats.value)
    projectionStore.setProjectionInstance(projection)

    projection.registerKeyboardEvents()

    app.addContainer(projection)
    currentProjection.value = projection
  },
)

onMounted(() => {
  init()
  update()
})

onBeforeUnmount(() => {
  if (currentProjection.value) {
    currentProjection.value.unregisterKeyboardEvents()
  }
})

function debug() {
  app?.debugSceneGraphRecursive(app.root, 0)
}
</script>

<template>
  <div ref="wrapperRef" class="relative w-full h-full">
    <canvas
      class="w-full h-full"
      ref="canvasRef"
      @contextmenu.prevent
      @mousedown.prevent
      @dragstart.prevent
    ></canvas>
    <button @click="debug" class="btn btn-xs btn-content absolute bottom-0 right-0">
      Log Pixi Scene Graph
    </button>
    <div class="canvas-controls">
      <button @click="resetView" class="reset-view-btn">Reset View</button>
    </div>
  </div>
</template>

<style scoped>
.canvas-controls {
  position: absolute;
  bottom: 25px;
  right: 10px;
  z-index: 100;
}
.reset-view-btn {
  background-color: #555;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}
.reset-view-btn:hover {
  background-color: #777;
}
</style>
