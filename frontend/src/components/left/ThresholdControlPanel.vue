<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePointFilterStore } from '@/stores/pointFilterStore'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { SelectionMode } from '@/pixi/interactions/controllers/SelectionController'
import { projectionService } from '@/services/projectionService'

const fingerprintStore = useFingerprintStore()
const { fingerprints } = storeToRefs(fingerprintStore)
const { addFingerprint, removeFingerprint } = fingerprintStore

const projectionStore = useProjectionStore()
const { projectionInstance, projectionMethod, hasRemovedPoints } = storeToRefs(projectionStore)

const pointFilterStore = usePointFilterStore()
const { thresholdPercentile, selectTopPercentile } = storeToRefs(pointFilterStore)

const currentMode = ref<SelectionMode>(SelectionMode.RECTANGLE)
const selectionModeText = computed(() =>
  currentMode.value === SelectionMode.RECTANGLE ? 'Rectangle Selection' : 'Lasso Selection',
)

const sliderStyles = computed(() => {
  const percent = thresholdPercentile.value * 100

  if (selectTopPercentile.value) {
    return {
      background: `linear-gradient(to right, 
                  #e5e7eb 0%, 
                  #e5e7eb ${percent}%, 
                  #4b6bfb ${percent}%, 
                  #4b6bfb 100%)`,
    }
  } else {
    return {
      background: `linear-gradient(to right, 
                    #4b6bfb 0%, 
                    #4b6bfb ${percent}%, 
                    #e5e7eb ${percent}%, 
                    #e5e7eb 100%)`,
    }
  }
})

const toggleSelectionMode = () => {
  if (projectionInstance.value) {
    projectionInstance.value.toggleSelectionMode()
    currentMode.value =
      currentMode.value === SelectionMode.RECTANGLE ? SelectionMode.LASSO : SelectionMode.RECTANGLE
  }
}

const hasSelectedPoints = computed(() => {
  return fingerprintStore.selection.length > 0
})

const removeSelectedPoints = () => {
  if (hasSelectedPoints.value) {
    const selectedIds = fingerprintStore.selection.map((p) => p.id)
    projectionService.removePoints(selectedIds)
  }
}
</script>

<template>
  <section class="section">
    <div class="instruction-group">
      <h4 class="instruction-title">Controls</h4>
      <!-- Remove Points Button -->
      <div class="flex space-x-2 mb-1">
        <button @click="toggleSelectionMode" class="btn btn-sm btn-primary flex-1 mt-2">
          <a>{{ selectionModeText }}</a>
        </button>
      </div>
      <div class="flex space-x-2 mb-1">
        <button
          @click="removeSelectedPoints"
          class="btn btn-sm btn-error flex-1 mt-2"
          :disabled="!hasSelectedPoints"
          title="Remove selected points from projection"
        >
          Remove Points
        </button>
        <button
          @click="projectionService.recalculateWithoutRemovedPoints()"
          class="btn btn-sm btn-warning flex-1 mt-2"
          title="Recalculate projection without removed points"
          :disabled="!hasRemovedPoints"
        >
          Recalculate
        </button>
      </div>
    </div>

    <div class="instruction-group">
      <h4 class="instruction-title">Threshold</h4>

      <div class="mt-2">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm font-medium">Threshold: {{ thresholdPercentile.toFixed(2) }}</span>
        </div>
        <div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            v-model.number="thresholdPercentile"
            class="range range-sm w-full"
            :style="sliderStyles"
          />
        </div>
        <div class="flex justify-between text-xs text-black-500 px-1">
          <span>0</span>
          <span>0.5</span>
          <span>1</span>
        </div>
      </div>

      <div class="mt-3 flex justify-center gap-6">
        Percentile:
        <label class="label cursor-pointer justify-center items-center">
          <input
            type="radio"
            name="percentile-type"
            class="radio radio-sm radio-primary border-gray-600"
            :value="true"
            v-model="selectTopPercentile"
          />
          <span class="label-text text-black">Top</span>
        </label>
        <label class="label cursor-pointer justify-center items-center">
          <input
            type="radio"
            name="percentile-type"
            class="radio radio-sm radio-primary border-gray-600"
            :value="false"
            v-model="selectTopPercentile"
          />
          <span class="label-text text-black">Bottom</span>
        </label>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(66, 42, 213);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(60, 80, 251);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

input[type='range']::-webkit-slider-runnable-track {
  background: transparent;
  border: none;
  height: 8px;
}

.instruction-group {
  margin-bottom: 0.75rem;
}

.instruction-title {
  font-weight: 600;
  color: #000000;
  margin-bottom: 0.25rem;
  border-bottom: 1px solid #000000;
  padding-bottom: 0.25rem;
}
</style>
