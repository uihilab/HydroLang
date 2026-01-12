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
        methods: {
            type: "grib2",
            method: "GET",
        },
    },

    // Access to ICON-EU (Europe) model data
    "icon-eu": {
        methods: {
            type: "grib2",
            method: "GET",
        },
    },

    // Access to ICON-D2 (Germany high-resolution) model data
    "icon-d2": {
        methods: {
            type: "grib2",
            method: "GET",
        },
    },

    // MOSMIX Forecasts (Statistical optimization of model output)
    "mosmix": {
        methods: {
            type: "kmz", // Returns KMZ (zipped KML)
            method: "GET",
        },
    },

    // Radar Data (Composite)
    "radar-composite": {
        methods: {
            type: "binary",
            method: "GET",
        },
    },

    requirements: {
        needProxy: true,
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
                parameter: "String - Meteorological parameter (lowercase for directory). Available: alb_rad, alhfl_s, apab_s, ashfl_s, asob_s, asob_s_cs, asob_t, aswdifd_s, aswdifu_s, aswdir_s, athb_s, athb_t, aumfl_s, avmfl_s, cape_con, cape_ml, ceiling, cin_ml, clc, clch, clcl, clcm, clct, clct_mod, cldepth, depth_lk, fi, fr_lake, fr_land, h_ice, h_snow, hbas_con, hhl, hsurf, htop_con, htop_dc, hzerocl, lai, lpi_con_max, mh, omega, p, plcov, pmsl, ps, qc, qi, qv, qv_2m, qv_s, rain_con, rain_gsp, relhum, relhum_2m, rho_snow, rlat, rlon, rootdp, runoff_g, runoff_s, snow_con, snow_gsp, snowlmt, soiltyp, synmsg_bt_cl_ir10.8, synmsg_bt_cl_wv6.2, t, t_2m, t_g, t_ice, t_snow, t_so, tch, tcm, td_2m, tke, tmax_2m, tmin_2m, tot_prec, tqc, tqi, tqr, tqs, tqv, u, u_10m, v, v_10m, vis, vmax_10m, w, w_snow, w_so, w_so_ice, ww, z0",
                parameterUpper: "String - Meteorological parameter (uppercase for filename). e.g. T_2M for t_2m",
                time: "String - Forecast hour (000 to 180)",
                date: "String - Date in YYYYMMDD format",
            },
            infoSource: "https://opendata.dwd.de/weather/nwp/icon/grib/",
            example: {
                run: "00",
                parameter: "t_2m",
                parameterUpper: "T_2M",
                time: "000",
                date: "20231025",
                exampleRequest: "https://opendata.dwd.de/weather/nwp/icon/grib/00/t_2m/icon_global_icosahedral_single-level_2023102500_000_T_2M.grib2.bz2"
            }
        },
        "icon-eu": {
            paramFormat: {
                run: "String - Model run time (00, 06, 12, 18)",
                parameter: "String - Meteorological parameter (e.g., 't_2m')",
                parameterUpper: "String - Meteorological parameter (uppercase for filename). e.g. T_2M for t_2m",
                time: "String - Forecast hour (000 to 120)",
                date: "String - Date in YYYYMMDD format",
            },
            infoSource: "https://opendata.dwd.de/weather/nwp/icon-eu/grib/",
            example: {
                run: "06",
                parameter: "tot_prec",
                parameterUpper: "TOT_PREC",
                time: "001",
                date: "20231025",
                exampleRequest: "https://opendata.dwd.de/weather/nwp/icon-eu/grib/06/tot_prec/icon-eu_europe_regular-lat-lon_single-level_2023102506_001_TOT_PREC.grib2.bz2"
            }
        },
        "icon-d2": {
            paramFormat: {
                run: "String - Model run time (00, 03, 06, ...)",
                parameter: "String - Meteorological parameter (e.g., 't_2m')",
                time: "String - Forecast hour (000 to 048)",
                date: "String - Date in YYYYMMDD format",
            },
            infoSource: "https://opendata.dwd.de/weather/nwp/icon-d2/grib/",
            example: {
                run: "12",
                parameter: "t_2m",
                time: "002",
                date: "20231025",
                exampleRequest: "https://opendata.dwd.de/weather/nwp/icon-d2/grib/12/t_2m/icon-d2_germany_regular-lat-lon_single-level_2023102512_002_2d_t_2m.grib2.bz2"
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
                product: "String - Radar product code (wn, hx, rs, rv, dmax, hg, pg, vii, hymecng)",
                date: "String/Date - Date object or ISO string (e.g. '2025-12-06T04:10:00Z')",
            },
            infoSource: "https://opendata.dwd.de/weather/radar/composite/",
            example: {
                product: "wn",
                date: "2025-12-06T04:10:00Z",
                exampleRequest: "https://opendata.dwd.de/weather/radar/composite/wn/composite_wn_20251206_0410.tar"
            },
            example_hx: {
                product: "hx",
                date: "2025-12-06T04:15:00Z",
                exampleRequest: "https://opendata.dwd.de/weather/radar/composite/hx/composite_hx_20251206_0415-hd5"
            },
            example_pg: {
                product: "pg",
                date: "2025-12-06T04:15:00Z",
                exampleRequest: "https://opendata.dwd.de/weather/radar/composite/pg/PAAH21EDZW060415.buf"
            }
        }
    },

    /**
     * Generates the dynamic endpoint based on the data type and arguments.
     * @param {Object} args - Arguments for the request
     * @param {string} dataType - Type of data requested
     * @returns {string} The constructed URL
     */
    sourceType: (args, dataType) => {
        const baseUrl = "https://opendata.dwd.de/weather";

        if (dataType === "radar-composite") {
            const product = args.product || "wn";
            const date = args.date ? new Date(args.date) : new Date();

            // Helper to pad numbers
            const pad = (n) => String(n).padStart(2, "0");

            const year = date.getUTCFullYear();
            const yy = String(year).slice(2);
            const month = pad(date.getUTCMonth() + 1);
            const day = pad(date.getUTCDate());
            const hour = pad(date.getUTCHours());

            // Round minutes to nearest 5 for radar products
            let minutes = date.getUTCMinutes();
            minutes = Math.floor(minutes / 5) * 5;
            const minute = pad(minutes);

            const yyyymmdd = `${year}${month}${day}`;
            const yymmdd = `${yy}${month}${day}`;
            const hhmm = `${hour}${minute}`;
            const yymmddhhmm = `${yymmdd}${hhmm}`;

            // Product configurations
            const configs = {
                wn: { name: "wn", suffix: ".tar", pattern: "composite" },
                hx: { name: "hx", suffix: "-hd5", pattern: "composite" },
                rs: { name: "rs", suffix: ".tar", pattern: "composite" },
                rv: { prefix: "DE1200_RV", suffix: ".tar.bz2", pattern: "short" },
                dmax: { name: "dmax", suffix: "-hd5", pattern: "composite" },
                hg: { prefix: "HG", suffix: "_000.bz2", pattern: "short" },
                vii: { name: "VII", suffix: "-hd5", pattern: "composite" },
                hymecng: { name: "HymecNG", suffix: "_000-hd5", pattern: "composite" },
                pg: { prefix: "PAAH21EDZW", suffix: ".buf", pattern: "pg" }
            };

            const config = configs[product];
            if (!config) {
                throw new Error(`Unknown radar product: ${product}`);
            }

            let filename = "";
            if (config.pattern === "composite") {
                filename = `composite_${config.name}_${yyyymmdd}_${hhmm}${config.suffix}`;
            } else if (config.pattern === "short") {
                filename = `${config.prefix}${yymmddhhmm}${config.suffix}`;
            } else if (config.pattern === "pg") {
                filename = `${config.prefix}${day}${hhmm}${config.suffix}`;
            }

            return `${baseUrl}/radar/composite/${product}/${filename}`;

        } else if (dataType.startsWith("icon")) {
            const run = args.run || "00";
            const parameter = args.parameter || "t_2m";
            const parameterUpper = args.parameterUpper || parameter.toUpperCase();
            const time = args.time || "000";

            // Handle date: default to today if not provided
            let dateStr = args.date;
            if (!dateStr) {
                const now = new Date();
                const y = now.getUTCFullYear();
                const m = String(now.getUTCMonth() + 1).padStart(2, "0");
                const d = String(now.getUTCDate()).padStart(2, "0");
                dateStr = `${y}${m}${d}`;
            }

            if (dataType === "icon-global") {
                return `${baseUrl}/nwp/icon/grib/${run}/${parameter}/icon_global_icosahedral_single-level_${dateStr}${run}_${time}_${parameterUpper}.grib2.bz2`;
            } else if (dataType === "icon-eu") {
                return `${baseUrl}/nwp/icon-eu/grib/${run}/${parameter}/icon-eu_europe_regular-lat-lon_single-level_${dateStr}${run}_${time}_${parameterUpper}.grib2.bz2`;
            } else if (dataType === "icon-d2") {
                return `${baseUrl}/nwp/icon-d2/grib/${run}/${parameter}/icon-d2_germany_regular-lat-lon_single-level_${dateStr}${run}_${time}_2d_${parameter}.grib2.bz2`;
            }

        } else if (dataType === "mosmix") {
            const station = args.station;
            if (!station) throw new Error("Station ID is required for MOSMIX data.");
            return `${baseUrl}/local_forecasts/mos/MOSMIX_L/single_stations/${station}/kml/MOSMIX_L_LATEST_${station}.kmz`;
        }

        throw new Error(`Unsupported data type: ${dataType}`);
    }
};
