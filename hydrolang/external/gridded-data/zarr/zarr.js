import * as divisors from "../../../modules/visualize/divisors.js";

/**
 * Zarrita-based Zarr data format loader
 * Provides modern Zarr functionality using zarrita library
 * @external ZarritaLoader
 */

let zarrLibraries = null;
let isZarrLoaded = false;

/**
 * Loads zarrita Zarr library
 * @method load
 * @memberof ZarritaLoader
 * @param {Object} [options] - Loading options
 * @returns {Promise<Object>} Promise resolving to loaded zarrita library
 */
async function load(options = {}) {
  if (isZarrLoaded) {
    return zarrLibraries;
  }

  try {
    // Load zarrita from CDN
    const zarr = await import('https://cdn.jsdelivr.net/npm/zarrita/+esm');

    // Load numcodecs for decompression
    const numcodecs = await import('https://cdn.jsdelivr.net/npm/numcodecs/+esm');

    // Load fzstd for Zstd decompression (common in Zarr v3 or modern datasets)
    const fzstd = await import('https://cdn.jsdelivr.net/npm/fzstd/+esm');

    // Load pako for Zlib support (useful for some Zarr stores)
    let pako = window.pako;
    if (!pako) {
      try {
        const pakoModule = await import('https://cdn.skypack.dev/pako');
        pako = pakoModule.default || pakoModule;
      } catch (e) {
        console.warn('Failed to load pako for Zarr:', e);
      }
    }

    zarrLibraries = {
      zarr: zarr,
      numcodecs: numcodecs,
      fzstd: fzstd,
      pako: pako,
      version: 'zarrita'
    };

    // Expose globally for compatibility with some utils
    if (!window.numcodecs) window.numcodecs = numcodecs;
    if (!window.fzstd) window.fzstd = fzstd;
    if (!window.pako && pako) window.pako = pako;

    isZarrLoaded = true;

    console.log('Zarrita Zarr library and dependencies loaded successfully');

    return zarrLibraries;

  } catch (error) {
    console.error('Failed to load zarrita or dependencies:', error);
    throw new Error('Unable to load zarrita library');
  }
}

/**
 * Utility function for creating Zarr stores and arrays using zarrita
 * @param {string} url - Base URL for the Zarr store
 * @returns {Object} Zarrita utilities
 */
export function createZarrStore(url) {
  const libraries = zarrLibraries || { zarr: null };

  return {
    /**
     * Create a fetch store for the given URL
     */
    createStore: (storeUrl = url) => {
      if (!libraries.zarr) {
        throw new Error('Zarrita library not loaded');
      }
      return new libraries.zarr.FetchStore(storeUrl);
    },

    /**
     * Open a Zarr array from the store
     */
    openArray: async (storeUrl = url, options = {}) => {
      if (!libraries.zarr) {
        throw new Error('Zarrita library not loaded');
      }
      const store = new libraries.zarr.FetchStore(storeUrl);
      return await libraries.zarr.open(store, { kind: 'array', ...options });
    },

    /**
     * Get full array data
     */
    getArrayData: async (array) => {
      if (!libraries.zarr) {
        throw new Error('Zarrita library not loaded');
      }
      return await libraries.zarr.get(array);
    },

    /**
     * Get array chunk
     */
    getChunk: async (array, indices) => {
      return await array.getChunk(indices);
    },

    /**
     * Get array region
     */
    getRegion: async (array, region) => {
      if (!libraries.zarr) {
        throw new Error('Zarrita library not loaded');
      }
      return await libraries.zarr.get(array, region);
    }
  };
}

/**
 * Checks if Zarr libraries are loaded
 * @method isLoaded
 * @memberof ZarritaLoader
 * @returns {boolean} True if libraries are loaded
 */
function isLoaded() {
  return isZarrLoaded && zarrLibraries !== null;
}

/**
 * Gets information about the Zarr loader
 * @method getInfo
 * @memberof ZarritaLoader
 * @returns {Object} Information about supported features
 */
function getInfo() {
  return {
    name: 'Zarr',
    description: 'Zarr storage format (v2/v3) using Zarrita',
    version: '2.0+',
    features: [
      'Chunked arrays',
      'Compression (Blosc, Zlib, Gzip)',
      'Cloud storage support',
      'Metadata storage',
      'Multi-dimensional arrays'
    ],
    dependencies: [
      'zarrita (Zarr implementation)',
      'numcodecs (Compression codecs)',
      'pako (Zlib/Gzip support)'
    ]
  };
}

export {
  load,
  isLoaded,
  getInfo
};

export default {
  load,
  isLoaded,
  getInfo,
  createZarrStore
};
