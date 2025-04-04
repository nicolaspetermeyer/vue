<template>
  <div class="data-table-container">
    <table v-if="data && data.length">
      <thead>
        <tr>
          <th v-for="header in headers" :key="header">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in data" :key="rowIndex">
          <td v-for="header in headers" :key="header">{{ row[header] }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else>No data available.</div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'

const props = defineProps<{
  data: Record<string, any>[]
}>()

// Compute headers dynamically from the first row if data exists.
const headers = computed(() => {
  return props.data && props.data.length > 0 ? Object.keys(props.data[0]) : []
})
</script>

<style scoped>
.data-table.container {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 400px;
  margin-top: 1rem;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f5f5f5;
}
</style>
