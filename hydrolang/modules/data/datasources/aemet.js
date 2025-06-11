/**
 * AEMET: API REST from the Spanish Meteorological Service.
 * For more information about the service, please visit:
 * https://opendata.aemet.es/dist/index.html?#!/observacion-convencional/Datos_de_observaci%C3%B3n_Tiempo_actual_1
 * Note: Different data sources may have different limitations
 * -> E.g., they may limit the # of queries per unit time
 * AEMET requires registration to get KEY and must be included in parameters.
 * The API KEY has format 'api_key'.
 * Dates in format YYYY-MM-DDThh:mm:ss
 * @type {Object}
 * @name AEMET
 * @memberof datasources
 */

export default {
  stations: {
    endpoint:
      "https://opendata.aemet.es/opendata/api/observacion/convencional/datos/estacion/",
    params: {
      idema: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  "daily-station": {
    endpoint:
      "https://opendata.aemet.es/opendata/api/valores/climatologicos/diarios/",
    params: {
      fechaIniStr: null,
      fechaFinStr: null,
      idema: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  // Adding new endpoint for municipal forecasts
  "forecast-location": {
    endpoint:
      "https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/",
    params: {
      municipio: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
  requirements: {
    needProxy: true,
    requireskey: true,
    keyname: "api_key",
  },
  info: {
    returnFormats: "json",
    MoreInfo: "https://opendata.aemet.es/dist/index.html?#!/observacion-convencional/Datos_de_observaci%C3%B3n_Tiempo_actual_1",
    About: "AEMET: API REST from the Spanish Meteorological Service. AEMET requires registration to get KEY and must be included in parameters."
  },
  "endpoint-info": {
    stations: {
      paramFormat: {
        idema: "String - Station identifier (e.g., '3195')"
      },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/observacion-convencional/Datos_de_observaci%C3%B3n_Tiempo_actual_1",
      example: {
        idema: "3195",
        exampleRequest: "https://opendata.aemet.es/opendata/api/valores/climatologicos/inventarioestaciones/todasestaciones/?idema=3195"
      }
    },
    "daily-station": {
      paramFormat: {
        fechaIniStr: "String - Start date (YYYY-MM-DD format)",
        fechaFinStr: "String - End date (YYYY-MM-DD format)",
        idema: "String - Station identifier (e.g., '3195')"
      },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/valores-climatologicos/Climatolog_as_diarias_1",
      example: {
        fechaIniStr: "2020-01-01T00:00:00UTC",
        fechaFinStr: "2020-01-31T23:59:59UTC",
        idema: "3195",
        exampleRequest: "https://opendata.aemet.es/opendata/api/valores/climatologicos/diarios/datos/fechaini/2020-01-01T00:00:00UTC/fechafin/2020-01-31T23:59:59UTC/estacion/3195/"
      }
    },
    // Adding a new endpoint for weather forecasts by location
    "forecast-location": {
      endpoint: "https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/",
      paramFormat: {
        municipio: "String - Municipality code (e.g., '28079')"
      },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/predicciones-especificas/Predicci_n_por_municipios_diaria_1",
      example: {
        municipio: "28079",
        exampleRequest: "https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/28079"
      }
    }
  }
};
