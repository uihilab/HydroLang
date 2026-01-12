/**
 * European Centre for Medium-Range Weather Forecasts (ECMWF) API
 * This API provides access to various weather and climate data products including
 * forecasts, reanalysis datasets, and climate projections.
 * 
 * **Data Information:**
 * - **Source:** ECMWF & Copernicus Climate Data Store (CDS)
 * - **Format:** GRIB2, NetCDF (requires conversion/processing)
 * - **Key Products:** ERA5 (Reanalysis), Seasonal Forecasts, High-res Operations
 * - **Access:** **REQUIRES API KEY** (See: https://cds.climate.copernicus.eu/api-how-to)
 *
 * **Available Data Types:**
 * - `era5`: ERA5 Reanalysis data (Hourly, Monthly).
 * - `seasonal-forecast`: Seasonal long-range forecasts.
 * - `climate-projections`: CMIP6 global climate projections.
 * - `forecast-grib2`: Operational forecasts (Real-time).
 * - `point-data` / `grid-data`: Spatial extractions.
 *
 * **Example Usage:**
 * 
 * @example
 * // 1. Retrieve ERA5 Reanalysis Data (Surface Temperature)
 * // Note: Response is often binary (GRIB/NetCDF), requires params.process=true or manual handling
 * const era5Data = await hydro.data.retrieve({
 *   params: {
 *     source: 'ecmwf',
 *     datatype: 'era5',
 *     key: 'YOUR_ECMWF_API_KEY'
 *   },
 *   args: {
 *     product_type: 'reanalysis',
 *     variable: ['2m_temperature'],
 *     year: '2022',
 *     month: '01',
 *     day: '01',
 *     time: ['12:00'],
 *     area: [50, -10, 40, 10], // Spatial subset
 *     format: 'netcdf'
 *   }
 * });
 *
 * @example
 * // 2. Retrieve Operational Forecast (GRIB2)
 * const forecast = await hydro.data.retrieve({
 *   params: {
 *     source: 'ecmwf',
 *     datatype: 'forecast-grib2'
 *   },
 *   args: {
 *     date: '20230101',
 *     time: '00',
 *     step: '24', // 24-hour forecast
 *     param: '167' // 2m Temperature parameter ID
 *   }
 * });
 *
 * @see https://confluence.ecmwf.int/display/WEBAPI/ECMWF+Web+API
 * @type {Object}
 * @name ECMWF
 * @memberof datasources
 */

