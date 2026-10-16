import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import babelPlugin from "@rolldown/plugin-babel"

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: { port: 3000, forwardConsole: true },
  preview: { port: 4173 },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babelPlugin({ presets: [reactCompilerPreset()] }),
  ],
})

export default config
