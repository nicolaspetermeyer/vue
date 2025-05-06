<script setup lang="ts">
import FingerprintList from '@/components/FingerprintList.vue'
</script>

<template>
  <div class="panel">
    <div class="flex flex-col gap-2">
      <h2 class="text-xl font-bold">Fingerprints</h2>
      <FingerprintList />
      <!-- <ul class="fingerprint-list space-y-2">
        <li
          v-for="fingerprint in fingerprints"
          :key="fingerprint.id"
          :class="{ selected: selectedFingerprint?.id === fingerprint.id }"
          @click="selectFingerprint(fingerprint)"
          class="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer bg-white shadow-sm"
        >
          <span>{{ fingerprint.name }}</span>

          📊 Summary block 
          <div class="text-sm text-gray-600 mt-1">
            <div>Points: {{ fingerprint.projectedPoints.length }}</div>
            <div>
              Top Features:
              <span
                v-for="(key, i) in getTopFeatures(fingerprint.localStats)"
                :key="key"
                class="inline-block bg-gray-200 px-1.5 py-0.5 rounded text-xs mr-1"
              >
                {{ key }}
              </span>
            </div>
          </div>
          <button
            class="text-black-500 hover:text-red-700 text-sm ml-2"
            @click.stop="deleteFingerprint(fingerprint.id)"
            title="Delete Fingerprint"
          >
            del ❌
          </button>
        </li>
      </ul> -->
    </div>
  </div>
</template>

<style scoped>
.panel {
  padding: 1rem;
  background: #f1f1f1;
}

.fingerprint-list li.selected {
  background-color: #d1e3ff;
  font-weight: bold;
}
</style>
