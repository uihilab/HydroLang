/**
 * India Meteorological Department (IMD): Open Government Data (OGD) Platform.
 * Provides access to weather forecasts, climatological data, cyclones, and tourism forecasts.
 * For more information, visit: https://data.gov.in/
 *
 * @type {Object}
 * @name IMD
 * @memberof datasources
 */

export default {
    // City Weather Forecast
    "forecast-city": {
        endpoint: "https://api.data.gov.in/resource/{resource_id}",
        params: {
            "api-key": null,
            format: "json",
            offset: "0",
            limit: "10",
            "filters[city]": null, // Filter by city name
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // District Rainfall
    "rainfall-district": {
        endpoint: "https://api.data.gov.in/resource/{resource_id}",
        params: {
            "api-key": null,
            format: "json",
            limit: "100",
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Cyclone Data (Annual Frequency/Tracks)
    "cyclone-data": {
        endpoint: "https://api.data.gov.in/resource/{resource_id}", // Resource ID for Cyclone dataset
        params: {
            "api-key": null,
            format: "json",
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Tourism Forecast
    "forecast-tourism": {
        endpoint: "https://api.data.gov.in/resource/{resource_id}", // Resource ID for Tourism dataset
        params: {
            "api-key": null,
            format: "json",
            "filters[station]": null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    requirements: {
        needProxy: true,
        requireskey: true,
        keyname: "api-key",
    },

    info: {
        returnFormats: "json, xml, csv",
        MoreInfo: "https://data.gov.in/",
        About: "IMD Data via OGD Platform. Requires a free API Key. Resource IDs change frequently; check the portal for the latest IDs for Cyclones and Tourism.",
    },

    "endpoint-info": {
        "forecast-city": {
            paramFormat: {
                resource_id: "String - Resource ID from OGD portal (changes frequently)",
                "filters[city]": "String - City name (e.g., 'New Delhi')",
            },
            infoSource: "https://data.gov.in/",
            example: {
                resource_id: "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69",
                "filters[city]": "New Delhi",
                exampleRequest: "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=YOUR_KEY&format=json&filters[city]=New Delhi"
            }
        },
        "rainfall-district": {
            paramFormat: {
                resource_id: "String - Resource ID for District Rainfall",
            },
            infoSource: "https://data.gov.in/",
            example: {
                resource_id: "rainfall-resource-id",
                exampleRequest: "https://api.data.gov.in/resource/rainfall-resource-id?api-key=YOUR_KEY&format=json&limit=100"
            }
        },
        "cyclone-data": {
            paramFormat: {
                resource_id: "String - Resource ID for Cyclone Data",
            },
            infoSource: "https://data.gov.in/",
            example: {
                resource_id: "cyclone-resource-id",
                exampleRequest: "https://api.data.gov.in/resource/cyclone-resource-id?api-key=YOUR_KEY&format=json"
            }
        },
        "forecast-tourism": {
            paramFormat: {
                resource_id: "String - Resource ID for Tourism Forecast",
                "filters[station]": "String - Station Name",
            },
            infoSource: "https://data.gov.in/",
            example: {
                resource_id: "tourism-resource-id",
                "filters[station]": "Shimla",
                exampleRequest: "https://api.data.gov.in/resource/tourism-resource-id?api-key=YOUR_KEY&format=json&filters[station]=Shimla"
            }
        }
    },
};
