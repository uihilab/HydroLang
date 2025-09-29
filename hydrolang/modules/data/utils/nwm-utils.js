/**
 * NWM (National Water Model) data utilities
 * Contains NWM-specific data manipulation functions
 */

import { aggregateTime, expandSpatialBounds, loadGridDataLibrary } from './gridded-data-utils.js';



/**
 * Construct NWM file URLs based on the official naming convention
 */
export function constructNWMFileURL(baseUrl, year, date, product, datasetVersion) {
  // Format: yyyymmddhhhh.product_DOMAIN1.comp
  const yearStr = year.toString();
  const monthStr = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1).toString();
  const dayStr = date.getDate() < 10 ? '0' + date.getDate() : date.getDate().toString();
  const hourStr = date.getHours() < 10 ? '0' + date.getHours() : date.getHours().toString();

  const fileName = `${yearStr}${monthStr}${dayStr}${hourStr}.${product.toUpperCase()}_DOMAIN1.comp`;

  // Different URL patterns for different versions
  if (datasetVersion === "2.1") {
    return `${baseUrl}/model_output/${yearStr}/${fileName}`;
  } else if (datasetVersion === "2.0") {
    return `${baseUrl}/full_physics/${yearStr}/${fileName}`;
  } else if (datasetVersion === "1.2") {
    return `${baseUrl}/${yearStr}/${fileName}`;
  }

  throw new Error(`Unsupported NWM version: ${datasetVersion}`);
}

/**
 * Get temporal information for NWM data
 */
export function getNWMTemporalInfo(datasetConfig) {
  const startDate = new Date(datasetConfig.temporal.start);
  const endDate = new Date(datasetConfig.temporal.end);
  const version = datasetConfig.temporal.version;

  return {
    startDate,
    endDate,
    version,
    isHourly: datasetConfig.temporal.resolution === "1H"
  };
}

/**
 * Generate date range for NWM data extraction
 */
export function generateNWMDateRange(startDate, endDate, frequency) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));

    // Increment based on frequency
    if (frequency === "1H") {
      currentDate.setHours(currentDate.getHours() + 1);
    } else if (frequency === "3H") {
      currentDate.setHours(currentDate.getHours() + 3);
    } else {
      // Daily as fallback
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return dates;
}

/**
 * Extract data from NWM Zarr arrays or NetCDF files
 * Supports both Zarr format (for v2.1) and NetCDF files (for other versions)
 */
/**
 * Extract data from NWM NetCDF files or Zarr arrays
 * Supports both NetCDF format (for v2.0, v1.2) and Zarr format (for v2.1)
 */
export async function extractNWMData(datasetConfig, variable, comid, startDate, endDate) {
  if (!comid) {
    throw new Error('COMID is required for NWM data extraction');
  }

  if (datasetConfig.format === 'zarr') {
    // Handle Zarr format (v2.1)
    return await extractNWMZarrData(datasetConfig, variable, comid, startDate, endDate);
  } else {
    // Handle NetCDF format (v2.0, v1.2)
    return await extractNWMNetCDFData(datasetConfig, variable, comid, startDate, endDate);
  }
}


/**
 * Extract data from NWM NetCDF files using direct HTTP fetch
 */
