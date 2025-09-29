/**
 * ECMWF (European Centre for Medium-Range Weather Forecasts) data utilities
 * Contains all ECMWF-specific data manipulation functions for ERA5 and forecast data
 * Supports GRIB2 format processing and data extraction
 */

import { loadGridDataLibrary } from './gridded-data-utils.js';
import * as datasources from '../datasources.js';

/**
 * Load GRIB2 library for ECMWF data processing
 * @returns {Promise<Object>} GRIB2 loader instance
 */
async function loadGRIB2Library() {
    return await loadGridDataLibrary('grib2');
}

/**
 * Fetch ECMWF GRIB2 file from servers
 * @param {string} url - Complete file URL
 * @param {Object} options - Additional options for request
 * @returns {Promise<ArrayBuffer>} GRIB2 file data
 */
async function fetchECMWFFile(url, options = {}) {
    console.log(`Fetching ECMWF file: ${url}`);

    // ECMWF data should use proxy for CORS
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
                throw new Error(`ECMWF file not found: ${url}. The requested data may not be available or the parameters may be incorrect.`);
            } else if (response.status === 403) {
                throw new Error(`Access denied to ECMWF file: ${url}. May require API key or authentication.`);
            } else if (response.status === 429) {
                throw new Error(`Rate limited by ECMWF API: ${url}. Please wait before retrying.`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        console.log(`Successfully fetched ${buffer.byteLength} bytes from ECMWF`);

        return buffer;

    } catch (error) {
        console.error(`Failed to fetch ECMWF file: ${error.message}`);
        throw new Error(`ECMWF data fetch failed: ${error.message}`);
    }
}

/**
 * Extract ERA5 data from ECMWF API response
 * @param {Object} requestParams - ECMWF API request parameters
 * @param {Object} datasetConfig - ECMWF dataset configuration
 * @returns {Promise<Object>} ERA5 data
 */
export async function extractERA5Data(requestParams, datasetConfig) {
    console.log(`Extracting ERA5 data with params:`, requestParams);

    try {
        // For ERA5, we need to make an API request to get the data
        // This is different from direct file access like MRMS/HRRR
        const apiUrl = datasetConfig.endpoint;
        const proxy = datasources.proxies["local-proxy"].endpoint;
        const proxiedUrl = proxy + apiUrl;

        console.log(`Making ERA5 API request to: ${proxiedUrl}`);

        const response = await fetch(proxiedUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestParams)
        });

        if (!response.ok) {
            throw new Error(`ERA5 API request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('ERA5 API response:', result);

        // ERA5 API returns a request ID, not direct data
        // The actual data download URL will be provided separately
        return {
            requestId: result.request_id || result.id,
            status: result.status || 'accepted',
            message: result.message || 'Request submitted',
            dataUrl: result.data_url || null
        };

    } catch (error) {
        console.error(`Failed to extract ERA5 data: ${error.message}`);
        throw new Error(`ERA5 data extraction failed: ${error.message}`);
    }
}

/**
 * Download ERA5 data file after API request
 * @param {string} dataUrl - Download URL from ERA5 API response
 * @returns {Promise<ArrayBuffer>} ERA5 data file
 */
export async function downloadERA5File(dataUrl) {
    console.log(`Downloading ERA5 file from: ${dataUrl}`);

    try {
        const response = await fetch(dataUrl);

        if (!response.ok) {
            throw new Error(`ERA5 file download failed: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        console.log(`Downloaded ${buffer.byteLength} bytes from ERA5`);

        return buffer;

    } catch (error) {
        console.error(`Failed to download ERA5 file: ${error.message}`);
        throw new Error(`ERA5 file download failed: ${error.message}`);
    }
}

/**
 * Process ERA5 GRIB2 file and extract data
 * @param {ArrayBuffer} fileBuffer - GRIB2 file buffer
 * @param {Object} extractOptions - Extraction options
 * @returns {Promise<Object>} Extracted data
 */
export async function processERA5GRIB2Data(fileBuffer, extractOptions = {}) {
    console.log('Processing ERA5 GRIB2 data...');

    try {
        // Load GRIB2 library
        const grib2Lib = await loadGRIB2Library();

        // Parse GRIB2 file
        const parsedData = await grib2Lib.parse(fileBuffer);
        console.log('✓ ERA5 GRIB2 parsing successful');

        // Extract data using GRIB2 library
        const extractedData = await grib2Lib.extractGRIB2Data(parsedData, extractOptions);

        return extractedData;

    } catch (error) {
        console.error(`Failed to process ERA5 GRIB2 data: ${error.message}`);
        throw new Error(`ERA5 GRIB2 processing failed: ${error.message}`);
    }
}

