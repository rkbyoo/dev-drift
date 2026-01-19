# Design Decisions

This document explains the key architectural and design choices made in dev-drift, the reasoning behind them, and the tradeoffs involved.

## Core Philosophy: Simplicity Over Features

### Decision: Minimal Feature Set

**What we chose**: A focused tool that does one thing well - detect environmental drift through snapshot comparison.

**What we rejected**: 
- Complex configuration systems
- Multiple baseline management
- Automatic drift resolution
- Real-time monitoring
- Plugin architectures

**Reasoning**:
- **Reliability**: Fewer features mean fewer failure points
- **Maintainability**: Simple codebase is easier to debug and extend
- **User experience**: Clear, predictable behavior without configuration overhead
- **Adoption**: Lower barrier to entry for new users

**Tradeoffs**:
- **Flexibility**: Cannot customize monitoring behavior
- **Power users**: May want more advanced features
- **Complex projects**: May need features we don't provide

**Why this tradeoff is acceptable**: The 80/20 rule applies - most users need basic drift detection, not advanced features. Complex tools often go unused because they're too difficult to set up and maintain.

## Snapshot-Based Architecture

### Decision: Point-in-Time Snapshots vs Real-Time Monitoring

**What we chose**: Capture complete project state at specific moments and compare snapshots.

**What we rejected**:
- File system watchers
- Background monitoring processes
- Continuous drift tracking
- Event-driven change detection

**Reasoning**:
- **Simplicity**: No background processes or system dependencies
- **Reliability**: Snapshots can't fail between runs
- **Portability**: Works identically across all platforms
- **Debugging**: Clear before/after comparison
- **Performance**: No ongoing resource usage

**Tradeoffs**:
- **Timeliness**: Drift only detected when explicitly checked
- **Granularity**: Can't track when changes occurred, only that they did
- **Automation**: Requires manual or scripted execution

**Why this tradeoff is acceptable**: Project drift typically accumulates over days or weeks. Real-time detection adds complexity without proportional benefit for this use case.

### Decision: Single Baseline vs Multiple Snapshots

**What we chose**: One baseline snapshot per project, manually managed.

**What we rejected**:
- Snapshot history with rollback capability
- Multiple named baselines (dev, staging, prod)
- Automatic baseline rotation
- Timestamped snapshot archives

**Reasoning**:
- **Clarity**: Always clear what you're comparing against
- **Simplicity**: No baseline management complexity
- **Intentionality**: Forces deliberate decisions about "good" states
- **Storage**: Minimal disk usage

**Tradeoffs**:
- **Flexibility**: Can't compare against multiple reference points
- **History**: Can't see drift evolution over time
- **Recovery**: Can't easily rollback to previous baselines

**Why this tradeoff is acceptable**: Most drift detection needs involve "current state vs last known good state." Multiple baselines add complexity that most users don't need.

## Security and Privacy

### Decision: Environment Variable Keys Only

**What we chose**: Store only environment variable names, never their values.

**What we rejected**:
- Storing complete environment variable values
- Hashing or encrypting values
- Optional value storage with user consent
- Separate secure storage for sensitive values

**Reasoning**:
- **Security**: No risk of exposing sensitive data
- **Privacy**: Safe to commit baselines to version control
- **Compliance**: Meets security requirements without special handling
- **Trust**: Users can confidently use the tool without security review

**Tradeoffs**:
- **Completeness**: Can't detect value changes, only key changes
- **Debugging**: Less information for troubleshooting configuration issues

**Why this tradeoff is acceptable**: Environment variable key changes (additions/removals) are the primary cause of drift-related failures. Value changes typically don't break projects unless the key itself changes.

### Decision: Read-Only Operation

**What we chose**: Never modify project files, only read and report.

**What we rejected**:
- Automatic drift correction
- Interactive fix suggestions
- File modification capabilities
- Configuration file updates

**Reasoning**:
- **Safety**: Cannot accidentally break working configurations
- **Trust**: Users maintain full control over their projects
- **Simplicity**: No need for backup/rollback mechanisms
- **Clarity**: Clear separation between detection and resolution

**Tradeoffs**:
- **Convenience**: Users must manually fix detected issues
- **Automation**: Cannot integrate drift correction into CI/CD pipelines
- **User experience**: Requires additional steps after drift detection

**Why this tradeoff is acceptable**: Automatic fixes are dangerous in development environments. Different projects need different solutions to the same drift. Manual resolution ensures understanding and intentionality.

## Data Collection Strategy

### Decision: Top-Level Folders Only

**What we chose**: Scan only the immediate children of the project root directory.

