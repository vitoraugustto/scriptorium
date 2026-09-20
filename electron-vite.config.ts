import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    build: {
      // 0 keeps audio (and every other asset) as separate files rather than
      // base64 inside the JS bundle
      assetsInlineLimit: 0,
      rollupOptions: {
        input: 'src/renderer/index.html',
      },
    },
  },
});