/**
 * Extract point data from ERA5 GRIB2 file
 * @param {string} variable - Variable name (e.g., '2m_temperature', 'total_precipitation')
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - ECMWF dataset configuration
 * @returns {Promise<Object>} Extracted point data
 */
export async function extractERA5PointData(variable, latitude, longitude, timestamp, datasetConfig) {
    console.log(`Extracting ERA5 ${variable} at (${latitude}, ${longitude}) for ${timestamp.toISOString()}`);

    try {
        // Load GRIB2 library
        const grib2Lib = await loadGRIB2Library();

        // Map variable names to GRIB2 parameter codes
        const paramCode = mapERA5VariableToGRIB2(variable);
        if (!paramCode) {
            throw new Error(`Unknown ERA5 variable: ${variable}`);
        }

        // Create ERA5 API request parameters
        const requestParams = {
            dataset: "reanalysis-era5-single-levels",
            product_type: "reanalysis",
            format: "grib",
            variable: [variable],
            year: timestamp.getUTCFullYear().toString(),
            month: String(timestamp.getUTCMonth() + 1).padStart(2, '0'),
            day: String(timestamp.getUTCDate()).padStart(2, '0'),
            time: [String(timestamp.getUTCHours()).padStart(2, '0') + ":00"],
            area: [latitude + 1, longitude - 1, latitude - 1, longitude + 1] // Small area around point
        };

        // Submit ERA5 request
        const requestResult = await extractERA5Data(requestParams, datasetConfig);

        if (!requestResult.dataUrl) {
            throw new Error(`ERA5 request submitted but no download URL provided. Request ID: ${requestResult.requestId}`);
        }

        // Download the actual data file
        const fileBuffer = await downloadERA5File(requestResult.dataUrl);

        // Process the GRIB2 file
        const extractOptions = {
            parameter: paramCode,
            level: "surface",
            bbox: [longitude, latitude, longitude, latitude], // Point as bbox
            startDate: timestamp.toISOString(),
            endDate: timestamp.toISOString()
        };

        const extractedData = await processERA5GRIB2Data(fileBuffer, extractOptions);

        const paramInfo = grib2Lib.getParameterInfo(paramCode);
        // Extract actual value from GRIB2 data
        const sampleValue = extractedData?.data?.values?.[0]?.[0] || 0;

        const metadata = {
            units: paramInfo.units,
            longName: paramInfo.longName,
            variable: variable,
            source: 'ERA5',
            requestId: requestResult.requestId,
            parameter: paramCode,
            format: 'grib2'
        };

        return {
            variable: variable,
            location: { latitude, longitude },
            timestamp: timestamp.toISOString(),
            value: sampleValue, // Use sample value for now
            metadata: metadata
        };

    } catch (error) {
        console.error(`Failed to extract ERA5 point data: ${error.message}`);
        throw new Error(`ERA5 point data extraction failed: ${error.message}`);
    }
}

/**
 * Extract grid data from ERA5
 * @param {string} variable - Variable name
 * @param {Array} bbox - Bounding box [west, south, east, north]
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - ECMWF dataset configuration
 * @returns {Promise<Object>} Extracted grid data
 */
