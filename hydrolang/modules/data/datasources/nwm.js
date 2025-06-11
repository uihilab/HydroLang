/**
 * National Water Model API. Returns short term, middle term, and long term forecasts for the US.
 * For more information about the service, please visit:
 * https://docs.ciroh.org/docs/products/Data%20Management%20and%20Access%20Tools/bigquery-api/
 * Note: Different data sources may have different limitations
 * The service requires the creation of an account and the generation of a
 * API key.
 * For more information on the historical flooding data, visit:
 * http://api.meteonetwork.it/docs/
 * Dates in format YYYY-MM-DDThh:mm:ss
 * @type {Object}
 * @name MeteoIT
 * @memberof datasources
 */
const baseURL = "'https://nwm-api.ciroh.org/"

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
    info: {
      returnFormats: "json",
      MoreInfo: "http://api.meteonetwork.it/docs/",
      About: "MeteoNetwork API: free datasets from Italy and some surrounding places. The service requires the creation of an account and the generation of a new token."
    },
    "endpoint-info": {
      "station-daily": {
        paramFormat: {
          station_code: "String - Station code",
          observation_date: "String - Observation date (YYYY-MM-DD format)",
          data_quality: "String - Data quality filter"
        },
        infoSource: "http://api.meteonetwork.it/docs/",
        example: "POST to https://api.meteonetwork.it/v3/data-daily with body: {\"station_code\":\"1\",\"observation_date\":\"2020-01-01\"}"
      },
      "stations-lastdays": {
        paramFormat: {
          username: "String - Your username",
          token: "String - Your API token",
          stationCode: "String - Station code",
          stationValidity: "String - Station validity status"
        },
        infoSource: "http://api.meteonetwork.it/docs/",
        example: "POST to http://api.meteonetwork.it/xml_rpc/public/jsonrpc/getDailyStationLastDays with body: {\"username\":\"yourusername\",\"token\":\"yourtoken\",\"stationCode\":\"1\"}"
      },
      "station-singledate": {
        paramFormat: {
          username: "String - Your username",
          token: "String - Your API token",
          stationCode: "String - Station code",
          date: "String - Date (YYYY-MM-DD format)",
          stationValidity: "String - Station validity status"
        },
        infoSource: "http://api.meteonetwork.it/docs/",
        example: "POST to http://api.meteonetwork.it/xml_rpc/public/jsonrpc/getDailyStationSingleDate with body: {\"username\":\"yourusername\",\"token\":\"yourtoken\",\"stationCode\":\"1\",\"date\":\"2020-01-01\"}"
      },
      "stations-singledate": {
        paramFormat: {
          username: "String - Your username",
          token: "String - Your API token",
          date: "String - Date (YYYY-MM-DD format)",
          stationValidity: "String - Station validity status"
        },
        infoSource: "http://api.meteonetwork.it/docs/",
        example: "POST to http://api.meteonetwork.it/xml_rpc/public/jsonrpc/getDailyStationsSingleDate with body: {\"username\":\"yourusername\",\"token\":\"yourtoken\",\"date\":\"2020-01-01\"}"
      },
      "stations-singledate-country": {
        paramFormat: {
          username: "String - Your username",
          token: "String - Your API token",
          date: "String - Date (YYYY-MM-DD format)",
          countryCode: "String - Country code (e.g., 'IT')",
          stationValidity: "String - Station validity status"
        },
        infoSource: "http://api.meteonetwork.it/docs/",
        example: "POST to http://api.meteonetwork.it/xml_rpc/public/jsonrpc/getDailyStationsSingleDateByCountry with body: {\"username\":\"yourusername\",\"token\":\"yourtoken\",\"date\":\"2020-01-01\",\"countryCode\":\"IT\"}"
      },
      "NearStations": {
        paramFormat: {
          username: "String - Your username",
          token: "String - Your API token",
          lat: "Number - Latitude coordinate",
          lon: "Number - Longitude coordinate",
          range: "Number - Search radius in kilometers",
          stationValidity: "String - Station validity status"
        },
        infoSource: "http://api.meteonetwork.it/docs/",
        example: "POST to http://api.meteonetwork.it/xml_rpc/public/jsonrpc/getNearStations with body: {\"username\":\"yourusername\",\"token\":\"yourtoken\",\"lat\":45.4642,\"lon\":9.1900,\"range\":10}"
      }
    }
  };
  