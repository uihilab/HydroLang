/**
 * NOAA Climate Data Online (CDO) datasource
 * Provides access to global historical weather and climate data.
 * **Note:** Requires a free API token from NOAA (https://www.ncdc.noaa.gov/cdo-web/token).
 *
 * **Data Information:**
 * - **Source:** NOAA NCDC / NCEI
 * - **Services:** Daily Summaries (GHCND), Global Summary of Month (GSOM), Precipitation (15min/Hourly), Radar Imagery
 * - **Coverage:** Global (depending on dataset)
 * - **Limits:** Requests usually limited to 1 year of data per call; 5 calls/sec.
 *
 * **Available Data Types:**
 * - `daily-summaries`: GHCN Daily (Max/Min Temp, Precip, Snow).
 * - `global-summary`: GSOM Monthly summaries.
 * - `prec-15min` / `prec-hourly`: High-frequency precipitation.
 * - `weather-radar-imagery`: NEXRAD Level 2/3 imagery checks.
 * - `availablestations`: Search for stations.
 *
 * **Key Parameters:**
 * - `stationid`: Station ID (e.g., "GHCND:USW00014895")
 * - `locationid`: Location ID (e.g., "FIPS:37")
 * - `datasetid`: (Implicit in some types)
 * - `startdate` / `enddate`: YYYY-MM-DD
 * - `token`: NOAA API Token
 *
 * @example
 * // 1. Retrieve Daily Summaries (Temp/Precip) for a Station
 * const dailyData = await hydro.data.retrieve({
 *   params: {
 *     source: 'noaa',
 *     datatype: 'daily-summaries',
 *     token: 'YOUR_NOAA_TOKEN'
 *   },
 *   args: {
 *     stationid: 'GHCND:USW00094728', // NY Central Park
 *     startdate: '2020-01-01',
 *     enddate: '2020-01-31',
 *     limit: 1000
 *   }
 * });
 *
 * @example
 * // 2. Retrieve Hourly Precipitation
 * const hourlyPrecip = await hydro.data.retrieve({
 *   params: {
 *     source: 'noaa',
 *     datatype: 'prec-hourly',
 *     token: 'YOUR_NOAA_TOKEN'
 *   },
 *   args: {
 *     locationid: 'FIPS:11', // District of Columbia
 *     startdate: '2010-01-01',
 *     enddate: '2010-01-31',
 *     limit: 500
 *   }
 * });
 *
 * @see https://www.ncdc.noaa.gov/cdo-web/webservices/v2
 * @type {Object}
 * @name NOAA
 * @memberof datasources
 */

