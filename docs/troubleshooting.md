# Troubleshooting Guide

This document covers common issues, error messages, and solutions when using dev-drift.

## Installation Issues

### Command Not Found

**Problem**:
```bash
$ dev-drift init
'dev-drift' is not recognized as an internal or external command
```

**Cause**: dev-drift is not installed or not in PATH.

**Solutions**:

1. **Verify installation**:
   ```bash
   npm list -g dev-drift
   ```

2. **Install globally** (if using published package):
   ```bash
   npm install -g dev-drift
   ```

3. **Use npm link** (for local development):
   ```bash
   cd /path/to/dev-drift
   npm link
   ```

4. **Check PATH** (Windows):
   ```cmd
   echo %PATH%
   ```
   Ensure npm global bin directory is included.

5. **Use npx** (alternative):
   ```bash
   npx dev-drift init
   ```

### Permission Errors

**Problem**:
```bash
$ dev-drift init
Error: EACCES: permission denied, mkdir '.dev-drift'
```

**Cause**: Insufficient permissions to create directories in current location.

**Solutions**:

1. **Check current directory**:
   ```bash
   pwd
   ls -la
   ```

2. **Verify you're in project root**:
   ```bash
   ls package.json  # Should exist for Node.js projects
   ```

3. **Check directory permissions**:
   ```bash
   ls -la .
   ```

4. **Fix permissions** (if you own the directory):
   ```bash
   chmod 755 .
   ```

5. **Run with appropriate user** (avoid sudo with npm):
   ```bash
   # Fix npm permissions instead
   npm config set prefix ~/.npm-global
   export PATH=~/.npm-global/bin:$PATH
   ```

## Initialization Issues

### Already Initialized

**Problem**:
```bash
$ dev-drift init
dev-drift already initialized
```

**Cause**: A baseline already exists in `.dev-drift/baseline.json`.

**Solutions**:

1. **Check existing baseline**:
   ```bash
   cat .dev-drift/baseline.json
   ```

2. **Reset if you want to reinitialize**:
   ```bash
   dev-drift reset
   dev-drift init
   ```

3. **Use check command instead**:
   ```bash
   dev-drift check
   ```

### Invalid Project Structure

**Problem**: dev-drift initializes but captures unexpected data.

**Symptoms**:
- Empty scripts object when package.json exists
- No environment variables when .env files exist
- Missing folders that should be present

**Debugging Steps**:

1. **Verify current directory**:
   ```bash
   pwd
   ls -la
   ```

2. **Check package.json location**:
   ```bash
   ls package.json
   cat package.json | head -20
   ```

3. **Check .env files**:
   ```bash
   ls .env*
   cat .env | head -10  # Don't show full file (may contain secrets)
   ```

4. **Verify baseline content**:
   ```bash
   cat .dev-drift/baseline.json
   ```

**Common Causes**:
- Running from wrong directory
- Malformed package.json
- Invalid .env file syntax
- Hidden files not visible

## Check Command Issues

### Not Initialized

**Problem**:
```bash
$ dev-drift check
✗ dev-drift not initialized.
✗ Run: dev-drift init
```

**Cause**: No baseline file exists.

**Solutions**:

1. **Initialize first**:
   ```bash
   dev-drift init
   ```

2. **Check if baseline was accidentally deleted**:
   ```bash
   ls -la .dev-drift/
   ```

3. **Verify you're in correct project**:
   ```bash
   pwd
   ls package.json
   ```

### Corrupted Baseline

**Problem**:
```bash
$ dev-drift check
SyntaxError: Unexpected token in JSON at position 45
```

**Cause**: Invalid JSON in baseline.json file.

**Debugging**:

1. **Examine baseline file**:
   ```bash
   cat .dev-drift/baseline.json
   ```

2. **Validate JSON syntax**:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('.dev-drift/baseline.json', 'utf8'))"
   ```

**Solutions**:

1. **Reset and reinitialize**:
   ```bash
   dev-drift reset
   dev-drift init
   ```

2. **Restore from version control**:
   ```bash
   git checkout .dev-drift/baseline.json
   ```

3. **Manually fix JSON** (if you can identify the issue):
   ```bash
   # Edit .dev-drift/baseline.json
   # Common issues: trailing commas, unescaped quotes
   ```

### Always Detecting Drift

**Problem**: `dev-drift check` always reports drift even when nothing changed.

**Symptoms**:
```bash
$ dev-drift check
Drift detected:

