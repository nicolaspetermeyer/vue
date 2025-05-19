<script setup lang="ts">
import { PixiApp } from '@/pixi/Base/PixiApp'
import { Application } from 'pixi.js'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { PixiProjection } from '@/pixi/PixiProjection'
import { initDevtools } from '@pixi/devtools'
import { useProjectionStore } from '@/stores/projectionStore'
import { Colors } from '@/config/Themes'

const projectionStore = useProjectionStore()

const wrapperRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let app: PixiApp | null = null

const currentProjection = ref<PixiProjection | null>(null)
const initializationComplete = ref<boolean>(false)

function resetView() {
  currentProjection.value?.resetView()
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
  if (!app) {
    app = new PixiApp()
    await app.setup(canvasRef.value, width, height, Colors.CANVAS_BACKGROUND)
    initDevtools({ app: app as Application })
  }

  createProjectionInstance()
  initializationComplete.value = true
}

function createProjectionInstance() {
  if (!app) return

  // Clean up any existing projection
  if (currentProjection.value) {
    currentProjection.value.unregisterKeyboardEvents()
    app.clearRoot()
    currentProjection.value = null
    projectionStore.clearProjectionInstance()
  }

  // Create new projection instance
  const projection = new PixiProjection(
    projectionStore.projection,
    projectionStore.globalStats,
    app,
  )

  // Set up the new projection
  projection.registerKeyboardEvents()
  app.addContainer(projection)
  currentProjection.value = projection

  // Store reference in the store
  projectionStore.setProjectionInstance(projection)

  console.log('Projection instance created with', projectionStore.projection.length, 'points')
}

watch(
  () => projectionStore.projection,
  (newMatch) => {
    if (newMatch.length > 0 && app) {
      createProjectionInstance()
    }
  },
  { deep: true },
)

onMounted(async () => {
  await init()
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
