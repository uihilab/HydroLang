/**
 * National Weather Service (NWS) API that allows access to forecasts, alerts, and observations and other weather data that allows JSON-LD machine data discovery. More information can be found here:
 * https://www.weather.gov/documentation/services-web-api#/default/obs_stations
 * The API's returns geoJSON, or JSON. Please verify each entry point BEFORE usage.
 * @type {Object}
 * @name NWS
 * @memberof datasources
 */

export default {
    //Returns gridpoints for each NWS Weather Forecast Office(WFO) at a resolution of 2.5km x 2.5km for 12h forecast periods.
    //Type can be forecast, stations
    gridpoints: {
        endpoint: "https://api.weather.gov/gridpoints/{office}/{gridX},{gridY}/forecast",
        //example of request for the gridpoint endpoint.
        params: {
            office: null,
            gridX: null,
            gridY: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    //Obtain grid forecast for a specific point
    points: {
        endpoint: "https://api.weather.gov/points/{latitude},{longitude}",
        //example of request for the gridpoint endpoint.
        params: {
            latitude: null,
            longitude: null
        },
        methods: {
            type: "json",
            method: "GET",
        },

    },

    //Returns all stations in a specific state  
    stations: {
        endpoint: "https://api.weather.gov/stations/",
        //example of request for the gridpoint endpoint.
        params: {
            id: null, //array of field observations
            state: null,
            limit: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    glossary: {
        endpoint: "https://api.weather.gov/glossary/",
        //example of request for the gridpoint endpoint.
        methods: {
            type: "json",
            method: "GET",
        },
    },

    //Returns metadata and observatins about a specific station  
    //For observations, attach a "observations" to the requirement
    //You can also attach a start and end date
    stationObservations: {
        endpoint: "https://api.weather.gov/stations/{stationId}/observations",
        //example of request for the gridpoint endpoint.
        params: {
            stationId: null, //array of field
            start: null,
            end: null,
            observations: null
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    singleStationObs: {
        endpoint: "https://api.weather.gov/stations/{stationId}/observations/{time}",
        //example of request for the gridpoint endpoint.
        params: {
            stationId: null, //array of field
            time: null //station time 
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    //Retrieve radar stations
    radarsStations: {
        endpoint: "https://api.weather.gov/radar/stations/",
        //example of request for the gridpoint endpoint.
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Returns active alerts from NWS
    alerts: {
        endpoint: "https://api.weather.gov/alerts",
        params: {
            status: null,
            message_type: null,
            event: null,
            code: null,
            area: null,
            point: null,
            region: null,
            region_type: null,
            zone: null,
            urgency: null,
            severity: null,
            certainty: null,
            limit: null
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Returns NWS forecast products
    products: {
        endpoint: "https://api.weather.gov/products",
        params: {
            location: null,
            start: null,
            end: null,
            office: null,
            limit: null,
            type: null
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Returns information about NWS zones
    zones: {
        endpoint: "https://api.weather.gov/zones",
        params: {
            type: null,
            id: null,
            area: null,
            region: null,
            point: null,
            include_geometry: null,
            limit: null,
            effective: null
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
        MoreInfo: "https://www.weather.gov/documentation/services-web-api#/default/obs_stations",
        About: "National Weather Service (NWS) API that allows access to forecasts, alerts, and observations and other weather data that allows JSON-LD machine data discovery."
    },
    "endpoint-info": {
        gridpoints: {
            paramFormat: {
                office: "String - NWS office identifier (e.g., 'LWX')",
                gridX: "Number - Grid X coordinate",
                gridY: "Number - Grid Y coordinate"
            },
            infoSource: "https://www.weather.gov/documentation/services-web-api#/default/gridpoint_forecast",
            example: {
                office: "LWX",
                gridX: "97",
                gridY: "71",
                exampleRequest: "https://api.weather.gov/gridpoints/LWX/97,71/forecast"
            }
        },
        points: {
            paramFormat: {
                latitude: "Number - Latitude coordinate",
                longitude: "Number - Longitude coordinate"
            },
            infoSource: "https://www.weather.gov/documentation/services-web-api#/default/point",
            example: {
                latitude: 38.8894,
                longitude: -77.0352,
                exampleRequest: "https://api.weather.gov/points/38.8894,-77.0352"
            }
        },
        stations: {
            paramFormat: {
                id: "String - Station ID",
                state: "String - State code (e.g., 'VA')",
                limit: "Number - Maximum number of results to return"
            },
            infoSource: "https://www.weather.gov/documentation/services-web-api#/default/observation_stations_list",
            example: {
                state: "VA",
                limit: 10,
                exampleRequest: "https://api.weather.gov/stations?state=VA&limit=10"
            }
        },
        glossary: {
            paramFormat: {},
            infoSource: "https://www.weather.gov/documentation/services-web-api",
            example: {
                exampleRequest: "https://api.weather.gov/glossary"
            }
        },
        stationObservations: {
            paramFormat: {
                stationId: "String - Station ID (e.g., 'KDCA')",
                start: "String - Start time (ISO format)",
                end: "String - End time (ISO format)",
                observations: "Boolean - Include observations"
            },
            infoSource: "https://www.weather.gov/documentation/services-web-api#/default/observation_station_observations_list",
            example: {
                stationId: "KDCA",
                start: "2020-01-01T00:00:00Z",
                end: "2020-01-02T00:00:00Z",
                exampleRequest: "https://api.weather.gov/stations/KDCA/observations?start=2020-01-01T00:00:00Z&end=2020-01-02T00:00:00Z"
            }
        },
        singleStationObs: {
            paramFormat: {
                stationId: "String - Station ID (e.g., 'KDCA')",
                time: "String - Observation time (ISO format)"
            },
            infoSource: "https://www.weather.gov/documentation/services-web-api#/default/observation_station_observation_latest",
            example: {
                stationId: "KDCA",
                time: "2020-01-01T12:00:00Z",
                exampleRequest: "https://api.weather.gov/stations/KDCA/observations/2020-01-01T12:00:00Z"
            }
        },
        radarsStations: {
            paramFormat: {},
            infoSource: "https://www.weather.gov/documentation/services-web-api",
            example: {
                exampleRequest: "https://api.weather.gov/radar/stations"
            }
        },
        alerts: {
            paramFormat: {
                status: "String - Status of the alert (e.g., 'actual', 'exercise', 'test')",
                message_type: "String - Type of message (e.g., 'alert', 'update', 'cancel')",
                event: "String - Event name (e.g., 'Flood Warning', 'Tornado Watch')",
                code: "String - Event code",
                area: "String - Area ID",
                point: "String - Point coordinates (lat,lon)",
                region: "String - Region name or ID",
                region_type: "String - Type of region",
                zone: "String - Zone ID",
                urgency: "String - Urgency level (e.g., 'immediate', 'expected')",
                severity: "String - Severity level (e.g., 'extreme', 'severe', 'moderate')",
                certainty: "String - Certainty level (e.g., 'observed', 'likely')",
                limit: "Number - Maximum number of results to return"
            },
            infoSource: "https://www.weather.gov/documentation/services-web-api#/default/alerts_active_list",
            example: {
                status: "actual",
                message_type: "alert",
                severity: "severe",
                limit: 10,
                exampleRequest: "https://api.weather.gov/alerts?status=actual&message_type=alert&severity=severe&limit=10"
            }
        },
        products: {
            paramFormat: {
                location: "String - Location ID",
                start: "String - Start time (ISO format)",
                end: "String - End time (ISO format)",
                office: "String - Office ID",
                limit: "Number - Maximum number of results to return",
                type: "String - Product type"
            },
            infoSource: "https://www.weather.gov/documentation/services-web-api#/default/products_list",
            example: {
                office: "LWX",
                limit: 5,
                exampleRequest: "https://api.weather.gov/products?office=LWX&limit=5"
            }
        },
        zones: {
            paramFormat: {
                type: "String - Zone type (e.g., 'forecast', 'county', 'fire')",
                id: "String - Zone ID",
                area: "String - Area ID",
                region: "String - Region ID",
                point: "String - Point coordinates (lat,lon)",
                include_geometry: "Boolean - Include geometry in response",
                limit: "Number - Maximum number of results to return",
                effective: "String - Effective date (ISO format)"
            },
            infoSource: "https://www.weather.gov/documentation/services-web-api#/default/zones_list",
            example: {
                type: "forecast",
                area: "VA",
                limit: 10,
                exampleRequest: "https://api.weather.gov/zones?type=forecast&area=VA&limit=10"
            }
        }
    }
};
