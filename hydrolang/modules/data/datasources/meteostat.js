/**
 * Meteostat data retrieval.
 * Note: Different data sources may have different limitations
 * -> E.g., they may limit the # of queries per unit time
 * The API retrieves all the variables that are measured in a given station.
 * For cleaning up the data, refer to the data module in Hydrolang.
 * For identification of country ISO3 codes, refer to https://unstats.un.org/unsd/methodology/m49/
 * For referral on formats, please visit https://dev.meteostat.net/getting-started/formats-and-units
 * Dates in format ISO 8601 standard YYYY-MM-DD HH:MM:SS
 * Activation key format and name to is  "x-api-key"
 * More info, please visit https://dev.meteostat.net/
 * @type {Object}
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
  },

  "nearby-stations": {
    endpoint: "https://api.meteostat.net/v2/stations/nearby",
    params: {
      lat: null,
      long: null,
      limit: null,
      radius: null,
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
  },

  "dailydata-station": {
    endpoint: "https://api.meteostat.net/v2/stations/daily",
    params: {
      station: null,
      start: null,
      end: null,
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
  },

  //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
  requirements: {
    needProxy: true,
    requireskey: true,
    keyname: "x-api-key",
    method: "GET",
  },
};
