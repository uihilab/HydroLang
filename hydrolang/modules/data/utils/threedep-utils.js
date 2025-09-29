/**
 * 3DEP Elevation Data Utilities
 * Handles fetching and processing of 3DEP elevation data
 */

import { loadGridDataLibrary, isGridDataLibraryLoaded, getGridDataLibrary } from "./gridded-data-utils.js";

const BASE_URL = "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer";
const MAX_SIZE = 2048;

/**
 * Fetches DEM data for a specific region from 3DEP Elevation service
 * @service dem
 * @operation fetchDEMData
 * @description Fetches DEM data for a specific region from 3DEP Elevation service
 * @param {Object} data - Data parameters
 * @param {Array|Object} data.bbox - Bounding box coordinates [west, south, east, north]
 * @param {number} data.resolution - Data resolution in meters
 * @param {function} [progressCallback] - Optional progress callback
 * @returns {Promise<Object>} Promise resolving to DEM data with georaster
 */
export async function fetchDEMData(data, progressCallback) {
  const { bbox, resolution } = data;

  // Ensure bbox is an array
  const [west, south, east, north] = Array.isArray(bbox)
    ? bbox
    : Object.values(bbox);

  const { width, height } = calculateSize(
    [west, south, east, north],
    resolution
  );

  const url = generateGeoTiffUrl([west, south, east, north], width, height);

  try {
    if (progressCallback) progressCallback(10, "Fetching DEM data...");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    if (progressCallback) progressCallback(20, "Loading geospatial libraries...");

    // Ensure geospatial libraries are loaded
    if (!isGridDataLibraryLoaded('geospatial')) {
      console.log('Loading geospatial libraries...');
      await loadGridDataLibrary('geospatial');
    }

    // Access libraries from global window object (where geospatial loader puts them)
    const GeoTIFF = window.GeoTIFF || window.geotiff || window.GeoTiff;
    const proj4 = window.proj4;

    console.log('Library availability check:', {
      GeoTIFF: !!GeoTIFF,
      proj4: !!proj4,
      windowGeoTIFF: typeof window.GeoTIFF,
      windowGeotiff: typeof window.geotiff,
      windowGeoTiff: typeof window.GeoTiff,
      windowProj4: typeof window.proj4,
      windowKeys: Object.keys(window).filter(key => key.toLowerCase().includes('tiff') || key.toLowerCase().includes('proj'))
    });

    if (!GeoTIFF || !proj4) {
      throw new Error(`Failed to load required geospatial libraries. Available: GeoTIFF=${!!GeoTIFF}, proj4=${!!proj4}. Check console for window keys.`);
    }

    if (progressCallback) progressCallback(30, "Processing GeoTIFF data...");

    console.log(" Creating DEM georaster directly from EPSG:5070 metadata...");

    // Read the raw GeoTIFF to extract metadata and values
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();
    const rasterData = await image.readRasters();

    // Get original EPSG:5070 metadata
    const originalMetadata = {
      width: image.getWidth(),
      height: image.getHeight(),
      origin: image.getOrigin(),
      resolution: image.getResolution(),
      boundingBox: image.getBoundingBox(),
      noDataValue: image.getGDALNoData()
    };

    console.log("DEM original metadata (EPSG:5070):", originalMetadata);

    if (progressCallback) progressCallback(50, "Transforming coordinates...");

    // Transform bounds from EPSG:5070 to WGS84 for Leaflet
    const sourceProj = "+proj=aea +lat_0=23 +lon_0=-96 +lat_1=29.5 +lat_2=45.5 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs";
    const targetProj = "+proj=longlat +datum=WGS84 +no_defs";

    const [minX, minY, maxX, maxY] = originalMetadata.boundingBox;
    const bottomLeft = proj4(sourceProj, targetProj, [minX, minY]);
    const topRight = proj4(sourceProj, targetProj, [maxX, maxY]);

    const wgs84BoundingBox = {
      minX: bottomLeft[0],
      minY: bottomLeft[1],
      maxX: topRight[0],
      maxY: topRight[1]
    };

    console.log("DEM bounds transformed to WGS84:", wgs84BoundingBox);

    if (progressCallback) progressCallback(70, "Creating elevation data structure...");

    // Create 2D array structure that GeoRasterLayer expects
    const elevationData = rasterData[0]; // First (and only) band
    const values2D = [];
    for (let row = 0; row < originalMetadata.height; row++) {
      const rowData = [];
      for (let col = 0; col < originalMetadata.width; col++) {
        const index = row * originalMetadata.width + col;
        rowData.push(elevationData[index]);
      }
      values2D.push(rowData);
    }

    // Calculate min/max for color scaling
    let minValue = Infinity;
    let maxValue = -Infinity;
    for (let i = 0; i < elevationData.length; i++) {
      const value = elevationData[i];
      if (value !== originalMetadata.noDataValue && Number.isFinite(value)) {
        if (value < minValue) minValue = value;
        if (value > maxValue) maxValue = value;
      }
    }

    if (progressCallback) progressCallback(90, "Creating georaster object...");

    // Create georaster object directly (same approach as FIM)
    const georaster = {
      projection: 4326, // WGS84
      height: originalMetadata.height,
      width: originalMetadata.width,
      pixelHeight: (wgs84BoundingBox.maxY - wgs84BoundingBox.minY) / originalMetadata.height,
      pixelWidth: (wgs84BoundingBox.maxX - wgs84BoundingBox.minX) / originalMetadata.width,
      xmin: wgs84BoundingBox.minX,
      xmax: wgs84BoundingBox.maxX,
      ymin: wgs84BoundingBox.minY,
      ymax: wgs84BoundingBox.maxY,
      noDataValue: originalMetadata.noDataValue,
      numberOfRasters: 1,
      values: [values2D], // Band 1 as 2D array
      maxs: [maxValue],
      mins: [minValue],
      ranges: [maxValue - minValue],
      // Store original EPSG:5070 bounds for reference
      _originalBounds: originalMetadata.boundingBox,
      _originalProjection: "EPSG:5070"
    };

    console.log("DEM georaster created successfully");
    console.log("DEM bounds:", {
      wgs84: `${georaster.xmin}, ${georaster.ymin}, ${georaster.xmax}, ${georaster.ymax}`,
      epsg5070: originalMetadata.boundingBox
    });
    console.log("DEM elevation range:", { min: minValue, max: maxValue });

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
        originalBounds: originalMetadata.boundingBox,
        wgs84Bounds: wgs84BoundingBox,
        elevationRange: { min: minValue, max: maxValue },
        dimensions: { width: originalMetadata.width, height: originalMetadata.height }
      },
      // Add convenience properties for mapping
      _isGeoraster: true,
      _bounds: [[wgs84BoundingBox.minY, wgs84BoundingBox.minX], [wgs84BoundingBox.maxY, wgs84BoundingBox.maxX]]
    };

  } catch (error) {
    console.error("Error fetching DEM:", { bbox, resolution, error });
    throw new Error(`Failed to fetch DEM data: ${error.message}`);
  }
}

