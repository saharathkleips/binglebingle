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
      include: ["src/lib/**", "src/components/**", "src/context/**"],
      exclude: ["src/**/*.md", "src/**/*.css"],
      thresholds: {
        "src/lib/**": {
          statements: 98,
          functions: 100,
          lines: 99,
          branches: 95,
        },
        "src/components/**": {
          statements: 90,
          functions: 83,
          lines: 90,
          branches: 85,
        },
        "src/context/**": {
          statements: 90,
          functions: 95,
          lines: 90,
          branches: 85,
        },
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
