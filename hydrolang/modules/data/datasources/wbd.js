/**
 * USGS Watershed Boundary Dataset (WBD) via WFS
 * Provides hierarchical watershed boundaries at multiple scales (HUC 2-12)
 * https://www.usgs.gov/national-hydrography/watershed-boundary-dataset
 * @type {Object}
 * @author kento-sugiyama
 * @name WBD
 * @memberof datasources
 */

export default {
    huc02: {
        endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
        params: {
            service: "WFS",
            version: "1.0.0",
            request: "GetFeature",
            typeName: "wmadata:wbd02_20201006",
            outputFormat: "application/json",
            bbox: null,
            maxFeatures: null,
            cql_filter: null,
            propertyName: null,
        },
        methods: {
            type: "json, geojson, xml",
        },
    },

    huc04: {
        endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
        params: {
            service: "WFS",
            version: "1.0.0",
            request: "GetFeature",
            typeName: "wmadata:wbd04_20201006",
            outputFormat: "application/json",
            bbox: null,
            maxFeatures: null,
            cql_filter: null,
            propertyName: null,
        },
        methods: {
            type: "json, geojson, xml",
        },
    },

    huc06: {
        endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
        params: {
            service: "WFS",
            version: "1.0.0",
            request: "GetFeature",
            typeName: "wmadata:wbd06_20201006",
            outputFormat: "application/json",
            bbox: null,
            maxFeatures: null,
            cql_filter: null,
            propertyName: null,
        },
        methods: {
            type: "json, geojson, xml",
        },
    },

    huc08: {
        endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
        params: {
            service: "WFS",
            version: "1.0.0",
            request: "GetFeature",
            typeName: "wmadata:wbd08_20201006",
            outputFormat: "application/json",
            bbox: null,
            maxFeatures: null,
            cql_filter: null,
            propertyName: null,
        },
        methods: {
            type: "json, geojson, xml",
        },
    },

    huc10: {
        endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
        params: {
            service: "WFS",
            version: "1.0.0",
            request: "GetFeature",
            typeName: "wmadata:wbd10_20201006",
            outputFormat: "application/json",
            bbox: null,
            maxFeatures: null,
            cql_filter: null,
            propertyName: null,
        },
        methods: {
            type: "json, geojson, xml",
        },
    },

    huc12: {
        endpoint: "https://api.water.usgs.gov/geoserver/wmadata/ows",
        params: {
            service: "WFS",
            version: "1.0.0",
            request: "GetFeature",
            typeName: "wmadata:wbd12_20201006",
            outputFormat: "application/json",
            bbox: null,
            maxFeatures: null,
            cql_filter: null,
            propertyName: null,
        },
        methods: {
            type: "json, geojson, xml",
        },
    },

    requirements: {
        needProxy: false,
        requireskey: false,
    },

    info: {
        returnFormats: "json",
        MoreInfo:
            "https://www.usgs.gov/national-hydrography/watershed-boundary-dataset",
        About:
            "USGS Watershed Boundary Dataset provides hierarchical watershed boundaries at multiple scales from HUC 2 (regions) to HUC 12 (subwatersheds). Supports spatial queries and CQL filtering.",
    },

    "endpoint-info": {
        huc02: {
            paramFormat: {
                bbox: "String - Bounding box in format 'west,south,east,north,EPSG:4326'",
                maxFeatures: "Integer - Maximum number of features to return",
                cql_filter:
                    "String - Custom CQL filter expression (e.g., name='Colorado Region')",
                propertyName: "String - Comma-separated list of properties to retrieve",
            },
            infoSource:
                "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WMS&request=GetCapabilities",
            example: {
                bbox: "-125,32,-66,49,EPSG:4326",
                maxFeatures: 50,
                exampleRequest:
                    "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=wmadata:wbd02_20201006&outputFormat=application/json&bbox=-125,32,-66,49,EPSG:4326&maxFeatures=50",
            },
        },
        huc04: {
            paramFormat: {
                bbox: "String - Bounding box in format 'west,south,east,north,EPSG:4326'",
                maxFeatures: "Integer - Maximum number of features to return",
                cql_filter: "String - Custom CQL filter expression",
                propertyName: "String - Comma-separated list of properties to retrieve",
            },
            infoSource:
                "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WMS&request=GetCapabilities",
            example: {
                bbox: "-93.65,41.5,-93.5,41.6,EPSG:4326",
                maxFeatures: 100,
                exampleRequest:
                    "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=wmadata:wbd04_20201006&outputFormat=application/json&bbox=-93.65,41.5,-93.5,41.6,EPSG:4326&maxFeatures=100",
            },
        },
        huc06: {
            paramFormat: {
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
                    "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=wmadata:wbd06_20201006&outputFormat=application/json&bbox=-93.65,41.5,-93.5,41.6,EPSG:4326&maxFeatures=200",
            },
        },
        huc08: {
            paramFormat: {
                bbox: "String - Bounding box in format 'west,south,east,north,EPSG:4326'",
                maxFeatures: "Integer - Maximum number of features to return",
                cql_filter:
                    "String - Custom CQL filter expression (e.g., name='Upper Grand River')",
                propertyName: "String - Comma-separated list of properties to retrieve",
            },
            infoSource:
                "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WMS&request=GetCapabilities",
            example: {
                bbox: "-93.65,41.5,-93.5,41.6,EPSG:4326",
                maxFeatures: 500,
                exampleRequest:
                    "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=wmadata:wbd08_20201006&outputFormat=application/json&bbox=-93.65,41.5,-93.5,41.6,EPSG:4326&maxFeatures=500",
            },
        },
        huc10: {
            paramFormat: {
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
                    "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=wmadata:wbd10_20201006&outputFormat=application/json&bbox=-93.65,41.5,-93.5,41.6,EPSG:4326&maxFeatures=1000",
            },
        },
        huc12: {
            paramFormat: {
                bbox: "String - Bounding box in format 'west,south,east,north,EPSG:4326'",
                maxFeatures: "Integer - Maximum number of features to return",
                cql_filter: "String - Custom CQL filter expression",
                propertyName: "String - Comma-separated list of properties to retrieve",
            },
            infoSource:
                "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WMS&request=GetCapabilities",
            example: {
                bbox: "-93.65,41.5,-93.5,41.6,EPSG:4326",
                maxFeatures: 2000,
                exampleRequest:
                    "https://api.water.usgs.gov/geoserver/wmadata/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=wmadata:wbd12_20201006&outputFormat=application/json&bbox=-93.65,41.5,-93.5,41.6,EPSG:4326&maxFeatures=2000",
            },
        },
    },
};