/**
 * NLDAS-3 (North American Land Data Assimilation System) Meteorological Forcing Data
 * Provides high-resolution meteorological forcing data for hydrologic modeling.
 * Data is stored in NetCDF format on AWS S3 with public access.
 *
 * **Data Information:**
 * - **Source:** NASA GSFC / WaterInsight
 * - **Format:** NetCDF (beta release)
 * - **Resolution:** ~1km (0.01°), Hourly/Daily/Monthly
 * - **Coverage:** North America (CONUS, AK, HI, PR, Central America)
 * - **Time Range:** 1979 - 2020+
 *
 * **Available Data Types:**
 * - `point-data`: Time series for single location.
 * - `grid-data`: Spatial subset for specific time.
 * - `timeseries-data`: Multi-location extraction.
 * - `raw-netcdf`: Direct access to raw files.
 *
 * **Key Variables:**
 * - `Rainf`: Total precipitation rate (kg m⁻² = mm)
 * - `Tair`: Near-surface air temperature (K)
 * - `Qair`: Specific humidity (kg/kg)
 * - `Wind_N` / `Wind_E`: Wind components (m/s)
 *
 * @example
 * // 1. Retrieve Hourly Precipitation & Temperature (Point Data)
 * const forcingData = await hydro.data.retrieve({
 *   params: {
 *     source: 'nldas',
 *     datatype: 'point-data'
 *   },
 *   args: {
 *     dataset: 'nldas-3-hourly',
 *     variables: ['Rainf', 'Tair'],
 *     latitude: 40.7128,
 *     longitude: -74.0060,
 *     startDate: '2015-06-01T00:00:00Z',
 *     endDate: '2015-06-07T23:00:00Z'
 *   }
 * });
 *
 * @example
 * // 2. Retrieve Daily Average Grid (NetCDF)
 * const dailyGrid = await hydro.data.retrieve({
 *   params: {
 *     source: 'nldas',
 *     datatype: 'grid-data'
 *   },
 *   args: {
 *     dataset: 'nldas-3-daily',
 *     variables: ['Tair_max', 'Tair_min'],
 *     bbox: [-85.0, 33.0, -83.0, 35.0], // Georgia region
 *     startDate: '2019-07-15T00:00:00Z',
 *     endDate: '2019-07-15T00:00:00Z'
 *   }
 * });
 *
 * @see https://ldas.gsfc.nasa.gov/nldas/NLDAS2forcing.php
 * @type {Object}
 * @name NLDAS
 * @memberof datasources
 */

