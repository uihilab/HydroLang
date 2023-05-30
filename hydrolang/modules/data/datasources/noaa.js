/**
 * NOAA API for data retrieval, different application types.
 * Note: Different data sources may have different limitations
 * -> E.g., they may limit the # of queries per unit time
 * NOAA requires registration to get TOKEN and must be included in parameters.
 * https://www.ncdc.noaa.gov/cdo-web/webservices/v2#data
 * Must requests must be less than 1 year.
 * Dates in format YYYY-MM-DDThh:mm:ss
 * IMPORTANT: for retrieving more than 25 lines of data, include limit = required number.
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

  requirements: {
    needProxy: false,
    requireskey: true,
    keyname: "token",
  },
};
