/**
 * Gridded data format utilities
 * Handles lazy loading and management of gridded data libraries (Zarr, NetCDF, HDF5, GeoTIFF)
 * Provides base class for all gridded data sources with common patterns
 */

// Import centralized gridded data loader
import * as griddedData from '../../../external/gridded-data/gridded-data.js';

/**
 * Base class for all gridded data sources
 * Provides common functionality for extracting data from grid-based formats
 * @ignore
 */
export class GriddedDataSource {
  /**
   * @param {Object} config - Configuration object
   * @param {string} config.sourceName - Source identifier (e.g., 'aorc', 'mrms', 'hrrr')
   * @param {string} config.libraryType - Library type needed ('zarr', 'grib2', 'netcdf', 'geospatial')
   * @param {string} config.defaultFormat - Default data format ('zarr', 'grib2', 'netcdf', 'tiff')
   * @param {Object} config.datasourceConfig - Reference to datasources configuration
   * @param {Object} config.variables - Variables configuration for this source
   */
  constructor(config) {
    this.sourceName = config.sourceName;
    this.libraryType = config.libraryType;
    this.defaultFormat = config.defaultFormat || config.libraryType;
    this.datasourceConfig = config.datasourceConfig;
    this.variables = config.variables;
    this.library = null;
  }

