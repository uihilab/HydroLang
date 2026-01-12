/**
 * BMKG (Indonesia): Open Data API.
 * Provides access to weather forecasts, earthquake data, tsunami warnings, and air quality.
 * For more information, visit: https://data.bmkg.go.id/
 *
 * @type {Object}
 * @name BMKG
 * @memberof datasources
 */

export default {
    // Weather Forecast (Province)
    "forecast-province": {
        endpoint: "https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/DigitalForecast-{province}.xml",
        params: {
            province: null, // e.g., "DKIJakarta", "JawaBarat"
        },
        methods: {
            type: "xml",
            method: "GET",
        },
    },

    // Recent Earthquakes (M > 5)
    "earthquake-recent": {
        endpoint: "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.xml",
        params: {},
        methods: {
            type: "xml",
            method: "GET",
        },
    },

    // Tsunami Potential (Earthquakes with Tsunami Potential)
    "tsunami-potential": {
        endpoint: "https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.xml", // Often included in felt/major quake feeds
        params: {},
        methods: {
            type: "xml",
            method: "GET",
        },
    },

    // Air Quality (PM2.5) - Example for a region
    "airquality-pm25": {
        endpoint: "https://data.bmkg.go.id/DataMKG/MEWS/KelolaProduk/radcu/airquality/pm25.xml", // Hypothetical path based on structure
        params: {},
        methods: {
            type: "xml",
            method: "GET",
        },
    },

    requirements: {
        needProxy: true,
        requireskey: false,
    },

    info: {
        returnFormats: "xml",
        MoreInfo: "https://data.bmkg.go.id/",
        About: "BMKG Open Data. Provides static XML files for forecasts, earthquakes, tsunami potential, and air quality. No API key required.",
    },

    "endpoint-info": {
        "forecast-province": {
            paramFormat: {
                province: "String - Province name (CamelCase, e.g., 'DKIJakarta')",
            },
            infoSource: "https://data.bmkg.go.id/prakiraan-cuaca/",
            example: {
                province: "DKIJakarta",
                exampleRequest: "https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/DigitalForecast-DKIJakarta.xml"
            }
        },
        "earthquake-recent": {
            paramFormat: {},
            infoSource: "https://data.bmkg.go.id/gempabumi/",
            example: {
                exampleRequest: "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.xml"
            }
        },
        "tsunami-potential": {
            paramFormat: {},
            infoSource: "https://data.bmkg.go.id/gempabumi/",
            example: {
                exampleRequest: "https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.xml"
            }
        },
        "airquality-pm25": {
            paramFormat: {},
            infoSource: "https://data.bmkg.go.id/kualitas-udara/",
            example: {
                exampleRequest: "https://data.bmkg.go.id/DataMKG/MEWS/KelolaProduk/radcu/airquality/pm25.xml"
            }
        }
    },
};
