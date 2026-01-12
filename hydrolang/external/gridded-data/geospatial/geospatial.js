import * as divisors from "../../../modules/visualize/divisors.js";
import { loamService } from "./loam/loam-use.js";

/**
 * Geospatial data format loader
 * Provides lazy loading for geospatial libraries and dependencies
 * @external GeospatialLoader
 */

let geospatialLibraries = null;
let isGeospatialLoaded = false;


/**
 * Loads geospatial-related libraries and dependencies
 * @method load
 * @memberof GeospatialLoader
 * @param {Object} [options] - Loading options
 * @param {boolean} [options.includeProj4=true] - Include Proj4 coordinate transformations
 * @param {boolean} [options.includeGeoTIFF=true] - Include GeoTIFF support
 * @param {boolean} [options.includeTurf=true] - Include Turf.js for geospatial operations
 * @returns {Promise<Object>} Promise resolving to loaded geospatial libraries
 * @example
 * await geospatialLoader.load({
 *   includeProj4: true,
 *   includeGeoTIFF: true,
 *   includeTurf: true
 * });
 */
async function load(options = {}) {
  const {
    includeProj4 = true,
    includeGeoTIFF = true,
    includeTurf = true,
    includeGeolib = true,
    includeGDAL = true,
  } = options;

  if (isGeospatialLoaded) {
    return geospatialLibraries;
  }

  try {
    console.log('Loading geospatial libraries...');

    let libraries = [];

    if (includeProj4) {
      const proj4 = divisors.createScript({
        params: {
          src: "https://cdn.jsdelivr.net/npm/proj4@2.9.0/dist/proj4.min.js",
          name: "proj4"
        }
      });
      libraries.push(proj4);
    }

    if (includeGeoTIFF) {
      const geotiff = divisors.createScript({
        params: {
          src: "https://cdn.jsdelivr.net/npm/geotiff@2.1.3/dist-browser/geotiff.js",
          name: "geotiff"
        }
      });
      libraries.push(geotiff);

      const pako = divisors.createScript({
        params: {
          src: "https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js",
          name: "pako"
        }
      });
      libraries.push(pako);
    }

    if (includeTurf) {
      const turf = divisors.createScript({
        params: {
          src: "https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js",
          name: "turf"
        }
      });
      libraries.push(turf);
    }

    if (includeGeolib) {
      const geoUtils = divisors.createScript({
        params: {
          src: "https://cdn.jsdelivr.net/npm/geolib@3.3.3/lib/index.min.js",
          name: "geolib"
        }
      });
      libraries.push(geoUtils);
    }

    /* 
     * Load Loam (GDAL WASM) via LoamService
     */
    let loamInstance = null;
    if (includeGDAL) {
      loamInstance = loamService; // Use the imported singleton service
    }

    // Wait for all scripts to load
    await Promise.all(
      libraries.map(lib => new Promise((resolve, reject) => {
        lib.onload = resolve;
        lib.onerror = () => reject(new Error(`Failed to load library: ${lib.src}`));
      }))
    );

    // Create library interface
    const globalObj = typeof window !== 'undefined' ? window : globalThis;
    geospatialLibraries = {
      proj4: globalObj.proj4 || null,
      GeoTIFF: globalObj.GeoTIFF || null,
      pako: globalObj.pako || null,
      turf: globalObj.turf || null,
      geolib: globalObj.geolib || null,
      loam: loamInstance || null, // Use our instance
      loadedAt: new Date()
    };

    // Initialize loam (GDAL) if loaded
    if (geospatialLibraries.loam) {
      try {
        await geospatialLibraries.loam.initialize();
        console.log('GDAL (loam) initialized via LoamService');
      } catch (e) {
        console.warn('GDAL (loam) initialization failed:', e);
      }
    }

    // Define common projections if proj4 is available
    if (geospatialLibraries.proj4) {
      geospatialLibraries.proj4.defs("EPSG:5070", "+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
      geospatialLibraries.proj4.defs("EPSG:4269", "+proj=longlat +ellps=GRS80 +datum=NAD83 +no_defs");
      console.log('Defined common Proj4 projections (EPSG:5070, EPSG:4269)');
    }

    isGeospatialLoaded = true;
    console.log('Geospatial libraries loaded successfully');

    return geospatialLibraries;

  } catch (error) {
    console.error('Failed to load geospatial libraries:', error);
    throw new Error(`Geospatial library loading failed: ${error.message}`);
  }
}

/**
 * Checks if geospatial libraries are loaded
 * @method isLoaded
 * @memberof GeospatialLoader
 * @returns {boolean} True if libraries are loaded
 * @example
 * geospatialLoader.isLoaded();
 */
function isLoaded() {
  return isGeospatialLoaded && geospatialLibraries !== null;
}

/**
 * Gets information about the geospatial loader
 * @method getInfo
 * @memberof GeospatialLoader
 * @returns {Object} Information about supported features
 * @example
 * geospatialLoader.getInfo();
 */
function getInfo() {
  return {
    name: 'Geospatial',
    description: 'Geospatial data processing and coordinate systems',
    features: [
      'Coordinate transformations',
      'GeoTIFF support',
      'Generic TIFF support (fallback)',
      'Gzip decompression',
      'Geospatial operations',
      'Distance calculations',
      'Geometry processing'
    ],
    dependencies: [
      'proj4 (Coordinate transformations)',
      'geotiff (GeoTIFF support)',
      'tiff (Generic TIFF support)',
      'pako (Gzip decompression)',
      'turf (Geospatial operations)',
      'geolib (Geospatial utilities)'
    ]
  };
}

/**
 * Transforms coordinates between different coordinate systems
 * @method transformCoordinates
 * @memberof GeospatialLoader
 * @param {Array} coordinates - [longitude, latitude] coordinates
 * @param {string} fromProj - Source projection (e.g., 'EPSG:4326')
 * @param {string} toProj - Target projection
 * @returns {Array} Transformed coordinates
 * @example
 * const transformed = geospatialLoader.transformCoordinates(
 *   [-74.0060, 40.7128],
 *   'EPSG:4326',
 *   'EPSG:3857'
 * );
 */
function transformCoordinates(coordinates, fromProj, toProj) {
  if (!isLoaded() || !geospatialLibraries.proj4) {
    throw new Error('Geospatial libraries not loaded');
  }

  try {
    return geospatialLibraries.proj4(fromProj, toProj, coordinates);
  } catch (error) {
    throw new Error(`Coordinate transformation failed: ${error.message}`);
  }
}

/**
 * Calculates distance between two points
 * @method calculateDistance
 * @memberof GeospatialLoader
 * @param {Object} point1 - First point {latitude, longitude}
 * @param {Object} point2 - Second point {latitude, longitude}
 * @param {string} [unit='meters'] - Distance unit
 * @returns {number} Distance between points
 * @example
 * const distance = geospatialLoader.calculateDistance(
 *   { latitude: 40.7128, longitude: -74.0060 },
 *   { latitude: 34.0522, longitude: -118.2437 },
 *   'miles'
 * );
 */
function calculateDistance(point1, point2, unit = 'meters') {
  if (!isLoaded() || !geospatialLibraries.geolib) {
    throw new Error('Geospatial libraries not loaded');
  }

  try {
    return geospatialLibraries.geolib.getDistance(point1, point2, unit);
  } catch (error) {
    throw new Error(`Distance calculation failed: ${error.message}`);
  }
}

/**
 * Decompresses gzip data
 * @param {ArrayBuffer} compressedData - Gzipped data
 * @returns {Promise<ArrayBuffer>} Decompressed data
 */
async function decompressGzip(compressedData) {
  // Use browser's built-in decompression if available
  if (typeof DecompressionStream !== 'undefined') {
    const decompressedStream = new Response(compressedData).body
      .pipeThrough(new DecompressionStream('gzip'));
    return new Response(decompressedStream).arrayBuffer();
  }

  // Fallback: try to use pako if available
  if (typeof globalThis.pako !== 'undefined') {
    return globalThis.pako.ungzip(compressedData);
  } else if (typeof window !== 'undefined' && window.pako) {
    return window.pako.ungzip(compressedData);
  }

  throw new Error('No gzip decompression available');
}

/**
 * Loads GeoTIFF from array buffer directly
 * @param {ArrayBuffer} arrayBuffer - Raw TIFF data
 * @returns {Promise<Object>} Parsed TIFF data
 */
async function loadGeoTIFFFromBuffer(arrayBuffer) {
  // Try GeoTIFF first
  if (geospatialLibraries.GeoTIFF) {
    try {
      const geotiff = await geospatialLibraries.GeoTIFF.fromArrayBuffer(arrayBuffer);
      return { type: 'geotiff', data: geotiff };
    } catch (geotiffError) {
      console.warn('GeoTIFF buffer parsing failed:', geotiffError.message);
    }
  }

  // Fallback to Tiff.js
  if (geospatialLibraries.Tiff) {
    try {
      const tiff = new geospatialLibraries.Tiff({ buffer: arrayBuffer });
      return { type: 'tiff', data: tiff };
    } catch (tiffError) {
      console.warn('Tiff.js buffer parsing failed:', tiffError.message);
    }
  }

  throw new Error('No TIFF parser could handle the buffer');
}

/**
 * Loads a GeoTIFF file from URL with fallback to Tiff.js
 * @method loadGeoTIFF
 * @memberof GeospatialLoader
 * @param {string} url - URL to GeoTIFF file
 * @returns {Promise} Promise resolving to GeoTIFF/TIFF object
 * @example
 * const geotiff = await geospatialLoader.loadGeoTIFF('https://example.com/data.tif');
 */
async function loadGeoTIFF(url) {
  if (!isLoaded()) {
    throw new Error('Geospatial libraries not loaded');
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // Debug: Check file signature
    const uint8Array = new Uint8Array(arrayBuffer);
    const signature = Array.from(uint8Array.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ');
    console.log('File signature (first 16 bytes):', signature);

    // Check for common signatures
    if (signature.startsWith('49 49') || signature.startsWith('4d 4d')) {
      console.log('File appears to be a standard TIFF');
    } else if (signature.startsWith('47 52 49 42')) {
      console.log('File appears to be a GRIB file (not TIFF)');
      throw new Error('File is actually a GRIB file, not TIFF');
    } else if (signature.startsWith('1f 8b')) {
      console.log('File is still gzipped, decompressing manually...');

      // Try manual decompression first (more reliable for MRMS files)
      try {
        console.log('Attempting manual gzip decompression...');
        // Use pako for more reliable decompression
        const pakoLib = globalThis.pako || (typeof window !== 'undefined' && window.pako);
        if (pakoLib) {
          const decompressed = pakoLib.ungzip(new Uint8Array(arrayBuffer));
          console.log(`Decompressed from ${arrayBuffer.byteLength} to ${decompressed.length} bytes`);

          // Convert back to ArrayBuffer for GeoTIFF
          const decompressedBuffer = decompressed.buffer.slice(
            decompressed.byteOffset,
            decompressed.byteOffset + decompressed.byteLength
          );

          return loadGeoTIFFFromBuffer(decompressedBuffer);
        } else {
          throw new Error('Pako library not available for decompression');
        }
      } catch (manualError) {
        console.warn('Manual decompression failed:', manualError.message);

        // Fallback to built-in decompression
        try {
          console.log('Trying built-in decompression...');
          const decompressed = await decompressGzip(arrayBuffer);
          return loadGeoTIFFFromBuffer(decompressed);
        } catch (builtinError) {
          console.warn('Built-in decompression also failed:', builtinError.message);
        }
      }
    } else {
      console.log('Unknown file signature, might be a proprietary format');
      console.log('Full signature:', signature);
    }

    // Try GeoTIFF first
    if (geospatialLibraries.GeoTIFF) {
      try {
        const geotiff = await geospatialLibraries.GeoTIFF.fromArrayBuffer(arrayBuffer);
        return { type: 'geotiff', data: geotiff };
      } catch (geotiffError) {
        console.warn('GeoTIFF parsing failed:', geotiffError.message);
      }
    }

    // Fallback to Tiff.js
    if (geospatialLibraries.Tiff) {
      try {
        const tiff = new geospatialLibraries.Tiff({ buffer: arrayBuffer });
        return { type: 'tiff', data: tiff };
      } catch (tiffError) {
        console.warn('Tiff.js parsing failed:', tiffError.message);
      }
    }

    // Last resort: try with raw buffer if it's still compressed
    const pakoLib = globalThis.pako || (typeof window !== 'undefined' && window.pako);
    if (pakoLib) {
      try {
        console.log('Trying pako decompression...');
        const decompressed = pakoLib.ungzip(arrayBuffer);
        return await loadGeoTIFFFromBuffer(decompressed);
      } catch (pakoError) {
        console.warn('Pako decompression failed:', pakoError.message);
      }
    }

    throw new Error('No TIFF parser could handle the file');

  } catch (error) {
    throw new Error(`Failed to load TIFF file: ${error.message}`);
  }
}

/**
 * Performs geospatial operations using Turf.js
 * @method geospatialOperation
 * @memberof GeospatialLoader
 * @param {string} operation - Turf.js operation name
 * @param {...*} args - Arguments for the operation
 * @returns {*} Result of the geospatial operation
 * @example
 * const buffer = geospatialLoader.geospatialOperation(
 *   'buffer',
 *   point,
 *   1000,
 *   { units: 'meters' }
 * );
 */
function geospatialOperation(operation, ...args) {
  if (!isLoaded() || !geospatialLibraries.turf) {
    throw new Error('Geospatial libraries not loaded');
  }

  try {
    if (typeof geospatialLibraries.turf[operation] === 'function') {
      return geospatialLibraries.turf[operation](...args);
    } else {
      throw new Error(`Unknown geospatial operation: ${operation}`);
    }
  } catch (error) {
    throw new Error(`Geospatial operation failed: ${error.message}`);
  }
}

export default {
  load,
  isLoaded,
  getInfo,
  transformCoordinates,
  calculateDistance,
  loadGeoTIFF,
  loadGeoTIFFFromBuffer,
  geospatialOperation,
  get libraries() { return geospatialLibraries; }
};
