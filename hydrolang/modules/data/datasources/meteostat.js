/**
 * Meteostat datasource
 * Provides access to historical weather and climate data from thousands of stations worldwide.
 * **Note:** Requires an API key (https://dev.meteostat.net/).
 *
 * **Data Information:**
 * - **Source:** Meteostat (aggregates NOAA, DWD, etc.)
 * - **Services:** Hourly/Daily Data (Station & Point), Station Search
 * - **Coverage:** Global
 *
 * **Available Data Types:**
 * - `dailydata-station`: Daily aggregate data for a specific station.
 * - `hourlydata-stations`: Hourly data for a specific station.
 * - `dailydata-point`: Daily interpolated data for a lat/lon.
 * - `hourlydata-point`: Hourly interpolated data for a lat/lon.
 * - `find-stations` / `nearby-stations`: Station meta-search.
 *
 * **Key Parameters:**
 * - `station`: Meteostat Station ID (e.g., "10637" for Frankfurt)
 * - `lat` / `lon`: Coordinates for point data
 * - `start` / `end`: Dates (YYYY-MM-DD)
 * - `key`: API Key (Header `x-api-key` handling)
 *
 * @example
 * // 1. Retrieve Daily Data for a known Station
 * const dailyData = await hydro.data.retrieve({
 *   params: {
 *     source: 'meteostat',
 *     datatype: 'dailydata-station',
 *     key: 'YOUR_API_KEY'
 *   },
 *   args: {
 *     station: '10637', // Frankfurt
 *     start: '2023-01-01',
 *     end: '2023-01-31'
 *   }
 * });
 *
 * @example
 * // 2. Retrieve Hourly Data for a Geographic Point (Interpolated)
 * const hourlyPoint = await hydro.data.retrieve({
 *   params: {
 *     source: 'meteostat',
 *     datatype: 'hourlydata-point',
 *     key: 'YOUR_API_KEY'
 *   },
 *   args: {
 *     lat: 40.7128,
 *     lon: -74.0060,
 *     start: '2023-06-01',
 *     end: '2023-06-02',
 *     tz: 'America/New_York'
 *   }
 * });
 *
 * @see https://dev.meteostat.net/
 * @type {Object}
 * @name MeteoSTAT
 * @memberof datasources
 */

export default {
  // yearly, monthlyvprecipitation per country or per basin.
  "find-stations": {
    endpoint: "https://api.meteostat.net/v2/stations/search",
    params: {
      query: null,
      limit: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  "nearby-stations": {
    endpoint: "https://api.meteostat.net/v2/stations/nearby",
    params: {
      lat: null,
      long: null,
      limit: null,
      radius: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  "hourlydata-stations": {
    endpoint: "https://api.meteostat.net/v2/stations/hourly",
    params: {
      station: null,
      start: null,
      end: null,
      model: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  "dailydata-station": {
    endpoint: "https://api.meteostat.net/v2/stations/daily",
    params: {
      station: null,
      start: null,
      end: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  //Experimental version, can crash if not given correct parameters.
  // Maximum data of 10 days per request.
  "hourlydata-point": {
    endpoint: "https://api.meteostat.net/v2/point/hourly",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      lat: null,
      lon: null,
      alt: null,
      start: null,
      end: null,
      tz: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  //Limit of 370 days per request.
  "dailydata-point": {
    endpoint: "https://api.meteostat.net/v2/point/daily",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      lat: null,
      lon: null,
      alt: null,
      start: null,
      end: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  // downloadable informaton as bulk data in gz format. Preferable for
  // downloading big chunks of data.
  bulkdata: {
    endpoint: "https://bulk.meteostat.net",
    params: {
      // The parameters vary depending on what is required to retrieve.
      // Consider that the bulk works only for specific stations.
      station: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
  requirements: {
    needProxy: true,
    requireskey: true,
    keyname: "x-api-key",
  },
  info: {
    returnFormats: "json",
    MoreInfo: "https://dev.meteostat.net/",
    About: "Meteostat data retrieval API. The API retrieves all the variables that are measured in a given station. Activation key format and name is 'x-api-key'."
  },
  "endpoint-info": {
    "find-stations": {
      paramFormat: {
        query: "String - Search query (e.g., 'Berlin')",
        limit: "Number - Maximum number of results to return"
      },
      infoSource: "https://dev.meteostat.net/api/stations/search.html",
      example: "https://api.meteostat.net/v2/stations/search?query=Berlin&limit=5"
    },
    "nearby-stations": {
      paramFormat: {
        lat: "Number - Latitude coordinate",
        long: "Number - Longitude coordinate",
        limit: "Number - Maximum number of results to return",
        radius: "Number - Search radius in kilometers"
      },
      infoSource: "https://dev.meteostat.net/api/stations/nearby.html",
      example: "https://api.meteostat.net/v2/stations/nearby?lat=52.52&lon=13.41&limit=5&radius=20"
    },
    "hourlydata-stations": {
      paramFormat: {
        station: "String - Station ID (e.g., '10382')",
        start: "String - Start date (YYYY-MM-DD format)",
        end: "String - End date (YYYY-MM-DD format)",
        model: "Boolean - Include model data (true/false)"
      },
      infoSource: "https://dev.meteostat.net/api/stations/hourly.html",
      example: "https://api.meteostat.net/v2/stations/hourly?station=10382&start=2020-01-01&end=2020-01-02"
    },
    "dailydata-station": {
      paramFormat: {
        station: "String - Station ID (e.g., '10382')",
        start: "String - Start date (YYYY-MM-DD format)",
        end: "String - End date (YYYY-MM-DD format)"
      },
      infoSource: "https://dev.meteostat.net/api/stations/daily.html",
      example: "https://api.meteostat.net/v2/stations/daily?station=10382&start=2020-01-01&end=2020-01-31"
    },
    "hourlydata-point": {
      paramFormat: {
        lat: "Number - Latitude coordinate",
        lon: "Number - Longitude coordinate",
        alt: "Number - Altitude in meters",
        start: "String - Start date (YYYY-MM-DD format)",
        end: "String - End date (YYYY-MM-DD format)",
        tz: "String - Timezone (e.g., 'Europe/Berlin')"
      },
      infoSource: "https://dev.meteostat.net/api/point/hourly.html",
      example: "https://api.meteostat.net/v2/point/hourly?lat=52.52&lon=13.41&start=2020-01-01&end=2020-01-10"
    },
    "dailydata-point": {
      paramFormat: {
        lat: "Number - Latitude coordinate",
        lon: "Number - Longitude coordinate",
        alt: "Number - Altitude in meters",
        start: "String - Start date (YYYY-MM-DD format)",
        end: "String - End date (YYYY-MM-DD format)"
      },
      infoSource: "https://dev.meteostat.net/api/point/daily.html",
      example: "https://api.meteostat.net/v2/point/daily?lat=52.52&lon=13.41&start=2020-01-01&end=2020-01-31"
    },
    "bulkdata": {
      paramFormat: {
        station: "String - Station ID (e.g., '10382')"
      },
      infoSource: "https://dev.meteostat.net/bulk/",
      example: "https://bulk.meteostat.net/daily/10382.csv.gz"
    }
  }
};