  /**
   * Unified fetch with automatic caching context setup
   * Eliminates duplicate fetch functions across all utils files
   */
  async fetch(url, options = {}) {
    console.log(`[${this.sourceName}] Fetching: ${url}`);

    // Set global cache context ONLY if caching is explicitly requested
    if (options.useCache === true || options.params?.cache === true) {
      globalThis._hydroCacheContext = globalThis._hydroCacheContext || {};
      globalThis._hydroCacheContext.source = this.sourceName;
      globalThis._hydroCacheContext.params = options.params || {};
      globalThis._hydroCacheContext.cacheId = options.cacheId || options.params?.cacheId;
    }

    // Handle Proxy
    let fetchUrl = url;
    if (options.proxy || (options.params && options.params.proxy)) {
      // Default to local-proxy if true, or use specified proxy
      const proxyName = (options.proxy === true || options.params.proxy === true) ? 'local-proxy' : (options.proxy || options.params.proxy);

      // Hardcoded generic proxy map for internal use if module import is difficult here
      // ideally we would import proxies from ../datasources/proxy.js but circular deps can be tricky
      const proxies = {
        "local-proxy": "https://hydroinformatics.uiowa.edu/lab/cors/?url=",
        "researchverse": "https://researchverse.ai/backend/api/simple-proxy/?url=",
        "corsproxy": "https://corsproxy.io/?"
      };

      const proxyEndpoint = proxies[proxyName] || proxies['local-proxy'];

      // Handle CORS proxy format (some append ?url=, some just append URL)
      // For simplicity, assuming the ones with ?url= need encoding, others might just append
      if (proxyEndpoint.includes('?url=')) {
        fetchUrl = `${proxyEndpoint}${encodeURIComponent(url)}`;
      } else {
        fetchUrl = `${proxyEndpoint}${url}`;
      }

      console.log(`[${this.sourceName}] Using proxy: ${fetchUrl}`);
    }

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': options.accept || 'application/octet-stream, application/json, */*',
          ...options.headers
        }
      });

      // Handle case where cachedFetch returns ArrayBuffer directly
      if (response instanceof ArrayBuffer || (typeof Buffer !== 'undefined' && response instanceof Buffer)) {
        console.log(`[${this.sourceName}] Successfully fetched ${(response.byteLength / 1024 / 1024).toFixed(1)} MB (cached)`);
        return response;
      }

      if (!response.ok) {
        // Standardized HTTP error handling
        if (response.status === 404) {
          throw new Error(`${this.sourceName.toUpperCase()} file not found: ${url}. The requested data may not be available.`);
        } else if (response.status === 403) {
          throw new Error(`Access denied to ${this.sourceName.toUpperCase()} file: ${url}.`);
        } else if (response.status === 429) {
          throw new Error(`Rate limited by ${this.sourceName.toUpperCase()} server: ${url}. Please wait before retrying.`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      console.log(`[${this.sourceName}] Successfully fetched ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB`);

      return buffer;

    } catch (error) {
      console.error(`[${this.sourceName}] Fetch failed:`, error.message);
      throw this.handleError(error, { context: 'fetch', url });
    }
  }

  /**
   * Unified JSON fetch
   */
  async fetchJSON(url, options = {}) {
    return this.fetch(url, { ...options, accept: 'application/json' })
      .then(buffer => {
        const dec = new TextDecoder("utf-8");
        return JSON.parse(dec.decode(buffer));
      });
  }

  /**
   * Universal data scaling - works for all sources
   */
  applyScaling(value, variableMeta) {
    if (value === null || value === undefined) {
      return null;
    }

    // Check for fill/missing values
    if (variableMeta.fillValue !== undefined && value === variableMeta.fillValue) {
      return null;
    }
    if (variableMeta.missingValue !== undefined && value === variableMeta.missingValue) {
      return null;
    }

    // Apply scale factor and offset
    const scaleFactor = variableMeta.scaleFactor || 1.0;
    const addOffset = variableMeta.addOffset || 0.0;

    return (value * scaleFactor) + addOffset;
  }

  /**
   * Universal decompression handler
   */
  async decompress(compressedData, format = null, options = {}) {
    // Default to raw mode unless process is explicitly true
    // Also support legacy raw=true behavior (though strictly process=true is now the 'active' flag)
    if (options.process !== true) {
      console.log(`[${this.sourceName}] Skipping decompression (raw mode default)`);
      return compressedData;
    }

    const dataView = new Uint8Array(compressedData);

    // Check for gzip magic bytes (0x1f 0x8b)
    const isGzipped = dataView.length >= 2 && dataView[0] === 0x1f && dataView[1] === 0x8b;

    if (!isGzipped && !format) {
      // Already decompressed
      return dataView;
    }

    console.log(`[${this.sourceName}] Decompressing data (${(compressedData.byteLength / 1024 / 1024).toFixed(1)} MB)...`);

    // Try Pako first (for gzip)
    if (isGzipped) {
      let pakoLib = (typeof window !== 'undefined' && window.pako);

      // Try loading from geospatial library if not available
      if (!pakoLib) {
        // Only try to load if in browser environment
        if (typeof document !== 'undefined') {
          const geospatialLib = await loadGridDataLibrary('geospatial');
          pakoLib = geospatialLib?.pako;
        }
        // Fallback to global pako if still not found
        pakoLib = pakoLib || globalThis.pako || (typeof window !== 'undefined' && window.pako);
      }

      if (pakoLib && typeof pakoLib.ungzip === 'function') {
        try {
          const decompressed = pakoLib.ungzip(dataView);
          console.log(`[${this.sourceName}] Decompressed with Pako: ${(decompressed.length / 1024 / 1024).toFixed(1)} MB`);
          return decompressed;
        } catch (pakoError) {
          console.warn(`[${this.sourceName}] Pako decompression failed:`, pakoError.message);
        }
      }

      // Fallback to browser DecompressionStream
      if (typeof DecompressionStream !== 'undefined') {
        try {
          const response = new Response(compressedData);
          const decompressedStream = response.body.pipeThrough(new DecompressionStream('gzip'));
          const decompressedResponse = await new Response(decompressedStream).arrayBuffer();
          console.log(`[${this.sourceName}] Decompressed with browser API: ${(decompressedResponse.byteLength / 1024 / 1024).toFixed(1)} MB`);
          return new Uint8Array(decompressedResponse);
        } catch (browserError) {
          console.warn(`[${this.sourceName}] Browser decompression failed:`, browserError.message);
        }
      }
    }

    // Try format-specific decompression (blosc, zstd, etc.)
    if (this.library) {
      // Try fzstd for zstd-compressed data
      const fzstd = this.library.fzstd || globalThis.fzstd;
      if (fzstd && typeof fzstd.decompress === 'function') {
        try {
          const decompressed = fzstd.decompress(dataView);
          console.log(`[${this.sourceName}] Decompressed with fzstd`);
          return decompressed;
        } catch (fzstdError) {
          console.warn(`[${this.sourceName}] fzstd decompression failed:`, fzstdError.message);
        }
      }

      // Try blosc decompression
      if (typeof globalThis.decompress === 'function') {
        try {
          const decompressed = globalThis.decompress(dataView);
          console.log(`[${this.sourceName}] Decompressed with blosc`);
          return decompressed;
        } catch (bloscError) {
          console.warn(`[${this.sourceName}] blosc decompression failed:`, bloscError.message);
        }
      }
    }

    throw new Error(`${this.sourceName.toUpperCase()} decompression failed: No compatible decompression method available`);
  }

  /**
   * Load required library for this data source
   */
  async loadLibrary() {
    if (!this.library) {
      this.library = await loadGridDataLibrary(this.libraryType);
    }

    // Fallback: if library failed to load (e.g. in worker), check global scope
    if (!this.library) {
      if (this.libraryType === 'geospatial') {
        this.library = {};
        if (typeof globalThis.GeoTIFF !== 'undefined') this.library.GeoTIFF = globalThis.GeoTIFF;
        if (typeof globalThis.Tiff !== 'undefined') this.library.Tiff = globalThis.Tiff;
        if (typeof globalThis.JSZip !== 'undefined') this.library.JSZip = globalThis.JSZip;
      } else if (this.libraryType === 'netcdf') {
        this.library = {};
        if (typeof globalThis.netcdfjs !== 'undefined') this.library.NetCDFReader = globalThis.netcdfjs;
        // Some might be exposed differently
      } else if (this.libraryType === 'grib2') {
        // handle grib2 globals if they exist
      }
    }

    // Final check - only throw if we absolutely cannot proceed and need the library for parsing
    // We defer the check to the actual usage methods (parseGeoTIFF, etc.)
    return this.library;
  }

  /**
   * Find nearest grid index - universal implementation
   * Used by AORC, NLDAS, and others with different coordinate systems
   */
  findNearestIndex(coordSystem, targetValue) {
    if (coordSystem.resolution) {
      // Resolution-based (AORC style)
      const { min, max, resolution } = coordSystem;
      const index = Math.round((targetValue - min) / resolution);
      return Math.max(0, Math.min(index, Math.floor((max - min) / resolution)));
    } else if (Array.isArray(coordSystem)) {
      // Array-based (find closest value in array)
      return coordSystem.reduce((closestIdx, value, idx) =>
        Math.abs(value - targetValue) < Math.abs(coordSystem[closestIdx] - targetValue) ? idx : closestIdx,
        0
      );
    } else {
      throw new Error('Invalid coordinate system format');
    }
  }

  /**
   * Generic time series extraction
   * Eliminates duplicate time series loops from all utils files (~1000 lines total)
   */
  async extractTimeSeries(variable, latitude, longitude, startTime, endTime, options = {}) {
    console.log(`[${this.sourceName}] Extracting ${variable} time series at (${latitude}, ${longitude})`);

    const timeSeries = [];
    let currentTime = new Date(startTime);

    // Determine time increment (source-specific, passed in options)
    const timeIncrement = options.timeIncrement || (60 * 60 * 1000); // Default 1 hour

    while (currentTime <= endTime) {
      try {
        // Call source-specific point data extraction
        const pointData = await this.extractPointData(variable, latitude, longitude, currentTime, options);

        timeSeries.push({
          timestamp: currentTime.toISOString(),
          value: pointData.value,
          ...options.includeMetadata && { metadata: pointData.metadata }
        });

      } catch (timeError) {
        console.warn(`[${this.sourceName}] Failed to get data for ${currentTime.toISOString()}: ${timeError.message}`);
        timeSeries.push({
          timestamp: currentTime.toISOString(),
          value: null,
          error: timeError.message
        });
      }

      // Move to next time step
      if (typeof timeIncrement === 'function') {
        currentTime = timeIncrement(currentTime);
      } else {
        currentTime = new Date(currentTime.getTime() + timeIncrement);
      }
    }

    return {
      variable: variable,
      location: { latitude, longitude },
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      },
      data: timeSeries,
      metadata: {
        source: this.sourceName.toUpperCase(),
        temporalResolution: options.temporalResolution || 'variable',
        count: timeSeries.length,
        validCount: timeSeries.filter(d => d.value !== null).length
      }
    };
  }

