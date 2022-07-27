/**
 * Data gov uk: provides API for free datasets from the UK and other parts of the world.
 * For more information about the service, please visit:
 * https://environment.data.gov.uk/apiportal
 * Note: Different data sources may have different limitations
 * Endpoints have a default limit of 500 items.
 * The service does not require an API key, but, size limitations should be
 * considered when downloading data. Moreover, its better to bulk on
 * data if required. The files can be obtained in JSON, CSV or ZIP format.
 * For more information on the historical flooding data, visit:
 * https://environment.data.gov.uk/flood-monitoring/archive
 * Coordinates in WGS84.
 * Dates in format YYYY-MM-DDThh:mm:ss
 * @type {Object}
 * @memberof datasources
 */

export default {
  //returns flood warnings as historic for a given area within the UK.
  "flood-warnings": {
    endpoint: "http://environment.data.gov.uk/flood-monitoring/id/floods",
    params: {
      "min-severtiy": null,
      county: null,
      lat: null,
      long: null,
    },
  },

  "flood-areas": {
    endpoint:
      "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/context.jsonId",
    params: {
      search: null,
      lat: null,
      long: null,
      dist: null,
    },
  },

  //historic of flood stations that have been used for flood monitoring purposes.
  "flood-stations": {
    endpoint: "http://environment.data.gov.uk/flood-monitoring/id/stations",
    params: {
      parameterName: null,
      qualifier: null,
      label: null,
      town: null,
      catchmentName: null,
      search: null,
      //and more...
    },
  },

  //List of stations within a certain area. Add parameter = rainfall.
  "list-stations": {
    endpoint: "http://environment.data.gov.uk/flood-monitoring/id/stations",
    params: {
      parameter: null,
      label: null,
      stationReference: null,
      search: null,
      lat: null,
      long: null,
      dist: null,
    },
  },

  //find historic of rainfall information for a given rainfall station, using id parameter.
  "data-stations": {
    endpoint: "http://environment.data.gov.uk/flood-monitoring/data/readings",
    params: {
      parameter: null,
      latest: null,
      today: null,
      date: null,
      startdate: null,
      enddate: null,
      since: null,
      stationReference: null,
    },
  },

  //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
  requirements: {
    needProxy: false,
    requireskey: false,
    method: "GET",
  },
};
