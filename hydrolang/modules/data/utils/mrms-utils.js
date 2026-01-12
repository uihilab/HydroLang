/**
 * MRMS (Multi-Radar Multi-Sensor) data utilities - Refactored
 * Uses GRIB2DataSource base class to eliminate ~750 lines of duplicate code
 */

import { GRIB2DataSource, loadGridDataLibrary } from './gridded-data-utils.js';

/**
 * MRMS-specific data source implementation
 * Extends GRIB2DataSource with MRMS-specific URL generation and product handling
 * @ignore
 */
export class MRMSDataSource extends GRIB2DataSource {
  constructor(datasetConfig) {
    super({
      sourceName: 'mrms',
      libraryType: 'grib2',
      datasourceConfig: datasetConfig,
      variables: null // Will be loaded from datasources/mrms.js
    });
    this.datasetConfig = datasetConfig;
    this.mrmsDatasource = null;
  }

  /**
   * Lazy load MRMS datasource configuration
   */
  async loadDatasource() {
    if (!this.mrmsDatasource) {
      const { default: mrmsDatasource } = await import('../datasources/mrms.js');
      this.mrmsDatasource = mrmsDatasource;
      this.variables = mrmsDatasource.variables;
    }
    return this.mrmsDatasource;
  }

  /**
   * Find appropriate MRMS product for a given variable
   */
  async findProductForVariable(variable) {
    await this.loadDatasource();

    const variableMeta = this.variables[variable];
    if (!variableMeta) {
      throw new Error(`Unknown MRMS variable: ${variable}`);
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

    throw new Error(`No MRMS product found for variable: ${variable}`);
  }

  /**
   * Infer variable name from product name
   */
  inferVariableFromProduct(product) {
    if (!product) return null;

    // Common mappings
    if (product.includes('Reflectivity')) return 'REF';
    if (product.includes('PrecipRate')) return 'PrecipRate'; // Or PRATE
    if (product.includes('QPE') || product.includes('QPF') || product.includes('PCPN')) return 'APCP';
    if (product.includes('VIL')) return 'VIL';
    if (product.includes('EchoTop')) return 'ETOP';
    if (product.includes('RQI')) return 'RQI';
    if (product.includes('PrecipFlag')) return 'PFLAG';

    // Default: try using product name as variable
    return product;
  }

  /**
   * Generate MRMS file URL
   */
  async generateURL(product, timestamp) {
    await this.loadDatasource();
    return this.mrmsDatasource.generateURL(product, timestamp, this.datasetConfig.name || 'mrms-radar');
  }

  /**
   * Enhanced fetch with MRMS-specific error messages
   */
  async fetch(url, options = {}) {
    try {
      return await super.fetch(url, options);
    } catch (error) {
      // Enhance 404 errors with MRMS-specific guidance
      if (error.message.includes('404')) {
        const timestamp = options.params?.timestamp;
        const currentDate = new Date();
        const currentYear = currentDate.getUTCFullYear();
        const requestedYear = timestamp?.getUTCFullYear?.();

        let enhancedMessage = error.message;

        if (requestedYear && requestedYear !== currentYear) {
          enhancedMessage += ` MRMS provides real-time operational data. Historical data (${requestedYear}) may not be available via HTTP.`;
        }

        enhancedMessage += ` Try using current/recent dates. MRMS typically keeps ~24-48 hours of recent data.`;
        enhancedMessage += ` Available recent data: https://mrms.ncep.noaa.gov/3DRefl/MergedReflectivityQC_00.50/`;

        throw new Error(enhancedMessage);
      }
      throw error;
    }
  }

  /**
 * Process MRMS file (handles both GRIB2 and GeoTIFF formats)
 */
  async processFile(url, variable, timestamp, options = {}) {
    // Fetch file
    const fileBuffer = await this.fetch(url, { params: { timestamp, ...options.params }, ...options });

    // Check if file needs decompression (passes options for raw mode check)
    const decompressed = await this.decompress(fileBuffer, null, options);

    // If raw mode (default), return decompressed (which is just the buffer)
    if (options.process !== true) {
      return decompressed;
    }

    // Debug file signature
    const uint8Array = new Uint8Array(decompressed.buffer || decompressed, 0, Math.min(32, decompressed.byteLength || decompressed.length));
    const fileSignature = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join(' ');

    if (fileSignature.startsWith('47 52 49 42')) {
      console.log(`[mrms] Valid GRIB2 file detected`);
    } else {
      console.warn(`[mrms] Unknown file signature: ${fileSignature.substring(0, 24)}`);
    }

    // Parse based on format
    return await this.parseGRIB2(decompressed);
  }

  /**
   * Extract point data implementation
   */
  async extractPointData(variable, latitude, longitude, timestamp, options = {}) {
    await this.loadDatasource();

    // Validate coordinates
    this.validateCoordinates(latitude, longitude);

    // Infer variable from product if not provided
    if (!variable && options.product) {
      variable = this.inferVariableFromProduct(options.product);
      console.log(`[mrms] Inferred variable ${variable} from product ${options.product}`);
    }

    if (!variable) {
      throw new Error('Variable is required for MRMS point data extraction');
    }

    // Get variable metadata (resolve aliases if needed)
    let variableMeta = this.variables[variable];
    if (!variableMeta) {
      // Try to find by gribName or other properties
      const foundKey = Object.keys(this.variables).find(key =>
        this.variables[key].gribName === variable ||
        this.variables[key].products?.includes(variable)
      );
      if (foundKey) {
        variable = foundKey;
        variableMeta = this.variables[variable];
        console.log(`[mrms] Resolved variable alias: ${options.variable} -> ${variable}`);
      }
    }

    if (!variableMeta) {
      throw new Error(`Unknown MRMS variable: ${variable}`);
    }

    // Find or use provided product
    const product = options.product || await this.findProductForVariable(variable);

    if (!this.datasetConfig.products[product]) {
      throw new Error(`Product ${product} not found in dataset ${this.datasetConfig.name || 'mrms-radar'}`);
    }

    // Generate URL and fetch file
    const url = await this.generateURL(product, timestamp);
    console.log(`[mrms] Fetching ${product} for ${variable} at ${timestamp.toISOString()}`);

    // Process file
    const messages = await this.processFile(url, variable, timestamp, { ...options, product });

    // Find message for this variable
    const message = this.findGRIB2Message(messages, variable);

    // Extract value at point
    const rawValue = this.getGRIB2ValueAtPoint(message, latitude, longitude);
    const scaledValue = this.applyScaling(rawValue, variableMeta);

    return {
      value: scaledValue,
      rawValue: rawValue,
      units: variableMeta.units || 'unknown',
      variable: variable,
      product: product,
      timestamp: timestamp.toISOString(),
      location: {
        latitude: latitude,
        longitude: longitude
      },
      metadata: {
        source: 'MRMS',
        product: product,
        levelType: variableMeta.levelType,
        description: variableMeta.description
      }
    };
  }

  /**
   * Extract grid data implementation
   */
  async extractGridData(variable, bbox, timestamp, options = {}) {
    await this.loadDatasource();

    // Validate bbox
    this.validateBbox(bbox);

    // Get variable metadata
    const variableMeta = this.variables[variable];
    if (!variableMeta) {
      throw new Error(`Unknown MRMS variable: ${variable}`);
    }

    // Find or use provided product
    const product = options.product || await this.findProductForVariable(variable);

    // Generate URL and fetch file
    const url = await this.generateURL(product, timestamp);
    console.log(`[mrms] Fetching grid ${product} for ${variable}`);

    // Process file
    // Process file
    // Process file
    const messages = await this.processFile(url, variable, timestamp, { ...options, product });

    // Find message for this variable
    const message = this.findGRIB2Message(messages, variable);

    // Extract grid
    const gridResult = this.getGRIB2Grid(message, bbox);

    // Raw mode: return raw grid data (unscaled)
    if (options.process !== true) {
      return gridResult.data;
    }

    // Apply scaling to all grid values
    const scaledData = gridResult.data.map(val => this.applyScaling(val, variableMeta));

    return {
      data: scaledData,
      latitudes: gridResult.latitudes,
      longitudes: gridResult.longitudes,
      bbox: bbox,
      count: gridResult.count,
      variable: variable,
      product: product,
      timestamp: timestamp.toISOString(),
      metadata: {
        source: 'MRMS',
        product: product,
        units: variableMeta.units,
        description: variableMeta.description
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
        await this.loadDatasource();
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

      case 'metadata':
        await this.loadDatasource();
        return {
          ...this.datasetConfig,
          variables: this.variables
        };

      default:
        throw new Error(`Unknown MRMS info type: ${infoType}`);
    }
  }
}

// ============================================================================
// BACKWARD COMPATIBLE EXPORTED FUNCTIONS
// These maintain the same API as before but use the new class internally
// ============================================================================

/**
 * Extract point data from MRMS GRIB2 file
 * @ignore
 */
export async function extractMRMSPointData(variable, latitude, longitude, timestamp, datasetConfig, product = null) {
  const mrms = new MRMSDataSource(datasetConfig);
  return await mrms.extractPointData(variable, latitude, longitude, timestamp, { product });
}

/**
 * Extract grid data from MRMS GRIB2 file
 * @param {string} variable - Variable name
* @param {Array<number>} bbox - Bounding box [west, south, east, north]
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - MRMS dataset configuration
* @param {string} product - Specific MRMS product to use (optional)
 * @returns {Promise<Object>} Extracted grid data
 * @ignore
 */
export async function extractMRMSGridData(variable, bbox, timestamp, datasetConfig, product = null) {
  const mrms = new MRMSDataSource(datasetConfig);
  return await mrms.extractGridData(variable, bbox, timestamp, { product });
}

/**
 * Extract time series data from MRMS
 * Uses inherited extractTimeSeries from base class - NO CODE NEEDED!
     * @param {string} variable - Variable name
     * @param {number} latitude - Latitude coordinate
     * @param {number} longitude - Longitude coordinate
 * @param {Date} startTime - Start of time range
 * @param {Date} endTime - End of time range
     * @param {Object} datasetConfig - MRMS dataset configuration
 * @param {string} product - Specific MRMS product to use (optional)
     * @returns {Promise<Object>} Time series data
 * @ignore
     */
export async function extractMRMSTimeSeries(variable, latitude, longitude, startTime, endTime, datasetConfig, product = null) {
  const mrms = new MRMSDataSource(datasetConfig);

  // MRMS temporal resolution varies by product, default to hourly
  const timeIncrement = 60 * 60 * 1000; // 1 hour in milliseconds

  return await mrms.extractTimeSeries(
    variable,
    latitude,
    longitude,
    startTime,
    endTime,
    {
      product,
      timeIncrement,
      temporalResolution: 'hourly'
    }
  );
}

/**
 * Get available MRMS products for a given date
 * @ignore
 */
export async function getAvailableMRMSProducts(datasetConfig, date) {
  const mrms = new MRMSDataSource(datasetConfig);
  await mrms.loadDatasource();

  // Return all configured products
  // In a real implementation, this could check availability on the server
  return Object.keys(datasetConfig.products || {}).map(productName => ({
    name: productName,
    config: datasetConfig.products[productName],
    available: true // Simplified - actual availability would require server check
  }));
}

/**
 * Validate MRMS configuration
 * @param {Object} config - Configuration to validate
     * @returns {boolean} True if valid
 * @ignore
     */
export function validateMRMSConfig(config) {
  const required = ['baseUrl', 'spatial', 'temporal', 'products'];

  for (const field of required) {
    if (!config[field]) {
      console.error(`MRMS config missing required field: ${field}`);
      return false;
    }
  }

  // Validate spatial bounds
  const { spatial } = config;
  if (!spatial.latitude || !spatial.longitude) {
    console.error('MRMS config missing spatial latitude/longitude bounds');
    return false;
  }

  return true;
}

/**
 * Get MRMS dataset information and metadata
 * @ignore
 */
export async function getMRMSDatasetInfo(datasetConfig, infoType) {
  const mrms = new MRMSDataSource(datasetConfig);
  await mrms.loadDatasource();

  switch (infoType) {
    case 'variables':
      return {
        variables: mrms.variables,
        count: Object.keys(mrms.variables).length
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

    case 'metadata':
      return {
        ...datasetConfig,
        variables: mrms.variables
      };

    default:
      throw new Error(`Unknown MRMS info type: ${infoType}`);
  }
}

/**
 * Test URL generation for MRMS products
 * @param {string} product - MRMS product name
 * @param {Date} timestamp - Test timestamp
 * @returns {string} Generated URL for verification
 * @ignore
 */
export async function testMRMSUrlGeneration(product, timestamp) {
  const { default: mrmsDatasource } = await import('../datasources/mrms.js');
  return mrmsDatasource.generateURL(product, timestamp, 'mrms-radar');
}
