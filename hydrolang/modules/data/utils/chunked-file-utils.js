/**
 * Chunked File Processing Utilities
 * Minimal utilities for processing already-downloaded scientific data files
 * Contains only functions actually used in the codebase
 */

/**
 * Generate cache key for processed data results
 */
function generateProcessedDataKey(fileBufferOrUrl, format, params) {
  const url = typeof fileBufferOrUrl === 'string' ? fileBufferOrUrl : 'buffer';
  const paramStr = JSON.stringify(params);
  let hash = 0;

  const combined = `${url}-${format}-${paramStr}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `processed-${format}-${Math.abs(hash)}`;
}

/**
 * Process a file buffer in chunks - used internally by readGRIB2Chunked
 */
async function processFileInChunks(fileBuffer, options = {}) {
  const {
    chunkSize = 10 * 1024 * 1024,
    processChunk,
    onProgress,
    onChunkComplete
  } = options;

  if (!processChunk) {
    throw new Error('processChunk function is required');
  }

  const totalSize = fileBuffer.byteLength;
  const totalChunks = Math.ceil(totalSize / chunkSize);
  const results = [];
  let processedChunks = 0;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalSize);
    const chunkData = fileBuffer.slice(start, end);

    const result = await processChunk(chunkData, {
      chunkIndex: i,
      totalChunks,
      start,
      end,
      chunkSize: end - start
    });

    results.push(result);
    processedChunks++;

    if (onProgress) {
      onProgress({
        processedChunks,
        totalChunks,
        progress: (processedChunks / totalChunks) * 100
      });
    }

    if (onChunkComplete) {
      await onChunkComplete(result, {
        chunkIndex: i,
        totalChunks,
        start,
        end
      });
    }
  }

  return { results, totalChunks, totalSize };
}

/**
 * Memory-efficient chunked NetCDF reader for NLDAS data
 * @param {ArrayBuffer|string} fileBufferOrUrl - NetCDF file buffer or URL (will use cached data if available)
 * @param {Object} options - Reading options
 * @returns {Promise<Object>} Parsed data
 */
export async function readNetCDFChunked(fileBufferOrUrl, options = {}) {
  const {
    variables = [],
    bbox,
    timeRange,
    chunkSize = 5 * 1024 * 1024,
    onProgress,
    source = 'netcdf',
    dataset = 'unknown'
  } = options;

  try {
    // Import cache utilities
    const { cache } = await import('./data-cache.js');

    // Generate cache key for processed results
    const cacheKey = generateProcessedDataKey(fileBufferOrUrl, 'netcdf', { variables, bbox, timeRange });

    // Check if processed data is already cached
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        console.log(`Using cached processed NetCDF data: ${cacheKey}`);
        return JSON.parse(new TextDecoder().decode(cached.data));
      }
    } catch (cacheError) {
      console.warn('Cache read failed:', cacheError.message);
    }

    // Get the file buffer - either directly provided or from cache
    let fileBuffer;
    if (typeof fileBufferOrUrl === 'string') {
      // It's a URL - get from cache
      const cachedFile = await cache.get(cache.generateCacheKey(fileBufferOrUrl, { source, dataset }));
      if (!cachedFile) {
        throw new Error(`File not found in cache: ${fileBufferOrUrl}`);
      }
      fileBuffer = cachedFile.data;
    } else {
      // It's a direct buffer
      fileBuffer = fileBufferOrUrl;
    }
    // Load NetCDF library
    const { loadGridDataLibrary } = await import('./gridded-data-utils.js');
    const netcdfLib = await loadGridDataLibrary('netcdf');

    // If process is explicitly false, return raw buffer
    if (options.process === false) {
      console.log(`[NetCDF] Skipping parsing (process: false)`);
      return fileBuffer;
    }

    // First, read just the header in small chunks to get metadata
    const headerSize = Math.min(1024 * 1024, fileBuffer.byteLength);
    const headerBuffer = fileBuffer.slice(0, headerSize);

    if (onProgress) onProgress({ stage: 'header', progress: 10 });

    // Parse NetCDF header
    const netcdfData = await netcdfLib.loadFile(headerBuffer);

    // Get variable metadata
    const variableData = {};
    for (const varName of variables) {
      const varInfo = netcdfLib.getVariable(netcdfData, varName);
      if (varInfo) {
        variableData[varName] = {
          dimensions: varInfo.dimensions,
          type: varInfo.type,
          attributes: varInfo.attributes
        };
      }
    }

    if (onProgress) onProgress({ stage: 'metadata', progress: 30 });

    // Process data in chunks based on spatial/temporal filters
    const results = await processFileInChunks(fileBuffer, {
      chunkSize,
      processChunk: async (chunkBuffer, chunkInfo) => {
        // Extract data for requested variables from this chunk
        const chunkResults = {};
        for (const varName of variables) {
          if (netcdfLib.canParseChunk(chunkBuffer, varName)) {
            const data = await netcdfLib.extractVariableData(chunkBuffer, varName, {
              bbox,
              timeRange
            });
            if (data) {
              chunkResults[varName] = data;
            }
          }
        }
        return chunkResults;
      },
      onProgress: (progress) => {
        if (onProgress) {
          onProgress({
            stage: 'processing',
            progress: 30 + (progress.progress * 0.7)
          });
        }
      }
    });

    // Combine results from all chunks
    const combinedResults = {};
    for (const varName of variables) {
      combinedResults[varName] = {
        metadata: variableData[varName],
        data: []
      };
    }

    for (const chunkResult of results.results) {
      for (const varName of variables) {
        if (chunkResult[varName]) {
          combinedResults[varName].data.push(...chunkResult[varName]);
        }
      }
    }

    if (onProgress) onProgress({ stage: 'complete', progress: 100 });

    const result = {
      variables: combinedResults,
      metadata: {
        totalSize: fileBuffer.byteLength,
        processedChunks: results.totalChunks,
        bbox,
        timeRange
      }
    };

    // Cache the processed results
    try {
      const resultJson = JSON.stringify(result);
      await cache.put(cacheKey, new TextEncoder().encode(resultJson), {
        source,
        dataset,
        format: 'processed-netcdf',
        processed: true,
        variables: variables.join(','),
        bbox,
        timeRange
      });
      console.log(`Cached processed NetCDF data: ${cacheKey}`);
    } catch (cacheError) {
      console.warn('Failed to cache processed results:', cacheError.message);
    }

    return result;

  } catch (error) {
    console.error('Failed to read NetCDF file in chunks:', error);
    throw error;
  }
}

/**
 * Memory-efficient chunked GRIB2 reader for MRMS data
 * @param {ArrayBuffer|string} fileBufferOrUrl - GRIB2 file buffer or URL (will use cached data if available)
 * @param {Object} options - Reading options
 * @returns {Promise<Object>} Parsed data
 */
export async function readGRIB2Chunked(fileBufferOrUrl, options = {}) {
  const {
    bbox,
    timeRange,
    variables = [],
    chunkSize = 10 * 1024 * 1024,
    onProgress,
    source = 'grib2',
    dataset = 'unknown'
  } = options;

  try {
    // Import cache utilities
    const { cache } = await import('./data-cache.js');

    // Generate cache key for processed results
    const cacheKey = generateProcessedDataKey(fileBufferOrUrl, 'grib2', { variables, bbox, timeRange });

    // Check if processed data is already cached
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        console.log(`Using cached processed GRIB2 data: ${cacheKey}`);
        return JSON.parse(new TextDecoder().decode(cached.data));
      }
    } catch (cacheError) {
      console.warn('Cache read failed:', cacheError.message);
    }

    // Get the file buffer - either directly provided or from cache
    let fileBuffer;
    if (typeof fileBufferOrUrl === 'string') {
      // It's a URL - get from cache
      const cachedFile = await cache.get(cache.generateCacheKey(fileBufferOrUrl, { source, dataset }));
      if (!cachedFile) {
        throw new Error(`File not found in cache: ${fileBufferOrUrl}`);
      }
      fileBuffer = cachedFile.data;
    } else {
      // It's a direct buffer
      fileBuffer = fileBufferOrUrl;
    }
    // Load GRIB2 library
    const { loadGridDataLibrary } = await import('./gridded-data-utils.js');
    const grib2Lib = await loadGridDataLibrary('grib2');

    // If process is explicitly false, return raw buffer
    if (options.process === false) {
      console.log(`[GRIB2] Skipping parsing (process: false)`);
      return fileBuffer;
    }

    if (onProgress) onProgress({ stage: 'loading', progress: 10 });

    // Process file in chunks to find messages
    const results = await processFileInChunks(fileBuffer, {
      chunkSize,
      processChunk: async (chunkBuffer, chunkInfo) => {
        // Look for GRIB2 messages in this chunk
        const messages = grib2Lib.findMessages(chunkBuffer);

        const chunkResults = [];
        for (const message of messages) {
          // Check if message matches our filters
          if (grib2Lib.messageMatchesFilters(message, { bbox, timeRange, variables })) {
            const data = await grib2Lib.extractMessageData(chunkBuffer, message);
            chunkResults.push({
              message,
              data,
              chunkInfo
            });
          }
        }

        return chunkResults;
      },
      onProgress: (progress) => {
        if (onProgress) {
          onProgress({
            stage: 'processing',
            progress: 10 + (progress.progress * 0.9)
          });
        }
      }
    });

    // Combine all message data
    const allMessages = [];
    for (const chunkResult of results.results) {
      allMessages.push(...chunkResult);
    }

    if (onProgress) onProgress({ stage: 'complete', progress: 100 });

    const result = {
      messages: allMessages,
      metadata: {
        totalSize: fileBuffer.byteLength,
        processedChunks: results.totalChunks,
        messageCount: allMessages.length,
        bbox,
        timeRange,
        variables
      }
    };

    // Cache the processed results
    try {
      const resultJson = JSON.stringify(result);
      await cache.put(cacheKey, new TextEncoder().encode(resultJson), {
        source,
        dataset,
        format: 'processed-grib2',
        processed: true,
        variables: variables.join(','),
        bbox,
        timeRange
      });
      console.log(`Cached processed GRIB2 data: ${cacheKey}`);
    } catch (cacheError) {
      console.warn('Failed to cache processed results:', cacheError.message);
    }

    return result;

  } catch (error) {
    console.error('Failed to read GRIB2 file in chunks:', error);
    throw error;
  }
}