/**
 * TAMSAT (Tropical Applications of Meteorology using SATellite data) and ground-based observations
 * Provides daily rainfall estimates for Africa.
 * For more information: http://www.tamsat.org.uk/
 *
 * @type {Object}
 * @name TAMSAT
 * @memberof datasources
 */

export default {
    "rainfall-estimate": {
        endpoint: "https://www.tamsat.org.uk/public_data/data/v3.1/daily/",
        params: {
            year: null,
            month: null,
            day: null,
            format: "nc" // NetCDF is the standard format
        },
        methods: {
            type: "netcdf",
            method: "GET"
        }
    },

    requirements: {
        needProxy: true,
        requireskey: false,
    },

    info: {
        returnFormats: "netcdf",
        MoreInfo: "http://www.tamsat.org.uk/",
        About: "TAMSAT provides daily rainfall estimates for Africa based on Meteosat thermal infrared imagery calibrated against ground-based rain gauge data."
    },

    "endpoint-info": {
        "rainfall-estimate": {
            paramFormat: {
                year: "String - Year (YYYY)",
                month: "String - Month (MM)",
                day: "String - Day (DD)",
                format: "String - File format (default: 'nc')"
            },
            infoSource: "http://www.tamsat.org.uk/data/rfe/",
            example: {
                year: "2023",
                month: "01",
                day: "01",
                exampleRequest: "https://www.tamsat.org.uk/public_data/data/v3.1/daily/2023/01/rfe2023_01_01.v3.1.nc"
            }
        }
    }
};
