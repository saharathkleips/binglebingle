/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { playwright } from "@vitest/browser-playwright";

const plugins = [react(), babel({ presets: [reactCompilerPreset()] })];

export default defineConfig({
  base: "/binglebingle/",
  plugins,
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/**"],
      exclude: ["src/lib/**/*.md"],
      thresholds: {
        statements: 98,
        functions: 100,
        lines: 99,
        branches: 95,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          globals: true,
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest-browser.setup.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