/**
 * Calculates optimal image size based on bounding box and resolution
 * @param {Array} bbox - Bounding box [west, south, east, north]
 * @param {number} resolution - Resolution in meters
 * @returns {Object} Object with width and height properties
 */
function calculateSize(bbox, resolution) {
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
 * Generates GeoTIFF export URL for 3DEP service
 * @param {Array} bbox - Bounding box [west, south, east, north]
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {string} Complete export URL
 */
function generateGeoTiffUrl(bbox, width, height) {
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
 * Fetches elevation data for a single point
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {function} [progressCallback] - Optional progress callback
 * @returns {Promise<Object>} Promise resolving to point elevation data
 */
export async function fetchPointElevation(latitude, longitude, progressCallback) {
  // Create a small bounding box around the point
  const buffer = 0.001; // ~100m buffer
  const bbox = [
    longitude - buffer,
    latitude - buffer,
    longitude + buffer,
    latitude + buffer
  ];

  try {
    const result = await fetchDEMData({ bbox, resolution: 1 }, progressCallback);

    // Find the closest pixel to the requested point
    const georaster = result.georaster;
    const pixelWidth = georaster.pixelWidth;
    const pixelHeight = georaster.pixelHeight;

    // Calculate pixel coordinates
    const pixelX = Math.round((longitude - georaster.xmin) / pixelWidth);
    const pixelY = Math.round((georaster.ymax - latitude) / pixelHeight);

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
    console.error("Error fetching point elevation:", { latitude, longitude, error });
    throw new Error(`Failed to fetch elevation data: ${error.message}`);
  }
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
