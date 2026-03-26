import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
        exclude: ["tests/**", "node_modules/**", "dist/**"],
        environment: "jsdom",
        globals: true,
        setupFiles: "./src/test/setupTests.js",
        css: true,
    },
});
