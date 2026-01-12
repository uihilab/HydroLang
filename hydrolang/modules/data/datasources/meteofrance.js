/**
 * Météo-France: Official API Portal.
 * Provides access to AROME/ARPEGE models, observations, vigilance alerts, and radar data.
 * For more information, visit: https://portail-api.meteofrance.fr/
 *
 * @type {Object}
 * @name MeteoFrance
 * @memberof datasources
 */

export default {
    // AROME Model (High Resolution)
    "arome": {
        endpoint: "https://public-api.meteofrance.fr/public/arome/1.0/wcs/MF-NWP-HIGHRES-AROME-001-FRANCE-WCS/GetCoverage",
        params: {
            service: "WCS",
            version: "2.0.1",
            coverageId: null, // e.g., "TEMPERATURE__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND"
            subset: [], // e.g., ["time(2023-01-01T00:00:00Z)", "lat(41,51)", "long(-5,10)"]
            format: "application/json", // or "image/tiff"
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // ARPEGE Model (Global)
    "arpege": {
        endpoint: "https://public-api.meteofrance.fr/public/arpege/1.0/wcs/MF-NWP-GLOBAL-ARPEGE-05-GLOBE-WCS/GetCoverage",
        params: {
            service: "WCS",
            version: "2.0.1",
            coverageId: null,
            subset: [],
            format: "application/json",
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Observations (Synop)
    "observation-synop": {
        endpoint: "https://public-api.meteofrance.fr/public/DPPObs/v1/models/synop",
        params: {
            id_station: null,
            date: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Vigilance (Alerts)
    "vigilance": {
        endpoint: "https://public-api.meteofrance.fr/public/DPVigilance/v1/map",
        params: {
            domain: "vigi-express", // or "vigi-metropole"
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Radar Data (Mosaic)
    "radar-mosaic": {
        endpoint: "https://public-api.meteofrance.fr/public/DPPrecip/v1/map/mosaic",
        params: {
            domain: "FRANCE",
            dateTime: null, // ISO8601
        },
        methods: {
            type: "json", // Returns metadata/links to tiles
            method: "GET",
        },
    },

    requirements: {
        needProxy: true,
        requireskey: true,
        keyname: "apikey", // Header: "apikey": "YOUR_KEY"
    },

    info: {
        returnFormats: "json, tiff",
        MoreInfo: "https://portail-api.meteofrance.fr/",
        About: "Météo-France Official API. Requires a free API key. Provides high-resolution model data (AROME), global data (ARPEGE), alerts, and radar.",
    },

    "endpoint-info": {
        "arome": {
            paramFormat: {
                coverageId: "String - Variable ID (e.g., 'TEMPERATURE__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND')",
                subset: "Array - Subsetting parameters (time, lat, long)",
            },
            infoSource: "https://portail-api.meteofrance.fr/",
            example: {
                coverageId: "TEMPERATURE__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND",
                subset: ["time(2023-10-27T12:00:00Z)", "lat(48.85)", "long(2.35)"],
                exampleRequest: "https://public-api.meteofrance.fr/public/arome/1.0/wcs/MF-NWP-HIGHRES-AROME-001-FRANCE-WCS/GetCoverage?service=WCS&version=2.0.1&coverageId=TEMPERATURE__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND&subset=time(2023-10-27T12:00:00Z)&subset=lat(48.85)&subset=long(2.35)"
            }
        },
        "arpege": {
            paramFormat: {
                coverageId: "String - Variable ID (e.g., 'TEMPERATURE__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND')",
                subset: "Array - Subsetting parameters (time, lat, long)",
            },
            infoSource: "https://portail-api.meteofrance.fr/",
            example: {
                coverageId: "TEMPERATURE__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND",
                subset: ["time(2023-10-27T12:00:00Z)", "lat(48.85)", "long(2.35)"],
                exampleRequest: "https://public-api.meteofrance.fr/public/arpege/1.0/wcs/MF-NWP-GLOBAL-ARPEGE-05-GLOBE-WCS/GetCoverage?service=WCS&version=2.0.1&coverageId=TEMPERATURE__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND&subset=time(2023-10-27T12:00:00Z)&subset=lat(48.85)&subset=long(2.35)"
            }
        },
        "observation-synop": {
            paramFormat: {
                id_station: "String - Station ID (e.g., '07149' for Paris-Orly)",
                date: "String - Date (ISO8601)",
            },
            infoSource: "https://portail-api.meteofrance.fr/",
            example: {
                id_station: "07149",
                date: "2023-10-27T12:00:00Z",
                exampleRequest: "https://public-api.meteofrance.fr/public/DPPObs/v1/models/synop?id_station=07149&date=2023-10-27T12:00:00Z"
            }
        },
        "vigilance": {
            paramFormat: {
                domain: "String - Domain (e.g., 'vigi-express' or 'vigi-metropole')",
            },
            infoSource: "https://portail-api.meteofrance.fr/",
            example: {
                domain: "vigi-metropole",
                exampleRequest: "https://public-api.meteofrance.fr/public/DPVigilance/v1/map?domain=vigi-metropole"
            }
        },
        "radar-mosaic": {
            paramFormat: {
                domain: "String - Domain (e.g., 'FRANCE')",
                dateTime: "String - Date Time (ISO8601)",
            },
            infoSource: "https://portail-api.meteofrance.fr/",
            example: {
                domain: "FRANCE",
                dateTime: "2023-10-27T12:00:00Z",
                exampleRequest: "https://public-api.meteofrance.fr/public/DPPrecip/v1/map/mosaic?domain=FRANCE&dateTime=2023-10-27T12:00:00Z"
            }
        }
    },
};
