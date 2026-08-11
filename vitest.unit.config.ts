import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: [
      "server/__tests__/logger.test.ts",
      "server/__tests__/api-security.test.ts",
      "server/__tests__/credit-score.test.ts",
      "server/__tests__/performance-cache.test.ts",
      "server/__tests__/loto-draw-engine.test.ts",
      "server/__tests__/loto-messaging.test.ts",
      "server/__tests__/loto-fraud-rules.test.ts",
      "server/__tests__/loto-fiscal-foundation.test.ts",
      "server/__tests__/loto-credit-pipeline.test.ts",
      "server/__tests__/loto-merchant-credit.test.ts",
      "server/__tests__/npl-recovery-priority.test.ts",
      "client/src/**/__tests__/**/*.test.{ts,tsx}",
    ],
    exclude: ["node_modules", "dist"],
    setupFiles: ["./server/__tests__/unit-env.ts", "./client/src/test-setup.ts"],
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
      "@": path.resolve(__dirname, "client", "src"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
});
