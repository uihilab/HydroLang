/**
 * PRISM (Parameter-elevation Relationships on Independent Slopes Model) data utilities - Refactored
 * Uses GeoTIFFDataSource base class to eliminate ~500 lines of duplicate code
 * Supports GeoTIFF and BIL format processing from ZIP archives
 */

import { GeoTIFFDataSource } from './gridded-data-utils.js';
import { generatePRISMFileURL, formatPRISMTimePeriod, determinePRISMRegion, validatePRISMVariable, getRecommendedPRISMResolution } from '../datasources/prism.js';

/**
 * PRISM-specific data source implementation
 * Extends GeoTIFFDataSource with PRISM-specific ZIP handling and URL generation
 */
export class PRISMDataSource extends GeoTIFFDataSource {
  constructor(datasetConfig, prismVariables) {
    super({
      sourceName: 'prism',
      libraryType: 'geospatial',
      datasourceConfig: datasetConfig,
      variables: prismVariables
    });
    this.datasetConfig = datasetConfig;
    this.prismVariables = prismVariables;
  }

  /**
   * Generate PRISM file URL
   */
  generateFileURL(variable, timestamp, dataType, region, resolution) {
    return generatePRISMFileURL(variable, timestamp, dataType, region, resolution);
  }

  /**
   * Determine PRISM parameters
   */
  determinePRISMParams(variable, latitude, longitude, dataType) {
    const variableMeta = this.variables[variable];
    if (!variableMeta) {
      throw new Error(`Unknown PRISM variable: ${variable}`);
    }

    // Validate variable
    validatePRISMVariable(variable, dataType);

    // Determine region
    const region = determinePRISMRegion(latitude, longitude);

    // Get recommended resolution
    const resolution = getRecommendedPRISMResolution(region);

    return { variableMeta, region, resolution };
  }

  /**
   * Fetch and extract PRISM file (handles ZIP extraction)
   */
  async fetchAndExtractPRISM(url, fileFormat = 'tif') {
    console.log(`[prism] Fetching and extracting: ${url}`);

    // Fetch ZIP file
    const zipBuffer = await this.fetch(url);

    // Extract ZIP using inherited method
    const filePattern = fileFormat === 'tif' ? /\.tif$/i : /\.bil$/i;
    const extracted = await this.extractFromZip(zipBuffer, filePattern);

    // Extract additional metadata files if needed
    const JSZip = this.library.JSZip;
    const zip = await JSZip.loadAsync(zipBuffer);
    const files = Object.keys(zip.files);

    const metadata = {};

    // Extract projection file
    const prjFile = files.find(name => name.toLowerCase().endsWith('.prj'));
    if (prjFile) {
      metadata.projection = await zip.files[prjFile].async('string');
    }

    // Extract header file (for BIL format)
    if (fileFormat === 'bil') {
      const hdrFile = files.find(name => name.toLowerCase().endsWith('.hdr'));
      if (hdrFile) {
        metadata.header = await zip.files[hdrFile].async('string');
      }
    }

    return {
      dataBuffer: extracted.data,
      metadata,
      filename: extracted.fileName,
      format: fileFormat
    };
  }

  /**
   * Extract point data from PRISM (overrides base class)
   */
  async extractPointData(variable, latitude, longitude, timestamp, options = {}) {
    // Validate coordinates
    this.validateCoordinates(latitude, longitude);

    // Determine PRISM parameters
    const dataType = options.dataType || 'daily';
    const { variableMeta, region, resolution } = this.determinePRISMParams(
      variable,
      latitude,
      longitude,
      dataType
    );

    // Use provided or determined region/resolution
    const finalRegion = options.region || region;
    const finalResolution = options.resolution || resolution;

    // Generate URL
    const url = this.generateFileURL(variable, timestamp, dataType, finalRegion, finalResolution);

    // Fetch and extract
    const fileFormat = variableMeta.format || 'tif';
    const extracted = await this.fetchAndExtractPRISM(url, fileFormat);

    // If raw mode (default), return data buffer
    if (options.process !== true) {
      return extracted.dataBuffer;
    }

    // Parse GeoTIFF
    const { tiff, image } = await this.parseGeoTIFF(extracted.dataBuffer);

    // Extract value at point
    const value = await this.getGeoTIFFValueAtPoint(image, latitude, longitude, variableMeta);

    if (options.raw || (options.params && options.params.raw)) {
      return {
        value,
        variable,
        timestamp: timestamp.toISOString()
      };
    }

    return {
      value: value,
      units: variableMeta.units,
      variable: variable,
      timestamp: timestamp.toISOString(),
      location: {
        latitude: latitude,
        longitude: longitude
      },
      metadata: {
        source: 'PRISM',
        dataType: dataType,
        region: finalRegion,
        resolution: finalResolution,
        projection: extracted.metadata.projection
      }
    };
  }

