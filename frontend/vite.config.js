import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false
    },
    proxy: {
      '/export': 'http://localhost:8000',
      '/graph': 'http://localhost:8000',
      '/sparql': 'http://localhost:8000',
      '/rdf': 'http://localhost:8000',
      '/owl': 'http://localhost:8000',
      '/ask': 'http://localhost:8000',
      '/brapi': 'http://localhost:8000',
      '/csv-to-rdf': 'http://localhost:8000'
    }
  }
})
