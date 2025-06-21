/**
 * USGS NHDPlus WFS Data API via GeoServer
 * Provides stream networks, waterbodies, catchments, and gaging sites
 * https://www.epa.gov/waterdata/nhdplus-national-hydrography-dataset-plus
 * @type {Object}
 * @author kento-sugiyama
 * @name NHDPlus
 * @memberof datasources
 */

export default {
  flowlines: {
    endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
    params: {
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: "wmadata:nhdflowline_network",
      outputFormat: "application/json",
      bbox: null,
      maxFeatures: null,
      cql_filter: null,
      propertyName: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  waterbodies: {
    endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
    params: {
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: "wmadata:nhdwaterbody",
      outputFormat: "application/json",
      bbox: null,
      maxFeatures: null,
      cql_filter: null,
      propertyName: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  catchments: {
    endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
    params: {
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: "wmadata:catchmentsp",
      outputFormat: "application/json",
      bbox: null,
      maxFeatures: null,
      cql_filter: null,
      propertyName: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  gages: {
    endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
    params: {
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: "wmadata:gagesii",
      outputFormat: "application/json",
      bbox: null,
      maxFeatures: null,
      cql_filter: null,
      propertyName: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  "nonnetwork-flowlines": {
    endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
    params: {
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: "wmadata:nhdflowline_nonnetwork",
      outputFormat: "application/json",
      bbox: null,
      maxFeatures: null,
      cql_filter: null,
      propertyName: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  requirements: {
    needProxy: false,
    requireskey: false,
  },

  info: {
    returnFormats: "json",
    MoreInfo:
      "https://www.epa.gov/waterdata/nhdplus-national-hydrography-dataset-plus",
    About:
      "USGS NHDPlus Medium Resolution hydrographic data via WFS/GeoServer. Supports spatial queries for flowlines, waterbodies, catchments, and gaging sites using bounding box parameters.",
  },

  docs: {
    flowlines: {
      description:
        "Stream network flowlines from NHDPlus dataset. Includes perennial and intermittent streams, rivers, and artificial paths.",
      parameters: {
        bbox: "String - Bounding box in format 'west,south,east,north,EPSG:4326'",
        maxFeatures: "Integer - Maximum number of features to return",
        cql_filter: "String - Custom CQL filter expression",
        propertyName: "String - Comma-separated list of properties to retrieve",
      },
      infoSource:
        "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WMS&request=GetCapabilities",
      example: {
        bbox: "-93.65,41.5,-93.5,41.6,EPSG:4326",
        maxFeatures: 1000,
        exampleRequest:
          "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=wmadata:nhdflowline_network&outputFormat=application/json&bbox=-93.65,41.5,-93.5,41.6,EPSG:4326&maxFeatures=1000",
      },
    },
    waterbodies: {
      description:
        "Lakes, ponds, reservoirs, and other waterbodies from NHDPlus dataset.",
      parameters: {
        bbox: "String - Bounding box in format 'west,south,east,north,EPSG:4326'",
        maxFeatures: "Integer - Maximum number of features to return",
        cql_filter: "String - Custom CQL filter expression",
        propertyName: "String - Comma-separated list of properties to retrieve",
      },
      infoSource:
        "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WMS&request=GetCapabilities",
      example: {
        bbox: "-93.65,41.5,-93.5,41.6,EPSG:4326",
        maxFeatures: 500,
        exampleRequest:
          "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=wmadata:nhdwaterbody&outputFormat=application/json&bbox=-93.65,41.5,-93.5,41.6,EPSG:4326&maxFeatures=500",
      },
    },
    catchments: {
      description:
        "Drainage catchments associated with NHDPlus flowlines. Each catchment represents the incremental drainage area for a flowline segment.",
      parameters: {
        bbox: "String - Bounding box in format 'west,south,east,north,EPSG:4326'",
        maxFeatures: "Integer - Maximum number of features to return",
        cql_filter: "String - Custom CQL filter expression",
        propertyName: "String - Comma-separated list of properties to retrieve",
      },
      infoSource:
        "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WMS&request=GetCapabilities",
      example: {
        bbox: "-93.65,41.5,-93.5,41.6,EPSG:4326",
        maxFeatures: 1000,
        exampleRequest:
          "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=wmadata:catchmentsp&outputFormat=application/json&bbox=-93.65,41.5,-93.5,41.6,EPSG:4326&maxFeatures=1000",
      },
    },
    gages: {
      description:
        "GAGES-II stream gauge locations with reference and non-reference sites for hydrologic studies.",
      parameters: {
        bbox: "String - Bounding box in format 'west,south,east,north,EPSG:4326'",
        maxFeatures: "Integer - Maximum number of features to return",
        cql_filter: "String - Custom CQL filter expression",
        propertyName: "String - Comma-separated list of properties to retrieve",
      },
      infoSource:
        "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WMS&request=GetCapabilities",
      example: {
        bbox: "-93.65,41.5,-93.5,41.6,EPSG:4326",
        maxFeatures: 200,
        exampleRequest:
          "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=wmadata:gagesii&outputFormat=application/json&bbox=-93.65,41.5,-93.5,41.6,EPSG:4326&maxFeatures=200",
      },
    },
    "nonnetwork-flowlines": {
      description:
        "Non-network flowlines including ditches, canals, and other artificial water conveyances not part of the main stream network.",
      parameters: {
        bbox: "String - Bounding box in format 'west,south,east,north,EPSG:4326'",
        maxFeatures: "Integer - Maximum number of features to return",
        cql_filter: "String - Custom CQL filter expression",
        propertyName: "String - Comma-separated list of properties to retrieve",
      },
      infoSource:
        "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WMS&request=GetCapabilities",
      example: {
        bbox: "-93.65,41.5,-93.5,41.6,EPSG:4326",
        maxFeatures: 500,
        exampleRequest:
          "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=wmadata:nhdflowline_nonnetwork&outputFormat=application/json&bbox=-93.65,41.5,-93.5,41.6,EPSG:4326&maxFeatures=500",
      },
    },
  },
};
