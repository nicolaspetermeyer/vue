import { defineStore } from 'pinia'
import { computeFingerprintStats } from '@/utils/calcFingerprintStats'
import type { Fingerprint, FingerprintFeatureStat, FeatureStats } from '@/models/data'
import { ref } from 'vue'

export const useFingerprintStore = defineStore('fingerprintStore', () => {
  // 🔹 STATE
  const fingerprints = ref<Fingerprint[]>([])
  const selectedFingerprint = ref<Fingerprint | null>(null)
  const fingerprintStats = ref<Record<string, FingerprintFeatureStat>>({})
  const globalStats = ref<Record<string, FeatureStats>>({})
  const selection = ref<Record<string, number>[]>([]) // array of selected data points

  // 🔹 ACTIONS
  function setSelectedPoints(points: Record<string, number>[]) {
    selection.value = points
  }
  function addFingerprint(fingerprint: Fingerprint) {
    fingerprints.value.push(fingerprint)
  }
  function removeFingerprint(id: string) {
    fingerprints.value = fingerprints.value.filter((f) => f.id !== id)
  }
  function clearFingerprints() {
    fingerprints.value = []
  }
  function setSelectedFingerprint(fingerprint: Fingerprint | null) {
    selectedFingerprint.value = fingerprint
  }
  function clearSelectedFingerprint() {
    selectedFingerprint.value = null
  }
  return {
    fingerprints,
    selectedFingerprint,
    fingerprintStats,
    globalStats,
    selection,
    setSelectedPoints,
    addFingerprint,
    removeFingerprint,
    clearFingerprints,
    setSelectedFingerprint,
    clearSelectedFingerprint,
  }
})