// NLDAS-3 Dataset configurations
const NLDAS_DATASETS = {
  "nldas-3-hourly": {
    baseUrl: "https://nasa-waterinsight.s3.amazonaws.com/NLDAS3/forcing/hourly",
    description: "NLDAS-3 Meteorological Forcing Data - Hourly resolution",
    format: "netcdf",
    temporalResolution: "1H",
    spatial: {
      coverage: "North and Central America (CONUS, Alaska, Hawaii, Puerto Rico, Central America)",
      resolution: "0.01° × 0.01° (~1km)",
      latitude: { min: 0.0, max: 53.0, resolution: 0.01 },
      longitude: { min: -130.0, max: -60.0, resolution: 0.01 },
      crs: "EPSG:4326 (WGS84)",
      gridDimensions: "5300 × 7000 (latitude × longitude)"
    },
    temporal: {
      resolution: "1H",
      start: "1979-01-01T00:00:00Z",
      end: "2020-12-31T23:00:00Z", // Update as new data becomes available
      timeZone: "UTC",
      fileFrequency: "daily", // One file per day containing 24 hourly records
      availableVariables: ["Tair", "Qair", "PSurf", "Wind_N", "Wind_E", "LWdown", "SWdown", "Rainf"]
    },
    features: {
      compression: "NetCDF-4 with internal compression",
      variables: "8 meteorological variables",
      dataQuality: "Quality-controlled meteorological observations"
    }
  },
  "nldas-3-daily": {
    baseUrl: "https://nasa-waterinsight.s3.amazonaws.com/NLDAS3/forcing/daily",
    description: "NLDAS-3 Meteorological Forcing Data - Daily averages",
    format: "netcdf",
    temporalResolution: "1D",
    spatial: {
      coverage: "North and Central America (CONUS, Alaska, Hawaii, Puerto Rico, Central America)",
      resolution: "0.01° × 0.01° (~1km)",
      latitude: { min: 0.0, max: 53.0, resolution: 0.01 },
      longitude: { min: -130.0, max: -60.0, resolution: 0.01 },
      crs: "EPSG:4326 (WGS84)",
      gridDimensions: "5300 × 7000 (latitude × longitude)"
    },
    temporal: {
      resolution: "1D",
      start: "1979-01-01T00:00:00Z",
      end: "2020-12-31T00:00:00Z",
      timeZone: "UTC",
      fileFrequency: "daily", // One file per day with daily averages
      availableVariables: ["Tair", "Tair_min", "Tair_max", "Qair", "PSurf", "Wind_N", "Wind_E", "LWdown", "SWdown", "Rainf"]
    },
    features: {
      compression: "NetCDF-4 with internal compression",
      variables: "10 meteorological variables",
      dataQuality: "Quality-controlled meteorological observations"
    }
  },
  "nldas-3-monthly": {
    baseUrl: "https://nasa-waterinsight.s3.amazonaws.com/NLDAS3/forcing/monthly",
    description: "NLDAS-3 Meteorological Forcing Data - Monthly averages",
    format: "netcdf",
    temporalResolution: "1M",
    spatial: {
      coverage: "North and Central America (CONUS, Alaska, Hawaii, Puerto Rico, Central America)",
      resolution: "0.01° × 0.01° (~1km)",
      latitude: { min: 0.0, max: 53.0, resolution: 0.01 },
      longitude: { min: -130.0, max: -60.0, resolution: 0.01 },
      crs: "EPSG:4326 (WGS84)",
      gridDimensions: "5300 × 7000 (latitude × longitude)"
    },
    temporal: {
      resolution: "1M",
      start: "1979-01-01T00:00:00Z",
      end: "2020-12-31T00:00:00Z",
      timeZone: "UTC",
      fileFrequency: "monthly", // One file per month with monthly averages
      availableVariables: ["Tair", "Qair", "PSurf", "Wind_N", "Wind_E", "LWdown", "SWdown", "Rainf"]
    },
    features: {
      compression: "NetCDF-4 with internal compression",
      variables: "8 meteorological variables",
      dataQuality: "Quality-controlled meteorological observations"
    }
  }
};

