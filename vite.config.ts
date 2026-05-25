import { defineConfig } from "vite";

export default defineConfig({
  server: {
    open: true,
  },
  optimizeDeps: {
    exclude: ["canvaskit-wasm"], // Предотвращаем пре-бандлинг WASM-обёртки
  },
  assetsInclude: ["**/*.wasm"],
  build: {
    target: "esnext",
    // Указываем пустую строку, чтобы отключить папку 'assets'
    assetsDir: '',
    assetsInlineLimit: 0, // Запрещаем инлайн WASM-файлов
  },
});