**What we rejected**:
- Recursive directory scanning
- Configurable depth limits
- File-level change detection
- Selective folder monitoring

**Reasoning**:
- **Performance**: O(n) complexity where n = top-level folders
- **Relevance**: Top-level changes most likely to cause build/deployment issues
- **Simplicity**: No configuration needed for folder selection
- **Consistency**: Predictable behavior across all projects

**Tradeoffs**:
- **Granularity**: Won't detect deep folder structure changes
- **Completeness**: May miss some types of project reorganization

**Why this tradeoff is acceptable**: Most drift-causing folder changes happen at the top level (src → lib, assets → static, etc.). Deep folder changes rarely break builds or deployments.

### Decision: Multiple .env File Support

**What we chose**: Scan `.env`, `.env.local`, `.env.development`, and `.env.production`.

**What we rejected**:
- Single .env file only
- Configurable .env file locations
- Custom environment file formats
- System environment variable scanning

**Reasoning**:
- **Convention**: Matches common Node.js environment file patterns
- **Completeness**: Covers most real-world environment setups
- **Simplicity**: No configuration required
- **Predictability**: Consistent behavior across projects

**Tradeoffs**:
- **Flexibility**: Cannot handle custom environment file naming
- **Completeness**: Won't detect system-level environment changes

**Why this tradeoff is acceptable**: The chosen files cover 95% of Node.js projects. Custom naming is rare enough that the complexity isn't justified.

## User Experience Design

### Decision: Command-Line Interface Only

**What we chose**: Simple CLI with three commands: `init`, `check`, `reset`.

**What we rejected**:
- Graphical user interface
- Web-based dashboard
- IDE integrations
- Configuration files

**Reasoning**:
- **Universality**: Works in all development environments
- **Scriptability**: Easy to integrate into build processes
- **Simplicity**: No additional dependencies or setup
- **Performance**: Minimal resource usage

**Tradeoffs**:
- **User experience**: Less visual feedback than GUI alternatives
- **Discoverability**: Features not as obvious as in visual interfaces

**Why this tradeoff is acceptable**: Developer tools are typically CLI-first. Visual interfaces add complexity and dependencies without significant benefit for this use case.

### Decision: Explicit Command Structure

**What we chose**: Separate commands for each operation (`init`, `check`, `reset`).

**What we rejected**:
- Single command with flags (`dev-drift --init`, `dev-drift --check`)
- Interactive mode with prompts
- Automatic operation detection
- Subcommand hierarchies

**Reasoning**:
- **Clarity**: Each command has a single, clear purpose
- **Scriptability**: Easy to use in automated environments
- **Discoverability**: Commands are self-documenting
- **Error handling**: Clear failure modes for each operation

**Tradeoffs**:
- **Verbosity**: Requires typing full command names
- **Flexibility**: Cannot combine operations in single invocation

**Why this tradeoff is acceptable**: Explicit commands reduce confusion and make scripts more readable. The operations are distinct enough to warrant separate commands.

## Error Handling Philosophy

### Decision: Fail Fast with Clear Messages

**What we chose**: Immediate failure with specific error messages and suggested solutions.

**What we rejected**:
- Silent failure with warnings
- Automatic retry mechanisms
- Graceful degradation with partial results
- Verbose error logging

**Reasoning**:
- **Clarity**: Users immediately understand what went wrong
- **Actionability**: Error messages include next steps
- **Reliability**: Consistent behavior in error conditions
- **Debugging**: Clear failure points for troubleshooting

**Example**:
```bash
$ dev-drift check
✗ dev-drift not initialized.
✗ Run: dev-drift init
```

**Tradeoffs**:
- **Robustness**: Won't work around minor issues automatically
- **User experience**: Requires manual intervention for all errors

**Why this tradeoff is acceptable**: Development tools should be predictable and explicit. Silent failures or automatic workarounds can hide real problems.

### Decision: Graceful Handling of Missing Files

**What we chose**: Continue operation when optional files are missing (package.json, .env files).

**What we rejected**:
- Requiring all monitored files to exist
- Warning messages for missing files
- Different behavior based on file presence

**Reasoning**:
- **Flexibility**: Works with minimal project setups
- **Robustness**: Doesn't break on incomplete projects
- **Simplicity**: Consistent behavior regardless of project structure

**Implementation**:
```javascript
if (fs.existsSync(pkgPath)) {
  // Process package.json
} else {
  // Use empty defaults
  scripts = {};
  dependencies = {};
}
```

**Tradeoffs**:
- **Completeness**: May miss drift in projects without standard files
- **Feedback**: Users don't know which files were processed

**Why this tradeoff is acceptable**: Projects vary widely in structure. Requiring specific files would limit tool applicability.

