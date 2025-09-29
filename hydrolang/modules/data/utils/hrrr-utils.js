/**
 * HRRR (High Resolution Rapid Refresh) data utilities
 * Contains all HRRR-specific data manipulation functions for GRIB2 format
 * Supports GRIB2 format processing and data extraction
 */

import { loadGridDataLibrary } from './gridded-data-utils.js';
import * as datasources from '../datasources.js';
import { generateHRRRFileURL } from '../datasources/hrrr.js';

/**
 * Load GRIB2 library for HRRR data processing
 * @returns {Promise<Object>} GRIB2 loader instance
 */
async function loadGRIB2Library() {
    return await loadGridDataLibrary('grib2');
}

/**
 * Fetch HRRR GRIB2 file from NOAA servers
 * @param {string} url - Complete file URL
 * @param {Object} options - Additional options for request
 * @returns {Promise<ArrayBuffer>} GRIB2 file data
 */
async function fetchHRRRFile(url, options = {}) {
    console.log(`Fetching HRRR file: ${url}`);

    // HRRR data should use proxy for CORS
    const proxy = datasources.proxies["local-proxy"].endpoint;
    const proxiedUrl = proxy + url;

    console.log(`Using proxy: ${proxiedUrl}`);

    try {
        const response = await fetch(proxiedUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/octet-stream',
                ...options.headers
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`HRRR file not found: ${url}. The requested forecast may not be available yet or the timestamp may be incorrect.`);
            } else if (response.status === 403) {
                throw new Error(`Access denied to HRRR file: ${url}.`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        console.log(`Successfully fetched ${buffer.byteLength} bytes from HRRR`);

        return buffer;

    } catch (error) {
        console.error(`Failed to fetch HRRR file: ${error.message}`);
        throw new Error(`HRRR data fetch failed: ${error.message}`);
    }
}

/**
 * Extract point data from HRRR GRIB2 file
 * @param {string} variable - Variable name (e.g., 'TMP', 'APCP')
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - HRRR dataset configuration
 * @param {Object} hrrrVariables - HRRR variables configuration
 * @param {string} product - Specific HRRR product to use (optional)
 * @param {number} forecastHour - Forecast hour (0-48)
 * @returns {Promise<Object>} Extracted point data
 */
export async function extractHRRRPointData(variable, latitude, longitude, timestamp, datasetConfig, hrrrVariables, product = null, forecastHour = 0) {
    console.log(`Extracting HRRR ${variable} at (${latitude}, ${longitude}) for ${timestamp.toISOString()}, forecast hour ${forecastHour}`);

    try {
        // Load GRIB2 library
        const grib2Lib = await loadGRIB2Library();

        // Get variable metadata
        const variableMeta = hrrrVariables[variable];

        if (!variableMeta) {
            throw new Error(`Unknown HRRR variable: ${variable}`);
        }

        // Validate coordinates are within HRRR domain
        const spatial = datasetConfig.spatial;
        if (latitude < spatial.latitude.min || latitude > spatial.latitude.max ||
            longitude < spatial.longitude.min || longitude > spatial.longitude.max) {
            throw new Error(`Coordinates (${latitude}, ${longitude}) are outside HRRR domain [${spatial.latitude.min}-${spatial.latitude.max}, ${spatial.longitude.min}-${spatial.longitude.max}]`);
        }

        // Use provided product or find the appropriate product for this variable
        let selectedProduct = product;
        if (!selectedProduct) {
            selectedProduct = await findHRRRProductForVariable(variable, datasetConfig, hrrrVariables);
            if (!selectedProduct) {
                throw new Error(`No HRRR product found for variable ${variable}`);
            }
        }

        // Validate that the selected product exists in the dataset
        if (!datasetConfig.products[selectedProduct]) {
            throw new Error(`Product ${selectedProduct} not found in dataset ${datasetConfig.name || 'hrrr'}`);
        }

        // Generate file URL using datasource configuration
        const fileUrl = generateHRRRFileURL(selectedProduct, timestamp, 'hrrr-operational');
        console.log(`HRRR file URL: ${fileUrl}`);

        // Fetch file
        const fileBuffer = await fetchHRRRFile(fileUrl);

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
                let pakoLib = window.pako;

                if (!pakoLib) {
                    console.log('Pako not found in window, loading geospatial library...');
                    const geospatialLib = await loadGridDataLibrary('geospatial');
                    pakoLib = geospatialLib.pako || window.pako;
                }

                if (pakoLib) {
                    console.log('✓ Using Pako for decompression');
                    const decompressed = pakoLib.ungzip(new Uint8Array(fileBuffer));
                    console.log(`✓ Decompressed from ${fileBuffer.byteLength} to ${decompressed.length} bytes`);

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
                console.error('Manual decompression failed:', decompError.message);
                throw new Error(`File decompression failed: ${decompError.message}`);
            }
        } else {
            console.log('Warning: Unknown file signature - may not be a valid GRIB2 file');
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
                console.error('GRIB2 parsing failed:', grib2Error.message);
                console.error('File size:', fileBuffer.byteLength, 'bytes');
                console.error('First 64 bytes:', Array.from(new Uint8Array(fileBuffer, 0, 64)).map(b => b.toString(16).padStart(2, '0')).join(' '));
                throw new Error(`GRIB2 parsing failed: ${grib2Error.message}`);
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
            let scaledValue = applyHRRRScaling(rawValue, variableMeta);
            finalValue = scaledValue;
            finalData = extractedData;
        } else {
            finalValue = extractedData.value || 0;
            finalData = extractedData;
        }

        // Build metadata based on file format
        const metadata = {
            units: variableMeta.units,
            longName: variableMeta.longName,
            product: selectedProduct,
            source: 'HRRR',
            fileUrl: fileUrl,
            format: fileFormat,
            forecastHour: forecastHour,
            resolution: '3km'
        };

        // Add GRIB2-specific metadata only for GRIB2 files
        if (fileFormat === 'grib2' && variableMeta.grib2Code) {
            metadata.grib2Parameter = variableMeta.grib2Code;
        }

        return {
            variable: variable,
            location: { latitude, longitude },
            timestamp: timestamp.toISOString(),
            value: finalValue,
            metadata: metadata
        };

    } catch (error) {
        console.error(`Failed to extract HRRR point data: ${error.message}`);
        throw new Error(`HRRR point data extraction failed: ${error.message}`);
    }
}

