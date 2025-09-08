import * as divisors from "../../modules/visualize/divisors.js";
import zarrLoader from "./zarr/zarr.js";
import netcdfLoader from "./netcdf/netcdf.js";
import hdf5Loader from "./hdf5/hdf5.js";
import geospatialLoader from "./geospatial/geospatial.js";

/**
 * Scientific Data Format Loader
 * Provides lazy loading capabilities for various scientific data formats
 * including Zarr, NetCDF, HDF5, and geospatial libraries
 * @external SciData
 */

/**
 * Loads scientific data format libraries based on the requested format
 * @method loadLibrary
 * @memberof SciData
 * @param {Object} params - Configuration object
 * @param {string} params.format - Data format ('zarr', 'netcdf', 'hdf5', 'geospatial')
 * @param {Object} [params.options] - Format-specific options
 * @returns {Promise} Promise resolving to loaded library
 * @example
 * // Load Zarr library
 * hydro.external.sciData.loadLibrary({
 *   format: 'zarr',
 *   options: { version: 'v2' }
 * });
 *
 * // Load NetCDF library
 * hydro.external.sciData.loadLibrary({
 *   format: 'netcdf',
 *   options: { compression: true }
 * });
 */
async function loadLibrary({ params, args, data } = {}) {
  const { format, options = {} } = params;

  switch (format) {
    case 'zarr':
      return await zarrLoader.load(options);
    case 'netcdf':
      return await netcdfLoader.load(options);
    case 'hdf5':
      return await hdf5Loader.load(options);
    case 'geospatial':
      return await geospatialLoader.load(options);
    default:
      throw new Error(`Unsupported scientific data format: ${format}`);
  }
}

/**
 * Checks if a scientific data format library is already loaded
 * @method isLoaded
 * @memberof SciData
 * @param {Object} params - Configuration object
 * @param {string} params.format - Data format to check
 * @returns {boolean} True if library is loaded
 * @example
 * hydro.external.sciData.isLoaded({ format: 'zarr' });
 */
function isLoaded({ params, args, data } = {}) {
  const { format } = params;

  switch (format) {
    case 'zarr':
      return zarrLoader.isLoaded();
    case 'netcdf':
      return netcdfLoader.isLoaded();
    case 'hdf5':
      return hdf5Loader.isLoaded();
    case 'geospatial':
      return geospatialLoader.isLoaded();
    default:
      return false;
  }
}

/**
 * Gets information about supported scientific data formats
 * @method getSupportedFormats
 * @memberof SciData
 * @returns {Array} Array of supported format names
 * @example
 * hydro.external.sciData.getSupportedFormats();
 */
function getSupportedFormats() {
  return ['zarr', 'netcdf', 'hdf5', 'geospatial'];
}

/**
 * Gets detailed information about a specific format
 * @method getFormatInfo
 * @memberof SciData
 * @param {Object} params - Configuration object
 * @param {string} params.format - Format to get info about
 * @returns {Object} Format information
 * @example
 * hydro.external.sciData.getFormatInfo({ format: 'zarr' });
 */
function getFormatInfo({ params, args, data } = {}) {
  const { format } = params;

  switch (format) {
    case 'zarr':
      return zarrLoader.getInfo();
    case 'netcdf':
      return netcdfLoader.getInfo();
    case 'hdf5':
      return hdf5Loader.getInfo();
    case 'geospatial':
      return geospatialLoader.getInfo();
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

export {
  loadLibrary,
  isLoaded,
  getSupportedFormats,
  getFormatInfo
};
