/**
 * PRISM (Parameter-elevation Relationships on Independent Slopes Model) datasource
 * Provides access to high-resolution climate and weather data for the United States
 * Supports precipitation, temperature, humidity, and solar radiation variables
 * Data available as 30-year normals, monthly, and daily time series
 *
 * Data includes:
 * - ppt: Total Precipitation (mm)
 * - tmin, tmean, tmax: Minimum/Mean/Maximum Temperature (°C)
 * - tdmean: Mean Dewpoint Temperature (°C)
 * - vpdmin, vpdmax: Minimum/Maximum Vapor Pressure Deficit (hPa)
 * - solclear, soltotal, solslope, soltrans: Solar radiation variables (MJ/m²/day)
 *
 * @type {Object}
 * @name PRISM
 * @memberof datasources
 */

// Base URLs for PRISM data access
const PRISM_BASE_URLS = {
  // New format (March 2025+)
  new: "https://prism.oregonstate.edu/fetchData.php",
  // Legacy format (deprecated Sept 30, 2025)
  legacy: "https://prism.oregonstate.edu/fetchData.php"
};

// PRISM Dataset configurations
const PRISM_DATASETS = {
  "prism-current": {
    baseUrl: PRISM_BASE_URLS.new,
    description: "PRISM Current Data - CONUS, Alaska, Hawaii, Puerto Rico (New Format)",
    format: "new", // Use new naming scheme
    spatial: {
      us: {
        latitude: { min: 24.0, max: 50.0 },
        longitude: { min: -125.0, max: -66.0 }
      },
      ak: {
        latitude: { min: 51.0, max: 72.0 },
        longitude: { min: -180.0, max: -129.0 }
      },
      hi: {
        latitude: { min: 18.0, max: 23.0 },
        longitude: { min: -161.0, max: -154.0 }
      },
      pr: {
        latitude: { min: 17.0, max: 19.0 },
        longitude: { min: -68.0, max: -65.0 }
      }
    },
    temporal: {
      start: "1895-01-01T00:00:00Z",
      end: new Date().toISOString(), // Current date
      resolution: "1D", // Daily data
      normals: {
        period: "1991-2020", // 30-year normals
        available: true
      }
    },
    resolutions: {
      "15s": { description: "400m resolution", meters: 400 },
      "30s": { description: "800m resolution", meters: 800 },
      "25m": { description: "4km resolution", meters: 4000 }
    },
    regions: ["us", "ak", "hi", "pr"],
    fileFormat: "tif" // Cloud Optimized GeoTIFF
  },
  "prism-legacy": {
    baseUrl: PRISM_BASE_URLS.legacy,
    description: "PRISM Legacy Data - CONUS (Legacy Format, deprecated Sept 2025)",
    format: "legacy", // Use legacy naming scheme
    spatial: {
      us: {
        latitude: { min: 24.0, max: 50.0 },
        longitude: { min: -125.0, max: -66.0 }
      }
    },
    temporal: {
      start: "1895-01-01T00:00:00Z",
      end: "2025-09-30T00:00:00Z", // Deprecated after this date
      resolution: "1D",
      normals: {
        period: "1981-2010", // 30-year normals
        available: true
      }
    },
    resolutions: {
      "800mM2": { description: "800m resolution monthly", meters: 800 },
      "4kmM2": { description: "4km resolution monthly", meters: 4000 },
      "4kmD1": { description: "4km resolution daily", meters: 4000 }
    },
    regions: ["us"],
    fileFormat: "bil" // Binary Interleaved by Line
  }
};

// Available variables and their properties
const PRISM_VARIABLES = {
  // Precipitation, temperature, and humidity variables
  "ppt": {
    longName: "Total Precipitation",
    units: "mm",
    description: "Daily/monthly total precipitation",
    availability: ["normals", "monthly", "daily"],
    scaleFactor: 1.0,
    fillValue: -9999
  },
  "tmin": {
    longName: "Minimum Temperature",
    units: "°C",
    description: "Daily/monthly minimum temperature",
    availability: ["normals", "monthly", "daily"],
    scaleFactor: 1.0,
    fillValue: -9999
  },
  "tmean": {
    longName: "Mean Temperature",
    units: "°C",
    description: "Daily/monthly mean temperature",
    availability: ["normals", "monthly", "daily"],
    scaleFactor: 1.0,
    fillValue: -9999
  },
  "tmax": {
    longName: "Maximum Temperature",
    units: "°C",
    description: "Daily/monthly maximum temperature",
    availability: ["normals", "monthly", "daily"],
    scaleFactor: 1.0,
    fillValue: -9999
  },
  "tdmean": {
    longName: "Mean Dewpoint Temperature",
    units: "°C",
    description: "Daily/monthly mean dewpoint temperature",
    availability: ["normals", "monthly", "daily"],
    scaleFactor: 1.0,
    fillValue: -9999
  },
  "vpdmin": {
    longName: "Minimum Vapor Pressure Deficit",
    units: "hPa",
    description: "Daily/monthly minimum vapor pressure deficit",
    availability: ["normals", "monthly", "daily"],
    scaleFactor: 1.0,
    fillValue: -9999
  },
  "vpdmax": {
    longName: "Maximum Vapor Pressure Deficit",
    units: "hPa",
    description: "Daily/monthly maximum vapor pressure deficit",
    availability: ["normals", "monthly", "daily"],
    scaleFactor: 1.0,
    fillValue: -9999
  },
  // Solar radiation variables (normals only)
  "solclear": {
    longName: "Clear Sky Solar Radiation",
    units: "MJ/m²/day",
    description: "Clear sky solar radiation",
    availability: ["normals"],
    scaleFactor: 1.0,
    fillValue: -9999
  },
  "soltotal": {
    longName: "Total Solar Radiation",
    units: "MJ/m²/day",
    description: "Total solar radiation",
    availability: ["normals"],
    scaleFactor: 1.0,
    fillValue: -9999
  },
  "solslope": {
    longName: "Sloped Surface Solar Radiation",
    units: "MJ/m²/day",
    description: "Sloped surface solar radiation",
    availability: ["normals"],
    scaleFactor: 1.0,
    fillValue: -9999
  },
  "soltrans": {
    longName: "Cloud Transmittance",
    units: "dimensionless",
    description: "Cloud transmittance for solar radiation",
    availability: ["normals"],
    scaleFactor: 1.0,
    fillValue: -9999
  }
};

