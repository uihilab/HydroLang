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

    "activity": {
        endpoint: "https://www.waterqualitydata.us/data/Activity/search?",
        params: {
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
            startDateLo: null,
            activityId: null,
            projectId: null,
            assemblage: null
        },
        methods: {
            type: "json",
            method: "GET"
        }
    },

    "biological": {
        endpoint: "https://www.waterqualitydata.us/data/BiologicalResult/search?",
        params: {
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
            startDateLo: null,
            assemblage: null,
            characteristicName: null,
            taxonomicName: null
        },
        methods: {
            type: "json",
            method: "GET"
        }
    },

    "simple-station": {
        endpoint: "https://www.waterqualitydata.us/data/simplestation?",
        params: {
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
            startDateLo: null,
            mimeType: null
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
        MoreInfo: "https://www.waterqualitydata.us/webservices_documentation/#example-summary-service-call-geojson",
        About: "This API serves as a viewer for data quality monitoring in CONUS. In collaboration with USGS/EPA data."
    },
    
    "endpoint-info": {
        "project-data": {
            paramFormat: {
                bBox: "String - Bounding box (comma-separated: west,south,east,north)",
                lat: "Number - Latitude coordinate",
                long: "Number - Longitude coordinate",
                within: "Number - Search radius in miles",
                countryCode: "String - Country code (e.g., 'US')",
                stateCode: "String - State code (e.g., 'US:55' for Wisconsin)",
                siteType: "String - Site type (e.g., 'Stream', 'Well')",
                organization: "String - Organization identifier",
                siteid: "String - Site identifier",
                huc: "String - Hydrologic Unit Code",
                sampleMedia: "String - Sample media (e.g., 'Water', 'Sediment')",
                startDateHi: "String - Start date (MM-DD-YYYY)",
                startDateLo: "String - End date (MM-DD-YYYY)"
            },
            infoSource: "https://www.waterqualitydata.us/webservices_documentation/#wqp-web-services-data-retrieval-service",
            example: {
                huc: "05",
                sampleMedia: "Water",
                startDateLo: "01-01-2020",
                startDateHi: "01-31-2020",
                exampleRequest: "POST to https://www.waterqualitydata.us/data/Project/search?huc=05&sampleMedia=Water&startDateLo=01-01-2020&startDateHi=01-31-2020"
            }
        },
        "results": {
            paramFormat: {
                bBox: "String - Bounding box (comma-separated: west,south,east,north)",
                lat: "Number - Latitude coordinate",
                long: "Number - Longitude coordinate",
                within: "Number - Search radius in miles",
                countryCode: "String - Country code (e.g., 'US')",
                stateCode: "String - State code (e.g., 'US:55' for Wisconsin)",
                siteType: "String - Site type (e.g., 'Stream', 'Well')",
                organization: "String - Organization identifier",
                siteid: "String - Site identifier",
                huc: "String - Hydrologic Unit Code",
                sampleMedia: "String - Sample media (e.g., 'Water', 'Sediment')",
                startDateHi: "String - Start date (MM-DD-YYYY)",
                startDateLo: "String - End date (MM-DD-YYYY)"
            },
            infoSource: "https://www.waterqualitydata.us/webservices_documentation/#wqp-web-services-data-retrieval-service",
            example: {
                huc: "05",
                sampleMedia: "Water",
                startDateLo: "01-01-2020",
                startDateHi: "01-31-2020",
                exampleRequest: "POST to https://www.waterqualitydata.us/data/Result/search?huc=05&sampleMedia=Water&startDateLo=01-01-2020&startDateHi=01-31-2020"
            }
        },
        "station": {
            paramFormat: {
                bBox: "String - Bounding box (comma-separated: west,south,east,north)",
                lat: "Number - Latitude coordinate",
                long: "Number - Longitude coordinate",
                within: "Number - Search radius in miles",
                countryCode: "String - Country code (e.g., 'US')",
                stateCode: "String - State code (e.g., 'US:55' for Wisconsin)",
                siteType: "String - Site type (e.g., 'Stream', 'Well')",
                organization: "String - Organization identifier",
                siteid: "String - Site identifier",
                huc: "String - Hydrologic Unit Code",
                sampleMedia: "String - Sample media (e.g., 'Water', 'Sediment')",
                startDateHi: "String - Start date (MM-DD-YYYY)",
                startDateLo: "String - End date (MM-DD-YYYY)"
            },
            infoSource: "https://www.waterqualitydata.us/webservices_documentation/#wqp-web-services-station-service",
            example: {
                huc: "05",
                sampleMedia: "Water",
                startDateLo: "01-01-2020",
                startDateHi: "01-31-2020",
                exampleRequest: "https://www.waterqualitydata.us/data/Station/search?huc=05&sampleMedia=Water&startDateLo=01-01-2020&startDateHi=01-31-2020"
            }
        },
        "result-detection": {
            paramFormat: {
                bBox: "String - Bounding box (comma-separated: west,south,east,north)",
                lat: "Number - Latitude coordinate",
                long: "Number - Longitude coordinate",
                within: "Number - Search radius in miles",
                countryCode: "String - Country code (e.g., 'US')",
                stateCode: "String - State code (e.g., 'US:55' for Wisconsin)",
                siteType: "String - Site type (e.g., 'Stream', 'Well')",
                organization: "String - Organization identifier",
                siteid: "String - Site identifier",
                huc: "String - Hydrologic Unit Code",
                sampleMedia: "String - Sample media (e.g., 'Water', 'Sediment')",
                startDateHi: "String - Start date (MM-DD-YYYY)",
                startDateLo: "String - End date (MM-DD-YYYY)"
            },
            infoSource: "https://www.waterqualitydata.us/webservices_documentation/#wqp-web-services-result-detection-quantitation-limit-service",
            example: {
                huc: "05",
                sampleMedia: "Water",
                startDateLo: "01-01-2020",
                startDateHi: "01-31-2020",
                exampleRequest: "https://www.waterqualitydata.us/data/ResultDetectionQuantitationLimit/search?huc=05&sampleMedia=Water&startDateLo=01-01-2020&startDateHi=01-31-2020"
            }
        },
        "activity": {
            paramFormat: {
                bBox: "String - Bounding box (comma-separated: west,south,east,north)",
                lat: "Number - Latitude coordinate",
                long: "Number - Longitude coordinate",
                within: "Number - Search radius in miles",
                countryCode: "String - Country code (e.g., 'US')",
                stateCode: "String - State code (e.g., 'US:55' for Wisconsin)",
                siteType: "String - Site type (e.g., 'Stream', 'Well')",
                organization: "String - Organization identifier",
                siteid: "String - Site identifier",
                huc: "String - Hydrologic Unit Code",
                sampleMedia: "String - Sample media (e.g., 'Water', 'Sediment')",
                startDateHi: "String - Start date (MM-DD-YYYY)",
                startDateLo: "String - End date (MM-DD-YYYY)",
                activityId: "String - Activity identifier",
                projectId: "String - Project identifier",
                assemblage: "String - Biological assemblage (e.g., 'Fish', 'Macroinvertebrate')"
            },
            infoSource: "https://www.waterqualitydata.us/webservices_documentation/#wqp-web-services-activity-service",
            example: {
                huc: "05",
                sampleMedia: "Water",
                startDateLo: "01-01-2020",
                startDateHi: "01-31-2020",
                exampleRequest: "https://www.waterqualitydata.us/data/Activity/search?huc=05&sampleMedia=Water&startDateLo=01-01-2020&startDateHi=01-31-2020"
            }
        },
        "biological": {
            paramFormat: {
                bBox: "String - Bounding box (comma-separated: west,south,east,north)",
                lat: "Number - Latitude coordinate",
                long: "Number - Longitude coordinate",
                within: "Number - Search radius in miles",
                countryCode: "String - Country code (e.g., 'US')",
                stateCode: "String - State code (e.g., 'US:55' for Wisconsin)",
                siteType: "String - Site type (e.g., 'Stream', 'Well')",
                organization: "String - Organization identifier",
                siteid: "String - Site identifier",
                huc: "String - Hydrologic Unit Code",
                sampleMedia: "String - Sample media (e.g., 'Water', 'Sediment')",
                startDateHi: "String - Start date (MM-DD-YYYY)",
                startDateLo: "String - End date (MM-DD-YYYY)",
                assemblage: "String - Biological assemblage (e.g., 'Fish', 'Macroinvertebrate')",
                characteristicName: "String - Characteristic name",
                taxonomicName: "String - Taxonomic name"
            },
            infoSource: "https://www.waterqualitydata.us/webservices_documentation/#wqp-web-services-biological-result-service",
            example: {
                huc: "05",
                assemblage: "Fish",
                startDateLo: "01-01-2020",
                startDateHi: "01-31-2020",
                exampleRequest: "https://www.waterqualitydata.us/data/BiologicalResult/search?huc=05&assemblage=Fish&startDateLo=01-01-2020&startDateHi=01-31-2020"
            }
        },
        "simple-station": {
            paramFormat: {
                bBox: "String - Bounding box (comma-separated: west,south,east,north)",
                lat: "Number - Latitude coordinate",
                long: "Number - Longitude coordinate",
                within: "Number - Search radius in miles",
                countryCode: "String - Country code (e.g., 'US')",
                stateCode: "String - State code (e.g., 'US:55' for Wisconsin)",
                siteType: "String - Site type (e.g., 'Stream', 'Well')",
                organization: "String - Organization identifier",
                siteid: "String - Site identifier",
                huc: "String - Hydrologic Unit Code",
                sampleMedia: "String - Sample media (e.g., 'Water', 'Sediment')",
                startDateHi: "String - Start date (MM-DD-YYYY)",
                startDateLo: "String - End date (MM-DD-YYYY)",
                mimeType: "String - Response format (e.g., 'json', 'geojson')"
            },
            infoSource: "https://www.waterqualitydata.us/webservices_documentation/#wqp-web-services-simple-station-service",
            example: {
                huc: "05",
                siteType: "Stream",
                mimeType: "geojson",
                exampleRequest: "https://www.waterqualitydata.us/data/simplestation?huc=05&siteType=Stream&mimeType=geojson"
            }
        }
    },

    /* DATA SOURCE 2 */

    /* DATA SOURCE ... */
};
