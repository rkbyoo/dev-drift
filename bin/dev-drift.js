const fs = require("fs");
const path = require("path");
const { collectSnapshot } = require("../src/snapshot");
const { compareSnapshots } = require("../src/compare");
const { report } = require("../src/reporter");

const command = process.argv[2];

const projectRoot = process.cwd();
const driftDir = path.join(projectRoot, ".dev-drift");
const baselinePath = path.join(driftDir, "baseline.json");

if (command === "init") {
  if (fs.existsSync(baselinePath)) {
    console.error("dev-drift already initialized");
    process.exit(1);
  }

  fs.mkdirSync(driftDir, { recursive: true });
  const snapshot = collectSnapshot();

  fs.writeFileSync(
    baselinePath,
    JSON.stringify(snapshot, null, 2),
    "utf-8"
  );

  console.log(" dev-drift initialized.");
  return;
}

if (command === "check") {
  if (!fs.existsSync(baselinePath)) {
    console.error(" dev-drift not initialized.");
    console.error(" Run: dev-drift init");
    process.exit(1);
  }

  const baseline = JSON.parse(
    fs.readFileSync(baselinePath, "utf-8")
  );

  const current = collectSnapshot();
  const drift = compareSnapshots(baseline, current);

  report(drift);
  return;
}

if (command === "reset") {
    if (!fs.existsSync(baselinePath)) {
      console.error(" No baseline to reset.");
      process.exit(1);
    }
  
    fs.unlinkSync(baselinePath);
    console.log(" Baseline reset.");
    console.log(" Run `dev-drift init` to create a new baseline.");
    return;
  }
  

console.error(" Unknown command");
console.error(" Usage: dev-drift init | check | reset");
process.exit(1);
