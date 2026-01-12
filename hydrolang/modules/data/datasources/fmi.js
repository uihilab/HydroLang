/**
 * Finnish Meteorological Institute (FMI): Open Data WFS.
 * Provides access to weather observations, forecasts, air quality, and radiation data via OGC WFS.
 * For more information, visit: https://en.ilmatieteenlaitos.fi/open-data
 *
 * @type {Object}
 * @name FMI
 * @memberof datasources
 */

export default {
    // Simple WFS GetFeature query
    "wfs-simple": {
        endpoint: "https://opendata.fmi.fi/wfs",
        params: {
            service: "WFS",
            version: "2.0.0",
            request: "GetFeature",
            storedquery_id: null, // e.g., "fmi::observations::weather::simple"
            place: null, // e.g., "Helsinki"
            starttime: null,
            endtime: null,
            parameters: null, // e.g., "temperature,humidity"
        },
        methods: {
            type: "xml", // Returns GML/XML
            method: "GET",
        },
    },

    // Air Quality Forecast (Enfuser)
    "airquality-forecast": {
        endpoint: "https://opendata.fmi.fi/wfs",
        params: {
            service: "WFS",
            version: "2.0.0",
            request: "GetFeature",
            storedquery_id: "fmi::forecast::enfuser::airquality::helsinki-metropolitan::grid",
            starttime: null,
            endtime: null,
            bbox: null, // lon,lat,lon,lat
        },
        methods: {
            type: "xml",
            method: "GET",
        },
    },

    // Radiation Observations (Multipoint)
    "radiation-obs": {
        endpoint: "https://opendata.fmi.fi/wfs",
        params: {
            service: "WFS",
            version: "2.0.0",
            request: "GetFeature",
            storedquery_id: "fmi::observations::radiation::multipointcoverage",
            place: null,
            starttime: null,
            endtime: null,
        },
        methods: {
            type: "xml",
            method: "GET",
        },
    },

    requirements: {
        needProxy: false,
        requireskey: false,
    },

    info: {
        returnFormats: "xml (GML)",
        MoreInfo: "https://en.ilmatieteenlaitos.fi/open-data-manual",
        About: "FMI Open Data WFS. Provides data in GML format. Includes Weather, Air Quality (Enfuser), and Radiation data.",
    },

    "endpoint-info": {
        "wfs-simple": {
            paramFormat: {
                storedquery_id: "String - ID of the stored query (e.g., 'fmi::observations::weather::simple')",
                place: "String - Location name (e.g., 'Helsinki')",
            },
            infoSource: "https://en.ilmatieteenlaitos.fi/open-data-manual",
            example: {
                storedquery_id: "fmi::observations::weather::simple",
                place: "Helsinki",
                exampleRequest: "https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=GetFeature&storedquery_id=fmi::observations::weather::simple&place=Helsinki"
            }
        },
        "airquality-forecast": {
            paramFormat: {
                storedquery_id: "String - ID (fixed: 'fmi::forecast::enfuser::airquality::helsinki-metropolitan::grid')",
                bbox: "String - Bounding box (lon,lat,lon,lat)",
            },
            infoSource: "https://en.ilmatieteenlaitos.fi/open-data-manual",
            example: {
                storedquery_id: "fmi::forecast::enfuser::airquality::helsinki-metropolitan::grid",
                bbox: "24.5,60.1,25.5,60.3",
                exampleRequest: "https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=GetFeature&storedquery_id=fmi::forecast::enfuser::airquality::helsinki-metropolitan::grid&bbox=24.5,60.1,25.5,60.3"
            }
        },
        "radiation-obs": {
            paramFormat: {
                place: "String - Location name (e.g., 'Sodankylä')",
            },
            infoSource: "https://en.ilmatieteenlaitos.fi/open-data-manual",
            example: {
                place: "Sodankylä",
                exampleRequest: "https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=GetFeature&storedquery_id=fmi::observations::radiation::multipointcoverage&place=Sodankylä"
            }
        }
    },
};
