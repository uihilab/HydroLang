/**
 * PRISM (Parameter-elevation Relationships on Independent Slopes Model) data utilities
 * Contains all PRISM-specific data manipulation functions for GeoTIFF and BIL format processing
 * Supports point data extraction, grid data extraction, and time series analysis
 */

import { loadGridDataLibrary } from './gridded-data-utils.js';
import * as datasources from '../datasources.js';
import { generatePRISMFileURL, formatPRISMTimePeriod, determinePRISMRegion, validatePRISMVariable, getRecommendedPRISMResolution } from '../datasources/prism.js';

/**
 * Fetch PRISM data file from Oregon State University servers
 * @param {string} url - Complete file URL
 * @param {Object} options - Additional options for request
 * @returns {Promise<ArrayBuffer>} PRISM file data (zip containing GeoTIFF/BIL)
 */
async function fetchPRISMFile(url, options = {}) {
    console.log(`Fetching PRISM file: ${url}`);

    // Try proxy first for CORS
    const proxy = datasources.proxies["local-proxy"]?.endpoint;
    if (!proxy) {
        throw new Error('CORS proxy not available. Please check proxy configuration.');
    }
    const proxiedUrl = proxy + url;

    console.log(`Using proxy: ${proxiedUrl}`);

    try {
        const response = await fetch(proxiedUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/zip, application/octet-stream, */*',
                ...options.headers
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`PRISM file not found: ${url}. The requested data may not be available for this time period.`);
            } else if (response.status === 403) {
                throw new Error(`Access denied to PRISM file: ${url}.`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        console.log(`Successfully fetched ${buffer.byteLength} bytes from PRISM`);

        return buffer;

    } catch (error) {
        console.error(`Failed to fetch PRISM file: ${error.message}`);
        
        // Provide specific guidance for CORS issues
        if (error.message.includes('CORS') || error.message.includes('blocked')) {
            console.error('CORS Error Details:');
            console.error('Original URL:', url);
            console.error('Proxied URL:', proxiedUrl);
            console.error('PRISM server appears to have strict CORS policies that prevent access even through proxy.');
            
            // Suggest alternative approaches
            console.warn('Potential solutions:');
            console.warn('1. Use a server-side proxy or backend API');
            console.warn('2. Contact PRISM team about CORS support');
            console.warn('3. Download data manually and process locally');
            
            throw new Error(`PRISM CORS error: The Oregon State University PRISM server does not allow cross-origin requests. Please use a server-side solution or contact your system administrator.`);
        }
        
        throw new Error(`PRISM data fetch failed: ${error.message}`);
    }
}

/**
 * Extract and decompress PRISM zip file to get GeoTIFF/BIL data
 * @param {ArrayBuffer} zipBuffer - Zip file buffer
 * @param {string} fileFormat - Expected format ('tif' or 'bil')
 * @returns {Promise<Object>} Extracted file data and metadata
 */
async function extractPRISMZipFile(zipBuffer, fileFormat = 'tif') {
    console.log(`Extracting PRISM zip file (${(zipBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);

    try {
        // Load geospatial libraries for zip extraction
        if (!window.JSZip) {
            await loadGridDataLibrary('geospatial');
        }

        const JSZip = window.JSZip;
        if (!JSZip) {
            throw new Error('JSZip library not available for zip extraction');
        }

        const zip = await JSZip.loadAsync(zipBuffer);
        const files = Object.keys(zip.files);
        
        console.log(`Zip contains ${files.length} files:`, files);

        // Find the main data file (GeoTIFF or BIL)
        const dataExtension = fileFormat === 'tif' ? '.tif' : '.bil';
        const dataFile = files.find(name => name.toLowerCase().endsWith(dataExtension));
        
        if (!dataFile) {
            throw new Error(`No ${dataExtension} file found in PRISM zip archive`);
        }

        console.log(`Extracting main data file: ${dataFile}`);
        const dataBuffer = await zip.files[dataFile].async('arraybuffer');

        // Extract metadata files
        const metadata = {};
        
        // Extract .prj file (projection)
        const prjFile = files.find(name => name.toLowerCase().endsWith('.prj'));
        if (prjFile) {
            metadata.projection = await zip.files[prjFile].async('string');
        }

        // Extract .stx file (statistics)
        const stxFile = files.find(name => name.toLowerCase().endsWith('.stx'));
        if (stxFile) {
            metadata.statistics = await zip.files[stxFile].async('string');
        }

        // Extract .xml file (FGDC metadata)
        const xmlFile = files.find(name => name.toLowerCase().endsWith('.xml') && !name.includes('aux'));
        if (xmlFile) {
            metadata.fgdcMetadata = await zip.files[xmlFile].async('string');
        }

        // Extract .hdr file (for BIL format)
        if (fileFormat === 'bil') {
            const hdrFile = files.find(name => name.toLowerCase().endsWith('.hdr'));
            if (hdrFile) {
                metadata.header = await zip.files[hdrFile].async('string');
            }
        }

        console.log(`Extracted ${dataFile}: ${(dataBuffer.byteLength / 1024 / 1024).toFixed(1)} MB`);

        return {
            dataBuffer,
            metadata,
            filename: dataFile,
            format: fileFormat
        };

    } catch (error) {
        console.error('Failed to extract PRISM zip file:', error.message);
        throw new Error(`PRISM zip extraction failed: ${error.message}`);
    }
}

/**
 * Process PRISM GeoTIFF data using geospatial libraries
 * @param {ArrayBuffer} tiffBuffer - GeoTIFF data buffer
 * @param {Object} metadata - Extracted metadata
 * @param {Array} bbox - Bounding box for spatial subsetting [west, south, east, north]
 * @returns {Promise<Object>} Processed PRISM data
 */
async function processPRISMGeoTIFF(tiffBuffer, metadata, bbox = null) {
    console.log(`Processing PRISM GeoTIFF (${(tiffBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);

    try {
        // Ensure geospatial libraries are loaded
        await loadGridDataLibrary('geospatial');

        const GeoTIFF = window.GeoTIFF || window.geotiff || window.GeoTiff;
        const proj4 = window.proj4;

        if (!GeoTIFF || !proj4) {
            throw new Error(`Failed to load required geospatial libraries. GeoTIFF=${!!GeoTIFF}, proj4=${!!proj4}`);
        }

        // Read the GeoTIFF
        const tiff = await GeoTIFF.fromArrayBuffer(tiffBuffer);
        const image = await tiff.getImage();

        // Get GeoTIFF metadata
        const tiffMetadata = {
            width: image.getWidth(),
            height: image.getHeight(),
            origin: image.getOrigin(),
            resolution: image.getResolution(),
            boundingBox: image.getBoundingBox(),
            noDataValue: image.getGDALNoData()
        };

        console.log("PRISM GeoTIFF metadata:", tiffMetadata);

        // Read raster data
        const rasterData = await image.readRasters();
        const values = rasterData[0]; // First (and only) band

        // Create 2D array structure
        const values2D = [];
        for (let row = 0; row < tiffMetadata.height; row++) {
            const rowData = [];
            for (let col = 0; col < tiffMetadata.width; col++) {
                const index = row * tiffMetadata.width + col;
                let value = values[index];
                
                // Handle no-data values
                if (value === tiffMetadata.noDataValue || !Number.isFinite(value)) {
                    value = null;
                }
                
                rowData.push(value);
            }
            values2D.push(rowData);
        }

        // Calculate data statistics
        const validValues = values.filter(v => v !== tiffMetadata.noDataValue && Number.isFinite(v));
        const stats = {
            min: Math.min(...validValues),
            max: Math.max(...validValues),
            mean: validValues.reduce((a, b) => a + b, 0) / validValues.length,
            count: validValues.length,
            noDataCount: values.length - validValues.length
        };

        console.log("PRISM data statistics:", stats);

        // Generate coordinate arrays
        const [minX, minY, maxX, maxY] = tiffMetadata.boundingBox;
        const pixelWidth = (maxX - minX) / tiffMetadata.width;
        const pixelHeight = (maxY - minY) / tiffMetadata.height;

        const longitudes = [];
        const latitudes = [];

        for (let col = 0; col < tiffMetadata.width; col++) {
            longitudes.push(minX + (col + 0.5) * pixelWidth);
        }

        for (let row = 0; row < tiffMetadata.height; row++) {
            // GeoTIFF origin is typically top-left, so we need to flip for bottom-up latitude
            latitudes.push(maxY - (row + 0.5) * pixelHeight);
        }

        // Apply spatial subsetting if bbox provided
        let subsetData = values2D;
        let subsetCoords = { latitude: latitudes, longitude: longitudes };
        let subsetBounds = { north: maxY, south: minY, east: maxX, west: minX };

        if (bbox) {
            const [west, south, east, north] = bbox;
            
            // Find indices for subsetting
            const startCol = Math.max(0, longitudes.findIndex(lon => lon >= west));
            const endCol = Math.min(longitudes.length - 1, longitudes.length - 1 - [...longitudes].reverse().findIndex(lon => lon <= east));
            const startRow = Math.max(0, latitudes.findIndex(lat => lat <= north));
            const endRow = Math.min(latitudes.length - 1, latitudes.length - 1 - [...latitudes].reverse().findIndex(lat => lat >= south));

            console.log(`Spatial subsetting: rows ${startRow}-${endRow}, cols ${startCol}-${endCol}`);

            // Extract subset
            subsetData = values2D.slice(startRow, endRow + 1).map(row => row.slice(startCol, endCol + 1));
            subsetCoords = {
                latitude: latitudes.slice(startRow, endRow + 1),
                longitude: longitudes.slice(startCol, endCol + 1)
            };
            subsetBounds = {
                north: latitudes[startRow],
                south: latitudes[endRow],
                east: longitudes[endCol],
                west: longitudes[startCol]
            };
        }

        return {
            success: true,
            data: {
                values: subsetData,
                coordinates: subsetCoords,
                shape: [subsetData.length, subsetData[0]?.length || 0],
                bounds: subsetBounds
            },
            metadata: {
                ...tiffMetadata,
                statistics: stats,
                originalShape: [tiffMetadata.height, tiffMetadata.width],
                subsetShape: [subsetData.length, subsetData[0]?.length || 0],
                projection: metadata.projection || 'Unknown',
                pixelSize: { width: pixelWidth, height: pixelHeight },
                dataType: 'float32',
                format: 'GeoTIFF',
                source: 'PRISM'
            }
        };

    } catch (error) {
        console.error('Failed to process PRISM GeoTIFF:', error.message);
        throw new Error(`PRISM GeoTIFF processing failed: ${error.message}`);
    }
}

/**
 * Process PRISM BIL (Binary Interleaved by Line) data
 * @param {ArrayBuffer} bilBuffer - BIL data buffer
 * @param {Object} metadata - Extracted metadata including header
 * @param {Array} bbox - Bounding box for spatial subsetting
 * @returns {Promise<Object>} Processed PRISM data
 */
async function processPRISMBIL(bilBuffer, metadata, bbox = null) {
    console.log(`Processing PRISM BIL format (${(bilBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);

    try {
        // Parse header file to get BIL parameters
        if (!metadata.header) {
            throw new Error('BIL header file (.hdr) is required for processing');
        }

        const header = parseBILHeader(metadata.header);
        console.log("BIL header parameters:", header);

        // Read binary data
        const dataView = new DataView(bilBuffer);
        const values = [];

        // Read values based on data type
        let bytesPerValue;
        let readValue;

        switch (header.pixeltype.toLowerCase()) {
            case 'float32':
                bytesPerValue = 4;
                readValue = (offset) => dataView.getFloat32(offset, true); // little-endian
                break;
            case 'float64':
                bytesPerValue = 8;
                readValue = (offset) => dataView.getFloat64(offset, true);
                break;
            case 'signedint':
                bytesPerValue = header.nbits / 8;
                readValue = bytesPerValue === 2 ? 
                    (offset) => dataView.getInt16(offset, true) :
                    (offset) => dataView.getInt32(offset, true);
                break;
            default:
                throw new Error(`Unsupported BIL pixel type: ${header.pixeltype}`);
        }

        // Read all values
        for (let i = 0; i < header.nrows * header.ncols; i++) {
            const offset = i * bytesPerValue;
            let value = readValue(offset);
            
            // Handle no-data values
            if (value === header.nodata || !Number.isFinite(value)) {
                value = null;
            }
            
            values.push(value);
        }

        // Convert to 2D array
        const values2D = [];
        for (let row = 0; row < header.nrows; row++) {
            const rowData = [];
            for (let col = 0; col < header.ncols; col++) {
                const index = row * header.ncols + col;
                rowData.push(values[index]);
            }
            values2D.push(rowData);
        }

        // Generate coordinate arrays
        const longitudes = [];
        const latitudes = [];

        for (let col = 0; col < header.ncols; col++) {
            longitudes.push(header.ulxmap + (col + 0.5) * header.xdim);
        }

        for (let row = 0; row < header.nrows; row++) {
            latitudes.push(header.ulymap - (row + 0.5) * header.ydim);
        }

        // Calculate statistics
        const validValues = values.filter(v => v !== null);
        const stats = {
            min: Math.min(...validValues),
            max: Math.max(...validValues),
            mean: validValues.reduce((a, b) => a + b, 0) / validValues.length,
            count: validValues.length,
            noDataCount: values.length - validValues.length
        };

        console.log("PRISM BIL statistics:", stats);

        // Apply spatial subsetting if bbox provided
        let subsetData = values2D;
        let subsetCoords = { latitude: latitudes, longitude: longitudes };

        if (bbox) {
            const [west, south, east, north] = bbox;
            
            const startCol = Math.max(0, longitudes.findIndex(lon => lon >= west));
            const endCol = Math.min(longitudes.length - 1, longitudes.length - 1 - [...longitudes].reverse().findIndex(lon => lon <= east));
            const startRow = Math.max(0, latitudes.findIndex(lat => lat <= north));
            const endRow = Math.min(latitudes.length - 1, latitudes.length - 1 - [...latitudes].reverse().findIndex(lat => lat >= south));

            subsetData = values2D.slice(startRow, endRow + 1).map(row => row.slice(startCol, endCol + 1));
            subsetCoords = {
                latitude: latitudes.slice(startRow, endRow + 1),
                longitude: longitudes.slice(startCol, endCol + 1)
            };
        }

        return {
            success: true,
            data: {
                values: subsetData,
                coordinates: subsetCoords,
                shape: [subsetData.length, subsetData[0]?.length || 0]
            },
            metadata: {
                header: header,
                statistics: stats,
                originalShape: [header.nrows, header.ncols],
                subsetShape: [subsetData.length, subsetData[0]?.length || 0],
                projection: metadata.projection || header.map_info || 'Unknown',
                pixelSize: { width: header.xdim, height: header.ydim },
                dataType: header.pixeltype,
                format: 'BIL',
                source: 'PRISM'
            }
        };

    } catch (error) {
        console.error('Failed to process PRISM BIL:', error.message);
        throw new Error(`PRISM BIL processing failed: ${error.message}`);
    }
}

/**
 * Parse BIL header file content
 * @param {string} headerContent - Content of .hdr file
 * @returns {Object} Parsed header parameters
 */
function parseBILHeader(headerContent) {
    const header = {};
    const lines = headerContent.split('\n');
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith(';')) {
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 2) {
                const key = parts[0].toLowerCase();
                const value = parts.slice(1).join(' ');
                
                // Parse numeric values
                if (['nrows', 'ncols', 'nbands', 'nbits'].includes(key)) {
                    header[key] = parseInt(value);
                } else if (['ulxmap', 'ulymap', 'xdim', 'ydim', 'nodata'].includes(key)) {
                    header[key] = parseFloat(value);
                } else {
                    header[key] = value;
                }
            }
        }
    }
    
    return header;
}

/**
 * Extract point data from PRISM dataset
 * @param {string} variable - Variable name (ppt, tmin, etc.)
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - PRISM dataset configuration
 * @param {Object} prismVariables - PRISM variables configuration
 * @param {string} dataType - Data type ('daily', 'monthly', 'normals')
 * @param {string} region - Region override (optional)
 * @param {string} resolution - Resolution override (optional)
 * @returns {Promise<Object>} Extracted point data
 */
export async function extractPRISMPointData(variable, latitude, longitude, timestamp, datasetConfig, prismVariables, dataType = 'daily', region = null, resolution = null) {
    console.log(`Extracting PRISM ${variable} point data at (${latitude}, ${longitude}) for ${timestamp.toISOString()}`);

    try {
        // Validate variable
        if (!prismVariables[variable]) {
            throw new Error(`Unknown PRISM variable: ${variable}`);
        }

        if (!validatePRISMVariable(variable, dataType)) {
            throw new Error(`Variable ${variable} is not available for ${dataType} data`);
        }

        // Determine region and resolution
        const targetRegion = region || determinePRISMRegion([longitude, latitude, longitude, latitude]);
        const targetResolution = resolution || getRecommendedPRISMResolution(targetRegion, dataType, datasetConfig.format);

        // Validate coordinates are within region bounds
        const regionBounds = datasetConfig.spatial[targetRegion];
        if (!regionBounds || 
            latitude < regionBounds.latitude.min || latitude > regionBounds.latitude.max ||
            longitude < regionBounds.longitude.min || longitude > regionBounds.longitude.max) {
            throw new Error(`Coordinates (${latitude}, ${longitude}) are outside ${targetRegion} region bounds`);
        }

        // Format time period
        const timePeriod = formatPRISMTimePeriod(timestamp, dataType);

        // Generate file URL
        const fileUrl = generatePRISMFileURL(variable, targetRegion, targetResolution, timePeriod, datasetConfig.format);
        console.log(`PRISM file URL: ${fileUrl}`);

        // Fetch and process file
        const zipBuffer = await fetchPRISMFile(fileUrl);
        const { dataBuffer, metadata, format } = await extractPRISMZipFile(zipBuffer, datasetConfig.fileFormat);

        // Process based on format
        let processedData;
        if (format === 'tif') {
            // Create small bbox around point for extraction
            const bufferSize = 0.01; // Small buffer around point
            const pointBbox = [longitude - bufferSize, latitude - bufferSize, longitude + bufferSize, latitude + bufferSize];
            processedData = await processPRISMGeoTIFF(dataBuffer, metadata, pointBbox);
        } else {
            processedData = await processPRISMBIL(dataBuffer, metadata);
        }

        // Extract value at point location
        const { data, metadata: processMetadata } = processedData;
        const { coordinates, values } = data;

        // Find nearest grid cell
        const latIndex = coordinates.latitude.reduce((closest, lat, index) => 
            Math.abs(lat - latitude) < Math.abs(coordinates.latitude[closest] - latitude) ? index : closest, 0);
        const lonIndex = coordinates.longitude.reduce((closest, lon, index) => 
            Math.abs(lon - longitude) < Math.abs(coordinates.longitude[closest] - longitude) ? index : closest, 0);

        const extractedValue = values[latIndex] ? values[latIndex][lonIndex] : null;

        // Apply scaling
        const variableMeta = prismVariables[variable];
        const scaledValue = extractedValue !== null ? extractedValue * variableMeta.scaleFactor : null;

        return {
            variable: variable,
            location: { latitude, longitude },
            timestamp: timestamp.toISOString(),
            value: scaledValue,
            metadata: {
                units: variableMeta.units,
                longName: variableMeta.longName,
                dataType: dataType,
                region: targetRegion,
                resolution: targetResolution,
                source: 'PRISM',
                fileUrl: fileUrl,
                format: format,
                gridLocation: {
                    latitude: coordinates.latitude[latIndex],
                    longitude: coordinates.longitude[lonIndex],
                    indices: [latIndex, lonIndex]
                },
                ...processMetadata
            }
        };

    } catch (error) {
        console.error(`Failed to extract PRISM point data: ${error.message}`);
        throw new Error(`PRISM point data extraction failed: ${error.message}`);
    }
}

/**
 * Extract grid data from PRISM dataset
 * @param {string} variable - Variable name
 * @param {Array} bbox - Bounding box [west, south, east, north]
 * @param {Date} timestamp - Data timestamp
 * @param {Object} datasetConfig - PRISM dataset configuration
 * @param {Object} prismVariables - PRISM variables configuration
 * @param {string} dataType - Data type ('daily', 'monthly', 'normals')
 * @param {string} region - Region override (optional)
 * @param {string} resolution - Resolution override (optional)
 * @returns {Promise<Object>} Extracted grid data
 */
export async function extractPRISMGridData(variable, bbox, timestamp, datasetConfig, prismVariables, dataType = 'daily', region = null, resolution = null) {
    console.log(`Extracting PRISM ${variable} grid data for bbox ${bbox} at ${timestamp.toISOString()}`);

    try {
        // Validate variable
        if (!prismVariables[variable]) {
            throw new Error(`Unknown PRISM variable: ${variable}`);
        }

        if (!validatePRISMVariable(variable, dataType)) {
            throw new Error(`Variable ${variable} is not available for ${dataType} data`);
        }

        // Determine region and resolution
        const targetRegion = region || determinePRISMRegion(bbox);
        const targetResolution = resolution || getRecommendedPRISMResolution(targetRegion, dataType, datasetConfig.format);

        // Format time period
        const timePeriod = formatPRISMTimePeriod(timestamp, dataType);

        // Generate file URL
        const fileUrl = generatePRISMFileURL(variable, targetRegion, targetResolution, timePeriod, datasetConfig.format);
        console.log(`PRISM file URL: ${fileUrl}`);

        // Fetch and process file
        const zipBuffer = await fetchPRISMFile(fileUrl);
        const { dataBuffer, metadata, format } = await extractPRISMZipFile(zipBuffer, datasetConfig.fileFormat);

        // Process based on format
        let processedData;
        if (format === 'tif') {
            processedData = await processPRISMGeoTIFF(dataBuffer, metadata, bbox);
        } else {
            processedData = await processPRISMBIL(dataBuffer, metadata, bbox);
        }

        // Apply scaling to all values
        const variableMeta = prismVariables[variable];
        const { data, metadata: processMetadata } = processedData;
        
        const scaledValues = data.values.map(row => 
            row.map(value => value !== null ? value * variableMeta.scaleFactor : null)
        );

        return {
            variable: variable,
            bbox: bbox,
            timestamp: timestamp.toISOString(),
            data: {
                values: scaledValues,
                coordinates: data.coordinates,
                shape: data.shape,
                bounds: data.bounds
            },
            metadata: {
                units: variableMeta.units,
                longName: variableMeta.longName,
                dataType: dataType,
                region: targetRegion,
                resolution: targetResolution,
                source: 'PRISM',
                fileUrl: fileUrl,
                format: format,
                ...processMetadata
            }
        };

    } catch (error) {
        console.error(`Failed to extract PRISM grid data: ${error.message}`);
        throw new Error(`PRISM grid data extraction failed: ${error.message}`);
    }
}

/**
 * Extract time series data from PRISM datasets
 * @param {string} variable - Variable name
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @param {Object} datasetConfig - PRISM dataset configuration
 * @param {Object} prismVariables - PRISM variables configuration
 * @param {string} dataType - Data type ('daily', 'monthly')
 * @param {string} region - Region override (optional)
 * @param {string} resolution - Resolution override (optional)
 * @returns {Promise<Object>} Time series data
 */
export async function extractPRISMTimeSeries(variable, latitude, longitude, startTime, endTime, datasetConfig, prismVariables, dataType = 'daily', region = null, resolution = null) {
    console.log(`Extracting PRISM ${variable} time series at (${latitude}, ${longitude}) from ${startTime.toISOString()} to ${endTime.toISOString()}`);

    try {
        if (!validatePRISMVariable(variable, dataType)) {
            throw new Error(`Variable ${variable} is not available for ${dataType} data`);
        }

        const timeSeries = [];
        let currentTime = new Date(startTime);
        
        // Determine increment based on data type
        const timeIncrement = dataType === 'daily' ? 
            24 * 60 * 60 * 1000 : // 1 day in milliseconds
            30 * 24 * 60 * 60 * 1000; // ~1 month in milliseconds

        while (currentTime <= endTime) {
            try {
                const pointData = await extractPRISMPointData(
                    variable, latitude, longitude, currentTime, 
                    datasetConfig, prismVariables, dataType, region, resolution
                );

                timeSeries.push({
                    timestamp: currentTime.toISOString(),
                    value: pointData.value,
                    metadata: pointData.metadata
                });

            } catch (timeError) {
                console.warn(`Failed to get PRISM data for ${currentTime.toISOString()}: ${timeError.message}`);
                timeSeries.push({
                    timestamp: currentTime.toISOString(),
                    value: null,
                    error: timeError.message
                });
            }

            // Move to next time period
            if (dataType === 'monthly') {
                currentTime.setMonth(currentTime.getMonth() + 1);
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
                source: 'PRISM',
                dataType: dataType,
                temporalResolution: dataType === 'daily' ? '1D' : '1M',
                count: timeSeries.length,
                validCount: timeSeries.filter(d => d.value !== null).length,
                region: region || determinePRISMRegion([longitude, latitude, longitude, latitude]),
                resolution: resolution || getRecommendedPRISMResolution(region, dataType, datasetConfig.format)
            }
        };

    } catch (error) {
        console.error(`Failed to extract PRISM time series: ${error.message}`);
        throw new Error(`PRISM time series extraction failed: ${error.message}`);
    }
}

/**
 * Get available PRISM variables for a specific data type
 * @param {string} dataType - Data type ('normals', 'monthly', 'daily')
 * @returns {Array} List of available variables
 */
export function getAvailablePRISMVariables(dataType = 'daily') {
    // Import variables from datasource to avoid circular dependency
    const prismVariables = {
        "ppt": { availability: ["normals", "monthly", "daily"] },
        "tmin": { availability: ["normals", "monthly", "daily"] },
        "tmean": { availability: ["normals", "monthly", "daily"] },
        "tmax": { availability: ["normals", "monthly", "daily"] },
        "tdmean": { availability: ["normals", "monthly", "daily"] },
        "vpdmin": { availability: ["normals", "monthly", "daily"] },
        "vpdmax": { availability: ["normals", "monthly", "daily"] },
        "solclear": { availability: ["normals"] },
        "soltotal": { availability: ["normals"] },
        "solslope": { availability: ["normals"] },
        "soltrans": { availability: ["normals"] }
    };
    
    return Object.keys(prismVariables).filter(variable => 
        prismVariables[variable].availability.includes(dataType)
    );
}

/**
 * Validate PRISM configuration
 * @param {Object} config - PRISM configuration
 * @returns {boolean} True if valid
 */
export function validatePRISMConfig(config) {
    const required = ['baseUrl', 'spatial', 'temporal', 'resolutions'];

    for (const field of required) {
        if (!config[field]) {
            console.error(`PRISM config missing required field: ${field}`);
            return false;
        }
    }

    return true;
}

/**
 * Get PRISM dataset information and metadata
 * @param {Object} datasetConfig - PRISM dataset configuration
 * @param {string} infoType - Type of information requested
 * @param {Object} prismVariables - PRISM variables configuration
 * @returns {Object} Dataset information
 */
export async function getPRISMDatasetInfo(datasetConfig, infoType, prismVariables) {
    switch (infoType) {
        case 'variables':
            return {
                variables: prismVariables,
                count: Object.keys(prismVariables).length
            };

        case 'spatial':
            return datasetConfig.spatial;

        case 'temporal':
            return datasetConfig.temporal;

        case 'resolutions':
            return datasetConfig.resolutions;

        case 'regions':
            return {
                regions: datasetConfig.regions,
                descriptions: {
                    us: 'Continental United States (CONUS)',
                    ak: 'Alaska',
                    hi: 'Hawaii',
                    pr: 'Puerto Rico'
                }
            };

        case 'metadata':
            return {
                ...datasetConfig,
                variables: prismVariables
            };

        default:
            throw new Error(`Unknown PRISM info type: ${infoType}`);
    }
}
