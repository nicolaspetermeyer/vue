import { defineStore } from 'pinia'
import axios from 'axios'

interface PCAData {
  id: string
  PC1: number
  PC2: number
}

export const useDataStore = defineStore('dataStore', {
  state: () => ({
    fileData: [] as any[], // Holds the data from the CSV file
    pcaData: {} as PCAData[], // Holds PCA axes values
    loading: false,
    error: null as string | null,
  }),
  getters: {
    getPCData: (state) => state.pcaData,
  },
  actions: {
    async fetchData(file: string) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/datasets/${file}`)
        this.fileData = response.data
      } catch (error: any) {
        this.error = error.response?.data?.detail || error.message
      } finally {
        this.loading = false
      }
    },
    async fetchPCAData(file: string) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/projection/${file}`)
        this.pcaData = response.data
        console.log('TEST' + response.data)
      } catch (error: any) {
        this.error = error.response?.data?.detail || error.message
      } finally {
        this.loading = false
      }
    },
  },
})
