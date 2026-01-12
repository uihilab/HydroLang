/**
 * CPTEC (Centro de Previsão de Tempo e Estudos Climáticos) - INPE
 * Provides weather forecasts and climate data for Brazil and South America.
 * For more information: https://www.cptec.inpe.br/
 *
 * @type {Object}
 * @name CPTEC
 * @memberof datasources
 */

export default {
    "city-forecast": {
        endpoint: "http://servicos.cptec.inpe.br/XML/cidade/{cityCode}/previsao.xml",
        params: {
            cityCode: null // e.g., "244" for São Paulo
        },
        methods: {
            type: "xml",
            method: "GET"
        }
    },

    "wave-forecast": {
        endpoint: "http://servicos.cptec.inpe.br/XML/cidade/{cityCode}/dia/{day}/ondas.xml",
        params: {
            cityCode: null,
            day: "0" // 0 to 6
        },
        methods: {
            type: "xml",
            method: "GET"
        }
    },

    requirements: {
        needProxy: true, // Often needed for XML services due to CORS
        requireskey: false,
    },

    info: {
        returnFormats: "xml",
        MoreInfo: "http://servicos.cptec.inpe.br/XML/",
        About: "CPTEC/INPE provides weather and wave forecasts for Brazilian cities via XML services."
    },

    "endpoint-info": {
        "city-forecast": {
            paramFormat: {
                cityCode: "String - City ID (use city search to find)"
            },
            infoSource: "http://servicos.cptec.inpe.br/XML/",
            example: {
                cityCode: "244",
                exampleRequest: "http://servicos.cptec.inpe.br/XML/cidade/244/previsao.xml"
            }
        }
    }
};
