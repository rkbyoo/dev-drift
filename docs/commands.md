# Command Reference

This document provides detailed information about each dev-drift command, including usage patterns, expected behavior, and common troubleshooting scenarios.

## dev-drift init

### Purpose

Creates a baseline snapshot of your project's current environmental state. This snapshot serves as the reference point for all future drift detection.

### Usage

```bash
dev-drift init
```

### Behavior

1. **Checks for existing baseline**: If a baseline already exists, the command fails with an error
2. **Creates .dev-drift directory**: Creates the hidden folder if it doesn't exist
3. **Captures current state**: Collects information about:
   - Node.js version (`process.version`)
   - Package.json scripts, dependencies, and devDependencies
   - Environment variable keys from .env files
   - Top-level project folders
4. **Writes baseline.json**: Saves the snapshot in JSON format

### Success Output

```
✓ dev-drift initialized.
```

### Error Scenarios

**Already initialized:**
```bash
$ dev-drift init
dev-drift already initialized
```
**Exit code**: 1

**Solution**: Use `dev-drift reset` first, or delete `.dev-drift/baseline.json` manually

### What Gets Captured

#### Node.js Version
```json
{
  "nodeVersion": "v18.15.0"
}
```
Captures the exact version string from `process.version`.

#### Package.json Scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "webpack --mode production",
    "test": "jest"
  }
}
```
Only captures scripts that exist in package.json. Empty scripts object if no package.json exists.

#### Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "webpack": "^5.74.0"
  }
}
```
Captures exact dependency objects from package.json.

#### Environment Variable Keys
```json
{
  "envKeys": [
    "API_KEY",
    "DATABASE_URL",
    "PORT"
  ]
}
```
Scans these files in order:
- `.env`
- `.env.local`
- `.env.development`
- `.env.production`

**Important**: Only variable names are stored, never values.

#### Project Folders
```json
{
  "folders": [
    ".git",
    "node_modules",
    "src",
    "tests"
  ]
}
```
Lists all top-level directories, sorted alphabetically.

### Best Practices

**When to initialize:**
- Project is working correctly
- All tests are passing
- Environment is properly configured
- After successful deployment

**What to check before initializing:**
- Verify Node.js version is correct for your project
- Ensure all required environment variables are defined
- Confirm package.json scripts work as expected
- Test that the project builds and runs successfully

### Common Mistakes

**Initializing with wrong Node.js version:**
```bash
# Wrong - using system Node.js
dev-drift init

# Right - using project-specific Node.js
nvm use 18
dev-drift init
```

**Initializing with incomplete environment:**
```bash
# Wrong - missing environment variables
dev-drift init

# Right - after setting up complete environment
cp .env.example .env
# Edit .env with actual values
dev-drift init
```

## dev-drift check

### Purpose

Compares the current project state against the stored baseline and reports any detected drift.

### Usage

```bash
dev-drift check
```

### Behavior

1. **Verifies baseline exists**: Fails if no baseline.json is found
2. **Captures current state**: Uses the same collection logic as `init`
3. **Compares snapshots**: Identifies differences between baseline and current state
4. **Reports results**: Shows detailed information about any detected drift

### Success Output (No Drift)

```
✓ No drift detected.
```

### Success Output (Drift Detected)

```
Drift detected:

Node version changed: v18.15.0 → v20.1.0
Env variable added: REDIS_URL, CACHE_TTL
Env variable removed: LEGACY_API_KEY
Folders were added: migrations, scripts
Folders were removed: old-components
Scripts is changed: build, deploy
```

### Error Scenarios

**Not initialized:**
```bash
$ dev-drift check
✗ dev-drift not initialized.
✗ Run: dev-drift init
```
**Exit code**: 1

**Solution**: Run `dev-drift init` first

### Drift Detection Details

#### Node.js Version Changes
```
Node version changed: v18.15.0 → v20.1.0
```
Triggered when `process.version` differs from baseline.

**Common causes:**
- System Node.js upgrade
- Switching between Node.js versions
- Different Node.js version in CI/production

#### Environment Variable Changes
```
Env variable added: NEW_API_KEY, FEATURE_FLAG
Env variable removed: OLD_DATABASE_URL
```
Compares environment variable keys found in .env files.

**Common causes:**
- Adding new configuration options
- Removing deprecated settings
- Renaming environment variables
- Changes to .env file structure

#### Folder Structure Changes
```
Folders were added: migrations, docs
Folders were removed: legacy-code
```
Compares top-level directory listings.

**Common causes:**
- Project reorganization
- Adding new feature directories
- Removing unused code
- Build process changes

#### Script Changes
```
Scripts is changed: build, test, deploy
```
Detects when package.json script values differ from baseline.

**Common causes:**
- Build process improvements
- Test configuration changes
- Deployment script updates
- Tool upgrades requiring new flags

### Interpreting Results

#### No Action Required
Some drift is expected and doesn't require action:
- Intentional Node.js upgrades
- Planned project restructuring
- Deliberate script improvements

