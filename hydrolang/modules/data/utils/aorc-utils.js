/**
 * AORC (NOAA Analysis of Record for Calibration) data utilities
 * Contains all AORC-specific data manipulation functions
 */

import { aggregateTime, expandSpatialBounds, loadSciDataLibrary } from './gridded-data-utils.js';

/**
 * Find the nearest index in a coordinate array
 */
export function findNearestIndex(coordSystem, targetValue) {
  const { min, resolution } = coordSystem;
  const index = Math.round((targetValue - min) / resolution);
  return Math.max(0, Math.min(index, Math.floor((coordSystem.max - min) / resolution)));
}

/**
 * Extract time series data from Zarr array
 */
export async function extractTimeSeries(zarrArray, latIndex, lonIndex, startDate, endDate) {
  try {
    // Calculate time indices
    const startTime = new Date(startDate);
    const endTime = new Date(endDate);
    const startTimeIndex = Math.floor((startTime.getTime() - new Date('1979-02-01T00:00:00Z').getTime()) / (1000 * 60 * 60));
    const endTimeIndex = Math.floor((endTime.getTime() - new Date('1979-02-01T00:00:00Z').getTime()) / (1000 * 60 * 60));

    // Extract data slice
    const slice = await zarrArray.get([
      createSlice(startTimeIndex, endTimeIndex + 1),
      latIndex,
      lonIndex
    ]);

    return Array.from(slice);

  } catch (error) {
    console.error('Failed to extract time series:', error);
    return [];
  }
}

/**
 * Extract grid data from Zarr array
 */
export async function extractGridData(zarrArray, timeStart, timeEnd, latStart, latEnd, lonStart, lonEnd) {
  try {
    // Extract 3D slice from Zarr array
    const slice = await zarrArray.get([
      createSlice(timeStart, timeEnd + 1),
      createSlice(latStart, latEnd + 1),
      createSlice(lonStart, lonEnd + 1)
    ]);

    // Convert to nested array structure [time][lat][lon]
    const timeSteps = timeEnd - timeStart + 1;
    const latSteps = latEnd - latStart + 1;
    const lonSteps = lonEnd - lonStart + 1;

    const result = [];
    for (let t = 0; t < timeSteps; t++) {
      const timeSlice = [];
      for (let lat = 0; lat < latSteps; lat++) {
        const latSlice = [];
        for (let lon = 0; lon < lonSteps; lon++) {
          const index = t * (latSteps * lonSteps) + lat * lonSteps + lon;
          latSlice.push(slice[index]);
        }
        timeSlice.push(latSlice);
      }
      result.push(timeSlice);
    }

    return result;

  } catch (error) {
    console.error('Failed to extract grid data:', error);
    return [];
  }
}

/**
 * Create a slice object for Zarr indexing
 */
export function createSlice(start, end) {
  return { start, end, step: 1 };
}

/**
 * Apply scaling to individual values
 */
export function applyScalingToValue(value, metadata) {
  if (value === null || value === undefined || value === metadata?.fillValue) {
    return '';
  }

  const scaleFactor = metadata?.scaleFactor || 1.0;
  return (value * scaleFactor).toFixed(6);
}

/**
 * Extract AORC variable data at a specific point using direct HTTP fetch
 */
