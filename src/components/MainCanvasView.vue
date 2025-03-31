<template>
  <div class="canvas-container">
    <canvas ref="canvasRef" width="800" height="600"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (ctx) {
    ctx.fillStyle = 'black'
    ctx.fillRect(50, 50, 10, 10) // Example placeholder
  }
})
</script>

<style scoped>
.canvas-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  height: 100%;
}
canvas {
  border: 1px solid #ccc;
}
</style>
