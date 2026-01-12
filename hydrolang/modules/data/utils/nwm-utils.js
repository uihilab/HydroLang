/**
 * NWM (National Water Model) data utilities - Refactored
 * Uses ZarrDataSource and NetCDFDataSource base classes
 * Handles streamflow data by COMID (feature ID) rather than lat/lon
 * Supports both Zarr (v2.1) and NetCDF (v2.0, v1.2) formats
 */

import { ZarrDataSource, NetCDFDataSource, loadGridDataLibrary } from './gridded-data-utils.js';

/**
 * NWM-specific data source implementation (hybrid Zarr/NetCDF)
 * Note: NWM works with COMIDs (stream segments), not lat/lon coordinates
 * @ignore
 */
export class NWMDataSource extends ZarrDataSource {
  constructor(datasetConfig) {
    super({
      sourceName: 'nwm',
      libraryType: datasetConfig.format === 'zarr' ? 'zarr' : 'netcdf',
      datasourceConfig: datasetConfig,
      variables: null // Will be defined per-product
    });
    this.datasetConfig = datasetConfig;
    this.format = datasetConfig.format || 'zarr';
  }

  /**
   * Construct NWM file URL
   */
  buildFileURL(year, date, product, version) {
    return constructNWMFileURL(this.datasetConfig.baseUrl, year, date, product, version);
  }

  /**
   * Find COMID index in feature array
   */
  async findCOMIDIndex(featureArray, comid) {
    if (Array.isArray(featureArray)) {
      const index = featureArray.indexOf(comid);
      if (index === -1) {
        throw new Error(`COMID ${comid} not found in dataset`);
      }
      return index;
    }

    // For typed arrays
    for (let i = 0; i < featureArray.length; i++) {
      if (featureArray[i] === comid) {
        return i;
      }
    }

    throw new Error(`COMID ${comid} not found in dataset`);
  }

  /**
   * Extract NWM data from Zarr format
   */
  async extractZarrData(variable, comid, startDate, endDate) {
    const productConfig = this.datasetConfig.products[variable.product || 'chrtout'];
    const zarrUrl = `${this.datasetConfig.baseUrl}/${productConfig.zarrPath || 'chrtout.zarr'}`;

    console.log(`[nwm] Extracting Zarr data for COMID ${comid} from ${zarrUrl}`);

    // Load Zarr library
    await this.loadLibrary();

    // Fetch metadata
    const metadata = await this.fetchJSON(`${zarrUrl}/${variable}/.zarray`);
    const featureMetadata = await this.fetchJSON(`${zarrUrl}/feature_id/.zarray`);

    // Fetch and decompress feature IDs
    const featureData = await this.fetch(`${zarrUrl}/feature_id/0`);
    const decompressed = await this.decompress(featureData);

    // Convert to appropriate array type
    const featureArray = this.convertToTypedArray(decompressed, featureMetadata.dtype);

    // Find COMID index
    const comidIndex = await this.findCOMIDIndex(featureArray, comid);
    console.log(`[nwm] Found COMID ${comid} at index ${comidIndex}`);

    // Extract time series data for this COMID
    // (Implementation would depend on Zarr chunk structure)

    return {
      comid,
      variable,
      format: 'zarr',
      data: [], // Would be populated with actual data
      metadata: {
        source: 'NWM',
        version: this.datasetConfig.temporal.version
      }
    };
  }

