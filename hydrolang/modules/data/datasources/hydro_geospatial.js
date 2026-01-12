/**
 * Hydro Geospatial Sources
 * Aggregated global hydrology layers including HydroSHEDS and Global Surface Water.
 *
 * @type {Object}
 * @name HydroGeospatial
 * @memberof datasources
 */

export default {
    "global-surface-water": {
        endpoint: "https://global-surface-water.appspot.com/map_v1/2021/change/{z}/{x}/{y}.png",
        params: {
            // Tile coordinates are handled by the map engine usually
        },
        methods: {
            type: "tile",
            method: "GET"
        }
    },

    requirements: {
        needProxy: true,
        requireskey: false,
    },

    info: {
        returnFormats: "png (tiles)",
        MoreInfo: "https://global-surface-water.appspot.com/",
        About: "Global Surface Water Explorer provides maps of the location and temporal distribution of surface water."
    },

    "endpoint-info": {
        "global-surface-water": {
            paramFormat: {},
            infoSource: "https://global-surface-water.appspot.com/",
            example: {
                exampleRequest: "https://global-surface-water.appspot.com/map_v1/2021/change/0/0/0.png"
            }
        }
    }
};