// Data stability levels (legacy format only)
const PRISM_STABILITY_LEVELS = {
  "early": "Preliminary data, available within 1-2 days",
  "provisional": "Quality-controlled data, available within 1-2 weeks",
  "stable": "Final quality-controlled data, available within 1-2 months",
  "30yr_normal": "30-year climatological normals"
};

/**
 * Generate PRISM file URL based on parameters
 * @param {string} variable - Variable name (ppt, tmin, etc.)
 * @param {string} region - Region code (us, ak, hi, pr)
 * @param {string} resolution - Resolution code (15s, 30s, 25m)
 * @param {string} timePeriod - Time period string
 * @param {string} format - Format type ('new' or 'legacy')
 * @param {string} stability - Stability level (legacy only)
 * @returns {string} Complete download URL
 */
export function generatePRISMFileURL(variable, region, resolution, timePeriod, format = 'new', stability = 'stable') {
  let filename;
  
  if (format === 'new') {
    // New format: prism_<var>_<region>_<resolution>_<time period>.zip
    filename = `prism_${variable}_${region}_${resolution}_${timePeriod}.zip`;
  } else {
    // Legacy format: PRISM_<var>_<stability>_<scale&version>_<time period>[_all][_<format>].zip
    const scaleVersion = resolution; // e.g., "4kmD1", "800mM2"
    filename = `PRISM_${variable}_${stability}_${scaleVersion}_${timePeriod}_bil.zip`;
  }
  
  const baseUrl = format === 'new' ? PRISM_BASE_URLS.new : PRISM_BASE_URLS.legacy;
  return `${baseUrl}?file=${filename}`;
}

/**
 * Parse date to PRISM time period format
 * @param {Date} date - Input date
 * @param {string} dataType - Type of data ('daily', 'monthly', 'annual', 'normals')
 * @returns {string} Formatted time period string
 */
export function formatPRISMTimePeriod(date, dataType) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  switch (dataType) {
    case 'daily':
      return `${year}${month}${day}`;
    case 'monthly':
      return `${year}${month}`;
    case 'annual':
      return `${year}`;
    case 'normals':
      return month; // For monthly normals (01-12) or 'annual'
    default:
      throw new Error(`Unknown PRISM data type: ${dataType}`);
  }
}

/**
 * Determine appropriate region based on bounding box
 * @param {Array} bbox - Bounding box [west, south, east, north]
 * @returns {string} Region code (us, ak, hi, pr)
 */
export function determinePRISMRegion(bbox) {
  const [west, south, east, north] = bbox;
  
  // Alaska
  if (west >= -180 && east <= -129 && south >= 51 && north <= 72) {
    return 'ak';
  }
  
  // Hawaii
  if (west >= -161 && east <= -154 && south >= 18 && north <= 23) {
    return 'hi';
  }
  
  // Puerto Rico
  if (west >= -68 && east <= -65 && south >= 17 && north <= 19) {
    return 'pr';
  }
  
  // Default to CONUS
  return 'us';
}

/**
 * Validate PRISM variable availability for data type
 * @param {string} variable - Variable name
 * @param {string} dataType - Data type ('normals', 'monthly', 'daily')
 * @returns {boolean} True if variable is available for data type
 */
export function validatePRISMVariable(variable, dataType) {
  const variableConfig = PRISM_VARIABLES[variable];
  if (!variableConfig) {
    return false;
  }
  
  return variableConfig.availability.includes(dataType);
}

/**
 * Get recommended resolution for region and data type
 * @param {string} region - Region code
 * @param {string} dataType - Data type
 * @param {string} format - Format type ('new' or 'legacy')
 * @returns {string} Recommended resolution code
 */
export function getRecommendedPRISMResolution(region, dataType, format = 'new') {
  if (format === 'new') {
    // Higher resolution for smaller regions
    if (region === 'hi' || region === 'pr') {
      return '15s'; // 400m
    }
    return '25m'; // 4km for larger regions
  } else {
    // Legacy format
    if (dataType === 'daily') {
      return '4kmD1';
    }
    return '4kmM2';
  }
}

// Export the PRISM datasource configuration
export default {
  datasets: PRISM_DATASETS,
  variables: PRISM_VARIABLES,
  stability: PRISM_STABILITY_LEVELS,
  baseUrls: PRISM_BASE_URLS,
  
  // Utility functions
  generateURL: generatePRISMFileURL,
  formatTimePeriod: formatPRISMTimePeriod,
  determineRegion: determinePRISMRegion,
  validateVariable: validatePRISMVariable,
  getRecommendedResolution: getRecommendedPRISMResolution
};
