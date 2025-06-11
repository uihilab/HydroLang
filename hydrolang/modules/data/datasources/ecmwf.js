/**
 * European Centre for Medium-Range Weather Forecasts (ECMWF) API
 * This API provides access to various weather and climate data products including
 * forecasts, reanalysis datasets, and climate projections.
 * https://confluence.ecmwf.int/display/WEBAPI/ECMWF+Web+API
 * Note: ECMWF API requires registration and an API key.
 * @type {Object}
 * @name ECMWF
 * @memberof datasources
 */

export default {
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

  requirements: {
    needProxy: false,
    requireskey: true,
    keyname: "key",
  },

  info: {
    returnFormats: "grib, netcdf, json",
    MoreInfo: "https://confluence.ecmwf.int/display/WEBAPI/ECMWF+Web+API",
    About: "European Centre for Medium-Range Weather Forecasts (ECMWF) API provides access to various weather and climate data products. Requires registration and an API key."
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
    }
  }
}; 