/**
 * Extract grid data from HRRR GRIB2 file
 * @param {string} variable - Variable name
 * @param {Array} bbox - Bounding box [west, south, east, north]
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - HRRR dataset configuration
 * @param {Object} hrrrVariables - HRRR variables configuration
 * @param {string} product - Specific HRRR product to use (optional)
 * @param {number} forecastHour - Forecast hour (0-48)
 * @param {Object} options - Additional options including parse flag
 * @returns {Promise<Object>} Extracted grid data or raw data if parse=false
 */
export async function extractHRRRGridData(variable, bbox, timestamp, datasetConfig, hrrrVariables, product = null, forecastHour = 0, options = {}) {
    console.log(`Extracting HRRR ${variable} grid for bbox ${bbox} at ${timestamp.toISOString()}, forecast hour ${forecastHour}`);

    try {
        // Extract parse flag from options
        const shouldParse = options.parse !== false; // Default to true
        
        // Get variable metadata
        const variableMeta = hrrrVariables[variable];

        if (!variableMeta) {
            throw new Error(`Unknown HRRR variable: ${variable}`);
        }

        // Validate bbox is within HRRR domain
        const [west, south, east, north] = bbox;
        const spatial = datasetConfig.spatial;

        if (west < spatial.longitude.min || east > spatial.longitude.max ||
            south < spatial.latitude.min || north > spatial.latitude.max) {
            console.warn(`Requested bbox partially outside HRRR domain, clipping to available data`);
        }

        // Use provided product or find the appropriate product for this variable
        let selectedProduct = product;
        if (!selectedProduct) {
            selectedProduct = await findHRRRProductForVariable(variable, datasetConfig, hrrrVariables);
            if (!selectedProduct) {
                throw new Error(`No HRRR product found for variable ${variable}`);
            }
        }

        // Validate that the selected product exists in the dataset
        if (!datasetConfig.products[selectedProduct]) {
            throw new Error(`Product ${selectedProduct} not found in dataset ${datasetConfig.name || 'hrrr'}`);
        }

        // Generate file URL using datasource configuration
        const fileUrl = generateHRRRFileURL(selectedProduct, timestamp, 'hrrr-operational');

        // Fetch file
        const fileBuffer = await fetchHRRRFile(fileUrl);

        // Debug: Check file content before parsing
        console.log(`Fetched ${fileBuffer.byteLength} bytes for ${selectedProduct}`);
        
        // If parse=false, return raw data without any parsing
        if (!shouldParse) {
            console.log(`Parse flag set to false, returning raw GRIB2 data without parsing`);
            
            // Get product format from datasource
            const productConfig = datasetConfig.products[selectedProduct];
            const fileFormat = productConfig.format;
            
            return {
                variable: variable,
                bbox: bbox,
                timestamp: timestamp.toISOString(),
                rawData: {
                    buffer: fileBuffer,
                    size: fileBuffer.byteLength,
                    format: fileFormat,
                    url: fileUrl
                },
                metadata: {
                    units: variableMeta.units,
                    longName: variableMeta.longName,
                    product: selectedProduct,
                    source: 'HRRR',
                    fileUrl: fileUrl,
                    format: fileFormat,
                    forecastHour: forecastHour,
                    resolution: '3km',
                    bbox: bbox,
                    grib2Parameter: variableMeta.grib2Code,
                    parsed: false,
                    notes: 'Raw GRIB2 data - use worker pool for parsing'
                }
            };
        }

        // Continue with parsing if parse=true (default behavior)
        const grib2Lib = await loadGRIB2Library();

        // Get product format from datasource
        const productConfig = datasetConfig.products[selectedProduct];
        const fileFormat = productConfig.format;

        let parsedData;
        if (fileFormat === 'grib2') {
            try {
                // Parse GRIB2 file with memory optimization
                const parseOptions = {
                    maxMessages: 10, // Limit to 10 messages for HRRR to reduce memory usage
                    targetVariable: variable, // Look for specific variable
                    memoryLimit: 200 * 1024 * 1024 // 200MB limit for HRRR files
                };
                
                console.log(`Parsing GRIB2 file (${(fileBuffer.byteLength / 1024 / 1024).toFixed(1)} MB) with memory optimization...`);
                parsedData = await grib2Lib.parse(fileBuffer, parseOptions);
                console.log('✓ GRIB2 parsing successful');
            } catch (grib2Error) {
                console.error('GRIB2 parsing failed:', grib2Error.message);
                throw new Error(`GRIB2 parsing failed: ${grib2Error.message}`);
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
        }

        // Apply scaling to all grid values (handle 2D grid properly)
        let scaledGrid;
        if (fileFormat === 'grib2') {
            // extractedData.data.values is a 2D array [rows][cols]
            scaledGrid = extractedData.data.values.map(row => {
                return row.map(value => {
                    if (value === undefined || value === null || isNaN(value)) {
                        console.warn(`Invalid value found in grid data, using default`);
                        value = 0;
                    }
                    return applyHRRRScaling(value, variableMeta);
                });
            });
        } else {
            scaledGrid = extractedData.data?.values || [];
        }

        // Build metadata based on file format
        const metadata = {
            units: variableMeta.units,
            longName: variableMeta.longName,
            product: selectedProduct,
            source: 'HRRR',
            fileUrl: fileUrl,
            format: fileFormat,
            forecastHour: forecastHour,
            resolution: '3km',
            bbox: bbox
        };

        // Add GRIB2-specific metadata only for GRIB2 files
        if (fileFormat === 'grib2' && variableMeta.grib2Code) {
            metadata.grib2Parameter = variableMeta.grib2Code;
        }

        // Build the final result in the expected format
        const result = {
            variable: variable,
            bbox: bbox,
            timestamp: timestamp.toISOString(),
            data: {
                values: scaledGrid,
                shape: [scaledGrid.length, scaledGrid[0]?.length || 0],
                coordinates: extractedData.data.coordinates || {
                    latitude: [],
                    longitude: [],
                    bounds: {
                        north: north,
                        south: south,
                        east: east,
                        west: west
                    }
                }
            },
            metadata: {
                ...metadata,
                ...extractedData.metadata,
                originalShape: extractedData.metadata?.originalShape || [scaledGrid.length, scaledGrid[0]?.length || 0],
                subsetShape: extractedData.metadata?.subsetShape || [scaledGrid.length, scaledGrid[0]?.length || 0],
                spatialResolution: extractedData.metadata?.spatialResolution || 0.03,
                coordinateSystem: extractedData.metadata?.coordinateSystem || 'EPSG:4326'
            }
        };

        console.log(`✓ HRRR grid extraction complete: ${result.data.shape[0]}x${result.data.shape[1]} grid`);
        console.log(`Sample values: [${result.data.values[0]?.slice(0, 3).join(', ')}...]`);

        return result;

    } catch (error) {
        console.error(`Failed to extract HRRR grid data: ${error.message}`);
        throw new Error(`HRRR grid data extraction failed: ${error.message}`);
    }
}

/**
 * Extract time series data from HRRR GRIB2 files
 * @param {string} variable - Variable name
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @param {Object} datasetConfig - HRRR dataset configuration
 * @param {Object} hrrrVariables - HRRR variables configuration
 * @param {string} product - Specific HRRR product to use (optional)
 * @returns {Promise<Object>} Time series data
 */
export async function extractHRRRTimeSeries(variable, latitude, longitude, startTime, endTime, datasetConfig, hrrrVariables, product = null) {
    console.log(`Extracting HRRR ${variable} time series at (${latitude}, ${longitude})`);

    try {
        const timeSeries = [];
        let currentTime = new Date(startTime);

        // HRRR has hourly forecasts, so iterate by hour
        while (currentTime <= endTime) {
            try {
                // For time series, we want analysis (forecast hour 0) or forecast data
                const pointData = await extractHRRRPointData(variable, latitude, longitude, currentTime, datasetConfig, hrrrVariables, product, 0);

                timeSeries.push({
                    timestamp: currentTime.toISOString(),
                    value: pointData.value,
                    forecastHour: 0
                });

            } catch (timeError) {
                console.warn(`Failed to get HRRR data for ${currentTime.toISOString()}: ${timeError.message}`);
                timeSeries.push({
                    timestamp: currentTime.toISOString(),
                    value: null,
                    error: timeError.message
                });
            }

            // Move to next hour
            currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
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
                source: 'HRRR',
                temporalResolution: '1H',
                count: timeSeries.length,
                validCount: timeSeries.filter(d => d.value !== null).length,
                forecastHours: [0] // Analysis data
            }
        };

    } catch (error) {
        console.error(`Failed to extract HRRR time series: ${error.message}`);
        throw new Error(`HRRR time series extraction failed: ${error.message}`);
    }
}

