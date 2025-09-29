/**
 * MRMS (Multi-Radar Multi-Sensor) data utilities
 * Contains all MRMS-specific data manipulation functions for GRIB2 format
 */

import { loadGridDataLibrary } from './gridded-data-utils.js';
import * as datasources from '../datasources.js';

/**
 * Load GRIB2 library for MRMS data processing
 * @returns {Promise<Object>} GRIB2 loader instance
 */
async function loadGRIB2Library() {
    return await loadGridDataLibrary('grib2');
}


/**
 * Fetch MRMS GRIB2 file from NOAA servers
 * @param {string} url - Complete file URL
 * @returns {Promise<ArrayBuffer>} GRIB2 file data
 */
async function fetchMRMSFile(url, timestamp = null) {
    console.log(`Fetching MRMS file: ${url}`);

    // Use the same proxy as other HydroLang requests
    const proxy = datasources.proxies["local-proxy"].endpoint;
    const proxiedUrl = proxy + url;

    console.log(`Using proxy: ${proxiedUrl}`);

    try {
        const response = await fetch(proxiedUrl);

        if (!response.ok) {
            if (response.status === 404) {
                // Provide more helpful error message with date suggestions
                const currentDate = new Date();
                const currentYear = currentDate.getUTCFullYear();
                const requestedYear = timestamp.getUTCFullYear();

                let errorMessage = `MRMS file not found: ${url}. `;

                // MRMS is a real-time operational system
                if (requestedYear !== currentYear) {
                    errorMessage += `MRMS provides real-time operational data. Historical data (${requestedYear}) may not be available via HTTP. `;
                }

                errorMessage += `Try using current/recent dates. MRMS typically keeps ~24-48 hours of recent data. `;
                errorMessage += `Available recent data: https://mrms.ncep.noaa.gov/3DRefl/MergedReflectivityQC_00.50/`;

                throw new Error(errorMessage);
            }
            // Handle proxy-specific errors
            if (response.status === 301 || response.status === 302) {
                console.warn(`Proxy redirect (${response.status}) for MRMS file: ${url}`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        console.log(`Successfully fetched ${buffer.byteLength} bytes from MRMS`);

        return buffer;

    } catch (error) {
        console.error(`Failed to fetch MRMS file: ${error.message}`);
        throw new Error(`MRMS data fetch failed: ${error.message}`);
    }
}

    /**
     * Test URL generation for MRMS products
     * @param {string} product - MRMS product name
     * @param {Date} timestamp - Test timestamp
     * @returns {string} Generated URL for verification
     */
export async function testMRMSUrlGeneration(product, timestamp) {
    const { default: mrmsDatasource4 } = await import('../datasources/mrms.js');
    return mrmsDatasource4.generateURL(product, timestamp, 'mrms-radar');
}

    /**
     * Extract point data from MRMS GRIB2 file
     * @param {string} variable - Variable name (e.g., 'REF', 'APCP')
     * @param {number} latitude - Latitude coordinate
     * @param {number} longitude - Longitude coordinate
     * @param {Date} timestamp - Data timestamp
     * @param {Object} datasetConfig - MRMS dataset configuration
     * @param {string} product - Specific MRMS product to use (optional)
     * @returns {Promise<Object>} Extracted point data
     */
    export async function extractMRMSPointData(variable, latitude, longitude, timestamp, datasetConfig, product = null) {
        console.log(`Extracting MRMS ${variable} at (${latitude}, ${longitude}) for ${timestamp.toISOString()}`);

        try {
            // Load GRIB2 library
            const grib2Lib = await loadGRIB2Library();

            // Get variable metadata
            const { default: mrmsDatasource } = await import('../datasources/mrms.js');
            const variableMeta = mrmsDatasource.variables[variable];

            if (!variableMeta) {
                throw new Error(`Unknown MRMS variable: ${variable}`);
            }

            // Validate coordinates are within MRMS domain
            const { latitude: latRange, longitude: lonRange } = datasetConfig.spatial;
            if (latitude < latRange.min || latitude > latRange.max ||
                longitude < lonRange.min || longitude > lonRange.max) {
                throw new Error(`Coordinates (${latitude}, ${longitude}) are outside MRMS domain [${latRange.min}-${latRange.max}, ${lonRange.min}-${lonRange.max}]`);
            }

            // Use provided product or find the appropriate product for this variable
            let selectedProduct = product;
            if (!selectedProduct) {
                selectedProduct = await findMRMSProductForVariable(variable, datasetConfig);
                if (!selectedProduct) {
                    throw new Error(`No MRMS product found for variable ${variable}`);
                }
            }

            // Validate that the selected product exists in the dataset
            if (!datasetConfig.products[selectedProduct]) {
                throw new Error(`Product ${selectedProduct} not found in dataset ${datasetConfig.name || 'mrms-radar'}`);
            }

            // Generate file URL using datasource configuration
            const { default: mrmsDatasource1 } = await import('../datasources/mrms.js');
            const fileUrl = mrmsDatasource1.generateURL(selectedProduct, timestamp, 'mrms-radar');
            console.log(`MRMS file URL: ${fileUrl}`);

            // Fetch file (could be GRIB2 or TIFF)
            let fileBuffer = await fetchMRMSFile(fileUrl, timestamp);

            // Debug: Check file content before parsing
            console.log(`Fetched ${fileBuffer.byteLength} bytes for ${selectedProduct}`);
            const uint8Array = new Uint8Array(fileBuffer, 0, Math.min(32, fileBuffer.byteLength));
            const fileSignature = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join(' ');
            console.log(`File signature (first ${uint8Array.length} bytes):`, fileSignature);

            // Check for GRIB2 magic number
            if (fileSignature.startsWith('47 52 49 42')) {
                console.log('✓ Valid GRIB2 file detected (GRIB magic number)');
            } else if (fileSignature.startsWith('1f 8b')) {
                console.log('WARNING: File is still gzipped - decompressing manually...');

                // Manually decompress the gzipped file
                try {
                    // First try to access Pako directly from window
                    let pakoLib = window.pako;

                    // If not available, try loading geospatial library
                    if (!pakoLib) {
                        console.log('Pako not found in window, loading geospatial library...');
                        const geospatialLib = await loadGridDataLibrary('geospatial');
                        pakoLib = geospatialLib.pako || window.pako;
                    }

                    if (pakoLib) {
                        console.log('✓ Using Pako for decompression');
                        const decompressed = pakoLib.ungzip(new Uint8Array(fileBuffer));
                        console.log(`✓ Decompressed from ${fileBuffer.byteLength} to ${decompressed.length} bytes`);

                        // Convert back to ArrayBuffer
                        fileBuffer = decompressed.buffer.slice(
                            decompressed.byteOffset,
                            decompressed.byteOffset + decompressed.byteLength
                        );

                        // Check the decompressed file signature
                        let decompressedArray = new Uint8Array(fileBuffer, 0, Math.min(32, fileBuffer.byteLength));
                        let decompressedSignature = Array.from(decompressedArray).map(b => b.toString(16).padStart(2, '0')).join(' ');
                        console.log(`Decompressed file signature:`, decompressedSignature);

                        if (decompressedSignature.startsWith('47 52 49 42')) {
                            console.log('✓ Decompressed file is valid GRIB2');
                        } else {
                            console.log('WARNING: Decompressed file may not be valid GRIB2');
                        }
                    } else {
                        // Last resort: try browser's built-in decompression
                        console.log('Pako not available, trying browser decompression...');
                        if (typeof DecompressionStream !== 'undefined') {
                            let response = new Response(fileBuffer);
                            let decompressedStream = response.body.pipeThrough(new DecompressionStream('gzip'));
                            let decompressedResponse = await new Response(decompressedStream).arrayBuffer();
                            fileBuffer = decompressedResponse;
                            console.log(`✓ Browser decompressed to ${fileBuffer.byteLength} bytes`);
                        } else {
                            throw new Error('No decompression method available');
                        }
                    }
                } catch (decompError) {
                    console.error('✗ Manual    decompression failed:', decompError.message);
                    throw new Error(`File decompression failed: ${decompError.message}`);
                }
            } else {
                console.log('WARNING: Unknown file signature - may not be a valid GRIB2 file');
            }

            // Get product format from datasource
            const productConfig = datasetConfig.products[selectedProduct];
            const fileFormat = productConfig.format;

            let parsedData;
            if (fileFormat === 'grib2') {
                try {
                    // Parse GRIB2 file
                    parsedData = await grib2Lib.parse(fileBuffer);
                    console.log('✓ GRIB2 parsing successful');
                } catch (grib2Error) {
                    console.error('✗ GRIB2 parsing failed:', grib2Error.message);
                    console.error('File size:', fileBuffer.byteLength, 'bytes');
                    console.error('First 64 bytes:', Array.from(new Uint8Array(fileBuffer, 0, 64)).map(b => b.toString(16).padStart(2, '0')).join(' '));
                    throw new Error(`GRIB2 parsing failed: ${grib2Error.message}`);
                }
            } else if (fileFormat === 'tiff') {
                // Parse TIFF file using geospatial library
                const geospatialLib = await loadGridDataLibrary('geospatial');

                // Create a blob URL for the TIFF data
                const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
                const blobUrl = URL.createObjectURL(blob);

                try {
                    const tiffResult = await geospatialLib.loadGeoTIFF(blobUrl);
                    parsedData = tiffResult; // { type: 'geotiff'|'tiff', data: tiffObject }
                } finally {
                    // Clean up the blob URL
                    URL.revokeObjectURL(blobUrl);
                }
            } else {
                throw new Error(`Unsupported file format: ${fileFormat} for product ${selectedProduct}`);
            }

            let extractedData;
            if (fileFormat === 'grib2') {
                // Extract data for the specific variable and point using GRIB2 method
                const paramCode = variableMeta.grib2Code;
                extractedData = await grib2Lib.extractGRIB2Data(parsedData, {
                    parameter: paramCode,
                    level: variableMeta.levelType,
                    bbox: [longitude, latitude, longitude, latitude], // Point as small bbox
                    startDate: timestamp.toISOString(),
                    endDate: timestamp.toISOString()
                });
            } else if (fileFormat === 'tiff') {
                // Extract data from TIFF at the specified point
                let image, bbox, pixelWidth, pixelHeight;

                if (parsedData.type === 'geotiff') {
                    // Handle GeoTIFF format
                    image = await parsedData.data.getImage();
                    bbox = image.getBoundingBox();
                    pixelWidth = image.getWidth();
                    pixelHeight = image.getHeight();

                    // Convert lat/lon to pixel coordinates
                    const pixelX = Math.floor(((longitude - bbox[0]) / (bbox[2] - bbox[0])) * pixelWidth);
                    const pixelY = Math.floor(((bbox[3] - latitude) / (bbox[3] - bbox[1])) * pixelHeight);

                    // Read pixel value at the specified location
                    const rasters = await image.readRasters({
                        window: [pixelX, pixelY, pixelX + 1, pixelY + 1]
                    });

                    extractedData = {
                        value: rasters[0][0], // First band's value at the point
                        units: variableMeta.units || 'unknown',
                        variable: variable,
                        timestamp: timestamp.toISOString(),
                        coordinates: { latitude, longitude },
                        source: 'MRMS',
                        product: selectedProduct,
                        format: 'tiff'
                    };
                } else if (parsedData.type === 'tiff') {
                    // Handle generic TIFF format
                    throw new Error('TIFF format parsing not implemented for MRMS data');
                }
            }

            // Handle different data formats
            let finalValue, finalData;
            if (fileFormat === 'grib2') {
                // Apply scaling for GRIB2 data
                let rawValue = extractedData.data.values[0];
                if (rawValue === undefined || rawValue === null) {
                    console.warn(`No data found for ${variable} at requested location, using default value`);
                    rawValue = 0; // Default value
                }
                let scaledValue = applyMRMSScaling(rawValue, variableMeta);
                finalValue = scaledValue;
                finalData = extractedData;
            } else if (fileFormat === 'tiff') {
                // TIFF data is already extracted and formatted
                finalValue = extractedData.value;
                finalData = extractedData;
            } else {
                finalValue = extractedData.value || 0;
                finalData = extractedData;
            }

            // Build metadata based on file format
            let metadata = {
                units: variableMeta.units,
                longName: variableMeta.longName,
                product: selectedProduct,
                source: 'MRMS',
                fileUrl: fileUrl,
                format: fileFormat
            };

            // Add GRIB2-specific metadata only for GRIB2 files
            // if (fileFormat === 'grib2' && paramCode) {
            //     metadata.grib2Parameter = paramCode;
            // }

            return {
                variable: variable,
                location: { latitude, longitude },
                timestamp: timestamp.toISOString(),
                value: finalValue,
                metadata: metadata
            };

        } catch (error) {
            console.error(`Failed to extract MRMS point data: ${error.message}`);
            throw new Error(`MRMS point data extraction failed: ${error.message}`);
        }
    }

    /**
     * Extract grid data from MRMS GRIB2 file
     * @param {string} variable - Variable name
     * @param {Array} bbox - Bounding box [west, south, east, north]
     * @param {Date} timestamp - Data timestamp
     * @param {Object} datasetConfig - MRMS dataset configuration
     * @returns {Promise<Object>} Extracted grid data
     */
    export async function extractMRMSGridData(variable, bbox, timestamp, datasetConfig, product = null) {
        console.log(`Extracting MRMS ${variable} grid for bbox ${bbox} at ${timestamp.toISOString()}`);

        try {
            // Load GRIB2 library
            const grib2Lib = await loadGRIB2Library();

            // Get variable metadata
            const { default: mrmsDatasource } = await import('../datasources/mrms.js');
            const variableMeta = mrmsDatasource.variables[variable];

            if (!variableMeta) {
                throw new Error(`Unknown MRMS variable: ${variable}`);
            }

            // Validate bbox is within MRMS domain
            const [west, south, east, north] = bbox;
            const { latitude: latRange, longitude: lonRange } = datasetConfig.spatial;

            if (west < lonRange.min || east > lonRange.max ||
                south < latRange.min || north > latRange.max) {
                console.warn(`Requested bbox partially outside MRMS domain, clipping to available data`);
            }

            // Use provided product or find the appropriate product for this variable
            let selectedProduct = product;
            if (!selectedProduct) {
                selectedProduct = await findMRMSProductForVariable(variable, datasetConfig);
                if (!selectedProduct) {
                    throw new Error(`No MRMS product found for variable ${variable}`);
                }
            }

            // Validate that the selected product exists in the dataset
            if (!datasetConfig.products[selectedProduct]) {
                throw new Error(`Product ${selectedProduct} not found in dataset ${datasetConfig.name || 'mrms-radar'}`);
            }

    // Generate file URL using datasource configuration
    const { default: mrmsDatasource2 } = await import('../datasources/mrms.js');
    const fileUrl = mrmsDatasource2.generateURL(selectedProduct, timestamp, 'mrms-radar');

            // Fetch file (could be GRIB2 or TIFF)
            let fileBuffer = await fetchMRMSFile(fileUrl, timestamp);

            // Debug: Check file content before parsing
            console.log(`Fetched ${fileBuffer.byteLength} bytes for ${selectedProduct}`);
            const uint8Array = new Uint8Array(fileBuffer, 0, Math.min(32, fileBuffer.byteLength));
            const fileSignature = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join(' ');
            console.log(`File signature (first ${uint8Array.length} bytes):`, fileSignature);

            // Check for GRIB2 magic number
            if (fileSignature.startsWith('47 52 49 42')) {
                console.log('✓ Valid GRIB2 file detected (GRIB magic number)');
            } else if (fileSignature.startsWith('1f 8b')) {
                console.log('WARNING: File is still gzipped - decompressing manually...');

                // Manually decompress the gzipped file
                try {
                    // First try to access Pako directly from window
                    let pakoLib = window.pako;

                    // If not available, try loading geospatial library
                    if (!pakoLib) {
                        console.log('Pako not found in window, loading geospatial library...');
                        const geospatialLib = await loadGridDataLibrary('geospatial');
                        pakoLib = geospatialLib.pako || window.pako;
                    }

                    if (pakoLib) {
                        console.log('✓ Using Pako for decompression');
                        const decompressed = pakoLib.ungzip(new Uint8Array(fileBuffer));
                        console.log(`✓ Decompressed from ${fileBuffer.byteLength} to ${decompressed.length} bytes`);

                        // Convert back to ArrayBuffer
                        fileBuffer = decompressed.buffer.slice(
                            decompressed.byteOffset,
                            decompressed.byteOffset + decompressed.byteLength
                        );

                        // Check the decompressed file signature
                        const decompressedArray = new Uint8Array(fileBuffer, 0, Math.min(32, fileBuffer.byteLength));
                        const decompressedSignature = Array.from(decompressedArray).map(b => b.toString(16).padStart(2, '0')).join(' ');
                        console.log(`Decompressed file signature:`, decompressedSignature);

                        if (decompressedSignature.startsWith('47 52 49 42')) {
                            console.log('✓ Decompressed file is valid GRIB2');
                        } else {
                            console.log('WARNING: Decompressed file may not be valid GRIB2');
                        }
                    } else {
                        // Last resort: try browser's built-in decompression
                        console.log('Pako not available, trying browser decompression...');
                        if (typeof DecompressionStream !== 'undefined') {
                            const response = new Response(fileBuffer);
                            const decompressedStream = response.body.pipeThrough(new DecompressionStream('gzip'));
                            const decompressedResponse = await new Response(decompressedStream).arrayBuffer();
                            fileBuffer = decompressedResponse;
                            console.log(`✓ Browser decompressed to ${fileBuffer.byteLength} bytes`);
                        } else {
                            throw new Error('No decompression method available');
                        }
                    }
                } catch (decompError) {
                    console.error('✗ Manual decompression failed:', decompError.message);
                    throw new Error(`File decompression failed: ${decompError.message}`);
                }
            } else {
                console.log('WARNING: Unknown file signature - may not be a valid GRIB2 file');
            }

            // Get product format from datasource
            const productConfig = datasetConfig.products[selectedProduct];
            const fileFormat = productConfig.format;

            let parsedData;
            if (fileFormat === 'grib2') {
                try {
                    // Parse GRIB2 file
                    parsedData = await grib2Lib.parse(fileBuffer);
                    console.log('✓ GRIB2 parsing successful');
                } catch (grib2Error) {
                    console.error('✗ GRIB2 parsing failed:', grib2Error.message);
                    console.error('File size:', fileBuffer.byteLength, 'bytes');
                    console.error('First 64 bytes:', Array.from(new Uint8Array(fileBuffer, 0, 64)).map(b => b.toString(16).padStart(2, '0')).join(' '));
                    throw new Error(`GRIB2 parsing failed: ${grib2Error.message}`);
                }
            } else if (fileFormat === 'tiff') {
                // Parse TIFF file using geospatial library
                const geospatialLib = await loadGridDataLibrary('geospatial');

                // Create a blob URL for the TIFF data
                const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
                const blobUrl = URL.createObjectURL(blob);

                try {
                    const tiffResult = await geospatialLib.loadGeoTIFF(blobUrl);
                    parsedData = tiffResult; // { type: 'geotiff'|'tiff', data: tiffObject }
                } finally {
                    // Clean up the blob URL
                    URL.revokeObjectURL(blobUrl);
                }
            } else {
                throw new Error(`Unsupported file format: ${fileFormat} for product ${selectedProduct}`);
            }

            let extractedData;
            if (fileFormat === 'grib2') {
                // Extract grid data using GRIB2 method
                const paramCode = variableMeta.grib2Code;
                extractedData = await grib2Lib.extractGRIB2Data(parsedData, {
                    parameter: paramCode,
                    level: variableMeta.levelType,
                    bbox: bbox,
                    startDate: timestamp.toISOString(),
                    endDate: timestamp.toISOString()
                });
            } else if (fileFormat === 'tiff') {
                // Extract grid data from TIFF
                if (parsedData.type === 'geotiff') {
                    const image = await parsedData.data.getImage();
                    const imageBbox = image.getBoundingBox();
                    const pixelWidth = image.getWidth();
                    const pixelHeight = image.getHeight();

                    // Read the entire raster
                    const rasters = await image.readRasters();

                    extractedData = {
                        data: {
                            values: rasters[0], // First band data
                            bbox: imageBbox,
                            width: pixelWidth,
                            height: pixelHeight
                        },
                        variable: variable,
                        timestamp: timestamp.toISOString(),
                        source: 'MRMS',
                        product: selectedProduct,
                        format: 'tiff'
                    };
                } else if (parsedData.type === 'tiff') {
                    // Generic TIFF - not implemented for grid data
                    throw new Error('Generic TIFF grid data extraction not implemented');
                }
            }

            // Apply scaling to all grid values
            let scaledGrid;
            if (fileFormat === 'grib2') {
                scaledGrid = extractedData.data.values.map(value => {
                    if (value === undefined || value === null) {
                        console.warn(`Null value found in grid data, using default`);
                        value = 0;
                    }
                    return applyMRMSScaling(value, variableMeta);
                });
            } else if (fileFormat === 'tiff') {
                scaledGrid = extractedData.data.values; // TIFF data is already in final form
            } else {
                scaledGrid = extractedData.data?.values || [];
            }

            // Build metadata based on file format
            const metadata = {
                units: variableMeta.units,
                longName: variableMeta.longName,
                product: selectedProduct,
                source: 'MRMS',
                fileUrl: fileUrl,
                format: fileFormat
            };

            // Add GRIB2-specific metadata only for GRIB2 files
            // if (fileFormat === 'grib2' && paramCode) {
            //     metadata.grib2Parameter = paramCode;
            // }

            // Add grid-specific metadata
            if (extractedData.data) {
                if (extractedData.data.shape) {
                    metadata.gridShape = extractedData.data.shape;
                }
                if (extractedData.data.coordinates) {
                    metadata.coordinates = extractedData.data.coordinates;
                }
                if (extractedData.data.bbox) {
                    metadata.bbox = extractedData.data.bbox;
                }
            }

            return {
                variable: variable,
                bbox: bbox,
                timestamp: timestamp.toISOString(),
                data: scaledGrid,
                metadata: metadata
            };

        } catch (error) {
            console.error(`Failed to extract MRMS grid data: ${error.message}`);
            throw new Error(`MRMS grid data extraction failed: ${error.message}`);
        }
    }

    /**
     * Extract time series data from MRMS GRIB2 files
     * @param {string} variable - Variable name
     * @param {number} latitude - Latitude coordinate
     * @param {number} longitude - Longitude coordinate
     * @param {Date} startTime - Start timestamp
     * @param {Date} endTime - End timestamp
     * @param {Object} datasetConfig - MRMS dataset configuration
     * @returns {Promise<Object>} Time series data
     */
    export async function extractMRMSTimeSeries(variable, latitude, longitude, startTime, endTime, datasetConfig, product = null) {
        console.log(`Extracting MRMS ${variable} time series at (${latitude}, ${longitude})`);

        try {
            const timeSeries = [];
            let currentTime = new Date(startTime);

            // Get temporal resolution from dataset config
            const temporalResolution = datasetConfig.temporal.resolution;
            const timeStepMinutes = temporalResolution === '2M' ? 2 :
                temporalResolution === '1H' ? 60 : 60; // Default to hourly

            // Load GRIB2 library once
            const grib2Lib = await loadGRIB2Library();

            // Get variable metadata
            const { default: mrmsDatasource } = await import('../datasources/mrms.js');
            const variableMeta = mrmsDatasource.variables[variable];

            if (!variableMeta) {
                throw new Error(`Unknown MRMS variable: ${variable}`);
            }

            // Use provided product or find the appropriate product for this variable
            let selectedProduct = product;
            if (!selectedProduct) {
                selectedProduct = await findMRMSProductForVariable(variable, datasetConfig);
                if (!selectedProduct) {
                    throw new Error(`No MRMS product found for variable ${variable}`);
                }
            }

            // Validate that the selected product exists in the dataset
            if (!datasetConfig.products[selectedProduct]) {
                throw new Error(`Product ${selectedProduct} not found in dataset ${datasetConfig.name || 'mrms-radar'}`);
            }

            // Iterate through time steps
            while (currentTime <= endTime) {
                try {
                    // Generate file URL for this timestamp using datasource
                    const { default: mrmsDatasource3 } = await import('../datasources/mrms.js');
                    const fileUrl = mrmsDatasource3.generateURL(selectedProduct, currentTime, 'mrms-radar');

                    // Fetch file (could be GRIB2 or TIFF)
                    const fileBuffer = await fetchMRMSFile(fileUrl, currentTime);

                    // Get product format from datasource
                    const productConfig = datasetConfig.products[selectedProduct];
                    const fileFormat = productConfig.format;

                    let parsedData;
                    if (fileFormat === 'grib2') {
                        // Parse GRIB2 file
                        parsedData = await grib2Lib.parse(fileBuffer);
                    } else if (fileFormat === 'tiff') {
                        // Parse TIFF file using geospatial library
                        const geospatialLib = await loadGridDataLibrary('geospatial');

                        // For TIFF files, we need to create a blob URL since GeoTIFF.fromArrayBuffer expects a URL
                        const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
                        const blobUrl = URL.createObjectURL(blob);

                        try {
                            const geotiff = await geospatialLib.loadGeoTIFF(blobUrl);
                            parsedData = geotiff;
                        } finally {
                            // Clean up the blob URL
                            URL.revokeObjectURL(blobUrl);
                        }
                    } else {
                        throw new Error(`Unsupported file format: ${fileFormat} for product ${selectedProduct}`);
                    }

                    let extractedData;
                    if (fileFormat === 'grib2') {
                        // Extract point data using GRIB2 method
                        const paramCode = variableMeta.grib2Code;
                        extractedData = await grib2Lib.extractGRIB2Data(parsedData, {
                            parameter: paramCode,
                            level: variableMeta.levelType,
                            bbox: [longitude, latitude, longitude, latitude],
                            startDate: currentTime.toISOString(),
                            endDate: currentTime.toISOString()
                        });
                    } else if (fileFormat === 'tiff') {
                        // Extract data from TIFF at the specified point
                        if (parsedData.type === 'geotiff') {
                            const image = await parsedData.data.getImage();
                            const bbox = image.getBoundingBox();
                            const pixelWidth = image.getWidth();
                            const pixelHeight = image.getHeight();

                            // Convert lat/lon to pixel coordinates
                            const pixelX = Math.floor(((longitude - bbox[0]) / (bbox[2] - bbox[0])) * pixelWidth);
                            const pixelY = Math.floor(((bbox[3] - latitude) / (bbox[3] - bbox[1])) * pixelHeight);

                            // Read pixel value at the specified location
                            const rasters = await image.readRasters({
                                window: [pixelX, pixelY, pixelX + 1, pixelY + 1]
                            });

                            extractedData = {
                                value: rasters[0][0], // First band's value at the point
                                units: variableMeta.units || 'unknown',
                                variable: variable,
                                timestamp: currentTime.toISOString(),
                                coordinates: { latitude, longitude },
                                source: 'MRMS',
                                product: selectedProduct,
                                format: 'tiff'
                            };
                        } else if (parsedData.type === 'tiff') {
                            // Generic TIFF - not implemented for timeseries
                            throw new Error('Generic TIFF timeseries extraction not implemented');
                        }
                    }

                    // Apply scaling and add to time series
                    let scaledValue;
                    if (fileFormat === 'grib2') {
                        let rawValue = extractedData.data.values[0];
                        if (rawValue === undefined || rawValue === null) {
                            console.warn(`No data found for ${variable} at ${currentTime.toISOString()}, using default value`);
                            rawValue = 0;
                        }
                        scaledValue = applyMRMSScaling(rawValue, variableMeta);
                    } else if (fileFormat === 'tiff') {
                        scaledValue = extractedData.value; // TIFF data is already in final form
                    } else {
                        scaledValue = extractedData.value || 0;
                    }

                    timeSeries.push({
                        timestamp: currentTime.toISOString(),
                        value: scaledValue,
                        fileUrl: fileUrl
                    });

                } catch (fileError) {
                    console.warn(`Failed to get data for ${currentTime.toISOString()}: ${fileError.message}`);
                    // Add null value for missing data
                    timeSeries.push({
                        timestamp: currentTime.toISOString(),
                        value: null,
                        error: fileError.message
                    });
                }

                // Move to next time step
                currentTime = new Date(currentTime.getTime() + timeStepMinutes * 60 * 1000);
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
                    units: variableMeta.units,
                    longName: variableMeta.longName,
                    product: selectedProduct,
                    source: 'MRMS',
                    format: fileFormat,
                    temporalResolution: temporalResolution,
                    count: timeSeries.length,
                    validCount: timeSeries.filter(d => d.value !== null).length
                }
            };

        } catch (error) {
            console.error(`Failed to extract MRMS time series: ${error.message}`);
            throw new Error(`MRMS time series extraction failed: ${error.message}`);
        }
    }

    /**
     * Find the appropriate MRMS product for a given variable
     * @param {string} variable - Variable name
     * @param {Object} datasetConfig - MRMS dataset configuration
     * @returns {string|null} MRMS product name
     */
    async function findMRMSProductForVariable(variable, datasetConfig) {
        const { default: mrmsDatasource } = await import('../datasources/mrms.js');
        const variableMeta = mrmsDatasource.variables[variable];

        // If variable not found, try to map to a known variable
        if (!variableMeta) {
            console.warn(`Variable ${variable} not found, trying to map to known variable`);
            // Map common variable names to MRMS variables
            const variableMap = {
                'precipitation': 'APCP',
                'precip': 'APCP',
                'reflectivity': 'REFC',
                'reflect': 'REFC',
                'radar': 'REFC'
            };
            const mappedVariable = variableMap[variable.toLowerCase()] || 'APCP'; // Default to precipitation
            console.log(`Mapped ${variable} to ${mappedVariable}`);
            return await findMRMSProductForVariable(mappedVariable, datasetConfig);
        }

        if (!variableMeta || !variableMeta.products) {
            return null;
        }

        // Find first available product that exists in the dataset
        for (const product of variableMeta.products) {
            if (datasetConfig.products[product]) {
                return product;
            }
        }

        return null;
    }

    /**
     * Apply MRMS-specific scaling to data values
     * @param {number} value - Raw data value
     * @param {Object} variableMeta - Variable metadata
     * @returns {number} Scaled value
     */
    function applyMRMSScaling(value, variableMeta) {
        if (value === null || value === undefined || value === variableMeta.fillValue) {
            return null;
        }

        const scaleFactor = variableMeta.scaleFactor || 1.0;
        const addOffset = variableMeta.addOffset || 0.0;

        return value * scaleFactor + addOffset;
    }


    /**
     * Get available MRMS products for a given date
     * @param {Object} datasetConfig - MRMS dataset configuration
     * @param {Date} date - Date to check
     * @returns {Promise<Array>} List of available products
     */
    export async function getAvailableMRMSProducts(datasetConfig, date) {
        console.log(`Getting available MRMS products for ${date.toISOString()}`);

        try {
            // This would typically query the MRMS server for available products
            // For now, return the configured products
            return Object.keys(datasetConfig.products);

        } catch (error) {
            console.error(`Failed to get available MRMS products: ${error.message}`);
            return [];
        }
    }

    /**
     * Validate MRMS dataset configuration
     * @param {Object} config - Dataset configuration
     * @returns {boolean} True if valid
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
     * @param {Object} datasetConfig - MRMS dataset configuration
     * @param {string} infoType - Type of information requested
     * @returns {Object} Dataset information
     */
    export async function getMRMSDatasetInfo(datasetConfig, infoType) {
        const { default: mrmsDatasource } = await import('../datasources/mrms.js');

        switch (infoType) {
            case 'variables':
                return {
                    variables: mrmsDatasource.variables,
                    count: Object.keys(mrmsDatasource.variables).length
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
                    variables: mrmsDatasource.variables
                };

            default:
                throw new Error(`Unknown MRMS info type: ${infoType}`);
        }
    }

