/**
 * SMN (Servicio Meteorológico Nacional) - Argentina
 * Provides weather forecasts and observations for Argentina.
 * For more information: https://www.smn.gob.ar/
 *
 * @type {Object}
 * @name SMN
 * @memberof datasources
 */

export default {
    "forecast": {
        endpoint: "https://ws.smn.gob.ar/map_items/forecast/{days}",
        params: {
            days: "1" // 1, 2, 3
        },
        methods: {
            type: "json",
            method: "GET"
        }
    },

    "current-weather": {
        endpoint: "https://ws.smn.gob.ar/map_items/weather",
        params: {},
        methods: {
            type: "json",
            method: "GET"
        }
    },

    requirements: {
        needProxy: true,
        requireskey: false,
    },

    info: {
        returnFormats: "json",
        MoreInfo: "https://www.smn.gob.ar/datos-abiertos",
        About: "SMN Argentina provides open data for weather forecasts and current conditions."
    },

    "endpoint-info": {
        "forecast": {
            paramFormat: {
                days: "Number - Forecast days (1, 2, 3)"
            },
            infoSource: "https://www.smn.gob.ar/",
            example: {
                days: "1",
                exampleRequest: "https://ws.smn.gob.ar/map_items/forecast/1"
            }
        }
    }
};
