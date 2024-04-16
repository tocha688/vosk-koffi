import { defineConfig } from "tsup";

export default defineConfig((options) => ({
    entry: ["src/index.ts"],
    outDir: "dist",
    target: "node12",
    format: ["cjs", "esm"],
    clean: true,
    splitting: false,
    minify: !options.watch,
    dts: options.watch ? false : { resolve: true },
}));