Node version changed: v18.15.0 → v18.15.0
```

**Debugging Steps**:

1. **Check Node.js version consistency**:
   ```bash
   node --version
   cat .dev-drift/baseline.json | grep nodeVersion
   ```

2. **Verify environment stability**:
   ```bash
   # Check if .env files are changing
   ls -la .env*
   ```

3. **Check for file system issues**:
   ```bash
   # Verify folder listing is consistent
   ls -1 | sort
   ```

**Common Causes**:

1. **Node.js version switching**:
   ```bash
   # Using nvm or similar tools
   nvm use 18.15.0  # Ensure consistent version
   dev-drift reset
   dev-drift init
   ```

2. **Dynamic .env files**:
   ```bash
   # Build processes modifying .env files
   # Check for automated modifications
   ```

3. **Temporary folders**:
   ```bash
   # Build artifacts creating/removing folders
   # Check .gitignore for temporary directories
   ```

## Environment Variable Issues

### Missing Environment Variables

**Problem**: dev-drift doesn't detect environment variables that exist.

**Debugging**:

1. **Check .env file format**:
   ```bash
   cat .env
   ```
   
   **Valid format**:
   ```
   API_KEY=your-key-here
   DATABASE_URL=postgres://localhost/db
   PORT=3000
   ```
   
   **Invalid format**:
   ```
   API_KEY: your-key-here     # Wrong: uses colon
   export API_KEY=value       # Wrong: includes export
   # API_KEY=value            # Wrong: commented out
   ```

2. **Check supported file names**:
   ```bash
   ls .env .env.local .env.development .env.production
   ```

3. **Verify file contents**:
   ```bash
   # Check for invisible characters
   cat -A .env
   ```

**Solutions**:

1. **Fix .env file format**:
   ```bash
   # Ensure KEY=value format
   # Remove export statements
   # Remove comments from variable lines
   ```

2. **Use supported file names**:
   ```bash
   # Rename custom env files
   mv .env.custom .env.local
   ```

### Environment Variables Not Updating

**Problem**: Changes to .env files not reflected in drift detection.

**Debugging**:

1. **Verify file modification**:
   ```bash
   ls -la .env*
   ```

2. **Check baseline content**:
   ```bash
   cat .dev-drift/baseline.json | grep -A 10 envKeys
   ```

3. **Test current snapshot**:
   ```bash
   # Temporarily rename baseline to see current state
   mv .dev-drift/baseline.json .dev-drift/baseline.json.bak
   dev-drift init
   cat .dev-drift/baseline.json | grep -A 10 envKeys
   mv .dev-drift/baseline.json.bak .dev-drift/baseline.json
   ```

**Solutions**:

1. **Update baseline after intentional changes**:
   ```bash
   dev-drift reset
   dev-drift init
   ```

2. **Verify file encoding**:
   ```bash
   file .env  # Should show ASCII or UTF-8
   ```

## Package.json Issues

### Scripts Not Detected

**Problem**: package.json scripts exist but don't appear in baseline.

**Debugging**:

1. **Verify package.json location**:
   ```bash
   ls package.json
   pwd
   ```

2. **Check JSON validity**:
   ```bash
   node -e "console.log(JSON.parse(require('fs').readFileSync('package.json', 'utf8')).scripts)"
   ```

3. **Examine package.json structure**:
   ```bash
   cat package.json | grep -A 10 '"scripts"'
   ```

**Common Issues**:

1. **Invalid JSON syntax**:
   ```json
   {
     "scripts": {
       "test": "jest",  // Trailing comma causes issues
     }
   }
   ```

2. **Missing scripts section**:
   ```json
   {
     "name": "my-project",
     // No scripts section
   }
   ```

**Solutions**:

1. **Fix JSON syntax**:
   ```bash
   # Remove trailing commas
   # Ensure proper quote escaping
   ```

2. **Add scripts section**:
   ```json
   {
     "scripts": {
       "test": "echo \"No tests specified\""
     }
   }
   ```

### Script Changes Not Detected

**Problem**: Modified package.json scripts don't trigger drift detection.

**Debugging**:

1. **Compare baseline vs current**:
   ```bash
   # Check baseline
   cat .dev-drift/baseline.json | grep -A 10 '"scripts"'
   
   # Check current
   cat package.json | grep -A 10 '"scripts"'
   ```

2. **Verify script values**:
   ```bash
   node -e "
   const baseline = JSON.parse(require('fs').readFileSync('.dev-drift/baseline.json', 'utf8'));
   const current = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
   console.log('Baseline:', baseline.scripts);
   console.log('Current:', current.scripts);
   "
   ```

**Common Causes**:

1. **Whitespace differences**:
   ```json
   // Baseline
   "test": "jest"
   
   // Current  
   "test": " jest "  // Extra spaces
   ```

2. **Script additions** (not tracked):
   ```json
   // dev-drift only tracks changes to existing scripts
   // New scripts don't trigger drift detection
   ```

## Folder Structure Issues

### Folders Not Detected

**Problem**: Existing folders don't appear in baseline or drift detection.

**Debugging**:

1. **Check folder visibility**:
   ```bash
   ls -la
   ```

2. **Verify folder vs file**:
   ```bash
   ls -la | grep "^d"  # Only directories
   ```

3. **Check current snapshot**:
   ```bash
   node -e "
   const fs = require('fs');
   const folders = fs.readdirSync('.', { withFileTypes: true })
     .filter(entry => entry.isDirectory())
     .map(entry => entry.name)
     .sort();
   console.log('Current folders:', folders);
   "
   ```

**Common Issues**:

1. **Hidden folders** (starting with .):
   ```bash
   # These are included in scanning
   ls -la | grep "^d.*\."
   ```

2. **Symlinks**:
   ```bash
   # Symlinks to directories may not be detected as directories
   ls -la | grep "^l"
   ```

3. **Permission issues**:
   ```bash
   # Folders without read permissions
   ls -la | grep "^d.*---"
   ```

### Temporary Folders Causing Drift

**Problem**: Build artifacts or temporary folders trigger false drift detection.

**Symptoms**:
```bash
$ dev-drift check
Drift detected:

