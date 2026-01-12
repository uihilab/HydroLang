/**
 * 3DEP Elevation Data Utilities - Refactored
 * Uses GeoTIFFDataSource base class to eliminate duplicate code
 * Handles DEM data from USGS 3DEP service
 */

import { GeoTIFFDataSource } from './gridded-data-utils.js';

const BASE_URL = "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer";
const MAX_SIZE = 2048;

/**
 * 3DEP-specific data source implementation
 * Extends GeoTIFFDataSource with 3DEP-specific elevation handling
 */
export class DEPDataSource extends GeoTIFFDataSource {
  constructor() {
    super({
      sourceName: 'threedep',
      libraryType: 'geospatial',
      datasourceConfig: { spatial: {}, temporal: {} },
      variables: { elevation: { units: 'meters', description: 'Elevation (NAVD88)' } }
    });
  }

  /**
   * Generate 3DEP GeoTIFF export URL
   */
  generateGeoTiffUrl(bbox, width, height) {
    const params = new URLSearchParams({
      f: "image",
      bbox: bbox.join(","),
      bboxSR: "4326",
      imageSR: "5070",
      size: `${width},${height}`,
      format: "tiff",
      pixelType: "F32",
      noDataInterpretation: "esriNoDataMatchAny",
      interpolation: "RSP_BilinearInterpolation",
      compression: "LZ77",
      compressionQuality: "75",
      bandIds: "0"
    });

    return `${BASE_URL}/exportImage?${params.toString()}`;
  }

  /**
   * Calculate optimal image size based on bbox and resolution
   */
  calculateSize(bbox, resolution) {
    const [west, south, east, north] = bbox;

    // Ensure resolution is a number
    const res = Number(resolution);
    if (isNaN(res) || res <= 0) {
      console.warn(`[threedep] Invalid resolution: ${resolution}, defaulting to 30m`);
      // Default to approx 30m if invalid
      resolution = 30;
    }

    // Convert degrees to meters approximately
    const widthMeters = (east - west) * 111319.9 * Math.cos((south * Math.PI) / 180);
    const heightMeters = (north - south) * 111319.9;

    let width = Math.ceil(widthMeters / resolution);
    let height = Math.ceil(heightMeters / resolution);

    // Ensure dimensions don't exceed maximum size
    if (width > MAX_SIZE || height > MAX_SIZE) {
      const scale = Math.min(MAX_SIZE / width, MAX_SIZE / height);
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
    }

    // Safety check for NaN
    if (isNaN(width) || isNaN(height)) {
      console.error(`[threedep] Size calculation failed for bbox: ${bbox}, resolution: ${resolution}`);
      width = 1000;
      height = 1000;
    }

    return { width, height };
  }

  // ... (transformBounds is fine) ...

  /**
   * Fetch DEM data (overrides base class)
   */
  async fetchDEMData(args) {
    const { bbox, resolution } = args;
    const progressCallback = args.progressCallback;
    const options = args;

    // Normalize bbox
    const [west, south, east, north] = Array.isArray(bbox) ? bbox : Object.values(bbox);

    // Calculate size
    const { width, height } = this.calculateSize([west, south, east, north], resolution);

    // Generate URL
    const url = this.generateGeoTiffUrl([west, south, east, north], width, height);

    console.log(`[threedep] Fetching DEM for bbox [${west}, ${south}, ${east}, ${north}], resolution ${resolution}m`);

    try {
      if (progressCallback) progressCallback(10, "Fetching DEM data...");

      // Fetch data using base fetch which handles proxy
      const arrayBuffer = await this.fetch(url, options);

      // If raw retrieval requested (default unless process: true), return the array buffer directly
      if (options.process !== true) {
        return arrayBuffer;
      }

      if (progressCallback) progressCallback(20, "Loading geospatial libraries...");

      // Load library
      await this.loadLibrary();

      // Parse GeoTIFF
      const { tiff, image } = await this.parseGeoTIFF(arrayBuffer);

      // Create georaster
      const { georaster, metadata, wgs84Bounds, elevationRange } = await this.createGeoRaster(image, progressCallback);

      if (progressCallback) progressCallback(100, "Complete");

      return {
        bbox: [west, south, east, north],
        resolution,
        arrayBuffer,
        georaster,
        units: "meters",
        verticalDatum: "NAVD88",
        metadata: {
          originalProjection: "EPSG:5070",
          originalBounds: metadata.boundingBox,
          wgs84Bounds: wgs84Bounds,
          elevationRange: elevationRange,
          dimensions: { width: metadata.width, height: metadata.height }
        },
        _isGeoraster: true,
        _bounds: [[wgs84Bounds.minY, wgs84Bounds.minX], [wgs84Bounds.maxY, wgs84Bounds.maxX]]
      };

    } catch (error) {
      console.error(`[threedep] Error fetching DEM:`, error);
      throw new Error(`Failed to fetch DEM data: ${error.message}`);
    }
  }

