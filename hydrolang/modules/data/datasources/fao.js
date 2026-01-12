/**
 * FAO Geospatial Data
 * Provides access to FAO's extensive catalog via WMS/WFS.
 * For more information: https://data.apps.fao.org/map/catalog/srv/eng/catalog.search
 *
 * @type {Object}
 * @name FAO
 * @memberof datasources
 */

export default {
    "fisheries-wms": {
        endpoint: "https://www.fao.org/fishery/geoserver/wms",
        params: {
            service: "WMS",
            version: "1.3.0",
            request: "GetMap",
            layers: null, // e.g., "fifao:UN_CONTINENT"
            bbox: null,
            width: 800,
            height: 600,
            format: "image/png"
        },
        methods: {
            type: "image",
            method: "GET"
        }
    },

    requirements: {
        needProxy: true,
        requireskey: false,
    },

    info: {
        returnFormats: "image/png, json (WFS)",
        MoreInfo: "https://www.fao.org/fishery/geoserver/web/",
        About: "FAO provides geospatial data for fisheries, aquaculture, and agriculture via OGC standards."
    },

    "endpoint-info": {
        "fisheries-wms": {
            paramFormat: {
                layers: "String - Layer name (e.g., 'fifao:UN_CONTINENT')",
                bbox: "String - Bounding box"
            },
            infoSource: "https://www.fao.org/fishery/geoserver/web/",
            example: {
                layers: "fifao:UN_CONTINENT",
                exampleRequest: "https://www.fao.org/fishery/geoserver/wms?service=WMS&version=1.3.0&request=GetMap&layers=fifao:UN_CONTINENT&bbox=-180,-90,180,90&width=800&height=600&format=image/png"
            }
        }
    }
};
