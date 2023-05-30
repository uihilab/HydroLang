/**
 * MeteoNetwork API: free datasets from the italy and some surrounding places.
 * For more information about the service, please visit:
 * https://www.meteonetwork.it/
 * Note: Different data sources may have different limitations
 * The service requires the creation of an account and the generation of a
 * new token.
 * For more information on the historical flooding data, visit:
 * http://api.meteonetwork.it/docs/
 * Dates in format YYYY-MM-DDThh:mm:ss
 * @type {Object}
 * @name MeteoIT
 * @memberof datasources
 */

 export default {
  //obtain information about the last day
  "station-daily": {
    endpoint: "https://api.meteonetwork.it/v3/data-daily",
    params: {
      station_code: null,
      observation_date: null,
      data_quality: null,
    },
    methods:{
      type: "json",
      method: "POST",
    }
  },

  //return last data available on station.
  "stations-lastdays": {
    endpoint:
      "http://api.meteonetwork.it/xml_rpc/public/jsonrpc/getDailyStationLastDays",
    params: {
      username: null,
      token: null,
      stationCode: null,
      stationValidity: null,
    },
    methods:{
      type: "json",
      method: "POST",
    }
  },

  //obtain data of a single date for a single station.
  "station-singledate": {
    endpoint:
      "http://api.meteonetwork.it/xml_rpc/public/jsonrpc/getDailyStationSingleDate",
    params: {
      username: null,
      token: null,
      stationCode: null,
      date: null,
      stationValidity: null,
    },
    methods:{
      type: "json",
      method: "POST",
    }
  },

  //obtain data for multiple stations for a single data
  "stations-singledate": {
    endpoint:
      "http://api.meteonetwork.it/xml_rpc/public/jsonrpc/getDailyStationsSingleDate",
    params: {
      username: null,
      token: null,
      date: null,
      stationValidity: null,
    },
    methods:{
      type: "json",
      method: "POST",
    }
  },

  //obtain data for multiple stations for a single date by country
  "stations-singledate-country": {
    endpoint:
      "http://api.meteonetwork.it/xml_rpc/public/jsonrpc/getDailyStationsSingleDateByCountry",
    params: {
      username: null,
      token: null,
      date: null,
      countryCode: null,
      stationValidity: null,
    },
    methods:{
      type: "json",
      method: "POST",
    }
  },

  //obtain nearby stations given locations in lat and long.
  NearStations: {
    endpoint:
      "http://api.meteonetwork.it/xml_rpc/public/jsonrpc/getNearStations",
    params: {
      username: null,
      token: null,
      lat: null,
      lon: null,
      range: null,
      stationValidity: null,
    },
    methods:{
      type: "json",
      method: "POST",
    }
  },

  // MORE API POINTS AVAILABLE

  //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
  requirements: {
    needProxy: true,
    requireskey: true,
    keyname: "token",
  },
};
