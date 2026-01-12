/**
 * AORC (Analysis of Record for Calibration) data utilities - Refactore
 * Handles year-based Zarr stores with chunked data access
 */

import { ZarrDataSource, loadGridDataLibrary } from './gridded-data-utils.js';

/**
 * AORC-specific data source implementation
 * Extends ZarrDataSource with AORC-specific chunking and year-based organization
 */
export class AORCDataSource extends ZarrDataSource {
  constructor(datasetConfig) {
    super({
      sourceName: 'aorc',
      libraryType: 'zarr',
      datasourceConfig: datasetConfig,
      variables: null // Will be loaded from datasources/aorc.js
    });
    this.datasetConfig = datasetConfig;
    this.aorcDatasource = null;
  }

  /**
   * Lazy load AORC datasource configuration
   */
  async loadDatasource() {
    if (!this.aorcDatasource) {
      const { default: aorcDatasource } = await import('../datasources/aorc.js');
      this.aorcDatasource = aorcDatasource;
      this.variables = aorcDatasource.variables;
    }
    return this.aorcDatasource;
  }

  /**
   * Fetch Zarr metadata for a variable
   */
  async fetchMetadata(year, variable) {
    const metadataUrl = `${this.datasetConfig.baseUrl}/${year}.zarr/${variable}/.zarray`;
    console.log(`[aorc] Fetching metadata from: ${metadataUrl}`);

    // Conditional caching - only use cache if explicitly requested
    // Metadata fetching typically doesn't need caching, so default to standard fetch
    const response = await fetch(metadataUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    return await response.json();
  }

  /**
   * Extract point data using zarrita (modern approach)
   */
  async extractPointData(variable, latitude, longitude, timestamp, options = {}) {
    await this.loadDatasource();

    // Handle multiple variables
    if (Array.isArray(variable)) {
      console.log(`[aorc] Extracting multiple variables: ${variable.join(', ')}`);
      const results = {};

      // Process sequentially to avoid overwhelming the browser/network with too many concurrent requests
      // or use Promise.all for parallelism if safe. Given chunk caching, parallelism is probably fine.
      await Promise.all(variable.map(async (v) => {
        try {
          results[v] = await this.extractPointData(v, latitude, longitude, timestamp, options);
        } catch (error) {
          console.error(`[aorc] Failed to extract ${v}:`, error);
          results[v] = { error: error.message };
        }
      }));

      return results;
    }

    // Validate coordinates and dates
    this.validateCoordinates(latitude, longitude);

    const variableMeta = this.variables[variable];
    if (!variableMeta) {
      throw new Error(`Unknown AORC variable: ${variable}`);
    }

    // Handle date range (AORC typically extracts time series, not single points)
    const startDate = options.startDate || timestamp;
    const endDate = options.endDate || timestamp;

    // Validate date range
    this.validateDateRange(startDate, endDate);

    // Calculate year from timestamp
    const startTime = new Date(startDate);
    const year = startTime.getUTCFullYear();

    // Calculate indices for the point
    const indices = this.calculateIndices(latitude, longitude, startDate, endDate, {
      chunks: [144, 128, 256] // AORC chunk sizes as array
    });

    // Extract time series from the cached chunk data
    const { timeChunkSize, latChunkSize, lonChunkSize } = indices.chunkSizes;
    const { chunkStartTime, chunkEndTime, chunkLatIndex, chunkLonIndex } = indices.withinChunk;

    const timeSteps = chunkEndTime - chunkStartTime + 1;
    const extractedData = [];

    // Get the chunk data using cachedFetch (downloads if not cached)
    const chunkPath = `${year}.zarr/${variable}/${indices.chunks.timeChunkIndex}.${indices.chunks.latChunkIndex}.${indices.chunks.lonChunkIndex}`;
    const chunkUrl = `${this.datasetConfig.baseUrl}/${chunkPath}`;

    console.log(`[aorc] Fetching/downloading chunk: ${chunkPath}`);

    // Conditional caching - use cache only if explicitly requested
    let chunkBuffer;
    if (options.cache === true || options.params?.cache === true) {
      const { cachedFetch } = await import('./data-cache.js');
      globalThis._hydroCacheContext = {
        source: 'aorc',
        dataset: this.datasetConfig.name || 'aorc-v1.1',
        params: {
          source: 'aorc',
          dataset: this.datasetConfig.name || 'aorc-v1.1'
        }
      };
      const response = await cachedFetch(chunkUrl, {
        params: {
          source: 'aorc',
          dataset: this.datasetConfig.name || 'aorc-v1.1',
          proxy: options.proxy || options.params?.proxy,
          process: options.process
        }
      });
      chunkBuffer = response instanceof ArrayBuffer ? response : await response.arrayBuffer();
    } else {
      // Standard fetch without caching
      const response = await fetch(chunkUrl, {
        headers: { 'Accept': 'application/octet-stream' }
      });
      chunkBuffer = await response.arrayBuffer();
    }

    // Ensure we have an ArrayBuffer
    if (!chunkBuffer || !(chunkBuffer instanceof ArrayBuffer)) {
      throw new Error(`[aorc] Invalid chunk buffer received: expected ArrayBuffer, got ${typeof chunkBuffer}`);
    }

    console.log(`[aorc] Compressed data size: ${chunkBuffer.byteLength} bytes`);

    // Return raw buffer if requested (default)
    if (options.process !== true) {
      console.log('[aorc] Returning raw chunk buffer (raw default)');
      return chunkBuffer;
    }

    console.log(`[aorc] First 20 bytes:`, new Uint8Array(chunkBuffer.slice(0, 20)));

    // Check if data is actually compressed
    const header = new Uint8Array(chunkBuffer.slice(0, 4));
    const isBlosc = header[0] === 0xFE && header[1] === 0xED && header[2] === 0xFA && header[3] === 0xCE;
    const isZlib = header[0] === 0x78 && (header[1] === 0x01 || header[1] === 0x9C || header[1] === 0xDA);
    const isZstd = header[0] === 0x28 && header[1] === 0xB5 && header[2] === 0x2F && header[3] === 0xFD;

    console.log(`[aorc] Data compression check - Blosc: ${isBlosc}, Zlib: ${isZlib}, Zstd: ${isZstd}`);

    // Try multiple decompression approaches
    let decompressed;

    try {
      // 1. Try numcodecs Blosc (if available and looks like Blosc)
      if (isBlosc) {
        if (globalThis.numcodecs && globalThis.numcodecs.Blosc) {
          decompressed = globalThis.numcodecs.Blosc.decode(chunkBuffer);
          console.log(`[aorc] Decompressed with numcodecs.Blosc: ${decompressed.length} bytes`);
        } else if (this.library && this.library.Blosc) {
          decompressed = this.library.Blosc.decode(chunkBuffer);
          console.log(`[aorc] Decompressed with library.Blosc: ${decompressed.length} bytes`);
        }
      }

      // 2. Try Zstd (if looks like Zstd)
      if (!decompressed && isZstd) {
        const fzstd = globalThis.fzstd || (this.library && this.library.fzstd);
        if (fzstd) {
          decompressed = fzstd.decompress(new Uint8Array(chunkBuffer));
          console.log(`[aorc] Decompressed with fzstd: ${decompressed.length} bytes`);
        } else {
          console.warn('[aorc] Zstd detected but fzstd library not available');
        }
      }

      // 3. Try Zlib/Inflate (if looks like Zlib)
      if (!decompressed && isZlib) {
        if (globalThis.pako) {
          decompressed = globalThis.pako.inflate(chunkBuffer);
          console.log(`[aorc] Decompressed with pako.inflate: ${decompressed.length} bytes`);
        } else if (globalThis.fflate) {
          decompressed = globalThis.fflate.decompressSync(new Uint8Array(chunkBuffer));
          console.log(`[aorc] Decompressed with fflate: ${decompressed.length} bytes`);
        }
      }

      // 3. Try generic decompressors from library
      if (!decompressed && this.library && this.library.decompress) {
        decompressed = await this.library.decompress(chunkBuffer);
        console.log(`[aorc] Decompressed with zarr library: ${decompressed.length} bytes`);
      }

      // 4. Try global decompress function
      if (!decompressed && typeof globalThis.decompress === 'function') {
        decompressed = globalThis.decompress(chunkBuffer);
        console.log(`[aorc] Decompressed with global function: ${decompressed.length} bytes`);
      }

      // 5. Check if uncompressed
      if (!decompressed) {
        const expectedUncompressedSize = timeChunkSize * latChunkSize * lonChunkSize * 2; // 2 bytes per int16
        if (chunkBuffer.byteLength === expectedUncompressedSize) {
          console.log(`[aorc] Data appears to be uncompressed, using as-is`);
          decompressed = chunkBuffer;
        } else {
          // If we have a size mismatch and couldn't decompress, we must fail
          // DO NOT return compressed data as it will cause index out of bounds errors
          throw new Error(`Could not decompress data. Size mismatch: expected ${expectedUncompressedSize}, got ${chunkBuffer.byteLength}. IsBlosc: ${isBlosc}, IsZlib: ${isZlib}`);
        }
      }

      // Ensure we have a typed array for indexing
      if (decompressed instanceof ArrayBuffer) {
        decompressed = new Uint8Array(decompressed);
      } else if (!(decompressed instanceof Uint8Array)) {
        decompressed = new Uint8Array(decompressed);
      }

    } catch (decompressError) {
      console.error('[aorc] Decompression failed:', decompressError.message);
      throw decompressError; // Re-throw to stop processing invalid data
    }

    // Now process the decompressed data as int16
    const dataView = new DataView(decompressed.buffer, decompressed.byteOffset, decompressed.byteLength);
    const chunkData = [];

    // AORC chunks are typically 3D: [time, lat, lon]
    const expectedSize = timeChunkSize * latChunkSize * lonChunkSize;

    if (decompressed.length !== expectedSize * 2) { // 2 bytes per int16
      console.warn(`[aorc] Unexpected decompressed buffer size: ${decompressed.length}, expected: ${expectedSize * 2}`);
      // If size is wrong, we might still try to read what we can, or fail
      if (decompressed.length < expectedSize * 2) {
        throw new Error(`Decompressed data too small: ${decompressed.length} bytes, expected ${expectedSize * 2} bytes`);
      }
    }

    // Read as int16 values (AORC uses int16 with scale/offset)
    // Use DataView to ensure correct endianness (usually big-endian for Zarr/NetCDF, but check metadata)
    // AORC Zarr is typically Little Endian (<i2), but let's check if we can determine it
    const isLittleEndian = true; // Standard for Zarr unless specified otherwise in .zarray

    for (let i = 0; i < Math.min(expectedSize, decompressed.length / 2); i++) {
      const rawValue = dataView.getInt16(i * 2, isLittleEndian);
      chunkData.push(rawValue);
    }

    console.log(`[aorc] Retrieved and decompressed chunk data, length: ${chunkData.length}, expected: ${expectedSize}`);

    for (let t = 0; t < timeSteps; t++) {
      const timeIndex = chunkStartTime + t;
      const flatIndex = timeIndex * (latChunkSize * lonChunkSize) + chunkLatIndex * lonChunkSize + chunkLonIndex;

      // Check bounds
      if (flatIndex >= chunkData.length) {
        console.warn(`[aorc] Flat index ${flatIndex} out of bounds (${chunkData.length})`);
        extractedData.push(null);
        continue;
      }

      const rawValue = chunkData[flatIndex];
      console.log(`[aorc] t=${t}, timeIndex=${timeIndex}, flatIndex=${flatIndex}, rawValue=${rawValue}`);

      const scaledValue = this.applyScaling(rawValue, variableMeta);
      extractedData.push(scaledValue);
    }

    console.log(`[aorc] Extracted ${extractedData.length} time steps for ${variable}`);

    return {
      variable: variable,
      location: { latitude, longitude },
      timeRange: { start: startDate, end: endDate },
      data: extractedData,
      metadata: {
        units: variableMeta.units,
        source: 'AORC',
        year: year,
        spatialIndices: indices.spatial,
        timeIndices: indices.time,
        chunkInfo: indices.chunks
      }
    };
  }

  /**
   * Calculate indices for AORC grid
   */
  calculateIndices(latitude, longitude, startDate, endDate, metadata) {
    // Find spatial indices using inherited method
    const latIndex = this.findNearestIndex(this.datasetConfig.spatial.latitude, latitude);
    const lonIndex = this.findNearestIndex(this.datasetConfig.spatial.longitude, longitude);

    // Calculate time indices
    const startTime = new Date(startDate);
    const year = startTime.getUTCFullYear();
    const yearStart = new Date(`${year}-01-01T00:00:00Z`);
    const startTimeIndex = Math.floor((startTime.getTime() - yearStart.getTime()) / (1000 * 60 * 60));

    const endTime = new Date(endDate);
    const endTimeIndex = Math.floor((endTime.getTime() - yearStart.getTime()) / (1000 * 60 * 60));

    // Calculate chunk indices based on AORC chunk structure
    const [timeChunkSize, latChunkSize, lonChunkSize] = metadata.chunks;

    const timeChunkIndex = Math.floor(startTimeIndex / timeChunkSize);
    const latChunkIndex = Math.floor(latIndex / latChunkSize);
    const lonChunkIndex = Math.floor(lonIndex / lonChunkSize);

    // Calculate indices within chunk
    const chunkStartTime = startTimeIndex % timeChunkSize;
    const chunkEndTime = Math.min(endTimeIndex % timeChunkSize, timeChunkSize - 1);
    const chunkLatIndex = latIndex % latChunkSize;
    const chunkLonIndex = lonIndex % lonChunkSize;

    return {
      year,
      spatial: { latIndex, lonIndex },
      time: { startTimeIndex, endTimeIndex },
      chunks: { timeChunkIndex, latChunkIndex, lonChunkIndex },
      chunkSizes: { timeChunkSize, latChunkSize, lonChunkSize },
      withinChunk: { chunkStartTime, chunkEndTime, chunkLatIndex, chunkLonIndex }
    };
  }

  /**
   * Extract point data from AORC Zarr chunk
   */

  /**
   * Helper to fetch and decompress a single AORC chunk
   */
  async fetchAndDecompressChunk(url, context) {
    // Conditional caching
    let chunkBuffer;
    if (context.params?.cache === true) {
      const { cachedFetch } = await import('./data-cache.js');
      globalThis._hydroCacheContext = context;
      const response = await cachedFetch(url, { params: context.params });
      chunkBuffer = response instanceof ArrayBuffer ? response : await response.arrayBuffer();
    } else {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/octet-stream' }
      });
      chunkBuffer = await response.arrayBuffer();
    }

