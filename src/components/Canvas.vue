<script setup lang="ts">
import { PixiApp } from '@/pixi/PixiApp'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { PixiProjection } from '@/pixi/PixiProjection'
import type { ProjectionRow, Point } from '@/models/data'
import { initDevtools } from '@pixi/devtools'

const props = defineProps<{ projectionData: ProjectionRow[] }>()

const wrapperRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let app: PixiApp | null = null
let resizeObserver: ResizeObserver | null = null

function update() {
  console.log('update')
}

function init() {
  console.log('init')
  console.log('Canvas size', wrapperRef.value?.getBoundingClientRect())
  if (!canvasRef.value || !wrapperRef.value) return

  // Initialize dimensions
  const { width, height } = wrapperRef.value.getBoundingClientRect()

  // Create Pixi App
  app = new PixiApp(canvasRef.value, width, height, 0xeeeeee)

  initDevtools({ app })

  // Transform to Pixi-compatible points
  const points: Point[] = props.projectionData.map((row, i) => ({
    item_id: i,
    pos: { x: row.x, y: row.y },
  }))
  console.log('Projection props:', props.projectionData)
  console.log('Mapped points:', points)

  // Create DR projection renderer
  const projection = new PixiProjection(points)

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

// function getOrCreateProjection() {
//   const projection = app?.getProjection()
// }

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
