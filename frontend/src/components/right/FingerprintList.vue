<script setup lang="ts">
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { storeToRefs } from 'pinia'
import { useProjectionStore } from '@/stores/projectionStore'
import { ref } from 'vue'
import type { Fingerprint } from '@/models/data'

const fingerprintStore = useFingerprintStore()
const { fingerprints } = storeToRefs(fingerprintStore)

const projectionStore = useProjectionStore()
const { projectionInstance } = storeToRefs(projectionStore)

const visibleMiniRings = ref<Set<string>>(new Set())
const editingFingerprintId = ref<string | null>(null)
const editingName = ref('')

function isSelected(id: string): boolean {
  return fingerprintStore.selectedFingerprints.some((fp) => fp.id === id)
}

function toggleSelection(fingerprint: Fingerprint): void {
  fingerprintStore.toggleSelectedFingerprint(fingerprint, projectionInstance.value)
}

function getColor(fingerprint: (typeof fingerprints.value)[number]): string {
  const colorHex = fingerprint.color?.toString(16).padStart(6, '0') || '888888'
  return `#${colorHex}`
}

function removeFingerprint(id: string, event: Event) {
  event.stopPropagation()
  fingerprintStore.removeFingerprint(id, projectionInstance.value)
}

function toggleMiniRing(id: string, event: Event) {
  event.stopPropagation()

  const fingerprint = fingerprints.value.find((fp) => fp.id === id)

  if (!fingerprint || !projectionInstance.value?.dimred) {
    return
  }

  if (visibleMiniRings.value.has(id)) {
    projectionInstance.value.dimred.removeMiniRing(fingerprint)
    visibleMiniRings.value.delete(id)
  } else {
    const colorInt = fingerprint.color || parseInt('888888', 16)
    const stats = fingerprint.localStats

    projectionInstance.value?.dimred?.addMiniRingForFingerprint(fingerprint, colorInt, stats)
    visibleMiniRings.value.add(id)
  }
}

function isMiniRingVisible(id: string): boolean {
  return visibleMiniRings.value.has(id)
}

function startEditing(fingerprint: Fingerprint, event: Event) {
  event.stopPropagation()
  editingFingerprintId.value = fingerprint.id
  editingName.value = fingerprint.name
}

function saveEdit() {
  if (editingFingerprintId.value && editingName.value.trim()) {
    fingerprintStore.renameFingerprint(editingFingerprintId.value, editingName.value.trim())
    cancelEdit()
  }
}

function cancelEdit() {
  editingFingerprintId.value = null
  editingName.value = ''
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    saveEdit()
  } else if (event.key === 'Escape') {
    cancelEdit()
  }
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
          active: isSelected(fp.id),
        }"
        @click="toggleSelection(fp)"
      >
        <div class="flex items-center justify-between">
          <div class="fingerprint-info">
            <div class="flex items-center gap-2">
              <div class="color-indicator" :style="{ backgroundColor: getColor(fp) }"></div>
              <div v-if="editingFingerprintId === fp.id" class="edit-name-container" @click.stop>
                <input
                  v-model="editingName"
                  class="edit-name-input"
                  @keydown="handleKeyDown"
                  v-focus
                />
                <div class="edit-actions">
                  <button class="edit-btn save-btn" @click="saveEdit" title="Save">✓</button>
                  <button class="edit-btn cancel-btn" @click="cancelEdit" title="Cancel">✕</button>
                </div>
              </div>
              <span v-else class="fingerprint-name">{{ fp.name }}</span>
            </div>
            <span class="feature-count">Points: {{ fp.projectedPoints.length }}</span>
          </div>
          <div class="flex gap-1">
            <!-- Replace the inline edit button with the new component -->
            <button
              v-if="editingFingerprintId !== fp.id"
              class="edit-name-btn"
              @click="startEditing(fp, $event)"
              title="Edit name"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              class="glyph-btn"
              :class="{ 'glyph-active': isMiniRingVisible(fp.id) }"
              @click="toggleMiniRing(fp.id, $event)"
              :title="isMiniRingVisible(fp.id) ? 'Hide glyph' : 'Show glyph'"
            >
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

.edit-name-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  background: #eeeeee;
  color: #555555;
}

.edit-name-btn:hover {
  background: #dddddd;
}

.edit-name-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-name-input {
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 0.9rem;
  width: 120px;
}

.edit-actions {
  display: flex;
  gap: 2px;
}

.edit-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  font-size: 12px;
}

.save-btn {
  background: #e6ffee;
  color: #22aa55;
}

.save-btn:hover {
  background: #ccffdd;
}

.cancel-btn {
  background: #ffeeee;
  color: #aa5555;
}

.cancel-btn:hover {
  background: #ffdddd;
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
