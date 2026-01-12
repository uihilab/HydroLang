/**
 * KNMI (Royal Netherlands Meteorological Institute): Data Platform (KDP).
 * Provides access to weather, climate, and seismological data.
 * For more information, visit: https://developer.dataplatform.knmi.nl/
 *
 * @type {Object}
 * @name KNMI
 * @memberof datasources
 */

export default {
    // Open Data API (File listing and download)
    "dataset-files": {
        endpoint: "https://api.dataplatform.knmi.nl/open-data/v1/datasets/{datasetName}/versions/{version}/files",
        params: {
            datasetName: null, // e.g., "Actuele10mindataKNMIstations"
            version: null, // e.g., "2"
            startAfterFilename: null,
            maxKeys: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // EDR API (Environmental Data Retrieval - Spatiotemporal query)
    "edr-query": {
        endpoint: "https://api.dataplatform.knmi.nl/edr/v1/collections/{collectionId}/position",
        params: {
            collectionId: null,
            coords: null, // WKT format e.g., "POINT(5.2 52.1)"
            "parameter-name": null,
            datetime: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Seismology - FDSN Event (Earthquakes)
    "seismology-event": {
        endpoint: "http://rdsa.knmi.nl/fdsnws/event/1/query",
        params: {
            starttime: null,
            endtime: null,
            minmag: null,
            maxmag: null,
            format: "xml", // or "text"
        },
        methods: {
            type: "xml",
            method: "GET",
        },
    },

    // Seismology - FDSN Station (Metadata)
    "seismology-station": {
        endpoint: "http://rdsa.knmi.nl/fdsnws/station/1/query",
        params: {
            network: null, // e.g., "NL"
            station: null,
            level: "station",
            format: "xml",
        },
        methods: {
            type: "xml",
            method: "GET",
        },
    },

    requirements: {
        needProxy: true,
        requireskey: true,
        keyname: "Authorization", // Header: "Authorization": "Descriptor_KEY"
    },

    info: {
        returnFormats: "json, netcdf (via download), xml",
        MoreInfo: "https://developer.dataplatform.knmi.nl/",
        About: "KNMI Data Platform. Requires a free API key. Provides access to raw files (NetCDF, etc.), EDR query endpoints, and FDSN Seismology services.",
    },

    "endpoint-info": {
        "dataset-files": {
            paramFormat: {
                datasetName: "String - Name of the dataset (e.g., 'Actuele10mindataKNMIstations')",
                version: "String - Version of the dataset (e.g., '2')",
            },
            infoSource: "https://developer.dataplatform.knmi.nl/open-data-api",
            example: {
                datasetName: "Actuele10mindataKNMIstations",
                version: "2",
                exampleRequest: "https://api.dataplatform.knmi.nl/open-data/v1/datasets/Actuele10mindataKNMIstations/versions/2/files"
            }
        },
        "edr-query": {
            paramFormat: {
                collectionId: "String - Collection ID",
                coords: "String - WKT Coordinates (e.g., 'POINT(5.2 52.1)')",
                "parameter-name": "String - Parameter Name",
            },
            infoSource: "https://developer.dataplatform.knmi.nl/edr-api",
            example: {
                collectionId: "harmonie_arome_cy43_p1",
                coords: "POINT(5.2 52.1)",
                exampleRequest: "https://api.dataplatform.knmi.nl/edr/v1/collections/harmonie_arome_cy43_p1/position?coords=POINT(5.2 52.1)"
            }
        },
        "seismology-event": {
            paramFormat: {
                starttime: "String - Start time (ISO8601)",
                minmag: "Number - Minimum magnitude (e.g., 2.0)",
            },
            infoSource: "http://rdsa.knmi.nl/fdsnws/event/1/",
            example: {
                minmag: 2.0,
                exampleRequest: "http://rdsa.knmi.nl/fdsnws/event/1/query?minmag=2.0"
            }
        },
        "seismology-station": {
            paramFormat: {
                network: "String - Network Code (e.g., 'NL')",
                station: "String - Station Code",
            },
            infoSource: "http://rdsa.knmi.nl/fdsnws/station/1/",
            example: {
                network: "NL",
                exampleRequest: "http://rdsa.knmi.nl/fdsnws/station/1/query?network=NL&level=station"
            }
        }
    },
};
