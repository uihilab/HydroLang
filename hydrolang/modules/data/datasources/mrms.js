/**
 * NOAA MRMS (Multi-Radar Multi-Sensor) datasource
 * Provides access to high-resolution precipitation and radar data in GRIB2 format.
 * Supports multiple MRMS products including Radar, QPE, QPF, and Severe Weather data.
 *
 * **Data Information:**
 * - **Source:** NOAA NCEP / NSSL
 * - **Format:** GRIB2 (Compressed gz)
 * - **Resolution:** 1km (0.01°)
 * - **Updates:** 2-min (Radar), Hourly (QPE)
 * - **Coverage:** CONUS
 * - **Type:** Operational Real-time (Limited archive via HTTP)
 *
 * **Available Data Types:**
 * - `mrms-radar`: Real-time radar products (Reflectivity, Echo Tops).
 * - `mrms-qpe`: Quantitative Precipitation Estimates (Radar-only, Multi-sensor).
 * - `mrms-qpf`: Quantitative Precipitation Forecasts.
 *
 * **Key Variables:**
 * - `REF` / `REFC`: Reflectivity / Composite Reflectivity (dBZ)
 * - `PRATE` / `APCP`: Precipitation Rate / Accumulation
 * - `VIL`: Vertically Integrated Liquid
 * - `RQI`: Radar Quality Index
 *
 * @example
 * // 1. Retrieve Real-time Composite Reflectivity (Grid)
 * const radarData = await hydro.data.retrieve({
 *   params: {
 *     source: 'mrms',
 *     datatype: 'grid-data'
 *   },
 *   args: {
 *     dataset: 'mrms-radar',
 *     product: 'MergedReflectivityQCComposite',
 *     variable: 'REFC',
 *     bbox: [-98.0, 30.0, -90.0, 38.0], // Midwest/South
 *     startDate: new Date().toISOString() // Current time (approx)
 *   }
 * });
 *
 * @example
 * // 2. Retrieve 1-hour Precipitation Accumulation (QPE) for a point
 * const precipData = await hydro.data.retrieve({
 *   params: {
 *     source: 'mrms',
 *     datatype: 'point-data'
 *   },
 *   args: {
 *     dataset: 'mrms-qpe',
 *     product: 'RadarOnly_QPE_01H',
 *     variable: 'APCP',
 *     latitude: 35.4676,
 *     longitude: -97.5164, // Oklahoma City
 *     startDate: '2023-05-15T18:00:00Z'
 *   }
 * });
 *
 * @see https://mrms.ncep.noaa.gov/
 * @type {Object}
 * @name MRMS
 * @memberof datasources
 */

