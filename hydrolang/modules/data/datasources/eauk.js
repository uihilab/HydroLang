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
 * @name EAUK
 * @memberof datasources
 */

export default {
  //returns flood warnings as historic for a given area within the UK.
  "flood-warnings": {
    endpoint: "http://environment.data.gov.uk/flood-monitoring/id/floods",
    params: {
      "min-severity": null,
      county: null,
      lat: null,
      long: null,
    },
    methods: {
      type: "json",
      method: "GET",
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
    methods: {
      type: "json",
      method: "GET",
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
    methods: {
      type: "json",
      method: "GET",
    },
  },

  //List of stations within a certain area. Add parameter = rainfall.
  "list-floodstations": {
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
    methods: {
      type: "json",
      method: "GET",
    },
  },

  //find historic of rainfall information for a given rainfall station, using id parameter.
  "data-floodstations": {
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
    methods: {
      type: "json",
      method: "GET",
    },
  },

    //list of sampling points for a given region or area
    "list-wq-sampling": {
      endpoint: "http://environment.data.gov.uk/water-quality/id/sampling-point",
      params: {
        lat: null,
        lon: null,
        easting: null,
        northing: null,
        dist: null,
      },
      methods: {
        type: "json",
        method: "GET",
      },
    },

        //returns the data for a particular site a specified date range
        "data-wqsite": {
          endpoint: "http://environment.data.gov.uk/water-quality/id/sampling-point/{id}/measurements",
          params: {
            startDate: null,
            endDate: null,
            year: null,
            purpose: null,
          },
          methods: {
            type: "json",
            method: "GET",
          },
        },

  //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
  requirements: {
    needProxy: true,
    requireskey: false,
  },
  info: {
    returnFormats: "json",
    MoreInfo: "https://environment.data.gov.uk/apiportal",
    About: "Data gov uk: provides API for free datasets from the UK and other parts of the world. The service does not require an API key, but, size limitations should be considered when downloading data."
  },
  "endpoint-info": {
    "flood-warnings": {
      paramFormat: {
        "min-severity": "String - Minimum severity level (e.g., 1, 2, 3, 4)",
        county: "String - County name",
        lat: "Number - Latitude coordinate",
        long: "Number - Longitude coordinate"
      },
      infoSource: "https://environment.data.gov.uk/flood-monitoring/doc/reference",
      example: "http://environment.data.gov.uk/flood-monitoring/id/floods?county=Gloucestershire"
    },
    "flood-areas": {
      paramFormat: {
        search: "String - Search term",
        lat: "Number - Latitude coordinate",
        long: "Number - Longitude coordinate",
        dist: "Number - Search radius in km"
      },
      infoSource: "https://environment.data.gov.uk/flood-monitoring/doc/reference",
      example: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/context.jsonId?search=Severn&lat=51.86&long=-2.24&dist=5"
    },
    "flood-stations": {
      paramFormat: {
        parameterName: "String - Parameter name (e.g., 'rainfall', 'flow', 'level')",
        qualifier: "String - Qualifier for the parameter",
        label: "String - Station label",
        town: "String - Town name",
        catchmentName: "String - Catchment name",
        search: "String - Search term"
      },
      infoSource: "https://environment.data.gov.uk/flood-monitoring/doc/reference",
      example: "http://environment.data.gov.uk/flood-monitoring/id/stations?parameterName=rainfall&town=Gloucester"
    },
    "list-floodstations": {
      paramFormat: {
        parameter: "String - Parameter name (e.g., 'rainfall', 'flow', 'level')",
        label: "String - Station label",
        stationReference: "String - Station reference code",
        search: "String - Search term",
        lat: "Number - Latitude coordinate",
        long: "Number - Longitude coordinate",
        dist: "Number - Search radius in km"
      },
      infoSource: "https://environment.data.gov.uk/flood-monitoring/doc/reference",
      example: "http://environment.data.gov.uk/flood-monitoring/id/stations?parameter=rainfall&lat=51.86&long=-2.24&dist=5"
    },
    "data-floodstations": {
      paramFormat: {
        parameter: "String - Parameter name (e.g., 'rainfall', 'flow', 'level')",
        latest: "Boolean - Return only latest readings",
        today: "Boolean - Return only today's readings",
        date: "String - Specific date (YYYY-MM-DD)",
        startdate: "String - Start date (YYYY-MM-DD)",
        enddate: "String - End date (YYYY-MM-DD)",
        since: "String - Date-time since when to return data",
        stationReference: "String - Station reference code"
      },
      infoSource: "https://environment.data.gov.uk/flood-monitoring/doc/reference",
      example: "http://environment.data.gov.uk/flood-monitoring/data/readings?parameter=rainfall&stationReference=E2043&startdate=2020-01-01&enddate=2020-01-07"
    },
    "list-wq-sampling": {
      paramFormat: {
        lat: "Number - Latitude coordinate",
        lon: "Number - Longitude coordinate",
        easting: "Number - Easting coordinate (OSGB36)",
        northing: "Number - Northing coordinate (OSGB36)",
        dist: "Number - Search radius in km"
      },
      infoSource: "https://environment.data.gov.uk/water-quality/doc/reference",
      example: "http://environment.data.gov.uk/water-quality/id/sampling-point?lat=51.86&lon=-2.24&dist=5"
    },
    "data-wqsite": {
      paramFormat: {
        startDate: "String - Start date (YYYY-MM-DD)",
        endDate: "String - End date (YYYY-MM-DD)",
        year: "Number - Specific year",
        purpose: "String - Sampling purpose"
      },
      infoSource: "https://environment.data.gov.uk/water-quality/doc/reference",
      example: "http://environment.data.gov.uk/water-quality/id/sampling-point/AN-WAL01/measurements?startDate=2020-01-01&endDate=2020-12-31"
    }
  }
};
