import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import checker from 'vite-plugin-checker'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command }) => {
  const plugins: PluginOption[] = [
    vue(),
    vueDevTools(),
    checker({
      vueTsc: true,
      enableBuild: false,
      overlay: { initialIsOpen: 'error', position: 'br' },
    }),
  ]

  if (command === 'build') {
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
    )
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1600,
    },
  }
})