  /**
   * Convert to CSV format - universal implementation
   * Eliminates duplicate CSV converters from aorc, nwm, data-transformers (~300 lines)
   */
  toCSV(data, options = {}) {
    const includeLocation = options.includeLocation !== false;
    const includeMetadata = options.includeMetadata !== false;

    // Build header
    let header = 'timestamp,value,variable';
    if (includeMetadata) header += ',units';
    if (includeLocation) header += ',latitude,longitude';
    header += '\n';

    let csv = header;

    // Handle different data structures
    const dataArray = Array.isArray(data.data) ? data.data : [data];

    dataArray.forEach(item => {
      const timestamp = item.timestamp || data.timestamp || '';
      const value = item.value !== null && item.value !== undefined ? Number(item.value).toFixed(6) : '';
      const variable = data.variable || item.variable || '';

      let row = `${timestamp},${value},${variable}`;

      if (includeMetadata) {
        const units = data.metadata?.units || item.metadata?.units || '';
        row += `,${units}`;
      }

      if (includeLocation) {
        const lat = data.location?.latitude || item.location?.latitude || '';
        const lon = data.location?.longitude || item.location?.longitude || '';
        row += `,${lat},${lon}`;
      }

      csv += row + '\n';
    });

    return csv;
  }

  /**
   * Convert to NetCDF-compatible structure
   * Eliminates duplicate NetCDF converters (~200 lines)
   */
  toNetCDF(data, options = {}) {
    const variableName = data.variable;
    const variableMeta = this.variables?.[variableName] || {};

    return {
      type: 'netcdf',
      dimensions: {
        time: data.data?.length || 0,
        latitude: data.location ? 1 : (data.data?.coordinates?.latitude?.length || 0),
        longitude: data.location ? 1 : (data.data?.coordinates?.longitude?.length || 0)
      },
      variables: {
        [variableName]: {
          dimensions: ['time', 'latitude', 'longitude'],
          data: data.data,
          attributes: {
            units: variableMeta.units || data.metadata?.units || '',
            long_name: variableMeta.longName || variableMeta.description || variableName,
            scale_factor: variableMeta.scaleFactor || 1.0,
            add_offset: variableMeta.addOffset || 0.0,
            source: this.sourceName.toUpperCase()
          }
        }
      },
      globalAttributes: {
        title: `${this.sourceName.toUpperCase()} ${variableName} data`,
        institution: options.institution || 'HydroLang',
        source: `${this.sourceName.toUpperCase()} Dataset`,
        history: `Generated on ${new Date().toISOString()}`,
        dataSource: this.sourceName
      }
    };
  }

  /**
   * Validation methods - universal implementations
   */
  validateCoordinates(latitude, longitude, spatialBounds = null) {
    const bounds = spatialBounds || this.datasourceConfig?.spatial;

    if (!bounds) return true; // No bounds to validate against

    const latMin = bounds.latitude?.min || -90;
    const latMax = bounds.latitude?.max || 90;
    const lonMin = bounds.longitude?.min || -180;
    const lonMax = bounds.longitude?.max || 180;

    if (latitude < latMin || latitude > latMax) {
      throw new Error(`Latitude ${latitude} is outside ${this.sourceName.toUpperCase()} domain [${latMin}, ${latMax}]`);
    }

    if (longitude < lonMin || longitude > lonMax) {
      throw new Error(`Longitude ${longitude} is outside ${this.sourceName.toUpperCase()} domain [${lonMin}, ${lonMax}]`);
    }

    return true;
  }

  validateBbox(bbox, spatialBounds = null) {
    const [west, south, east, north] = bbox;

    if (west >= east) {
      throw new Error('Invalid bbox: west must be less than east');
    }
    if (south >= north) {
      throw new Error('Invalid bbox: south must be less than north');
    }

    const bounds = spatialBounds || this.datasourceConfig?.spatial;

    if (bounds) {
      const latMin = bounds.latitude?.min || -90;
      const latMax = bounds.latitude?.max || 90;
      const lonMin = bounds.longitude?.min || -180;
      const lonMax = bounds.longitude?.max || 180;

      if (west < lonMin || east > lonMax || south < latMin || north > latMax) {
        console.warn(`[${this.sourceName}] Requested bbox partially outside domain, clipping may occur`);
      }
    }

    return true;
  }

