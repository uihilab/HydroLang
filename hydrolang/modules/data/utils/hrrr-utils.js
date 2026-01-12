/**
 * HRRR (High Resolution Rapid Refresh) data utilities - Refactored
 * Uses GRIB2DataSource base class to eliminate ~500 lines of duplicate code
 * Supports GRIB2 format processing and data extraction
 */

import { GRIB2DataSource } from './gridded-data-utils.js';
import { generateHRRRFileURL } from '../datasources/hrrr.js';

/**
 * HRRR-specific data source implementation
 * Extends GRIB2DataSource with HRRR-specific URL generation and forecast handling
 */
export class HRRRDataSource extends GRIB2DataSource {
  constructor(datasetConfig, hrrrVariables) {
    super({
      sourceName: 'hrrr',
      libraryType: 'grib2',
      datasourceConfig: datasetConfig,
      variables: hrrrVariables
    });
    this.datasetConfig = datasetConfig;
    this.forecastHour = 0;
  }

  /**
   * Find appropriate HRRR product for a given variable
   */
  async findProductForVariable(variable) {
    const variableMeta = this.variables[variable];
    if (!variableMeta) {
      throw new Error(`Unknown HRRR variable: ${variable}`);
    }

    // Check if variable has preferred product
    if (variableMeta.product) {
      return variableMeta.product;
    }

    // Search through products for one that contains this variable
    for (const [productName, productConfig] of Object.entries(this.datasetConfig.products || {})) {
      if (productConfig.variables && productConfig.variables.includes(variable)) {
        return productName;
      }
    }

    throw new Error(`No HRRR product found for variable: ${variable}`);
  }

  /**
   * Generate HRRR file URL with forecast hour
   */
  generateURL(product, timestamp, forecastHour = 0) {
    return generateHRRRFileURL(product, timestamp, this.datasetConfig.name || 'hrrr-operational', forecastHour);
  }

  /**
   * Enhanced fetch with HRRR-specific error messages
   */
  async fetch(url, options = {}) {
    try {
      return await super.fetch(url, options);
    } catch (error) {
      // Enhance 404 errors with HRRR-specific guidance
      if (error.message.includes('404')) {
        throw new Error(`${error.message} The requested forecast may not be available yet or the timestamp may be incorrect.`);
      }
      throw error;
    }
  }

  /**
   * Process HRRR GRIB2 file
   */
  async processFile(url, variable, timestamp, options = {}) {
    // Fetch file
    const fileBuffer = await this.fetch(url, { params: { timestamp, variable, ...options.params }, ...options });

    // Check if file needs decompression
    const decompressed = await this.decompress(fileBuffer, null, options);

    // If raw mode, return buffer
    if (options.process !== true) {
      return decompressed;
    }

    // Debug file signature
    const uint8Array = new Uint8Array(decompressed.buffer || decompressed, 0, Math.min(32, decompressed.byteLength || decompressed.length));
    const fileSignature = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join(' ');

    if (fileSignature.startsWith('47 52 49 42')) {
      console.log(`[hrrr] Valid GRIB2 file detected`);
    } else {
      console.warn(`[hrrr] Unknown file signature: ${fileSignature.substring(0, 24)}`);
    }

    // Parse GRIB2
    return await this.parseGRIB2(decompressed);
  }

  /**
   * Extract point data implementation
   */
  async extractPointData(variable, latitude, longitude, timestamp, options = {}) {
    // Validate coordinates
    this.validateCoordinates(latitude, longitude);

    // Get variable metadata
    const variableMeta = this.variables[variable];
    if (!variableMeta) {
      throw new Error(`Unknown HRRR variable: ${variable}`);
    }

    // Find or use provided product
    const product = options.product || await this.findProductForVariable(variable);
    const forecastHour = options.forecastHour || 0;

    if (!this.datasetConfig.products[product]) {
      throw new Error(`Product ${product} not found in dataset ${this.datasetConfig.name || 'hrrr'}`);
    }

    // Generate URL and fetch file
    const url = this.generateURL(product, timestamp, forecastHour);
    console.log(`[hrrr] Fetching ${product} for ${variable} at ${timestamp.toISOString()}, F${forecastHour.toString().padStart(2, '0')}`);

    // Process file
    const messages = await this.processFile(url, variable, timestamp, { ...options, product, forecastHour });

    // Find message for this variable
    const message = this.findGRIB2Message(messages, variable);

    // Extract value at point
    const rawValue = this.getGRIB2ValueAtPoint(message, latitude, longitude);

    if (options.process !== true) {
      return {
        value: rawValue,
        units: variableMeta.units,
        variable,
        timestamp: timestamp.toISOString()
      };
    }

    const scaledValue = this.applyScaling(rawValue, variableMeta);

    return {
      value: scaledValue,
      rawValue: rawValue,
      units: variableMeta.units || 'unknown',
      variable: variable,
      product: product,
      forecastHour: forecastHour,
      timestamp: timestamp.toISOString(),
      location: {
        latitude: latitude,
        longitude: longitude
      },
      metadata: {
        source: 'HRRR',
        product: product,
        forecastHour: forecastHour,
        levelType: variableMeta.levelType,
        description: variableMeta.description
      }
    };
  }

