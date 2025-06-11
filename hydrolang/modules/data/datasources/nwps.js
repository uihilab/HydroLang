/**
 * National Weather Prediction Service (NWPS) API that allows access to forecasts, alerts, and observations and other weather data in hydrlogy.
 * https://api.water.noaa.gov/nwps/v1/docs/#/Gauges/Gauges_GetStageFlowAll
 * The API's returns geoJSON, or JSON. Please verify each entry point BEFORE usage.
 * @type {Object}
 * @name NWPS
 * @memberof datasources
 */

export default {
    //Gets a list of gauges
    gauges: {
        endpoint: "https://api.weather.gov/gridpoints/{office}/{gridX},{gridY}/forecast",
        //example of request for the gridpoint endpoint.
        params: {
            "bbox.xmin": null,
            "bbox.ymin": null,
            "bbox.xmax": null,
            "bbox.ymin": null,
            "srid": null,
            "catfim": null
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    //Obtains gauge given an identifier
    gauge: {
        endpoint: "https://api.water.noaa.gov/nwps/v1/gauges/{identifier}",
        //example of request for the gridpoint endpoint.
        params: {
            identifier: null,

        },
        methods: {
            type: "json",
            method: "GET",
        },

    },

    //Obtains ratings given a guage
    gauge_raitings: {
        endpoint: "https://api.water.noaa.gov/nwps/v1/gauges/{identifier}/ratings",
        //example of request for the gridpoint endpoint.
        params: {
            identifier: null,

        },
        methods: {
            type: "json",
            method: "GET",
        },

    },

    

    //Obtains observed and forecast stage/flow product data for a gauge
    gauge_stageflow: {
        endpoint: "https://api.water.noaa.gov/nwps/v1/gauges/{identifier}/stageflow",
        //example of request for the gridpoint endpoint.
        params: {
            identifier: null,

        },
        methods: {
            type: "json",
            method: "GET",
        },

    },

    //Obtains observed or forecast stage/flow product data for a gauge
    gauge_product: {
        endpoint: "https://api.water.noaa.gov/nwps/v1/gauges/{identifier}/stageflow/{product}",
        //example of request for the gridpoint endpoint.
        params: {
            identifier: null,
            product: null,

        },
        methods: {
            type: "json",
            method: "GET",
        },

    },

        //Obtains the metadata for a specific reach
        reach: {
            endpoint: "https://api.water.noaa.gov/nwps/v1/reaches/{reachId}",
            //example of request for the gridpoint endpoint.
            params: {
                reachId: null,
            },
            methods: {
                type: "json",
                method: "GET",
            },
    
        },

    //Obtains a reach streamflow for a specified reach  
    reach_streamflow: {
        endpoint: "https://api.water.noaa.gov/nwps/v1/reaches/{reachId}/streamflow",
        //example of request for the gridpoint endpoint.
        params: {
            reachId: null, //array of field observations
            series: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },
    
    // Gets information about reservoirs
    reservoirs: {
        endpoint: "https://api.water.noaa.gov/nwps/v1/reservoirs",
        params: {
            "bbox.xmin": null,
            "bbox.ymin": null,
            "bbox.xmax": null,
            "bbox.ymax": null,
            "srid": null,
            "status": null,
            "limit": null
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Gets specific reservoir data
    reservoir: {
        endpoint: "https://api.water.noaa.gov/nwps/v1/reservoirs/{reservoirId}",
        params: {
            reservoirId: null
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Gets basin analysis information
    basin_analysis: {
        endpoint: "https://api.water.noaa.gov/nwps/v1/basins/{basinId}/analysis",
        params: {
            basinId: null,
            startDate: null,
            endDate: null,
            dataType: null
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Gets flood outlook information
    flood_outlook: {
        endpoint: "https://api.water.noaa.gov/nwps/v1/flood/outlook",
        params: {
            region: null,
            date: null,
            format: null
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
        MoreInfo: "https://api.water.noaa.gov/nwps/v1/docs/#/Gauges/Gauges_GetStageFlowAll",
        About: "National Weather Prediction Service (NWPS) API that allows access to forecasts, alerts, and observations and other weather data in hydrology."
    },
    "endpoint-info": {
        gauges: {
            paramFormat: {
                "bbox.xmin": "Number - Minimum x-coordinate of bounding box",
                "bbox.ymin": "Number - Minimum y-coordinate of bounding box",
                "bbox.xmax": "Number - Maximum x-coordinate of bounding box",
                "bbox.ymax": "Number - Maximum y-coordinate of bounding box",
                "srid": "Number - Spatial reference ID",
                "catfim": "Boolean - Include CATFIM data"
            },
            infoSource: "https://api.water.noaa.gov/nwps/v1/docs/#/Gauges/Gauges_GetAll",
            example: {
                "bbox.xmin": -85,
                "bbox.ymin": 30,
                "bbox.xmax": -80,
                "bbox.ymax": 35,
                exampleRequest: "https://api.weather.gov/gridpoints/LWX/97,71/forecast?bbox.xmin=-85&bbox.ymin=30&bbox.xmax=-80&bbox.ymax=35"
            }
        },
        gauge: {
            paramFormat: {
                identifier: "String - Gauge identifier"
            },
            infoSource: "https://api.water.noaa.gov/nwps/v1/docs/#/Gauges/Gauges_Get",
            example: {
                identifier: "USGS-01646500",
                exampleRequest: "https://api.water.noaa.gov/nwps/v1/gauges/USGS-01646500"
            }
        },
        gauge_raitings: {
            paramFormat: {
                identifier: "String - Gauge identifier"
            },
            infoSource: "https://api.water.noaa.gov/nwps/v1/docs/#/Gauges/Gauges_GetRatings",
            example: {
                identifier: "USGS-01646500",
                exampleRequest: "https://api.water.noaa.gov/nwps/v1/gauges/USGS-01646500/ratings"
            }
        },
        gauge_stageflow: {
            paramFormat: {
                identifier: "String - Gauge identifier"
            },
            infoSource: "https://api.water.noaa.gov/nwps/v1/docs/#/Gauges/Gauges_GetStageFlowAll",
            example: {
                identifier: "USGS-01646500",
                exampleRequest: "https://api.water.noaa.gov/nwps/v1/gauges/USGS-01646500/stageflow"
            }
        },
        gauge_product: {
            paramFormat: {
                identifier: "String - Gauge identifier",
                product: "String - Product type (e.g., 'observed' or 'forecast')"
            },
            infoSource: "https://api.water.noaa.gov/nwps/v1/docs/#/Gauges/Gauges_GetStageFlowProd",
            example: {
                identifier: "USGS-01646500",
                product: "observed",
                exampleRequest: "https://api.water.noaa.gov/nwps/v1/gauges/USGS-01646500/stageflow/observed"
            }
        },
        reach: {
            paramFormat: {
                reachId: "String - Reach identifier"
            },
            infoSource: "https://api.water.noaa.gov/nwps/v1/docs/#/Reaches/Reaches_Get",
            example: {
                reachId: "NWM-12345",
                exampleRequest: "https://api.water.noaa.gov/nwps/v1/reaches/NWM-12345"
            }
        },
        reach_streamflow: {
            paramFormat: {
                reachId: "String - Reach identifier",
                series: "String - Series type"
            },
            infoSource: "https://api.water.noaa.gov/nwps/v1/docs/#/Reaches/Reaches_GetStreamflow",
            example: {
                reachId: "NWM-12345",
                series: "time",
                exampleRequest: "https://api.water.noaa.gov/nwps/v1/reaches/NWM-12345/streamflow?series=time"
            }
        },
        reservoirs: {
            paramFormat: {
                "bbox.xmin": "Number - Minimum x-coordinate of bounding box",
                "bbox.ymin": "Number - Minimum y-coordinate of bounding box",
                "bbox.xmax": "Number - Maximum x-coordinate of bounding box",
                "bbox.ymax": "Number - Maximum y-coordinate of bounding box",
                "srid": "Number - Spatial reference ID",
                "status": "String - Reservoir status (e.g., 'normal', 'below', 'above')",
                "limit": "Number - Maximum number of results to return"
            },
            infoSource: "https://api.water.noaa.gov/nwps/v1/docs/#/Reservoirs",
            example: {
                "bbox.xmin": -85,
                "bbox.ymin": 30,
                "bbox.xmax": -80,
                "bbox.ymax": 35,
                limit: 10,
                exampleRequest: "https://api.water.noaa.gov/nwps/v1/reservoirs?bbox.xmin=-85&bbox.ymin=30&bbox.xmax=-80&bbox.ymax=35&limit=10"
            }
        },
        reservoir: {
            paramFormat: {
                reservoirId: "String - Reservoir identifier"
            },
            infoSource: "https://api.water.noaa.gov/nwps/v1/docs/#/Reservoirs",
            example: {
                reservoirId: "USACE-12345",
                exampleRequest: "https://api.water.noaa.gov/nwps/v1/reservoirs/USACE-12345"
            }
        },
        basin_analysis: {
            paramFormat: {
                basinId: "String - Basin identifier",
                startDate: "String - Start date (YYYY-MM-DD format)",
                endDate: "String - End date (YYYY-MM-DD format)",
                dataType: "String - Type of data to retrieve (e.g., 'precipitation', 'runoff')"
            },
            infoSource: "https://api.water.noaa.gov/nwps/v1/docs/#/Basins",
            example: {
                basinId: "HUC8-12345678",
                startDate: "2020-01-01",
                endDate: "2020-01-31",
                dataType: "precipitation",
                exampleRequest: "https://api.water.noaa.gov/nwps/v1/basins/HUC8-12345678/analysis?startDate=2020-01-01&endDate=2020-01-31&dataType=precipitation"
            }
        },
        flood_outlook: {
            paramFormat: {
                region: "String - Region identifier (e.g., 'northeast', 'midwest')",
                date: "String - Date for outlook (YYYY-MM-DD format)",
                format: "String - Response format (e.g., 'json', 'geojson')"
            },
            infoSource: "https://api.water.noaa.gov/nwps/v1/docs/#/Flood",
            example: {
                region: "northeast",
                date: "2020-01-15",
                format: "json",
                exampleRequest: "https://api.water.noaa.gov/nwps/v1/flood/outlook?region=northeast&date=2020-01-15&format=json"
            }
        }
    }
};