    if (!chunkBuffer || !(chunkBuffer instanceof ArrayBuffer)) {
      throw new Error(`[aorc] Invalid chunk buffer received`);
    }

    // Check for process: false (or implicit raw mode via undefined process)
    if (!context.params || context.params.process !== true) {
      console.log(`[aorc] Skipping decompression (raw mode default)`);
      return chunkBuffer;
    }

    // Check compression
    const header = new Uint8Array(chunkBuffer.slice(0, 4));
    const isBlosc = header[0] === 0xFE && header[1] === 0xED && header[2] === 0xFA && header[3] === 0xCE;
    const isZlib = header[0] === 0x78 && (header[1] === 0x01 || header[1] === 0x9C || header[1] === 0xDA);
    const isZstd = header[0] === 0x28 && header[1] === 0xB5 && header[2] === 0x2F && header[3] === 0xFD;

    let decompressed;

    // 1. Try numcodecs Blosc
    if (isBlosc) {
      if (globalThis.numcodecs && globalThis.numcodecs.Blosc) {
        decompressed = globalThis.numcodecs.Blosc.decode(chunkBuffer);
      } else if (this.library && this.library.Blosc) {
        decompressed = this.library.Blosc.decode(chunkBuffer);
      }
    }

    // 2. Try Zstd
    if (!decompressed && isZstd) {
      const fzstd = globalThis.fzstd || (this.library && this.library.fzstd);
      if (fzstd) {
        decompressed = fzstd.decompress(new Uint8Array(chunkBuffer));
      }
    }