## Performance Considerations

### Decision: Synchronous File Operations

**What we chose**: Use synchronous filesystem operations throughout.

**What we rejected**:
- Asynchronous file operations with callbacks
- Promise-based async/await patterns
- Streaming file processing
- Parallel file reading

**Reasoning**:
- **Simplicity**: Easier to understand and debug
- **Performance**: File operations are fast enough for typical use
- **Error handling**: Simpler error propagation
- **Sequencing**: Natural operation ordering

**Tradeoffs**:
- **Scalability**: Won't handle extremely large projects efficiently
- **Responsiveness**: Blocks during file operations

**Why this tradeoff is acceptable**: dev-drift processes small files (package.json, .env) and scans limited directories. Async complexity isn't justified for this performance profile.

### Decision: In-Memory Data Processing

**What we chose**: Load all data into memory for processing and comparison.

**What we rejected**:
- Streaming comparison algorithms
- Database storage for large datasets
- Disk-based temporary storage
- Lazy loading of snapshot data

**Reasoning**:
- **Simplicity**: Straightforward data structures and algorithms
- **Performance**: Memory operations are faster than disk I/O
- **Reliability**: No temporary file management needed

**Tradeoffs**:
- **Memory usage**: Could be problematic for very large projects
- **Scalability**: Won't handle projects with thousands of dependencies

**Why this tradeoff is acceptable**: Typical project snapshots are small (< 1KB). Memory usage is not a concern for the target use case.

## Future-Proofing Decisions

### Decision: Extensible but Not Configurable

**What we chose**: Code structure that allows easy extension but no user configuration.

**What we rejected**:
- Plugin architecture
- Configuration files
- Runtime customization options
- Modular component loading

**Reasoning**:
- **Maintainability**: Extensions require code changes, ensuring quality
- **Simplicity**: No configuration complexity for users
- **Consistency**: Predictable behavior across all installations
- **Testing**: Easier to test without configuration variations

**Extension Points**:
- Adding new snapshot data types
- Custom output formats
- Additional comparison algorithms

**Tradeoffs**:
- **Flexibility**: Cannot customize behavior without code changes
- **User needs**: May not meet all user requirements

**Why this tradeoff is acceptable**: Configuration adds complexity that most users don't need. Code-based extensions ensure quality and maintainability.

### Decision: Stable Data Format

**What we chose**: JSON baseline format with stable schema.

**What we rejected**:
- Binary formats for efficiency
- Versioned schema with migrations
- Compressed storage formats
- Database storage

**Reasoning**:
- **Readability**: Users can inspect and understand baselines
- **Portability**: JSON works across all platforms and tools
- **Debugging**: Easy to manually examine and modify
- **Simplicity**: No schema migration complexity

**Schema Stability**:
```json
{
  "nodeVersion": "string",
  "scripts": "object",
  "dependencies": "object", 
  "devDependencies": "object",
  "envKeys": "array",
  "folders": "array"
}
```

**Tradeoffs**:
- **Efficiency**: JSON is larger than binary formats
- **Evolution**: Schema changes require careful compatibility handling

**Why this tradeoff is acceptable**: Baseline files are small and infrequently accessed. Readability and simplicity outweigh efficiency concerns.

## Alternative Approaches Considered

### Configuration-Based Monitoring

**Approach**: Use configuration files to specify what to monitor and how.

**Rejected because**:
- Adds setup complexity
- Requires maintenance of configuration
- Creates inconsistency between projects
- Most users would use default settings anyway

### Live File System Monitoring

**Approach**: Watch files and directories for changes in real-time.

**Rejected because**:
- Requires background processes
- Platform-specific implementation complexity
- Resource usage for continuous monitoring
- Noise from temporary files and build artifacts

### Integration with Package Managers

**Approach**: Hook into npm/yarn to detect dependency changes automatically.

**Rejected because**:
- Ties tool to specific package managers
- Misses non-dependency drift (environment, folders)
- Complex integration with multiple package manager versions
- Doesn't work for projects without package managers

### Cloud-Based Baseline Storage

**Approach**: Store baselines in cloud service for team sharing.

**Rejected because**:
- Adds external dependencies
- Requires authentication and network connectivity
- Privacy concerns with project data
- Complexity of multi-user baseline management

### Automatic Drift Resolution

**Approach**: Provide commands to automatically fix detected drift.

**Rejected because**:
- Risk of breaking working configurations
- Different projects need different solutions
- Complex logic for determining correct fixes
- Reduces user understanding of their environment

These alternatives were considered but rejected in favor of the current simple, reliable approach that prioritizes user control and system predictability.