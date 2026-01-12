/**
 * China Meteorological Administration (CMA): Official Data Service.
 * Provides access to meteorological data via data.cma.cn API.
 * For more information, visit: https://data.cma.cn/en
 *
 * @type {Object}
 * @name CMA
 * @memberof datasources
 */

export default {
    // Station Data (Surface)
    "station-surface": {
        endpoint: "http://data.cma.cn/data/getStationData", // Example endpoint
        params: {
            stationId: null,
            element: null, // e.g., "TEM,PRE,WIN"
            timeRange: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Grid Data (NWP)
    "grid-nwp": {
        endpoint: "http://data.cma.cn/data/getGridData",
        params: {
            model: null, // e.g., "GRAPES"
            element: null,
            time: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // S2S (Sub-seasonal to Seasonal)
    "s2s-products": {
        endpoint: "http://s2s.cma.cn/api/getProducts",
        params: {
            product: null,
            date: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Satellite (FengYun) - Metadata Access
    "satellite-fy": {
        endpoint: "http://satellite.cma.gov.cn/portalsite/Data/GetData",
        params: {
            satellite: "FY-4A",
            instrument: "AGRI",
            product: "L1",
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    requirements: {
        needProxy: true,
        requireskey: true,
        keyname: "token", // User must provide their own token
    },

    info: {
        returnFormats: "json, csv",
        MoreInfo: "https://data.cma.cn/en",
        About: "CMA Official Data Service. Requires a registered account and token. Provides access to station data, NWP models, S2S products, and satellite metadata.",
    },

    "endpoint-info": {
        "station-surface": {
            paramFormat: {
                stationId: "String - Station ID (e.g., '54511' for Beijing)",
                element: "String - Meteorological elements (e.g., 'TEM,PRE,WIN')",
            },
            infoSource: "https://data.cma.cn/en",
            example: {
                stationId: "54511",
                element: "TEM",
                exampleRequest: "http://data.cma.cn/data/getStationData?stationId=54511&element=TEM"
            }
        },
        "grid-nwp": {
            paramFormat: {
                model: "String - Model name (e.g., 'GRAPES')",
                element: "String - Element name",
            },
            infoSource: "https://data.cma.cn/en",
            example: {
                model: "GRAPES",
                element: "TEM",
                exampleRequest: "http://data.cma.cn/data/getGridData?model=GRAPES&element=TEM"
            }
        },
        "s2s-products": {
            paramFormat: {
                product: "String - Product name",
                date: "String - Date",
            },
            infoSource: "http://s2s.cma.cn/",
            example: {
                product: "precip",
                date: "20231027",
                exampleRequest: "http://s2s.cma.cn/api/getProducts?product=precip&date=20231027"
            }
        },
        "satellite-fy": {
            paramFormat: {
                satellite: "String - Satellite name (e.g., 'FY-4A')",
                instrument: "String - Instrument (e.g., 'AGRI')",
                product: "String - Product level (e.g., 'L1')",
            },
            infoSource: "http://satellite.cma.gov.cn/",
            example: {
                satellite: "FY-4A",
                instrument: "AGRI",
                product: "L1",
                exampleRequest: "http://satellite.cma.gov.cn/portalsite/Data/GetData?satellite=FY-4A&instrument=AGRI&product=L1"
            }
        }
    },
};