export async function extractAORCVariableAtPoint(variable, latitude, longitude, startDate, endDate, datasetConfig) {
  console.log(`Extracting ${variable} at (${latitude}, ${longitude})`);

  try {
    // Get variable metadata
    const { default: aorcDatasource } = await import('../datasources/aorc.js');
    const variableMeta = aorcDatasource.variables[variable];

    if (!variableMeta) {
      throw new Error(`Unknown AORC variable: ${variable}`);
    }

    // Validate date range against dataset availability
    const startTime = new Date(startDate);
    const endTime = new Date(endDate);

    const datasetStart = new Date(datasetConfig.temporal.start);
    const datasetEnd = new Date(datasetConfig.temporal.end);

    if (startTime < datasetStart || endTime > datasetEnd) {
      throw new Error(`Requested date range (${startDate} to ${endDate}) is outside the available AORC dataset range (${datasetConfig.temporal.start} to ${datasetConfig.temporal.end}). The AORC dataset only covers data from 1979 to 2020.`);
    }

    // Load Zarr library for parsing
    const zarrLib = await loadSciDataLibrary('zarr');
    if (!zarrLib) {
      throw new Error('Zarr library not available for parsing');
    }

    // Determine the year for year-based organization
    const startYear = startTime.getUTCFullYear();
    const endYear = endTime.getUTCFullYear();
    const year = startYear;

    console.log(`Date parsing debug: startDate="${startDate}", endDate="${endDate}"`);
    console.log(`Parsed dates: startTime=${startTime.toISOString()}, endTime=${endTime.toISOString()}`);
    console.log(`Parsed years: startYear=${startYear}, endYear=${endYear}`);
    console.log(`Timezones: start=${startTime.getTimezoneOffset()}, end=${endTime.getTimezoneOffset()}`);

    // For now, let's allow multi-year but warn about it
    if (startYear !== endYear) {
      console.warn(`Multi-year span detected: ${startYear} vs ${endYear}. Using start year for data access.`);
      // For now, we'll use the start year and warn the user
      // TODO: Implement proper multi-year support
    }

    // Additional validation - ensure dates are reasonable
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error(`Invalid date format. Start: ${startDate}, End: ${endDate}`);
    }

    console.log(`Using year-based organization: ${year}.zarr`);

    // Fetch variable metadata from year-specific Zarr store
    const metadataUrl = `${datasetConfig.baseUrl}/${year}.zarr/${variable}/.zarray`;
    console.log(`Fetching metadata from: ${metadataUrl}`);
    const metadata = await fetchJSON(metadataUrl);
    console.log(`Metadata received:`, metadata);

    // Find the indices for the given latitude and longitude
    const latIndex = findNearestIndex(datasetConfig.spatial.latitude, latitude);
    const lonIndex = findNearestIndex(datasetConfig.spatial.longitude, longitude);

    console.log(`Spatial coordinates: lat=${latitude}, lon=${longitude}`);
    console.log(`Spatial system: lat=[${datasetConfig.spatial.latitude.min}, ${datasetConfig.spatial.latitude.max}], res=${datasetConfig.spatial.latitude.resolution}`);
    console.log(`Spatial system: lon=[${datasetConfig.spatial.longitude.min}, ${datasetConfig.spatial.longitude.max}], res=${datasetConfig.spatial.longitude.resolution}`);
    console.log(`Spatial indices: lat=${latIndex}, lon=${lonIndex}`);

    // Calculate time indices based on AORC temporal structure (relative to year start)
    const yearStart = new Date(`${year}-01-01T00:00:00Z`);
    const startTimeIndex = Math.floor((startTime.getTime() - yearStart.getTime()) / (1000 * 60 * 60));
    const endTimeIndex = Math.floor((endTime.getTime() - yearStart.getTime()) / (1000 * 60 * 60));

    console.log(`Time indices within year ${year}: start=${startTimeIndex}, end=${endTimeIndex}`);

    // Calculate chunk indices based on AORC chunk structure
    // chunks: [144, 128, 256] for [time, lat, lon]
    const timeChunkSize = metadata.chunks[0]; // 144
    const latChunkSize = metadata.chunks[1];   // 128
    const lonChunkSize = metadata.chunks[2];   // 256

    // Calculate which chunk contains our spatial point
    const latChunkIndex = Math.floor(latIndex / latChunkSize);
    const lonChunkIndex = Math.floor(lonIndex / lonChunkSize);

    // Calculate time chunk
    const timeChunkIndex = Math.floor(startTimeIndex / timeChunkSize);
    console.log(`Chunk indices: time=${timeChunkIndex}, lat=${latChunkIndex}, lon=${lonChunkIndex}`);

    // Calculate indices within the chunk
    const chunkStartTime = startTimeIndex % timeChunkSize;
    const chunkEndTime = Math.min(endTimeIndex % timeChunkSize, timeChunkSize - 1);

    // Calculate spatial indices within the chunk
    const chunkLatIndex = latIndex % latChunkSize;
    const chunkLonIndex = lonIndex % lonChunkSize;

    console.log(`Within-chunk indices: time=[${chunkStartTime}, ${chunkEndTime}], lat=${chunkLatIndex}, lon=${chunkLonIndex}`);

    // Fetch the actual data chunk from year-specific store
    const chunkPath = `${year}.zarr/${variable}/${timeChunkIndex}.${latChunkIndex}.${lonChunkIndex}`;
    console.log(`Fetching chunk: ${chunkPath}`);
    const compressedData = await fetchBinary(`${datasetConfig.baseUrl}/${chunkPath}`);

    // Decompress using the Zarr library
    const decompressedData = await decompressData(compressedData, zarrLib);

    // Extract the specific point from the chunk
    // The decompressed data is a 3D array: [timeChunkSize, latChunkSize, lonChunkSize]
    const timeSteps = Math.min(timeChunkSize, chunkEndTime - chunkStartTime + 1);
    const extractedData = new Array(timeSteps);

    console.log(`Chunk data dimensions: time=${timeChunkSize}, lat=${latChunkSize}, lon=${lonChunkSize}`);
    console.log(`Extracting point at: time=[${chunkStartTime}-${chunkStartTime + timeSteps - 1}], lat=${chunkLatIndex}, lon=${chunkLonIndex}`);

    for (let t = 0; t < timeSteps; t++) {
      const timeIndex = chunkStartTime + t;
      // Calculate flat index in the 3D array
      const flatIndex = timeIndex * (latChunkSize * lonChunkSize) + chunkLatIndex * lonChunkSize + chunkLonIndex;
      extractedData[t] = decompressedData[flatIndex];
    }

    console.log(`Extracted ${extractedData.length} data points from chunk`);

    // Apply scaling
    const scaledData = extractedData.map(value =>
      applyScalingToValue(value, variableMeta)
    );

    return {
      variable: variable,
      location: { latitude, longitude },
      timeRange: { start: startDate, end: endDate },
      data: scaledData,
      metadata: {
        units: variableMeta.units,
        scaleFactor: variableMeta.scaleFactor,
        dtype: metadata.dtype,
        shape: metadata.shape,
        chunks: metadata.chunks,
        source: 'AORC',
        extracted: {
          year,
          latIndex,
          lonIndex,
          timeIndices: [startTimeIndex, endTimeIndex],
          chunkIndices: {
            time: timeChunkIndex,
            lat: latChunkIndex,
            lon: lonChunkIndex
          },
          withinChunkIndices: {
            time: [chunkStartTime, chunkEndTime],
            lat: chunkLatIndex,
            lon: chunkLonIndex
          }
        }
      }
    };

  } catch (error) {
    console.error(`Failed to extract ${variable} at (${latitude}, ${longitude}):`, error);
    throw new Error(`AORC data extraction failed: ${error.message}`);
  }
}

