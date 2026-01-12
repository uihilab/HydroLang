/**
 * NLDAS (North American Land Data Assimilation System) data utilities - Refactored
 * Supports NetCDF format processing with daily file organization
 */

import { NetCDFDataSource } from './gridded-data-utils.js';

/**
 * NLDAS-specific data source implementation
 * Extends NetCDFDataSource with NLDAS-specific file organization and URL generation
 */
export class NLDASDataSource extends NetCDFDataSource {
  constructor(datasetConfig, nldasVariables) {
    super({
      sourceName: 'nldas',
      libraryType: 'netcdf',
      datasourceConfig: datasetConfig,
      variables: nldasVariables
    });
    this.datasetConfig = datasetConfig;
  }

  /**
   * Generate NLDAS file URL for a specific date
   */
  generateFileURL(date, variable) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const doy = Math.floor((date - new Date(date.getUTCFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);

    // NLDAS-3 file pattern: s3://nasa-waterinsight/NLDAS3/forcing/hourly/YYYY/DDD/NLDAS_FOR0010_H.A{YYYYMMDD}.{HH}00.003.nc
    // Based on bucket listing: NLDAS_FOR0010_H.A20210101.0300.003.nc (or similar)
    // We will use the format found in nldas.js which seems more accurate than the previous utils stub
    const baseUrl = this.datasetConfig.baseUrl || 'https://nasa-waterinsight.s3.amazonaws.com/NLDAS3/forcing/hourly';

    // Calculate hour string if available (default to 00 if date has no time, but usually date has time)
    const hour = String(date.getUTCHours()).padStart(2, '0');

    // Updated filename format matching user correction: NLDAS_FOR0010_H.A{YYYY}{MM}{DD}.{HH}0.beta.nc
    // User requested format: ...A20150131.030.beta.nc (for hour 3?)
    // We will use 3-digit time suffix: HH + '0'
    const filename = `NLDAS_FOR0010_H.A${year}${month}${day}.${hour}0.beta.nc`;

    // Directory structure matching nldas.js: .../forcing/hourly/YYYYMM/filename
    const fullUrl = `${baseUrl}/${year}${month}/${filename}`;
    console.log(`[NLDAS Debug] Generated URL: ${fullUrl}`);
    return fullUrl;
  }

  /**
   * Extract data for a single day
   */
  async extractDayData(variable, latitude, longitude, date, options = {}) {
    const variableMeta = this.variables[variable];
    if (!variableMeta) {
      throw new Error(`Unknown NLDAS variable: ${variable}`);
    }

    // Generate URL for this date
    const url = this.generateFileURL(date, variable);
    console.log(`[nldas] Fetching daily file: ${url}`);

    try {
      // If raw mode (default), fetch and return buffer directly
      if (options.process !== true) {
        return await this.fetch(url, options);
      }

      // Open NetCDF file
      const ncFile = await this.openNetCDF(url);

      // Get lat/lon arrays from NetCDF
      const lats = ncFile.getDataVariable('lat');
      const lons = ncFile.getDataVariable('lon');
      const times = ncFile.getDataVariable('time');

      // Find nearest indices
      const latIndex = this.findNearestIndex(Array.from(lats), latitude);
      const lonIndex = this.findNearestIndex(Array.from(lons), longitude);

      // Extract time series for all hours in this day
      const dataPoints = [];
      for (let timeIdx = 0; timeIdx < times.length; timeIdx++) {
        const indices = [timeIdx, latIndex, lonIndex];
        const value = this.getNetCDFValue(ncFile, variable, indices, variableMeta);

        // Calculate timestamp
        const hoursSince = times[timeIdx];
        const baseTime = new Date('1970-01-01T00:00:00Z'); // Adjust based on actual time reference
        const timestamp = new Date(baseTime.getTime() + hoursSince * 60 * 60 * 1000);

        dataPoints.push({
          timestamp: timestamp.toISOString(),
          value: value
        });
      }

      return dataPoints;

    } catch (error) {
      console.warn(`[nldas] Failed to extract day data for ${date.toISOString()}: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract point data implementation
   */
  async extractPointData(variable, latitude, longitude, timestamp, options = {}) {
    // Validate coordinates
    this.validateCoordinates(latitude, longitude);

    const variableMeta = this.variables[variable];
    if (!variableMeta) {
      throw new Error(`Unknown NLDAS variable: ${variable}`);
    }

    // NLDAS typically extracts ranges, not single points
    const startDate = options.startDate ? new Date(options.startDate) : timestamp;
    const endDate = options.endDate ? new Date(options.endDate) : timestamp;

    // Validate date range
    this.validateDateRange(startDate, endDate);

    let dataPoints = [];
    let currentDate = new Date(startDate);

    // Iterate through each day
    while (currentDate <= endDate) {
      const dayData = await this.extractDayData(variable, latitude, longitude, currentDate, options);

      // If raw mode, dayData is a buffer (or empty array on error if fetched inside try/catch?)
      if (options.process !== true) {
        if (dayData && dayData.byteLength) {
          dataPoints.push({ timestamp: currentDate.toISOString(), data: dayData });
        }
      } else {
        dataPoints.push(...dayData);
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Filter to requested range
    const filteredData = dataPoints.filter(point => {
      const pointTime = new Date(point.timestamp);
      return pointTime >= startDate && pointTime <= endDate;
    });

    return {
      variable: variable,
      location: { latitude, longitude },
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      data: filteredData,
      metadata: {
        source: 'NLDAS-3',
        units: variableMeta.units,
        temporalResolution: 'hourly',
        spatialResolution: variableMeta.spatialResolution,
        count: filteredData.length,
        validCount: filteredData.filter(d => d.value !== null).length
      }
    };
  }

  /**
   * Extract grid data implementation
   */
  async extractGridData(variable, bbox, timestamp, options = {}) {
    // Validate bbox
    this.validateBbox(bbox);

    const variableMeta = this.variables[variable];
    if (!variableMeta) {
      throw new Error(`Unknown NLDAS variable: ${variable}`);
    }

    // Generate URL and open NetCDF
    const url = this.generateFileURL(timestamp, variable);
    const ncFile = await this.openNetCDF(url);

    // Get coordinate arrays
    const lats = Array.from(ncFile.getDataVariable('lat'));
    const lons = Array.from(ncFile.getDataVariable('lon'));

    // Find indices within bbox
    const [west, south, east, north] = bbox;
    const latStart = this.findNearestIndex(lats, south);
    const latEnd = this.findNearestIndex(lats, north);
    const lonStart = this.findNearestIndex(lons, west);
    const lonEnd = this.findNearestIndex(lons, east);

    // Extract grid slice
    const timeIndex = options.timeIndex || 0;
    const gridData = [];
    const gridLats = [];
    const gridLons = [];

    for (let latIdx = latStart; latIdx <= latEnd; latIdx++) {
      for (let lonIdx = lonStart; lonIdx <= lonEnd; lonIdx++) {
        const indices = [timeIndex, latIdx, lonIdx];
        const value = this.getNetCDFValue(ncFile, variable, indices, variableMeta);

        gridData.push(value);
        gridLats.push(lats[latIdx]);
        gridLons.push(lons[lonIdx]);
      }
    }

    return {
      data: gridData,
      latitudes: gridLats,
      longitudes: gridLons,
      bbox: bbox,
      count: gridData.length,
      variable: variable,
      timestamp: timestamp.toISOString(),
      metadata: {
        source: 'NLDAS-3',
        units: variableMeta.units,
        description: variableMeta.description
      }
    };
  }
  /**
   * Extract raw NetCDF data
   */
  async extractRawNetCDF(args) {
    // Generate URL based on date params or direct args
    let url;
    if (args.date) {
      url = this.generateFileURL(new Date(args.date), args.variable);
    } else if (args.year && args.month && args.day) {
      // Construct date from components
      const date = new Date(Date.UTC(args.year, parseInt(args.month) - 1, parseInt(args.day), args.hour || 0));
      url = this.generateFileURL(date, args.variable || 'Tair'); // Default variable if none, though URL generator might need one
    } else {
      throw new Error('Missing date parameters for raw NetCDF extraction');
    }

    // Use conditional fetching - cached only if explicitly requested
    let response;
    if (args.cache === true) {
      const { cachedFetch } = await import('./data-cache.js');
      globalThis._hydroCacheContext = {
        source: 'nldas',
        dataset: this.datasetConfig.name || 'nldas-3-hourly',
        dataType: 'raw-netcdf',
        params: args,
        process: false // Explicitly set process false for cache context
      };
      response = await cachedFetch(url, {
        params: {
          source: 'nldas',
          datatype: 'raw-netcdf',
          proxy: args.proxy,
          raw: true
        }
      });
    } else {
      // Use standard fetch
      response = await fetch(url, {
        headers: {
          'Accept': 'application/octet-stream'
        }
      });
    }

    return response.arrayBuffer();
  }
}

// ============================================================================
// BACKWARD COMPATIBLE EXPORTED FUNCTIONS
// ============================================================================

/**
 * Extract point data from NLDAS NetCDF file
 * @param {string} variable - Variable name (e.g., 'Tair', 'Rainf')
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} startDate - Start date for data extraction
 * @param {Date} endDate - End date for data extraction
 * @param {Object} datasetConfig - NLDAS dataset configuration
 * @param {Object} nldasVariables - NLDAS variables configuration
 * @returns {Promise<Object>} Extracted point data
 * @private
 */
export async function extractNLDASPointData(variable, latitude, longitude, startDate, endDate, datasetConfig, nldasVariables) {
  const nldas = new NLDASDataSource(datasetConfig, nldasVariables);
  return await nldas.extractPointData(variable, latitude, longitude, startDate, {
    startDate,
    endDate
  });
}

/**
 * Extract grid data from NLDAS NetCDF file
 * @param {string} variable - Variable name
 * @param {Array<number>} bbox - Bounding box [west, south, east, north]
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - NLDAS dataset configuration
 * @param {Object} nldasVariables - NLDAS variables configuration
 * @returns {Promise<Object>} Extracted grid data
 * @private
 */
export async function extractNLDASGridData(variable, bbox, timestamp, datasetConfig, nldasVariables) {
  const nldas = new NLDASDataSource(datasetConfig, nldasVariables);
  return await nldas.extractGridData(variable, bbox, timestamp);
}

/**
 * Extract data for multiple points from NLDAS
 * Uses inherited extractMultiplePoints from base class - NO DUPLICATE CODE!
 * @param {string} variable - Variable name
 * @param {Array<Object>} locations - Array of {latitude, longitude, id} objects
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @param {Object} datasetConfig - NLDAS dataset configuration
 * @param {Object} nldasVariables - NLDAS variables configuration
 * @returns {Promise<Object>} Multiple points data
 * @private
 */
export async function extractNLDASMultiplePoints(variable, locations, startTime, endTime, datasetConfig, nldasVariables) {
  const nldas = new NLDASDataSource(datasetConfig, nldasVariables);
  return await nldas.extractMultiplePoints(variable, locations, startTime, {
    startDate: startTime,
    endDate: endTime
  });
}

/**
 * Extract raw NetCDF data from NLDAS
 * @param {Object} args - Request arguments
 * @param {Object} datasetConfig - NLDAS dataset configuration
 * @returns {Promise<Object>} Raw NetCDF data
 * @private
 */
export async function extractNLDASRawNetCDF(args, datasetConfig) {
  const nldas = new NLDASDataSource(datasetConfig, {});

  const url = nldas.generateFileURL(new Date(args.date), args.variable);
  const ncFile = await nldas.openNetCDF(url);

  return {
    url: url,
    variables: ncFile.variables?.map(v => v.name) || [],
    dimensions: ncFile.dimensions || {},
    globalAttributes: ncFile.globalAttributes || {}
  };
}

/**
 * Get available NLDAS variables
 * @returns {Array<string>} Available variable names
 * @private
 */
export function getAvailableNLDASVariables() {
  // Common NLDAS-3 variables
  return [
    'Tair',    // Air temperature
    'Qair',    // Specific humidity
    'PSurf',   // Surface pressure
    'Wind',    // Wind speed
    'LWdown',  // Longwave radiation
    'SWdown',  // Shortwave radiation
    'Rainf',   // Rainfall rate
    'Snowf',   // Snowfall rate
  ];
}

/**
 * Validate NLDAS configuration
 * @param {Object} config - Configuration to validate
 * @returns {boolean} True if valid
 * @private
 */
export function validateNLDASConfig(config) {
  const required = ['baseUrl', 'spatial', 'temporal'];

  for (const field of required) {
    if (!config[field]) {
      console.error(`NLDAS config missing required field: ${field}`);
      return false;
    }
  }

  // Validate spatial bounds
  const { spatial } = config;
  if (!spatial.latitude || !spatial.longitude) {
    console.error('NLDAS config missing spatial latitude/longitude bounds');
    return false;
  }

  // Validate temporal bounds
  const { temporal } = config;
  if (!temporal.start || !temporal.end) {
    console.warn('NLDAS config missing temporal start/end bounds');
  }

  return true;
}

/**
 * Get NLDAS dataset information and metadata
 * @param {Object} datasetConfig - NLDAS dataset configuration
 * @param {string} infoType - Type of information requested
 * @param {Object} nldasVariables - NLDAS variables configuration
 * @returns {Object} Dataset information
 * @private
 */
export async function getNLDASDatasetInfo(datasetConfig, infoType, nldasVariables) {
  switch (infoType) {
    case 'variables':
      return {
        variables: nldasVariables,
        count: Object.keys(nldasVariables).length
      };

    case 'spatial':
      return datasetConfig.spatial;

    case 'temporal':
      return datasetConfig.temporal;

    case 'metadata':
      return {
        ...datasetConfig,
        variables: nldasVariables,
        temporalResolution: 'hourly',
        spatialResolution: '0.125 degrees'
      };

    default:
      throw new Error(`Unknown NLDAS info type: ${infoType}`);
  }
}