const defaultExport = {
  /**
   * Generates the URL/Endpoint for ECMWF data based on user arguments.
   * @param {Object} args - Arguments for the request
   * @param {string} dataType - Type of data requested (mapped to dataset key)
   * @returns {string} Endpoint URL
   */
  sourceType: function (args, dataType) {
    console.log(`[ECMWF Debug] sourceType called with dataType: ${dataType}`);
    // Default to era5-grib2 if not specified or known, similar to chirps
    // Note: dataType here corresponds to 'dataset' in ecmwf config usually

    // Check if this.datasets is accessible
    if (!this.datasets) {
      console.error("[ECMWF Debug] this.datasets is undefined!");
      // Fallback to accessing via the variable if 'this' context is lost (though it shouldn't be)
      if (defaultExport && defaultExport.datasets) {
        console.log("[ECMWF Debug] Recovered datasets from defaultExport variable.");
        return defaultExport.sourceType(args, dataType); // Be careful of recursion if context matches
      }
    }

    const datasetKey = (dataType && this.datasets[dataType]) ? dataType : "era5-grib2";
    console.log(`[ECMWF Debug] Resolved datasetKey: ${datasetKey}`);

    const config = this.datasets[datasetKey];

    if (!config) {
      throw new Error(`ECMWF Dataset '${dataType}' is not supported or invalid.`);
    }

    console.log(`[ECMWF Debug] Config endpoint: ${config.endpoint}`);

    // Auto-construct full resource URL for CDS API
    if (config.endpoint.includes('cds.climate.copernicus.eu') && config.params && config.params.dataset) {
      const fullUrl = `${config.endpoint}/resources/${config.params.dataset}`;
      console.log(`[ECMWF Debug] Constructed full URL: ${fullUrl}`);
      return fullUrl;
    }

    return config.endpoint;
  },



  datasets: {
    // Get MARS data (Meteorological Archival and Retrieval System)
    "mars-data": {
      endpoint: "https://api.ecmwf.int/v1/services/mars/requests",
      params: {
        dataset: null,
        date: null,
        expver: null,
        levtype: null,
        param: null,
        step: null,
        stream: null,
        time: null,
        type: null,
        target: null,
        format: null,
        area: null
      },
      methods: {
        type: "json",
        method: "POST"
      }
    },

    // Get data from the ERA5 reanalysis dataset
    "era5": {
      endpoint: "https://api.ecmwf.int/v1/services/cds/datasets/reanalysis-era5-single-levels",
      params: {
        product_type: null,
        format: null,
        variable: null,
        year: null,
        month: null,
        day: null,
        time: null,
        area: null
      },
      methods: {
        type: "json",
        method: "POST"
      }
    },

    // Get seasonal forecast data
    "seasonal-forecast": {
      endpoint: "https://api.ecmwf.int/v1/services/cds/datasets/seasonal-monthly-single-levels",
      params: {
        originating_centre: null,
        system: null,
        variable: null,
        product_type: null,
        year: null,
        month: null,
        leadtime_month: null,
        format: null
      },
      methods: {
        type: "json",
        method: "POST"
      }
    },

    // Get climate projections data
    "climate-projections": {
      endpoint: "https://api.ecmwf.int/v1/services/cds/datasets/projections-cmip6",
      params: {
        format: null,
        experiment: null,
        temporal_resolution: null,
        variable: null,
        model: null,
        date: null,
        area: null
      },
      methods: {
        type: "json",
        method: "POST"
      }
    },

    // ECMWF GRIB2 data access (direct file access)
    "grib2-data": {
      endpoint: null, // Dynamic endpoint based on product type
      params: {
        product: null, // Product type: 'oper', 'enfo', 'wave', 'seasonal', 'monthly'
        date: null, // Date in YYYYMMDD format
        time: null, // Time in HH format
        step: null, // Forecast step
        param: null, // Parameter code
        levtype: null, // Level type: 'sfc', 'pl', 'ml', 'pt', 'pv'
        levelist: null, // Level values
        area: null, // Area specification
        grid: null, // Grid resolution
        format: "grib2" // Always GRIB2 for this endpoint
      },
      methods: {
        type: "binary",
        method: "GET"
      }
    },

    // Explicit raw-grib2 config as specific alias for direct retrieval testing
    "raw-grib2": {
      endpoint: "https://cds.climate.copernicus.eu/api/v2",
      params: {
        dataset: "reanalysis-era5-single-levels",
        product_type: "reanalysis",
        format: "grib",
      },
      methods: {
        type: "binary",
        method: "POST"
      }
    },

    // Enhanced ERA5 data with GRIB2 format option
    "era5-grib2": {
      endpoint: "https://cds.climate.copernicus.eu/api/v2",
      params: {
        dataset: "reanalysis-era5-single-levels",
        product_type: "reanalysis",
        format: "grib",
        variable: null,
        year: null,
        month: null,
        day: null,
        time: null,
        area: null
      },
      methods: {
        type: "json",
        method: "POST"
      }
    },

    // ECMWF forecast data in GRIB2 format
    "forecast-grib2": {
      endpoint: "https://api.ecmwf.int/v1/services/mars/requests",
      params: {
        class: "od", // Operational dissemination
        date: null,
        expver: "1",
        levtype: null,
        param: null,
        step: null,
        stream: null, // oper, enfo, wave
        time: null,
        type: "fc", // Forecast
        target: null,
        format: "grib2",
        area: null
      },
      methods: {
        type: "json",
        method: "POST"
      }
    },

    // Point data extraction - single location, single variable
    "point-data": {
      endpoint: null, // Dynamic endpoint based on dataset
      params: {
        dataset: null, // Dataset identifier (e.g., "era5")
        variable: null, // Variable name (e.g., "2m_temperature", "total_precipitation")
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
      endpoint: null, // Dynamic endpoint based on dataset
      params: {
        dataset: null, // Dataset identifier
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
      endpoint: null, // Dynamic endpoint based on dataset
      params: {
        dataset: null, // Dataset identifier
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

    // Available variables
    "available-variables": {
      endpoint: null,
      params: {},
      methods: {
        type: "json",
        method: "GET"
      }
    }
  },

  requirements: {
    needProxy: true, // ECMWF data should use proxy for CORS
    requireskey: true,
    keyname: "key",
  },

  info: {
    returnFormats: "grib, grib2, netcdf, json",
    MoreInfo: "https://confluence.ecmwf.int/display/WEBAPI/ECMWF+Web+API",
    About: "European Centre for Medium-Range Weather Forecasts (ECMWF) API provides access to various weather and climate data products including GRIB2 format support. Requires registration and an API key."
  },

  "endpoint-info": {
    "mars-data": {
      paramFormat: {
        dataset: "String - Dataset name (e.g., 'oper', 'era5')",
        date: "String - Date in YYYYMMDD format",
        expver: "String - Experiment version",
        levtype: "String - Level type (e.g., 'sfc' for surface)",
        param: "String - Parameter(s) to retrieve (e.g., 't2m,tp')",
        step: "String - Forecast step(s)",
        stream: "String - Stream type (e.g., 'oper', 'enfo')",
        time: "String - Time of day in HH:MM format",
        type: "String - Type of data (e.g., 'an' for analysis, 'fc' for forecast)",
        target: "String - Target filename",
        format: "String - Output format (e.g., 'grib', 'netcdf')",
        area: "String - Geographic area [north, west, south, east]"
      },
      infoSource: "https://confluence.ecmwf.int/display/WEBAPI/MARS+service",
      example: {
        dataset: "era5",
        date: "20200101",
        levtype: "sfc",
        param: "t2m",
        target: "output.grib",
        exampleRequest: "POST to https://api.ecmwf.int/v1/services/mars/requests with parameters: {'dataset': 'era5', 'date': '20200101', 'levtype': 'sfc', 'param': 't2m', 'target': 'output.grib'}"
      }
    },
    "era5": {
      paramFormat: {
        product_type: "String - Product type (e.g., 'reanalysis')",
        format: "String - Output format (e.g., 'grib', 'netcdf')",
        variable: "Array - Variables to retrieve (e.g., ['2m_temperature', 'total_precipitation'])",
        year: "String/Array - Year(s) to retrieve data for",
        month: "String/Array - Month(s) to retrieve data for",
        day: "String/Array - Day(s) to retrieve data for",
        time: "String/Array - Time(s) of day (e.g., ['00:00', '12:00'])",
        area: "Array - Geographic area [north, west, south, east]"
      },
      infoSource: "https://confluence.ecmwf.int/display/CKB/ERA5%3A+data+documentation",
      example: {
        product_type: "reanalysis",
        variable: ["2m_temperature"],
        year: "2020",
        month: "01",
        day: "01",
        time: ["00:00", "12:00"],
        format: "netcdf",
        exampleRequest: "POST to https://api.ecmwf.int/v1/services/cds/datasets/reanalysis-era5-single-levels with parameters: {'product_type': 'reanalysis', 'variable': ['2m_temperature'], 'year': '2020', 'month': '01', 'day': '01', 'time': ['00:00', '12:00'], 'format': 'netcdf'}"
      }
    },
    "seasonal-forecast": {
      paramFormat: {
        originating_centre: "String - Originating center (e.g., 'ecmwf')",
        system: "String - System version",
        variable: "Array - Variables to retrieve",
        product_type: "String - Product type (e.g., 'monthly_mean')",
        year: "String/Array - Year(s) to retrieve data for",
        month: "String/Array - Month(s) to retrieve data for",
        leadtime_month: "String/Array - Lead time in months",
        format: "String - Output format"
      },
      infoSource: "https://confluence.ecmwf.int/display/CKB/Seasonal+forecasts+and+the+Copernicus+Climate+Change+Service",
      example: {
        originating_centre: "ecmwf",
        variable: ["2m_temperature"],
        product_type: "monthly_mean",
        year: "2020",
        month: "01",
        leadtime_month: ["1", "2", "3"],
        format: "netcdf",
        exampleRequest: "POST to https://api.ecmwf.int/v1/services/cds/datasets/seasonal-monthly-single-levels with parameters: {'originating_centre': 'ecmwf', 'variable': ['2m_temperature'], 'product_type': 'monthly_mean', 'year': '2020', 'month': '01', 'leadtime_month': ['1', '2', '3'], 'format': 'netcdf'}"
      }
    },
    "climate-projections": {
      paramFormat: {
        format: "String - Output format (e.g., 'zip', 'netcdf')",
        experiment: "String - Experiment name (e.g., 'historical', 'ssp5_8_5')",
        temporal_resolution: "String - Temporal resolution (e.g., 'monthly', 'daily')",
        variable: "Array - Variables to retrieve",
        model: "String - Climate model name",
        date: "String - Date range",
        area: "Array - Geographic area [north, west, south, east]"
      },
      infoSource: "https://confluence.ecmwf.int/display/CKB/CMIP6%3A+Global+climate+projections",
      example: {
        experiment: "historical",
        temporal_resolution: "monthly",
        variable: ["near_surface_air_temperature"],
        model: "mpi_esm1_2_hr",
        date: "2000-2010",
        format: "netcdf",
        exampleRequest: "POST to https://api.ecmwf.int/v1/services/cds/datasets/projections-cmip6 with parameters: {'experiment': 'historical', 'temporal_resolution': 'monthly', 'variable': ['near_surface_air_temperature'], 'model': 'mpi_esm1_2_hr', 'date': '2000-2010', 'format': 'netcdf'}"
      }
    },
    "grib2-data": {
      paramFormat: {
        product: "String - Product type ('oper', 'enfo', 'wave', 'seasonal', 'monthly')",
        date: "String - Date in YYYYMMDD format",
        time: "String - Time in HH format (e.g., '00', '12')",
        step: "String - Forecast step in hours (e.g., '0', '6', '12')",
        param: "String - GRIB2 parameter code (e.g., '167' for 2m temperature)",
        levtype: "String - Level type ('sfc' for surface, 'pl' for pressure levels, 'ml' for model levels)",
        levelist: "String - Level values (for non-surface data)",
        area: "String - Geographic area [north, west, south, east]",
        grid: "String - Grid resolution (e.g., '0.25/0.25' for 0.25 degree)",
        format: "String - Always 'grib2'"
      },
      infoSource: "https://confluence.ecmwf.int/display/UDOC/GRIB2+parameter+codes",
      example: {
        product: "oper",
        date: "20240101",
        time: "00",
        step: "0",
        param: "167",
        levtype: "sfc",
        area: "60/-10/50/5", // Europe region
        grid: "0.25/0.25",
        format: "grib2",
        exampleRequest: "Retrieve surface temperature from operational forecast for Europe"
      }
    },
    "era5-grib2": {
      paramFormat: {
        dataset: "String - Dataset identifier (usually 'reanalysis-era5-single-levels')",
        product_type: "String - Product type ('reanalysis')",
        format: "String - 'grib' for GRIB2 format",
        variable: "Array - Variable names (e.g., ['2m_temperature', 'total_precipitation'])",
        year: "String/Array - Year(s) to retrieve",
        month: "String/Array - Month(s) to retrieve",
        day: "String/Array - Day(s) to retrieve",
        time: "String/Array - Time(s) of day",
        area: "Array - Geographic area [north, west, south, east]"
      },
      infoSource: "https://cds.climate.copernicus.eu/cdsapp#!/dataset/reanalysis-era5-single-levels",
      example: {
        dataset: "reanalysis-era5-single-levels",
        product_type: "reanalysis",
        format: "grib",
        variable: ["2m_temperature", "total_precipitation"],
        year: "2020",
        month: "01",
        day: "01",
        time: ["00:00", "12:00"],
        area: [60, -10, 50, 5], // Europe region
        exampleRequest: "Retrieve ERA5 temperature and precipitation data in GRIB2 format for January 1, 2020"
      }
    },
    "forecast-grib2": {
      paramFormat: {
        class: "String - Data class ('od' for operational dissemination)",
        date: "String - Forecast date in YYYYMMDD format",
        expver: "String - Experiment version ('1' for operational)",
        levtype: "String - Level type ('sfc', 'pl', 'ml')",
        param: "String - GRIB2 parameter code",
        step: "String/Array - Forecast steps in hours",
        stream: "String - Data stream ('oper' for operational, 'enfo' for ensemble)",
        time: "String - Forecast base time in HH format",
        type: "String - Data type ('fc' for forecast)",
        target: "String - Output filename",
        format: "String - 'grib2'",
        area: "String - Geographic area [north, west, south, east]"
      },
      infoSource: "https://confluence.ecmwf.int/display/UDOC/MARS+user+documentation",
      example: {
        class: "od",
        date: "20240101",
        expver: "1",
        levtype: "sfc",
        param: "167",
        step: "6",
        stream: "oper",
        time: "00",
        type: "fc",
        target: "forecast.grib2",
        format: "grib2",
        area: "60/-10/50/5",
        exampleRequest: "Retrieve 6-hour surface temperature forecast for Europe in GRIB2 format"
      }
    }
  }
};

export default defaultExport; 