// Available NLDAS-3 variables - ONLY the ones specified in the resource documentation
const NLDAS_VARIABLES = {
  // Near-surface air temperature
  "Tair": {
    longName: "Near-surface air temperature",
    units: "K",
    scaleFactor: 1.0,
    fillValue: -9999.0,
    dtype: "float32",
    description: "Near-surface air temperature",
    category: "temperature",
    temporalResolutions: ["1H", "1D", "1M"], // Available in hourly, daily, monthly
    spatialResolution: "0.01° (~1km)"
  },

  // Daily minimum near-surface air temperature
  "Tair_min": {
    longName: "Daily minimum near-surface air temperature",
    units: "K",
    scaleFactor: 1.0,
    fillValue: -9999.0,
    dtype: "float32",
    description: "Daily minimum near-surface air temperature",
    category: "temperature",
    temporalResolutions: ["1D"], // Only available in daily datasets
    spatialResolution: "0.01° (~1km)"
  },

  // Daily maximum near-surface air temperature
  "Tair_max": {
    longName: "Daily maximum near-surface air temperature",
    units: "K",
    scaleFactor: 1.0,
    fillValue: -9999.0,
    dtype: "float32",
    description: "Daily maximum near-surface air temperature",
    category: "temperature",
    temporalResolutions: ["1D"], // Only available in daily datasets
    spatialResolution: "0.01° (~1km)"
  },

  // Near-surface specific humidity
  "Qair": {
    longName: "Near-surface specific humidity",
    units: "kg kg⁻¹",
    scaleFactor: 1.0,
    fillValue: -9999.0,
    dtype: "float32",
    description: "Near-surface specific humidity",
    category: "moisture",
    temporalResolutions: ["1H", "1D", "1M"],
    spatialResolution: "0.01° (~1km)"
  },

  // Surface pressure
  "PSurf": {
    longName: "Surface pressure",
    units: "Pa",
    scaleFactor: 1.0,
    fillValue: -9999.0,
    dtype: "float32",
    description: "Surface pressure",
    category: "pressure",
    temporalResolutions: ["1H", "1D", "1M"],
    spatialResolution: "0.01° (~1km)"
  },

  // Northward wind
  "Wind_N": {
    longName: "Northward wind",
    units: "m s⁻¹",
    scaleFactor: 1.0,
    fillValue: -9999.0,
    dtype: "float32",
    description: "Northward wind component",
    category: "wind",
    temporalResolutions: ["1H", "1D", "1M"],
    spatialResolution: "0.01° (~1km)"
  },

  // Eastward wind
  "Wind_E": {
    longName: "Eastward wind",
    units: "m s⁻¹",
    scaleFactor: 1.0,
    fillValue: -9999.0,
    dtype: "float32",
    description: "Eastward wind component",
    category: "wind",
    temporalResolutions: ["1H", "1D", "1M"],
    spatialResolution: "0.01° (~1km)"
  },

  // Downward longwave radiation at the surface
  "LWdown": {
    longName: "Downward longwave radiation at the surface",
    units: "W m⁻²",
    scaleFactor: 1.0,
    fillValue: -9999.0,
    dtype: "float32",
    description: "Downward longwave radiation at the surface",
    category: "radiation",
    temporalResolutions: ["1H", "1D", "1M"],
    spatialResolution: "0.01° (~1km)"
  },

  // Downward shortwave radiation at the surface
  "SWdown": {
    longName: "Downward shortwave radiation at the surface",
    units: "W m⁻²",
    scaleFactor: 1.0,
    fillValue: -9999.0,
    dtype: "float32",
    description: "Downward shortwave radiation at the surface",
    category: "radiation",
    temporalResolutions: ["1H", "1D", "1M"],
    spatialResolution: "0.01° (~1km)"
  },

  // Total precipitation rate
  "Rainf": {
    longName: "Total precipitation rate",
    units: "kg m⁻²",
    scaleFactor: 1.0,
    fillValue: -9999.0,
    dtype: "float32",
    description: "Total precipitation rate",
    category: "precipitation",
    temporalResolutions: ["1H", "1D", "1M"],
    spatialResolution: "0.01° (~1km)",
    notes: "Units are kg/m², which equals mm for water (assuming density of 1000 kg/m³)"
  }
};