export default {
  // These are only written to aid users to know
  // what parameters are available

  datasets: {
    endpoint: "https://www.ncdc.noaa.gov/cdo-web/api/v2/datasets",
    params: {
      //No parameters required for calling the endpoint.
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  availablestations: {
    endpoint: "https://www.ncdc.noaa.gov/cdo-web/api/v2/stations",
    params: {
      locationid: null,
      extent: null,
      limit: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },
  "prec-15min": {
    endpoint:
      "https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=PRECIP_15",
    params: {
      locationid: null,
      stationid: null,
      startdate: null,
      enddate: null,
      units: null,
      limit: null,
      offset: null,
      includemetadata: false,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  "prec-hourly": {
    endpoint:
      "https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=PRECIP_HLY",
    params: {
      locationid: null,
      stationid: null,
      startdate: null,
      enddate: null,
      units: null,
      limit: null,
      offset: null,
      includemetadata: false,
      // and more...
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  "daily-summaries": {
    endpoint: "https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND",
    params: {
      locationid: null,
      stationid: null,
      startdate: null,
      enddate: null,
      units: null,
      limit: null,
      offset: null,
      datatypeid: null,
      includemetadata: false,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  "global-summary": {
    endpoint: "https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GSOM",
    params: {
      locationid: null,
      stationid: null,
      startdate: null,
      enddate: null,
      units: null,
      limit: null,
      offset: null,
      datatypeid: null,
      includemetadata: false,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  "weather-radar-imagery": {
    endpoint: "https://www.ncdc.noaa.gov/nexradinv/",
    params: {
      id: null,
      datetime: null,
      product: null,
      year: null,
      month: null,
      day: null
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  requirements: {
    needProxy: false,
    requireskey: true,
    keyname: "token",
  },
  info: {
    returnFormats: "json",
    MoreInfo: "https://www.ncdc.noaa.gov/cdo-web/webservices/v2#data",
    About: "NOAA API for data retrieval, different application types. Requires registration to get TOKEN and must be included in parameters. Must requests must be less than 1 year."
  },
  "endpoint-info": {
    datasets: {
      paramFormat: {},
      infoSource: "https://www.ncdc.noaa.gov/cdo-web/webservices/v2#datasets",
      example: {
        token: "YOUR_TOKEN",
        exampleRequest: "https://www.ncdc.noaa.gov/cdo-web/api/v2/datasets?token=YOUR_TOKEN"
      }
    },
    availablestations: {
      paramFormat: {
        locationid: "String - Location identifier (e.g., 'FIPS:37')",
        extent: "String - Bounding box (e.g., '-90,30,-80,40')",
        limit: "Number - Limit of results returned (default 25, max 1000)"
      },
      infoSource: "https://www.ncdc.noaa.gov/cdo-web/webservices/v2#stations",
      example: {
        locationid: "FIPS:37",
        limit: 100,
        token: "YOUR_TOKEN",
        exampleRequest: "https://www.ncdc.noaa.gov/cdo-web/api/v2/stations?locationid=FIPS:37&limit=100&token=YOUR_TOKEN"
      }
    },
    "prec-15min": {
      paramFormat: {
        locationid: "String - Location identifier",
        stationid: "String - Station identifier (e.g., 'GHCND:USW00014895')",
        startdate: "String - Start date (YYYY-MM-DD format)",
        enddate: "String - End date (YYYY-MM-DD format)",
        units: "String - 'standard' or 'metric'",
        limit: "Number - Limit of results returned (default 25, max 1000)",
        offset: "Number - Offset for pagination",
        includemetadata: "Boolean - Include metadata in response"
      },
      infoSource: "https://www.ncdc.noaa.gov/cdo-web/webservices/v2#data",
      example: {
        datasetid: "PRECIP_15",
        stationid: "GHCND:USW00014895",
        startdate: "2020-01-01",
        enddate: "2020-01-07",
        limit: 100,
        token: "YOUR_TOKEN",
        exampleRequest: "https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=PRECIP_15&stationid=GHCND:USW00014895&startdate=2020-01-01&enddate=2020-01-07&limit=100&token=YOUR_TOKEN"
      }
    },
    "prec-hourly": {
      paramFormat: {
        locationid: "String - Location identifier",
        stationid: "String - Station identifier (e.g., 'GHCND:USW00014895')",
        startdate: "String - Start date (YYYY-MM-DD format)",
        enddate: "String - End date (YYYY-MM-DD format)",
        units: "String - 'standard' or 'metric'",
        limit: "Number - Limit of results returned (default 25, max 1000)",
        offset: "Number - Offset for pagination",
        includemetadata: "Boolean - Include metadata in response"
      },
      infoSource: "https://www.ncdc.noaa.gov/cdo-web/webservices/v2#data",
      example: {
        datasetid: "PRECIP_HLY",
        stationid: "GHCND:USW00014895",
        startdate: "2020-01-01",
        enddate: "2020-01-07",
        limit: 100,
        token: "YOUR_TOKEN",
        exampleRequest: "https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=PRECIP_HLY&stationid=GHCND:USW00014895&startdate=2020-01-01&enddate=2020-01-07&limit=100&token=YOUR_TOKEN"
      }
    },
    "daily-summaries": {
      paramFormat: {
        locationid: "String - Location identifier",
        stationid: "String - Station identifier (e.g., 'GHCND:USW00014895')",
        startdate: "String - Start date (YYYY-MM-DD format)",
        enddate: "String - End date (YYYY-MM-DD format)",
        units: "String - 'standard' or 'metric'",
        limit: "Number - Limit of results returned (default 25, max 1000)",
        offset: "Number - Offset for pagination",
        datatypeid: "String - Data type identifier (e.g., 'TMAX' for max temperature)",
        includemetadata: "Boolean - Include metadata in response"
      },
      infoSource: "https://www.ncdc.noaa.gov/cdo-web/webservices/v2#data",
      example: {
        datasetid: "GHCND",
        stationid: "GHCND:USW00014895",
        startdate: "2020-01-01",
        enddate: "2020-01-31",
        datatypeid: "TMAX,TMIN,PRCP",
        limit: 1000,
        token: "YOUR_TOKEN",
        exampleRequest: "https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&stationid=GHCND:USW00014895&startdate=2020-01-01&enddate=2020-01-31&datatypeid=TMAX,TMIN,PRCP&limit=1000&token=YOUR_TOKEN"
      }
    },
    "global-summary": {
      paramFormat: {
        locationid: "String - Location identifier",
        stationid: "String - Station identifier",
        startdate: "String - Start date (YYYY-MM-DD format)",
        enddate: "String - End date (YYYY-MM-DD format)",
        units: "String - 'standard' or 'metric'",
        limit: "Number - Limit of results returned (default 25, max 1000)",
        offset: "Number - Offset for pagination",
        datatypeid: "String - Data type identifier (e.g., 'TAVG' for average temperature)",
        includemetadata: "Boolean - Include metadata in response"
      },
      infoSource: "https://www.ncdc.noaa.gov/cdo-web/webservices/v2#datasets",
      example: {
        datasetid: "GSOM",
        stationid: "GHCND:USW00014895",
        startdate: "2020-01-01",
        enddate: "2020-12-31",
        datatypeid: "TAVG,TMAX,TMIN",
        limit: 1000,
        token: "YOUR_TOKEN",
        exampleRequest: "https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GSOM&stationid=GHCND:USW00014895&startdate=2020-01-01&enddate=2020-12-31&datatypeid=TAVG,TMAX,TMIN&limit=1000&token=YOUR_TOKEN"
      }
    },
    "weather-radar-imagery": {
      paramFormat: {
        id: "String - NEXRAD station ID (e.g., 'KDMX' for Des Moines, IA)",
        datetime: "String - Date and time in ISO format",
        product: "String - Product type (e.g., 'N0R' for base reflectivity)",
        year: "String - Year for data retrieval",
        month: "String - Month for data retrieval",
        day: "String - Day for data retrieval"
      },
      infoSource: "https://www.ncdc.noaa.gov/nexradinv/",
      example: {
        id: "KDMX",
        datetime: "2020-01-01T12:00:00Z",
        product: "N0R",
        exampleRequest: "https://www.ncdc.noaa.gov/nexradinv/rest-api.jsp?id=KDMX&datetime=2020-01-01T12:00:00Z&product=N0R"
      }
    }
  }
};
