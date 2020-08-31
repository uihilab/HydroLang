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
 * @memberof datasources
 */

export default {
  stations: {
    endpoint:
      "https://opendata.aemet.es/opendata/api/observacion/convencional/datos/estacion/",
    params: {
      idema: null,
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
  },

  //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
  requirements: {
    needProxy: true,
    requireskey: true,
    keyname: "api_key",
    method: "GET",
  },
};
