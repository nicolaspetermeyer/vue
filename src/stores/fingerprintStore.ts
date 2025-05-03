import { defineStore } from 'pinia'
import { calcFingerprintStats } from '@/utils/calculations/calcFingerprintStats'
import type { Fingerprint, Projection, FeatureStats, FingerprintFeatureStat } from '@/models/data'
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

export type ComparisonMode = 'global' | 'fingerprint'

export const useFingerprintStore = defineStore('fingerprintStore', () => {
  //STATE
  const fingerprints = ref<Fingerprint[]>([])
  const fingerprintCounter = ref(1)

  const selectedProjections = ref<Projection[]>([])
  const selectedFingerprint = ref<Fingerprint | null>(null)
  const globalStats = useDataStore().globalStats

  // Computed property for the selected fingerprint's points
  const selectedFingerprintPoints = computed(() => {
    if (!selectedFingerprint.value) return []
    return selectedFingerprint.value.projectedPoints
  })

  //ACTIONS
  // triggers on brush select
  function setSelectedProjections(points: Projection[]) {
    selectedProjections.value = points
  }

  // on button click computes fingerprint from brush selection
  function addFingerprint() {
    console.log('Adding fingerprint')
    if (selectedProjections.value.length === 0) return

    const originals = selectedProjections.value.map((p) => p.original)

    const localStats = calcFingerprintStats(originals)

    const id = crypto.randomUUID()
    const name = `Fingerprint ${fingerprintCounter.value++}`

    const fingerprint: Fingerprint = {
      id,
      name,
      projectedPoints: [...selectedProjections.value],
      localStats,
    }

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

  function getTopFeatures(stats: Record<string, FingerprintFeatureStat>, limit = 1): string[] {
    return Object.entries(stats)
      .sort(([, a], [, b]) => Math.abs(b.meanDelta) - Math.abs(a.meanDelta)) // sort by deviation
      .slice(0, limit)
      .map(([key]) => key)
  }

  return {
    fingerprints,
    selectedFingerprint,
    selectedFingerprintPoints,
    setSelectedProjections,
    addFingerprint,
    removeFingerprint,
    clearFingerprints,
    setSelectedFingerprint,
    clearSelectedFingerprint,
    getTopFeatures,
  }
})
