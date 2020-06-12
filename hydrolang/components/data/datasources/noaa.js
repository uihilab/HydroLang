// NOAA API for data retrieval, different application types.
// Note: Different data sources may have different limitations
// 		-> E.g., they may limit the # of queries per unit time
//NOAA requires registration to get TOKEN and must be included in parameters.
// https://www.ncdc.noaa.gov/cdo-web/webservices/v2#data
// Dates in format YYYY-MM-DDThh:mm:ss

export default
{
	"prec-15min": {
		"endpoint": "https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=PRECIP_15",
		"params": {
			// These are only written to aid users to know
			// what parameters are available
			"locationid": null,
			"stationid": null,
			"startdate": null,
			"enddate": null,
			"units": null,
			"limit": null,
            "offset": null,
            "includemetadata": false
			// and more...
		}
    },

    "prec-hourly": {
		"endpoint": "https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=PRECIP_HLY",
		"params": {
			// These are only written to aid users to know
			// what parameters are available
			"locationid": null,
			"stationid": null,
			"startdate": null,
			"enddate": null,
			"units": null,
			"limit": null,
            "offset": null,
            "includemetadata": false
			// and more...
		}
    }

	/* DATA SOURCE 2 */

	/* DATA SOURCE ... */
}