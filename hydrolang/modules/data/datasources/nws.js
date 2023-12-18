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
    //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
    requirements: {
        needProxy: true,
        requireskey: false,
    },
};
