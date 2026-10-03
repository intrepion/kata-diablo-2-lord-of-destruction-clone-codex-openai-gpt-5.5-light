import { build } from "esbuild";

await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "iife",
  target: "es2020",
  outfile: "game.js",
  sourcemap: false,
  loader: {
    ".css": "css"
  }
});