  validateDateRange(startDate, endDate, temporalBounds = null) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }

    if (start > end) {
      throw new Error('Start date must be before end date');
    }

    const bounds = temporalBounds || this.datasourceConfig?.temporal;

    if (bounds) {
      const datasetStart = new Date(bounds.start);
      const datasetEnd = new Date(bounds.end);

      if (start < datasetStart || end > datasetEnd) {
        throw new Error(
          `Requested date range (${startDate} to ${endDate}) is outside ${this.sourceName.toUpperCase()} ` +
          `dataset range (${bounds.start} to ${bounds.end})`
        );
      }
    }

    return true;
  }

  /**
   * Standardized error handling
   */
  handleError(error, context = {}) {
    const errorMessage = error.message || 'Unknown error';
    const contextStr = context.context ? `[${context.context}]` : '';

    console.error(`[${this.sourceName}] ${contextStr} Error:`, errorMessage);

    // Return a standardized error
    return new Error(
      `${this.sourceName.toUpperCase()} ${context.context || 'operation'} failed: ${errorMessage}`
    );
  }

  /**
   * Generic bulk extraction for multiple points
   * Eliminates duplicate multipoint extraction from nldas, aorc, etc.
   */
  async extractMultiplePoints(variable, points, timestamp, options = {}) {
    console.log(`[${this.sourceName}] Extracting ${variable} for ${points.length} points`);

    const results = [];

    for (const point of points) {
      const { latitude, longitude, id } = point;

      try {
        const pointData = await this.extractPointData(variable, latitude, longitude, timestamp, options);

        results.push({
          id: id || `${latitude},${longitude}`,
          latitude,
          longitude,
          value: pointData.value,
          timestamp: timestamp.toISOString(),
          ...options.includeMetadata && { metadata: pointData.metadata }
        });

      } catch (pointError) {
        console.warn(`[${this.sourceName}] Failed to extract point ${latitude}, ${longitude}:`, pointError.message);
        results.push({
          id: id || `${latitude},${longitude}`,
          latitude,
          longitude,
          value: null,
          timestamp: timestamp.toISOString(),
          error: pointError.message
        });
      }
    }

    return {
      variable,
      timestamp: timestamp.toISOString(),
      points: results,
      metadata: {
        source: this.sourceName.toUpperCase(),
        count: results.length,
        validCount: results.filter(r => r.value !== null).length
      }
    };
  }

  /**
   * Generic grid aggregation over time
   * Used by bulk extraction in AORC, MRMS, HRRR, etc.
   */
  async extractGridTimeSeries(variable, bbox, startTime, endTime, options = {}) {
    console.log(`[${this.sourceName}] Extracting ${variable} grid time series`);

    const gridData = [];
    let currentTime = new Date(startTime);
    const timeIncrement = options.timeIncrement || (60 * 60 * 1000); // Default 1 hour

    while (currentTime <= endTime) {
      try {
        const grid = await this.extractGridData(variable, bbox, currentTime, options);
        gridData.push({
          timestamp: currentTime.toISOString(),
          grid: grid
        });

      } catch (timeError) {
        console.warn(`[${this.sourceName}] Failed to get grid for ${currentTime.toISOString()}: ${timeError.message}`);
        gridData.push({
          timestamp: currentTime.toISOString(),
          grid: null,
          error: timeError.message
        });
      }

      // Move to next time step
      if (typeof timeIncrement === 'function') {
        currentTime = timeIncrement(currentTime);
      } else {
        currentTime = new Date(currentTime.getTime() + timeIncrement);
      }
    }

    return {
      variable,
      bbox,
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      },
      data: gridData,
      metadata: {
        source: this.sourceName.toUpperCase(),
        count: gridData.length,
        validCount: gridData.filter(d => d.grid !== null).length
      }
    };
  }

  /**
   * Apply temporal aggregation (used in bulk operations)
   * Consolidates aggregateTime from gridded-data-utils and various source utils
   */
  aggregateTemporally(data, aggregationType = 'mean') {
    if (!data || data.length === 0) return null;

    const validValues = data.filter(v => v !== null && v !== undefined && !isNaN(v));

    if (validValues.length === 0) return null;

    switch (aggregationType.toLowerCase()) {
      case 'mean':
      case 'average':
        return validValues.reduce((sum, v) => sum + v, 0) / validValues.length;

      case 'sum':
      case 'total':
        return validValues.reduce((sum, v) => sum + v, 0);

      case 'min':
      case 'minimum':
        return Math.min(...validValues);

      case 'max':
      case 'maximum':
        return Math.max(...validValues);

      case 'median':
        const sorted = [...validValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];

      default:
        console.warn(`Unknown aggregation type: ${aggregationType}, using mean`);
        return validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
    }
  }

  /**
   * Apply spatial aggregation (used in grid operations)
   */
  aggregateSpatially(gridValues, aggregationType = 'mean') {
    // Flatten grid if it's 2D array
    const flatValues = Array.isArray(gridValues[0])
      ? gridValues.flat()
      : gridValues;

    return this.aggregateTemporally(flatValues, aggregationType);
  }

  /**
   * Format timestamp for URL construction (source-specific format passed as option)
   */
  formatTimestamp(date, format = 'iso') {
    const d = new Date(date);

    switch (format) {
      case 'iso':
        return d.toISOString();

      case 'yyyymmdd':
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}${month}${day}`;

      case 'yyyymmddhh':
        const hh = String(d.getUTCHours()).padStart(2, '0');
        return `${this.formatTimestamp(d, 'yyyymmdd')}${hh}`;

      case 'yyyy-mm-dd':
        const yr = d.getUTCFullYear();
        const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dy = String(d.getUTCDate()).padStart(2, '0');
        return `${yr}-${mo}-${dy}`;

      case 'yyyy/mm/dd':
        return this.formatTimestamp(d, 'yyyy-mm-dd').replace(/-/g, '/');

      default:
        // Custom format function passed
        if (typeof format === 'function') {
          return format(d);
        }
        return d.toISOString();
    }
  }

  /**
   * Build URL from template and parameters
   * Reduces repetitive URL construction in all source utils
   */
  buildURL(template, params = {}) {
    let url = template;

    // Replace template variables like {variable}, {date}, etc.
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{${key}}`;
      if (url.includes(placeholder)) {
        url = url.replace(new RegExp(placeholder, 'g'), value);
      }
    }

    return url;
  }

  /**
   * Abstract methods - to be implemented by specific sources
   * (or use default implementations provided above)
   */
  async extractPointData(variable, latitude, longitude, timestamp, options = {}) {
    throw new Error(`extractPointData not implemented for ${this.sourceName}`);
  }

  async extractGridData(variable, bbox, timestamp, options = {}) {
    throw new Error(`extractGridData not implemented for ${this.sourceName}`);
  }
}

