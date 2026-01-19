# Architecture Overview

This document explains the internal structure of dev-drift, how data flows through the system, and the responsibilities of each component.

## High-Level Architecture

dev-drift follows a simple three-stage pipeline:

```
Snapshot → Compare → Report
    ↓         ↓        ↓
 Collect   Analyze   Display
```

### Stage 1: Snapshot Collection
Captures the current state of the project environment into a structured data format.

### Stage 2: Comparison Analysis
Compares two snapshots (baseline vs current) to identify differences.

### Stage 3: Report Generation
Formats and displays the comparison results in a human-readable format.

## Component Breakdown

### CLI Entry Point (`bin/dev-drift.js`)

**Responsibility**: Command routing and high-level orchestration

**Key Functions**:
- Parse command-line arguments
- Route to appropriate command handlers
- Manage baseline file operations
- Handle error cases and user feedback

**Command Flow**:
```javascript
const command = process.argv[2];

switch(command) {
  case 'init':    // Create new baseline
  case 'check':   // Compare against baseline  
  case 'reset':   // Remove baseline
  default:        // Show usage help
}
```

**File Operations**:
- Creates `.dev-drift/` directory
- Reads/writes `baseline.json`
- Manages baseline lifecycle

### Snapshot Module (`src/snapshot.js`)

**Responsibility**: Environmental state collection

**Core Function**: `collectSnapshot()`
Returns a structured object representing the current project state.

**Data Collection Process**:

#### 1. Node.js Version Detection
```javascript
const nodeVersion = process.version;
// Result: "v18.15.0"
```
Uses Node.js built-in `process.version` for exact version string.

#### 2. Package.json Analysis
```javascript
const pkgPath = path.join(projectRoot, "package.json");
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  scripts = pkg.scripts || {};
  dependencies = pkg.dependencies || {};
  devDependencies = pkg.devDependencies || {};
}
```
Safely extracts package.json sections with fallback to empty objects.

#### 3. Environment Variable Key Extraction
```javascript
function collectEnvKeys(projectRoot) {
  const envFiles = [".env", ".env.local", ".env.development", ".env.production"];
  
  for (const file of envFiles) {
    // Parse each file for KEY=value pairs
    // Extract only the KEY portion
    // Store in Set to avoid duplicates
  }
}
```

**Security Design**: Only variable names are collected, never values.

