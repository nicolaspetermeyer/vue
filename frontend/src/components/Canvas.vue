<script setup lang="ts">
import { PixiApp } from '@/pixi/Base/PixiApp'
import { Application } from 'pixi.js'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { PixiProjection } from '@/pixi/PixiProjection'
import { initDevtools } from '@pixi/devtools'
import { useProjectionStore } from '@/stores/projectionStore'
import { Colors } from '@/config/Themes'
import BackButton from '@/components/canvas/BackButton.vue'
import TransitionIndicator from '@/components/canvas/TransitionIndicator.vue'
import ColorLegend from '@/components/canvas/ColorLegend.vue'
import ContextMenu from './ContextMenu.vue'

const projectionStore = useProjectionStore()

const wrapperRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let app: PixiApp | null = null

const currentProjection = ref<PixiProjection | null>(null)
const initializationComplete = ref<boolean>(false)
const showColorLegend = ref<boolean>(false)
const colorLegendTitle = ref<string>('Attribute Value')

const lowColor = 0x0000ff // Blue
const highColor = 0xff0000 // Red

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  options: [] as { label: string; action: () => void }[],
})

const handleContextMenu = (data: any) => {
  contextMenu.value = data
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

function resetView() {
  currentProjection.value?.resetView()
}

function update() {}

async function init() {
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

  // Register for attribute visualization events
  projection.dimred?.on('attributeVisualization', (attributeName: string) => {
    showColorLegend.value = true
    colorLegendTitle.value = attributeName
  })

  projection.dimred?.on('resetVisualization', () => {
    showColorLegend.value = false
  })

  projection.on('showContextMenu', handleContextMenu)

  // Store reference in the store
  projectionStore.setProjectionInstance(projection)
}

// Watch for changes in the projection store and create a new instance if needed
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
  const visualizationElement = document.getElementById('visualization-container')
  if (visualizationElement) {
    visualizationElement.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      return false
    })
  }
})

onBeforeUnmount(() => {
  if (currentProjection.value) {
    currentProjection.value.unregisterKeyboardEvents()
    currentProjection.value.off('showContextMenu', handleContextMenu)
  }
  const visualizationElement = document.getElementById('visualization-container')
  if (visualizationElement) {
    visualizationElement.removeEventListener('contextmenu', (e) => {
      e.preventDefault()
      return false
    })
  }
})

function debug() {
  app?.debugSceneGraphRecursive(app.root, 0)
}
</script>

<template>
  <div ref="wrapperRef" class="relative w-full h-full">
    <BackButton />
    <ColorLegend
      :visible="showColorLegend"
      :title="colorLegendTitle"
      :lowColor="lowColor"
      :highColor="highColor"
    />

    <TransitionIndicator />
    <ContextMenu
      :show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :options="contextMenu.options"
      @close="closeContextMenu()"
    />
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