/**
 * Zarr Data Source Implementation
 * Handles reading Zarr V2/V3 stores using zarr.js
 * @ignore
 */
export class ZarrDataSource extends GriddedDataSource {
  constructor(config) {
    super({ ...config, libraryType: 'zarr' });
  }

  /**
   * Extract value from Zarr array at specific indices
   */
  async getZarrValue(zarrArray, indices, variableMeta) {
    const rawValue = await zarrArray.get(indices);
    return this.applyScaling(rawValue, variableMeta);
  }

  /**
   * Extract slice from Zarr array
   */
  async getZarrSlice(zarrArray, sliceParams, variableMeta) {
    const slice = await zarrArray.get(sliceParams);

    // Apply scaling to all values
    if (Array.isArray(slice)) {
      return slice.map(row =>
        Array.isArray(row)
          ? row.map(val => this.applyScaling(val, variableMeta))
          : this.applyScaling(row, variableMeta)
      );
    }

    return this.applyScaling(slice, variableMeta);
  }

  /**
   * Open Zarr array from URL using zarrita
   */
  async openZarrArray(url, options = {}) {
    await this.loadLibrary();

    if (!this.library || !this.library.zarr) {
      throw new Error('Zarrita library not available');
    }

    try {
      const store = new this.library.zarr.FetchStore(url);
      const zarrArray = await this.library.zarr.open(store, { kind: 'array', ...options });
      return zarrArray;
    } catch (error) {
      throw new Error(`Failed to open Zarr array at ${url}: ${error.message}`);
    }
  }

  /**
   * Get full array data
   */
  async getZarrArrayData(zarrArray) {
    await this.loadLibrary();

    if (!this.library || !this.library.zarr) {
      throw new Error('Zarrita library not available');
    }

    return await this.library.zarr.get(zarrArray);
  }

  /**
   * Get array chunk
   */
  async getZarrChunk(zarrArray, indices) {
    return await zarrArray.getChunk(indices);
  }

  /**
   * Get array region
   */
  async getZarrRegion(zarrArray, region) {
    await this.loadLibrary();

    if (!this.library || !this.library.zarr) {
      throw new Error('Zarrita library not available');
    }

    return await this.library.zarr.get(zarrArray, region);
  }
}

/**
 * GRIB2 Data Source Implementation
 * Handles reading GRIB2 files using custom GRIB2 parser or grib2-simple
 * @ignore
 */
export class GRIB2DataSource extends GriddedDataSource {
  constructor(config) {
    super({ ...config, libraryType: 'grib2' });
  }

  /**
   * Parse GRIB2 file from buffer
   */
  async parseGRIB2(buffer, options = {}) {
    await this.loadLibrary();

    const grib2Parser = this.library?.parseGRIB2 || this.library?.GRIB2Parser || globalThis.GRIB2Parser;

    if (!grib2Parser) {
      throw new Error('GRIB2 parser not available');
    }

    console.log(`[${this.sourceName}] Parsing GRIB2 data...`);

    // Ensure we pass an ArrayBuffer, not a Uint8Array
    let dataToParse = buffer;
    if (buffer instanceof Uint8Array || (typeof Buffer !== 'undefined' && buffer instanceof Buffer)) {
      if (buffer.byteOffset === 0 && buffer.byteLength === buffer.buffer.byteLength) {
        dataToParse = buffer.buffer;
      } else {
        // Create a copy if it's a view or offset
        dataToParse = buffer.slice(0).buffer;
        // Note: slice(0) on TypedArray returns a new TypedArray, .buffer gets its ArrayBuffer
        // If it was already a fresh Uint8Array from pako, .buffer is fine, but safety first.
        // Actually, pako.ungzip returns a Uint8Array. If it's the whole buffer, .buffer is enough.
        // But let's be safe.
        if (dataToParse instanceof Uint8Array) {
          dataToParse = dataToParse.buffer;
        }
      }
    }

    // Double check it is an ArrayBuffer
    if (dataToParse && dataToParse.buffer instanceof ArrayBuffer && !(dataToParse instanceof ArrayBuffer)) {
      dataToParse = dataToParse.buffer;
    }

    // Pass pako library for PNG decompression
    const pakoLib = (typeof window !== 'undefined' && window.pako) || globalThis.pako;
    let messages = await grib2Parser(dataToParse, { pako: pakoLib });

    // Handle case where parser returns an object with messages property
    if (messages && !Array.isArray(messages) && messages.messages && Array.isArray(messages.messages)) {
      messages = messages.messages;
    }

    console.log(`[${this.sourceName}] Found ${messages?.length} GRIB2 messages`);

    if (!messages || !Array.isArray(messages)) {
      throw new Error('GRIB2 parser returned invalid data format (expected array of messages)');
    }

    return messages;
  }

