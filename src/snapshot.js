const fs = require("fs");
const path = require("path");

// collecting env variables only from the .env file
function collectEnvKeys(projectRoot) {
  const envFiles = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
  ];

  const keys = new Set();

  for (const file of envFiles) {
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf-8");

    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const [key] = trimmed.split("=");
      if (key) keys.add(key.trim());
    });
  }

  return Array.from(keys).sort();
}

function collectSnapshot() {
  const projectRoot = process.cwd();

  // Node version
  const nodeVersion = process.version;

  //  package.json
  const pkgPath = path.join(projectRoot, "package.json");
  let scripts = {};
  let dependencies = {};
  let devDependencies = {};

  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

    scripts = pkg.scripts || {};
    dependencies = pkg.dependencies || {};
    devDependencies = pkg.devDependencies || {};
  }

  //  Environment variable keys from .env files only
  const envKeys = collectEnvKeys(projectRoot);

  //  Top level folders
  const folders = fs
    .readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return {
    nodeVersion,
    scripts,
    dependencies,
    devDependencies,
    envKeys,
    folders,
  };
}

module.exports = {
  collectSnapshot,
};
