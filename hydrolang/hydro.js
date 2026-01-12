// Core modules (always included)
import * as data from "./modules/data/data.js";
import Analyze from "./modules/analyze/analyze.js";
import { HydroLangCache, cachedFetch } from "./modules/data/utils/data-cache.js";
import datasources from "./modules/data/datasources.js";

/**
 * Main framework wrapper. Creates a new instance of all modules as objects.
 * @class
 * @namespace Hydrolang
 * @returns {Object} creates a new instance of the whole library.
 */
class Hydrolang {
  constructor(config = { includeVisuals: true }) {
    this.config = config;
    if (typeof window !== 'undefined') {
      window.hydroConfig = config;
    }
    // Base modules are always loaded
    // Clone module namespace objects to allow mutation (wrapping)
    this.data = { ...data };
    this.analyze = new Analyze(config.analyzeComponents);

    // Attach datasources to data module
    this.datasources = datasources;

    // Cache system initialization
    // If config.cache is explicitly false, we DO NOT instantiate the real cache
    if (config.cache !== false) {
      this.cache = new HydroLangCache();
      this._initCache();
    } else {
      // Create a dummy no-op cache object to prevent crashes in wrapped modules
      // This ensures this.cache.get/put calls safely do nothing
      this.cache = {
        init: async () => { },
        get: async () => null,
        put: async () => { },
        putChunked: async () => { },
        downloadChunked: async () => null, // Should prompt network fetch
        reassembleChunks: async () => null,
        delete: async () => { },
        clear: async () => { },
        keys: async () => []
      };

      // Still need to ensure globalThis.hydro is set and _originalFetch is present
      // even if cache is disabled, as data modules depend on them
      if (!globalThis._originalFetch) {
        globalThis._originalFetch = globalThis.fetch;
      }
      globalThis.hydro = this;

      console.log('HydroLang Cache disabled by configuration.');
    }

    // Only load visual modules if requested (after cache is ready/mocked)
    if (config.includeVisuals) {
      this._loadVisualModules();
    }
  }

  async _initCache() {
    try {
      await this.cache.init();

      // Make sure _originalFetch is valid for internal use in data-cache.js
      // But DO NOT override globalThis.fetch
      if (!globalThis._originalFetch) {
        globalThis._originalFetch = globalThis.fetch;
      }

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
        import(/* webpackChunkName: "visualize" */ "./modules/visualize/visualize.js"),
        import(/* webpackChunkName: "map" */ "./modules/map/map.js")
      ]);

      // Clone to allow wrapping
      this.visualize = { ...visualize.default };
      this.map = { ...map.default };

    } catch (error) {
      console.warn('Visual modules could not be loaded:', error);
    }
  }
}

if (typeof window !== "undefined") {
  window.Hydrolang = Hydrolang;
}

export default Hydrolang;
