<template>
  <div ref="chart"></div>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'RadialBarChart',
  props: {
    data: {
      type: Array,
      required: true,
    },
  },
  mounted() {
    this.createChart()
  },
  watch: {
    data(newData) {
      this.updateChart(newData)
    },
  },
  methods: {
    createChart() {
      const data = this.data
      const margin = { top: 10, right: 10, bottom: 10, left: 10 },
        width = 800 - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom,
        innerRadius = 150,
        outerRadius = Math.min(width, height) / 2 // the outerRadius goes from the middle of the SVG area to the border
      const svg = d3
        .select(this.$refs.chart)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + width / 2 + ',' + (height / 2 + 100) + ')') // Add 100 on Y translation, cause upper bars are longer

      // X scale
      const x = d3
        .scaleBand()
        .range([0, 2 * Math.PI]) // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0) // This does nothing ?
        .domain(data.map((d) => d.name))

      // Y scale
      const y = d3
        .scaleRadial()
        .range([innerRadius, outerRadius]) // Domain will be define later.
        .domain([0, 100]) // Domain of Y is from 0 to the max seen in the data

      // Add bars
      svg
        .append('g')
        .selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('fill', '#69b3a2')
        .attr(
          'd',
          d3
            .arc() // imagine your doing a part of a donut plot
            .innerRadius(innerRadius)
            .outerRadius((d) => y(d.value))
            .startAngle((d) => x(d.name))
            .endAngle((d) => x(d.name) + x.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius),
        )
    },
    updateChart(newData) {
      d3.select(this.$refs.chart).select('svg').remove()
      this.drawChart()
    },
  },
}
</script>
<style scoped>
.bar {
  fill: steelblue;
}
.x-axis path,
.x-axis line,
.y-axis path,
.y-axis line {
  shape-rendering: crispEdges;
}
.x-axis text,
.y-axis text {
  font-size: 12px;
}
</style>
