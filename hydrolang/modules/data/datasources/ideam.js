/**
 * IDEAM (Instituto de Hidrología, Meteorología y Estudios Ambientales) - Colombia
 * Provides hydrometeorological data.
 * For more information: http://www.ideam.gov.co/
 *
 * @type {Object}
 * @name IDEAM
 * @memberof datasources
 */

export default {
    "observations": {
        endpoint: "https://wis.ideam.gov.co/oapi/collections/observations/items",
        params: {
            f: "json",
            limit: 10
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
        MoreInfo: "https://wis.ideam.gov.co/oapi/",
        About: "IDEAM provides access to station observations via OGC API Features (WIS2)."
    },

    "endpoint-info": {
        "observations": {
            paramFormat: {
                f: "String - Format (json)",
                limit: "Number - Limit results"
            },
            infoSource: "https://wis.ideam.gov.co/oapi/",
            example: {
                limit: 10,
                exampleRequest: "https://wis.ideam.gov.co/oapi/collections/observations/items?f=json&limit=10"
            }
        }
    }
};