// MRMS Dataset configurations - GRIB2 format on NOAA servers
const MRMS_DATASETS = {
  "mrms-radar": {
    baseUrl: "https://mrms.ncep.noaa.gov",
    format: "grib2",
    description: "MRMS Radar Products - Real-time operational radar data in GRIB2 format. Provides current weather radar data with 2-minute updates.",
    spatial: {
      latitude: { min: 20.0, max: 55.0, resolution: 0.01 }, // ~1km resolution
      longitude: { min: -130.0, max: -60.0, resolution: 0.01 },
      crs: "EPSG:4326", // WGS84
      coverage: "CONUS"
    },
    temporal: {
      resolution: "2M", // 2-minute updates
      realtime: true,
      archive: false, // MRMS is primarily real-time operational
      archiveStart: null, // No historical archive via HTTP
      note: "MRMS provides real-time operational data. Historical data may be available through NCEP archives or other data portals."
    },
    products: {
      "MergedReflectivityQC": {
        description: "Merged radar reflectivity with quality control",
        path: "/3DRefl/MergedReflectivityQC_00.50",
        filename: "MRMS_MergedReflectivityQC_00.50_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "MergedReflectivityQCComposite": {
        description: "Composite reflectivity mosaic",
        path: "/3DRefl/MergedReflectivityQC_00.50",
        filename: "MRMS_MergedReflectivityQC_00.50_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "PrecipFlag": {
        description: "Precipitation type flag",
        path: "/2D/PrecipFlag",
        filename: "MRMS_PrecipFlag_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "PrecipRate": {
        description: "Precipitation rate",
        path: "/2D/PrecipRate",
        filename: "MRMS_PrecipRate_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "PCPN_TYP": {
        description: "Precipitation type classification",
        path: "/RIDGEII/L2/CONUS/PCPN_TYP",
        filename: "CONUS_L2_PCPN_TYP_{timestamp}.tif.gz",
        format: "tiff"
      },
      "RadarQualityIndex": {
        description: "Radar data quality index",
        path: "/2D/RadarQualityIndex",
        filename: "MRMS_RadarQualityIndex_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "VIL": {
        description: "Vertically integrated liquid water",
        path: "/2D/VIL",
        filename: "MRMS_VIL_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "EchoTop": {
        description: "Echo top height",
        path: "/2D/EchoTop_18",
        filename: "MRMS_EchoTop_18_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "SyntheticPrecipRateID": {
        description: "Synthetic precipitation rate identification",
        path: "/2D/SyntheticPrecipRateID",
        filename: "MRMS_SyntheticPrecipRateID_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      }
    }
  },

  "mrms-qpe": {
    baseUrl: "https://mrms.ncep.noaa.gov/data",
    format: "grib2",
    description: "MRMS Quantitative Precipitation Estimate - High-resolution precipitation data",
    spatial: {
      latitude: { min: 20.0, max: 55.0, resolution: 0.01 },
      longitude: { min: -130.0, max: -60.0, resolution: 0.01 },
      crs: "EPSG:4326",
      coverage: "CONUS"
    },
    temporal: {
      resolution: "1H", // Hourly products
      realtime: true,
      archive: true,
      archiveStart: "2014-01-01T00:00:00Z"
    },
    products: {
      "RadarOnly_QPE_01H": {
        description: "1-hour radar-only QPE",
        path: "/RadarOnly_QPE_01H",
        filename: "MRMS_RadarOnly_QPE_01H_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "RadarOnly_QPE_03H": {
        description: "3-hour radar-only QPE",
        path: "/RadarOnly_QPE_03H",
        filename: "MRMS_RadarOnly_QPE_03H_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "RadarOnly_QPE_06H": {
        description: "6-hour radar-only QPE",
        path: "/RadarOnly_QPE_06H",
        filename: "MRMS_RadarOnly_QPE_06H_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "RadarOnly_QPE_12H": {
        description: "12-hour radar-only QPE",
        path: "/RadarOnly_QPE_12H",
        filename: "MRMS_RadarOnly_QPE_12H_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "RadarOnly_QPE_15M": {
        description: "15-minute radar-only QPE",
        path: "/RadarOnly_QPE_15M",
        filename: "MRMS_RadarOnly_QPE_15M_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "RadarOnly_QPE_24H": {
        description: "24-hour radar-only QPE",
        path: "/RadarOnly_QPE_24H",
        filename: "MRMS_RadarOnly_QPE_24H_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "RadarOnly_QPE_48H": {
        description: "48-hour radar-only QPE",
        path: "/RadarOnly_QPE_48H",
        filename: "MRMS_RadarOnly_QPE_48H_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "RadarOnly_QPE_72H": {
        description: "72-hour radar-only QPE",
        path: "/RadarOnly_QPE_72H",
        filename: "MRMS_RadarOnly_QPE_72H_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "RadarOnly_QPE_Since12Z": {
        description: "Radar-only QPE since 12Z",
        path: "/RadarOnly_QPE_Since12Z",
        filename: "MRMS_RadarOnly_QPE_Since12Z_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "MultiSensor_QPE_01H_Pass1": {
        description: "1-hour multi-sensor QPE Pass 1",
        path: "/MultiSensor_QPE_01H_Pass1",
        filename: "MRMS_MultiSensor_QPE_01H_Pass1_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "MultiSensor_QPE_01H_Pass2": {
        description: "1-hour multi-sensor QPE Pass 2",
        path: "/MultiSensor_QPE_01H_Pass2",
        filename: "MRMS_MultiSensor_QPE_01H_Pass2_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      }
    }
  },

  "mrms-qpf": {
    baseUrl: "https://mrms.ncep.noaa.gov/data",
    format: "grib2",
    description: "MRMS Quantitative Precipitation Forecast - Short-term precipitation forecasts",
    spatial: {
      latitude: { min: 20.0, max: 55.0, resolution: 0.01 },
      longitude: { min: -130.0, max: -60.0, resolution: 0.01 },
      crs: "EPSG:4326",
      coverage: "CONUS"
    },
    temporal: {
      resolution: "1H",
      forecast: true,
      forecastHours: 24,
      realtime: true
    },
    products: {
      "QPF_01H": {
        description: "1-hour QPF",
        path: "/QPF/QPF_01H",
        filename: "MRMS_QPF_01H_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "QPF_03H": {
        description: "3-hour QPF",
        path: "/QPF/QPF_03H",
        filename: "MRMS_QPF_03H_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "QPF_06H": {
        description: "6-hour QPF",
        path: "/QPF/QPF_06H",
        filename: "MRMS_QPF_06H_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "QPF_12H": {
        description: "12-hour QPF",
        path: "/QPF/QPF_12H",
        filename: "MRMS_QPF_12H_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      },
      "QPF_24H": {
        description: "24-hour QPF",
        path: "/QPF/QPF_24H",
        filename: "MRMS_QPF_24H_00.00_{timestamp}.grib2.gz",
        format: "grib2"
      }
    }
  }
};

// Available MRMS variables and their GRIB2 parameter mappings
const MRMS_VARIABLES = {
  // Radar Reflectivity variables
  "REF": {
    longName: "Radar Reflectivity",
    units: "dBZ",
    grib2Code: "0,0,16", // Parameter category 0, subcategory 0, parameter 16
    levelType: "heightAboveGround",
    level: "1000", // 1000 m AGL
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["MergedReflectivityQC", "MergedReflectivityQCComposite"]
  },

  "REFC": {
    longName: "Composite Reflectivity",
    units: "dBZ",
    grib2Code: "0,0,16",
    levelType: "heightAboveGround",
    level: "1000",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["MergedReflectivityQCComposite"]
  },

  // Precipitation variables
  "PRATE": {
    longName: "Precipitation Rate",
    units: "kg/m²/s",
    grib2Code: "0,1,7", // Parameter category 0, subcategory 1, parameter 7
    levelType: "surface",
    level: "0",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["PrecipRate"]
  },

  "APCP": {
    longName: "Total Precipitation",
    units: "kg/m²",
    grib2Code: "0,1,8", // Parameter category 0, subcategory 1, parameter 8
    levelType: "surface",
    level: "0",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["PrecipRate", "PCPN_TYP", "RadarOnly_QPE_01H", "RadarOnly_QPE_24H", "QPF_01H", "QPF_24H"]
  },

  // Severe Weather variables
  "VIL": {
    longName: "Vertically Integrated Liquid",
    units: "kg/m²",
    grib2Code: "0,0,193", // Parameter category 0, subcategory 0, parameter 193
    levelType: "surface",
    level: "0",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["VerticallyIntegratedLiquid"]
  },

  "ETOP": {
    longName: "Echo Top Height",
    units: "m",
    grib2Code: "0,0,194", // Parameter category 0, subcategory 0, parameter 194
    levelType: "surface",
    level: "0",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["EchoTop"]
  },

  // Quality Control variables
  "RQI": {
    longName: "Radar Quality Index",
    units: "dimensionless",
    grib2Code: "0,0,192", // Parameter category 0, subcategory 0, parameter 192
    levelType: "surface",
    level: "0",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["RadarQualityIndex"]
  },

  "PFLAG": {
    longName: "Precipitation Type Flag",
    units: "dimensionless",
    grib2Code: "0,1,195", // Parameter category 0, subcategory 1, parameter 195
    levelType: "surface",
    level: "0",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "int32",
    products: ["PrecipFlag"]
  },

  "SPRI": {
    longName: "Synthetic Precipitation Rate Identification",
    units: "kg/m²/s",
    grib2Code: "0,1,22", // Dedicated SPRI parameter
    levelType: "surface",
    level: "0",
    scaleFactor: 1.0,
    fillValue: -9999,
    dtype: "float32",
    products: ["SyntheticPrecipRateID"]
  }
};

export default {
  // Point data extraction - single location, single variable
  "point-data": {
    endpoint: null, // Dynamic endpoint based on dataset and product
    params: {
      dataset: null, // Dataset identifier (e.g., "mrms-radar", "mrms-qpe")
      product: null, // MRMS product (e.g., "MergedReflectivityQC", "RadarOnly_QPE_01H")
      variable: null, // Variable name (e.g., "REF", "APCP")
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

  // Grid data extraction - spatial subset
  "grid-data": {
    endpoint: null, // Dynamic endpoint based on dataset and product
    params: {
      dataset: null, // Dataset identifier
      product: null, // MRMS product
      variable: null, // Variable name
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

  // Time series extraction - single location, time series
  "timeseries-data": {
    endpoint: null, // Dynamic endpoint based on dataset and product
    params: {
      dataset: null, // Dataset identifier
      product: null, // MRMS product
      variable: null, // Variable name
      latitude: null, // Single latitude coordinate
      longitude: null, // Single longitude coordinate
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
      info: null // Type of info: "variables", "spatial", "temporal", "metadata", "products"
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Available products listing
  "available-products": {
    endpoint: null, // Dynamic endpoint based on dataset
    params: {
      dataset: null, // Dataset identifier
      date: null // Date for which to list available products
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
    MoreInfo: "https://mrms.ncep.noaa.gov/",
    Documentation: "https://github.com/NOAA-National-Severe-Storms-Laboratory/mrms-support",
    About: "NOAA MRMS provides high-resolution multi-radar multi-sensor data including precipitation estimates, radar reflectivity, and severe weather products in GRIB2 format. Filename pattern: MRMS_[Product]_[Height]_[YYYYMMDD]-[HHMMSS].grib2.gz"
  },

  // Available datasets and their configurations
  datasets: MRMS_DATASETS,

  // Available variables and their properties
  variables: MRMS_VARIABLES,

  // URL generation helper
  generateURL: function (product, timestamp, dataset = 'mrms-radar') {
    const datasetConfig = MRMS_DATASETS[dataset];
    if (!datasetConfig) {
      throw new Error(`Unknown MRMS dataset: ${dataset}`);
    }

    const productConfig = datasetConfig.products[product];
    if (!productConfig) {
      throw new Error(`Unknown MRMS product: ${product}`);
    }

    // Format timestamp with seconds (MRMS standard: YYYYMMDD-HHMMSS for GRIB2, YYYYMMDD_HHMMSS for TIFF)
    const year = timestamp.getUTCFullYear();
    const month = String(timestamp.getUTCMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getUTCDate()).padStart(2, '0');
    const hour = String(timestamp.getUTCHours()).padStart(2, '0');
    const minute = String(timestamp.getUTCMinutes()).padStart(2, '0');
    const second = String(timestamp.getUTCSeconds()).padStart(2, '0');

    // Generate timestamp string based on format
    let timestampStr;
    if (productConfig.format === 'tiff') {
      timestampStr = `${year}${month}${day}_${hour}${minute}${second}`;
    } else {
      timestampStr = `${year}${month}${day}-${hour}${minute}${second}`;
    }

    // Replace timestamp placeholder in filename
    const filename = productConfig.filename.replace('{timestamp}', timestampStr);

    return `${datasetConfig.baseUrl}${productConfig.path}/${filename}`;
  },

  "endpoint-info": {
    "point-data": {
      paramFormat: {
        dataset: "String - Dataset identifier (e.g., 'mrms-radar', 'mrms-qpe')",
        product: "String - MRMS product name (e.g., 'MergedReflectivityQC', 'RadarOnly_QPE_01H')",
        variable: "String - Variable name (e.g., 'REF', 'APCP')",
        latitude: "Number - Latitude coordinate (20.0 to 55.0)",
        longitude: "Number - Longitude coordinate (-130.0 to -60.0)",
        startDate: "String - Start date in ISO format (YYYY-MM-DDTHH:mm:ssZ)",
        endDate: "String - End date in ISO format (YYYY-MM-DDTHH:mm:ssZ)",
        format: "String - Output format ('json', 'csv', 'netcdf')"
      },
      infoSource: "https://mrms.ncep.noaa.gov/",
      example: {
        dataset: "mrms-qpe",
        product: "RadarOnly_QPE_01H",
        variable: "APCP",
        latitude: 40.7128,
        longitude: -74.0060,
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-01T01:00:00Z",
        format: "json",
        exampleRequest: "Extract 1-hour precipitation accumulation for New York City"
      }
    },
    "grid-data": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        product: "String - MRMS product name",
        variable: "String - Variable name",
        bbox: "Array - Bounding box [west, south, east, north]",
        startDate: "String - Start date in ISO format",
        endDate: "String - End date in ISO format",
        format: "String - Output format"
      },
      infoSource: "https://mrms.ncep.noaa.gov/",
      example: {
        dataset: "mrms-radar",
        product: "MergedReflectivityQCComposite",
        variable: "REFC",
        bbox: [-75.0, 40.0, -73.0, 42.0],
        startDate: "2024-01-01T12:00:00Z",
        endDate: "2024-01-01T12:02:00Z",
        format: "netcdf",
        exampleRequest: "Extract composite reflectivity for New York region"
      }
    },
    "timeseries-data": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        product: "String - MRMS product name",
        variable: "String - Variable name",
        latitude: "Number - Latitude coordinate",
        longitude: "Number - Longitude coordinate",
        startDate: "String - Start date in ISO format",
        endDate: "String - End date in ISO format",
        format: "String - Output format"
      },
      infoSource: "https://mrms.ncep.noaa.gov/",
      example: {
        dataset: "mrms-qpe",
        product: "GaugeCorr_QPE_01H",
        variable: "APCP",
        latitude: 40.7128,
        longitude: -74.0060,
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-02T00:00:00Z",
        format: "csv",
        exampleRequest: "Extract hourly precipitation time series for New York City"
      }
    },
    "dataset-info": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        info: "String - Information type ('variables', 'spatial', 'temporal', 'metadata', 'products')"
      },
      infoSource: "https://mrms.ncep.noaa.gov/",
      example: {
        dataset: "mrms-radar",
        info: "products",
        exampleRequest: "Get list of available radar products"
      }
    },
    "available-products": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        date: "String - Date in YYYY-MM-DD format"
      },
      infoSource: "https://mrms.ncep.noaa.gov/",
      example: {
        dataset: "mrms-qpe",
        date: "2024-01-01",
        exampleRequest: "List available QPE products for January 1, 2024"
      }
    }
  }
};
