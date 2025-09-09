import * as divisors from "../../../modules/visualize/divisors.js";

/**
 * HDF5 data format loader
 * Provides lazy loading for HDF5 format libraries and dependencies
 * @external HDF5Loader
 */

let hdf5Libraries = null;
let isHDF5Loaded = false;

/**
 * Loads HDF5-related libraries and dependencies
 * @method load
 * @memberof HDF5Loader
 * @param {Object} [options] - Loading options
 * @param {boolean} [options.includeJS=true] - Include JavaScript HDF5 library
 * @param {boolean} [options.includeH5Wasm=true] - Include HDF5 WebAssembly library
 * @returns {Promise<Object>} Promise resolving to loaded HDF5 libraries
 * @example
 * await hdf5Loader.load({ includeJS: true, includeH5Wasm: true });
 */
async function load(options = {}) {
  const { includeJS = true, includeH5Wasm = true } = options;

  if (isHDF5Loaded) {
    return hdf5Libraries;
  }

  try {
    console.log('Loading HDF5 libraries...');

    let libraries = [];

    if (includeJS) {
      // Load h5wasm (HDF5 WebAssembly) library
      const h5wasm = divisors.createScript({
        params: {
          src: "https://cdn.jsdelivr.net/npm/h5wasm@0.6.8/dist/h5wasm.js",
          name: "h5wasm"
        }
      });
      libraries.push(h5wasm);
    }

    if (includeH5Wasm) {
      // Load additional HDF5 utilities
      const hdf5Utils = divisors.createScript({
        params: {
          src: "https://cdn.jsdelivr.net/npm/hdf5.js@0.3.0/dist/hdf5.js",
          name: "hdf5js"
        }
      });
      libraries.push(hdf5Utils);
    }

    // Wait for all scripts to load
    await Promise.all(
      libraries.map(lib => new Promise((resolve) => {
        lib.onload = resolve;
        lib.onerror = () => resolve(); // Continue even if error
      }))
    );

    // Create library interface
    hdf5Libraries = {
      h5wasm: window.h5wasm || null,
      hdf5js: window.hdf5 || null,
      loadedAt: new Date()
    };

    isHDF5Loaded = true;
    console.log('HDF5 libraries loaded successfully');

    return hdf5Libraries;

  } catch (error) {
    console.error('Failed to load HDF5 libraries:', error);
    throw new Error(`HDF5 library loading failed: ${error.message}`);
  }
}

/**
 * Checks if HDF5 libraries are loaded
 * @method isLoaded
 * @memberof HDF5Loader
 * @returns {boolean} True if libraries are loaded
 * @example
 * hdf5Loader.isLoaded();
 */
function isLoaded() {
  return isHDF5Loaded && hdf5Libraries !== null;
}

/**
 * Gets information about the HDF5 loader
 * @method getInfo
 * @memberof HDF5Loader
 * @returns {Object} Information about supported features
 * @example
 * hdf5Loader.getInfo();
 */
function getInfo() {
  return {
    name: 'HDF5',
    description: 'Hierarchical Data Format 5 for large gridded datasets',
    version: '1.12+',
    features: [
      'Hierarchical data structure',
      'Large dataset support',
      'Compression and chunking',
      'Metadata storage',
      'Cross-platform compatibility'
    ],
    dependencies: [
      'h5wasm (HDF5 WebAssembly)',
      'hdf5.js (JavaScript HDF5 utilities)'
    ]
  };
}

/**
 * Loads an HDF5 file from ArrayBuffer
 * @method loadFile
 * @memberof HDF5Loader
 * @param {ArrayBuffer} buffer - HDF5 file buffer
 * @returns {Promise} Promise resolving to HDF5 file object
 * @example
 * const file = await hdf5Loader.loadFile(buffer);
 */
async function loadFile(buffer) {
  if (!isLoaded()) {
    await load();
  }

  if (!hdf5Libraries.h5wasm) {
    throw new Error('h5wasm library not available');
  }

  try {
    const hdf5File = new hdf5Libraries.h5wasm.File(buffer);
    return hdf5File;
  } catch (error) {
    throw new Error(`Failed to load HDF5 file: ${error.message}`);
  }
}

/**
 * Loads an HDF5 file from URL
 * @method loadFromURL
 * @memberof HDF5Loader
 * @param {string} url - URL to HDF5 file
 * @returns {Promise} Promise resolving to HDF5 file object
 * @example
 * const file = await hdf5Loader.loadFromURL('https://example.com/data.h5');
 */
async function loadFromURL(url) {
  if (!isLoaded()) {
    await load();
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    return await loadFile(buffer);
  } catch (error) {
    throw new Error(`Failed to load HDF5 from URL: ${error.message}`);
  }
}

/**
 * Gets dataset from HDF5 file
 * @method getDataset
 * @memberof HDF5Loader
 * @param {Object} hdf5File - HDF5 file object
 * @param {string} path - Path to dataset
 * @returns {Object} Dataset object
 * @example
 * const dataset = hdf5Loader.getDataset(file, '/temperature');
 */
function getDataset(hdf5File, path) {
  try {
    const dataset = hdf5File.get(path);
    return {
      name: path,
      data: dataset.value,
      shape: dataset.shape,
      dtype: dataset.dtype,
      attributes: dataset.attrs || {}
    };
  } catch (error) {
    throw new Error(`Failed to get dataset ${path}: ${error.message}`);
  }
}

/**
 * Lists contents of HDF5 file or group
 * @method listContents
 * @memberof HDF5Loader
 * @param {Object} hdf5File - HDF5 file object
 * @param {string} [path='/'] - Path to list contents of
 * @returns {Array} Array of contents
 * @example
 * const contents = hdf5Loader.listContents(file, '/data');
 */
function listContents(hdf5File, path = '/') {
  try {
    const group = hdf5File.get(path);
    return {
      groups: group.subgroups || [],
      datasets: group.datasets || [],
      attributes: group.attrs || {}
    };
  } catch (error) {
    throw new Error(`Failed to list contents of ${path}: ${error.message}`);
  }
}

export default {
  load,
  isLoaded,
  getInfo,
  loadFile,
  loadFromURL,
  getDataset,
  listContents
};
