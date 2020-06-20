// List the data resources here
// Note: Different data sources may have different limitations
// 		-> E.g., they may limit the # of queries per unit time
export default {
    /* DATA SOURCE 1 */

    // https://waterservices.usgs.gov/rest/IV-Service.html
    // This API returns stream stages for US
    "instant-values": {
        "endpoint": "http://waterservices.usgs.gov/nwis/iv/",
        "params": {
            // These are only written to aid users to know
            // what parameters are available
            "format": null,
            "site": null,
            "stateCd": null,
            "huc": null,
            "countyCd": null,
            "startDT": null,
            "endDT": null,
            // and more...
        },
        "data-fields": {
            // "output-data-field-1": null,
            // enter data field here
        }
    },

    "daily-values": {
        "endpoint": "http://waterservices.usgs.gov/nwis/dv/",
        "params": {
            // These are only written to aid users to know
            // what parameters are available
            "format": null,
            "site": null,
            "stateCd": null,
            "huc": null,
            "countyCd": null,
            "startDT": null,
            "endDT": null,
            // and more...
        },
        "data-fields": {
            // "output-data-field-1": null,
            // enter data field here
        }
    },

    "needProxy": true,

    /* DATA SOURCE 2 */

    /* DATA SOURCE ... */
}