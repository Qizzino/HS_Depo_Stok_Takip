import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Electron file:// protokolu için gerekli
  define: {
    '__APP_VERSION__': JSON.stringify(packageJson.version)
  }
})