  /**
   * Extract grid data from PRISM (overrides base class)
   */
  async extractGridData(variable, bbox, timestamp, options = {}) {
    // Validate bbox
    this.validateBbox(bbox);

    const variableMeta = this.variables[variable];
    if (!variableMeta) {
      throw new Error(`Unknown PRISM variable: ${variable}`);
    }

    // Determine PRISM parameters (use bbox center for region determination)
    const centerLat = (bbox[1] + bbox[3]) / 2;
    const centerLon = (bbox[0] + bbox[2]) / 2;
    const dataType = options.dataType || 'daily';

    const region = options.region || determinePRISMRegion(centerLat, centerLon);
    const resolution = options.resolution || getRecommendedPRISMResolution(region);

    // Generate URL
    const url = this.generateFileURL(variable, timestamp, dataType, region, resolution);

    // Fetch and extract
    const fileFormat = variableMeta.format || 'tif';
    const extracted = await this.fetchAndExtractPRISM(url, fileFormat);

    // If raw mode (default), return data buffer
    if (options.process !== true) {
      return extracted.dataBuffer;
    }

    // Parse GeoTIFF
    const { tiff, image } = await this.parseGeoTIFF(extracted.dataBuffer);

    // Extract grid
    const gridData = await this.getGeoTIFFGrid(image, bbox, variableMeta);

    // Apply spatial aggregation if requested
    let aggregatedValue = null;
    if (options.aggregation) {
      aggregatedValue = this.aggregateSpatially(gridData.data, options.aggregation);
    }

    return {
      data: gridData.data,
      width: gridData.width,
      height: gridData.height,
      bbox: bbox,
      variable: variable,
      timestamp: timestamp.toISOString(),
      ...(aggregatedValue !== null && { aggregatedValue }),
      metadata: {
        source: 'PRISM',
        units: variableMeta.units,
        dataType: dataType,
        region: region,
        resolution: resolution,
        ...(options.aggregation && { aggregationType: options.aggregation })
      }
    };
  }
}

// ============================================================================
// BACKWARD COMPATIBLE EXPORTED FUNCTIONS
// ============================================================================

/**
 * Extract point data from PRISM
 * @param {string} variable - Variable name (e.g., 'ppt', 'tmin', 'tmax')
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - PRISM dataset configuration
 * @param {Object} prismVariables - PRISM variables configuration
 * @param {string} dataType - Data type ('daily', 'monthly', 'annual')
 * @param {string} region - PRISM region (optional, auto-determined if not provided)
 * @param {string} resolution - Resolution (optional, auto-determined if not provided)
 * @returns {Promise<Object>} Extracted point data
 * @private
 */
export async function extractPRISMPointData(variable, latitude, longitude, timestamp, datasetConfig, prismVariables, dataType = 'daily', region = null, resolution = null) {
  const prism = new PRISMDataSource(datasetConfig, prismVariables);
  return await prism.extractPointData(variable, latitude, longitude, timestamp, {
    dataType,
    region,
    resolution
  });
}

/**
 * Extract grid data from PRISM
 * @param {string} variable - Variable name
 * @param {Array<number>} bbox - Bounding box [west, south, east, north]
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - PRISM dataset configuration
 * @param {Object} prismVariables - PRISM variables configuration
 * @param {string} dataType - Data type ('daily', 'monthly', 'annual')
 * @param {string} region - PRISM region (optional)
 * @param {string} resolution - Resolution (optional)
 * @returns {Promise<Object>} Extracted grid data
 * @private
 */