  /**
   * Extract NWM data from NetCDF format
   */
  async extractNetCDFData(variable, comid, startDate, endDate, options = {}) {
    const results = [];
    const product = variable.product || 'chrtout';
    const productConfig = this.datasetConfig.products[product];

    if (!productConfig) {
      throw new Error(`Product ${product} not available for dataset version ${this.datasetConfig.temporal.version}`);
    }

    // Generate date range and file URLs
    const dates = generateNWMDateRange(startDate, endDate, productConfig.frequency);
    const fileUrls = dates.map(date =>
      this.buildFileURL(date.getFullYear(), date, product, this.datasetConfig.temporal.version)
    );

    console.log(`[nwm] Processing ${fileUrls.length} NetCDF files for COMID ${comid}`);

    // Load NetCDF library
    const netcdfLib = await loadGridDataLibrary('netcdf');
    if (!netcdfLib || !netcdfLib.netcdfjs) {
      throw new Error('NetCDF library not available');
    }

    for (const fileUrl of fileUrls) {
      try {
        const buffer = await this.fetch(fileUrl);

        if (options.process !== true) {
          results.push({
            fileUrl,
            comid,
            data: buffer,
            timestamps: [fileUrl],
            metadata: { raw: true }
          });
          continue;
        }

        const data = netcdfLib.netcdfjs.parse(buffer);

        // Extract variable data
        const variableData = data.variables[variable];
        if (!variableData) {
          console.warn(`[nwm] Variable ${variable} not found in ${fileUrl}`);
          continue;
        }

        // Find COMID index
        const featureIdVar = data.variables.feature_id;
        if (!featureIdVar) {
          console.warn(`[nwm] Feature ID not found in ${fileUrl}`);
          continue;
        }

        const comidIndex = await this.findCOMIDIndex(featureIdVar.data, comid);

        // If raw requested, we might want raw values from NetCDF without scaling
        // Or if raw means raw file, we should have returned earlier?
        // Since this iterates files, "raw file" doesn't make sense unless we return list of buffers.
        // Let's assume raw means unscaled values here.

        // Extract time series for this COMID
        const timeVar = data.variables.time;
        const timeSteps = variableData.shape[0];
        const extractedValues = [];
        const timestamps = [];

        const referenceTime = new Date(this.datasetConfig.temporal.timeUnits.replace('hours since ', ''));

        for (let t = 0; t < timeSteps; t++) {
          const flatIndex = t * featureIdVar.data.length + comidIndex;
          const rawValue = variableData.data[flatIndex];

          // Check for fill values
          const isFillValue = rawValue === variableData.attributes?._FillValue ||
            rawValue === variableData.attributes?.missing_value;

          // Apply scaling
          const variableMeta = {
            scaleFactor: variableData.attributes?.scale_factor,
            addOffset: variableData.attributes?.add_offset,
            fillValue: variableData.attributes?._FillValue
          };

          const scaledValue = isFillValue ? null : this.applyScaling(rawValue, variableMeta);
          extractedValues.push(scaledValue);

          // Calculate timestamp
          const timestamp = new Date(referenceTime.getTime() + timeVar.data[t] * 60 * 60 * 1000);
          timestamps.push(timestamp.toISOString());
        }

        results.push({
          fileUrl,
          comid,
          data: extractedValues,
          timestamps,
          metadata: {
            variable,
            product,
            timeSteps,
            units: variableData.attributes?.units || 'unknown'
          }
        });

      } catch (error) {
        console.error(`[nwm] Error processing ${fileUrl}:`, error.message);
        // Continue with next file
      }
    }

    return results;
  }

  /**
   * Convert buffer to typed array based on dtype
   */
  convertToTypedArray(buffer, dtype) {
    const arrayBuffer = buffer.buffer || buffer;

    switch (dtype) {
      case '<i4': return new Int32Array(arrayBuffer);
      case '<i8': return new BigInt64Array(arrayBuffer);
      case '<f4': return new Float32Array(arrayBuffer);
      case '<f8': return new Float64Array(arrayBuffer);
      default:
        console.warn(`[nwm] Unknown dtype: ${dtype}, using Int32Array`);
        return new Int32Array(arrayBuffer);
    }
  }

  /**
   * Main extraction method (overrides base class)
   * Note: NWM uses COMIDs, not lat/lon
   */
  async extractData(variable, comid, startDate, endDate, options = {}) {
    if (!comid) {
      throw new Error('COMID is required for NWM data extraction');
    }

    if (this.format === 'zarr') {
      return await this.extractZarrData(variable, comid, startDate, endDate, options);
    } else {
      return await this.extractNetCDFData(variable, comid, startDate, endDate, options);
    }
  }
  /**
   * Get dataset info
   */
  async getDatasetInfo(args) {
    const infoType = args.info || args.infoType || 'metadata';

    switch (infoType) {
      case 'spatial':
        return this.datasetConfig.spatial;
      case 'temporal':
        return this.datasetConfig.temporal;
      default:
        return {
          ...this.datasetConfig,
          variables: await this.getVariables() // Dynamically load variables since they aren't static
        };
    }
  }

