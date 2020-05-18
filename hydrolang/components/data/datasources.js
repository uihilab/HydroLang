export default
{
	// List the data resources here
	// Note: Different data sources may have different limitations
	// 		-> E.g., they may limit the # of queries per unit time

	"usgs": {
		// https://waterservices.usgs.gov/rest/IV-Service.html
		// This API returns stream stages for US
		"water-data": {
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
		}
	},

	"fema": {
		// https://www.fema.gov/openfema-dataset-disaster-declarations-summaries-v2
		// This API just returns all disaster declarations for US since 1953
		"disaster-declarations": {
			"endpoint": "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries",
			"params": {},
			"data-fields": {
				"femaDeclarationString": null,
				"disasterNumber": null,
				"state": null,
				"declarationType": null,
				"declarationDate": null,
				"fyDeclared": null,
				"incidentType": null,
				"declarationTitle": null,
				"ihProgramDeclared": null,
			}
		}
	},


	"custom": {
	}

}