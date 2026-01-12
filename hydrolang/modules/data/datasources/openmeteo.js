/**
 * Open-Meteo
 * Free Weather API for non-commercial use.
 * Provides global weather forecasts, including specific models for Australia (BOM) and others.
 * For more information: https://open-meteo.com/
 *
 * @type {Object}
 * @name OpenMeteo
 * @memberof datasources
 */

export default {
    "forecast": {
        endpoint: "https://api.open-meteo.com/v1/forecast",
        params: {
            latitude: null,
            longitude: null,
            hourly: null, // e.g., "temperature_2m,precipitation"
            daily: null,
            models: null, // e.g., "bom_access_global" for Australia
            timezone: "auto"
        },
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
        MoreInfo: "https://open-meteo.com/",
        About: "Open-Meteo offers free weather forecasts for non-commercial use, with support for various global and regional models."
    },

    "endpoint-info": {
        "forecast": {
            paramFormat: {
                latitude: "Number - Latitude",
                longitude: "Number - Longitude",
                hourly: "String - Comma-separated hourly variables",
                models: "String - Weather model (e.g., 'bom_access_global')"
            },
            infoSource: "https://open-meteo.com/en/docs",
            example: {
                latitude: -33.8688,
                longitude: 151.2093,
                hourly: "temperature_2m",
                models: "bom_access_global",
                exampleRequest: "https://api.open-meteo.com/v1/forecast?latitude=-33.8688&longitude=151.2093&hourly=temperature_2m&models=bom_access_global"
            }
        }
    }
};
