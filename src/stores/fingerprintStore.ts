import { defineStore } from 'pinia'
import { calcFingerprintStats } from '@/utils/calcFingerprintStats'
import type { Fingerprint, Projection, FeatureStats, FingerprintFeatureStat } from '@/models/data'
import { ref } from 'vue'
import { useDataStore } from '@/stores/dataStore'

export const useFingerprintStore = defineStore('fingerprintStore', () => {
  //STATE
  const fingerprints = ref<Fingerprint[]>([])
  const fingerprintCounter = ref(1)

  const selectedProjections = ref<Projection[]>([])
  const selectedFingerprint = ref<Fingerprint | null>(null)
  const globalStats = useDataStore().globalStats

  //ACTIONS
  function setSelectedProjections(points: Projection[]) {
    selectedProjections.value = points
  }
  function addFingerprint() {
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
  return {
    fingerprints,
    selectedFingerprint,
    setSelectedProjections,
    addFingerprint,
    removeFingerprint,
    clearFingerprints,
    setSelectedFingerprint,
    clearSelectedFingerprint,
  }
})