async function extractNWMNetCDFData(datasetConfig, variable, comid, startDate, endDate) {
  const results = [];

  // Load NetCDF library for parsing
  const netcdfLib = await loadGridDataLibrary('netcdf');
  if (!netcdfLib || !netcdfLib.netcdfjs) {
    throw new Error('NetCDF library not available for parsing');
  }

  // Access the NetCDF parsing function
  const { netcdfjs } = netcdfLib;

  // Generate file URLs for NetCDF format
  const product = variable.product || 'chrtout';
  const productConfig = datasetConfig.products[product];

  if (!productConfig) {
    throw new Error(`Product ${product} not available for dataset version ${datasetConfig.temporal.version}`);
  }

  const dates = generateNWMDateRange(startDate, endDate, productConfig.frequency);
  const fileUrls = dates.map(date =>
    constructNWMFileURL(datasetConfig.baseUrl, date.getFullYear(), date, product, datasetConfig.temporal.version)
  );

  console.log(`Processing ${fileUrls.length} NWM NetCDF files for COMID ${comid}`);

  for (const fileUrl of fileUrls) {
    try {
      console.log(`Fetching NWM file: ${fileUrl}`);

      // Fetch the NetCDF file using direct HTTP
      const arrayBuffer = await fetchBinary(fileUrl);

      // Parse NetCDF data
      const data = netcdfjs.parse(arrayBuffer);

      console.log(`Parsed NetCDF file with variables:`, Object.keys(data.variables));

      // Extract the requested variable
      const variableData = data.variables[variable];
      if (!variableData) {
        console.warn(`Variable ${variable} not found in ${fileUrl}`);
        continue;
      }

      // Extract time variable for timestamp
      const timeVar = data.variables.time;
      if (!timeVar) {
        console.warn(`Time variable not found in ${fileUrl}`);
        continue;
      }

      // Find COMID index in feature_id array
      const featureIdVar = data.variables.feature_id;
      if (!featureIdVar) {
        console.warn(`Feature ID variable not found in ${fileUrl}`);
        continue;
      }

      const comidIndex = featureIdVar.data.indexOf(comid);
      if (comidIndex === -1) {
        console.warn(`COMID ${comid} not found in ${fileUrl}`);
        continue;
      }

      console.log(`Found COMID ${comid} at index ${comidIndex}`);

      // Extract data for this COMID
      const timeSteps = variableData.shape[0]; // First dimension is time
      const extractedValues = [];

      for (let t = 0; t < timeSteps; t++) {
        // Calculate flat index for (time, feature_id) array
        const flatIndex = t * featureIdVar.data.length + comidIndex;
        const rawValue = variableData.data[flatIndex];

        if (rawValue !== variableData.attributes._FillValue &&
          rawValue !== variableData.attributes.missing_value) {
          extractedValues.push(rawValue);
        } else {
          extractedValues.push(null);
        }
      }

      // Create timestamps
      const timestamps = [];
      const referenceTime = new Date(datasetConfig.temporal.timeUnits.replace('hours since ', ''));
      for (let t = 0; t < timeSteps; t++) {
        const timestamp = new Date(referenceTime.getTime() + timeVar.data[t] * 60 * 60 * 1000);
        timestamps.push(timestamp.toISOString());
      }

      // Apply scaling and offset if available
      const scaleFactor = variableData.attributes.scale_factor || 1.0;
      const addOffset = variableData.attributes.add_offset || 0.0;
      const scaledValues = extractedValues.map(value =>
        value !== null ? (value * scaleFactor) + addOffset : null
      );

      results.push({
        fileUrl: fileUrl,
        timestamp: extractTimestampFromFileName(fileUrl),
        comid: comid,
        data: scaledValues,
        timestamps: timestamps,
        metadata: {
          variable: variable,
          product: product,
          timeSteps: timeSteps,
          scaleFactor: scaleFactor,
          addOffset: addOffset,
          units: variableData.attributes.units || 'unknown'
        }
      });

    } catch (error) {
      console.error(`Error processing ${fileUrl}:`, error);
      // Continue with next file instead of failing completely
    }
  }

  console.log(`Successfully processed ${results.length} NWM NetCDF files`);
  return results;
}

/**
 * Extract data from NWM Zarr arrays (for v2.1)
 */
