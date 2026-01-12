/**
 * NOAA AORC (Analysis of Record for Calibration) datasource
 * Provides access to high-resolution meteorological forcing data stored in Zarr format on S3.
 *
 * **Data Information:**
 * - **Source:** NOAA NWS
 * - **Format:** Zarr (accessed via S3)
 * - **Resolution:** 1km roughly (0.008333 deg), Hourly
 * - **Coverage:** CONUS, some transboundary
 *
 * **Available Data Types:**
 * - `point-data`: Extract time series for a single lat/lon coordinate for specific variables.
 * - `grid-data`: Extract a spatial subset (bounding box) for specific variables and time.
 * - `timeseries-data`: Extract time series for multiple locations.
 * - `bulk-extraction`: Large scale extraction (caution: data heavy).
 *
 * **Key Variables:**
 * - `APCP_surface`: Total Precipitation (kg/m²)
 * - `TMP_2maboveground`: Temperature at 2m (K)
 * - `DSWRF_surface`: Short-wave Radiation (W/m²)
 * - `DLWRF_surface`: Long-wave Radiation (W/m²)
 *
 * @example
 * // 1. Retrieve Point Data (Precipitation & Temperature) for specific location/time
 * const pointData = await hydro.data.retrieve({
 *   params: {
 *     source: 'aorc',
 *     datatype: 'point-data'
 *   },
 *   args: {
 *     dataset: 'aorc-v1.1',
 *     variables: ['APCP_surface', 'TMP_2maboveground'],
 *     latitude: 40.7128,
 *     longitude: -74.0060,
 *     startDate: '2020-01-01T00:00:00Z',
 *     endDate: '2020-01-07T23:00:00Z'
 *   }
 * });
 *
 * @example
 * // 2. Retrieve Grid Data (NetCDF format)
 * const gridData = await hydro.data.retrieve({
 *   params: {
 *     source: 'aorc',
 *     datatype: 'grid-data'
 *   },
 *   args: {
 *     dataset: 'aorc-v1.1',
 *     variables: ['APCP_surface'],
 *     bbox: [-75.0, 40.0, -73.0, 42.0], // [west, south, east, north]
 *     startDate: '2020-01-01T00:00:00Z',
 *     endDate: '2020-01-01T06:00:00Z',
 *     format: 'netcdf'
 *   }
 * });
 *
 * @type {Object}
 * @name AORC
 * @memberof datasources
 */

// AORC Dataset configurations
const AORC_DATASETS = {
  "aorc-v1.1": {
    baseUrl: "https://noaa-nws-aorc-v1-1-1km.s3.amazonaws.com",
    contentUrl: "https://noaa-nws-aorc-v1-1-1km.s3.amazonaws.com/{year}.zarr",
    description: "AORC Version 1.1 - CONUS Domain (Year-based Zarr stores)",
    spatial: {
      latitude: { min: 20.0, max: 55.0, resolution: 0.027 },
      longitude: { min: -130.0, max: -60.0, resolution: 0.027 }
    },
    temporal: {
      start: "1979-02-01T00:00:00Z",
      end: "2020-12-31T23:00:00Z",
      resolution: "1H",
      yearBased: true,  // Data organized by year (1979.zarr, 1980.zarr, etc.)
      timeOrigin: "year-start"  // Time indices calculated relative to start of each year
    }
  }
  // Future datasets can be added here
};

// Available variables and their properties
const AORC_VARIABLES = {
  "APCP_surface": {
    longName: "Total Precipitation",
    units: "kg/m²",
    scaleFactor: 0.1,
    fillValue: -32767,
    dtype: "<i2"
  },
  "DLWRF_surface": {
    longName: "Downward Long-Wave Radiation Flux",
    units: "W/m²",
    scaleFactor: 0.1,
    fillValue: -32767,
    dtype: "<i2"
  },
  "DSWRF_surface": {
    longName: "Downward Short-Wave Radiation Flux",
    units: "W/m²",
    scaleFactor: 0.1,
    fillValue: -32767,
    dtype: "<i2"
  },
  "PRES_surface": {
    longName: "Pressure",
    units: "Pa",
    scaleFactor: 10.0,
    fillValue: -32767,
    dtype: "<i2"
  },
  "SPFH_2maboveground": {
    longName: "Specific Humidity",
    units: "kg/kg",
    scaleFactor: 0.0001,
    fillValue: -32767,
    dtype: "<i2"
  },
  "TMP_2maboveground": {
    longName: "Temperature",
    units: "K",
    scaleFactor: 0.1,
    fillValue: -32767,
    dtype: "<i2"
  },
  "UGRD_10maboveground": {
    longName: "U-Component of Wind",
    units: "m/s",
    scaleFactor: 0.1,
    fillValue: -32767,
    dtype: "<i2"
  },
  "VGRD_10maboveground": {
    longName: "V-Component of Wind",
    units: "m/s",
    scaleFactor: 0.1,
    fillValue: -32767,
    dtype: "<i2"
  }
};

