import * as divisors from "../../../modules/visualize/divisors.js";

/**
 * Zarr data format loader
 * Provides lazy loading for Zarr format libraries and dependencies
 * @external ZarrLoader
 */

let zarrLibraries = null;
let isZarrLoaded = false;
let zarrModule = null;
let fzstdModule = null;
let pakoModule = null;

/**
 * Loads Zarr-related libraries and dependencies
 * @method load
 * @memberof ZarrLoader
 * @param {Object} [options] - Loading options
 * @param {string} [options.version='v2'] - Zarr version to load
 * @param {boolean} [options.includeCompression=true] - Include compression libraries
 * @returns {Promise<Object>} Promise resolving to loaded Zarr libraries
 * @example
 * await zarrLoader.load({ version: 'v2', includeCompression: true });
 */
async function load(options = {}) {
  const { version = 'v2', includeCompression = true } = options;

  if (isZarrLoaded) {
    return zarrLibraries;
  }

  try {

    // Dynamically import the libraries
    const imports = [];

    // Import Zarr core - try multiple sources
    imports.push(import('https://cdn.jsdelivr.net/npm/zarr@0.5.1/+esm').then(module => {
      zarrModule = module.default || module;
    }).catch(async (error) => {
      // Try fallback to script loading
      try {
        await loadViaScript('zarr', "https://cdn.jsdelivr.net/npm/zarr@0.5.1/dist/zarr.min.js");
        if (window.zarr) {
          zarrModule = window.zarr;
        } else {
          throw new Error('Zarr script loading failed - window.zarr not available');
        }
      } catch (scriptError) {
        console.error('All Zarr loading methods failed:', scriptError);
        throw new Error('Unable to load Zarr library from any source');
      }
    }));

    if (includeCompression) {
      // Import compression libraries with better error handling
      // Try to load numcodecs (supports both blosc and zstd)
      imports.push(import('https://cdn.jsdelivr.net/npm/numcodecs@0.2.2/+esm').then(module => {
        // numcodecs has Blosc, GZip, LZ4, Zlib, Zstd codecs

        // Store numcodecs for later use
        window.numcodecs = module;

        // Try to create blosc decompressor using the available Blosc class
        try {
        if (module.Blosc) {
            // Try different ways to create and use blosc decompressor
            const BloscClass = module.Blosc;

            // Try creating instance with proper configuration
            const bloscCodec = new BloscClass({ clevel: 5, shuffle: 1, cname: 'lz4' });
            window.bloscDecompress = async (data) => {
              try {
                const result = await bloscCodec.decode(data);
                return result;
              } catch (decodeError) {
                console.warn('Blosc decode error:', decodeError.message);
                // Try synchronous decode as fallback
                return bloscCodec.decode(data);
              }
            };
          }
        } catch (codecError) {
          console.warn('Failed to create Blosc codec:', codecError.message);
          // Try alternative approach without configuration
          try {
            if (module.Blosc) {
              const bloscCodec = new module.Blosc();
              window.bloscDecompress = (data) => bloscCodec.decode(data);
            }
          } catch (simpleError) {
            console.warn('Simple Blosc creation also failed:', simpleError.message);
            // Try static method as last resort
            try {
              if (typeof module.Blosc.decode === 'function') {
                window.bloscDecompress = (data) => module.Blosc.decode(data);
              }
            } catch (staticError) {
              console.warn('Blosc static method also failed:', staticError.message);
            }
          }
        }

      }).catch(async (error) => {
        console.warn('numcodecs failed, trying alternative blosc library:', error.message);
        try {
          // Try loading blosc library directly
          await loadViaScript('blosc', "https://cdn.jsdelivr.net/npm/blosc@2.0.0/dist/blosc.min.js");
          if (window.blosc && typeof window.blosc.decompress === 'function') {
            window.decompress = window.blosc.decompress;
          }
        } catch (bloscError) {
          console.warn('blosc library failed, trying alternative sources:', bloscError.message);
          try {
            // Try loading from unpkg
            await loadViaScript('blosc', "https://unpkg.com/blosc@1.0.0/dist/blosc.min.js");
            if (window.blosc && typeof window.blosc.decompress === 'function') {
              window.decompress = window.blosc.decompress;
            }
          } catch (unpkgError) {
            console.warn('blosc unpkg also failed:', unpkgError.message);
          }
        }
        try {
          await loadViaScript('fzstd', "https://cdn.jsdelivr.net/npm/fzstd@0.1.1/umd/index.js");
          if (window.fzstd && typeof window.fzstd.decompress === 'function') {
            window.zstdDecompress = window.fzstd.decompress;
            console.log('fzstd loaded successfully via script');
          } else {
            console.warn('fzstd script loaded but decompress function not available');
          }
        } catch (scriptError) {
          console.error('fzstd script loading failed:', scriptError.message);
        }
      }));

      imports.push(import('https://cdn.jsdelivr.net/npm/pako@2.1.0/+esm').then(module => {
        pakoModule = module;
      }).catch(async (error) => {
        console.warn('pako ES module failed, trying script fallback:', error.message);
        try {
          await loadViaScript('pako', "https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js");
          pakoModule = window.pako;
        } catch (scriptError) {
          console.error('pako script loading also failed:', scriptError.message);
        }
      }));
    }

    // Wait for all imports to complete
    await Promise.all(imports);

    // Create library interface with detailed logging
    zarrLibraries = {
      zarr: zarrModule || window.zarr || null,
      fzstd: fzstdModule || window.fzstd || null,
      pako: pakoModule || window.pako || null,
      version: version,
      loadedAt: new Date()
    };

    // Ensure zarr has the expected API
    if (zarrLibraries.zarr && typeof zarrLibraries.zarr.open === 'function' && typeof zarrLibraries.zarr.HTTPStore === 'function') {
      // Zarr library has expected API
    } else {
      console.warn('Zarr library may not have expected API:', {
        hasOpen: zarrLibraries.zarr && typeof zarrLibraries.zarr.open === 'function',
        hasHTTPStore: zarrLibraries.zarr && typeof zarrLibraries.zarr.HTTPStore === 'function',
        zarrKeys: zarrLibraries.zarr ? Object.keys(zarrLibraries.zarr) : []
      });
    }

    isZarrLoaded = true;

    console.log('Zarr library interface created:', {
      hasZarr: !!zarrLibraries.zarr,
      hasFzstd: !!zarrLibraries.fzstd,
      hasPako: !!zarrLibraries.pako,
      zarrType: typeof zarrLibraries.zarr,
      fzstdType: typeof zarrLibraries.fzstd,
      pakoType: typeof zarrLibraries.pako,
      windowFzstd: !!(window && window.fzstd),
      windowFzstdType: typeof (window && window.fzstd)
    });

    // Additional check for fzstd functionality
    if (zarrLibraries.fzstd && typeof zarrLibraries.fzstd.decompress === 'function') {
      console.log('fzstd decompress function is available');
    } else if (zarrLibraries.fzstd) {
      console.warn('fzstd is loaded but decompress function not available:', Object.keys(zarrLibraries.fzstd));
    } else {
      console.warn('fzstd is not loaded');
    }

    return zarrLibraries;

  } catch (error) {
    console.error('Failed to load Zarr libraries:', error);
    throw new Error(`Zarr library loading failed: ${error.message}`);
  }
}