  /**
   * Find specific message in GRIB2 file by variable
   */
  findGRIB2Message(messages, variable, options = {}) {
    const variableMeta = this.variables?.[variable] || {};
    const gribName = variableMeta.gribName || variableMeta.name || variable;

    for (const message of messages) {
      // Handle GRIB2 object structure (message.data) or flat object
      const msgData = message.data || message;
      const messageVar = msgData.discipline || msgData.parameterName || msgData.shortName;

      console.log(`[findGRIB2Message] Checking message: shortName=${msgData.shortName}, parameterName=${msgData.parameterName}, gribName=${gribName}`);

      if (messageVar === gribName ||
        msgData.parameterName === gribName ||
        msgData.shortName === gribName) {
        return message;
      }
    }

    // If no exact match, try partial matching
    for (const message of messages) {
      const messageVarStr = JSON.stringify(message).toLowerCase();
      if (messageVarStr.includes(gribName.toLowerCase())) {
        console.warn(`[${this.sourceName}] Using partial match for ${gribName}`);
        return message;
      }
    }

    throw new Error(`Variable ${variable} (${gribName}) not found in GRIB2 file`);
  }

  /**
   * Extract value from GRIB2 grid at lat/lon
   */
  getGRIB2ValueAtPoint(message, latitude, longitude) {
    const msgData = message.data || message;
    const gridData = msgData.values || msgData.data; // handle both naming conventions

    // Debug optimization logic
    if (msgData.grid) {
      console.log(`[getGRIB2ValueAtPoint] Grid info: template=${msgData.grid.template}, latStart=${msgData.grid.latStart}, latEnd=${msgData.grid.latEnd}, incI=${msgData.grid.incI}, incJ=${msgData.grid.incJ}`);
      console.log(`[getGRIB2ValueAtPoint] Latitudes array present: ${!!(msgData.grid.latitudes && msgData.grid.latitudes.length)}`);
    } else {
      console.log(`[getGRIB2ValueAtPoint] msgData.grid is undefined`);
    }

    // Optimization for regular grids (Template 3.0)
    if (msgData.grid && msgData.grid.template === 0 && msgData.grid.latStart !== undefined) {
      const grid = msgData.grid;
      const lat = latitude;
      let lon = longitude;
      if (lon < 0) lon += 360; // Normalize to 0-360 for GRIB2 if needed

      // Calculate indices
      // Lat: usually decreases from latStart
      let latIdx;
      if (grid.latStart > grid.latEnd) {
        latIdx = Math.round((grid.latStart - lat) / grid.incJ);
      } else {
        latIdx = Math.round((lat - grid.latStart) / grid.incJ);
      }

      // Lon: usually increases from lonStart
      let lonIdx = Math.round((lon - grid.lonStart) / grid.incI);

      console.log(`[getGRIB2ValueAtPoint] Calculated indices: latIdx=${latIdx}, lonIdx=${lonIdx} for lat=${lat}, lon=${lon}`);

      // Check bounds
      if (latIdx >= 0 && latIdx < grid.numLatPoints &&
        lonIdx >= 0 && lonIdx < grid.numLongPoints) {

        // Calculate linear index
        // GRIB2 usually scans row by row (check scanning mode if needed)
        const idx = (latIdx * grid.numLongPoints) + lonIdx;

        console.log(`[getGRIB2ValueAtPoint] Linear index: ${idx}, Grid data length: ${gridData ? gridData.length : 'undefined'}`);

        if (idx >= 0 && idx < gridData.length) {
          return gridData[idx];
        }
      } else {
        console.warn(`[getGRIB2ValueAtPoint] Indices out of bounds: latIdx=${latIdx}/${grid.numLatPoints}, lonIdx=${lonIdx}/${grid.numLongPoints}`);
      }
      // If out of bounds, return null or throw?
      // Fallback to array search if indices fail (unlikely for regular grid)
    } else {
      console.log(`[getGRIB2ValueAtPoint] Optimization skipped. Conditions: grid=${!!msgData.grid}, template=${msgData.grid?.template}, latStart=${msgData.grid?.latStart !== undefined}`);
    }

    const latitudes = msgData.latitudes || msgData.grid?.latitudes;
    const longitudes = msgData.longitudes || msgData.grid?.longitudes;

    if (!gridData || !latitudes || !longitudes) {
      throw new Error('GRIB2 message missing required grid data (latitudes/longitudes arrays)');
    }

    // Find nearest point (Brute Force - Fallback)
    let minDist = Infinity;
    let nearestIdx = 0;

    for (let i = 0; i < latitudes.length; i++) {
      const dist = Math.sqrt(
        Math.pow(latitudes[i] - latitude, 2) +
        Math.pow(longitudes[i] - longitude, 2)
      );

      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    return gridData[nearestIdx];
  }

  /**
   * Extract grid from GRIB2 within bbox
   */
  getGRIB2Grid(message, bbox) {
    const [west, south, east, north] = bbox;
    const gridData = message.data || message.values;
    const latitudes = message.latitudes || message.grid?.latitudes;
    const longitudes = message.longitudes || message.grid?.longitudes;

    if (!gridData || !latitudes || !longitudes) {
      throw new Error('GRIB2 message missing required grid data');
    }

    const extractedPoints = [];
    const extractedLats = [];
    const extractedLons = [];

    for (let i = 0; i < latitudes.length; i++) {
      const lat = latitudes[i];
      const lon = longitudes[i];

      if (lat >= south && lat <= north && lon >= west && lon <= east) {
        extractedPoints.push(gridData[i]);
        extractedLats.push(lat);
        extractedLons.push(lon);
      }
    }

    return {
      data: extractedPoints,
      latitudes: extractedLats,
      longitudes: extractedLons,
      count: extractedPoints.length
    };
  }
}

/**
 * NetCDF Data Source Implementation
 * Handles reading NetCDF files using netcdfjs
 * @ignore
 */
export class NetCDFDataSource extends GriddedDataSource {
  constructor(config) {
    super({ ...config, libraryType: 'netcdf' });
  }

