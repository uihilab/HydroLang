/**
 *  https://www.fema.gov/openfema-dataset-disaster-declarations-summaries-v2
 * This API just returns all disaster declarations for US since 1953
 * -> E.g., they may limit the # of queries per unit time
 * @type {Object}
 * @name FEMA
 * @memberof datasources
 */

export default {
  "disaster-declarations": {
    endpoint: "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries",
    params: {},
    "data-fields": {
      femaDeclarationString: null,
      disasterNumber: null,
      state: null,
      declarationType: null,
      declarationDate: null,
      fyDeclared: null,
      incidentType: null,
      declarationTitle: null,
      ihProgramDeclared: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
  requirements: {
    needProxy: false,
    requireskey: false,
  },
  /* DATA SOURCE 2 */

  /* DATA SOURCE ... */
};
