/**
 * High Resolution Rapid Refresh (HRRR) Model Data
 * Provides access to HRRR weather model forecasts and analysis data.
 * HRRR is NOAA's high-resolution (3km) weather prediction model updated hourly.
 *
 * **Data Information:**
 * - **Source:** NOAA NCEP / NOMADS
 * - **Format:** GRIB2 (Native resolution)
 * - **Resolution:** 3km (CONUS)
 * - **Updates:** Hourly
 * - **Forecast Horizon:** 18h (standard), 48h (extended/00z/06z/12z/18z)
 *
 * **Available Products:**
 * - `hrrr-operational`: Real-time operational forecasts.
 * - `hrrr-analysis`: Historical analysis (archive since 2014).
 *
 * **Key Variables:**
 * - `TMP`: Temperature
 * - `APCP`: Total Precipitation
 * - `WIND`: Wind Speed
 * - `VIS`: Visibility
 *
 * @example
 * // 1. Retrieve operational Surface Temperature Forecast (Real-time)
 * const forecastData = await hydro.data.retrieve({
 *   params: {
 *     source: 'hrrr',
 *     datatype: 'point-data'
 *   },
 *   args: {
 *     dataset: 'hrrr-operational',
 *     product: 'sfc',
 *     variable: 'TMP',
 *     latitude: 40.7128,
 *     longitude: -74.0060,
 *     startDate: new Date().toISOString() // Or specific recent date
 *   }
 * });
 *
 * @example
 * // 2. Retrieve Historical Analysis (Grid) for significant event
 * const stormData = await hydro.data.retrieve({
 *   params: {
 *     source: 'hrrr',
 *     datatype: 'grid-data'
 *   },
 *   args: {
 *     dataset: 'hrrr-analysis',
 *     product: 'anl',
 *     variable: 'APCP',
 *     bbox: [-96.0, 29.0, -94.0, 31.0], // Houston area
 *     startDate: '2017-08-26T00:00:00Z' // Hurricane Harvey example
 *   }
 * });
 *
 * @see https://rapidrefresh.noaa.gov/hrrr/
 * @type {Object}
 * @name HRRR
 * @memberof datasources
 */

// HRRR Dataset configurations - GRIB2 format on NOAA servers
const HRRR_DATASETS = {
  "hrrr-operational": {
    baseUrl: "https://nomads.ncep.noaa.gov/pub/data/nccf/com/hrrr/prod",
    format: "grib2",
    description: "High Resolution Rapid Refresh operational forecasts - 3km resolution weather model with 48-hour forecasts",
    spatial: {
      coverage: "conus", // Continental United States
      resolution: "3km", // 3km horizontal resolution
      levels: "surface", // Surface and pressure levels available
      latitude: { min: 21.138, max: 52.616 },
      longitude: { min: -122.191, max: -60.906 }
    },
    temporal: {
      archive: false, // Real-time operational system
      archiveStart: null,
      forecastHours: 48, // 48-hour forecasts
      updateFrequency: "1H", // Hourly updates
      resolution: "1H" // 1-hour temporal resolution
    },
    products: {
      "prs": {
        path: "hrrr.{timestamp}/conus",
        filename: "hrrr.t{time}z.wrfnatf{step}.grib2",
        format: "grib2",
        description: "Full native resolution forecast data"
      },
      "sfc": {
        path: "hrrr.{timestamp}/conus",
        filename: "hrrr.t{time}z.wrfsfcf{step}.grib2",
        format: "grib2",
        description: "Surface forecast data"
      },
      "subh": {
        path: "hrrr.{timestamp}/conus",
        filename: "hrrr.t{time}z.wrfsfcf{step}.grib2",
        format: "grib2",
        description: "Sub-hourly surface forecast data"
      }
    }
  },

  "hrrr-analysis": {
    baseUrl: "https://nomads.ncep.noaa.gov/pub/data/nccf/com/hrrr/prod",
    format: "grib2",
    description: "High Resolution Rapid Refresh analysis data - Past model runs for historical analysis",
    spatial: {
      coverage: "conus",
      resolution: "3km",
      levels: "surface",
      latitude: { min: 21.138, max: 52.616 },
      longitude: { min: -122.191, max: -60.906 }
    },
    temporal: {
      archive: true,
      archiveStart: "2014-09-30", // When HRRR became operational
      forecastHours: 0, // Analysis only
      updateFrequency: "1H",
      resolution: "1H"
    },
    products: {
      "anl": {
        path: "hrrr.{timestamp}/conus",
        filename: "hrrr.t{time}z.wrfnatf00.grib2",
        format: "grib2",
        description: "Analysis data (forecast hour 00)"
      }
    }
  }
};