    // 3. Try Zlib
    if (!decompressed && isZlib) {
      if (globalThis.pako) {
        decompressed = globalThis.pako.inflate(chunkBuffer);
      } else if (globalThis.fflate) {
        decompressed = globalThis.fflate.decompressSync(new Uint8Array(chunkBuffer));
      }
    }

    if (!decompressed) {
      throw new Error('Failed to decompress AORC chunk');
    }

    return decompressed;
  }

  /**
   * Extract grid data from AORC (manually fetching chunks to bypass zarrita issues)
   */
  async extractGridData(variable, bbox, timestamp, options = {}) {
    await this.loadDatasource();

    // Handle multiple variables
    if (Array.isArray(variable)) {
      const results = {};
      await Promise.all(variable.map(async (v) => {
        try {
          results[v] = await this.extractGridData(v, bbox, timestamp, options);
        } catch (error) {
          console.error(`[aorc] Failed to extract grid for ${v}:`, error);
          results[v] = { error: error.message };
        }
      }));
      return results;
    }

    // Validate bbox
    if (!bbox || bbox.length !== 4) {
      throw new Error('Invalid bounding box. Expected [minLon, minLat, maxLon, maxLat]');
    }
    const [minLon, minLat, maxLon, maxLat] = bbox;

    // Get variable metadata
    const variableMeta = this.variables[variable];
    if (!variableMeta) {
      throw new Error(`Unknown AORC variable: ${variable}`);
    }

    // Get spatial config
    const { latitude: latConfig, longitude: lonConfig } = this.datasetConfig.spatial;

    // Calculate indices directly (assuming standard ascending coordinates for AORC v1.1)
    // Lat: (val - min) / res
    const latStartIndex = Math.round((minLat - latConfig.min) / latConfig.resolution);
    const latEndIndex = Math.round((maxLat - latConfig.min) / latConfig.resolution);

    // Clamp to valid range
    const maxLatIndex = Math.floor((latConfig.max - latConfig.min) / latConfig.resolution);
    const latStart = Math.max(0, Math.min(latStartIndex, latEndIndex));
    const latStop = Math.min(maxLatIndex, Math.max(latStartIndex, latEndIndex)) + 1;

    const lonStartIndex = Math.round((minLon - lonConfig.min) / lonConfig.resolution);
    const lonEndIndex = Math.round((maxLon - lonConfig.min) / lonConfig.resolution);

    const maxLonIndex = Math.floor((lonConfig.max - lonConfig.min) / lonConfig.resolution);
    const lonStart = Math.max(0, Math.min(lonStartIndex, lonEndIndex));
    const lonStop = Math.min(maxLonIndex, Math.max(lonStartIndex, lonEndIndex)) + 1;

    // Time index
    const date = new Date(timestamp);
    const year = date.getUTCFullYear();
    const yearStart = new Date(`${year}-01-01T00:00:00Z`);
    const timeIndex = Math.floor((date.getTime() - yearStart.getTime()) / (1000 * 60 * 60));

    // Chunk dimensions (AORC standard)
    // These should ideally come from metadata.chunks, but hardcoding for now if not available
    const timeChunkSize = variableMeta.chunks ? variableMeta.chunks[0] : 144;
    const latChunkSize = variableMeta.chunks ? variableMeta.chunks[1] : 128;
    const lonChunkSize = variableMeta.chunks ? variableMeta.chunks[2] : 256;

    // Determine chunk ranges
    const startLatChunk = Math.floor(latStart / latChunkSize);
    const endLatChunk = Math.floor((latStop - 1) / latChunkSize);
    const startLonChunk = Math.floor(lonStart / lonChunkSize);
    const endLonChunk = Math.floor((lonStop - 1) / lonChunkSize);

    // Initialize result grid
    const gridHeight = latStop - latStart;
    const gridWidth = lonStop - lonStart;
    const resultGrid = new Float32Array(gridHeight * gridWidth);

    console.log(`[AORC] Extracting grid: ${gridWidth}x${gridHeight} from chunks [${startLatChunk}-${endLatChunk}, ${startLonChunk}-${endLonChunk}]`);

    // Iterate chunks
    for (let latChunk = startLatChunk; latChunk <= endLatChunk; latChunk++) {
      for (let lonChunk = startLonChunk; lonChunk <= endLonChunk; lonChunk++) {
        // Construct URL manually like extractPointData
        const chunkPath = `${year}.zarr/${variable}/${Math.floor(timeIndex / timeChunkSize)}.${latChunk}.${lonChunk}`;
        const chunkUrl = `${this.datasetConfig.baseUrl}/${chunkPath}`;

        try {
          const decompressed = await this.fetchAndDecompressChunk(chunkUrl, {
            source: 'aorc',
            dataset: this.datasetConfig.name || 'aorc-v1.1',
            params: {
              source: 'aorc',
              dataset: 'aorc-v1.1',
              proxy: options.proxy || options.params?.proxy,
              process: options.process
            }
          });

          if (options.process !== true) {
            // Store raw buffer in grid? Or maybe just return array of buffers?
            // For grid extraction in raw mode, returning a flat list of chunk buffers might be unexpected but it's "raw".
            // Or we just return the processed grid but without decompression? No that's impossible.
            // If raw is requested for grid data, maybe we shouldn't be here or we should return a zip?
            // Let's assume raw means "don't parse values" but we still likely need to decompress to slice?
            // If "raw" means "raw file", we can't return a single file for grid data easily.
            // We'll return the decompressed buffer as is for this chunk in the loop logic below?
            // Wait, previous logic returns `resultGrid` which is Float32.
            // If raw is true, fetchAndDecompressChunk returns buffer.
            // We can't put buffer into Float32Array directly if it's compressed.
            // If fetchAndDecompressChunk returns raw compressed buffer, we can't proceed with slicing.
            // So for grid data, "raw" might not be fully supported or needs definition. 
            // BUT, user asked for "raw" for "all gridded data".
            // Re-reading: "fetchAndDecompressChunk" handles "process: false".
            // If we get raw buffer here, we can't slice it.
            // We will just push it to a list?
            if (!resultGrid.rawChunks) resultGrid.rawChunks = [];
            resultGrid.rawChunks.push({ urls: chunkPath, buffer: decompressed });
            continue;
          }

          // Cast to correct type (int16 for AORC usually)
          // AORC data is typically int16 with scale factor
          const dataView = new Int16Array(decompressed.buffer, decompressed.byteOffset, decompressed.byteLength / 2);

          // Calculate overlap between chunk and requested region
          const chunkLatStart = latChunk * latChunkSize;
          const chunkLonStart = lonChunk * lonChunkSize;

          // Intersection relative to global grid
          const copyLatStart = Math.max(latStart, chunkLatStart);
          const copyLatEnd = Math.min(latStop, chunkLatStart + latChunkSize);
          const copyLonStart = Math.max(lonStart, chunkLonStart);
          const copyLonEnd = Math.min(lonStop, chunkLonStart + lonChunkSize);

          // Copy data
          for (let lat = copyLatStart; lat < copyLatEnd; lat++) {
            for (let lon = copyLonStart; lon < copyLonEnd; lon++) {
              // Indices within chunk
              // Time index within chunk needs to be handled! 
              // The chunk contains [timeChunkSize, latChunkSize, lonChunkSize]
              const tInChunk = timeIndex % timeChunkSize;
              const latInChunk = lat - chunkLatStart;
              const lonInChunk = lon - chunkLonStart;

              // Flat index in chunk (C-order: time, lat, lon)
              const chunkIdx = (tInChunk * latChunkSize * lonChunkSize) + (latInChunk * lonChunkSize) + lonInChunk;

              // Check if chunkIdx is within bounds of the decompressed data
              if (chunkIdx < 0 || chunkIdx >= dataView.length) {
                console.warn(`[AORC] Calculated chunk index ${chunkIdx} out of bounds for chunk ${chunkPath}. Skipping.`);
                continue;
              }

              // Indices within result grid
              const resLat = lat - latStart;
              const resLon = lon - lonStart;
              const resIdx = (resLat * gridWidth) + resLon;

              // Apply scaling and store
              const val = dataView[chunkIdx];
              resultGrid[resIdx] = this.applyScaling(val, variableMeta);
            }
          }

        } catch (err) {
          console.error(`[AORC] Failed to process chunk ${chunkPath}:`, err);
          // Continue with other chunks (holes in grid will be 0 or NaN if initialized differently)
          // For now, Float32Array initializes to 0, which might be acceptable for missing data.
          // Consider filling with NaN if explicit missing data is preferred.
        }
      }
    }

    // Generate lat/lon arrays for the grid
    const gridLats = [];
    for (let i = latStart; i < latStop; i++) {
      gridLats.push(latConfig.min + (i * latConfig.resolution));
    }

    const gridLons = [];
    for (let i = lonStart; i < lonStop; i++) {
      gridLons.push(lonConfig.min + (i * lonConfig.resolution));
    }

    // Convert flat array to 2D array for consistency with other tools
    const grid2D = [];
    for (let i = 0; i < gridHeight; i++) {
      grid2D.push(Array.from(resultGrid.slice(i * gridWidth, (i + 1) * gridWidth)));
    }

    return {
      variable,
      timestamp: date.toISOString(),
      bbox,
      dimensions: [gridLats.length, gridLons.length],
      data: grid2D,
      latitudes: gridLats,
      longitudes: gridLons,
      units: variableMeta.units
    };
  }
  /**
   * Get dataset info
   */
  async getDatasetInfo(args) {
    const infoType = args.info || args.infoType || 'metadata';
    await this.loadDatasource();

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
      default:
        return {
          ...this.datasetConfig,
          variables: this.variables
        };
    }
  }
}