async function extractNWMZarrData(datasetConfig, variable, comid, startDate, endDate) {
  try {
    // Load Zarr library for parsing
    const zarrLib = await loadGridDataLibrary('zarr');
    if (!zarrLib) {
      throw new Error('Zarr library not available for parsing');
    }

    // Construct Zarr store URL
    const productConfig = datasetConfig.products[variable.product || 'chrtout'];
    const zarrUrl = `${datasetConfig.baseUrl}/${productConfig.zarrPath || 'chrtout.zarr'}`;

    // Fetch variable metadata
    const metadata = await fetchJSON(`${zarrUrl}/${variable}/.zarray`);

    // Fetch feature_id metadata to find COMID index
    const featureMetadata = await fetchJSON(`${zarrUrl}/feature_id/.zarray`);

    // Fetch the feature_id data
    // For Zarr, we need to construct the proper chunk URL
    // The feature_id should be a 1D array, so we fetch chunk 0
    const featureDataUrl = `${zarrUrl}/feature_id/0`;

    let decompressedFeatures;

    try {
      const featureData = await fetchBinary(featureDataUrl);
      decompressedFeatures = await decompressData(featureData, zarrLib);
    } catch (decompressError) {
      console.error('Error decompressing feature data:', decompressError.message);
      console.error('Feature data size:', featureData.byteLength);
      console.error('First 16 bytes:', new Uint8Array(featureData.slice(0, 16)));

      // Provide detailed error message with potential solutions
      throw new Error(
        `NWM feature data decompression failed for COMID ${comid}. ` +
        `This may be due to:\n` +
        `1. Corrupted or incompatible Zarr data format\n` +
        `2. Missing or incompatible compression libraries\n` +
        `3. Network issues during data retrieval\n` +
        `4. Unsupported data type in feature metadata (${featureMetadata.dtype})\n\n` +
        `Original error: ${decompressError.message}`
      );
    }

    // Convert to appropriate array type based on dtype
    let featureIds;
    if (featureMetadata.dtype === '<i8' || featureMetadata.dtype === '>i8') {
      // BigInt64Array for 64-bit integers
      const byteLength = decompressedFeatures.byteLength;

      if (byteLength % 8 !== 0) {
        console.error(`Feature data byte length (${byteLength}) is not divisible by 8. This suggests corrupted data.`);
        throw new Error(`Invalid byte length for BigInt64Array: ${byteLength}. Must be divisible by 8.`);
      }

      // Use DataView for proper endianness handling
      const dataView = new DataView(decompressedFeatures.buffer, decompressedFeatures.byteOffset, byteLength);
      const isLittleEndian = featureMetadata.dtype.startsWith('<');
      const numElements = byteLength / 8;

      featureIds = new Array(numElements);
      for (let i = 0; i < numElements; i++) {
        featureIds[i] = dataView.getBigInt64(i * 8, isLittleEndian);
      }

    } else if (featureMetadata.dtype === '<i4' || featureMetadata.dtype === '>i4') {
      // Int32Array for 32-bit integers
      const byteLength = decompressedFeatures.byteLength;

      if (byteLength % 4 !== 0) {
        // Try to process as much as possible
        const alignedLength = byteLength - (byteLength % 4);
        console.error(`Byte length ${byteLength} not divisible by 4, processing ${alignedLength} bytes`);

        if (alignedLength === 0) {
          throw new Error(`No valid data found. Byte length ${byteLength} cannot be processed as ${featureMetadata.dtype}.`);
        }

        const dataView = new DataView(decompressedFeatures.buffer, decompressedFeatures.byteOffset, alignedLength);
        const isLittleEndian = featureMetadata.dtype.startsWith('<');
        const numElements = alignedLength / 4;

        featureIds = new Array(numElements);
        for (let i = 0; i < numElements; i++) {
          featureIds[i] = dataView.getInt32(i * 4, isLittleEndian);
        }
      } else {
        // Use DataView for proper endianness handling
        const dataView = new DataView(decompressedFeatures.buffer, decompressedFeatures.byteOffset, byteLength);
        const isLittleEndian = featureMetadata.dtype.startsWith('<');
        const numElements = byteLength / 4;

        featureIds = new Array(numElements);
        for (let i = 0; i < numElements; i++) {
          featureIds[i] = dataView.getInt32(i * 4, isLittleEndian);
        }
      }

    } else {
      featureIds = Array.from(decompressedFeatures);
    }

    // Find COMID index
    const targetComidNum = parseInt(comid);
    let comidIndex = -1;


    // Search for the COMID
    for (let i = 0; i < featureIds.length; i++) {
      const currentId = parseInt(featureIds[i]);
      if (currentId === targetComidNum) {
        comidIndex = i;
        break;
      }
    }

    if (comidIndex === -1) {
      throw new Error(`COMID ${comid} not found in the NWM dataset. This COMID may not exist in the current dataset version or may be located outside the coverage area.`);
    }

    // Extract the actual streamflow data
    return await extractStreamflowData(zarrUrl, variable, comidIndex, comid, startDate, endDate, metadata, zarrLib);

  } catch (error) {
    console.error('Error extracting NWM Zarr data:', error);

    // Try alternative approach without feature_id data
    console.log('Attempting alternative data extraction approach...');
    try {
      return await extractNWMDataAlternative(datasetConfig, variable, comid, startDate, endDate);
    } catch (altError) {
      console.error('Alternative extraction also failed:', altError.message);
        throw new Error(`NWM data extraction failed. Primary error: ${error.message}. Alternative approach error: ${altError.message}`);
    }
  }
}
  

/**
 * Alternative NWM data extraction method that doesn't rely on feature_id data
 */
