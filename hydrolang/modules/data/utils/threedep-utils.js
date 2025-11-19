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

    return { width, height };
  }

  /**
   * Transform EPSG:5070 bounds to WGS84
   */
  async transformBounds(epsg5070Bounds) {
    const proj4 = window.proj4;
    if (!proj4) {
      throw new Error('proj4 library not available');
    }

    const sourceProj = "+proj=aea +lat_0=23 +lon_0=-96 +lat_1=29.5 +lat_2=45.5 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs";
    const targetProj = "+proj=longlat +datum=WGS84 +no_defs";

    const [minX, minY, maxX, maxY] = epsg5070Bounds;
    const bottomLeft = proj4(sourceProj, targetProj, [minX, minY]);
    const topRight = proj4(sourceProj, targetProj, [maxX, maxY]);

    return {
      minX: bottomLeft[0],
      minY: bottomLeft[1],
      maxX: topRight[0],
      maxY: topRight[1]
    };
  }

  /**
   * Create georaster object from GeoTIFF
   */
  async createGeoRaster(image, progressCallback) {
    if (progressCallback) progressCallback(30, "Processing GeoTIFF data...");

    const rasterData = await image.readRasters();
    const metadata = {
      width: image.getWidth(),
      height: image.getHeight(),
      origin: image.getOrigin(),
      resolution: image.getResolution(),
      boundingBox: image.getBoundingBox(),
      noDataValue: image.getGDALNoData()
    };

    console.log(`[threedep] Original metadata (EPSG:5070):`, metadata);

    if (progressCallback) progressCallback(50, "Transforming coordinates...");

    // Transform bounds to WGS84
    const wgs84Bounds = await this.transformBounds(metadata.boundingBox);

    if (progressCallback) progressCallback(70, "Creating elevation data structure...");

    // Create 2D array structure
    const elevationData = rasterData[0];
    const values2D = [];
    for (let row = 0; row < metadata.height; row++) {
      const rowData = [];
      for (let col = 0; col < metadata.width; col++) {
        const index = row * metadata.width + col;
        rowData.push(elevationData[index]);
      }
      values2D.push(rowData);
    }

    // Calculate min/max
    let minValue = Infinity;
    let maxValue = -Infinity;
    for (let i = 0; i < elevationData.length; i++) {
      const value = elevationData[i];
      if (value !== metadata.noDataValue && Number.isFinite(value)) {
        if (value < minValue) minValue = value;
        if (value > maxValue) maxValue = value;
      }
    }

    if (progressCallback) progressCallback(90, "Creating georaster object...");

    // Create georaster object
    const georaster = {
      projection: 4326,
      height: metadata.height,
      width: metadata.width,
      pixelHeight: (wgs84Bounds.maxY - wgs84Bounds.minY) / metadata.height,
      pixelWidth: (wgs84Bounds.maxX - wgs84Bounds.minX) / metadata.width,
      xmin: wgs84Bounds.minX,
      xmax: wgs84Bounds.maxX,
      ymin: wgs84Bounds.minY,
      ymax: wgs84Bounds.maxY,
      noDataValue: metadata.noDataValue,
      numberOfRasters: 1,
      values: [values2D],
      maxs: [maxValue],
      mins: [minValue],
      ranges: [maxValue - minValue],
      _originalBounds: metadata.boundingBox,
      _originalProjection: "EPSG:5070"
    };

    console.log(`[threedep] Elevation range: ${minValue}m to ${maxValue}m`);

    return { georaster, metadata, wgs84Bounds, elevationRange: { min: minValue, max: maxValue } };
  }

  /**
   * Fetch DEM data (overrides base class)
   */
  async fetchDEMData(bbox, resolution, progressCallback) {
    // Normalize bbox
    const [west, south, east, north] = Array.isArray(bbox) ? bbox : Object.values(bbox);

    // Calculate size
    const { width, height } = this.calculateSize([west, south, east, north], resolution);

    // Generate URL
    const url = this.generateGeoTiffUrl([west, south, east, north], width, height);

    console.log(`[threedep] Fetching DEM for bbox [${west}, ${south}, ${east}, ${north}], resolution ${resolution}m`);

    try {
      if (progressCallback) progressCallback(10, "Fetching DEM data...");

      // Fetch data
      const arrayBuffer = await this.fetch(url);

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
  async fetchPointElevation(latitude, longitude, progressCallback) {
    // Create small bounding box around point
    const buffer = 0.001; // ~100m buffer
    const bbox = [
      longitude - buffer,
      latitude - buffer,
      longitude + buffer,
      latitude + buffer
    ];

    try {
      const result = await this.fetchDEMData(bbox, 1, progressCallback);

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
  return await dep.fetchDEMData(data.bbox, data.resolution, progressCallback);
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
