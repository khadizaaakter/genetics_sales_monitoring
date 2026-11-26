import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  base: "/genetics_sales_monitoring/",
  build: {
    rollupOptions: {
      output: {
        // Big libraries in their own files: the browser caches them across
        // deploys and downloads them in parallel with the app code.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/](echarts|zrender|vue-echarts)[\\/]/.test(id)) return "echarts";
          if (/[\\/](ant-design-vue|@ant-design)[\\/]/.test(id)) return "antd";
          if (/[\\/](xlsx|file-saver)[\\/]/.test(id)) return "xlsx";
          if (/[\\/](vue|@vue|vue-router|pinia)[\\/]/.test(id)) return "vue";
        },
      },
    },
  },
});
