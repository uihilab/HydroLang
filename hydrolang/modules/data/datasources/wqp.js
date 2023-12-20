/**
 * https://www.waterqualitydata.us/webservices_documentation/#example-summary-service-call-geojson
 * This API serves as a viewer for data quality monitoring in CONUS 
 * In collaboration with USGS/EPA data
 * @type {Object}
 * @name WQP
 * @memberof datasources
 */

export default {
    "project-data": {
        endpoint: "https://www.waterqualitydata.us/data/Project/search?",
        params: {
            // These are only written to aid users to know
            // what parameters are available
            bBox: null,
            lat: null,
            long: null,
            within: null,
            countryCode: null,
            stateCode: null,
            siteType: null,
            organization: null,
            siteid: null,
            huc: null,
            sampleMedia: null,
            startDateHi: null,
            startDateLo: null
            // and more...
        },
        methods: {
            type: "json",
            method: "POST"
        }
    },

    "results": {
        endpoint: "https://www.waterqualitydata.us/data/Result/search?",
        params: {
            // These are only written to aid users to know
            // what parameters are available
            bBox: null,
            lat: null,
            long: null,
            within: null,
            countryCode: null,
            stateCode: null,
            siteType: null,
            organization: null,
            siteid: null,
            huc: null,
            sampleMedia: null,
            startDateHi: null,
            startDateLo: null
            // and more...
        },
        methods: {
            type: "json",
            method: "POST"
        }
    },

    "station": {
        endpoint: "https://www.waterqualitydata.us/data/Station/search?",
        params: {
            // These are only written to aid users to know
            // what parameters are available
            bBox: null,
            lat: null,
            long: null,
            within: null,
            countryCode: null,
            stateCode: null,
            siteType: null,
            organization: null,
            siteid: null,
            huc: null,
            sampleMedia: null,
            startDateHi: null,
            startDateLo: null
            // and more...
        },
        methods: {
            type: "json",
            method: "GET"
        }
    },

    "result-detection": {
        endpoint: "https://www.waterqualitydata.us/data/ResultDetectionQuantitationLimit/search?",
        params: {
            // These are only written to aid users to know
            // what parameters are available
            bBox: null,
            lat: null,
            long: null,
            within: null,
            countryCode: null,
            stateCode: null,
            siteType: null,
            organization: null,
            siteid: null,
            huc: null,
            sampleMedia: null,
            startDateHi: null,
            startDateLo: null
            // and more...
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

    /* DATA SOURCE 2 */

    /* DATA SOURCE ... */
};
