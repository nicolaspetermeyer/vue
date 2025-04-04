import { defineStore } from 'pinia'
import axios from 'axios'

export const useFileStore = defineStore('fileStore', {
  state: () => ({
    files: [],
  }),
  getters: {
    getFiles: (state) => state.files,
  },
  actions: {
    async fetchFiles() {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/datasets/')
        this.files = response.data
      } catch (error) {
        alert(error)
        console.error('Error fetching files:', error)
      }
    },
  },
})
