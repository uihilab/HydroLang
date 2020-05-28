// List the data resources here
// Note: Different data sources may have different limitations
// 		-> E.g., they may limit the # of queries per unit time

export default
{
	/* DATA SOURCE 1 */

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

	/* DATA SOURCE 2 */

	/* DATA SOURCE ... */

}