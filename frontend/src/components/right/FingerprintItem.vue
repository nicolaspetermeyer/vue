<script setup lang="ts">
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { storeToRefs } from 'pinia'
import { useProjectionStore } from '@/stores/projectionStore'
import { ref, computed } from 'vue'
import type { Fingerprint } from '@/models/data'
import FingerprintItem from './FingerprintItem.vue'

const props = defineProps<{
  fingerprint: Fingerprint
  level: number
}>()

const fingerprintStore = useFingerprintStore()
const { fingerprints, filteredFingerprints } = storeToRefs(fingerprintStore)

const projectionStore = useProjectionStore()
const { projectionInstance, currentParentId } = storeToRefs(projectionStore)

const visibleMiniRings = ref<Set<string>>(new Set())
const editingFingerprintId = ref<string | null>(null)
const editingName = ref('')
const expandedFingerprints = ref<Set<string>>(new Set())

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

function getChildFingerprints(parentId: string): Fingerprint[] {
  return fingerprints.value.filter((fp) => fp.parentId === parentId)
}

function toggleExpand(fingerprintId: string, event: Event) {
  event.stopPropagation()
  if (expandedFingerprints.value.has(fingerprintId)) {
    expandedFingerprints.value.delete(fingerprintId)
  } else {
    expandedFingerprints.value.add(fingerprintId)
  }
}

function isExpanded(fingerprintId: string): boolean {
  return expandedFingerprints.value.has(fingerprintId)
}

function hasChildren(fingerprintId: string): boolean {
  return fingerprints.value.some((fp) => fp.parentId === fingerprintId)
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
  <li
    :class="{
      'fingerprint-item': true,
      active: isSelected(fingerprint.id),
      'child-fingerprint': level > 0,
    }"
    @click.stop="toggleSelection(fingerprint)"
  >
    <div class="flex items-center justify-between">
      <div class="fingerprint-info">
        <div class="flex items-center gap-2">
          <!-- Expand/Collapse button -->
          <button
            v-if="hasChildren(fingerprint.id)"
            class="expand-btn"
            @click="toggleExpand(fingerprint.id, $event)"
          >
            {{ isExpanded(fingerprint.id) ? '▼' : '►' }}
          </button>
          <div v-else class="expand-placeholder"></div>

          <div class="color-indicator" :style="{ backgroundColor: getColor(fingerprint) }"></div>

          <!-- Edit name field -->
          <div
            v-if="editingFingerprintId === fingerprint.id"
            class="edit-name-container"
            @click.stop
          >
            <input v-model="editingName" class="edit-name-input" @keydown="handleKeyDown" />
            <div class="edit-actions">
              <button class="edit-btn save-btn" @click="saveEdit" title="Save">✓</button>
              <button class="edit-btn cancel-btn" @click="cancelEdit" title="Cancel">✕</button>
            </div>
          </div>
          <span v-else class="fingerprint-name">{{ fingerprint.name }}</span>
        </div>
        <span class="feature-count">Points: {{ fingerprint.projectedPoints.length }}</span>
      </div>

      <div class="flex gap-1">
        <!-- Control buttons -->
        <button
          v-if="editingFingerprintId !== fingerprint.id"
          class="edit-name-btn"
          @click="startEditing(fingerprint, $event)"
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
          :class="{ 'glyph-active': isMiniRingVisible(fingerprint.id) }"
          @click="toggleMiniRing(fingerprint.id, $event)"
          :title="isMiniRingVisible(fingerprint.id) ? 'Hide glyph' : 'Show glyph'"
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
          @click="removeFingerprint(fingerprint.id, $event)"
          title="Remove fingerprint"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Recursively render children -->
    <ul v-if="isExpanded(fingerprint.id)" :class="`nested-fingerprints nested-level-${level + 1}`">
      <FingerprintItem
        v-for="childFp in getChildFingerprints(fingerprint.id)"
        :key="childFp.id"
        :fingerprint="childFp"
        :level="level + 1"
      />
    </ul>
  </li>
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

.glyph-active {
  background-color: #d8d8ff;
}

.expand-btn {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  font-size: 10px;
  cursor: pointer;
  color: #666;
  border-radius: 2px;
}

.expand-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.expand-placeholder {
  width: 16px;
}

.nested-fingerprints {
  padding-left: 16px;
  margin-top: 4px;
  border-left: 1px dashed #ddd;
  margin-left: 6px;
}

.nested-level-2 {
  margin-left: 2px;
}

.child-fingerprint,
.grandchild-fingerprint {
  position: relative;
}

.child-fingerprint:before,
.grandchild-fingerprint:before {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  width: 10px;
  height: 1px;
  background-color: #ddd;
}
</style>