export default {
  // Dynamic endpoint construction for NLDAS NetCDF files
  sourceType: (dataset, dataType, params) => {
    // Extract dataset configuration
    const datasetConfig = NLDAS_DATASETS[dataset];
    if (!datasetConfig) {
      throw new Error(`Unknown NLDAS dataset: ${dataset}`);
    }

    let endpoint = '';

    // For raw-netcdf OR any other data type (point, grid), we construct the file URL
    // This allows retrieve() to fetch the file directly.
    // Parsing is now a separate step as per refactor.

    // Default params if not provided (fallback logic could be added here)
    const year = params.year || (params.startDate ? new Date(params.startDate).getUTCFullYear() : undefined);
    const month = params.month || (params.startDate ? (new Date(params.startDate).getUTCMonth() + 1).toString().padStart(2, '0') : undefined);
    const day = params.day || (params.startDate ? new Date(params.startDate).getUTCDate().toString().padStart(2, '0') : undefined);
    const textHour = params.hour || (params.startDate ? new Date(params.startDate).getUTCHours().toString().padStart(2, '0') : undefined);

    if (!year || !month || !day) {
      // For dataset-info or similar meta-requests, we might not need a file
      if (dataType === 'dataset-info') return null;
      throw new Error('Year, month, and day (or startDate) are required for NLDAS access');
    }

    // Construct filename based on temporal resolution
    let filename;
    if (dataset === 'nldas-3-hourly') {
      // For hourly data, need specific hour
      if (textHour === undefined || textHour === null) {
        throw new Error('Hour (or specific startDate time) is required for hourly NLDAS data');
      }
      // Updated filename format matching user correction: NLDAS_FOR0010_H.A{YYYY}{MM}{DD}.{HH}0.beta.nc
      filename = `NLDAS_FOR0010_H.A${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}.${textHour.toString().padStart(2, '0')}0.beta.nc`;
    } else if (dataset === 'nldas-3-daily') {
      filename = `NLDAS_FOR0010_D.A${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}.beta.nc`;
    } else if (dataset === 'nldas-3-monthly') {
      filename = `NLDAS_FOR0010_M.A${year}${month.toString().padStart(2, '0')}.beta.nc`;
    }

    endpoint = `${datasetConfig.baseUrl}/${year}${month.toString().padStart(2, '0')}/${filename}`;

    return endpoint;
  },

  // Point data extraction - single location meteorological data
  "point-data": {
    endpoint: null, // Dynamic endpoint based on dataset and date
    params: {
      dataset: null, // Dataset identifier (e.g., "nldas-3-forcing")
      variables: null, // Array of variable names (e.g., ["APCPsfc", "TMP2m"])
      latitude: null, // Latitude coordinate (-90 to 90)
      longitude: null, // Longitude coordinate (-180 to 180)
      startDate: null, // ISO date string (YYYY-MM-DDTHH:mm:ssZ)
      endDate: null, // ISO date string (YYYY-MM-DDTHH:mm:ssZ)
      format: null // Output format: "json", "csv", "netcdf"
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Grid data extraction - spatial subset of meteorological data
  "grid-data": {
    endpoint: null, // Dynamic endpoint based on dataset and date
    params: {
      dataset: null, // Dataset identifier
      variables: null, // Array of variable names
      bbox: null, // Bounding box: [west, south, east, north] in decimal degrees
      startDate: null, // ISO date string
      endDate: null, // ISO date string
      format: null // Output format: "json", "netcdf", "geotiff"
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Time series extraction - meteorological data for multiple locations
  "timeseries-data": {
    endpoint: null, // Dynamic endpoint based on dataset and date
    params: {
      dataset: null, // Dataset identifier
      variables: null, // Array of variable names
      locations: null, // Array of [latitude, longitude] coordinate pairs
      startDate: null, // ISO date string
      endDate: null, // ISO date string
      format: null // Output format
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Dataset metadata and information
  "dataset-info": {
    endpoint: null, // Dynamic endpoint based on dataset
    params: {
      dataset: null, // Dataset identifier
      info: null // Type of info: "variables", "spatial", "temporal", "metadata"
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Raw NetCDF file access for custom processing
  "raw-netcdf": {
    endpoint: null, // Direct NetCDF file URL
    params: {
      dataset: null, // Dataset identifier
      year: null, // Year (YYYY)
      month: null, // Month (MM)
      day: null, // Day (DD)
      hour: null // Hour (HH) - optional, returns all hours for the day
    },
    methods: {
      type: "arraybuffer",
      method: "GET"
    }
  },

  requirements: {
    needProxy: false,
    requireskey: false,
  },

  info: {
    returnFormats: "json, csv, netcdf, geotiff, arraybuffer",
    MoreInfo: "https://ldas.gsfc.nasa.gov/nldas/NLDAS2forcing.php",
    About: "NLDAS-3 provides high-resolution meteorological forcing data for hydrologic modeling across North and Central America. Data includes precipitation, temperature, humidity, wind, and radiation variables at hourly temporal resolution and ~1km spatial resolution."
  },

  // Available datasets and their configurations
  datasets: NLDAS_DATASETS,

  // Available variables and their properties
  variables: NLDAS_VARIABLES,

  "endpoint-info": {
    "point-data": {
      paramFormat: {
        dataset: "String - Dataset identifier (e.g., 'nldas-3-forcing')",
        variables: "Array - Variable names (e.g., ['APCPsfc', 'TMP2m', 'SPFH2m'])",
        latitude: "Number - Latitude coordinate (-90 to 90)",
        longitude: "Number - Longitude coordinate (-180 to 180)",
        startDate: "String - Start date in ISO format (YYYY-MM-DDTHH:mm:ssZ)",
        endDate: "String - End date in ISO format (YYYY-MM-DDTHH:mm:ssZ)",
        format: "String - Output format ('json', 'csv', 'netcdf')"
      },
      infoSource: "https://ldas.gsfc.nasa.gov/nldas/NLDAS2forcing.php",
      example: {
        dataset: "nldas-3-hourly",
        variables: ["Rainf", "Tair"],
        latitude: 40.7128,
        longitude: -74.0060,
        startDate: "2015-01-31T00:00:00Z",
        endDate: "2015-01-31T23:00:00Z",
        format: "json",
        exampleRequest: "Extract precipitation and temperature for New York City on January 31, 2015"
      }
    },
    "grid-data": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        variables: "Array - Variable names",
        bbox: "Array - Bounding box [west, south, east, north] in decimal degrees",
        startDate: "String - Start date in ISO format",
        endDate: "String - End date in ISO format",
        format: "String - Output format ('json', 'netcdf', 'geotiff')"
      },
      infoSource: "https://ldas.gsfc.nasa.gov/nldas/NLDAS2forcing.php",
      example: {
        dataset: "nldas-3-hourly",
        variables: ["Rainf", "Tair"],
        bbox: [-75.0, 40.0, -73.0, 42.0],
        startDate: "2015-01-31T12:00:00Z",
        endDate: "2015-01-31T12:00:00Z",
        format: "netcdf",
        exampleRequest: "Extract precipitation and temperature grid for New York region at noon"
      }
    },
    "timeseries-data": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        variables: "Array - Variable names",
        locations: "Array - Array of [latitude, longitude] coordinate pairs",
        startDate: "String - Start date in ISO format",
        endDate: "String - End date in ISO format",
        format: "String - Output format"
      },
      infoSource: "https://ldas.gsfc.nasa.gov/nldas/NLDAS2forcing.php",
      example: {
        dataset: "nldas-3-hourly",
        variables: ["Rainf", "Tair"],
        locations: [[40.7128, -74.0060], [34.0522, -118.2437]],
        startDate: "2015-01-31T00:00:00Z",
        endDate: "2015-01-31T23:00:00Z",
        format: "csv",
        exampleRequest: "Extract 24-hour time series for New York and Los Angeles"
      }
    },
    "dataset-info": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        info: "String - Information type ('variables', 'spatial', 'temporal', 'metadata')"
      },
      infoSource: "https://ldas.gsfc.nasa.gov/nldas/NLDAS2forcing.php",
      example: {
        dataset: "nldas-3-hourly",
        info: "variables",
        exampleRequest: "Get information about all available meteorological variables"
      }
    },
    "raw-netcdf": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        year: "String - Year in YYYY format (e.g., '2015')",
        month: "String - Month in MM format (e.g., '01')",
        day: "String - Day in DD format (e.g., '31')",
        hour: "String - Optional hour in HH format (e.g., '12')"
      },
      infoSource: "https://ldas.gsfc.nasa.gov/nldas/NLDAS2forcing.php",
      example: {
        dataset: "nldas-3-hourly",
        year: "2015",
        month: "01",
        day: "31",
        hour: "12",
        exampleRequest: "Get raw NetCDF file for January 31, 2015 at 12:00 UTC"
      }
    }
  }
};
