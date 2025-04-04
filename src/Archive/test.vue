<template>
  <div>
    <svg></svg>
  </div>
</template>

<!-- <script>
import * as d3 from 'd3'

export default {
  name: 'ScatterPlot',
  props: {
    data: {
      type: Array,
      required: true,
    },
  },
  computed: {
    formattedData() {
      const pcaData = Array.isArray(this.data) ? this.data : Object.values(this.data)
      if (!pcaData || pcaData.length < 2) return []
      const pc1 = pcaData.find((d) => d.component === 'PC1') || pcaData[0]
      const pc2 = pcaData.find((d) => d.component === 'PC2') || pcaData[1]
      const points = []
      // Iterate over the keys in PC1 (skip "component")
      Object.keys(pc1).forEach((key) => {
        if (key !== 'component') {
          points.push({
            x: +pc1[key],
            y: +pc2[key],
          })
        }
      })
      return points
    },
  },
  mounted() {
    this.drawChart()
  },
  watch: {
    data: {
      handler() {
        this.updateChart()
      },
      deep: true,
    },
  },
  methods: {
    drawChart() {
      const data = this.formattedData
      console.log(data)
      const margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom

      // Create the SVG container
      const svg = d3
        .select(this.$refs.chart)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

      var x = d3.scaleLinear().domain([-5, 5]).range([0, width])
      svg
        .append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x))

      var y = d3.scaleLinear().domain([-5, 5]).range([height, 0])
      svg.append('g').call(d3.axisLeft(y))

      // Plot the points
      svg
        .append('g')
        .selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', (d) => x(d.x))
        .attr('cy', (d) => y(d.y))
        .attr('r', 4)
        .attr('fill', '#69b3a2')
    },
    updateChart() {
      // Clear existing svg and redraw chart on data change
      d3.select(this.$refs.scatter).select('svg').remove()
      this.drawChart()
    },
  },
}
</script> -->

<!-- <script>
import * as d3 from 'd3'
const data = [
  { x: 1, y: -2.5 },
  { x: 1.58, y: 5.399825024885481 },
  { x: -2.6082146162478343, y: -0.5862314500607775 },
  { x: 0.40426827054947795, y: -2.6096472291263466 },
]

// set the dimensions and margins of the graph
const margin = { top: 10, right: 30, bottom: 30, left: 60 },
  width = 460 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom

// append the svg object to the body of the page
const svg = d3
  .select()
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

// Add X axis
const x = d3.scaleLinear().domain([0, 10]).range([0, width])
svg
  .append('g')
  .attr('transform', 'translate(0,' + height + ')')
  .call(d3.axisBottom(x))

// Add Y axis
const y = d3.scaleLinear().domain([0, 10]).range([height, 0])
svg.append('g').call(d3.axisLeft(y))

// Add dots
svg
  .append('g')
  .selectAll('dot')
  .data(data)
  .enter()
  .append('circle')
  .attr('cx', (data) => data.x)
  .attr('cy', (data) => data.y)
  .attr('r', 1.5)
  .style('fill', '#69b3a2')
</script> -->

<script>
import * as d3 from 'd3'

const data = [
  { date: "24-Apr-07", amount: 93.24 },
  { date: "25-Apr-07", amount: 95.35 },
  { date: "26-Apr-07", amount: 98.84 },
  { date: "27-Apr-07", amount: 99.92 },
  { date: "30-Apr-07", amount: 99.8 },
  { date: "1-May-07", amount: 99.47 },
  { date: "2-May-07", amount: 100.39 },
  { date: "3-May-07", amount: 100.4 },
  { date: "4-May-07", amount: 100.81 },
  { date: "7-May-07", amount: 103.92 },
  { date: "8-May-07", amount: 105.06 },
  { date: "9-May-07", amount: 106.88 },
  { date: "10-May-07", amount: 107.34 },
];

mounted() {
  this.drawChart()
},
mounted() {
  const width = 800;
  const height = 500;
  const svg = d3.select("svg").attr("width", width).attr("height", height);
  const g = svg.append("g");
},
</script>

<style scoped>
/* Optional styling for the chart container */
</style>
