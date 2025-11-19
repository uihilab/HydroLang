// Core modules (always included)
import * as data from "./modules/data/data.js";
import * as analyze from "./modules/analyze/analyze.js";
import { HydroLangCache, cachedFetch } from "./modules/data/utils/data-cache.js";
import proxies from "./modules/data/datasources/proxy.js";

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

    // Proxies are always available
    this.proxies = proxies;

    // Cache system is always available and initialized immediately
    this.cache = new HydroLangCache();

    // Initialize cache immediately and make it globally available
    this._initCache();

    // Only load visual modules if requested (after cache is ready)
    if (config.includeVisuals) {
      this._loadVisualModules();
    }
  }

  async _initCache() {
    try {
      await this.cache.init();

      // PERMANENTLY override global fetch with cached version
      if (!globalThis._originalFetch) {
        globalThis._originalFetch = globalThis.fetch;
      }
      globalThis.fetch = cachedFetch;

      // Make HydroLang instance globally available after cache is ready
      globalThis.hydro = this;
    } catch (error) {
      console.error('Failed to initialize HydroLang cache:', error);
      // Still make instance available even if cache fails
      globalThis.hydro = this;
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
