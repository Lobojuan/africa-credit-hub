import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: [
      "server/__tests__/**/*.test.ts",
      "client/src/**/__tests__/**/*.test.{ts,tsx}",
    ],
    exclude: ["node_modules", "dist", "server/__tests__/cross-product-gateway.test.ts"],
    setupFiles: ["./client/src/test-setup.ts"],
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
      "@": path.resolve(__dirname, "client", "src"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
});