  // Helper to load variables if needed
  async getVariables() {
    // NWM variables might be defined in datasource file or config
    return this.datasetConfig.products || {};
  }
}

// ============================================================================
// UTILITY FUNCTIONS (kept for compatibility)
// ============================================================================

/**
 * Construct NWM file URL
 * @ignore
 */
export function constructNWMFileURL(baseUrl, year, date, product, datasetVersion) {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');

  return `${baseUrl}/${year}/${month}/${day}/nwm.t${hour}z.${product}.${datasetVersion}.nc`;
}

/**
 * Get NWM temporal information
 * @param {Object} datasetConfig - NWM dataset configuration
 * @returns {Object} Temporal information
 * @private
 */
export function getNWMTemporalInfo(datasetConfig) {
  return {
    start: datasetConfig.temporal.start,
    end: datasetConfig.temporal.end,
    version: datasetConfig.temporal.version,
    timeUnits: datasetConfig.temporal.timeUnits
  };
}

/**
 * Generate NWM date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} frequency - Frequency (hourly, daily)
 * @returns {Array<Date>} Array of dates
 * @private
 */
export function generateNWMDateRange(startDate, endDate, frequency) {
  const dates = [];
  let current = new Date(startDate);

  const increment = frequency === 'hourly' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  while (current <= endDate) {
    dates.push(new Date(current));
    current = new Date(current.getTime() + increment);
  }

  return dates;
}

// ============================================================================
// BACKWARD COMPATIBLE EXPORTED FUNCTIONS
// ============================================================================

/**
 * Extract NWM data (main entry point)
 * Supports both NetCDF format (for v2.0, v1.2) and Zarr format (for v2.1)
 * @ignore
 */
export async function extractNWMData(datasetConfig, variable, comid, startDate, endDate) {
  const nwm = new NWMDataSource(datasetConfig);
  return await nwm.extractData(variable, comid, startDate, endDate);
}

/**
 * Process NWM bulk extraction request
 * @ignore
 */
export async function processNWMBulkExtraction(args, datasetConfig, datasources) {
  const nwm = new NWMDataSource(datasetConfig);

  // If extracting multiple COMIDs
  if (args.comids && Array.isArray(args.comids)) {
    const results = [];

    for (const comid of args.comids) {
      try {
        const data = await nwm.extractData(
          args.variable,
          comid,
          new Date(args.startDate),
          new Date(args.endDate)
        );
        results.push({ comid, data });
      } catch (error) {
        console.error(`[nwm] Failed to extract data for COMID ${comid}:`, error.message);
        results.push({ comid, error: error.message });
      }
    }

    return {
      variable: args.variable,
      comids: args.comids,
      timeRange: {
        start: args.startDate,
        end: args.endDate
      },
      results: results,
      metadata: {
        source: 'NWM',
        version: datasetConfig.temporal.version,
        totalCOMIDs: args.comids.length,
        successCount: results.filter(r => !r.error).length
      }
    };
  }

  throw new Error('Bulk extraction requires a "comids" array');
}

/**
 * Format NWM output
 * @ignore
 */
export function formatNWMOutput(data, format) {
  const nwm = new NWMDataSource({ format: 'zarr' });

  switch (format.toLowerCase()) {
    case 'csv':
      return nwm.toCSV(data);
    case 'netcdf':
      return nwm.toNetCDF(data);
    case 'json':
    default:
      return data;
  }
}

/**
 * Convert NWM data to CSV
 * @ignore
 */
export function convertNWMToCSV(data) {
  const nwm = new NWMDataSource({ format: 'zarr' });
  return nwm.toCSV(data);
}