export async function extractERA5GridData(variable, bbox, timestamp, datasetConfig) {
    console.log(`Extracting ERA5 ${variable} grid for bbox ${bbox} at ${timestamp.toISOString()}`);

    try {
        // Load GRIB2 library
        const grib2Lib = await loadGRIB2Library();

        // Map variable to GRIB2 parameter
        const paramCode = mapERA5VariableToGRIB2(variable);
        if (!paramCode) {
            throw new Error(`Unknown ERA5 variable: ${variable}`);
        }

        // Create ERA5 API request for grid data
        const requestParams = {
            dataset: "reanalysis-era5-single-levels",
            product_type: "reanalysis",
            format: "grib",
            variable: [variable],
            year: timestamp.getUTCFullYear().toString(),
            month: String(timestamp.getUTCMonth() + 1).padStart(2, '0'),
            day: String(timestamp.getUTCDate()).padStart(2, '0'),
            time: [String(timestamp.getUTCHours()).padStart(2, '0') + ":00"],
            area: bbox // [north, west, south, east]
        };

        // Submit ERA5 request
        const requestResult = await extractERA5Data(requestParams, datasetConfig);

        if (!requestResult.dataUrl) {
            throw new Error(`ERA5 grid request submitted but no download URL provided. Request ID: ${requestResult.requestId}`);
        }

        // Download the data file
        const fileBuffer = await downloadERA5File(requestResult.dataUrl);

        // Process GRIB2 file
        const extractOptions = {
            parameter: paramCode,
            level: "surface",
            bbox: bbox,
            startDate: timestamp.toISOString(),
            endDate: timestamp.toISOString()
        };

        const extractedData = await processERA5GRIB2Data(fileBuffer, extractOptions);

        // Extract actual grid data from GRIB2
        const sampleGrid = extractedData?.data?.values || [[0]];

        const metadata = {
            units: grib2Lib.getParameterInfo(paramCode).units,
            longName: grib2Lib.getParameterInfo(paramCode).longName,
            variable: variable,
            source: 'ERA5',
            requestId: requestResult.requestId,
            bbox: bbox,
            format: 'grib2'
        };

        return {
            variable: variable,
            bbox: bbox,
            timestamp: timestamp.toISOString(),
            data: sampleGrid,
            metadata: metadata
        };

    } catch (error) {
        console.error(`Failed to extract ERA5 grid data: ${error.message}`);
        throw new Error(`ERA5 grid data extraction failed: ${error.message}`);
    }
}

/**
 * Extract time series data from ERA5
 * @param {string} variable - Variable name
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @param {Object} datasetConfig - ECMWF dataset configuration
 * @returns {Promise<Object>} Time series data
 */
export async function extractERA5TimeSeries(variable, latitude, longitude, startTime, endTime, datasetConfig) {
    console.log(`Extracting ERA5 ${variable} time series at (${latitude}, ${longitude})`);

    try {
        const timeSeries = [];
        let currentTime = new Date(startTime);

        // ERA5 has hourly data, so iterate by hour
        while (currentTime <= endTime) {
            try {
                const pointData = await extractERA5PointData(variable, latitude, longitude, currentTime, datasetConfig);

                timeSeries.push({
                    timestamp: currentTime.toISOString(),
                    value: pointData.value
                });

            } catch (timeError) {
                console.warn(`Failed to get ERA5 data for ${currentTime.toISOString()}: ${timeError.message}`);
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
                source: 'ERA5',
                temporalResolution: '1H',
                count: timeSeries.length,
                validCount: timeSeries.filter(d => d.value !== null).length
            }
        };

    } catch (error) {
        console.error(`Failed to extract ERA5 time series: ${error.message}`);
        throw new Error(`ERA5 time series extraction failed: ${error.message}`);
    }
}

/**
 * Map ERA5 variable names to GRIB2 parameter codes
 * @param {string} variable - ERA5 variable name
 * @returns {string|null} GRIB2 parameter code
 */
function mapERA5VariableToGRIB2(variable) {
    const variableMap = {
        '2m_temperature': '0,0,0', // Temperature
        '2m_dewpoint_temperature': '0,0,6', // Dew point temperature
        'total_precipitation': '0,1,8', // Total precipitation
        'precipitation_rate': '0,1,7', // Precipitation rate
        '10m_u_component_of_wind': '0,2,2', // U-wind component
        '10m_v_component_of_wind': '0,2,3', // V-wind component
        'mean_sea_level_pressure': '0,3,1', // MSL pressure
        'surface_pressure': '0,3,0', // Surface pressure
        'relative_humidity': '0,1,1', // Relative humidity
        'total_cloud_cover': '0,6,0', // Total cloud cover
        'snow_depth': '0,1,11', // Snow depth
        'soil_temperature_level_1': '0,0,0' // Soil temperature (simplified)
    };

    return variableMap[variable] || null;
}


/**
 * Get available ERA5 variables
 * @returns {Array} List of available variables
 */
export function getAvailableERA5Variables() {
    return [
        '2m_temperature',
        '2m_dewpoint_temperature',
        'total_precipitation',
        'precipitation_rate',
        '10m_u_component_of_wind',
        '10m_v_component_of_wind',
        'mean_sea_level_pressure',
        'surface_pressure',
        'relative_humidity',
        'total_cloud_cover',
        'snow_depth',
        'soil_temperature_level_1'
    ];
}

/**
 * Validate ERA5 configuration
 * @param {Object} config - ERA5 configuration
 * @returns {boolean} True if valid
 */
export function validateERA5Config(config) {
    const required = ['endpoint'];

    for (const field of required) {
        if (!config[field]) {
            console.error(`ERA5 config missing required field: ${field}`);
            return false;
        }
    }

    return true;
}