  /**
   * Extract grid data implementation
   */
  async extractGridData(variable, bbox, timestamp, options = {}) {
    // Validate bbox
    this.validateBbox(bbox);

    // Get variable metadata
    const variableMeta = this.variables[variable];
    if (!variableMeta) {
      throw new Error(`Unknown HRRR variable: ${variable}`);
    }

    // Find or use provided product
    const product = options.product || await this.findProductForVariable(variable);
    const forecastHour = options.forecastHour || 0;

    // Generate URL and fetch file
    const url = this.generateURL(product, timestamp, forecastHour);
    console.log(`[hrrr] Fetching grid ${product} for ${variable}, F${forecastHour.toString().padStart(2, '0')}`);

    // Process file
    const messages = await this.processFile(url, variable, timestamp, { ...options, product, forecastHour });

    // Find message for this variable
    const message = this.findGRIB2Message(messages, variable);

    // Extract grid
    const gridResult = this.getGRIB2Grid(message, bbox);

    // Apply scaling to all grid values
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
      product: product,
      forecastHour: forecastHour,
      timestamp: timestamp.toISOString(),
      ...(aggregatedValue !== null && { aggregatedValue }),
      metadata: {
        source: 'HRRR',
        product: product,
        forecastHour: forecastHour,
        units: variableMeta.units,
        description: variableMeta.description,
        ...(options.aggregation && { aggregationType: options.aggregation })
      }
    };
  }
  /**
   * Get dataset info
   */
  async getDatasetInfo(args) {
    const infoType = args.info || args.infoType || 'metadata';

    switch (infoType) {
      case 'variables':
        return {
          variables: this.variables,
          count: Object.keys(this.variables).length
        };

      case 'spatial':
        return this.datasetConfig.spatial;

      case 'temporal':
        return this.datasetConfig.temporal;

      case 'products':
        return {
          products: this.datasetConfig.products,
          count: Object.keys(this.datasetConfig.products).length
        };

      case 'forecast':
        return {
          maxForecastHours: 48,
          forecastInterval: 1,
          availableHours: Array.from({ length: 49 }, (_, i) => i)
        };

      case 'metadata':
        return {
          ...this.datasetConfig,
          variables: this.variables,
          forecastCapabilities: {
            maxHours: 48,
            interval: 1
          }
        };

      default:
        throw new Error(`Unknown HRRR info type: ${infoType}`);
    }
  }
}

// ============================================================================
// BACKWARD COMPATIBLE EXPORTED FUNCTIONS
// These maintain the same API as before but use the new class internally
// ============================================================================

/**
 * Extract point data from HRRR GRIB2 file
 * @param {string} variable - Variable name (e.g., 'TMP', 'APCP')
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - HRRR dataset configuration
 * @param {Object} hrrrVariables - HRRR variables configuration
 * @param {string} product - Specific HRRR product to use (optional)
 * @param {number} forecastHour - Forecast hour (0-48)
 * @returns {Promise<Object>} Extracted point data
 */
export async function extractHRRRPointData(variable, latitude, longitude, timestamp, datasetConfig, hrrrVariables, product = null, forecastHour = 0) {
  const hrrr = new HRRRDataSource(datasetConfig, hrrrVariables);
  return await hrrr.extractPointData(variable, latitude, longitude, timestamp, { product, forecastHour });
}