/**
 * Fallback script loading method
 */
async function loadViaScript(name, src) {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.zarr) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait for the library to be available on window
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      const checkLibrary = () => {
        attempts++;
        if (window.zarr || window.fzstd || window.pako) {
          // Library loaded successfully
          resolve();
        } else if (attempts < maxAttempts) {
          setTimeout(checkLibrary, 100);
        } else {
          reject(new Error(`${name} library not available on window after ${maxAttempts} attempts`));
        }
      };
      checkLibrary();
    };

    script.onerror = (error) => {
      reject(new Error(`Failed to load script: ${src} - ${error.message || 'Unknown error'}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Checks if Zarr libraries are loaded
 * @method isLoaded
 * @memberof ZarrLoader
 * @returns {boolean} True if libraries are loaded
 * @example
 * zarrLoader.isLoaded();
 */
function isLoaded() {
  return isZarrLoaded && zarrLibraries !== null;
}

/**
 * Gets information about the Zarr loader
 * @method getInfo
 * @memberof ZarrLoader
 * @returns {Object} Information about supported features
 * @example
 * zarrLoader.getInfo();
 */
function getInfo() {
  return {
    name: 'Zarr',
    description: 'Cloud-native chunked array storage format',
    version: '0.6.0',
    supportedVersions: ['v2', 'v3'],
    features: [
      'Chunked storage',
      'Compression support (Zstd, GZip)',
      'Cloud storage integration',
      'Multi-dimensional arrays',
      'Lazy loading'
    ],
    dependencies: [
      'fzstd (Zstandard compression)',
      'pako (GZip compression)'
    ]
  };
}

/**
 * Creates a Zarr store from a URL
 * @method createStore
 * @memberof ZarrLoader
 * @param {string} url - URL to Zarr store
 * @param {Object} [options] - Store options
 * @returns {Promise} Promise resolving to Zarr store
 * @example
 * await zarrLoader.createStore('https://example.com/data.zarr');
 */
async function createStore(url, options = {}) {
  if (!isLoaded()) {
    await load();
  }

  if (!zarrLibraries.zarr) {
    throw new Error('Zarr core library not available');
  }

  try {
    const store = new zarrLibraries.zarr.HTTPStore(url);
    return store;
  } catch (error) {
    throw new Error(`Failed to create Zarr store: ${error.message}`);
  }
}

/**
 * Opens a Zarr array from a store
 * @method openArray
 * @memberof ZarrLoader
 * @param {Object} store - Zarr store
 * @param {string} path - Path to array within store
 * @returns {Promise} Promise resolving to Zarr array
 * @example
 * const array = await zarrLoader.openArray(store, 'temperature');
 */
async function openArray(store, path) {
  if (!isLoaded()) {
    await load();
  }

  if (!zarrLibraries.zarr) {
    throw new Error('Zarr core library not available');
  }

  try {
    const zarrArray = await zarrLibraries.zarr.open(store, path);
    return zarrArray;
  } catch (error) {
    throw new Error(`Failed to open Zarr array: ${error.message}`);
  }
}

export default {
  load,
  isLoaded,
  getInfo,
  createStore,
  openArray
};
