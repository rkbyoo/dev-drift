function report(drift) {
    const keys = Object.keys(drift);
  
    if (keys.length === 0) {
      console.log(" No drift detected.");
      return;
    }
  
    console.log("Drift detected:\n");
  
    if (drift.node) {
      console.log(
        `Node version changed: ${drift.node.from} → ${drift.node.to}`
      );
    }
  
    if (drift.env) {
      if (drift.env.added.length) {
        console.log("Env variable added:", drift.env.added.join(", "));
      }
      if (drift.env.removed.length) {
        console.log("Env variable removed:", drift.env.removed.join(", "));
      }
    }
  
    if (drift.folders) {
      if (drift.folders.added.length) {
        console.log("Folders were added:", drift.folders.added.join(", "));
      }
      if (drift.folders.removed.length) {
        console.log("Folders were removed:", drift.folders.removed.join(", "));
      }
    }
  
    if (drift.scripts) {
      console.log("Scripts is changed:", drift.scripts.join(", "));
    }
  }
  
  module.exports = {
    report,
  };
  