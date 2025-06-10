<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePointFilterStore } from '@/stores/pointFilterStore'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { SelectionMode } from '@/pixi/interactions/controllers/SelectionController'
import { projectionService } from '@/services/projectionService'

const fingerprintStore = useFingerprintStore()

const projectionStore = useProjectionStore()
const { projectionInstance, hasRemovedPoints } = storeToRefs(projectionStore)

const pointFilterStore = usePointFilterStore()
const { thresholdPercentile, selectTopPercentile } = storeToRefs(pointFilterStore)

const currentMode = ref<string>(SelectionMode.RECTANGLE)

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
      <!-- Selection Mode Toggle Switch -->
      <div class="flex items-center mb-3 mt-2">
        <span class="text-sm font-medium">Selection Mode:</span>
        <div class="toggle-switch-container" @click="toggleSelectionMode">
          <div
            class="toggle-switch"
            :class="{
              'active-rectangle': currentMode === SelectionMode.RECTANGLE,
              'active-lasso': currentMode === SelectionMode.LASSO,
            }"
          >
            <span class="toggle-option">Rectangle</span>
            <span class="toggle-option">Lasso</span>
          </div>
        </div>
      </div>
      <!-- Remove Points Button -->
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

.toggle-switch-container {
  display: inline-block;
  background-color: #ffffff;
  border-radius: 9999px;
  padding: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  user-select: none;
  border: 1px solid #e5e7eb;
}

.toggle-switch {
  display: flex;
  position: relative;
  width: 200px;
  height: 28px;
  border-radius: 9999px;
  overflow: hidden;
}

.toggle-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1;
  transition: color 0.3s ease;
}

.active-rectangle::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 50%;
  height: 100%;
  background-color: #422ad5;
  border-radius: 9999px;
  transition: transform 0.3s ease;
}

.active-lasso::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 50%;
  height: 100%;
  background-color: #422ad5;
  border-radius: 9999px;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.active-rectangle .toggle-option:first-child,
.active-lasso .toggle-option:last-child {
  color: white;
}

.active-rectangle .toggle-option:last-child,
.active-lasso .toggle-option:first-child {
  color: #333333;
}
</style>
