// Core modules (always included)
import * as data from "./modules/data/data.js";
import Analyze from "./modules/analyze/analyze.js";
import { HydroLangCache, cachedFetch } from "./modules/data/utils/data-cache.js";
import * as datasources from "./modules/data/datasources.js";

/**
 * Main framework wrapper. Creates a new instance of all modules as objects.
 * @class
 * @namespace Hydrolang
 * @returns {Object} creates a new instance of the whole library.
 */
class Hydrolang {
  constructor(config = { includeVisuals: true }) {
    // Base modules are always loaded
    // Clone module namespace objects to allow mutation (wrapping)
    this.data = { ...data };
    this.analyze = new Analyze(config.analyzeComponents);

    // Attach datasources to data module
    this.datasources = datasources;

    // Cache system is always available and initialized immediately
    this.cache = new HydroLangCache();

    // Initialize cache immediately and make it globally available
    this._initCache();

    // Wrap core modules to support cache key resolution
    this._wrapModule(this.data);
    this._wrapModule(this.analyze);

    // Only load visual modules if requested (after cache is ready)
    if (config.includeVisuals) {
      this._loadVisualModules();
    }
  }

  /**
   * Recursively wraps module functions to support passing cache keys as data.
   * @param {Object} module - The module to wrap
   */
  /**
   * Recursively wraps module functions to support passing cache keys as data.
   * @param {Object} module - The module to wrap
   */
  _wrapModule(module) {
    if (!module || (typeof module !== 'object' && typeof module !== 'function')) return;

    const propNames = Object.getOwnPropertyNames(module);

    for (const key of propNames) {
      if (['length', 'name', 'prototype', 'arguments', 'caller', 'constructor'].includes(key)) continue;

      // Skip datasources to prevent wrapping configuration objects
      if (key === 'datasources') continue;

      // Get descriptor to check if writable/configurable
      const desc = Object.getOwnPropertyDescriptor(module, key);
      if (!desc || !desc.configurable) continue;

      const value = module[key];

      if (typeof value === 'function') {
        // Check if it looks like a class
        const isClass = value.toString().trim().startsWith('class ');

        if (isClass) {
          // Recurse into class static methods without wrapping the class itself
          this._wrapModule(value);
        } else {
          // Wrap regular function
          const original = value;
          const wrapper = async (...args) => {
            const paramsObj = args[0];
            if (paramsObj && typeof paramsObj === 'object' && typeof paramsObj.data === 'string') {
              try {
                const cached = await this.cache.get(paramsObj.data);
                if (cached) {
                  const newParams = { ...paramsObj, data: cached.data };
                  args[0] = newParams;
                }
              } catch (err) {
                console.warn(`Failed to resolve cache key '${paramsObj.data}':`, err);
              }
            }
            return original.apply(module, args);
          };

          // Copy properties to wrapper
          const methodProps = Object.getOwnPropertyNames(original);
          for (const prop of methodProps) {
            if (['length', 'name', 'prototype', 'arguments', 'caller'].includes(prop)) continue;
            const propDesc = Object.getOwnPropertyDescriptor(original, prop);
            Object.defineProperty(wrapper, prop, propDesc);
          }

          // Replace function with wrapper
          module[key] = wrapper;

          // Recurse into wrapper to handle static methods on the function
          this._wrapModule(wrapper);
        }

      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Skip Maps, Sets, and other built-in types that shouldn't be cloned via spread
        if (value instanceof Map || value instanceof Set || value instanceof WeakMap || value instanceof WeakSet || value instanceof Date || value instanceof RegExp || value instanceof Worker) {
          continue;
        }

        // Clone and recurse
        module[key] = { ...value };
        this._wrapModule(module[key]);
      }
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

      // Clone to allow wrapping
      this.visualize = { ...visualize };
      this.map = { ...map };

      // Wrap visual modules as well
      this._wrapModule(this.visualize);
      this._wrapModule(this.map);

    } catch (error) {
      console.warn('Visual modules could not be loaded:', error);
    }
  }
}

if (typeof window !== "undefined") {
  window.Hydrolang = Hydrolang;
}

export default Hydrolang;