/**
 * Extract grid data from HRRR GRIB2 file
 * @param {string} variable - Variable name
 * @param {Array<number>} bbox - Bounding box [west, south, east, north]
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - HRRR dataset configuration
 * @param {Object} hrrrVariables - HRRR variables configuration
 * @param {string} product - Specific HRRR product to use (optional)
 * @param {number} forecastHour - Forecast hour (0-48)
 * @param {Object} options - Additional options (aggregation, etc.)
 * @returns {Promise<Object>} Extracted grid data
 */
export async function extractHRRRGridData(variable, bbox, timestamp, datasetConfig, hrrrVariables, product = null, forecastHour = 0, options = {}) {
  const hrrr = new HRRRDataSource(datasetConfig, hrrrVariables);
  return await hrrr.extractGridData(variable, bbox, timestamp, { product, forecastHour, ...options });
}

/**
 * Extract time series data from HRRR
 * Uses inherited extractTimeSeries from base class - NO CODE NEEDED!
 * @param {string} variable - Variable name
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} startTime - Start of time range
 * @param {Date} endTime - End of time range
 * @param {Object} datasetConfig - HRRR dataset configuration
 * @param {Object} hrrrVariables - HRRR variables configuration
 * @param {string} product - Specific HRRR product to use (optional)
 * @returns {Promise<Object>} Time series data
 */
export async function extractHRRRTimeSeries(variable, latitude, longitude, startTime, endTime, datasetConfig, hrrrVariables, product = null) {
  const hrrr = new HRRRDataSource(datasetConfig, hrrrVariables);

  // HRRR temporal resolution is hourly
  const timeIncrement = 60 * 60 * 1000; // 1 hour in milliseconds

  return await hrrr.extractTimeSeries(
    variable,
    latitude,
    longitude,
    startTime,
    endTime,
    {
      product,
      forecastHour: 0, // Analysis only for time series
      timeIncrement,
      temporalResolution: 'hourly'
    }
  );
}

/**
 * Get available HRRR variables
 * @returns {Array<string>} Available variable names
 */
export function getAvailableHRRRVariables() {
  // This would typically load from the HRRR datasource configuration
  // For now, return a placeholder
  console.warn('getAvailableHRRRVariables should load from datasource configuration');
  return [];
}

/**
 * Validate HRRR configuration
 * @param {Object} config - Configuration to validate
 * @returns {boolean} True if valid
 */
export function validateHRRRConfig(config) {
  const required = ['baseUrl', 'spatial', 'temporal', 'products'];

  for (const field of required) {
    if (!config[field]) {
      console.error(`HRRR config missing required field: ${field}`);
      return false;
    }
  }

  // Validate spatial bounds
  const { spatial } = config;
  if (!spatial.latitude || !spatial.longitude) {
    console.error('HRRR config missing spatial latitude/longitude bounds');
    return false;
  }

  // Validate temporal bounds
  const { temporal } = config;
  if (!temporal.start || !temporal.end) {
    console.warn('HRRR config missing temporal start/end bounds');
  }

  return true;
}

/**
 * Get HRRR dataset information and metadata
 * @param {Object} datasetConfig - HRRR dataset configuration
 * @param {string} infoType - Type of information requested
 * @param {Object} hrrrVariables - HRRR variables configuration
 * @returns {Object} Dataset information
 */
export async function getHRRRDatasetInfo(datasetConfig, infoType, hrrrVariables) {
  switch (infoType) {
    case 'variables':
      return {
        variables: hrrrVariables,
        count: Object.keys(hrrrVariables).length
      };

    case 'spatial':
      return datasetConfig.spatial;

    case 'temporal':
      return datasetConfig.temporal;

    case 'products':
      return {
        products: datasetConfig.products,
        count: Object.keys(datasetConfig.products).length
      };

    case 'forecast':
      return {
        maxForecastHours: 48,
        forecastInterval: 1, // hourly
        availableHours: Array.from({ length: 49 }, (_, i) => i) // 0-48
      };

    case 'metadata':
      return {
        ...datasetConfig,
        variables: hrrrVariables,
        forecastCapabilities: {
          maxHours: 48,
          interval: 1
        }
      };

    default:
      throw new Error(`Unknown HRRR info type: ${infoType}`);
  }
}
