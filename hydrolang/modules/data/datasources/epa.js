/**
 * Data endpoints for the Hydrologic Micro Services from the EPA. HydroLang supports the requests through
 * AJAX calls to the server.
 * https://qed.epa.gov/hms/meteorology/precipitation/data_request/
 * Please check input/output parameters for more information on the selected requested datas services
 * https://qed.epa.gov/hms/meteorology/precipitation/#output_parameters
 *
 * @type {Object}
 * @name EPA
 * @memberof datasources
 */

export default {
  //returns all the links in a

  precipitation: {
    endpoint: "https://qed.epa.gov/hms/rest/api/meteorology/precipitation",
    //example of request for the precipitation endpoint.
    params: {
      source: null,
      dateTimeSpan: {
        startDate: null,
        endDate: null,
        dateTimeFormat: "yyyy-MM-dd HH",
      },
      geometry: {
        hucID: null,
        stationID: null,
        point: {
          latitude: null,
          longitude: null,
        },
        geometryMetadata: null,
        timezone: null,
      },
      //data format can be
      dataValueFormat: "E3",
      temporalResolution: "default",
      timeLocalized: false,
      units: "metric",
      outputFormat: "null",
      baseURL: null,
      inputTimeSeries: null,
    },
    methods: {
      type: "json",
      method: "POST",
    },
  },

  
  evapotranspiration: {
    endpoint: "https://qed.epa.gov/hms/rest/api/v3/hydrology/evapotranspiration",
    //example of request for the precipitation endpoint.
    params: {
      source: null,
      dateTimeSpan: {
        startDate: null,
        endDate: null,
        dateTimeFormat: "yyyy-MM-dd HH",
      },
      geometry: {
        hucID: null,
        stationID: null,
        point: {
          latitude: null,
          longitude: null,
        },
        geometryMetadata: null,
        timezone: null,
      },
      //data format can be
      dataValueFormat: "E3",
      temporalResolution: "default",
      timeLocalized: false,
      units: "metric",
      outputFormat: "null",
      baseURL: null,
      inputTimeSeries: null,
    },
    methods: {
      type: "json",
      method: "POST",
    },
  },

  //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
  requirements: {
    needProxy: true,
    requireskey: false,
  },
  info: {
    returnFormats: "json",
    MoreInfo: "https://qed.epa.gov/hms/meteorology/precipitation/data_request/",
    About: "Data endpoints for the Hydrologic Micro Services from the EPA. HydroLang supports the requests through AJAX calls to the server."
  },
  "endpoint-info": {
    precipitation: {
      paramFormat: {
        source: "String - Data source (e.g., 'nldas', 'gldas', 'nexrad', 'ncei', 'prism')",
        dateTimeSpan: {
          startDate: "String - Start date (YYYY-MM-DD HH format)",
          endDate: "String - End date (YYYY-MM-DD HH format)",
          dateTimeFormat: "String - Format of date-time (yyyy-MM-dd HH)"
        },
        geometry: {
          hucID: "String - HUC ID (e.g., '03120001')",
          stationID: "String - Station ID",
          point: {
            latitude: "Number - Latitude coordinate",
            longitude: "Number - Longitude coordinate"
          },
          geometryMetadata: "Object - Additional metadata",
          timezone: "String - Timezone"
        },
        dataValueFormat: "String - Data value format (e.g., 'E3')",
        temporalResolution: "String - Temporal resolution (e.g., 'default', 'hourly')",
        timeLocalized: "Boolean - Whether time is localized",
        units: "String - Units (e.g., 'metric', 'imperial')",
        outputFormat: "String - Output format"
      },
      infoSource: "https://qed.epa.gov/hms/meteorology/precipitation/#output_parameters",
      example: `POST to https://qed.epa.gov/hms/rest/api/meteorology/precipitation
      {
        "source": "nldas",
        "dateTimeSpan": {
          "startDate": "2020-01-01 00",
          "endDate": "2020-01-07 00",
          "dateTimeFormat": "yyyy-MM-dd HH"
        },
        "geometry": {
          "point": {
            "latitude": 33.925,
            "longitude": -83.356
          }
        },
        "dataValueFormat": "E3",
        "temporalResolution": "hourly",
        "units": "metric"
      }`
    },
    evapotranspiration: {
      paramFormat: {
        source: "String - Data source (e.g., 'nldas', 'gldas')",
        dateTimeSpan: {
          startDate: "String - Start date (YYYY-MM-DD HH format)",
          endDate: "String - End date (YYYY-MM-DD HH format)",
          dateTimeFormat: "String - Format of date-time (yyyy-MM-dd HH)"
        },
        geometry: {
          hucID: "String - HUC ID (e.g., '03120001')",
          stationID: "String - Station ID",
          point: {
            latitude: "Number - Latitude coordinate",
            longitude: "Number - Longitude coordinate"
          },
          geometryMetadata: "Object - Additional metadata",
          timezone: "String - Timezone"
        },
        dataValueFormat: "String - Data value format (e.g., 'E3')",
        temporalResolution: "String - Temporal resolution (e.g., 'default', 'hourly')",
        timeLocalized: "Boolean - Whether time is localized",
        units: "String - Units (e.g., 'metric', 'imperial')",
        outputFormat: "String - Output format"
      },
      infoSource: "https://qed.epa.gov/hms/hydrology/evapotranspiration/#input_parameters",
      example: `POST to https://qed.epa.gov/hms/rest/api/v3/hydrology/evapotranspiration
      {
        "source": "nldas",
        "dateTimeSpan": {
          "startDate": "2020-01-01 00",
          "endDate": "2020-01-07 00",
          "dateTimeFormat": "yyyy-MM-dd HH"
        },
        "geometry": {
          "point": {
            "latitude": 33.925,
            "longitude": -83.356
          }
        },
        "dataValueFormat": "E3",
        "temporalResolution": "hourly",
        "units": "metric"
      }`
    }
  }
};
