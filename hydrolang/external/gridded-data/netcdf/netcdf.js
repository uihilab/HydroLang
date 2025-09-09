import * as divisors from "../../../modules/visualize/divisors.js";

/**
 * NetCDF data format loader
 * Provides lazy loading for NetCDF format libraries and dependencies
 * @external NetCDFLoader
 */

let netcdfLibraries = null;
let isNetCDFLoaded = false;

/**
 * Loads NetCDF-related libraries and dependencies
 * @method load
 * @memberof NetCDFLoader
 * @param {Object} [options] - Loading options
 * @param {boolean} [options.includeJS=true] - Include JavaScript NetCDF library
 * @param {boolean} [options.includeGeo=true] - Include geospatial extensions
 * @returns {Promise<Object>} Promise resolving to loaded NetCDF libraries
 * @example
 * await netcdfLoader.load({ includeJS: true, includeGeo: true });
 */
async function load(options = {}) {
  const { includeJS = true, includeGeo = true } = options;

  if (isNetCDFLoaded) {
    return netcdfLibraries;
  }

  try {
    console.log('Loading NetCDF libraries...');

    let libraries = [];

    if (includeJS) {
      // Load NetCDF.js library
      const netcdfJS = divisors.createScript({
        params: {
          src: "https://cdn.jsdelivr.net/npm/netcdfjs@1.2.2/build/netcdfjs.min.js",
          name: "netcdfjs"
        }
      });
      libraries.push(netcdfJS);
    }

    if (includeGeo) {
      // Load additional geospatial libraries for NetCDF
      const geoLibs = [
        divisors.createScript({
          params: {
            src: "https://cdn.jsdelivr.net/npm/geotiff@2.1.3/dist/geotiff.min.js",
            name: "geotiff"
          }
        }),
        divisors.createScript({
          params: {
            src: "https://cdn.jsdelivr.net/npm/proj4@2.9.0/dist/proj4.min.js",
            name: "proj4"
          }
        })
      ];
      libraries.push(...geoLibs);
    }

    // Wait for all scripts to load
    await Promise.all(
      libraries.map(lib => new Promise((resolve) => {
        lib.onload = resolve;
        lib.onerror = () => resolve(); // Continue even if error
      }))
    );

    // Create library interface
    netcdfLibraries = {
      netcdfjs: window.netcdfjs || null,
      geotiff: window.GeoTIFF || null,
      proj4: window.proj4 || null,
      loadedAt: new Date()
    };

    isNetCDFLoaded = true;
    console.log('NetCDF libraries loaded successfully');

    return netcdfLibraries;

  } catch (error) {
    console.error('Failed to load NetCDF libraries:', error);
    throw new Error(`NetCDF library loading failed: ${error.message}`);
  }
}

/**
 * Checks if NetCDF libraries are loaded
 * @method isLoaded
 * @memberof NetCDFLoader
 * @returns {boolean} True if libraries are loaded
 * @example
 * netcdfLoader.isLoaded();
 */
function isLoaded() {
  return isNetCDFLoaded && netcdfLibraries !== null;
}

/**
 * Gets information about the NetCDF loader
 * @method getInfo
 * @memberof NetCDFLoader
 * @returns {Object} Information about supported features
 * @example
 * netcdfLoader.getInfo();
 */
function getInfo() {
  return {
    name: 'NetCDF',
    description: 'Network Common Data Form for gridded data',
    version: '4.0+',
    features: [
      'Multi-dimensional arrays',
      'Metadata storage',
      'Compression support',
      'Coordinate systems',
      'Time series data'
    ],
    dependencies: [
      'netcdfjs (JavaScript NetCDF parser)',
      'geotiff (GeoTIFF support)',
      'proj4 (Coordinate transformations)'
    ]
  };
}

/**
 * Loads a NetCDF file from ArrayBuffer
 * @method loadFile
 * @memberof NetCDFLoader
 * @param {ArrayBuffer} buffer - NetCDF file buffer
 * @returns {Promise} Promise resolving to parsed NetCDF data
 * @example
 * const data = await netcdfLoader.loadFile(buffer);
 */
async function loadFile(buffer) {
  if (!isLoaded()) {
    await load();
  }

  if (!netcdfLibraries.netcdfjs) {
    throw new Error('NetCDF.js library not available');
  }

  try {
    const netcdfData = new netcdfLibraries.netcdfjs(buffer);
    return netcdfData;
  } catch (error) {
    throw new Error(`Failed to load NetCDF file: ${error.message}`);
  }
}

/**
 * Loads a NetCDF file from URL
 * @method loadFromURL
 * @memberof NetCDFLoader
 * @param {string} url - URL to NetCDF file
 * @returns {Promise} Promise resolving to parsed NetCDF data
 * @example
 * const data = await netcdfLoader.loadFromURL('https://example.com/data.nc');
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
    throw new Error(`Failed to load NetCDF from URL: ${error.message}`);
  }
}

/**
 * Extracts variable data from NetCDF
 * @method getVariable
 * @memberof NetCDFLoader
 * @param {Object} netcdfData - Parsed NetCDF data
 * @param {string} variableName - Name of variable to extract
 * @returns {Object} Variable data and metadata
 * @example
 * const variable = netcdfLoader.getVariable(data, 'temperature');
 */
function getVariable(netcdfData, variableName) {
  try {
    const variable = netcdfData.getVariable(variableName);
    const dimensions = variable.dimensions;
    const attributes = variable.attributes;
    const data = variable.read();

    return {
      name: variableName,
      data: data,
      dimensions: dimensions,
      attributes: attributes,
      shape: data.shape || []
    };
  } catch (error) {
    throw new Error(`Failed to extract variable ${variableName}: ${error.message}`);
  }
}

export default {
  load,
  isLoaded,
  getInfo,
  loadFile,
  loadFromURL,
  getVariable
};