async function extractNWMDataAlternative(datasetConfig, variable, comid, startDate, endDate) {
    console.log(`Using alternative extraction for COMID ${comid}, variable ${variable}`);

    // For now, provide a clear error message that explains the limitation
    // In a production system, this could try different approaches:
    // 1. Use a pre-computed COMID-to-index mapping
    // 2. Try different data access patterns
    // 3. Use external COMID databases
    // 4. Implement spatial indexing

    throw new Error(
      `NWM data extraction failed due to feature_id data decompression issues. ` +
      `COMID ${comid} cannot be mapped to a data index without the feature_id array. ` +
      `This is a limitation of the current NWM Zarr data structure. ` +
      `Consider using the NetCDF version of NWM data which has different access patterns, ` +
      `or contact the data provider for assistance with the Zarr format.`
    );
  }

  /**
   * Extract streamflow data for a given COMID index
   */
  async function extractStreamflowData(zarrUrl, variable, comidIndex, comid, startDate, endDate, metadata, zarrLib) {
    try {
      // Convert string dates to Date objects if needed
      const startDateObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
      const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;


      // Check if time metadata exists and use it for proper time units
      let timeUnits = "hours since 1979-02-01T00:00:00"; // default
      try {
        const timeMetadata = await fetchJSON(`${zarrUrl}/time/.zarray`);
        if (timeMetadata && timeMetadata.units) {
          timeUnits = timeMetadata.units;
        }
      } catch (timeMetaError) {
        // Use default time units if metadata fetch fails
      }

      // Calculate time indices
      const startTimeIndex = calculateTimeIndex(startDateObj, timeUnits);
      const endTimeIndex = calculateTimeIndex(endDateObj, timeUnits);


      // Find all chunks needed for the time range
      // In Zarr, chunks are [time_chunks, feature_chunks]
      const featureChunkIndex = Math.floor(comidIndex / metadata.chunks[1]);
      const featureOffsetInChunk = comidIndex % metadata.chunks[1];

      // Calculate time chunks needed
      const startTimeChunk = Math.floor(startTimeIndex / metadata.chunks[0]);
      const endTimeChunk = Math.floor(endTimeIndex / metadata.chunks[0]);

      // For now, handle the first chunk only (simplified implementation)
      const timeChunkIndex = startTimeChunk;
      const chunkStartTime = startTimeIndex % metadata.chunks[0];
      const chunkEndTime = Math.min(
        endTimeIndex - (startTimeChunk * metadata.chunks[0]),
        metadata.chunks[0] - 1
      );

      // Zarr chunk format: {time_chunk}.{feature_chunk}
      const chunkPath = `${variable}/${timeChunkIndex}.${featureChunkIndex}`;
      const compressedData = await fetchBinary(`${zarrUrl}/${chunkPath}`);

      // Decompress data
      const decompressedBytes = await decompressData(compressedData, zarrLib);


      // Convert decompressed bytes to proper data type
      let decompressedData;
      if (metadata.dtype === '<i4' || metadata.dtype === '>i4') {
        // 32-bit integers
        const bytesPerElement = 4;
        const numElements = decompressedBytes.length / bytesPerElement;

        if (decompressedBytes.length % bytesPerElement !== 0) {
          console.error(`  Byte length ${decompressedBytes.length} not divisible by ${bytesPerElement} for ${metadata.dtype}`);
          throw new Error(`Invalid decompressed data length for ${metadata.dtype}`);
        }

        // Create DataView for proper endianness handling
        const dataView = new DataView(decompressedBytes.buffer, decompressedBytes.byteOffset, decompressedBytes.length);
        const isLittleEndian = metadata.dtype.startsWith('<');

        decompressedData = new Array(numElements);
        for (let i = 0; i < numElements; i++) {
          decompressedData[i] = dataView.getInt32(i * bytesPerElement, isLittleEndian);
        }

      } else if (metadata.dtype === '<i8' || metadata.dtype === '>i8') {
        // 64-bit integers
        const bytesPerElement = 8;
        const numElements = decompressedBytes.length / bytesPerElement;

        if (decompressedBytes.length % bytesPerElement !== 0) {
          console.error(`  Byte length ${decompressedBytes.length} not divisible by ${bytesPerElement} for ${metadata.dtype}`);
          throw new Error(`Invalid decompressed data length for ${metadata.dtype}`);
        }

        const dataView = new DataView(decompressedBytes.buffer, decompressedBytes.byteOffset, decompressedBytes.length);
        const isLittleEndian = metadata.dtype.startsWith('<');

        decompressedData = new Array(numElements);
        for (let i = 0; i < numElements; i++) {
          decompressedData[i] = Number(dataView.getBigInt64(i * bytesPerElement, isLittleEndian));
        }

      } else {
        // Fallback: treat as-is
        console.error(`  Unknown dtype ${metadata.dtype}, using raw bytes`);
        decompressedData = decompressedBytes;
      }

      const expectedElements = metadata.chunks[0] * metadata.chunks[1];
      if (decompressedData.length !== expectedElements) {
        console.error(`  Size mismatch! Expected ${expectedElements} elements, got ${decompressedData.length}`);
      } else {
      }

      // Extract the specific feature and time range from the chunk
      // The chunk contains [time_chunk_size, feature_chunk_size] data
      const timeChunkSize = metadata.chunks[0];  // 672
      const featureChunkSize = metadata.chunks[1]; // 30000
      // featureOffsetInChunk already declared above

      // Extract the specific time range for this feature
      const dataLength = chunkEndTime - chunkStartTime + 1;
      const extractedData = new Array(dataLength);


      for (let i = 0; i < dataLength; i++) {
        const timeIndex = chunkStartTime + i;
        const flatIndex = timeIndex * featureChunkSize + featureOffsetInChunk;
        extractedData[i] = decompressedData[flatIndex];
      }

      // Check if we got meaningful data or just zeros
      const nonZeroCount = extractedData.filter(v => v !== 0).length;
      const totalElements = decompressedData.length;

      // Check for zero values (may indicate data gap)
      if (nonZeroCount === 0) {
        console.warn(`All extracted values are zero - this may indicate missing data or a data gap for the specified time/location`);
      }


      // Get variable configuration for scaling - need to pass datasources
      const variableConfig = {
        scaleFactor: 0.009999999776482582,
        addOffset: 0.0,
        fillValue: -999900,
        missingValue: -999900,
        dtype: "<i4"
      };

      // Apply scaling and offset
      const scaleFactor = variableConfig.scaleFactor || 1.0;
      const addOffset = variableConfig.addOffset || 0.0;
      const fillValue = variableConfig.fillValue;
      const missingValue = variableConfig.missingValue;


      const processedData = extractedData.map((value, index) => {
        const timestamp = new Date(startDateObj.getTime() + index * 60 * 60 * 1000); // Hourly data

        // Check for fill/missing values
        if (value === fillValue || value === missingValue || value === null || value === undefined || isNaN(value)) {
          return {
            timestamp: timestamp ? timestamp.toISOString() : null,
            value: null,
            comid: comid
          };
        }

        // Apply scaling and offset
        const scaledValue = (value * scaleFactor) + addOffset;

        return {
          timestamp: timestamp ? timestamp.toISOString() : null,
          value: isNaN(scaledValue) ? null : scaledValue,
          comid: comid
        };
      });


      const result = [{
        variable: variable,
        comid: comid,
        data: processedData,
        metadata: {
          source: 'NWM',
          format: 'zarr',
          version: '2.1',
          timeRange: { start: startDateObj, end: endDateObj },
          extracted: {
            comidIndex,
            timeIndices: [startTimeIndex, endTimeIndex],
            chunkIndex: timeChunkIndex
          }
        }
      }];


      return result;
    } catch (error) {
      console.error('Error extracting streamflow data:', error);
      throw error;
    }
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
    const dataView = new Uint8Array(compressedData);

    // Check for blosc magic header (blosc compressed data)
    // Blosc header starts with: 0x02, 0x01, followed by format version
    const hasBloscMagic = dataView.length >= 4 &&
      dataView[0] === 0x02 && dataView[1] === 0x01;

    // Check if data might already be uncompressed by looking for zstd magic bytes
    const hasZstdMagic = dataView.length >= 4 &&
      ((dataView[0] === 0x28 && dataView[1] === 0xB5) || // Zstd magic
       (dataView[0] === 0x27 && dataView[1] === 0xB5));  // Zstd skippable frame

    // If no compression magic bytes detected, data might already be uncompressed
    if (!hasBloscMagic && !hasZstdMagic) {
      return dataView;
    }

    try {
      // Try blosc decompression first (since the metadata shows blosc compressor)
      if (hasBloscMagic) {

        // Try global decompress function first (from blosc library)
        if (typeof window.decompress === 'function') {
          try {
            const decompressed = window.decompress(dataView);
            return decompressed;
          } catch (globalError) {
            console.error('Global decompress failed:', globalError.message);
          }
        }

        // Try numcodecs blosc decompressor
        if (typeof window.bloscDecompress === 'function') {
          try {
            const decompressed = await window.bloscDecompress(dataView);

            // Ensure we have valid data
            if (!decompressed) {
              throw new Error('numcodecs decompression returned invalid data');
            }

            // Convert to Uint8Array if needed
            const result = decompressed instanceof Uint8Array ? decompressed : new Uint8Array(decompressed);
            return result;
          } catch (bloscError) {
            console.error('numcodecs blosc decompression failed:', bloscError.message);
          }
        }

        // Try fzstd for zstd data only (not blosc)
        const fzstd = (zarrLib && zarrLib.fzstd) || (window && window.fzstd);
        if (fzstd && typeof fzstd.decompress === 'function') {
          try {
            const decompressed = fzstd.decompress(dataView);
            return decompressed;
          } catch (fzstdError) {
            console.error('fzstd decompression failed:', fzstdError.message);
          }
        }

        // Try Zarr library blosc decompression
        if (zarrLib && zarrLib.zarr) {
          try {
            if (typeof zarrLib.zarr.decompress === 'function') {
              const decompressed = zarrLib.zarr.decompress(dataView);
              return decompressed;
            }
          } catch (bloscError) {
            console.error('Zarr blosc decompression failed:', bloscError.message);
          }
        }
      }

      // Try zstd decompression
      if (hasZstdMagic) {
        const fzstd = (zarrLib && zarrLib.fzstd) || (window && window.fzstd);
        if (fzstd && typeof fzstd.decompress === 'function') {
          const decompressed = fzstd.decompress(dataView);
          return decompressed;
        }
      }

      // Try pako for GZip decompression
      const pako = (zarrLib && zarrLib.pako) || (window && window.pako);
      if (pako && typeof pako.inflate === 'function') {
        const decompressed = pako.inflate(dataView);
        return decompressed;
      }

      // If no decompression worked, return raw data as fallback
      console.error('All decompression attempts failed, returning raw data');
      return dataView;

    } catch (decompressError) {
      console.error('Decompression failed:', decompressError.message);
      // Return raw data as fallback
      return dataView;
    }
  }

  /**
   * Create a slice object for Zarr indexing
   */
  function slice(start, end) {
    return { start, end, step: 1 };
  }

  /**
   * Calculate time index from date based on time units
   */
  function calculateTimeIndex(date, timeUnits) {
    // Parse time units (e.g., "hours since 1979-02-01T00:00:00")
    const parts = timeUnits.split(' since ');
    const unit = parts[0]; // 'hours'
    const referenceDate = new Date(parts[1]);

    const diffMs = date.getTime() - referenceDate.getTime();

    if (unit === 'hours') {
      return Math.floor(diffMs / (1000 * 60 * 60));
    } else if (unit === 'seconds') {
      return Math.floor(diffMs / 1000);
    } else {
      throw new Error(`Unsupported time unit: ${unit}`);
    }
  }

  /**
   * Extract timestamp from NWM file name
   */
  function extractTimestampFromFileName(fileUrl) {
    // Extract from filename like: 200305011200.CHRTOUT_DOMAIN1.comp
    const fileName = fileUrl.split('/').pop();
    const datePart = fileName.split('.')[0]; // 200305011200

    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6)) - 1; // JS months are 0-based
    const day = parseInt(datePart.substring(6, 8));
    const hour = parseInt(datePart.substring(8, 10));

    return new Date(year, month, day, hour);
  }


  /**
   * Convert NWM data values to proper units
   */
  export function convertNWMValue(rawValue, variableName, datasources) {
    const variableConfig = datasources.nwm.variables[variableName];
    if (!variableConfig) {
      return rawValue;
    }

    const { scaleFactor, fillValue } = variableConfig;

    if (rawValue === fillValue || rawValue === null || rawValue === undefined) {
      return null;
    }

    return rawValue * scaleFactor;
  }

  /**
   * Process NWM point data extraction
   * @param {Object} args - Arguments object
   * @param {number} args.comid - REQUIRED: COMID (Catchment Outlet Identification) for the stream reach
   * @param {number} args.latitude - Latitude coordinate
   * @param {number} args.longitude - Longitude coordinate
   * @param {string} args.startDate - Start date for data extraction
   * @param {string} args.endDate - End date for data extraction
   * @param {Array} args.variables - Array of variable names to extract
   * @param {string} args.format - Output format ('json' or 'csv')
   * @param {Object} datasetConfig - Dataset configuration
   * @param {Object} datasources - Datasources object containing variable definitions
   */
  /**
   * Process NWM time series data extraction for multiple locations
   * @param {Object} args - Arguments object
   * @param {string} args.variable - Variable name (usually "streamflow")
   * @param {Array} args.locations - Array of [latitude, longitude] coordinate pairs
   * @param {string} args.startDate - Start date for data extraction
   * @param {string} args.endDate - End date for data extraction
   * @param {string} args.format - Output format ('json' or 'csv')
   * @param {Object} datasetConfig - Dataset configuration
   * @param {Object} datasources - Datasources object containing variable definitions
   */
  export async function processNWMTimeSeriesData(args, datasetConfig, datasources) {
    const { variable = "streamflow", locations, processedLocations, startDate, endDate, format = "json" } = args;

    // Use processedLocations if available (with COMIDs), otherwise use original locations
    const locationsToProcess = processedLocations || locations;

    if (!locationsToProcess || !Array.isArray(locationsToProcess) || locationsToProcess.length === 0) {
      throw new Error('Locations array is required for time series data extraction');
    }

    const results = {};

    // Process each location
    for (let i = 0; i < locationsToProcess.length; i++) {
      const location = locationsToProcess[i];

      // Handle both formats: [lat, lon] arrays and processed location objects
      let latitude, longitude, comid, locationKey;

      if (Array.isArray(location)) {
        [latitude, longitude] = location;
        comid = null;
        locationKey = `${latitude}_${longitude}`;
      } else {
        latitude = location.latitude;
        longitude = location.longitude;
        comid = location.comid;
        locationKey = `${latitude}_${longitude}`;
      }

      try {

        // Use the point data extraction function for each location
        const locationArgs = {
          comid: comid, // Use found COMID if available
          latitude,
          longitude,
          startDate,
          endDate,
          variables: [variable],
          format
        };

        const locationData = await processNWMPointData(locationArgs, datasetConfig, datasources);

        if (locationData && locationData.data && Array.isArray(locationData.data)) {
          results[locationKey] = locationData; // processNWMPointData returns a single object, not an array
        } else {
          results[locationKey] = { error: 'No data returned for this location' };
        }

      } catch (locationError) {
        console.error(`Error processing location (${latitude}, ${longitude}):`, locationError.message);
        results[locationKey] = {
          error: locationError.message,
          latitude,
          longitude
        };
      }
    }

    return results;
  }

  export async function processNWMPointData(args, datasetConfig, datasources) {
    const { latitude, longitude, comid, startDate, endDate, variables = ["streamflow"], format = "json" } = args;

    if (!comid) {
      throw new Error('COMID is required for NWM point data extraction. Please provide a valid COMID for the stream reach.');
    }

    // Get temporal information
    const temporalInfo = getNWMTemporalInfo(datasetConfig);
    const startDateObj = new Date(Math.max(new Date(startDate), temporalInfo.startDate));
    const endDateObj = new Date(Math.min(new Date(endDate), temporalInfo.endDate));

    // Determine the product type for the requested variable
    const variableName = variables[0]; // For now, handle single variable
    const variableConfig = datasources.nwm.variables[variableName];
    if (!variableConfig) {
      throw new Error(`Unknown NWM variable: ${variableName}`);
    }

    const product = variableConfig.product;
    const productConfig = datasetConfig.products[product];
    if (!productConfig) {
      throw new Error(`Product ${product} not available for dataset version ${temporalInfo.version}`);
    }

    // Extract data using the unified extraction function
    const extractedData = await extractNWMData(datasetConfig, variableName, comid, startDateObj, endDateObj);

    // Process the extracted data
    const processedData = extractedData.flatMap(item => {
      if (item.data && Array.isArray(item.data) && item.data.length > 0) {
        // Check if data is already processed (has timestamp property)
        if (item.data[0] && typeof item.data[0] === 'object' && 'timestamp' in item.data[0]) {
          return item.data; // Already processed by extractStreamflowData
        } else {
          // Handle NetCDF format (raw values that need processing)
          return item.data.map((value, index) => ({
            timestamp: item.timestamps ? item.timestamps[index] : item.timestamp,
            value: value !== null ? convertNWMValue(value, variableName, datasources) : null,
            comid: comid,
            fileUrl: item.fileUrl
          }));
        }
      }
      return [];
    });

    const result = {
      variable: variableName,
      location: { latitude, longitude, comid },
      timeRange: { start: startDate, end: endDate },
      data: processedData,
      metadata: {
        units: variableConfig.units,
        scaleFactor: variableConfig.scaleFactor,
        source: 'NWM',
        dataset: datasetConfig.description,
        version: temporalInfo.version,
        product: product,
        filesProcessed: extractedData.length
      }
    };

    return formatNWMOutput(result, format);
  }

  /**
   * Process NWM grid data extraction
   * @param {Object} args - Arguments object
   * @param {Array} args.bbox - Bounding box [west, south, east, north]
   * @param {number} args.comid - REQUIRED: COMID (Catchment Outlet Identification) for the stream reach
   * @param {string} args.startDate - Start date for data extraction
   * @param {string} args.endDate - End date for data extraction
   * @param {Array} args.variables - Array of variable names to extract
   * @param {string} args.format - Output format ('json' or 'csv')
   */
  export async function processNWMGridData(args, datasetConfig, datasources) {
    const { bbox, comid, startDate, endDate, variables = ["streamflow"], format = "json" } = args;

    if (!comid) {
      throw new Error('COMID is required for NWM grid data extraction. Please provide a valid COMID for the stream reach.');
    }

    const [west, south, east, north] = bbox;

    console.log(`Processing NWM grid data for COMID ${comid} in bbox: [${bbox}]`);

    // Get temporal information
    const temporalInfo = getNWMTemporalInfo(datasetConfig);
    const startDateObj = new Date(Math.max(new Date(startDate), temporalInfo.startDate));
    const endDateObj = new Date(Math.min(new Date(endDate), temporalInfo.endDate));

    // Determine the product type for the requested variable
    const variableName = variables[0]; // For now, handle single variable
    const variableConfig = datasources.nwm.variables[variableName];
    if (!variableConfig) {
      throw new Error(`Unknown NWM variable: ${variableName}`);
    }

    const product = variableConfig.product;
    const productConfig = datasetConfig.products[product];
    if (!productConfig) {
      throw new Error(`Product ${product} not available for dataset version ${temporalInfo.version}`);
    }

    // NWM data extraction not implemented
    throw new Error('NWM data extraction not implemented');

    // Convert values to proper units
    const processedData = extractedData.map(item => ({
      timestamp: item.timestamp.toISOString(),
      value: convertNWMValue(item.value, variableName, datasources),
      comid: comid,
      bbox: bbox,
      fileUrl: item.fileUrl,
      accessible: item.accessible
    }));

    const result = {
      type: 'grid',
      bbox: bbox,
      variable: variableName,
      timeRange: { start: startDate, end: endDate },
      data: processedData,
      metadata: {
        units: variableConfig.units,
        scaleFactor: variableConfig.scaleFactor,
        source: 'NWM',
        dataset: datasetConfig.description,
        version: temporalInfo.version,
        product: product,
        filesProcessed: extractedData.length,
        note: 'Grid extraction currently returns data for center point. Full grid implementation requires spatial indexing.'
      }
    };

    return formatNWMOutput(result, format);
  }


  /**
   * Process NWM time series data
   * @param {Object} args - Arguments object
   * @param {Array} args.locations - Array of [latitude, longitude, comid] triplets (COMID REQUIRED)
   * @param {string} args.startDate - Start date for data extraction
   * @param {string} args.endDate - End date for data extraction
   * @param {string} args.variable - Variable name to extract
   * @param {string} args.format - Output format ('json' or 'csv')
   */

  /**
   * Process NWM dataset information
   */
  export async function processNWMDatasetInfo(args, datasetConfig) {
    const { info } = args;

    switch (info) {
      case "variables":
        return {
          variables: datasetConfig.variables,
          count: Object.keys(datasetConfig.variables).length,
          byProduct: Object.keys(datasetConfig.variables).reduce((acc, varName) => {
            const product = datasetConfig.variables[varName].product;
            if (!acc[product]) acc[product] = [];
            acc[product].push(varName);
            return acc;
          }, {})
        };
      case "spatial":
        return datasetConfig.spatial;
      case "temporal":
        return datasetConfig.temporal;
      case "products":
        return datasetConfig.products;
      case "metadata":
        return {
          ...datasetConfig,
          variables: datasetConfig.variables,
          availableProducts: Object.keys(datasetConfig.products),
          supportedVersions: Object.keys(datasetConfig.variables).reduce((acc, varName) => {
            const versions = datasetConfig.variables[varName].versions || [];
            versions.forEach(version => {
              if (!acc.includes(version)) acc.push(version);
            });
            return acc;
          }, [])
        };
      default:
        throw new Error(`Unknown info type: ${info}`);
    }
  }

  /**
   * Process NWM bulk data extraction
   * @param {Object} args - Arguments object
   * @param {Array} args.variables - Array of variable names to extract
   * @param {Array} args.bbox - Bounding box [west, south, east, north]
   * @param {number} args.comid - REQUIRED: COMID (Catchment Outlet Identification) for the stream reach
   * @param {string} args.startDate - Start date for data extraction
   * @param {string} args.endDate - End date for data extraction
   * @param {string} args.timeStep - Temporal aggregation step (optional)
   * @param {string} args.spatialStep - Spatial aggregation step (optional)
   * @param {string} args.format - Output format ('json' or 'csv')
   */
