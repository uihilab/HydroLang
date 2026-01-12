/**
 * ECMWF (European Centre for Medium-Range Weather Forecasts) data utilities - Refactored
 * Uses GRIB2DataSource base class to eliminate ~300 lines of duplicate code
 * Supports ERA5 and forecast data with API-based and direct file access
 */

import { GRIB2DataSource } from './gridded-data-utils.js';
import * as datasources from '../datasources.js';

/**
 * ECMWF-specific data source implementation (ERA5)
 * Extends GRIB2DataSource with ERA5-specific API handling
 */
export class ECMWFDataSource extends GRIB2DataSource {
  constructor(datasetConfig, ecmwfVariables = null) {
    super({
      sourceName: 'ecmwf',
      libraryType: 'grib2',
      datasourceConfig: datasetConfig,
      variables: ecmwfVariables
    });
    this.datasetConfig = datasetConfig;
  }

  /**
   * Enhanced fetch with ECMWF-specific error messages
   */
  async fetch(url, options = {}) {
    try {
      return await super.fetch(url, options);
    } catch (error) {
      // Enhance error messages with ECMWF-specific guidance
      if (error.message.includes('403')) {
        throw new Error(`${error.message} May require API key or authentication.`);
      } else if (error.message.includes('429')) {
        throw new Error(`${error.message} Please wait before retrying.`);
      } else if (error.message.includes('404')) {
        throw new Error(`${error.message} The requested data may not be available or the parameters may be incorrect.`);
      }
      throw error;
    }
  }

  /**
   * Process ECMWF GRIB2 file
   */
  async processGRIB2File(fileBuffer, options = {}) {
    // Check if file needs decompression
    const decompressed = await this.decompress(fileBuffer, null, options);

    if (options.process !== true) {
      return decompressed; // Return raw buffer if raw mode
    }

    // Parse GRIB2
    return await this.parseGRIB2(decompressed);
  }

  /**
   * Extract point data from ERA5 GRIB2 data
   */
  async extractPointData(variable, latitude, longitude, timestamp, options = {}) {
    // Validate coordinates
    this.validateCoordinates(latitude, longitude);

    // If fileBuffer is provided in options, use it directly
    if (options.fileBuffer) {
      const messages = await this.processGRIB2File(options.fileBuffer, options);

      if (options.process !== true && messages instanceof ArrayBuffer) {
        return messages;
      }

      const message = this.findGRIB2Message(messages, variable);
      const rawValue = this.getGRIB2ValueAtPoint(message, latitude, longitude);

      const variableMeta = this.variables?.[variable] || {};
      const scaledValue = this.applyScaling(rawValue, variableMeta);

      return {
        value: scaledValue,
        rawValue: rawValue,
        units: variableMeta.units || 'unknown',
        variable: variable,
        timestamp: timestamp.toISOString(),
        location: {
          latitude: latitude,
          longitude: longitude
        },
        metadata: {
          source: 'ERA5',
          description: variableMeta.description
        }
      };
    }

    throw new Error('ERA5 point data extraction requires fileBuffer in options. Use extractERA5Data() to fetch data first.');
  }

  /**
   * Extract grid data from ERA5 GRIB2 data
   */
  async extractGridData(variable, bbox, timestamp, options = {}) {
    // Validate bbox
    this.validateBbox(bbox);

    // If fileBuffer is provided in options, use it directly
    if (options.fileBuffer) {
      const messages = await this.processGRIB2File(options.fileBuffer, options);

      if (options.process !== true && messages instanceof ArrayBuffer) {
        return messages;
      }

      const message = this.findGRIB2Message(messages, variable);
      const gridResult = this.getGRIB2Grid(message, bbox);

      const variableMeta = this.variables?.[variable] || {};
      const scaledData = gridResult.data.map(val => this.applyScaling(val, variableMeta));

      // Apply spatial aggregation if requested
      let aggregatedValue = null;
      if (options.aggregation) {
        aggregatedValue = this.aggregateSpatially(scaledData, options.aggregation);
      }

      return {
        data: scaledData,
        latitudes: gridResult.latitudes,
        longitudes: gridResult.longitudes,
        bbox: bbox,
        count: gridResult.count,
        variable: variable,
        timestamp: timestamp.toISOString(),
        ...(aggregatedValue !== null && { aggregatedValue }),
        metadata: {
          source: 'ERA5',
          units: variableMeta.units,
          description: variableMeta.description,
          ...(options.aggregation && { aggregationType: options.aggregation })
        }
      };
    }

    throw new Error('ERA5 grid data extraction requires fileBuffer in options. Use extractERA5Data() to fetch data first.');
  }

