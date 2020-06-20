// AEEMET: API REST from the Spanish Meteorological Service.
// For more information about the service, please visit: 
// https://opendata.aemet.es/dist/index.html?#!/observacion-convencional/Datos_de_observaci%C3%B3n_Tiempo_actual_1
// Note: Different data sources may have different limitations
// 		-> E.g., they may limit the # of queries per unit time
// AEMET requires registration to get KEY and must be included in parameters.
// The API KEY has format 'api_key'.
// https://www.ncdc.noaa.gov/cdo-web/webservices/v2#data
// Dates in format YYYY-MM-DDThh:mm:ss
export default {
    "stations": {
        "endpoint": "https://opendata.aemet.es/opendata/api/observacion/convencional/datos/estacion/",
        "params": {
            "idema": null,
        },
    },

    "daily-station": {
        "endpoint": "https://opendata.aemet.es/opendata/api/valores/climatologicos/diarios/",
        "params": {
            "fechaIniStr": null,
            "fechaFinStr": null,
            "idema": null,
        }
    },

    "needProxy": true,
}