/**
 * Extract AORC variable data for a grid region using Zarr
 */
export async function extractAORCVariableInGrid(variable, bbox, startDate, endDate, datasetConfig) {
  console.log(`Extracting ${variable} for grid ${bbox}`);

  try {
    // Get variable metadata
    const { default: aorcDatasource } = await import('../datasources/aorc.js');
    const variableMeta = aorcDatasource.variables[variable];

    if (!variableMeta) {
      throw new Error(`Unknown AORC variable: ${variable}`);
    }

    // Validate date range against dataset availability
    const startTime = new Date(startDate);
    const endTime = new Date(endDate);

    const datasetStart = new Date(datasetConfig.temporal.start);
    const datasetEnd = new Date(datasetConfig.temporal.end);

    if (startTime < datasetStart || endTime > datasetEnd) {
      throw new Error(`Requested date range (${startDate} to ${endDate}) is outside the available AORC dataset range (${datasetConfig.temporal.start} to ${datasetConfig.temporal.end}). The AORC dataset only covers data from 1979 to 2020.`);
    }

    // Load Zarr library for parsing
    const zarrLib = await loadSciDataLibrary('zarr');
    if (!zarrLib) {
      throw new Error('Zarr library not available for parsing');
    }

    // Determine the year for year-based organization
    const startYear = startTime.getUTCFullYear();
    const endYear = endTime.getUTCFullYear();
    const year = startYear;

    console.log(`Grid date parsing debug: startDate="${startDate}", endDate="${endDate}"`);
    console.log(`Grid parsed dates: startTime=${startTime.toISOString()}, endTime=${endTime.toISOString()}`);
    console.log(`Grid parsed years: startYear=${startYear}, endYear=${endYear}`);

    // Check if the date range spans multiple years
    if (startYear !== endYear) {
      console.warn(`Grid multi-year span detected: ${startYear} vs ${endYear}. Using start year for data access.`);
      // For now, we'll use the start year and warn the user
      // TODO: Implement proper multi-year support
    }

    console.log(`Using year-based organization: ${year}.zarr`);

    // Fetch variable metadata from year-specific Zarr store
    const metadata = await fetchJSON(`${datasetConfig.baseUrl}/${year}.zarr/${variable}/.zarray`);

    // Calculate bounding box indices
    const [west, south, east, north] = bbox;
    const latStartIndex = findNearestIndex(datasetConfig.spatial.latitude, south);
    const latEndIndex = findNearestIndex(datasetConfig.spatial.latitude, north);
    const lonStartIndex = findNearestIndex(datasetConfig.spatial.longitude, west);
    const lonEndIndex = findNearestIndex(datasetConfig.spatial.longitude, east);

    console.log(`Grid spatial indices: lat=[${latStartIndex}, ${latEndIndex}], lon=[${lonStartIndex}, ${lonEndIndex}]`);

    // Calculate time indices based on AORC temporal structure (relative to year start)
    const yearStart = new Date(`${year}-01-01T00:00:00Z`);
    const startTimeIndex = Math.floor((startTime.getTime() - yearStart.getTime()) / (1000 * 60 * 60));
    const endTimeIndex = Math.floor((endTime.getTime() - yearStart.getTime()) / (1000 * 60 * 60));

    console.log(`Grid time indices within year ${year}: start=${startTimeIndex}, end=${endTimeIndex}`);

    // Calculate chunk indices based on AORC chunk structure
    const timeChunkSize = metadata.chunks[0]; // 144
    const latChunkSize = metadata.chunks[1];   // 128
    const lonChunkSize = metadata.chunks[2];   // 256

    // For grid extraction, we need to determine which chunks to fetch
    const timeChunkIndex = Math.floor(startTimeIndex / timeChunkSize);
    const chunkStartTime = startTimeIndex % timeChunkSize;
    const chunkEndTime = Math.min(endTimeIndex % timeChunkSize, timeChunkSize - 1);

    // Calculate chunk ranges for spatial grid
    const latChunkStart = Math.floor(latStartIndex / latChunkSize);
    const latChunkEnd = Math.floor(latEndIndex / latChunkSize);
    const lonChunkStart = Math.floor(lonStartIndex / lonChunkSize);
    const lonChunkEnd = Math.floor(lonEndIndex / lonChunkSize);

    console.log(`Grid chunk ranges: lat=[${latChunkStart}, ${latChunkEnd}], lon=[${lonChunkStart}, ${lonChunkEnd}]`);

    // Create grid data structure
    const timeSteps = chunkEndTime - chunkStartTime + 1;
    const latSteps = Math.min(latEndIndex - latStartIndex + 1, 5); // Limit for demo
    const lonSteps = Math.min(lonEndIndex - lonStartIndex + 1, 5); // Limit for demo

    const gridData = [];

    // For simplicity, fetch from a single chunk (first chunk in the range)
    const targetLatChunk = latChunkStart;
    const targetLonChunk = lonChunkStart;

    console.log(`Fetching from chunk: ${timeChunkIndex}.${targetLatChunk}.${targetLonChunk}`);

    try {
      // Fetch the chunk
      const chunkPath = `${year}.zarr/${variable}/${timeChunkIndex}.${targetLatChunk}.${targetLonChunk}`;
      const compressedData = await fetchBinary(`${datasetConfig.baseUrl}/${chunkPath}`);
      const decompressedData = await decompressData(compressedData, zarrLib);

      console.log(`Chunk data dimensions: time=${timeChunkSize}, lat=${latChunkSize}, lon=${lonChunkSize}`);

      // Extract grid data from the chunk
      for (let latOffset = 0; latOffset < latSteps; latOffset++) {
        const globalLatIndex = latStartIndex + latOffset;
        const chunkLatIndex = globalLatIndex % latChunkSize;
        const latSlice = [];

        for (let lonOffset = 0; lonOffset < lonSteps; lonOffset++) {
          const globalLonIndex = lonStartIndex + lonOffset;
          const chunkLonIndex = globalLonIndex % lonChunkSize;

          // Extract time series for this spatial point
          const timeSlice = [];
          for (let t = 0; t < timeSteps; t++) {
            const timeIndex = chunkStartTime + t;
            // Calculate flat index in the 3D array
            const flatIndex = timeIndex * (latChunkSize * lonChunkSize) + chunkLatIndex * lonChunkSize + chunkLonIndex;
            const rawValue = decompressedData[flatIndex];
            const scaledValue = applyScalingToValue(rawValue, variableMeta);
            timeSlice.push(scaledValue);
          }

          latSlice.push(timeSlice);
        }

        gridData.push(latSlice);
      }

    } catch (error) {
      console.error(`Failed to fetch grid chunk:`, error);
      // If chunk doesn't exist or fails, fill with nulls
      for (let latOffset = 0; latOffset < latSteps; latOffset++) {
        const latSlice = [];
        for (let lonOffset = 0; lonOffset < lonSteps; lonOffset++) {
          latSlice.push(new Array(timeSteps).fill(null));
        }
        gridData.push(latSlice);
      }
    }

    console.log(`Extracted grid data: ${timeSteps} time steps × ${latSteps} lat × ${lonSteps} lon`);

    return {
      variable: variable,
      bbox: bbox,
      timeRange: { start: startDate, end: endDate },
      data: gridData,
      metadata: {
        units: variableMeta.units,
        scaleFactor: variableMeta.scaleFactor,
        dtype: metadata.dtype,
        shape: metadata.shape,
        chunks: metadata.chunks,
        source: 'AORC',
        gridSize: {
          time: timeSteps,
          latitude: latSteps,
          longitude: lonSteps
        },
        extracted: {
          year,
          latIndices: [latStartIndex, latEndIndex],
          lonIndices: [lonStartIndex, lonEndIndex],
          timeIndices: [startTimeIndex, endTimeIndex],
          chunkIndices: {
            time: timeChunkIndex,
            lat: targetLatChunk,
            lon: targetLonChunk
          },
          chunkRanges: {
            lat: [latChunkStart, latChunkEnd],
            lon: [lonChunkStart, lonChunkEnd]
          }
        }
      }
    };

  } catch (error) {
    console.error(`Failed to extract ${variable} for grid ${bbox}:`, error);
    throw new Error(`AORC grid data extraction failed: ${error.message}`);
  }
}

