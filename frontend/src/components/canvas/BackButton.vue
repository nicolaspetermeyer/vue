<script setup lang="ts">
import { useProjectionStore } from '@/stores/projectionStore'
import { computed } from 'vue'

const projectionStore = useProjectionStore()
const canGoBack = computed(() => projectionStore.canGoBack)

function goBack() {
  if (projectionStore.goBackToPreviousProjection()) {
  } else {
    console.error('No previous projection to go back to.')
  }
}
</script>

<template>
  <div class="back-button-container" v-if="canGoBack">
    <button class="back-button" @click="goBack" :disabled="!canGoBack">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path
          fill-rule="evenodd"
          d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
        />
      </svg>
      Back
    </button>
  </div>
</template>

<style scoped>
.back-button-container {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 100;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #3366cc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #2952a3;
}

.back-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
