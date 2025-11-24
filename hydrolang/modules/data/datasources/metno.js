/**
 * Meteorologisk institutt (Met.no): WeatherAPI for Norway and Global.
 * Provides high-quality forecasts via Locationforecast 2.0, Oceanforecast, and Nowcast.
 * For more information, visit: https://api.met.no/
 *
 * @type {Object}
 * @name MetNo
 * @memberof datasources
 */

export default {
    // Locationforecast 2.0 (Compact)
    "locationforecast-compact": {
        endpoint: "https://api.met.no/weatherapi/locationforecast/2.0/compact",
        params: {
            lat: null,
            lon: null,
            altitude: null, // Optional
        },
        methods: {
            type: "json",
            method: "GET",
            headers: {
                "User-Agent": "HydroLang/1.0 https://github.com/uihilab/HydroLang",
            },
        },
    },

    // Locationforecast 2.0 (Complete)
    "locationforecast-complete": {
        endpoint: "https://api.met.no/weatherapi/locationforecast/2.0/complete",
        params: {
            lat: null,
            lon: null,
            altitude: null,
        },
        methods: {
            type: "json",
            method: "GET",
            headers: {
                "User-Agent": "HydroLang/1.0 https://github.com/uihilab/HydroLang",
            },
        },
    },

    // Oceanforecast 2.0
    "oceanforecast": {
        endpoint: "https://api.met.no/weatherapi/oceanforecast/2.0/complete",
        params: {
            lat: null,
            lon: null,
        },
        methods: {
            type: "json",
            method: "GET",
            headers: {
                "User-Agent": "HydroLang/1.0 https://github.com/uihilab/HydroLang",
            },
        },
    },

    // Nowcast 2.0 (Immediate precipitation)
    "nowcast": {
        endpoint: "https://api.met.no/weatherapi/nowcast/2.0/complete",
        params: {
            lat: null,
            lon: null,
        },
        methods: {
            type: "json",
            method: "GET",
            headers: {
                "User-Agent": "HydroLang/1.0 https://github.com/uihilab/HydroLang",
            },
        },
    },

    requirements: {
        needProxy: false,
        requireskey: false,
        // Note: User-Agent header is required and strictly enforced by Met.no
    },

    info: {
        returnFormats: "json",
        MoreInfo: "https://api.met.no/weatherapi/locationforecast/2.0/documentation",
        About: "Meteorologisk institutt (Met.no) API. Provides global weather, ocean, and nowcast data in JSON format. Requires a unique User-Agent header.",
    },

    "endpoint-info": {
        "locationforecast-compact": {
            paramFormat: {
                lat: "Number - Latitude (e.g., 59.91)",
                lon: "Number - Longitude (e.g., 10.75)",
                altitude: "Number - Altitude in meters (optional)",
            },
            infoSource: "https://api.met.no/weatherapi/locationforecast/2.0/documentation",
            example: {
                lat: 59.91,
                lon: 10.75,
                exampleRequest: "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75"
            }
        },
        "locationforecast-complete": {
            paramFormat: {
                lat: "Number - Latitude (e.g., 59.91)",
                lon: "Number - Longitude (e.g., 10.75)",
            },
            infoSource: "https://api.met.no/weatherapi/locationforecast/2.0/documentation",
            example: {
                lat: 59.91,
                lon: 10.75,
                exampleRequest: "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=59.91&lon=10.75"
            }
        },
        "oceanforecast": {
            paramFormat: {
                lat: "Number - Latitude (e.g., 60.10)",
                lon: "Number - Longitude (e.g., 9.58)",
            },
            infoSource: "https://api.met.no/weatherapi/oceanforecast/2.0/documentation",
            example: {
                lat: 60.10,
                lon: 9.58,
                exampleRequest: "https://api.met.no/weatherapi/oceanforecast/2.0/complete?lat=60.10&lon=9.58"
            }
        },
        "nowcast": {
            paramFormat: {
                lat: "Number - Latitude (e.g., 59.91)",
                lon: "Number - Longitude (e.g., 10.75)",
            },
            infoSource: "https://api.met.no/weatherapi/nowcast/2.0/documentation",
            example: {
                lat: 59.91,
                lon: 10.75,
                exampleRequest: "https://api.met.no/weatherapi/nowcast/2.0/complete?lat=59.91&lon=10.75"
            }
        }
    },
};
