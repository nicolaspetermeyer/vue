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
  fingerprintStore.removeFingerprint(id, projectionInstance.value)
}

function createGlyph(id: string, event: Event) {
  event.stopPropagation()
  // Tell the projection instance to update glyphs
  // if (projectionInstance.value) {
  //   projectionInstance.value.updateGlyphs()
  // }
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
          <div class="fingerprint-info">
            <div class="flex items-center gap-2">
              <div
                v-if="isSelected(fp)"
                class="color-indicator"
                :style="{ backgroundColor: getColor(fp.id) }"
              ></div>
              <span class="fingerprint-name">{{ fp.name }}</span>
            </div>
            <span class="feature-count">Points: {{ fp.projectedPoints.length }}</span>
          </div>
          <div class="flex gap-1">
            <button class="glyph-btn" @click="createGlyph(fp.id, $event)" title="Create glyph">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
                <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
                <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
                <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
              </svg>
            </button>
            <button
              class="delete-btn"
              @click="removeFingerprint(fp.id, $event)"
              title="Remove fingerprint"
            >
              ✕
            </button>
          </div>
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

.fingerprint-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fingerprint-name {
  font-weight: 500;
}

.feature-count {
  font-size: 0.8rem;
  color: #666;
}

.color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.delete-btn,
.glyph-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  font-size: 12px;
}

.delete-btn {
  background: #ffeeee;
}

.delete-btn:hover {
  background: #ffcccc;
}
.glyph-btn {
  background: #eeeeff;
  color: #5555aa;
}

.glyph-btn:hover {
  background: #ddddff;
}
</style>
