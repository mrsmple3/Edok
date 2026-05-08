const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const sourceDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(projectRoot, "..", "uploads");
const targetDir = path.join(projectRoot, ".output", "public", "uploads");

function main() {
  const outputPublicDir = path.dirname(targetDir);

  if (!fs.existsSync(outputPublicDir)) {
    console.error("Build output directory was not found:", outputPublicDir);
    process.exit(1);
  }

  fs.mkdirSync(sourceDir, { recursive: true });

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.symlinkSync(path.relative(outputPublicDir, sourceDir), targetDir, "dir");

  console.log(`Linked ${targetDir} -> ${sourceDir}`);
}

main();
