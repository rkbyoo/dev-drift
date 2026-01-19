function diffArrays(oldArr = [], newArr = []) {
    return {
      added: newArr.filter((x) => !oldArr.includes(x)),
      removed: oldArr.filter((x) => !newArr.includes(x)),
    };
  }
  
  function diffObjects(oldObj = {}, newObj = {}) {
    const changed = [];
  
    for (const key of Object.keys(oldObj)) {
      if (!(key in newObj)) continue;
      if (oldObj[key] !== newObj[key]) {
        changed.push(key);
      }
    }
  
    return changed;
  }
  
  function compareSnapshots(oldSnap, newSnap) {
    const result = {};
  
    // Node version
    if (oldSnap.nodeVersion !== newSnap.nodeVersion) {
      result.node = {
        from: oldSnap.nodeVersion,
        to: newSnap.nodeVersion,
      };
    }
  
    // Env keys
    const envDiff = diffArrays(oldSnap.envKeys, newSnap.envKeys);
    if (envDiff.added.length || envDiff.removed.length) {
      result.env = envDiff;
    }
  
    // Folders
    const folderDiff = diffArrays(oldSnap.folders, newSnap.folders);
    if (folderDiff.added.length || folderDiff.removed.length) {
      result.folders = folderDiff;
    }
  
    // Scripts
    const scriptChanges = diffObjects(
      oldSnap.scripts,
      newSnap.scripts
    );
    if (scriptChanges.length) {
      result.scripts = scriptChanges;
    }
  
    return result;
  }
  
  module.exports = {
    compareSnapshots,
  };
  