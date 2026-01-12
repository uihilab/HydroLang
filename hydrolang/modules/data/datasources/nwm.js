/**
 * National Water Model (NWM) Retrospective Data
 * Provides access to historical streamflow data stored in Zarr format on S3
 * @type {Object}
 * @name NWM
 * @memberof datasources
 */

// NWM Dataset configurations - Updated to match actual AWS S3 structure and Zarr metadata
const NWM_DATASETS = {
  "nwm-retrospective-2-1-zarr-pds": {
    baseUrl: "https://noaa-nwm-retrospective-2-1-zarr-pds.s3.amazonaws.com",
    format: "zarr",
    description: "NWM Retrospective Version 2.1 - Zarr format - 41-year simulation (1979-2020)",
    spatial: {
      latitude: { min: 24.0, max: 53.0, resolution: 0.029 },
      longitude: { min: -125.0, max: -67.0, resolution: 0.029 },
      crs: "Lambert Conformal Conic",
      proj4: "+proj=lcc +units=m +a=6370000.0 +b=6370000.0 +lat_1=30.0 +lat_2=60.0 +lat_0=40.0 +lon_0=-97.0 +x_0=0 +y_0=0 +k_0=1.0 +nadgrids=@"
    },
    temporal: {
      start: "1979-02-01T01:00:00Z", // Based on metadata: "hours since 1979-02-01T01:00:00"
      end: "2020-12-31T23:00:00Z",
      resolution: "1H",
      version: "2.1",
      totalTimeSteps: 367439,
      timeUnits: "hours since 1979-02-01T01:00:00"
    },
    features: {
      totalCount: 2776738,
      description: "NHDPlusv2 ComIDs within CONUS, arbitrary Reach IDs outside of CONUS"
    },
    products: {
      chrtout: {
        frequency: "1H",
        description: "Streamflow values at points associated with flow lines",
        zarrPath: "chrtout.zarr"
      }
    }
  },
  "nwm-retrospective-2-1-pds": {
    baseUrl: "https://noaa-nwm-retrospective-2-1-pds.s3.amazonaws.com",
    format: "netcdf",
    description: "NWM Retrospective Version 2.1 - NetCDF format - 41-year simulation (1979-2020)",
    spatial: {
      latitude: { min: 24.0, max: 53.0, resolution: 0.029 },
      longitude: { min: -125.0, max: -67.0, resolution: 0.029 }
    },
    temporal: {
      start: "1979-02-01T00:00:00Z",
      end: "2020-12-31T23:00:00Z",
      resolution: "1H",
      version: "2.1"
    },
    products: {
      chrtout: { frequency: "1H", description: "Streamflow values at points associated with flow lines" },
      lakeout: { frequency: "1H", description: "Output values at points associated with reservoirs (lakes)" },
      ldasout: { frequency: "3H", description: "Land surface model output" },
      rtout: { frequency: "3H", description: "Ponded water and depth to soil saturation" },
      gwout: { frequency: "3H", description: "Conceptual nonlinear groundwater reservoir output" }
    }
  },
  "nwm-retrospective-2-0-pds": {
    baseUrl: "https://noaa-nwm-retro-v2.0-pds.s3.amazonaws.com",
    description: "NWM Retrospective Version 2.0 - 26-year simulation (1993-2018)",
    spatial: {
      latitude: { min: 24.0, max: 53.0, resolution: 0.029 },
      longitude: { min: -125.0, max: -67.0, resolution: 0.029 }
    },
    temporal: {
      start: "1993-01-01T00:00:00Z",
      end: "2018-12-31T23:00:00Z",
      resolution: "1H",
      version: "2.0"
    },
    products: {
      chrtout: { frequency: "1H", description: "Streamflow values at points associated with flow lines" },
      lakeout: { frequency: "1H", description: "Output values at points associated with reservoirs (lakes)" },
      ldasout: { frequency: "3H", description: "Land surface model output" },
      rtout: { frequency: "3H", description: "Ponded water and depth to soil saturation" },
      gwout: { frequency: "3H", description: "Conceptual nonlinear groundwater reservoir output" }
    }
  },
  "nwm-retrospective-1-2-pds": {
    baseUrl: "https://nwm-archive.s3.amazonaws.com",
    description: "NWM Retrospective Version 1.2 - 25-year simulation (1993-2017)",
    spatial: {
      latitude: { min: 24.0, max: 53.0, resolution: 0.029 },
      longitude: { min: -125.0, max: -67.0, resolution: 0.029 }
    },
    temporal: {
      start: "1993-01-01T00:00:00Z",
      end: "2017-12-31T23:00:00Z",
      resolution: "1H",
      version: "1.2"
    },
    products: {
      chrtout: { frequency: "1H", description: "Streamflow values at points associated with flow lines" },
      lakeout: { frequency: "1H", description: "Output values at points associated with reservoirs (lakes)" },
      ldasout: { frequency: "3H", description: "Land surface model output" },
      rtout: { frequency: "3H", description: "Ponded water and depth to soil saturation" }
    }
  }
};