  /**
   * Open and parse NetCDF file
   */
  async openNetCDF(source, options = {}) {
    await this.loadLibrary();

    let buffer;

    if (typeof source === 'string') {
      // URL - fetch first
      buffer = await this.fetch(source, options);
    } else {
      buffer = source;
    }

    console.log(`[${this.sourceName}] Parsing NetCDF data...`);

    const NetCDFReader = this.library?.NetCDFReader || this.library || globalThis.netcdfjs || globalThis.NetCDFReader;

    if (!NetCDFReader) {
      throw new Error('NetCDF parser not available');
    }

    const ncFile = new NetCDFReader(buffer);

    console.log(`[${this.sourceName}] NetCDF variables: ${ncFile.variables?.map(v => v.name).join(', ')}`);

    return ncFile;
  }

  /**
   * Get variable data from NetCDF
   */
  getNetCDFVariable(ncFile, variableName) {
    const variable = ncFile.getDataVariable(variableName);

    if (!variable) {
      const availableVars = ncFile.variables?.map(v => v.name).join(', ') || 'none';
      throw new Error(`Variable ${variableName} not found. Available: ${availableVars}`);
    }

    return variable;
  }

  /**
   * Extract value from NetCDF at specific indices
   */
  getNetCDFValue(ncFile, variableName, indices, variableMeta) {
    const data = ncFile.getDataVariable(variableName);

    if (!data) {
      throw new Error(`Variable ${variableName} not found in NetCDF`);
    }

    // Get value at indices (format depends on netcdf library)
    let value;
    if (typeof data.get === 'function') {
      value = data.get(indices);
    } else if (Array.isArray(data)) {
      // Navigate nested array structure
      value = indices.reduce((arr, idx) => arr[idx], data);
    } else {
      throw new Error('Unsupported NetCDF data structure');
    }

    return this.applyScaling(value, variableMeta);
  }

  /**
   * Extract slice from NetCDF
   */
  getNetCDFSlice(ncFile, variableName, sliceParams, variableMeta) {
    const variable = this.getNetCDFVariable(ncFile, variableName);

    // Extract slice (implementation depends on library)
    const slice = variable.readSlice(sliceParams);

    // Apply scaling
    return slice.map(row =>
      Array.isArray(row)
        ? row.map(val => this.applyScaling(val, variableMeta))
        : this.applyScaling(row, variableMeta)
    );
  }
}

/**
 * GeoTIFF Data Source Implementation
 * Handles reading GeoTIFF files using geotiff.js
 * @ignore
 */
export class GeoTIFFDataSource extends GriddedDataSource {
  constructor(config) {
    super({ ...config, libraryType: 'geospatial' });
  }

  /**
   * Parse GeoTIFF from buffer
   */
  async parseGeoTIFF(buffer, options = {}) {
    await this.loadLibrary();

    const GeoTIFF = this.library?.GeoTIFF || globalThis.GeoTIFF;

    if (!GeoTIFF || !GeoTIFF.fromArrayBuffer) {
      throw new Error('GeoTIFF library not available');
    }

    console.log(`[${this.sourceName}] Parsing GeoTIFF...`);

    const tiff = await GeoTIFF.fromArrayBuffer(buffer);
    const image = await tiff.getImage();

    const width = image.getWidth();
    const height = image.getHeight();
    const bbox = image.getBoundingBox();

    console.log(`[${this.sourceName}] GeoTIFF: ${width}x${height}, bbox:`, bbox);

    return { tiff, image };
  }

  /**
   * Extract value from GeoTIFF at lat/lon
   */
  async getGeoTIFFValueAtPoint(image, latitude, longitude, variableMeta) {
    const bbox = image.getBoundingBox();
    const width = image.getWidth();
    const height = image.getHeight();

    // Convert lat/lon to pixel coordinates
    const pixelX = Math.floor(((longitude - bbox[0]) / (bbox[2] - bbox[0])) * width);
    const pixelY = Math.floor(((bbox[3] - latitude) / (bbox[3] - bbox[1])) * height);

    if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height) {
      throw new Error(`Point (${latitude}, ${longitude}) is outside GeoTIFF bounds`);
    }

    // Read window around point
    const window = [pixelX, pixelY, pixelX + 1, pixelY + 1];
    const rasters = await image.readRasters({ window });

    const rawValue = rasters[0][0]; // First band, first pixel

    return this.applyScaling(rawValue, variableMeta);
  }