**File Processing Logic**:
- Scans multiple .env file variants
- Parses KEY=value format
- Ignores comments (lines starting with #)
- Handles malformed lines gracefully
- Deduplicates keys across files

#### 4. Folder Structure Analysis
```javascript
const folders = fs
  .readdirSync(projectRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
```
Scans only top-level directories for performance and relevance.

**Output Format**:
```javascript
{
  nodeVersion: "v18.15.0",
  scripts: { "test": "jest", "build": "webpack" },
  dependencies: { "express": "^4.18.0" },
  devDependencies: { "jest": "^29.0.0" },
  envKeys: ["API_KEY", "DATABASE_URL"],
  folders: [".git", "node_modules", "src"]
}
```

### Comparison Module (`src/compare.js`)

**Responsibility**: Snapshot difference analysis

**Core Function**: `compareSnapshots(oldSnap, newSnap)`
Returns an object describing all detected differences.

**Comparison Algorithms**:

#### Array Difference Detection
```javascript
function diffArrays(oldArr = [], newArr = []) {
  return {
    added: newArr.filter((x) => !oldArr.includes(x)),
    removed: oldArr.filter((x) => !newArr.includes(x)),
  };
}
```
Used for environment variables and folder lists.

#### Object Change Detection
```javascript
function diffObjects(oldObj = {}, newObj = {}) {
  const changed = [];
  
  for (const key of Object.keys(oldObj)) {
    if (!(key in newObj)) continue;  // Skip removed keys
    if (oldObj[key] !== newObj[key]) {
      changed.push(key);
    }
  }
  
  return changed;
}
```
Used for package.json scripts where we care about value changes, not additions/removals.

**Comparison Logic**:

#### Node.js Version
```javascript
if (oldSnap.nodeVersion !== newSnap.nodeVersion) {
  result.node = {
    from: oldSnap.nodeVersion,
    to: newSnap.nodeVersion,
  };
}
```
Simple string comparison with before/after tracking.

#### Environment Variables
```javascript
const envDiff = diffArrays(oldSnap.envKeys, newSnap.envKeys);
if (envDiff.added.length || envDiff.removed.length) {
  result.env = envDiff;
}
```
Tracks additions and removals of environment variable names.

#### Folder Structure
```javascript
const folderDiff = diffArrays(oldSnap.folders, newSnap.folders);
if (folderDiff.added.length || folderDiff.removed.length) {
  result.folders = folderDiff;
}
```
Tracks additions and removals of top-level directories.

#### Package.json Scripts
```javascript
const scriptChanges = diffObjects(oldSnap.scripts, newSnap.scripts);
if (scriptChanges.length) {
  result.scripts = scriptChanges;
}
```
Tracks which script values changed (not additions/removals).

**Output Format**:
```javascript
{
  node: { from: "v18.15.0", to: "v20.1.0" },
  env: { 
    added: ["REDIS_URL"], 
    removed: ["OLD_API_KEY"] 
  },
  folders: { 
    added: ["migrations"], 
    removed: ["legacy"] 
  },
  scripts: ["build", "test"]
}
```

### Reporter Module (`src/reporter.js`)

**Responsibility**: Human-readable output formatting

**Core Function**: `report(drift)`
Displays drift information in a structured, readable format.

**Output Logic**:

#### No Drift Case
```javascript
if (keys.length === 0) {
  console.log("✓ No drift detected.");
  return;
}
```

#### Drift Detection Header
```javascript
console.log("Drift detected:\n");
```

#### Node.js Version Changes
```javascript
if (drift.node) {
  console.log(`Node version changed: ${drift.node.from} → ${drift.node.to}`);
}
```

#### Environment Variable Changes
```javascript
if (drift.env) {
  if (drift.env.added.length) {
    console.log("Env variable added:", drift.env.added.join(", "));
  }
  if (drift.env.removed.length) {
    console.log("Env variable removed:", drift.env.removed.join(", "));
  }
}
```

#### Folder Structure Changes
```javascript
if (drift.folders) {
  if (drift.folders.added.length) {
    console.log("Folders were added:", drift.folders.added.join(", "));
  }
  if (drift.folders.removed.length) {
    console.log("Folders were removed:", drift.folders.removed.join(", "));
  }
}
```

#### Script Changes
```javascript
if (drift.scripts) {
  console.log("Scripts is changed:", drift.scripts.join(", "));
}
```

## Data Flow Diagram

```
┌─────────────────┐
│   User Input    │
│  (CLI Command)  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Command Router │
│ (bin/dev-drift) │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐
│  Snapshot       │    │  Baseline       │
│  Collection     │    │  Storage        │
│ (src/snapshot)  │◄──►│ (.dev-drift/    │
└─────────┬───────┘    │  baseline.json) │
          │            └─────────────────┘
          ▼
┌─────────────────┐
│  Comparison     │
│  Analysis       │
│ (src/compare)   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Report         │
│  Generation     │
│ (src/reporter)  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Console        │
│  Output         │
└─────────────────┘
```

## File System Interactions

### Directory Structure
```
project-root/
├── .dev-drift/
│   └── baseline.json     # Snapshot storage
├── .env                  # Environment variables (read-only)
├── .env.local           # Environment variables (read-only)
├── .env.development     # Environment variables (read-only)
├── .env.production      # Environment variables (read-only)
├── package.json         # Scripts and dependencies (read-only)
└── [folders...]         # Top-level directories (scanned)
```

### Read Operations
- **package.json**: Extract scripts, dependencies, devDependencies
- **.env files**: Parse for environment variable keys
- **Project root**: List top-level directories
- **baseline.json**: Load previous snapshot for comparison

### Write Operations
- **.dev-drift/baseline.json**: Store snapshot data
- **.dev-drift/ directory**: Create if doesn't exist

### Security Considerations
- Only reads environment variable names, never values
- No modification of existing project files
- Baseline file contains no sensitive information
- Safe to commit baseline.json to version control

## Error Handling Strategy

### Graceful Degradation
```javascript
// Package.json handling
if (fs.existsSync(pkgPath)) {
  // Process package.json
} else {
  // Continue with empty objects
  scripts = {};
  dependencies = {};
  devDependencies = {};
}
```

### Input Validation
```javascript
// Environment file parsing
content.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;  // Skip invalid lines
  
  const [key] = trimmed.split("=");
  if (key) keys.add(key.trim());  // Only add valid keys
});
```

### File System Safety
```javascript
// Directory creation
fs.mkdirSync(driftDir, { recursive: true });  // Won't fail if exists

// File existence checks
if (!fs.existsSync(baselinePath)) {
  console.error("dev-drift not initialized.");
  process.exit(1);
}
```

## Performance Characteristics

### Time Complexity
- **Snapshot collection**: O(n) where n = number of top-level folders + environment variables
- **Comparison**: O(m) where m = number of items in both snapshots
- **Reporting**: O(k) where k = number of detected differences

### Space Complexity
- **Memory usage**: O(s) where s = size of snapshot data (typically < 1KB)
- **Disk usage**: One JSON file per project (typically < 1KB)

### Scalability Limits
- **Folder count**: Scans only top-level directories for performance
- **Environment variables**: Limited by .env file size (typically small)
- **Dependencies**: Limited by package.json size (typically reasonable)

## Extension Points

### Adding New Snapshot Data
To monitor additional environmental factors:

1. **Extend collectSnapshot()** in `src/snapshot.js`
2. **Add comparison logic** in `src/compare.js`
3. **Update reporting** in `src/reporter.js`

Example - adding Git branch tracking:
```javascript
// In collectSnapshot()
const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {encoding: 'utf8'}).trim();

// In compareSnapshots()
if (oldSnap.gitBranch !== newSnap.gitBranch) {
  result.git = {
    from: oldSnap.gitBranch,
    to: newSnap.gitBranch
  };
}

// In report()
if (drift.git) {
  console.log(`Git branch changed: ${drift.git.from} → ${drift.git.to}`);
}
```

### Custom Output Formats
The reporter module can be extended to support different output formats:
- JSON output for CI integration
- XML output for build systems
- Structured logging for monitoring systems

### Configuration Options
Future versions could add configuration files to:
- Exclude specific folders from monitoring
- Customize environment file locations
- Set custom baseline file locations
- Configure output verbosity levels