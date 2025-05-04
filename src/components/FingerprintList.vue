<script setup lang="ts">
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { storeToRefs } from 'pinia'
import { useProjectionStore } from '@/stores/projectionStore'

const fingerprintStore = useFingerprintStore()
const { fingerprints, selectedFingerprints } = storeToRefs(fingerprintStore)

const projectionStore = useProjectionStore()
const { projectionInstance } = storeToRefs(projectionStore)

function toggleSelection(fingerprint: (typeof fingerprints.value)[number]) {
  fingerprintStore.toggleSelectedFingerprint(fingerprint, projectionInstance.value)
}

function isSelected(fingerprint: (typeof fingerprints.value)[number]): boolean {
  return selectedFingerprints.value.some((fp) => fp.id === fingerprint.id)
}

function getColor(id: string): string {
  const colors = fingerprintStore.getComparisonColors()
  const colorHex = colors[id]?.toString(16).padStart(6, '0') || '888888'
  return `#${colorHex}`
}

function removeFingerprint(id: string, event: Event) {
  event.stopPropagation()
  fingerprintStore.removeFingerprint(id)
}
</script>

<template>
  <div class="fingerprint-list">
    <h2 class="text-lg font-semibold mb-2">Fingerprints</h2>
    <div v-if="fingerprints.length === 0" class="text-sm text-gray-500">
      No fingerprints created yet.
    </div>
    <ul v-else class="space-y-1">
      <li
        v-for="fp in fingerprints"
        :key="fp.id"
        :class="{
          'fingerprint-item': true,
          active: isSelected(fp),
        }"
        @click="toggleSelection(fp)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div
              v-if="isSelected(fp)"
              class="color-indicator"
              :style="{ backgroundColor: getColor(fp.id) }"
            ></div>
            <span class="truncate">{{ fp.name }}</span>
          </div>
          <button
            class="delete-btn"
            @click="removeFingerprint(fp.id, $event)"
            title="Remove fingerprint"
          >
            ✕
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.fingerprint-list {
  margin-top: 1rem;
}

.fingerprint-item {
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  background-color: #f5f5f5;
  transition: background-color 0.2s ease;
}

.fingerprint-item:hover {
  background-color: #e0e0e0;
}

.fingerprint-item.active {
  background-color: #d1e7dd;
  font-weight: 500;
}

.color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.delete-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  font-size: 12px;
  background: #ffeeee;
}

.delete-btn:hover {
  background: #ccc;
}

.delete-btn {
  background: #ffeeee;
}

.delete-btn:hover {
  background: #ffcccc;
}
</style>
