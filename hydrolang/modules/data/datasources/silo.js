/**
 * SILO (Scientific Information for Land Owners)
 * Provides daily climate data for Australia (Queensland Government).
 * For more information: https://www.longpaddock.qld.gov.au/silo/
 *
 * @type {Object}
 * @name SILO
 * @memberof datasources
 */

export default {
    "daily-climate": {
        endpoint: "https://www.longpaddock.qld.gov.au/cgi-bin/silo/PatchedPointDataset.php",
        params: {
            station: null,
            start: null, // YYYYMMDD
            finish: null, // YYYYMMDD
            format: "json",
            username: "guest", // Public access often allows 'guest' or email
            password: "guest"
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
        returnFormats: "json, csv",
        MoreInfo: "https://www.longpaddock.qld.gov.au/silo/",
        About: "SILO provides daily climate data for Australian locations, including rainfall, temperature, and radiation."
    },

    "endpoint-info": {
        "daily-climate": {
            paramFormat: {
                station: "String - Station ID (e.g., '040913')",
                start: "String - Start date (YYYYMMDD)",
                finish: "String - End date (YYYYMMDD)",
                format: "String - Output format (default: 'json')"
            },
            infoSource: "https://www.longpaddock.qld.gov.au/silo/point-data/",
            example: {
                station: "040913",
                start: "20230101",
                finish: "20230131",
                exampleRequest: "https://www.longpaddock.qld.gov.au/cgi-bin/silo/PatchedPointDataset.php?station=040913&start=20230101&finish=20230131&format=json"
            }
        }
    }
};