// Available NWM variables and their properties - Updated to match official documentation
const NWM_VARIABLES = {
  // CHRTOUT variables (Streamflow at points) - Updated to match Zarr metadata
  "streamflow": {
    longName: "River Flow",
    units: "m³/s",
    scaleFactor: 0.009999999776482582, // From Zarr metadata
    addOffset: 0.0, // From Zarr metadata
    fillValue: -999900,
    missingValue: -999900,
    dtype: "<i4", // From Zarr metadata
    product: "chrtout",
    versions: ["2.1", "2.0", "1.2"],
    dimensions: ["time", "feature_id"],
    shape: [367439, 2776738], // From Zarr metadata
    chunks: [672, 30000] // From Zarr metadata
  },
  "velocity": {
    longName: "River Velocity",
    units: "m/s",
    scaleFactor: 0.009999999776482582, // From Zarr metadata
    addOffset: 0.0, // From Zarr metadata
    fillValue: -999900,
    missingValue: -999900,
    dtype: "<i4", // From Zarr metadata
    product: "chrtout",
    versions: ["2.1", "2.0", "1.2"],
    dimensions: ["time", "feature_id"],
    shape: [367439, 2776738], // From Zarr metadata
    chunks: [672, 30000] // From Zarr metadata
  },
  "elevation": {
    longName: "Feature Elevation",
    units: "m",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "chrtout",
    versions: ["2.1", "2.0"]
  },
  "q_lateral": {
    longName: "Total runoff into channel reach",
    units: "m³/s",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "chrtout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "velocity": {
    longName: "River velocity",
    units: "m/s",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "chrtout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "qSfcLatRunoff": {
    longName: "Runoff from terrain routing into channel",
    units: "m³/s",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "chrtout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "qBucket": {
    longName: "Flux from conceptual groundwater basin into channel",
    units: "m³/s",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "chrtout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "qBtmVertRunoff": {
    longName: "Runoff from bottom of soil column to conceptual groundwater basin",
    units: "m³",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "chrtout",
    versions: ["2.1", "2.0", "1.2"]
  },

  // LAKEOUT variables (Reservoir/lake data)
  "reservoir_type": {
    longName: "Reservoir Type",
    units: "dimensionless",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "int32",
    product: "lakeout",
    versions: ["2.1"]
  },
  "reservoir_assimilated_value": {
    longName: "Reservoir Assimilated Value",
    units: "m³/s",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "lakeout",
    versions: ["2.1"]
  },
  "water_sfc_elev": {
    longName: "Water Surface Elevation",
    units: "m",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "lakeout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "inflow": {
    longName: "Lake Inflow",
    units: "m³/s",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "lakeout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "outflow": {
    longName: "Lake Outflow",
    units: "m³/s",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "lakeout",
    versions: ["2.1", "2.0", "1.2"]
  },

  // LDASOUT variables (Land surface model output)
  "COSZ": {
    longName: "Cosine of zenith angle",
    units: "dimensionless",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0"]
  },
  "FSA": {
    longName: "Total absorbed shortwave radiation",
    units: "W/m²",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "FIRA": {
    longName: "Total net longwave radiation to atmosphere",
    units: "W/m²",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "HFX": {
    longName: "Total sensible heat to atmosphere",
    units: "W/m²",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "LH": {
    longName: "Total latent heat to the atmosphere",
    units: "W/m²",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "ALBEDO": {
    longName: "Surface albedo",
    units: "dimensionless",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0"]
  },
  "UGDRNOFF": {
    longName: "Accumulated underground runoff",
    units: "mm",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "TRAD": {
    longName: "Surface radiative temperature",
    units: "K",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "SOIL_W": {
    longName: "Liquid volumetric soil moisture",
    units: "m³/m³",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "SOIL_M": {
    longName: "Volumetric soil moisture (liquid and frozen)",
    units: "m³/m³",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "SNOWH": {
    longName: "Snow depth",
    units: "m",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "SNEQV": {
    longName: "Snow water equivalent",
    units: "kg/m²",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "FSNO": {
    longName: "Snow-cover fraction on the ground",
    units: "fraction",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "ACCET": {
    longName: "Accumulated total ET",
    units: "mm",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "ldasout",
    versions: ["2.1", "2.0", "1.2"]
  },

  // RTOUT variables (Terrain routing output)
  "Zwattablrt": {
    longName: "Depth to saturation, rounded to the highest saturated layer",
    units: "m",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "rtout",
    versions: ["2.1", "2.0", "1.2"]
  },
  "sfcheadsubrt": {
    longName: "Ponded water depth",
    units: "mm",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "rtout",
    versions: ["2.1", "2.0", "1.2"]
  },

  // GWOUT variables (Groundwater reservoir output)
  "inflow": {
    longName: "Conceptual Groundwater basin inflow",
    units: "m³/s",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "gwout",
    versions: ["2.1", "2.0"]
  },
  "outflow": {
    longName: "Conceptual Groundwater basin outflow",
    units: "m³/s",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "gwout",
    versions: ["2.1", "2.0"]
  },
  "depth": {
    longName: "Conceptual Groundwater basin storage depth",
    units: "m",
    scaleFactor: 1.0,
    fillValue: -999900,
    dtype: "float32",
    product: "gwout",
    versions: ["2.1", "2.0"]
  }
};

export default {
  // Point data extraction - single location, streamflow data
  "point-data": {
    endpoint: null, // Dynamic endpoint based on dataset
      params: {
      dataset: null, // Dataset identifier (e.g., "nwm-retrospective-3-0-pds")
      variables: null, // Array of variable names (usually ["streamflow"])
      comid: null, // OPTIONAL: COMID for specific stream reach (will be auto-found from coordinates if not provided)
      latitude: null, // Latitude coordinate (required if no COMID provided)
      longitude: null, // Longitude coordinate (required if no COMID provided)
      startDate: null, // ISO date string
      endDate: null, // ISO date string
      format: null // Output format: "json", "csv", "netcdf"
    },
    methods: {
        type: "json",
      method: "GET"
    }
  },

  // Grid data extraction - spatial subset, streamflow data
  "grid-data": {
    endpoint: null, // Dynamic endpoint based on dataset
      params: {
      dataset: null, // Dataset identifier
      variables: null, // Array of variable names
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

  // Time series extraction - streamflow for multiple locations
  "timeseries-data": {
    endpoint: null, // Dynamic endpoint based on dataset
      params: {
      dataset: null, // Dataset identifier
      variable: null, // Variable name (usually "streamflow")
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
    MoreInfo: "https://docs.ciroh.org/docs/products/Data%20Management%20and%20Access%20Tools/bigquery-api/",
    About: "National Water Model Retrospective Data provides historical streamflow data for hydrologic modeling and analysis. Data is stored in Zarr format on Amazon S3 with no authentication required."
  },

  // Available datasets and their configurations
  datasets: NWM_DATASETS,

  // Available variables and their properties
  variables: NWM_VARIABLES,

    "endpoint-info": {
    "point-data": {
        paramFormat: {
        dataset: "String - Dataset identifier (e.g., 'nwm-retrospective-3-0-pds')",
        variables: "Array - Variable names (usually ['streamflow'])",
        latitude: "Number - Latitude coordinate (-90 to 90)",
        longitude: "Number - Longitude coordinate (-180 to 180)",
        startDate: "String - Start date in ISO format (YYYY-MM-DDTHH:mm:ssZ)",
        endDate: "String - End date in ISO format (YYYY-MM-DDTHH:mm:ssZ)",
        format: "String - Output format ('json', 'csv', 'netcdf')"
      },
      infoSource: "https://docs.ciroh.org/docs/products/Data%20Management%20and%20Access%20Tools/bigquery-api/",
      example: {
        dataset: "nwm-retrospective-2-1-zarr-pds",
        variables: ["streamflow"],
        latitude: 40.7128,
        longitude: -74.0060,
        startDate: "2019-07-01T00:00:00Z",
        endDate: "2019-07-02T00:00:00Z",
        format: "json",
        exampleRequest: "Extract streamflow data for New York City - COMID will be auto-found from coordinates"
      }
    },
    "grid-data": {
        paramFormat: {
        dataset: "String - Dataset identifier",
        variables: "Array - Variable names",
        bbox: "Array - Bounding box [west, south, east, north]",
        startDate: "String - Start date in ISO format",
        endDate: "String - End date in ISO format",
        format: "String - Output format"
      },
      infoSource: "https://docs.ciroh.org/docs/products/Data%20Management%20and%20Access%20Tools/bigquery-api/",
      example: {
        dataset: "nwm-retrospective-3-0-pds",
        variables: ["streamflow"],
        bbox: [-75.0, 40.0, -73.0, 42.0],
        startDate: "2020-01-01T00:00:00Z",
        endDate: "2020-01-02T00:00:00Z",
        format: "netcdf",
        exampleRequest: "Extract streamflow data for New York region for 24 hours"
      }
    },
    "timeseries-data": {
        paramFormat: {
        dataset: "String - Dataset identifier",
        variable: "String - Variable name (usually 'streamflow')",
        locations: "Array - Array of [latitude, longitude] coordinate pairs",
        startDate: "String - Start date in ISO format",
        endDate: "String - End date in ISO format",
        format: "String - Output format"
      },
      infoSource: "https://docs.ciroh.org/docs/products/Data%20Management%20and%20Access%20Tools/bigquery-api/",
      example: {
        dataset: "nwm-retrospective-3-0-pds",
        variable: "streamflow",
        locations: [[40.7128, -74.0060], [34.0522, -118.2437]],
        startDate: "2020-01-01T00:00:00Z",
        endDate: "2020-01-31T23:00:00Z",
        format: "csv",
        exampleRequest: "Extract streamflow time series for New York and Los Angeles"
      }
    },
    "dataset-info": {
        paramFormat: {
        dataset: "String - Dataset identifier",
        info: "String - Information type ('variables', 'spatial', 'temporal', 'metadata')"
      },
      infoSource: "https://docs.ciroh.org/docs/products/Data%20Management%20and%20Access%20Tools/bigquery-api/",
      example: {
        dataset: "nwm-retrospective-3-0-pds",
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
      infoSource: "https://docs.ciroh.org/docs/products/Data%20Management%20and%20Access%20Tools/bigquery-api/",
      example: {
        dataset: "nwm-retrospective-3-0-pds",
        variables: ["streamflow"],
        bbox: [-125.0, 24.0, -67.0, 53.0],
        startDate: "2020-01-01T00:00:00Z",
        endDate: "2020-12-31T23:00:00Z",
        timeStep: "1D",
        spatialStep: 10,
        format: "json",
        exampleRequest: "Extract daily streamflow for CONUS with 10x spatial aggregation"
      }
      }
    }
  };
  