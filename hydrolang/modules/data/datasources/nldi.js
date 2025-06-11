/**
 * USGS National Land Data Interoperability (NLDI) API that allows access to hydrological data.
 * https://waterdata.usgs.gov/blog/nldi-intro/
 * The API's returns geoJSON, or JSON. Please verify each entry point BEFORE usage.
 * @type {Object}
 * @author kento-sugiyama
 * @name NLDI
 * @memberof datasources
 */

const baseEndpoint = 'https://api.water.usgs.gov/nldi/';

export default {
    //Returnns characteristic types
    lookups: {
        endpoint: `${baseEndpoint}/lookups`,
        //example of request for the gridpoint endpoint.
        params: {},
        methods: {
            type: "json",
            method: "GET",
        },
    },

    //Returns available characteristics metadata
    characteristics: {
        endpoint: `${baseEndpoint}/lookups/{characteristicType}/characteristics`,
        //example of request for the gridpoint endpoint.
        params: {
            characteristicType: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },

    },

    //Returns a list of data sources   
    linkedData: {
        endpoint: `${baseEndpoint}/linked-data`,
        //example of request for the gridpoint endpoint.
        params: {
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    //Returns a list of features for a given data source
    features: {
        endpoint: `${baseEndpoint}/linked-data/{featureSource}`,
        //example of request for the gridpoint endpoint.
        params: {
            featureSource: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    //Returns the basin for a given feature source, and provide a geoJSON with the basin boundary
    getBasin: {
        endpoint: `${baseEndpoint}/linked-data/{featureSource}/{featureId}/basin`,
        //example of request for the gridpoint endpoint.
        params: {
            featureSource: null,
            featureId: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    //Returns a list of navigation modes for a given feature source
    getNavigationTypes: {
        endpoint: `${baseEndpoint}/linked-data/{featureSource}/{featureId}/navigation-types`,
        //example of request for the gridpoint endpoint.
        params: {
            featureSource: null,
            featureId: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    //Returns the geoJSONs of the navigation features following a path. Navigation
    getNavigationFeatures: {
        endpoint: `${baseEndpoint}/linked-data/{featureSource}/{featureId}/navigation/{navigationMode}/{dataSource}/{distance}`,
        //example of request for the gridpoint endpoint.
        params: {
            featureSource: null,
            featureId: null,
            navigationMode: null,
            dataSource: null,
            //in km
            distance: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    //Retrieve WSG84 geoJSON for a given COMID
    getComid: {
        endpoint: `${baseEndpoint}/linked-data/comid/{comid}`,
        //example of request for the gridpoint endpoint.
        params: {
            comid: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Returns the features closest for a given coordinates
    getFeatureByCoordinates: {
        endpoint: `${baseEndpoint}/linked-data/comid/position`,
        params: {
            //in style POINT(longitude, latitude)
            coords: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    getHydrologicLocation: {
        endpoint: `${baseEndpoint}/linked-data/hydrolocation`,
        params: {
            //in style POINT(longitude, latitude)
            coords: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    getFlowlines: {
        endpoint: `${baseEndpoint}/linked-data/comid/{comid}/navigation/{navigationMode}/flowlines`,
        params: {
            comid: null,
            //values UM, UT, DM, DD
            navigationMode: null,
            distance: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
    requirements: {
        needProxy: true,
        requireskey: false,
    },
    info: {
        returnFormats: "json",
        MoreInfo: "https://waterdata.usgs.gov/blog/nldi-intro/",
        About: "USGS National Land Data Interoperability (NLDI) API that allows access to hydrological data including basin boundaries, navigation features, and watershed characteristics."
    },
    "endpoint-info": {
        lookups: {
            paramFormat: {},
            infoSource: "https://waterdata.usgs.gov/blog/nldi-intro/",
            example: {
                exampleRequest: "https://api.water.usgs.gov/nldi/lookups"
            }
        },
        characteristics: {
            paramFormat: {
                characteristicType: "String - Type of characteristic (e.g., 'local', 'total')"
            },
            infoSource: "https://waterdata.usgs.gov/blog/nldi-intro/",
            example: {
                characteristicType: "local",
                exampleRequest: "https://api.water.usgs.gov/nldi/lookups/local/characteristics"
            }
        },
        linkedData: {
            paramFormat: {},
            infoSource: "https://waterdata.usgs.gov/blog/nldi-intro/",
            example: {
                exampleRequest: "https://api.water.usgs.gov/nldi/linked-data"
            }
        },
        features: {
            paramFormat: {
                featureSource: "String - Feature source identifier (e.g., 'comid', 'huc12pp', 'nwissite')"
            },
            infoSource: "https://waterdata.usgs.gov/blog/nldi-intro/",
            example: {
                featureSource: "comid",
                exampleRequest: "https://api.water.usgs.gov/nldi/linked-data/comid"
            }
        },
        getBasin: {
            paramFormat: {
                featureSource: "String - Feature source identifier (e.g., 'comid')",
                featureId: "String - Feature identifier"
            },
            infoSource: "https://waterdata.usgs.gov/blog/nldi-intro/",
            example: {
                featureSource: "comid",
                featureId: "13297246",
                exampleRequest: "https://api.water.usgs.gov/nldi/linked-data/comid/13297246/basin"
            }
        },
        getNavigationTypes: {
            paramFormat: {
                featureSource: "String - Feature source identifier (e.g., 'comid')",
                featureId: "String - Feature identifier"
            },
            infoSource: "https://waterdata.usgs.gov/blog/nldi-intro/",
            example: {
                featureSource: "comid",
                featureId: "13297246",
                exampleRequest: "https://api.water.usgs.gov/nldi/linked-data/comid/13297246/navigation-types"
            }
        },
        getNavigationFeatures: {
            paramFormat: {
                featureSource: "String - Feature source identifier (e.g., 'comid')",
                featureId: "String - Feature identifier",
                navigationMode: "String - Navigation mode (e.g., 'UM', 'UT', 'DM', 'DD')",
                dataSource: "String - Data source for navigation",
                distance: "Number - Distance in kilometers"
            },
            infoSource: "https://waterdata.usgs.gov/blog/nldi-intro/",
            example: {
                featureSource: "comid",
                featureId: "13297246",
                navigationMode: "UM",
                dataSource: "flowlines",
                distance: 10,
                exampleRequest: "https://api.water.usgs.gov/nldi/linked-data/comid/13297246/navigation/UM/flowlines/10"
            }
        },
        getComid: {
            paramFormat: {
                comid: "String - COMID identifier"
            },
            infoSource: "https://waterdata.usgs.gov/blog/nldi-intro/",
            example: {
                comid: "13297246",
                exampleRequest: "https://api.water.usgs.gov/nldi/linked-data/13297246"
            }
        },
        getFeatureByCoordinates: {
            paramFormat: {
                coords: "String - Point coordinates in format 'POINT(longitude latitude)'"
            },
            infoSource: "https://waterdata.usgs.gov/blog/nldi-intro/",
            example: {
                coords: "POINT(-89.509 43.087)",
                exampleRequest: "https://api.water.usgs.gov/nldi/linked-data/comid/position?coords=POINT(-89.509 43.087)"
            }
        },
        getHydrologicLocation: {
            paramFormat: {
                coords: "String - Point coordinates in format 'POINT(longitude latitude)'"
            },
            infoSource: "https://waterdata.usgs.gov/blog/nldi-intro/",
            example: {
                coords: "POINT(-89.509 43.087)",
                exampleRequest: "https://api.water.usgs.gov/nldi/linked-data/hydrolocation?coords=POINT(-89.509 43.087)"
            }
        },
        getFlowlines: {
            paramFormat: {
                comid: "String - COMID identifier",
                navigationMode: "String - Navigation mode (UM, UT, DM, DD)",
                distance: "Number - Distance in kilometers"
            },
            infoSource: "https://waterdata.usgs.gov/blog/nldi-intro/",
            example: {
                comid: "13297246",
                navigationMode: "UM",
                distance: 10,
                exampleRequest: "https://api.water.usgs.gov/nldi/linked-data/comid/13297246/navigation/UM/flowlines?distance=10"
            }
        }
    }
};
