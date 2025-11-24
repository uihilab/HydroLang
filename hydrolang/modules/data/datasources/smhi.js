/**
 * SMHI (Swedish Meteorological and Hydrological Institute): Open Data API.
 * Provides access to meteorological, hydrological, and oceanographic data.
 * For more information, visit: https://opendata.smhi.se/
 *
 * @type {Object}
 * @name SMHI
 * @memberof datasources
 */

export default {
    // Meteorological Observations (Parameter/Station)
    "met-obs": {
        endpoint: "https://opendata-download-metobs.smhi.se/api/version/1.0/parameter/{parameter}/station/{station}/period/{period}/data.json",
        params: {
            parameter: null, // e.g., "1" (Air temp)
            station: null, // e.g., "98210" (Visby)
            period: null, // "latest-hour", "latest-day", "latest-months", "corrected-archive"
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Meteorological Forecasts (Point)
    "met-forecast": {
        endpoint: "https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json",
        params: {
            lon: null,
            lat: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Hydrological Observations
    "hydro-obs": {
        endpoint: "https://opendata-download-hydroobs.smhi.se/api/version/1.0/parameter/{parameter}/station/{station}/period/{period}/data.json",
        params: {
            parameter: null, // e.g., "Water flow"
            station: null,
            period: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Oceanographic Observations
    "ocean-obs": {
        endpoint: "https://opendata-download-ocobs.smhi.se/api/version/1.0/parameter/{parameter}/station/{station}/period/{period}/data.json",
        params: {
            parameter: null, // e.g., "Sea level"
            station: null,
            period: null,
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
        MoreInfo: "https://opendata.smhi.se/",
        About: "SMHI Open Data API. Provides meteorological, hydrological, and oceanographic observations and forecasts in JSON format.",
    },

    "endpoint-info": {
        "met-obs": {
            paramFormat: {
                parameter: "String - Parameter ID (e.g., '1' for Air Temp)",
                station: "String - Station ID (e.g., '98210' for Visby)",
                period: "String - Data period (e.g., 'latest-hour')",
            },
            infoSource: "https://opendata.smhi.se/apidocs/metobs",
            example: {
                parameter: "1",
                station: "98210",
                period: "latest-hour",
                exampleRequest: "https://opendata-download-metobs.smhi.se/api/version/1.0/parameter/1/station/98210/period/latest-hour/data.json"
            }
        },
        "met-forecast": {
            paramFormat: {
                lon: "Number - Longitude",
                lat: "Number - Latitude",
            },
            infoSource: "https://opendata.smhi.se/apidocs/metfcst",
            example: {
                lon: 16.158,
                lat: 58.5812,
                exampleRequest: "https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/16.158/lat/58.5812/data.json"
            }
        },
        "hydro-obs": {
            paramFormat: {
                parameter: "String - Parameter ID (e.g., '1' for Water Discharge)",
                station: "String - Station ID (e.g., '2266')",
                period: "String - Data period (e.g., 'latest-day')",
            },
            infoSource: "https://opendata.smhi.se/apidocs/hydroobs",
            example: {
                parameter: "1",
                station: "2266",
                period: "latest-day",
                exampleRequest: "https://opendata-download-hydroobs.smhi.se/api/version/1.0/parameter/1/station/2266/period/latest-day/data.json"
            }
        },
        "ocean-obs": {
            paramFormat: {
                parameter: "String - Parameter ID (e.g., '13' for Sea Level)",
                station: "String - Station ID (e.g., '35101')",
                period: "String - Data period (e.g., 'latest-hour')",
            },
            infoSource: "https://opendata.smhi.se/apidocs/oceanobs",
            example: {
                parameter: "13",
                station: "35101",
                period: "latest-hour",
                exampleRequest: "https://opendata-download-ocobs.smhi.se/api/version/1.0/parameter/13/station/35101/period/latest-hour/data.json"
            }
        }
    },
};