export async function extractPRISMGridData(variable, bbox, timestamp, datasetConfig, prismVariables, dataType = 'daily', region = null, resolution = null) {
  const prism = new PRISMDataSource(datasetConfig, prismVariables);
  return await prism.extractGridData(variable, bbox, timestamp, {
    dataType,
    region,
    resolution
  });
}

/**
 * Extract time series data from PRISM
 * Uses inherited extractTimeSeries from base class - NO CODE NEEDED!
 * @param {string} variable - Variable name
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @param {Object} datasetConfig - PRISM dataset configuration
 * @param {Object} prismVariables - PRISM variables configuration
 * @param {string} dataType - Data type ('daily', 'monthly', 'annual')
 * @param {string} region - PRISM region (optional)
 * @param {string} resolution - Resolution (optional)
 * @returns {Promise<Object>} Time series data
 * @private
 */
export async function extractPRISMTimeSeries(variable, latitude, longitude, startTime, endTime, datasetConfig, prismVariables, dataType = 'daily', region = null, resolution = null) {
  const prism = new PRISMDataSource(datasetConfig, prismVariables);

  // Determine time increment based on data type
  let timeIncrement;
  if (dataType === 'daily') {
    timeIncrement = 24 * 60 * 60 * 1000; // 1 day
  } else if (dataType === 'monthly') {
    timeIncrement = (date) => {
      const next = new Date(date);
      next.setMonth(next.getMonth() + 1);
      return next;
    };
  } else if (dataType === 'annual') {
    timeIncrement = (date) => {
      const next = new Date(date);
      next.setFullYear(next.getFullYear() + 1);
      return next;
    };
  } else {
    timeIncrement = 24 * 60 * 60 * 1000; // Default to daily
  }

  return await prism.extractTimeSeries(
    variable,
    latitude,
    longitude,
    startTime,
    endTime,
    {
      dataType,
      region,
      resolution,
      timeIncrement,
      temporalResolution: dataType
    }
  );
}

/**
 * Get available PRISM variables
 * @param {string} dataType - Data type ('daily', 'monthly', 'annual')
 * @returns {Array<string>} Available variable names
 * @private
 */
export function getAvailablePRISMVariables(dataType = 'daily') {
  // Common PRISM variables
  const variables = ['ppt', 'tmin', 'tmax', 'tmean', 'tdmean', 'vpdmin', 'vpdmax'];

  // Some variables only available for certain data types
  if (dataType === 'daily') {
    return [...variables];
  } else {
    // Monthly and annual typically have same variables
    return variables.filter(v => !['tdmean', 'vpdmin', 'vpdmax'].includes(v));
  }
}

/**
 * Validate PRISM configuration
 * @param {Object} config - Configuration to validate
 * @returns {boolean} True if valid
 * @private
 */
export function validatePRISMConfig(config) {
  const required = ['baseUrl', 'spatial', 'temporal'];

  for (const field of required) {
    if (!config[field]) {
      console.error(`PRISM config missing required field: ${field}`);
      return false;
    }
  }

  return true;
}

/**
 * Get PRISM dataset information and metadata
 * @param {Object} datasetConfig - PRISM dataset configuration
 * @param {string} infoType - Type of information requested
 * @param {Object} prismVariables - PRISM variables configuration
 * @returns {Object} Dataset information
 * @private
 */
export async function getPRISMDatasetInfo(datasetConfig, infoType, prismVariables) {
  switch (infoType) {
    case 'variables':
      return {
        variables: prismVariables,
        count: Object.keys(prismVariables).length
      };

    case 'spatial':
      return datasetConfig.spatial;

    case 'temporal':
      return datasetConfig.temporal;

    case 'dataTypes':
      return {
        dataTypes: ['daily', 'monthly', 'annual'],
        description: 'PRISM provides data at daily, monthly, and annual temporal resolutions'
      };

    case 'metadata':
      return {
        ...datasetConfig,
        variables: prismVariables,
        dataTypes: ['daily', 'monthly', 'annual'],
        resolutions: ['800m', '4km'],
        regions: ['conus', 'ak', 'hi', 'pr']
      };

    default:
      throw new Error(`Unknown PRISM info type: ${infoType}`);
  }
}