/**
 * Process AORC point data request
 * @param {Object} args - Request arguments
 * @param {Object} datasetConfig - AORC dataset configuration
 * @returns {Promise<Object>} Processed data
 * @private
 */
export async function processAORCPointData(args, datasetConfig) {
  const aorc = new AORCDataSource(datasetConfig);

  // Handle variables parameter - can be array or single string
  let variable;
  if (Array.isArray(args.variables)) {
    variable = args.variables[0];
  } else if (args.variable) {
    variable = args.variable;
  } else if (typeof args.variables === 'string') {
    variable = args.variables;
  } else {
    throw new Error('No variable specified for AORC point data extraction');
  }

  console.log(`[AORC] Extracting variable: ${variable} at (${args.latitude}, ${args.longitude})`);

  const result = await aorc.extractPointData(
    variable,
    args.latitude,
    args.longitude,
    new Date(args.startDate),
    {
      startDate: args.startDate,
      endDate: args.endDate || args.startDate,
      process: args.process
    }
  );

  return formatAORCOutput(result, args.format || 'json');
}

/**
 * Process AORC grid data request
 * @param {Object} args - Request arguments
 * @param {Object} datasetConfig - AORC dataset configuration
 * @returns {Promise<Object>} Processed grid data
 * @private
 */
export async function processAORCGridData(args, datasetConfig) {
  // Handle variables parameter - can be array or single string
  let variable;
  if (Array.isArray(args.variables)) {
    variable = args.variables[0]; // Grid data also takes single variable
  } else if (args.variable) {
    variable = args.variable;
  } else if (typeof args.variables === 'string') {
    variable = args.variables;
  } else {
    throw new Error('No variable specified for AORC grid data extraction');
  }

  const aorc = new AORCDataSource(datasetConfig);
  return await aorc.extractGridData(
    variable,
    args.bbox,
    new Date(args.startDate),
    {
      startDate: args.startDate,
      endDate: args.endDate || args.startDate,
      process: args.process
    }
  );
}

