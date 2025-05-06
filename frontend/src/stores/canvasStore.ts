import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCanvasStore = defineStore('canvas', () => {
  // 🔹 STATE
  const canvasWidth = ref<number>(0)
  const canvasHeight = ref<number>(0)
  const canvasScale = ref<number>(1)

  // 🔹 COMPUTED PROPERTIES
  const canvasSize = computed(() => ({
    width: canvasWidth.value,
    height: canvasHeight.value,
  }))

  const projectionSize = computed(() => {
    return Math.min(canvasWidth.value, canvasHeight.value)
  })

  // 🔹 STATE MUTATION FUNCTIONS (PURE)
  function setCanvasSize(width: number, height: number) {
    canvasWidth.value = width
    canvasHeight.value = height
  }

  function setCanvasScale(scale: number) {
    canvasScale.value = scale
  }

  return {
    canvasWidth,
    canvasHeight,
    canvasScale,
    canvasSize,
    projectionSize,
    setCanvasSize,
    setCanvasScale,
  }
})
