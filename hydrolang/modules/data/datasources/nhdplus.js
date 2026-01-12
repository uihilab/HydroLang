/**
 * USGS NHDPlus WFS Data API via GeoServer
 * Provides stream networks, waterbodies, catchments, and gaging sites
 * https://www.usgs.gov/national-hydrography/nhdplus-high
 * @type {Object}
 * @name NHDPlus
 * @memberof datasources
 */

export default {
  flowlines: {
    endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
    params: {
      service: "WFS",
      version: "2.0.0",
      request: "GetFeature",
      typeName: "wmadata:nhdflowline_network",
      outputFormat: "application/json",
      bbox: null,
      maxFeatures: null,
      cql_filter: null,
      propertyName: null
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  waterbodies: {
    endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
    params: {
      service: "WFS",
      version: "2.0.0",
      request: "GetFeature",
      typeName: "wmadata:nhdwaterbody",
      outputFormat: "application/json",
      bbox: null,
      maxFeatures: null,
      cql_filter: null,
      propertyName: null
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  catchments: {
    endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
    params: {
      service: "WFS",
      version: "2.0.0",
      request: "GetFeature",
      typeName: "wmadata:catchmentsp",
      outputFormat: "application/json",
      bbox: null,
      maxFeatures: null,
      cql_filter: null,
      propertyName: null
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  gages: {
    endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
    params: {
      service: "WFS",
      version: "2.0.0",
      request: "GetFeature",
      typeName: "wmadata:gagesii",
      outputFormat: "application/json",
      bbox: null,
      maxFeatures: null,
      cql_filter: null,
      propertyName: null
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  requirements: {
    needProxy: true,
    requireskey: false
  },

  info: {
    returnFormats: "json",
    MoreInfo: "https://www.usgs.gov/national-hydrography/nhdplus-high",
    About: "USGS NHDPlus via WFS/GeoServer. Supports spatial queries for hydrographic features using bounding box."
  },

  "endpoint-info": {
    flowlines: {
      paramFormat: {
        bbox: "Array - Bounding box [minLon, minLat, maxLon, maxLat]",
        maxFeatures: "Integer - Max number of features",
        cql_filter: "String - Custom filter expression",
        propertyName: "String - Comma-separated list of properties to retrieve"
      },
      infoSource: "https://www.usgs.gov/tools/water-geoserver",
      example: {
        bbox: [-93.65, 41.5, -93.5, 41.6],
        exampleRequest: "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=wmadata:nhdflowline_network&outputFormat=application/json&bbox=-93.65,41.5,-93.5,41.6,EPSG:4326"
      }
    }
    // You can add similar example blocks for waterbodies, catchments, gages
  }
};
