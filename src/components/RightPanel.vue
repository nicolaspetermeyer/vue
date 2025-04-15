<script setup lang="ts">
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { storeToRefs } from 'pinia'

const fingerprintStore = useFingerprintStore()
const { fingerprints } = storeToRefs(fingerprintStore)
</script>

<template>
  <div class="panel">
    <h2>Details / Fingerprints</h2>
    <p>(To be defined)</p>
    <div class="flex flex-col gap-2">
      <h2 class="text-xl font-bold">Fingerprints</h2>
      <ul class="fingerprint-list">
        <li v-for="fingerprint in fingerprints" :key="fingerprint.id">
          {{ fingerprint.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.panel {
  padding: 1rem;
  background: #f1f1f1;
}
</style>