Folders were added: .tmp, dist, build
Folders were removed: .cache
```

**Solutions**:

1. **Clean before checking**:
   ```bash
   npm run clean  # or equivalent cleanup command
   dev-drift check
   ```

2. **Update baseline after cleanup**:
   ```bash
   # Clean project
   rm -rf dist build .tmp .cache
   
   # Update baseline
   dev-drift reset
   dev-drift init
   ```

3. **Establish clean baseline**:
   ```bash
   # Start with fresh project state
   git clean -fdx  # WARNING: Removes all untracked files
   npm install
   dev-drift init
   ```

## Performance Issues

### Slow Performance

**Problem**: dev-drift takes a long time to complete.

**Debugging**:

1. **Check folder count**:
   ```bash
   ls -1 | wc -l
   ```

2. **Identify large directories**:
   ```bash
   du -sh */ | sort -hr | head -10
   ```

3. **Check for network drives**:
   ```bash
   pwd
   df .
   ```

**Solutions**:

1. **Remove unnecessary top-level folders**:
   ```bash
   # Move large folders to subdirectories
   mkdir tools
   mv large-folder1 large-folder2 tools/
   ```

2. **Use faster storage**:
   ```bash
   # Move project to local SSD if on network drive
   ```

### Memory Issues

**Problem**: dev-drift crashes with out-of-memory errors.

**Symptoms**:
```bash
$ dev-drift check
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Debugging**:

1. **Check baseline size**:
   ```bash
   ls -lh .dev-drift/baseline.json
   ```

2. **Check package.json size**:
   ```bash
   ls -lh package.json
   ```

**Solutions**:

1. **Reduce dependency count**:
   ```bash
   # Review and remove unnecessary dependencies
   npm audit
   ```

2. **Split large package.json**:
   ```bash
   # Consider workspace or monorepo structure
   ```

## Integration Issues

### CI/CD Pipeline Failures

**Problem**: dev-drift fails in automated environments.

**Common Scenarios**:

1. **Missing baseline in CI**:
   ```bash
   # Ensure baseline.json is committed
   git add .dev-drift/baseline.json
   git commit -m "Add dev-drift baseline"
   ```

2. **Different Node.js versions**:
   ```yaml
   # .github/workflows/test.yml
   - uses: actions/setup-node@v3
     with:
       node-version: '18.15.0'  # Match baseline exactly
   ```

3. **Missing environment files**:
   ```bash
   # Create .env files in CI if needed
   echo "NODE_ENV=test" > .env
   ```

### Git Integration Issues

**Problem**: Baseline conflicts or inconsistencies across branches.

**Solutions**:

1. **Include baseline in version control**:
   ```bash
   git add .dev-drift/baseline.json
   ```

2. **Handle merge conflicts**:
   ```bash
   # After resolving conflicts
   dev-drift reset
   dev-drift init
   git add .dev-drift/baseline.json
   ```

3. **Branch-specific baselines**:
   ```bash
   # Update baseline when switching branches with environmental changes
   git checkout feature-branch
   dev-drift check  # May show drift
   dev-drift reset
   dev-drift init   # Create branch-specific baseline
   ```

## Recovery Procedures

### Complete Reset

When all else fails, start fresh:

```bash
# 1. Remove existing baseline
rm -rf .dev-drift

# 2. Clean project state
npm run clean  # or equivalent
rm -rf node_modules
npm install

# 3. Ensure stable environment
node --version  # Note the version
cat .env        # Verify environment variables

# 4. Reinitialize
dev-drift init

# 5. Test
dev-drift check  # Should show no drift
```

### Backup and Restore

Before making major changes:

```bash
# Backup current baseline
cp .dev-drift/baseline.json .dev-drift/baseline.json.backup

# Make changes...

# Restore if needed
cp .dev-drift/baseline.json.backup .dev-drift/baseline.json
```

## Getting Help

### Diagnostic Information

When reporting issues, include:

1. **System information**:
   ```bash
   node --version
   npm --version
   uname -a  # or systeminfo on Windows
   ```

2. **Project structure**:
   ```bash
   ls -la
   cat package.json | head -20
   ```

3. **dev-drift state**:
   ```bash
   ls -la .dev-drift/
   cat .dev-drift/baseline.json
   ```

4. **Error output**:
   ```bash
   dev-drift check 2>&1 | tee error.log
   ```

### Common Support Scenarios

**"It worked yesterday"**:
- Check for system updates (Node.js, npm)
- Verify environment variable changes
- Look for project structure modifications

**"Works locally but not in CI"**:
- Compare Node.js versions
- Check environment file availability
- Verify baseline is committed to version control

**"Always shows drift"**:
- Ensure consistent Node.js version
- Check for dynamic file generation
- Verify stable project state when initializing