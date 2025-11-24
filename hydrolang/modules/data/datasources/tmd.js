/**
 * Thai Meteorological Department (TMD): TMDAPI.
 * Provides access to weather forecasts, observations, earthquake data, and radar info.
 * For more information, visit: https://data.tmd.go.th/api/index_en.php
 *
 * @type {Object}
 * @name TMD
 * @memberof datasources
 */

export default {
    // Daily Forecast
    "forecast-daily": {
        endpoint: "https://data.tmd.go.th/api/WeatherForecastDaily/V1/",
        params: {
            uid: null, // User ID
            ukey: null, // User Key
            format: "json",
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // 7 Day Forecast
    "forecast-7day": {
        endpoint: "https://data.tmd.go.th/api/WeatherForecast7Days/V1/",
        params: {
            uid: null,
            ukey: null,
            format: "json",
            Province: null, // Optional filter
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Weather Today
    "weather-today": {
        endpoint: "https://data.tmd.go.th/api/WeatherToday/V1/",
        params: {
            uid: null,
            ukey: null,
            format: "json",
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Seismology (Daily Events)
    "seismology-daily": {
        endpoint: "https://data.tmd.go.th/api/DailySeismicEvent/v1/",
        params: {
            uid: null,
            ukey: null,
            format: "json",
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Radar Data (Support Data)
    "radar-support": {
        endpoint: "https://data.tmd.go.th/api/WeatherRadar/v1/", // Hypothetical endpoint based on API structure
        params: {
            uid: null,
            ukey: null,
            format: "json",
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    requirements: {
        needProxy: false,
        requireskey: true,
        keyname: "ukey", // Requires both uid and ukey
    },

    info: {
        returnFormats: "json, xml",
        MoreInfo: "https://data.tmd.go.th/api/index_en.php",
        About: "TMD Open Data API. Requires registration for UID and UKEY. Provides forecasts, current weather, seismology, and radar data.",
    },

    "endpoint-info": {
        "forecast-daily": {
            paramFormat: {
                uid: "String - User ID",
                ukey: "String - User Key",
            },
            infoSource: "https://data.tmd.go.th/api/index_en.php",
            example: {
                uid: "YOUR_UID",
                ukey: "YOUR_UKEY",
                exampleRequest: "https://data.tmd.go.th/api/WeatherForecastDaily/V1/?uid=YOUR_UID&ukey=YOUR_UKEY&format=json"
            }
        },
        "forecast-7day": {
            paramFormat: {
                uid: "String - User ID",
                ukey: "String - User Key",
                Province: "String - Province Name (Optional)",
            },
            infoSource: "https://data.tmd.go.th/api/index_en.php",
            example: {
                uid: "YOUR_UID",
                ukey: "YOUR_UKEY",
                Province: "Bangkok",
                exampleRequest: "https://data.tmd.go.th/api/WeatherForecast7Days/V1/?uid=YOUR_UID&ukey=YOUR_UKEY&format=json&Province=Bangkok"
            }
        },
        "weather-today": {
            paramFormat: {
                uid: "String - User ID",
                ukey: "String - User Key",
            },
            infoSource: "https://data.tmd.go.th/api/index_en.php",
            example: {
                uid: "YOUR_UID",
                ukey: "YOUR_UKEY",
                exampleRequest: "https://data.tmd.go.th/api/WeatherToday/V1/?uid=YOUR_UID&ukey=YOUR_UKEY&format=json"
            }
        },
        "seismology-daily": {
            paramFormat: {
                uid: "String - User ID",
                ukey: "String - User Key",
            },
            infoSource: "https://data.tmd.go.th/api/index_en.php",
            example: {
                uid: "YOUR_UID",
                ukey: "YOUR_UKEY",
                exampleRequest: "https://data.tmd.go.th/api/DailySeismicEvent/v1/?uid=YOUR_UID&ukey=YOUR_UKEY&format=json"
            }
        },
        "radar-support": {
            paramFormat: {
                uid: "String - User ID",
                ukey: "String - User Key",
            },
            infoSource: "https://data.tmd.go.th/api/index_en.php",
            example: {
                uid: "YOUR_UID",
                ukey: "YOUR_UKEY",
                exampleRequest: "https://data.tmd.go.th/api/WeatherRadar/v1/?uid=YOUR_UID&ukey=YOUR_UKEY&format=json"
            }
        }
    },
};
