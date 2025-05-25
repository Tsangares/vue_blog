import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Replace 'your-repo-name' with your actual GitHub repository name
export default defineConfig({
  plugins: [vue()],
  base: '/vue_blog/', // IMPORTANT: Change this to your repo name
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})