<template>
  <svg ref="scatterplot"></svg>
  <h1>{{ JSON.stringify(data) }}</h1>
  <h1>{{ props.data }}</h1>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  data: {
    type: [Array, Object],
    required: true,
  },
})

const scatterplot = ref(null)

// const drawChart = () => {
//   console.log('Props Data:', props.data)
//   if (!props.data || props.data.length === 0) return
//   const dataset = Array.isArray(props.data) ? props.data : Object.values(props.data)
//   console.log('Props Data:', dataset)
//   // Clear any previous drawings
//   d3.select('scatterplot').selectAll('*').remove()
//   const margin = { top: 20, right: 20, bottom: 30, left: 40 }
//   const width = 500 - margin.left - margin.right
//   const height = 400 - margin.top - margin.bottom

//   // Create an SVG group with margins applied
//   const svg = d3
//     .select('scatterplot')
//     .attr('width', width + margin.left + margin.right)
//     .attr('height', height + margin.top + margin.bottom)
//     .append('g')
//     .attr('transform', `translate(${margin.left},${margin.top})`)

//   const x = d3
//     .scaleLinear()
//     .domain(d3.extent(props.data, (d) => d.PC1))
//     .nice()
//     .range([0, width])

//   const y = d3
//     .scaleLinear()
//     .domain(d3.extent(props.data, (d) => d.PC2))
//     .nice()
//     .range([height, 0])

//   // Add the x-axis
//   svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x))

//   // Add the y-axis
//   svg.append('g').call(d3.axisLeft(y))

//   // Plot the scatter points
//   svg
//     .selectAll('circle')
//     .data(dataset)
//     .enter()
//     .append('circle')
//     .attr('cx', (d) => x(d.PC1))
//     .attr('cy', (d) => y(d.PC2))
//     .attr('r', 5)
// }
// onMounted(() => {
//   drawChart()
// })

// Redraw the chart when data changes
// watch(
//   () => props.data,
//   () => {
//     drawChart()
//   },
// )
</script>

<style></style>
