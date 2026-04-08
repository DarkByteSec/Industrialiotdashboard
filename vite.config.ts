import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  base: './',

  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      // في dev mode: بدّل uibuilder بـ stub محلي
      // في build (لـ Node-RED): uibuilder بيتحمّل من الـ HTML مش من npm
      ...(command === 'build' ? {} : {
        'uibuilder': path.resolve(__dirname, './src/app/lib/uibuilder.stub.ts'),
      }),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],

  // لما بنعمل build لـ uibuilder، محتاج نعطّل tree-shaking على uibuilder
  build: {
    rollupOptions: {
      external: [],
    },
  },
}))