// HRRR Variable configurations - GRIB2 parameter mappings
const HRRR_VARIABLES = {
  "TMP": {
    longName: "Temperature",
    units: "K",
    grib2Code: "0,0,0",
    levelType: "surface",
    level: "2",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["sfc", "prs", "anl"]
  },
  "DPT": {
    longName: "Dew Point Temperature",
    units: "K",
    grib2Code: "0,0,6",
    levelType: "surface",
    level: "2",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["sfc", "prs", "anl"]
  },
  "RH": {
    longName: "Relative Humidity",
    units: "%",
    grib2Code: "0,1,1",
    levelType: "surface",
    level: "2",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["sfc", "prs"]
  },
  "APCP": {
    longName: "Total Precipitation",
    units: "kg/m²",
    grib2Code: "0,1,8",
    levelType: "surface",
    level: "0",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["sfc", "prs", "anl"]
  },
  "PRATE": {
    longName: "Precipitation Rate",
    units: "kg/m²/s",
    grib2Code: "0,1,7",
    levelType: "surface",
    level: "0",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["sfc", "prs"]
  },
  "UGRD": {
    longName: "U-Component of Wind",
    units: "m/s",
    grib2Code: "0,2,2",
    levelType: "surface",
    level: "10",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["sfc", "prs"]
  },
  "VGRD": {
    longName: "V-Component of Wind",
    units: "m/s",
    grib2Code: "0,2,3",
    levelType: "surface",
    level: "10",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["sfc", "prs"]
  },
  "WIND": {
    longName: "Wind Speed",
    units: "m/s",
    grib2Code: "0,2,1",
    levelType: "surface",
    level: "10",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["sfc", "prs"]
  },
  "WDIR": {
    longName: "Wind Direction",
    units: "°",
    grib2Code: "0,2,0",
    levelType: "surface",
    level: "10",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["sfc", "prs"]
  },
  "VIS": {
    longName: "Visibility",
    units: "m",
    grib2Code: "0,0,9",
    levelType: "surface",
    level: "0",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["sfc", "prs"]
  },
  "TCDC": {
    longName: "Total Cloud Cover",
    units: "%",
    grib2Code: "0,6,0",
    levelType: "surface",
    level: "0",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["sfc", "prs"]
  },
  "HGT": {
    longName: "Geopotential Height",
    units: "m",
    grib2Code: "0,3,5",
    levelType: "pressure",
    level: "500",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["prs"]
  }
};

// Generate URL for HRRR data files
function generateHRRRFileURL(product, timestamp, dataset = 'hrrr-operational') {
  const datasetConfig = HRRR_DATASETS[dataset];
  if (!datasetConfig) {
    throw new Error(`Unknown HRRR dataset: ${dataset}`);
  }

  const productConfig = datasetConfig.products[product];
  if (!productConfig) {
    throw new Error(`Unknown HRRR product: ${product}`);
  }

  // Format timestamp for HRRR directory structure
  // HRRR uses YYYYMMDD format for directories
  const year = timestamp.getUTCFullYear();
  const month = String(timestamp.getUTCMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getUTCDate()).padStart(2, '0');
  const hour = String(timestamp.getUTCHours()).padStart(2, '0');

  const dateStr = `${year}${month}${day}`;
  const timeStr = `${hour}`;

  // Replace placeholders in path
  const path = productConfig.path.replace('{timestamp}', dateStr).replace('{time}', timeStr);

  // For forecast products, we need to determine the appropriate forecast step
  let step = '00'; // Default to analysis (00 hours)
  if (product !== 'anl') {
    // For forecast products, use the current hour as base
    // This is a simplification - in practice you'd want to specify the forecast hour
    step = '01'; // Default to 1-hour forecast
  }

  // Replace placeholders in filename
  const filename = productConfig.filename
    .replace('{timestamp}', dateStr)
    .replace('{time}', timeStr)
    .replace('{step}', step);

  return `${datasetConfig.baseUrl}/${path}/${filename}`;
}

export default {
  // Point data extraction - single location, single variable
  "point-data": {
    endpoint: null, // Dynamic endpoint based on dataset and product
    params: {
      dataset: null, // Dataset identifier (e.g., "hrrr-operational", "hrrr-analysis")
      product: null, // HRRR product (e.g., "sfc", "prs")
      variable: null, // Variable name (e.g., "TMP", "APCP")
      latitude: null, // Single latitude coordinate
      longitude: null, // Single longitude coordinate
      startDate: null, // ISO date string
      forecastHour: null, // Forecast hour for operational data
      format: null // Output format: "json", "csv", "netcdf"
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Grid data extraction - spatial subset
  "grid-data": {
    endpoint: null, // Dynamic endpoint based on dataset and product
    params: {
      dataset: null, // Dataset identifier
      product: null, // HRRR product
      variable: null, // Variable name
      bbox: null, // Bounding box: [west, south, east, north]
      startDate: null, // ISO date string
      forecastHour: null, // Forecast hour for operational data
      format: null // Output format
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Time series extraction - single location, time series
  "timeseries-data": {
    endpoint: null, // Dynamic endpoint based on dataset and product
    params: {
      dataset: null, // Dataset identifier
      product: null, // HRRR product
      variable: null, // Variable name
      latitude: null, // Single latitude coordinate
      longitude: null, // Single longitude coordinate
      startDate: null, // ISO date string
      endDate: null, // ISO date string
      forecastHour: null, // Forecast hour for operational data
      format: null // Output format
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Dataset information
  "dataset-info": {
    endpoint: null,
    params: {
      dataset: null, // Dataset identifier
      info: null // Type of info: "variables", "spatial", "temporal", "products", "metadata"
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Available variables
  "available-variables": {
    endpoint: null,
    params: {},
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Available datasets and their configurations
  datasets: HRRR_DATASETS,

  // Available variables and their properties
  variables: HRRR_VARIABLES,

  // URL generation helper
  generateURL: generateHRRRFileURL,

  requirements: {
    needProxy: true, // HRRR data should use proxy for CORS
    requireskey: false,
    keyname: null
  },

  info: {
    returnFormats: "grib2",
    MoreInfo: "https://rapidrefresh.noaa.gov/hrrr/",
    About: "High Resolution Rapid Refresh (HRRR) provides high-resolution (3km) weather forecasts and analysis data for the Continental United States. Available in GRIB2 format with 1-hour temporal resolution."
  }
};

// Export the URL generation function for use in utilities
export { generateHRRRFileURL };
