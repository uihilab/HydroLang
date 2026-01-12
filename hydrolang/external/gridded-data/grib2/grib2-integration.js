// GRIB2 Integration Layer
// Integrates Gerard Llorach's GRIB2 research implementation with HydroLang
// This file uses the researcher's grib2utils.js as a foundation

import HydroLangGRIB2Parser from './grib2-parser.js';

/**
 * Integrated GRIB2 processing for HydroLang
 * Uses research implementation for real GRIB2 parsing
 */
class GRIB2Integration {

    constructor() {
        this.parser = new HydroLangGRIB2Parser();
    }

    /**
     * Parse GRIB2 buffer and extract grid data
     * @param {ArrayBuffer} buffer - GRIB2 file buffer
     * @param {Object} options - Extraction options
     * @returns {Promise<Object>} Parsed grid data
     */
    async parseGRIB2Buffer(buffer, options = {}) {
        console.log('Starting GRIB2 integration parsing...');

        try {
            // Use the research-based parser
            const parsedData = await this.parser.parseBuffer(buffer, options);

            console.log('GRIB2 integration parsing completed successfully');
            console.log('Grid dimensions:', parsedData.data.shape);
            console.log('Sample values:', parsedData.data.values[0]?.slice(0, 5));

            return parsedData;

        } catch (error) {
            console.error('GRIB2 integration parsing failed:', error);
            throw new Error(`GRIB2 integration error: ${error.message}`);
        }
    }

    /**
     * Extract GRIB2 data with proper error handling
     * @param {Object} grib2Data - GRIB2 data object
     * @param {Object} options - Extraction options
     * @returns {Promise<Object>} Extracted data
     */
    async extractGRIB2Data(grib2Data, options = {}) {
        const { parameter, level, bbox, startDate, endDate } = options;

        console.log('Extracting GRIB2 data with integration layer...', { parameter, level, bbox });

        try {
            // Get the actual file buffer
            const buffer = grib2Data?.buffer;
            if (!buffer) {
                throw new Error('No GRIB2 file buffer available for parsing');
            }

            // Validate GRIB2 file format first
            const view = new DataView(buffer);
            const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
            if (magic !== 'GRIB') {
                throw new Error('Invalid file format - not a GRIB2 file');
            }

            // Parse the actual GRIB2 content using research implementation
            const parsedData = await this.parseGRIB2Buffer(buffer, options);

            // Apply spatial subsetting if needed
            if (bbox && bbox.length === 4) {
                parsedData.data = this.applySpatialSubsetting(parsedData.data, parsedData.metadata.gridDefinition, bbox);
                parsedData.bbox = bbox;
            }

            console.log('GRIB2 data extraction completed successfully');
            console.log('Final grid shape:', parsedData.data.shape);

            return parsedData;

        } catch (error) {
            console.error('GRIB2 data extraction failed:', error);
            throw new Error(`GRIB2 extraction failed: ${error.message}`);
        }
    }

    /**
     * Apply spatial subsetting to GRIB2 data
     * @param {Object} data - Grid data
     * @param {Object} gridDef - Grid definition
     * @param {Array} bbox - Bounding box [west, south, east, north]
     * @returns {Object} Subsetted data
     */
    applySpatialSubsetting(data, gridDef, bbox) {
        if (!bbox || bbox.length !== 4) {
            return data;
        }

        const [west, south, east, north] = bbox;
        const { values, shape } = data;
        const [numRows, numCols] = shape;

        // Calculate grid indices for bbox
        const startCol = Math.max(0, Math.floor((west - gridDef.lonStart) / gridDef.incI));
        const endCol = Math.min(numCols - 1, Math.ceil((east - gridDef.lonStart) / gridDef.incI));
        const startRow = Math.max(0, Math.floor((south - gridDef.latStart) / gridDef.incJ));
        const endRow = Math.min(numRows - 1, Math.ceil((north - gridDef.latStart) / gridDef.incJ));

        console.log('Spatial subset indices:', { startRow, endRow, startCol, endCol });

        // Extract subset
        const subsetValues = [];
        for (let row = startRow; row <= endRow; row++) {
            if (values[row]) {
                subsetValues.push(values[row].slice(startCol, endCol + 1));
            }
        }

        return {
            values: subsetValues,
            shape: [subsetValues.length, subsetValues[0]?.length || 0]
        };
    }
}

// Export the integration layer
export default GRIB2Integration;

// Helper function to create coordinates for subset
function generateSubsetCoordinates(gridDef, bbox, subsetShape) {
    const [west, south, east, north] = bbox;
    const [rows, cols] = subsetShape;

    const latitudes = [];
    const longitudes = [];

    const latStep = (north - south) / Math.max(1, rows - 1);
    const lonStep = (east - west) / Math.max(1, cols - 1);

    for (let i = 0; i < rows; i++) {
        latitudes.push(south + i * latStep);
    }

    for (let j = 0; j < cols; j++) {
        longitudes.push(west + j * lonStep);
    }

    return { latitudes, longitudes };
}