  /**
   * Extract grid from GeoTIFF within bbox
   */
  async getGeoTIFFGrid(image, bbox, variableMeta) {
    const [west, south, east, north] = bbox;
    const imageBbox = image.getBoundingBox();
    const width = image.getWidth();
    const height = image.getHeight();

    // Convert bbox to pixel window
    const x1 = Math.max(0, Math.floor(((west - imageBbox[0]) / (imageBbox[2] - imageBbox[0])) * width));
    const y1 = Math.max(0, Math.floor(((imageBbox[3] - north) / (imageBbox[3] - imageBbox[1])) * height));
    const x2 = Math.min(width, Math.ceil(((east - imageBbox[0]) / (imageBbox[2] - imageBbox[0])) * width));
    const y2 = Math.min(height, Math.ceil(((imageBbox[3] - south) / (imageBbox[3] - imageBbox[1])) * height));

    const window = [x1, y1, x2, y2];
    const rasters = await image.readRasters({ window });

    // Apply scaling to all values
    const scaledData = Array.from(rasters[0]).map(val => this.applyScaling(val, variableMeta));

    return {
      data: scaledData,
      width: x2 - x1,
      height: y2 - y1,
      bbox: bbox
    };
  }

  /**
   * Handle ZIP extraction for PRISM and similar sources
   */
  async extractFromZip(zipBuffer, filePattern = null) {
    const JSZip = this.library?.JSZip || globalThis.JSZip;

    if (!JSZip) {
      throw new Error('JSZip library not available');
    }

    console.log(`[${this.sourceName}] Extracting ZIP file...`);

    const zip = await JSZip.loadAsync(zipBuffer);
    const files = Object.keys(zip.files);

    console.log(`[${this.sourceName}] ZIP contains ${files.length} files`);

    // Find matching file
    let targetFile = null;

    if (filePattern) {
      const pattern = typeof filePattern === 'string'
        ? new RegExp(filePattern)
        : filePattern;

      targetFile = files.find(f => pattern.test(f));
    } else {
      // Default: find first .tif or .bil file
      targetFile = files.find(f => f.endsWith('.tif') || f.endsWith('.bil'));
    }

    if (!targetFile) {
      throw new Error(`No matching file found in ZIP. Files: ${files.join(', ')}`);
    }

    console.log(`[${this.sourceName}] Extracting: ${targetFile}`);

    const fileData = await zip.files[targetFile].async('arraybuffer');

    return {
      fileName: targetFile,
      data: fileData,
      allFiles: files
    };
  }
}

/**
 * Load grid data library dynamically (lazy loading)
 * @ignore
 */
export async function loadGridDataLibrary(format) {
  try {
    // Check environment
    const isWorker = typeof document === 'undefined';

    // Prepare options to disable dynamic loading in workers
    const options = isWorker ? {
      includeJS: false,
      includeGeo: false,
      includeProj4: false,
      includeGeoTIFF: false,
      includeTurf: false,
      includeGeolib: false
    } : {};

    // Use centralized loader from external/gridded-data
    const { loadLibrary } = await import('../../../external/gridded-data/gridded-data.js');
    return await loadLibrary({ params: { format, options } }); // Pass options correctly
  } catch (error) {
    throw new Error(`Failed to load ${format} library: ${error.message}`);
  }
}


/**
 * Check if a library is loaded
 * @ignore
 */
export function isGridDataLibraryLoaded(format) {
  // We can't easily check synchronously without importing the module
  // But since we are moving to centralized loader, we should rely on it.
  // However, we can't import it synchronously here if we want to keep this function synchronous
  // and avoid top-level side effects if possible.

  // Actually, the best approach is to import the centralized loader at the top level
  // because the sub-loaders are lazy anyway.
  // Let's assume we will add the import at the top.

  return griddedData.isLoaded({ params: { format } });
}

/**
 * Get a loaded library
 * @ignore
 */
export function getGridDataLibrary(format) {
  switch (format) {
    case 'zarr':
      return zarrLoadedLibraries;
    case 'netcdf':
      return netcdfLibrary;
    case 'hdf5':
      return hdf5Library;
    case 'geospatial':
      return geospatialLibrary;
    case 'grib2':
      return grib2Library;
    default:
      return null;
  }
}

/**
 * Aggregate time series data
 * @ignore
 */
export function aggregateTime(date, timeStep, direction) {
  const dateObj = new Date(date);
  const hours = timeStep === '1D' ? 24 : parseInt(timeStep) || 1;

  if (direction === 'start') {
    const startOfPeriod = new Date(dateObj);
    startOfPeriod.setHours(Math.floor(dateObj.getHours() / hours) * hours, 0, 0, 0);
    return startOfPeriod.toISOString();
  } else {
    const endOfPeriod = new Date(dateObj);
    endOfPeriod.setHours(Math.ceil((dateObj.getHours() + 1) / hours) * hours, 0, 0, 0);
    return endOfPeriod.toISOString();
  }
}

/**
 * Expand spatial bounds by a buffer
 * @ignore
 */
export function expandSpatialBounds(bbox, spatialStep) {
  const [west, south, east, north] = bbox;
  const expansionFactor = spatialStep / 10;
  return [
    Math.max(-180, west - expansionFactor),
    Math.max(-90, south - expansionFactor),
    Math.min(180, east + expansionFactor),
    Math.min(90, north + expansionFactor)
  ];
}

/**
 * Check if coordinate is valid
 * @ignore
 */
export function isValidCoordinate(latitude, longitude, spatialBounds) {
  return latitude >= spatialBounds.latitude.min &&
    latitude <= spatialBounds.latitude.max &&
    longitude >= spatialBounds.longitude.min &&
    longitude <= spatialBounds.longitude.max;
}

/**
 * Check if bounding box is valid
 * @ignore
 */
export function isValidBoundingBox(bbox, spatialBounds) {
  const [west, south, east, north] = bbox;
  return west >= spatialBounds.longitude.min &&
    east <= spatialBounds.longitude.max &&
    south >= spatialBounds.latitude.min &&
    north <= spatialBounds.latitude.max;
}