export default {
  // Point data extraction - single location, multiple variables
  "point-data": {
    endpoint: null, // Dynamic endpoint based on dataset
    params: {
      dataset: null, // Dataset identifier (e.g., "aorc-v1.1")
      variables: null, // Array of variable names or "all"
      latitude: null, // Single latitude coordinate
      longitude: null, // Single longitude coordinate
      startDate: null, // ISO date string
      endDate: null, // ISO date string
      format: null // Output format: "json", "csv", "netcdf"
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Grid data extraction - spatial subset, multiple variables
  "grid-data": {
    endpoint: null, // Dynamic endpoint based on dataset
    params: {
      dataset: null, // Dataset identifier
      variables: null, // Array of variable names or "all"
      bbox: null, // Bounding box: [west, south, east, north]
      startDate: null, // ISO date string
      endDate: null, // ISO date string
      format: null // Output format
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Time series extraction - single variable, multiple locations
  "timeseries-data": {
    endpoint: null, // Dynamic endpoint based on dataset
    params: {
      dataset: null, // Dataset identifier
      variable: null, // Single variable name
      locations: null, // Array of [lat, lon] pairs
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

  // Bulk data extraction for analysis
  "bulk-extraction": {
    endpoint: null, // Dynamic endpoint based on dataset
    params: {
      dataset: null, // Dataset identifier
      variables: null, // Array of variable names
      bbox: null, // Bounding box
      startDate: null, // ISO date string
      endDate: null, // ISO date string
      timeStep: null, // Temporal aggregation: "1H", "3H", "6H", "12H", "1D"
      spatialStep: null, // Spatial aggregation factor
      format: null // Output format
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  requirements: {
    needProxy: false,
    requireskey: false,
  },

  info: {
    returnFormats: "json, csv, netcdf",
    MoreInfo: "https://noaa.gov/aorc",
    About: "NOAA AORC provides high-resolution meteorological forcing data for hydrologic modeling and analysis. Data is stored in Zarr format on Amazon S3 with no authentication required."
  },

  // Available datasets and their configurations
  datasets: AORC_DATASETS,

  // Available variables and their properties
  variables: AORC_VARIABLES,

  "endpoint-info": {
    "point-data": {
      paramFormat: {
        dataset: "String - Dataset identifier (e.g., 'aorc-v1.1')",
        variables: "Array/String - Variable names or 'all' for all variables",
        latitude: "Number - Latitude coordinate (-90 to 90)",
        longitude: "Number - Longitude coordinate (-180 to 180)",
        startDate: "String - Start date in ISO format (YYYY-MM-DDTHH:mm:ssZ)",
        endDate: "String - End date in ISO format (YYYY-MM-DDTHH:mm:ssZ)",
        format: "String - Output format ('json', 'csv', 'netcdf')"
      },
      infoSource: "https://noaa.gov/aorc",
      example: {
        dataset: "aorc-v1.1",
        variables: ["APCP_surface", "TMP_2maboveground"],
        latitude: 40.7128,
        longitude: -74.0060,
        startDate: "2020-01-01T00:00:00Z",
        endDate: "2020-01-07T23:00:00Z",
        format: "json",
        exampleRequest: "Extract precipitation and temperature data for New York City for one week"
      }
    },
    "grid-data": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        variables: "Array/String - Variable names or 'all'",
        bbox: "Array - Bounding box [west, south, east, north]",
        startDate: "String - Start date in ISO format",
        endDate: "String - End date in ISO format",
        format: "String - Output format"
      },
      infoSource: "https://noaa.gov/aorc",
      example: {
        dataset: "aorc-v1.1",
        variables: "all",
        bbox: [-75.0, 40.0, -73.0, 42.0],
        startDate: "2020-01-01T00:00:00Z",
        endDate: "2020-01-02T00:00:00Z",
        format: "netcdf",
        exampleRequest: "Extract all variables for New York region for 24 hours"
      }
    },
    "timeseries-data": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        variable: "String - Single variable name",
        locations: "Array - Array of [latitude, longitude] coordinate pairs",
        startDate: "String - Start date in ISO format",
        endDate: "String - End date in ISO format",
        format: "String - Output format"
      },
      infoSource: "https://noaa.gov/aorc",
      example: {
        dataset: "aorc-v1.1",
        variable: "APCP_surface",
        locations: [[40.7128, -74.0060], [34.0522, -118.2437]],
        startDate: "2020-01-01T00:00:00Z",
        endDate: "2020-01-31T23:00:00Z",
        format: "csv",
        exampleRequest: "Extract precipitation time series for New York and Los Angeles"
      }
    },
    "dataset-info": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        info: "String - Information type ('variables', 'spatial', 'temporal', 'metadata')"
      },
      infoSource: "https://noaa.gov/aorc",
      example: {
        dataset: "aorc-v1.1",
        info: "variables",
        exampleRequest: "Get information about available variables in the dataset"
      }
    },
    "bulk-extraction": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        variables: "Array - Variable names to extract",
        bbox: "Array - Bounding box [west, south, east, north]",
        startDate: "String - Start date in ISO format",
        endDate: "String - End date in ISO format",
        timeStep: "String - Temporal aggregation ('1H', '3H', '6H', '12H', '1D')",
        spatialStep: "Number - Spatial aggregation factor",
        format: "String - Output format"
      },
      infoSource: "https://noaa.gov/aorc",
      example: {
        dataset: "aorc-v1.1",
        variables: ["APCP_surface", "TMP_2maboveground"],
        bbox: [-130.0, 20.0, -60.0, 55.0],
        startDate: "2020-01-01T00:00:00Z",
        endDate: "2020-12-31T23:00:00Z",
        timeStep: "1D",
        spatialStep: 10,
        format: "json",
        exampleRequest: "Extract daily precipitation and temperature for CONUS with 10x spatial aggregation"
      }
    }
  }
};
