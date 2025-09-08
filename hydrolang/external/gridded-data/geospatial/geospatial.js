import * as divisors from "../../../modules/visualize/divisors.js";

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
    includeTurf = true
  } = options;

  if (isGeospatialLoaded) {
    return geospatialLibraries;
  }

  try {
    console.log('Loading geospatial libraries...');

    let libraries = [];

    if (includeProj4) {
      // Load Proj4 for coordinate transformations
      const proj4 = divisors.createScript({
        params: {
          src: "https://cdn.jsdelivr.net/npm/proj4@2.9.0/dist/proj4.min.js",
          name: "proj4"
        }
      });
      libraries.push(proj4);
    }

    if (includeGeoTIFF) {
      // Load GeoTIFF for geospatial TIFF files
      const geotiff = divisors.createScript({
        params: {
          src: "https://cdn.jsdelivr.net/npm/geotiff@2.1.3/dist/geotiff.min.js",
          name: "geotiff"
        }
      });
      libraries.push(geotiff);
    }

    if (includeTurf) {
      // Load Turf.js for advanced geospatial operations
      const turf = divisors.createScript({
        params: {
          src: "https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js",
          name: "turf"
        }
      });
      libraries.push(turf);
    }

    // Load additional utility libraries
    const geoUtils = divisors.createScript({
      params: {
        src: "https://cdn.jsdelivr.net/npm/geolib@3.3.3/lib/index.min.js",
        name: "geolib"
      }
    });
    libraries.push(geoUtils);

    // Wait for all scripts to load
    await Promise.all(
      libraries.map(lib => new Promise((resolve) => {
        lib.onload = resolve;
        lib.onerror = () => resolve(); // Continue even if error
      }))
    );

    // Create library interface
    geospatialLibraries = {
      proj4: window.proj4 || null,
      GeoTIFF: window.GeoTIFF || null,
      turf: window.turf || null,
      geolib: window.geolib || null,
      loadedAt: new Date()
    };

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
      'Geospatial operations',
      'Distance calculations',
      'Geometry processing'
    ],
    dependencies: [
      'proj4 (Coordinate transformations)',
      'geotiff (GeoTIFF support)',
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
 * Loads a GeoTIFF file from URL
 * @method loadGeoTIFF
 * @memberof GeospatialLoader
 * @param {string} url - URL to GeoTIFF file
 * @returns {Promise} Promise resolving to GeoTIFF object
 * @example
 * const geotiff = await geospatialLoader.loadGeoTIFF('https://example.com/data.tif');
 */
async function loadGeoTIFF(url) {
  if (!isLoaded() || !geospatialLibraries.GeoTIFF) {
    throw new Error('Geospatial libraries not loaded');
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const tiff = await geospatialLibraries.GeoTIFF.fromArrayBuffer(arrayBuffer);
    return tiff;
  } catch (error) {
    throw new Error(`Failed to load GeoTIFF: ${error.message}`);
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
  geospatialOperation
};