  /**
   * Fetch point elevation
   */
  async fetchPointElevation(args) {
    const { latitude, longitude } = args;
    const progressCallback = args.progressCallback;

    // Create small bounding box around point
    const buffer = 0.001; // ~100m buffer
    const bbox = [
      longitude - buffer,
      latitude - buffer,
      longitude + buffer,
      latitude + buffer
    ];

    try {
      const result = await this.fetchDEMData({ bbox, resolution: 1, progressCallback, process: true });

      // Find closest pixel
      const georaster = result.georaster;
      const pixelX = Math.round((longitude - georaster.xmin) / georaster.pixelWidth);
      const pixelY = Math.round((georaster.ymax - latitude) / georaster.pixelHeight);

      // Get elevation value
      let elevation = null;
      if (pixelX >= 0 && pixelX < georaster.width && pixelY >= 0 && pixelY < georaster.height) {
        elevation = georaster.values[0][pixelY][pixelX];

        // Check for no-data values
        if (elevation === georaster.noDataValue || !Number.isFinite(elevation)) {
          elevation = null;
        }
      }

      return {
        latitude,
        longitude,
        elevation,
        units: "meters",
        verticalDatum: "NAVD88",
        metadata: result.metadata
      };

    } catch (error) {
      console.error(`[threedep] Error fetching point elevation:`, error);
      throw new Error(`Failed to fetch elevation data: ${error.message}`);
    }
  }
  /**
   * Get dataset info
   */
  async getDatasetInfo(args) {
    return {
      name: '3DEP Elevation',
      description: 'USGS 3D Elevation Program',
      variables: this.variables,
      spatial: {
        envelope: [-180, -90, 180, 90], // Global coverage practically
        crs: 'EPSG:4326'
      }
    };
  }
}

// ============================================================================
// BACKWARD COMPATIBLE EXPORTED FUNCTIONS
// ============================================================================

/**
 * Fetches DEM data for a specific region from 3DEP Elevation service
 * @param {Object} data - Data parameters
 * @param {Array|Object} data.bbox - Bounding box coordinates [west, south, east, north]
 * @param {number} data.resolution - Data resolution in meters
 * @param {function} [progressCallback] - Optional progress callback
 * @returns {Promise<Object>} Promise resolving to DEM data with georaster
 */
export async function fetchDEMData(data, progressCallback) {
  const dep = new DEPDataSource();
  return await dep.fetchDEMData(data.bbox, data.resolution, progressCallback, data);
}

/**
 * Fetches elevation data for a single point
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {function} [progressCallback] - Optional progress callback
 * @returns {Promise<Object>} Promise resolving to point elevation data
 */
export async function fetchPointElevation(latitude, longitude, progressCallback) {
  const dep = new DEPDataSource();
  return await dep.fetchPointElevation(latitude, longitude, progressCallback);
}

/**
 * Validates 3DEP request parameters
 * @param {Object} params - Request parameters
 * @returns {Object} Validation result with isValid and errors
 */
export function validate3DEPParams(params) {
  const errors = [];

  // Validate dataset
  if (!params.dataset || params.dataset !== "3dep-dem") {
    errors.push("Invalid dataset. Must be '3dep-dem'");
  }

  // Validate bbox for grid-data
  if (params.bbox) {
    if (!Array.isArray(params.bbox) || params.bbox.length !== 4) {
      errors.push("bbox must be an array of [west, south, east, north]");
    } else {
      const [west, south, east, north] = params.bbox;
      if (west >= east) errors.push("west must be less than east in bbox");
      if (south >= north) errors.push("south must be less than north in bbox");
      if (west < -180 || west > 180) errors.push("west must be between -180 and 180");
      if (east < -180 || east > 180) errors.push("east must be between -180 and 180");
      if (south < -90 || south > 90) errors.push("south must be between -90 and 90");
      if (north < -90 || north > 90) errors.push("north must be between -90 and 90");
    }
  }

  // Validate resolution
  if (params.resolution) {
    const validResolutions = [1, 3, 5, 10, 30];
    if (!validResolutions.includes(params.resolution)) {
      errors.push(`Invalid resolution. Must be one of: ${validResolutions.join(", ")}`);
    }
  }

  // Validate coordinates for point-data
  if (params.latitude !== undefined && params.longitude !== undefined) {
    if (params.latitude < -90 || params.latitude > 90) {
      errors.push("latitude must be between -90 and 90");
    }
    if (params.longitude < -180 || params.longitude > 180) {
      errors.push("longitude must be between -180 and 180");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