export async function processNWMBulkExtraction(args, datasetConfig, datasources) {
    const { variables, bbox, comid, startDate, endDate, timeStep, spatialStep, format = "json" } = args;

    if (!comid) {
      throw new Error('COMID is required for NWM bulk data extraction. Please provide a valid COMID for the stream reach.');
    }

    console.log(`NWM bulk extraction with timeStep: ${timeStep}, spatialStep: ${spatialStep}`);

    // Apply temporal aggregation if requested
    const aggregatedStartDate = timeStep ? aggregateTime(startDate, timeStep, 'start') : startDate;
    const aggregatedEndDate = timeStep ? aggregateTime(endDate, timeStep, 'end') : endDate;

    // Apply spatial aggregation if requested
    const aggregatedBbox = spatialStep ? expandSpatialBounds(bbox, spatialStep) : bbox;

    // NWM data extraction not implemented
    throw new Error('NWM bulk data extraction not implemented');
  }

/**
 * Format NWM output data
 */
export function formatNWMOutput(data, format) {
  switch (format) {
    case 'json':
      return data;
    case 'csv':
      return convertNWMToCSV(data);
    default:
      return data;
  }
}

/**
 * Convert NWM data to CSV format
 */
export function convertNWMToCSV(data) {
  let csv = 'timestamp,value,variable,units,latitude,longitude,comid,fileUrl,accessible\n';

  // Handle different data structures
  if (data.data && Array.isArray(data.data)) {
    data.data.forEach((item) => {
      const timestamp = item.timestamp || data.timeRange?.start || '';
      const value = item.value !== null && item.value !== undefined ? item.value.toFixed(6) : '';
      const variable = data.variable || item.variable || '';
      const units = data.metadata?.units || '';
      const latitude = data.location?.latitude || item.location?.latitude || '';
      const longitude = data.location?.longitude || item.location?.longitude || '';
      const comid = data.location?.comid || item.comid || '';
      const fileUrl = item.fileUrl || '';
      const accessible = item.accessible || false;

      csv += `${timestamp},${value},${variable},${units},${latitude},${longitude},${comid},${fileUrl},${accessible}\n`;
    });
  } else if (typeof data === 'object' && data.variable) {
    // Single variable format
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((item) => {
        const timestamp = item.timestamp || data.timeRange?.start || '';
        const value = item.value !== null ? item.value.toFixed(6) : '';
        const variable = data.variable || item.variable || '';
        const units = data.metadata?.units || '';
        const latitude = data.location?.latitude || item.location?.latitude || '';
        const longitude = data.location?.longitude || item.location?.longitude || '';
        const comid = data.location?.comid || item.comid || '';
        const fileUrl = item.fileUrl || '';
        const accessible = item.accessible || false;

        csv += `${timestamp},${value},${variable},${units},${latitude},${longitude},${comid},${fileUrl},${accessible}\n`;
      });
    }
  }

  return csv;}
