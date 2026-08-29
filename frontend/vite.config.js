import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import process from 'node:process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const configuredApiUrl = env.VITE_API_URL?.trim()

  if (command === 'build') {
    if (!configuredApiUrl) {
      throw new Error('VITE_API_URL is required for a production build')
    }

    const apiUrl = new URL(configuredApiUrl)
    if (!['http:', 'https:'].includes(apiUrl.protocol)) {
      throw new Error('VITE_API_URL must use http or https')
    }
    if (
      process.env.VERCEL &&
      ['localhost', '127.0.0.1', '::1'].includes(apiUrl.hostname)
    ) {
      throw new Error('VITE_API_URL cannot point to localhost on Vercel')
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
