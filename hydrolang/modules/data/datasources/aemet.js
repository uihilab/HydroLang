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
  // --- Observation (Observación Convencional) ---
  stations: {
    endpoint: "https://opendata.aemet.es/opendata/api/observacion/convencional/datos/estacion/",
    params: { idema: null },
    methods: { type: "json", method: "GET" },
  },
  "stations-all": {
    endpoint: "https://opendata.aemet.es/opendata/api/observacion/convencional/todas",
    params: {},
    methods: { type: "json", method: "GET" },
  },
  messages: {
    endpoint: "https://opendata.aemet.es/opendata/api/observacion/convencional/mensajes/tipomensaje/",
    params: { tipomensaje: null },
    methods: { type: "json", method: "GET" },
  },

  // --- Forecasts (Predicciones Específicas) ---
  "forecast-municipality-daily": {
    endpoint: "https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/",
    params: { municipio: null },
    methods: { type: "json", method: "GET" },
  },
  "forecast-municipality-hourly": {
    endpoint: "https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/horaria/",
    params: { municipio: null },
    methods: { type: "json", method: "GET" },
  },
  "forecast-beach": {
    endpoint: "https://opendata.aemet.es/opendata/api/prediccion/especifica/playa/",
    params: { playa: null },
    methods: { type: "json", method: "GET" },
  },
  "forecast-uv": {
    endpoint: "https://opendata.aemet.es/opendata/api/prediccion/especifica/uvi/",
    params: { dia: null },
    methods: { type: "json", method: "GET" },
  },
  "forecast-mountain-area": {
    endpoint: "https://opendata.aemet.es/opendata/api/prediccion/especifica/montaña/pasada/area/",
    params: { area: null },
    methods: { type: "json", method: "GET" },
  },

  // --- Climatology (Valores Climatológicos) ---
  "daily-station": {
    endpoint: "https://opendata.aemet.es/opendata/api/valores/climatologicos/diarios/datos/fechaini/",
    params: { fechaIniStr: null, fechaFinStr: null, idema: null },
    methods: { type: "json", method: "GET" },
  },
  "clima-daily-all": {
    endpoint: "https://opendata.aemet.es/opendata/api/valores/climatologicos/diarios/datos/fechaini/",
    params: { fechaIniStr: null, fechaFinStr: null, suffix: "todasestaciones" }, // suffix handled in logic or manual URL construction
    methods: { type: "json", method: "GET" },
  },
  "clima-inventory-station": {
    endpoint: "https://opendata.aemet.es/opendata/api/valores/climatologicos/inventarioestaciones/estaciones/",
    params: { estaciones: null },
    methods: { type: "json", method: "GET" },
  },
  "clima-inventory-all": {
    endpoint: "https://opendata.aemet.es/opendata/api/valores/climatologicos/inventarioestaciones/todasestaciones",
    params: {},
    methods: { type: "json", method: "GET" },
  },
  "clima-monthly-annual": {
    endpoint: "https://opendata.aemet.es/opendata/api/valores/climatologicos/mensualesanuales/datos/anioini/",
    params: { anioIniStr: null, anioFinStr: null, idema: null },
    methods: { type: "json", method: "GET" },
  },
  "clima-normals": {
    endpoint: "https://opendata.aemet.es/opendata/api/valores/climatologicos/normales/estacion/",
    params: { idema: null },
    methods: { type: "json", method: "GET" },
  },
  "clima-extremes": {
    endpoint: "https://opendata.aemet.es/opendata/api/valores/climatologicos/valoresextremos/parametro/",
    params: { parametro: null, idema: null },
    methods: { type: "json", method: "GET" },
  },

  // --- Satellite (Información Satélite) ---
  "sat-ndvi": {
    endpoint: "https://opendata.aemet.es/opendata/api/satelites/producto/nvdi",
    params: {},
    methods: { type: "json", method: "GET" },
  },
  "sat-sst": {
    endpoint: "https://opendata.aemet.es/opendata/api/satelites/producto/sst",
    params: {},
    methods: { type: "json", method: "GET" },
  },

  // --- Maps & Graphs (Mapas y Gráficos) ---
  "map-analysis": {
    endpoint: "https://opendata.aemet.es/opendata/api/mapasygraficos/analisis",
    params: {},
    methods: { type: "json", method: "GET" },
  },
  "map-significant": {
    endpoint: "https://opendata.aemet.es/opendata/api/mapasygraficos/mapassignificativos/fecha/",
    params: { fecha: null, ambito: null, dia: null },
    methods: { type: "json", method: "GET" },
  },

  // --- Master Data (Maestro) ---
  "master-municipality": {
    endpoint: "https://opendata.aemet.es/opendata/api/maestro/municipio/",
    params: { municipio: null },
    methods: { type: "json", method: "GET" },
  },
  "master-municipalities": {
    endpoint: "https://opendata.aemet.es/opendata/api/maestro/municipios",
    params: {},
    methods: { type: "json", method: "GET" },
  },

  // --- Climate Products (Productos Climatológicos) ---
  "product-water-balance": {
    endpoint: "https://opendata.aemet.es/opendata/api/productos/climatologicos/balancehidrico/",
    params: { anio: null, decena: null },
    methods: { type: "json", method: "GET" },
  },
  "product-climate-summary": {
    endpoint: "https://opendata.aemet.es/opendata/api/productos/climatologicos/resumenclimatologico/nacional/",
    params: { anio: null, mes: null },
    methods: { type: "json", method: "GET" },
  },

  // --- Configuration ---
  requirements: {
    needProxy: true,
    requireskey: true,
    keyname: "api_key",
  },
  info: {
    returnFormats: "json",
    MoreInfo: "https://opendata.aemet.es/dist/index.html",
    About: "AEMET: API REST from the Spanish Meteorological Service. Requires API key."
  },
  "endpoint-info": {
    stations: {
      paramFormat: { idema: "String - Station identifier (e.g., '3195')" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/observacion-convencional/Datos_de_observaci%C3%B3n_Tiempo_actual_1",
      example: { idema: "3195" }
    },
    "stations-all": {
      paramFormat: {},
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/observacion-convencional/Datos_de_observaci%C3%B3n_Tiempo_actual_1",
      example: {}
    },
    messages: {
      paramFormat: { tipomensaje: "String - Message type (e.g., 'synop', 'temp', 'climat')" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/observacion-convencional/Mensajes_de_observaci%C3%B3n_1",
      example: { tipomensaje: "synop" }
    },
    "forecast-municipality-daily": {
      paramFormat: { municipio: "String - Municipality code (e.g., '28079' for Madrid)" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/predicciones-especificas/Predicci_n_por_municipios_diaria_1",
      example: { municipio: "28079" }
    },
    "forecast-municipality-hourly": {
      paramFormat: { municipio: "String - Municipality code (e.g., '28079')" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/predicciones-especificas/Predicci_n_por_municipios_horaria_1",
      example: { municipio: "28079" }
    },
    "forecast-beach": {
      paramFormat: { playa: "String - Beach code (e.g., '1100101')" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/predicciones-especificas/Predicci_n_mar_tima_de_playas_1",
      example: { playa: "1100101" }
    },
    "forecast-uv": {
      paramFormat: { dia: "Integer - Day offset (0=today, 1=tomorrow, etc.)" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/predicciones-especificas/Predicci_n_de_radiaci_n_ultravioleta_UVI_1",
      example: { dia: "0" }
    },
    "forecast-mountain-area": {
      paramFormat: { area: "String - Mountain area code (e.g., 'py1' for Pirineo Aragonés)" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/predicciones-especificas/Predicci_n_de_monta_a_pasada_1",
      example: { area: "py1" }
    },
    "daily-station": {
      paramFormat: {
        fechaIniStr: "String - Start date (YYYY-MM-DDTHH:MM:SSUTC)",
        fechaFinStr: "String - End date (YYYY-MM-DDTHH:MM:SSUTC)",
        idema: "String - Station ID"
      },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/valores-climatologicos/Climatolog_as_diarias_1",
      example: { fechaIniStr: "2020-01-01T00:00:00UTC", fechaFinStr: "2020-01-31T23:59:59UTC", idema: "3195" }
    },
    "clima-daily-all": {
      paramFormat: {
        fechaIniStr: "String - Start date (YYYY-MM-DDTHH:MM:SSUTC)",
        fechaFinStr: "String - End date (YYYY-MM-DDTHH:MM:SSUTC)"
      },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/valores-climatologicos/Climatolog_as_diarias_1",
      example: { fechaIniStr: "2020-01-01T00:00:00UTC", fechaFinStr: "2020-01-02T23:59:59UTC" }
    },
    "clima-inventory-station": {
      paramFormat: { estaciones: "String - Station ID" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/valores-climatologicos/Inventario_de_estaciones_1",
      example: { estaciones: "3195" }
    },
    "clima-inventory-all": {
      paramFormat: {},
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/valores-climatologicos/Inventario_de_estaciones_1",
      example: {}
    },
    "clima-monthly-annual": {
      paramFormat: {
        anioIniStr: "String - Start Year (YYYY)",
        anioFinStr: "String - End Year (YYYY)",
        idema: "String - Station ID"
      },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/valores-climatologicos/Climatolog_as_mensuales_anuales_1",
      example: { anioIniStr: "2015", anioFinStr: "2020", idema: "3195" }
    },
    "clima-normals": {
      paramFormat: { idema: "String - Station ID" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/valores-climatologicos/Valores_normales_1",
      example: { idema: "3195" }
    },
    "clima-extremes": {
      paramFormat: { parametro: "String - Parameter (P, T, V)", idema: "String - Station ID" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/valores-climatologicos/Valores_extremos_1",
      example: { parametro: "T", idema: "3195" }
    },
    "sat-ndvi": {
      paramFormat: {},
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/informacion-satelite/Producto_NDVI_1",
      example: {}
    },
    "sat-sst": {
      paramFormat: {},
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/informacion-satelite/Producto_SST_1",
      example: {}
    },
    "map-analysis": {
      paramFormat: {},
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/mapas-y-graficos/Mapas_de_an_lisis_1",
      example: {}
    },
    "map-significant": {
      paramFormat: {
        fecha: "String - Date (YYYY-MM-DD)",
        ambito: "String - Scope (esp, eur)",
        dia: "String - Day offset (a, b, c...)"
      },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/mapas-y-graficos/Mapas_significativos_1",
      example: { fecha: "2024-01-01", ambito: "esp", dia: "a" }
    },
    "master-municipality": {
      paramFormat: { municipio: "String - Municipality ID" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/maestro/Municipios_1",
      example: { municipio: "28079" }
    },
    "master-municipalities": {
      paramFormat: {},
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/maestro/Municipios_1",
      example: {}
    },
    "product-water-balance": {
      paramFormat: { anio: "String - Year", decena: "String - Decad (01-36)" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/productos-climatologicos/Balance_h_drico_nacional_por_decenas_1",
      example: { anio: "2024", decena: "01" }
    },
    "product-climate-summary": {
      paramFormat: { anio: "String - Year", mes: "String - Month (01-12)" },
      infoSource: "https://opendata.aemet.es/dist/index.html?#!/productos-climatologicos/Resumen_climatol_gico_mensual_nacional_1",
      example: { anio: "2024", mes: "01" }
    }
  }
};
