/**
 * ISRIC SoilGrids
 * Global gridded soil information.
 * Provides WMS and WCS services for soil properties.
 * For more information: https://www.isric.org/explore/soilgrids
 *
 * @type {Object}
 * @name ISRIC
 * @memberof datasources
 */

export default {
    "soil-properties": {
        endpoint: "https://maps.isric.org/mapserv",
        params: {
            map: "/map/{property}.map", // e.g., "soc" (soil organic carbon), "phh2o" (pH)
            service: "WCS",
            version: "2.0.1",
            request: "GetCoverage",
            coverageId: null, // e.g., "soc_0-5cm_mean"
            subset: [],
            format: "image/tiff"
        },
        methods: {
            type: "tiff",
            method: "GET"
        }
    },
    "point-query": {
        endpoint: "https://rest.isric.org/soilgrids/v2.0/properties/query",
        params: {
            lat: null,
            lon: null,
            property: null, // Array or string: ['soc', 'clay']
            depth: null,    // Array or string: ['0-5cm', '5-15cm']
            value: null     // Array or string: ['mean', 'uncertainty']
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
        returnFormats: "tiff, png (WMS)",
        MoreInfo: "https://www.isric.org/explore/soilgrids",
        About: "ISRIC SoilGrids provides global predictions of soil properties at 250m resolution."
    },

    "endpoint-info": {
        "soil-properties": {
            paramFormat: {
                property: "String - Soil property (soc, phh2o, clay, sand, silt, bdod, cfvo, nitrogen)",
                coverageId: "String - Coverage ID (e.g., 'soc_0-5cm_mean')"
            },
            infoSource: "https://www.isric.org/explore/soilgrids/faq-soilgrids",
            example: {
                property: "soc",
                coverageId: "soc_0-5cm_mean",
                exampleRequest: "https://maps.isric.org/mapserv?map=/map/soc.map&service=WCS&version=2.0.1&request=GetCoverage&coverageId=soc_0-5cm_mean&format=image/tiff&subset=Lat(40,41)&subset=Long(-5,-4)"
            }
        }
    }
};
