// Core modules (always included)
import * as data from "./modules/data/data.js";
import * as analyze from "./modules/analyze/analyze.js";

/**
 * Main framework wrapper. Creates a new instance of all modules as objects.
 * @class
 * @namespace Hydrolang
 * @returns {Object} creates a new instance of the whole library.
 */
class Hydrolang {
  constructor(config = { includeVisuals: true }) {
    // Base modules are always loaded
    this.data = data;
    this.analyze = analyze;

    // Only load visual modules if requested
    if (config.includeVisuals) {
      this._loadVisualModules();
    }
  }

  async _loadVisualModules() {
    try {
      const [visualize, map] = await Promise.all([
        import("./modules/visualize/visualize.js"),
        import("./modules/map/map.js")
      ]);

      this.visualize = visualize;
      this.map = map;
    } catch (error) {
      console.warn('Visual modules could not be loaded:', error);
    }
  }
}

if (typeof window !== "undefined") {
  window.Hydrolang = Hydrolang;
}

export default Hydrolang;
