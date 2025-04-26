<script setup lang="ts">
import { PixiApp } from '@/pixi/Base/PixiApp'
import { Application } from 'pixi.js'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { PixiProjection } from '@/pixi/PixiProjection'
import { initDevtools } from '@pixi/devtools'
import { useProjectionStore } from '@/stores/projectionStore'
import { useDataStore } from '@/stores/dataStore'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { storeToRefs } from 'pinia'

const dataStore = useDataStore()
const { globalStats } = storeToRefs(dataStore)

const projectionStore = useProjectionStore()
const { projectionMatch, projectionInstance } = storeToRefs(projectionStore)

const fingerprintStore = useFingerprintStore()
const { selectedFingerprint } = storeToRefs(fingerprintStore)

const wrapperRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let app: PixiApp | null = null

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

  await app.setup(canvasRef.value, width, height, 0xeeeeee)

  initDevtools({ app: app as Application })

  // Create DR projection renderer
  const projection = new PixiProjection(projectionMatch.value, globalStats.value)
  projectionStore.setProjectionInstance(projection)

  // Add to root
  app.addContainer(projection)
}

watch(
  () => projectionStore.projectionMatch,
  (projectionMatch) => {
    if (!app) return

    app.clearRoot()

    const projection = new PixiProjection(projectionMatch, globalStats.value)
    projectionStore.setProjectionInstance(projection)

    app.addContainer(projection)
  },
)

watch(
  selectedFingerprint,
  (fp) => {
    const ring = projectionInstance.value?.attributeRing
    if (ring) {
      // Update the attribute ring with local stats if fingerprint is selected
      if (fp) {
        ring.setLocalStats(fp?.localStats)

        // Get the points from the selected fingerprint to highlight
        const fingerprintPointIds = fp.projectedPoints.map((point) => point.id)

        // Highlight the points in the dimred visualization
        if (projectionInstance.value?.dimred) {
          projectionInstance.value.dimred.highlightFingerprintPoints(fingerprintPointIds)
        }
      } else {
        ring.setLocalStats({})
        // Clear the highlight if no fingerprint is selected
        projectionInstance.value?.dimred?.highlightFingerprintPoints([])
      }
    }
  },
  { immediate: true },
)

onMounted(() => {
  init()
  update()
})

onBeforeUnmount(() => {})

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
  </div>
</template>

<style scoped></style>
