import { buildSync } from "esbuild";

// 配置
buildSync({
  entryPoints: ["electron-vue.config.ts"],
  outdir: "output",
  format: "cjs",
});

buildSync({
  entryPoints: ["src/constants.ts"],
  outdir: "output/dist",
  format: "cjs",
});