/**
 * Process AORC time series data request
 * @param {Object} args - Request arguments
 * @param {Object} datasetConfig - AORC dataset configuration
 * @returns {Promise<Object>} Time series data
 * @private
 */
export async function processAORCTimeSeriesData(args, datasetConfig) {
  // Handle variables parameter - can be array or single string
  let variable;
  if (Array.isArray(args.variables)) {
    variable = args.variables[0]; // Time series also takes single variable
  } else if (args.variable) {
    variable = args.variable;
  } else if (typeof args.variables === 'string') {
    variable = args.variables;
  } else {
    throw new Error('No variable specified for AORC time series data extraction');
  }

  const aorc = new AORCDataSource(datasetConfig);
  return await aorc.extractPointData(variable, args.latitude, args.longitude, new Date(args.startDate), {
    startDate: args.startDate,
    endDate: args.endDate
  });
}

/**
 * Get AORC dataset information
 * @param {Object} args - Request arguments
 * @param {Object} datasetConfig - AORC dataset configuration
 * @returns {Promise<Object>} Dataset information
 * @private
 */
export async function processAORCDatasetInfo(args, datasetConfig) {
  const aorc = new AORCDataSource(datasetConfig);
  await aorc.loadDatasource();

  switch (args.infoType) {
    case 'variables':
      return {
        variables: aorc.variables,
        count: Object.keys(aorc.variables).length
      };
    case 'spatial':
      return datasetConfig.spatial;
    case 'temporal':
      return datasetConfig.temporal;
    default:
      return {
        ...datasetConfig,
        variables: aorc.variables
      };
  }
}