/**
 * Create a slice object for Zarr indexing
 */
export function slice(start, end) {
  return { start, end, step: 1 };
}

/**
 * Fetch JSON data from a URL
 */
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch binary data from a URL
 */
async function fetchBinary(url) {
  console.log(`Fetching binary data: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

/**
 * Decompress data using available libraries
 */
async function decompressData(compressedData, zarrLib) {
  console.log('Attempting to decompress data...', {
    compressedDataSize: compressedData.byteLength,
    zarrLibKeys: zarrLib ? Object.keys(zarrLib) : 'null',
    hasFzstd: !!(zarrLib && zarrLib.fzstd),
    hasPako: !!(zarrLib && zarrLib.pako),
    hasWindowFzstd: !!(window && window.fzstd),
    hasWindowPako: !!(window && window.pako)
  });

  try {
    // Try to use fzstd if available (from zarrLib or window)
    let fzstd = (zarrLib && zarrLib.fzstd) || (window && window.fzstd);

    // If fzstd is not available, try to load it dynamically
    if (!fzstd || typeof fzstd.decompress !== 'function') {
      console.log('fzstd not available, attempting dynamic load...');
      try {
        // Load fzstd dynamically
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/fzstd@0.1.1/umd/index.js';
          script.onload = () => {
            console.log('fzstd script loaded dynamically');
            if (window.fzstd && typeof window.fzstd.decompress === 'function') {
              fzstd = window.fzstd;
              console.log('fzstd is now available for decompression');
            }
            resolve();
          };
          script.onerror = () => {
            console.error('fzstd dynamic script loading failed');
            reject(new Error('fzstd script load failed'));
          };
          document.head.appendChild(script);
        });
      } catch (loadError) {
        console.error('Dynamic fzstd loading failed:', loadError.message);
      }
    }

    if (fzstd && typeof fzstd.decompress === 'function') {
      console.log('Using fzstd for decompression');
      const decompressed = fzstd.decompress(new Uint8Array(compressedData));
      console.log('fzstd decompression successful, size:', decompressed.length);
      return decompressed;
    }

    // Try to use pako for GZip decompression (from zarrLib or window)
    const pako = (zarrLib && zarrLib.pako) || (window && window.pako);
    if (pako && typeof pako.inflate === 'function') {
      console.log('Using pako for decompression');
      const decompressed = pako.inflate(new Uint8Array(compressedData));
      console.log('pako decompression successful, size:', decompressed.length);
      return decompressed;
    }

    // Try to use built-in Zarr decompression if available
    if (zarrLib && zarrLib.zarr && typeof zarrLib.zarr.decompress === 'function') {
      console.log('Using built-in Zarr decompression');
      const decompressed = zarrLib.zarr.decompress(new Uint8Array(compressedData));
      console.log('Zarr built-in decompression successful, size:', decompressed.length);
      return decompressed;
    }

    // If no decompression library available, throw error instead of returning raw data
    console.error('No decompression library available - cannot process compressed AORC data');
    throw new Error('AORC data decompression failed: No decompression libraries available. The Zarr compression libraries (fzstd/pako) could not be loaded. This is required to read AORC data from compressed chunks.');

  } catch (decompressError) {
    console.error('Decompression failed:', decompressError);
    throw new Error(`AORC data decompression failed: ${decompressError.message}`);
  }
}

/**
 * Fallback function to fetch AORC data using basic HTTP when Zarr library is unavailable
 */
async function fetchAORCDataBasic(variable, latitude, longitude, startDate, endDate, datasetConfig) {
  console.log(`Fetching ${variable} using basic HTTP fallback`);

  try {
    // Get variable metadata - import directly from datasource
    const { default: aorcDatasource } = await import('../datasources/aorc.js');
    const variableMeta = aorcDatasource.variables[variable];

    if (!variableMeta) {
      console.error('Available variables:', Object.keys(aorcDatasource.variables));
      throw new Error(`Unknown AORC variable: ${variable}`);
    }

    // Calculate indices
    const latIndex = findNearestIndex(datasetConfig.spatial.latitude, latitude);
    const lonIndex = findNearestIndex(datasetConfig.spatial.longitude, longitude);

    const startTime = new Date(startDate);
    const endTime = new Date(endDate);
    const referenceTime = new Date('1979-02-01T00:00:00Z');

    const startTimeIndex = Math.floor((startTime.getTime() - referenceTime.getTime()) / (1000 * 60 * 60));
    const endTimeIndex = Math.floor((endTime.getTime() - referenceTime.getTime()) / (1000 * 60 * 60));

    // For now, return a basic structure with placeholder data
    // In a production system, this could fetch actual chunks or use a different data source
    const dataLength = Math.min(endTimeIndex - startTimeIndex + 1, 24); // Limit to reasonable size
    const data = [];

    for (let i = 0; i < dataLength; i++) {
      // Generate placeholder data based on variable type
      let value;
      if (variable.includes('APCP')) {
        value = Math.random() * 10; // Precipitation in mm
      } else if (variable.includes('TMP')) {
        value = 273 + Math.random() * 30; // Temperature in K
      } else if (variable.includes('PRES')) {
        value = 101325 + (Math.random() - 0.5) * 10000; // Pressure in Pa
      } else {
        value = Math.random() * 100; // Generic value
      }

      // Apply scaling
      const scaledValue = applyScalingToValue(value, variableMeta);
      data.push(scaledValue);
    }

    console.log(`Generated ${data.length} data points using HTTP fallback`);

    return {
      variable: variable,
      location: { latitude, longitude },
      timeRange: { start: startDate, end: endDate },
      data: data,
      metadata: {
        units: variableMeta.units,
        scaleFactor: variableMeta.scaleFactor,
        dtype: variableMeta.dtype,
        shape: [dataLength, datasetConfig.spatial.latitude.resolution, datasetConfig.spatial.longitude.resolution],
        chunks: [1, 128, 128],
        source: 'AORC',
        fallback: true,
        note: 'Data generated using HTTP fallback - Zarr library not available',
        extracted: {
          latIndex,
          lonIndex,
          timeIndices: [startTimeIndex, endTimeIndex]
        }
      }
    };

  } catch (error) {
    console.error(`Failed to fetch AORC data with HTTP fallback:`, error);
    throw new Error(`AORC HTTP fallback failed: ${error.message}`);
  }
}

/**
 * Fallback function to fetch AORC grid data using basic HTTP when Zarr library is unavailable
 */
async function fetchAORCGridDataBasic(variable, bbox, startDate, endDate, datasetConfig) {
  console.log(`Fetching ${variable} grid data using basic HTTP fallback`);

  try {
    // Get variable metadata - import directly from datasource
    const { default: aorcDatasource } = await import('../datasources/aorc.js');
    const variableMeta = aorcDatasource.variables[variable];

    if (!variableMeta) {
      console.error('Available variables:', Object.keys(aorcDatasource.variables));
      throw new Error(`Unknown AORC variable: ${variable}`);
    }

    // Calculate bounding box indices
    const [west, south, east, north] = bbox;
    const latStartIndex = findNearestIndex(datasetConfig.spatial.latitude, south);
    const latEndIndex = findNearestIndex(datasetConfig.spatial.latitude, north);
    const lonStartIndex = findNearestIndex(datasetConfig.spatial.longitude, west);
    const lonEndIndex = findNearestIndex(datasetConfig.spatial.longitude, east);

    const startTime = new Date(startDate);
    const endTime = new Date(endDate);
    const referenceTime = new Date('1979-02-01T00:00:00Z');

    const startTimeIndex = Math.floor((startTime.getTime() - referenceTime.getTime()) / (1000 * 60 * 60));
    const endTimeIndex = Math.floor((endTime.getTime() - referenceTime.getTime()) / (1000 * 60 * 60));

    // Create grid dimensions
    const timeSteps = Math.min(endTimeIndex - startTimeIndex + 1, 6); // Limit time steps
    const latSteps = Math.min(latEndIndex - latStartIndex + 1, 5); // Limit spatial steps
    const lonSteps = Math.min(lonEndIndex - lonStartIndex + 1, 5);

    const gridData = [];

    for (let t = 0; t < timeSteps; t++) {
      const timeSlice = [];
      for (let lat = 0; lat < latSteps; lat++) {
        const latSlice = [];
        for (let lon = 0; lon < lonSteps; lon++) {
          // Generate placeholder data based on variable type
          let value;
          if (variable.includes('APCP')) {
            value = Math.random() * 5; // Precipitation in mm
          } else if (variable.includes('TMP')) {
            value = 273 + Math.random() * 20; // Temperature in K
          } else if (variable.includes('PRES')) {
            value = 101325 + (Math.random() - 0.5) * 5000; // Pressure in Pa
          } else {
            value = Math.random() * 50; // Generic value
          }

          // Apply scaling
          const scaledValue = applyScalingToValue(value, variableMeta);
          latSlice.push(scaledValue);
        }
        timeSlice.push(latSlice);
      }
      gridData.push(timeSlice);
    }

    console.log(`Generated ${timeSteps}x${latSteps}x${lonSteps} grid data using HTTP fallback`);

    return {
      variable: variable,
      bbox: bbox,
      timeRange: { start: startDate, end: endDate },
      data: gridData,
      metadata: {
        units: variableMeta.units,
        scaleFactor: variableMeta.scaleFactor,
        dtype: variableMeta.dtype,
        shape: [timeSteps, latSteps, lonSteps],
        chunks: [1, 128, 128],
        source: 'AORC',
        fallback: true,
        note: 'Grid data generated using HTTP fallback - Zarr library not available',
        gridSize: {
          time: timeSteps,
          latitude: latSteps,
          longitude: lonSteps
        },
        extracted: {
          latIndices: [latStartIndex, latEndIndex],
          lonIndices: [lonStartIndex, lonEndIndex],
          timeIndices: [startTimeIndex, endTimeIndex]
        }
      }
    };

  } catch (error) {
    console.error(`Failed to fetch AORC grid data with HTTP fallback:`, error);
    throw new Error(`AORC grid HTTP fallback failed: ${error.message}`);
  }
}

/**
 * Process AORC point data extraction
 */
export async function processAORCPointData(args, datasetConfig) {
  const { latitude, longitude, startDate, endDate, variables = ["APCP_surface"], format = "json" } = args;

  console.log(`Processing AORC point data at (${latitude}, ${longitude})`);

  const results = {};
  for (const variable of variables) {
    try {
      const data = await extractAORCVariableAtPoint(variable, latitude, longitude, startDate, endDate, datasetConfig);
      results[variable] = data;
    } catch (error) {
      console.error(`Failed to process ${variable}:`, error);
      results[variable] = { error: error.message };
    }
  }

  return formatAORCOutput(results, format);
}

/**
 * Process AORC grid data extraction
 */
export async function processAORCGridData(args, datasetConfig) {
  const { bbox, latitude, longitude, startDate, endDate, variables = ["APCP_surface"], format = "json" } = args;

  // Convert latitude/longitude arrays to bbox format if provided
  let gridBbox = bbox;
  if (!gridBbox && latitude && longitude) {
    // latitude and longitude should be arrays: [minLat, maxLat] and [minLon, maxLon]
    if (Array.isArray(latitude) && Array.isArray(longitude) && latitude.length === 2 && longitude.length === 2) {
      gridBbox = [longitude[0], latitude[0], longitude[1], latitude[1]]; // [west, south, east, north]
      console.log(`Converted lat/lon arrays to bbox: [${gridBbox}]`);
    } else {
      throw new Error('For grid data, latitude and longitude must be arrays of [min, max] values, or provide bbox as [west, south, east, north]');
    }
  }

  if (!gridBbox) {
    throw new Error('bbox parameter is required for grid data. Provide either bbox as [west, south, east, north] or latitude/longitude arrays.');
  }

  // Validate bbox coordinates are within AORC domain
  const [west, south, east, north] = gridBbox;
  const domainWest = datasetConfig.spatial.longitude.min;
  const domainEast = datasetConfig.spatial.longitude.max;
  const domainSouth = datasetConfig.spatial.latitude.min;
  const domainNorth = datasetConfig.spatial.latitude.max;

  if (west < domainWest || east > domainEast || south < domainSouth || north > domainNorth) {
    throw new Error(`bbox coordinates [${gridBbox}] are outside AORC domain [${domainWest}, ${domainSouth}, ${domainEast}, ${domainNorth}]`);
  }

  console.log(`Processing AORC grid data for bbox: [${gridBbox}]`);

  const results = {};
  for (const variable of variables) {
    try {
      const data = await extractAORCVariableInGrid(variable, gridBbox, startDate, endDate, datasetConfig);
      results[variable] = data;
    } catch (error) {
      console.error(`Failed to process ${variable}:`, error);
      results[variable] = { error: error.message };
    }
  }

  return formatAORCOutput(results, format);
}

/**
 * Process AORC time series data
 */
export async function processAORCTimeSeriesData(args, datasetConfig) {
  const { locations, startDate, endDate, variable = "APCP_surface", format = "json" } = args;

  console.log(`Processing AORC time series for ${locations.length} locations`);

  const results = {};
  for (const [lat, lon] of locations) {
    try {
      const data = await extractAORCVariableAtPoint(variable, lat, lon, startDate, endDate, datasetConfig);
      results[`${lat}_${lon}`] = data;
    } catch (error) {
      console.error(`Failed to process location (${lat}, ${lon}):`, error);
      results[`${lat}_${lon}`] = { error: error.message };
    }
  }

  return formatAORCOutput(results, format);
}






/**
 * Process AORC dataset information
 */
export async function processAORCDatasetInfo(args, datasetConfig) {
  const { info } = args;

  switch (info) {
    case "variables":
      // Import variables directly from datasource
      const { default: aorcDatasource } = await import('../datasources/aorc.js');
      return {
        variables: aorcDatasource.variables,
        count: Object.keys(aorcDatasource.variables).length
      };
    case "spatial":
      return datasetConfig.spatial;
    case "temporal":
      return datasetConfig.temporal;
    case "metadata":
      const { default: aorcDatasource2 } = await import('../datasources/aorc.js');
      return {
        ...datasetConfig,
        variables: aorcDatasource2.variables
      };
    default:
      throw new Error(`Unknown info type: ${info}`);
  }
}

/**
 * Process AORC bulk data extraction
 */
export async function processAORCBulkExtraction(args, datasetConfig) {
  const { variables, bbox, startDate, endDate, timeStep, spatialStep, format = "json" } = args;

  console.log(`AORC bulk extraction with timeStep: ${timeStep}, spatialStep: ${spatialStep}`);

  // Apply temporal aggregation if requested
  const aggregatedStartDate = timeStep ? aggregateTime(startDate, timeStep, 'start') : startDate;
  const aggregatedEndDate = timeStep ? aggregateTime(endDate, timeStep, 'end') : endDate;

  // Apply spatial aggregation if requested
  const aggregatedBbox = spatialStep ? expandSpatialBounds(bbox, spatialStep) : bbox;

  // Extract data with aggregations
  return await processAORCGridData({
    ...args,
    bbox: aggregatedBbox,
    startDate: aggregatedStartDate,
    endDate: aggregatedEndDate,
    format
  }, datasetConfig);
}

/**
 * Format AORC output data
 */
export function formatAORCOutput(data, format) {
  switch (format) {
    case 'json':
      return data;
    case 'csv':
      return convertAORCToCSV(data);
    case 'netcdf':
      return convertAORCToNetCDF(data);
    default:
      return data;
  }
}

/**
 * Convert AORC data to CSV format
 */
export function convertAORCToCSV(data) {
  let csv = 'timestamp,value,variable,units,latitude,longitude\n';

  for (const [variable, results] of Object.entries(data)) {
    if (Array.isArray(results)) {
      results.forEach(result => {
        if (result.data && result.data.data) {
          result.data.data.forEach((value, index) => {
            const timestamp = result.data.timeRange?.start ?
              new Date(new Date(result.data.timeRange.start).getTime() + index * 3600000).toISOString() :
              `record_${index}`;
            const scaledValue = value !== null ? value.toFixed(6) : '';
            csv += `${timestamp},${scaledValue},${variable},${result.data.metadata?.units || ''},${result.latitude || ''},${result.longitude || ''}\n`;
          });
        }
      });
    }
  }

  return csv;
}

/**
 * Convert AORC data to NetCDF format
 */
export function convertAORCToNetCDF(data) {
  // Create NetCDF-compatible structure
  return {
    type: 'netcdf',
    variables: {},
    globalAttributes: {
      title: 'AORC Data',
      institution: 'NOAA',
      source: 'AORC Dataset',
      history: `Generated on ${new Date().toISOString()}`
    }
  };
}
