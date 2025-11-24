/**
 * Deutscher Wetterdienst (DWD): Open Data Server for Germany.
 * Provides access to ICON model data, MOSMIX forecasts, and Radar data.
 * For more information, visit: https://opendata.dwd.de/
 *
 * @type {Object}
 * @name DWD
 * @memberof datasources
 */

export default {
    // Access to ICON Global model data
    "icon-global": {
        endpoint: "https://opendata.dwd.de/weather/nwp/icon/grib/",
        params: {
            run: null, // e.g., "00", "06", "12", "18"
            parameter: null, // e.g., "t_2m", "pmsl"
            time: null, // Forecast hour, e.g., "000", "001"
        },
        methods: {
            type: "grib2",
            method: "GET",
        },
    },

    // Access to ICON-EU (Europe) model data
    "icon-eu": {
        endpoint: "https://opendata.dwd.de/weather/nwp/icon-eu/grib/",
        params: {
            run: null,
            parameter: null,
            time: null,
        },
        methods: {
            type: "grib2",
            method: "GET",
        },
    },

    // Access to ICON-D2 (Germany high-resolution) model data
    "icon-d2": {
        endpoint: "https://opendata.dwd.de/weather/nwp/icon-d2/grib/",
        params: {
            run: null,
            parameter: null,
            time: null,
        },
        methods: {
            type: "grib2",
            method: "GET",
        },
    },

    // MOSMIX Forecasts (Statistical optimization of model output)
    "mosmix": {
        endpoint: "https://opendata.dwd.de/weather/local_forecasts/mos/MOSMIX_L/single_stations/{station}/kml/MOSMIX_L_LATEST_{station}.kmz",
        params: {
            station: null, // e.g., "10382" (Berlin-Tegel)
        },
        methods: {
            type: "kmz", // Returns KMZ (zipped KML)
            method: "GET",
        },
    },

    // Radar Data (Composite)
    "radar-composite": {
        endpoint: "https://opendata.dwd.de/weather/radar/composit/{product}/",
        params: {
            product: null, // e.g., "fx" (Reflectivity), "wn" (Precipitation)
        },
        methods: {
            type: "binary",
            method: "GET",
        },
    },

    requirements: {
        needProxy: false,
        requireskey: false,
    },

    info: {
        returnFormats: "grib2, netcdf, kmz, binary",
        MoreInfo: "https://opendata.dwd.de/readme.txt",
        About: "Deutscher Wetterdienst (DWD) Open Data Server. Provides raw model data (ICON), MOSMIX forecasts, and Radar composites.",
    },

    "endpoint-info": {
        "icon-global": {
            paramFormat: {
                run: "String - Model run time (00, 06, 12, 18)",
                parameter: "String - Meteorological parameter (e.g., 't_2m', 'tot_prec')",
                time: "String - Forecast hour (000 to 180)",
            },
            infoSource: "https://opendata.dwd.de/weather/nwp/icon/grib/",
            example: {
                run: "00",
                parameter: "t_2m",
                time: "000",
                exampleRequest: "https://opendata.dwd.de/weather/nwp/icon/grib/00/t_2m/icon_global_icosahedral_single-level_2023102500_000_t_2m.grib2.bz2"
            }
        },
        "icon-eu": {
            paramFormat: {
                run: "String - Model run time (00, 06, 12, 18)",
                parameter: "String - Meteorological parameter (e.g., 't_2m')",
                time: "String - Forecast hour (000 to 120)",
            },
            infoSource: "https://opendata.dwd.de/weather/nwp/icon-eu/grib/",
            example: {
                run: "06",
                parameter: "t_2m",
                time: "001",
                exampleRequest: "https://opendata.dwd.de/weather/nwp/icon-eu/grib/06/t_2m/icon-eu_europe_regular-lat-lon_single-level_2023102506_001_t_2m.grib2.bz2"
            }
        },
        "icon-d2": {
            paramFormat: {
                run: "String - Model run time (00, 03, 06, ...)",
                parameter: "String - Meteorological parameter (e.g., 't_2m')",
                time: "String - Forecast hour (000 to 048)",
            },
            infoSource: "https://opendata.dwd.de/weather/nwp/icon-d2/grib/",
            example: {
                run: "12",
                parameter: "t_2m",
                time: "002",
                exampleRequest: "https://opendata.dwd.de/weather/nwp/icon-d2/grib/12/t_2m/icon-d2_germany_regular-lat-lon_single-level_2023102512_002_t_2m.grib2.bz2"
            }
        },
        "mosmix": {
            paramFormat: {
                station: "String - Station ID (e.g., '10382' for Berlin-Tegel)",
            },
            infoSource: "https://opendata.dwd.de/weather/local_forecasts/mos/",
            example: {
                station: "10382",
                exampleRequest: "https://opendata.dwd.de/weather/local_forecasts/mos/MOSMIX_L/single_stations/10382/kml/MOSMIX_L_LATEST_10382.kmz"
            }
        },
        "radar-composite": {
            paramFormat: {
                product: "String - Radar product code (e.g., 'fx' for reflectivity, 'wn' for precipitation)",
            },
            infoSource: "https://opendata.dwd.de/weather/radar/composit/",
            example: {
                product: "fx",
                exampleRequest: "https://opendata.dwd.de/weather/radar/composit/fx/FX_LATEST.tar.bz2"
            }
        }
    },
};