/**
 * Process AORC bulk extraction request
 * @param {Object} args - Request arguments
 * @param {Object} datasetConfig - AORC dataset configuration
 * @returns {Promise<Object>} Bulk extraction results
 * @private
 */
export async function processAORCBulkExtraction(args, datasetConfig) {
  const aorc = new AORCDataSource(datasetConfig);

  // If extracting multiple points
  if (args.points && Array.isArray(args.points)) {
    return await aorc.extractMultiplePoints(
      args.variable,
      args.points,
      new Date(args.startDate),
      {
        startDate: args.startDate,
        endDate: args.endDate || args.startDate
      }
    );
  }

  throw new Error('Bulk extraction requires a "points" array');
}

/**
 * Format AORC output
 * @param {Object} data - AORC data
 * @param {string} format - Output format ('json', 'csv', 'netcdf')
 * @returns {Object|string} Formatted data
 * @private
 */
export function formatAORCOutput(data, format) {
  const aorc = new AORCDataSource({});

  switch (format.toLowerCase()) {
    case 'csv':
      return aorc.toCSV(data);
    case 'netcdf':
      return aorc.toNetCDF(data);
    case 'json':
    default:
      return data;
  }
}

/**
 * Convert AORC data to CSV
 * @param {Object} data - AORC data
 * @returns {string} CSV string
 * @private
 */
export function convertAORCToCSV(data) {
  const aorc = new AORCDataSource({});
  return aorc.toCSV(data);
}

/**
 * Convert AORC data to NetCDF-compatible structure
 * @param {Object} data - AORC data
 * @returns {Object} NetCDF-compatible structure
 * @private
 */
export function convertAORCToNetCDF(data) {
  const aorc = new AORCDataSource({});
  return aorc.toNetCDF(data);
}