/**
 * Find the appropriate HRRR product for a given variable
 * @param {string} variable - Variable name
 * @param {Object} datasetConfig - HRRR dataset configuration
 * @param {Object} hrrrVariables - HRRR variables configuration
 * @returns {string|null} HRRR product name
 */
async function findHRRRProductForVariable(variable, datasetConfig, hrrrVariables) {
    const variableMeta = hrrrVariables[variable];

    // If variable not found, try to map to a known variable
    if (!variableMeta) {
        console.warn(`Variable ${variable} not found, trying to map to known variable`);
        // Map common variable names to HRRR variables
        const variableMap = {
            'temperature': 'TMP',
            'temp': 'TMP',
            'dewpoint': 'DPT',
            'precipitation': 'APCP',
            'precip': 'APCP',
            'wind_speed': 'WIND',
            'wind_direction': 'WDIR',
            'u_wind': 'UGRD',
            'v_wind': 'VGRD',
            'pressure': 'PRMSL',
            'visibility': 'VIS',
            'cloud_cover': 'TCDC',
            'reflectivity': 'REF'
        };
        const mappedVariable = variableMap[variable.toLowerCase()] || 'TMP'; // Default to temperature
        console.log(`Mapped ${variable} to ${mappedVariable}`);
        return await findHRRRProductForVariable(mappedVariable, datasetConfig, hrrrVariables);
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
 * Apply HRRR-specific scaling to data values
 * @param {number} value - Raw data value
 * @param {Object} variableMeta - Variable metadata
 * @returns {number} Scaled value
 */
function applyHRRRScaling(value, variableMeta) {
    if (value === null || value === undefined || value === variableMeta.fillValue) {
        return null;
    }

    const scaleFactor = variableMeta.scaleFactor || 1.0;
    const addOffset = variableMeta.addOffset || 0.0;

    return value * scaleFactor + addOffset;
}

/**
 * Get available HRRR variables
 * @returns {Array} List of available variables
 */
export function getAvailableHRRRVariables() {
    return [
        'TMP', 'DPT', 'RH', 'APCP', 'PRATE',
        'UGRD', 'VGRD', 'WIND', 'WDIR',
        'VIS', 'TCDC', 'HGT', 'REFC'
    ];
}

/**
 * Validate HRRR configuration
 * @param {Object} config - HRRR configuration
 * @returns {boolean} True if valid
 */
export function validateHRRRConfig(config) {
    const required = ['baseUrl', 'spatial', 'temporal'];

    for (const field of required) {
        if (!config[field]) {
            console.error(`HRRR config missing required field: ${field}`);
            return false;
        }
    }

    // Validate spatial bounds
    const { spatial } = config;
    if (!spatial.latitude || !spatial.longitude) {
        console.error('HRRR config missing spatial latitude/longitude bounds');
        return false;
    }

    return true;
}

/**
 * Get HRRR dataset information and metadata
 * @param {Object} datasetConfig - HRRR dataset configuration
 * @param {string} infoType - Type of information requested
 * @param {Object} hrrrVariables - HRRR variables configuration
 * @returns {Object} Dataset information
 */
export async function getHRRRDatasetInfo(datasetConfig, infoType, hrrrVariables) {
    switch (infoType) {
        case 'variables':
            return {
                variables: hrrrVariables,
                count: Object.keys(hrrrVariables).length
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
                variables: hrrrDatasource['hrrr-operational'].variables
            };

        default:
            throw new Error(`Unknown HRRR info type: ${infoType}`);
    }
}
