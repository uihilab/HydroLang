// NOAA API for data retrieval, different application types.
// Note: Different data sources may have different limitations
// 		-> E.g., they may limit the # of queries per unit time
//NOAA requires registration to get TOKEN and must be included in parameters.
// https://www.ncdc.noaa.gov/cdo-web/webservices/v2#data
// Dates in format YYYY-MM-DDThh:mm:ss

export default
{
	"daily-station": {
		"endpoint": "https://opendata.aemet.es/opendata/api/valores/climatologicos/diarios",
		"params": {
			// These are only written to aid users to know
			// what parameters are available
			"fechaIniStr": null,
			"fechaFinStr": null,
			"idema": null,
			// and more...
		}
    },

	/* DATA SOURCE 2 */

	/* DATA SOURCE ... */
}