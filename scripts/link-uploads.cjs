const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const sourceDir = path.join(projectRoot, "public", "uploads");
const targetDir = path.join(projectRoot, ".output", "public", "uploads");

function main() {
  const outputPublicDir = path.dirname(targetDir);

  if (!fs.existsSync(outputPublicDir)) {
    console.error("Build output directory was not found:", outputPublicDir);
    process.exit(1);
  }

  if (!fs.existsSync(sourceDir)) {
    fs.mkdirSync(sourceDir, { recursive: true });
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.symlinkSync(path.relative(outputPublicDir, sourceDir), targetDir, "dir");

  console.log(`Linked ${targetDir} -> ${sourceDir}`);
}

main();