  /**
   * Extract raw GRIB2 data (Request -> Poll -> Download)
   * Supports same interface as NLDAS for raw retrieval
   */
  async extractRawGRIB2(args) {
    console.log('[ecmwf] Starting raw GRIB2 retrieval sequence...');

    // 1. Initiate Request
    const initialResponse = await extractERA5Data(args, this.datasetConfig);

    // 2. Poll for Completion
    const status = await pollECMWFStatus(initialResponse.requestId, this.datasetConfig);

    // 3. Download File
    if (status.result_url) {
      // Return the raw buffer directly (no parsing)
      return await downloadERA5File(status.result_url);
    }

    throw new Error('ECMWF request completed but no result_url provided');
  }
}

// ============================================================================
// ERA5 API-SPECIFIC FUNCTIONS
// These handle the ERA5 API request/response flow
// ============================================================================

/**
 * Extract ERA5 data from ECMWF API response
 * @param {Object} requestParams - ECMWF API request parameters
 * @param {Object} datasetConfig - ECMWF dataset configuration
 * @returns {Promise<Object>} ERA5 data
 * @private
 */
export async function extractERA5Data(requestParams, datasetConfig) {
  console.log(`[ecmwf] Extracting ERA5 data with params:`, requestParams);

  try {
    // For ERA5, we need to make an API request to get the data
    const apiUrl = datasetConfig.endpoint;
    const proxy = datasources.proxies["local-proxy"].endpoint;
    const proxiedUrl = proxy + apiUrl;

    console.log(`[ecmwf] Making ERA5 API request to: ${proxiedUrl}`);

    const response = await fetch(proxiedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestParams)
    });

    if (!response.ok) {
      throw new Error(`ERA5 API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[ecmwf] ERA5 API response:', result);

    // ERA5 API returns a request ID, not direct data
    return {
      requestId: result.request_id || result.id,
      status: result.status || 'accepted',
      message: result.message || 'Request submitted',
      dataUrl: result.data_url || null
    };

  } catch (error) {
    console.error(`[ecmwf] ERA5 API request failed:`, error.message);
    throw new Error(`ERA5 API request failed: ${error.message}`);
  }
}

/**
 * Download ERA5 file from data URL
 * @param {string} dataUrl - URL to download ERA5 data from
 * @returns {Promise<ArrayBuffer>} ERA5 file data
 * @private
 */
export async function downloadERA5File(dataUrl) {
  console.log(`[ecmwf] Downloading ERA5 file from: ${dataUrl}`);

  // Need to ensure proxy is used for the download if applicable
  // Using the local-proxy explicitly as requested by user
  const proxy = datasources.proxies["local-proxy"].endpoint;
  const proxiedUrl = proxy + dataUrl;

  console.log(`[ecmwf] Downloading with proxy: ${proxiedUrl}`);

  const ecmwf = new ECMWFDataSource({});
  // Pass the proxied URL directly designated as the target
  // ecmwf.fetch handles generic fetch logic
  return await ecmwf.fetch(proxiedUrl);
}

/**
 * Process ERA5 GRIB2 data
 * @param {ArrayBuffer} fileBuffer - ERA5 GRIB2 file data
 * @param {Object} extractOptions - Extraction options (variable, bbox, point, etc.)
 * @returns {Promise<Object>} Processed ERA5 data
 * @private
 */
export async function processERA5GRIB2Data(fileBuffer, extractOptions = {}) {
  console.log(`[ecmwf] Processing ERA5 GRIB2 data (${(fileBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);

  const ecmwf = new ECMWFDataSource({});

  // Parse GRIB2
  const messages = await ecmwf.processGRIB2File(fileBuffer);

  console.log(`[ecmwf] Found ${messages.length} GRIB2 messages`);

  return {
  };
}

/**
 * Poll for ECMWF request status
 * @param {string} requestId - Request ID to poll
 * @param {Object} datasetConfig - Dataset configuration
 * @returns {Promise<Object>} Completed status object
 * @private
 */
export async function pollECMWFStatus(requestId, datasetConfig) {
  const proxy = datasources.proxies["local-proxy"].endpoint;
  const endpoint = `${datasetConfig.endpoint}/${requestId}`;
  const pollUrl = proxy + endpoint;

  console.log(`[ecmwf] Polling status for ${requestId}...`);

  // Max retries or timeout could be added here
  const maxAttempts = 60; // 5 minutes approx with 5s interval
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    // Wait 5 seconds between polls
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const response = await fetch(pollUrl);
      if (!response.ok) {
        throw new Error(`Poll request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[ecmwf] Status: ${result.status}`);

      if (result.status === 'completed') {
        return result;
      } else if (result.status === 'failed') {
        throw new Error(`ECMWF request failed: ${result.message || 'Unknown error'}`);
      }
      // If 'queued' or 'running', continue loop
    } catch (e) {
      console.warn(`[ecmwf] Poll error: ${e.message}`);
      // Continue polling despite transient errors? 
      // Maybe throw if it's a 404 meaning ID is gone
    }
  }
  throw new Error('ECMWF request timed out');
}

// ============================================================================
// BACKWARD COMPATIBLE EXPORTED FUNCTIONS
// ============================================================================

/**
 * Extract point data from ERA5 GRIB2 file
 * @param {string} variable - Variable name
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - ECMWF dataset configuration
 * @returns {Promise<Object>} Extracted point data
 * @private
 */
export async function extractERA5PointData(variable, latitude, longitude, timestamp, datasetConfig) {
  console.log(`[ecmwf] Extracting ERA5 ${variable} at (${latitude}, ${longitude}) for ${timestamp.toISOString()}`);

  // Note: This function requires the user to fetch ERA5 data first
  // The actual implementation would need the fileBuffer
  // For now, throw an informative error
  throw new Error(
    'ERA5 point data extraction requires a two-step process:\n' +
    '1. Call extractERA5Data() to request data from ECMWF API\n' +
    '2. Call downloadERA5File() to get the file\n' +
    '3. Call processERA5GRIB2Data() to extract point data\n' +
    'Or provide fileBuffer in options if you already have the data.'
  );
}

/**
 * Extract grid data from ERA5 GRIB2 file
 * @param {string} variable - Variable name
 * @param {Array<number>} bbox - Bounding box [west, south, east, north]
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - ECMWF dataset configuration
 * @returns {Promise<Object>} Extracted grid data
 * @private
 */
export async function extractERA5GridData(variable, bbox, timestamp, datasetConfig) {
  console.log(`[ecmwf] Extracting ERA5 ${variable} grid for ${timestamp.toISOString()}`);

  // Same as point data - requires two-step process
  throw new Error(
    'ERA5 grid data extraction requires a two-step process:\n' +
    '1. Call extractERA5Data() to request data from ECMWF API\n' +
    '2. Call downloadERA5File() to get the file\n' +
    '3. Call processERA5GRIB2Data() to extract grid data\n' +
    'Or provide fileBuffer in options if you already have the data.'
  );
}

/**
 * Extract time series data from ERA5
 * @param {string} variable - Variable name
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} startTime - Start of time range
 * @param {Date} endTime - End of time range
 * @param {Object} datasetConfig - ECMWF dataset configuration
 * @returns {Promise<Object>} Time series data
 * @private
 */
export async function extractERA5TimeSeries(variable, latitude, longitude, startTime, endTime, datasetConfig) {
  console.log(`[ecmwf] Extracting ERA5 ${variable} time series from ${startTime.toISOString()} to ${endTime.toISOString()}`);

  // ERA5 time series requires multiple API requests or a single request with multiple time steps
  throw new Error(
    'ERA5 time series extraction requires:\n' +
    '1. Submit API request with time range using extractERA5Data()\n' +
    '2. Download the resulting file with downloadERA5File()\n' +
    '3. Process the time series from the GRIB2 file\n' +
    'ERA5 typically provides hourly data.'
  );
}

/**
 * Get available ERA5 variables
 * @returns {Array<string>} Available variable names
 * @private
 */
export function getAvailableERA5Variables() {
  // This should load from ECMWF datasource configuration
  // Common ERA5 variables
  return [
    '2t', // 2m temperature
    'tp', // Total precipitation
    'u10', 'v10', // 10m wind components
    'sp', // Surface pressure
    'msl', // Mean sea level pressure
    'd2m', // 2m dewpoint temperature
    // Add more as needed from datasource config
  ];
}

/**
 * Validate ERA5 configuration
 * @param {Object} config - Configuration to validate
 * @returns {boolean} True if valid
 * @private
 */
export function validateERA5Config(config) {
  const required = ['endpoint', 'spatial', 'temporal'];

  for (const field of required) {
    if (!config[field]) {
      console.error(`ERA5 config missing required field: ${field}`);
      return false;
    }
  }

  return true;
}
