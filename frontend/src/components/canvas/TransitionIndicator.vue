<script setup lang="ts">
import { watch, ref } from 'vue'
import { animationService } from '@/services/animationService'
import { useAttributeFilterStore } from '@/stores/attributeFilterStore'
import { useProjectionStore } from '@/stores/projectionStore'

const attributeFilterStore = useAttributeFilterStore()
const projectionStore = useProjectionStore()

const progress = ref(0)
const isVisible = ref(false)

watch(
  () => animationService.isAnimating.value,
  (isAnimating) => {
    isVisible.value = isAnimating
  },
)

watch(
  () => animationService.progress.value,
  (newProgress) => {
    progress.value = newProgress
  },
)

watch(
  () => attributeFilterStore.isRecalculating,
  (isRecalculating) => {
    isVisible.value = isRecalculating
  },
)

watch(
  () => projectionStore.isLoading,
  (isLoading) => {
    isVisible.value = isLoading
  },
)
</script>

<template>
  <div v-if="isVisible" class="transition-indicator">
    <div class="progress-bar" :style="{ width: `${progress * 100}%` }"></div>
  </div>
</template>

<style scoped>
.transition-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.progress-bar {
  height: 100%;
  background: #4285f4;
  transition: width 0.05s linear;
}
</style>
