<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  lowColor: {
    type: Number,
    default: 0x0000ff, // Blue
  },
  highColor: {
    type: Number,
    default: 0xff0000, // Red
  },
  title: {
    type: String,
    default: 'Attribute Value',
  },
  visible: {
    type: Boolean,
    default: false,
  },
})

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (canvasRef.value) {
    drawGradient()
  }
})

watch(
  () => [props.visible, props.lowColor, props.highColor],
  () => {
    // Use nextTick to ensure canvas is available when it becomes visible
    nextTick(() => {
      if (canvasRef.value) {
        drawGradient()
      }
    })
  },
)

function drawGradient() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)

  // Convert hex colors to RGB strings
  const lowColorRGB = `rgb(${props.lowColor >> 16}, ${(props.lowColor >> 8) & 0xff}, ${props.lowColor & 0xff})`
  const highColorRGB = `rgb(${props.highColor >> 16}, ${(props.highColor >> 8) & 0xff}, ${props.highColor & 0xff})`

  gradient.addColorStop(0, lowColorRGB)
  gradient.addColorStop(1, highColorRGB)

  // Fill with gradient
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Add border
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, canvas.width, canvas.height)
}
</script>

<template>
  <div v-if="visible" class="color-legend">
    <div class="legend-title">{{ title }}</div>
    <div class="legend-container">
      <canvas ref="canvasRef" width="150" height="20"></canvas>
      <div class="legend-labels">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-legend {
  position: absolute;
  bottom: 70px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.legend-title {
  text-align: center;
  margin-bottom: 4px;
  font-weight: bold;
}

.legend-container {
  display: flex;
  flex-direction: column;
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 2px;
}
</style>
