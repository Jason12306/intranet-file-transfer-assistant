import { buildSync } from "esbuild";
import fs from "fs-extra";

const isPord = process.env.NODE_ENV === "production";
const isMac = process.platform === "darwin";

const inputDir = "src/main";
const outdir = "output/dist/main";

fs.removeSync(outdir);

function recursionFiles(entryPoint) {
  const stat = fs.statSync(entryPoint);
  const files = [];
  if (stat.isDirectory()) {
    const children = fs.readdirSync(entryPoint);
    children.forEach((child) => {
      files.push(...recursionFiles(`${entryPoint}/${child}`));
    });
  } else {
    files.push(entryPoint);
  }
  return files;
}
// 需要编译的 .ts 文件
const entryPoints = [];
// 需要 copy 的文件
const copyFiles = [];

recursionFiles(inputDir).forEach((file) => {
  if (/\.ts$/.test(file) && !/\.d\.ts$/.test(file)) {
    entryPoints.push(file);
  } else {
    copyFiles.push(file);
  }
});

buildSync({
  entryPoints,
  outdir,
  format: "cjs",
  minify: isPord,
  sourcemap: isPord ? false : "linked",
});

// const inputDir = "src/main";
// const outdir = "output/dist/main";

// fs.copyFileSync(
//   `src/config/config.json`,
//   `${outdir}/config/config.json`
// );

/* fs.copyFileSync(
  `${inputDir}/config/config.json`,
  `${outdir}/config/config.json`
);

fs.copyFileSync(
  `${inputDir}/config/_config_template.json`,
  `${outdir}/config/_config_template.json`
); */
