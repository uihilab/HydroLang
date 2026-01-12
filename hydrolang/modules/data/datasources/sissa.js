/**
 * SISSA (Sistema de Información sobre Sequías para el Sur de Sudamérica)
 * Provides drought monitoring data for Southern South America.
 * For more information: https://sissa.crc-sas.org/
 *
 * @type {Object}
 * @name SISSA
 * @memberof datasources
 */

export default {
    "drought-indices": {
        endpoint: "https://api.sissa.crc-sas.org/v1/indices",
        params: {
            index: null, // e.g., "spi"
            scale: null, // e.g., "3"
            date: null
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
        MoreInfo: "https://sissa.crc-sas.org/",
        About: "SISSA provides drought indices (SPI, SPEI) and monitoring tools for Southern South America."
    },

    "endpoint-info": {
        "drought-indices": {
            paramFormat: {
                index: "String - Drought index (spi, spei)",
                scale: "Number - Time scale (1, 3, 6, 12 months)",
                date: "String - Date (YYYY-MM-DD)"
            },
            infoSource: "https://sissa.crc-sas.org/",
            example: {
                index: "spi",
                scale: "3",
                date: "2023-01-01",
                exampleRequest: "https://api.sissa.crc-sas.org/v1/indices?index=spi&scale=3&date=2023-01-01"
            }
        }
    }
};
