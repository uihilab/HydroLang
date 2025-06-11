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

  // Adding new endpoint for Public Assistance Funded Projects
  "pa-funded-projects": {
    endpoint: "https://www.fema.gov/api/open/v2/PublicAssistanceFundedProjectsDetails",
    params: {
      state: null,
      disasterNumber: null,
      countyCode: null,
      projectType: null
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
  info: {
    returnFormats: "json",
    MoreInfo: "https://www.fema.gov/openfema-dataset-disaster-declarations-summaries-v2",
    About: "This API returns all disaster declarations for US since 1953"
  },
  "endpoint-info": {
    "disaster-declarations": {
      paramFormat: {
        // OpenFEMA API supports additional filtering parameters that can be added
        state: "String - State abbreviation (e.g., 'CA')",
        declarationType: "String - Type of declaration (e.g., 'DR', 'EM', 'FM')",
        incidentType: "String - Type of incident (e.g., 'Flood', 'Hurricane')",
        declarationDate: "String - Date of declaration (YYYY-MM-DD)",
        fyDeclared: "Number - Fiscal year of declaration"
      },
      infoSource: "https://www.fema.gov/about/openfema/api",
      example: "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?state=CA&$orderby=declarationDate%20desc&$top=10"
    },
    // Adding a new endpoint for FEMA Public Assistance Funded Projects
    "pa-funded-projects": {
      endpoint: "https://www.fema.gov/api/open/v2/PublicAssistanceFundedProjectsDetails",
      paramFormat: {
        state: "String - State abbreviation (e.g., 'CA')",
        disasterNumber: "String - Disaster number",
        countyCode: "String - County code",
        projectType: "String - Type of project"
      },
      infoSource: "https://www.fema.gov/about/openfema/api",
      example: "https://www.fema.gov/api/open/v2/PublicAssistanceFundedProjectsDetails?state=CA&$orderby=disasterNumber%20desc&$top=10"
    }
  },
  /* DATA SOURCE 2 */

  /* DATA SOURCE ... */
};