#### Investigation Required
Some drift indicates potential problems:
- Unexpected Node.js version changes
- Missing environment variables
- Unintentional folder removal
- Script modifications that break functionality

#### Update Baseline
After verifying that drift is intentional and working:
```bash
dev-drift reset
dev-drift init
```

### Integration Examples

#### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit
dev-drift check
if [ $? -ne 0 ]; then
    echo "Drift detected. Review changes before committing."
    exit 1
fi
```

#### CI Pipeline
```yaml
# .github/workflows/test.yml
- name: Check for drift
  run: |
    dev-drift check
    if [ $? -ne 0 ]; then
      echo "::warning::Project drift detected"
    fi
```

#### Development Workflow
```bash
# Daily development routine
git pull origin main
dev-drift check  # Verify environment consistency
npm install      # Update dependencies if needed
npm test         # Run tests
```

## dev-drift reset

### Purpose

Removes the current baseline snapshot, requiring re-initialization before drift checking can resume.

### Usage

```bash
dev-drift reset
```

### Behavior

1. **Checks for existing baseline**: Fails if no baseline.json exists
2. **Removes baseline file**: Deletes `.dev-drift/baseline.json`
3. **Provides next steps**: Reminds user to run `init` again

### Success Output

```
✓ Baseline reset.
✓ Run `dev-drift init` to create a new baseline.
```

### Error Scenarios

**No baseline to reset:**
```bash
$ dev-drift reset
✗ No baseline to reset.
```
**Exit code**: 1

**Solution**: No action needed, or run `dev-drift init` if you want to create a baseline

### When to Use Reset

#### Intentional Environment Changes
After making deliberate changes that should become the new baseline:
```bash
# Upgrade Node.js version
nvm install 20
nvm use 20

# Verify everything works
npm test
npm run build

# Update baseline
dev-drift reset
dev-drift init
```

#### Project Restructuring
After reorganizing project structure:
```bash
# Move folders around
mv src/components src/ui
mv src/utils src/helpers

# Update imports and references
# Test everything works

# Update baseline
dev-drift reset
dev-drift init
```

#### Environment Variable Changes
After adding or removing environment variables:
```bash
# Add new variables to .env
echo "REDIS_URL=redis://localhost:6379" >> .env
echo "CACHE_TTL=3600" >> .env

# Update application code to use new variables
# Test functionality

# Update baseline
dev-drift reset
dev-drift init
```

### Reset vs Manual Deletion

Both approaches work, but `reset` is recommended:

```bash
# Recommended
dev-drift reset
dev-drift init

# Also works, but less explicit
rm .dev-drift/baseline.json
dev-drift init
```

### Common Workflows

#### Feature Branch Workflow
```bash
# Start feature work
git checkout -b feature/new-api

# Make changes that require new environment variables
echo "NEW_API_KEY=test" >> .env

# Complete feature development and testing
npm test

# Update baseline for the feature
dev-drift reset
dev-drift init

# Commit changes including new baseline
git add .dev-drift/baseline.json
git commit -m "Add new API integration with environment setup"
```

#### Environment Synchronization
```bash
# Pull latest changes
git pull origin main

# Check for drift
dev-drift check

# If drift is expected (e.g., new environment variables added)
# Update local environment
cp .env.example .env
# Edit .env with appropriate values

# Reset and reinitialize
dev-drift reset
dev-drift init
```

## Error Handling and Troubleshooting

### Permission Errors

**Problem**: Cannot create .dev-drift directory
```bash
$ dev-drift init
Error: EACCES: permission denied, mkdir '.dev-drift'
```

**Solutions**:
- Check directory permissions: `ls -la`
- Run with appropriate permissions
- Ensure you're in the correct project directory

### Corrupted Baseline

**Problem**: Invalid JSON in baseline.json
```bash
$ dev-drift check
SyntaxError: Unexpected token in JSON
```

**Solutions**:
- Reset and reinitialize: `dev-drift reset && dev-drift init`
- Manually fix JSON syntax errors
- Restore from version control

### Missing Package.json

**Problem**: No package.json in project root
```bash
$ dev-drift init
# Creates baseline with empty scripts/dependencies
```

**Solutions**:
- Ensure you're in the correct project directory
- Create package.json if this is a Node.js project
- dev-drift works without package.json but provides limited value

### Environment File Issues

**Problem**: .env files with syntax errors
```bash
# .env file with invalid syntax
INVALID LINE WITHOUT EQUALS
API_KEY=value
```

**Behavior**: dev-drift skips invalid lines and continues processing

**Solutions**:
- Fix .env file syntax
- Use proper KEY=value format
- Remove or comment invalid lines

### Large Project Performance

**Problem**: Slow performance with many folders
```bash
$ dev-drift check
# Takes several seconds to complete
```

**Solutions**:
- dev-drift only scans top-level folders, so performance should be acceptable
- Consider excluding unnecessary top-level directories
- Performance scales with number of top-level folders, not total project size