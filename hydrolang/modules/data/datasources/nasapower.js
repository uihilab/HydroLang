/**
 * NASA POWER (Prediction of Worldwide Energy Resource) API
 * This API provides global meteorology and solar energy data including temperature, precipitation,
 * humidity, solar energy, and more for agricultural, renewable energy, and sustainable building design.
 *
 * **Data Information:**
 * - **Source:** NASA Langley Research Center
 * - **Coverage:** Global
 * - **Resolution:** 0.5° x 0.5° (Meteorology), 1.0° x 1.0° (Solar)
 * - **Data Types:** Daily, Monthly, Climatology
 *
 * **Available Data Types:**
 * - `point-data`: Time series for a single location.
 * - `regional-data`: Data for a defined bounding box.
 * - `global-data`: Global monthly averages.
 * - `climatology`: Long-term averages.
 *
 * **Key Parameters:**
 * - `parameters`: Comma-separated list (e.g., "T2M,PRECTOTCORR")
 * - `community`: "ag" (Agroclimatology), "re" (Renewable Energy), "sb" (Sustainable Buildings)
 * - `start` / `end`: YYYYMMDD format
 *
 * @example
 * // 1. Retrieve Daily Temperature and Precipitation for a Point
 * const powerData = await hydro.data.retrieve({
 *   params: {
 *     source: 'nasapower',
 *     datatype: 'point-data'
 *   },
 *   args: {
 *     parameters: 'T2M,PRECTOTCORR',
 *     community: 'ag',
 *     longitude: -76.3,
 *     latitude: 38.5,
 *     start: '20230101',
 *     end: '20230110',
 *     format: 'JSON'
 *   }
 * });
 *
 * @see https://power.larc.nasa.gov/docs/services/api/
 * @type {Object}
 * @name NASAPOWER
 * @memberof datasources
 */

export default {
  // Point data query for a specific lat/lon
  "point-data": {
    endpoint: "https://power.larc.nasa.gov/api/temporal/daily/point",
    params: {
      parameters: null,
      community: null,
      longitude: null,
      latitude: null,
      start: null,
      end: null,
      format: null,
      header: null
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Regional data query for an area
  "regional-data": {
    endpoint: "https://power.larc.nasa.gov/api/temporal/daily/regional",
    params: {
      parameters: null,
      community: null,
      "longitude_min": null,
      "longitude_max": null,
      "latitude_min": null,
      "latitude_max": null,
      start: null,
      end: null,
      format: null,
      header: null
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Global data query
  "global-data": {
    endpoint: "https://power.larc.nasa.gov/api/temporal/monthly/global",
    params: {
      parameters: null,
      community: null,
      start: null,
      end: null,
      format: null,
      header: null
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Get climatology data for a point
  "climatology": {
    endpoint: "https://power.larc.nasa.gov/api/temporal/climatology/point",
    params: {
      parameters: null,
      community: null,
      longitude: null,
      latitude: null,
      format: null,
      header: null
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  requirements: {
    needProxy: true,
    requireskey: false,
  },

  info: {
    returnFormats: "json, csv, netcdf, geotiff",
    MoreInfo: "https://power.larc.nasa.gov/docs/services/api/",
    About: "NASA POWER (Prediction of Worldwide Energy Resource) API provides global meteorology and solar energy data for multiple applications."
  },

  "endpoint-info": {
    "point-data": {
      paramFormat: {
        parameters: "String - Comma-separated list of parameters (e.g., 'T2M,PRECTOTCORR,RH2M')",
        community: "String - User community ('ag' for agricultural, 're' for renewable energy, 'sb' for sustainable buildings)",
        longitude: "Number - Longitude coordinate",
        latitude: "Number - Latitude coordinate",
        start: "String - Start date (YYYYMMDD format)",
        end: "String - End date (YYYYMMDD format)",
        format: "String - Response format ('JSON', 'CSV', 'NETCDF')",
        header: "Boolean - Include header in response (true/false)"
      },
      infoSource: "https://power.larc.nasa.gov/docs/services/api/temporal/daily/point/",
      example: {
        parameters: "T2M,PRECTOTCORR,RH2M",
        community: "re",
        longitude: -76.3,
        latitude: 38.5,
        start: "20200101",
        end: "20200131",
        format: "JSON",
        exampleRequest: "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,RH2M&community=re&longitude=-76.3&latitude=38.5&start=20200101&end=20200131&format=JSON"
      }
    },
    "regional-data": {
      paramFormat: {
        parameters: "String - Comma-separated list of parameters (e.g., 'T2M,PRECTOTCORR,RH2M')",
        community: "String - User community ('ag' for agricultural, 're' for renewable energy, 'sb' for sustainable buildings)",
        "longitude_min": "Number - Minimum longitude coordinate",
        "longitude_max": "Number - Maximum longitude coordinate",
        "latitude_min": "Number - Minimum latitude coordinate",
        "latitude_max": "Number - Maximum latitude coordinate",
        start: "String - Start date (YYYYMMDD format)",
        end: "String - End date (YYYYMMDD format)",
        format: "String - Response format ('JSON', 'CSV', 'NETCDF', 'GEOTIFF')",
        header: "Boolean - Include header in response (true/false)"
      },
      infoSource: "https://power.larc.nasa.gov/docs/services/api/temporal/daily/regional/",
      example: {
        parameters: "T2M",
        community: "re",
        longitude_min: -76.5,
        longitude_max: -76.0,
        latitude_min: 38.0,
        latitude_max: 39.0,
        start: "20200101",
        end: "20200107",
        format: "GEOTIFF",
        exampleRequest: "https://power.larc.nasa.gov/api/temporal/daily/regional?parameters=T2M&community=re&longitude-min=-76.5&longitude-max=-76.0&latitude-min=38.0&latitude-max=39.0&start=20200101&end=20200107&format=GEOTIFF"
      }
    },
    "global-data": {
      paramFormat: {
        parameters: "String - Comma-separated list of parameters (e.g., 'T2M,PRECTOTCORR')",
        community: "String - User community ('ag' for agricultural, 're' for renewable energy, 'sb' for sustainable buildings)",
        start: "String - Start date (YYYYMM format)",
        end: "String - End date (YYYYMM format)",
        format: "String - Response format ('JSON', 'CSV', 'NETCDF')",
        header: "Boolean - Include header in response (true/false)"
      },
      infoSource: "https://power.larc.nasa.gov/docs/services/api/temporal/monthly/global/",
      example: {
        parameters: "T2M,PRECTOTCORR",
        community: "re",
        start: "202001",
        end: "202012",
        format: "JSON",
        exampleRequest: "https://power.larc.nasa.gov/api/temporal/monthly/global?parameters=T2M,PRECTOTCORR&community=re&start=202001&end=202012&format=JSON"
      }
    },
    "climatology": {
      paramFormat: {
        parameters: "String - Comma-separated list of parameters (e.g., 'T2M,PRECTOTCORR,RH2M')",
        community: "String - User community ('ag' for agricultural, 're' for renewable energy, 'sb' for sustainable buildings)",
        longitude: "Number - Longitude coordinate",
        latitude: "Number - Latitude coordinate",
        format: "String - Response format ('JSON', 'CSV')",
        header: "Boolean - Include header in response (true/false)"
      },
      infoSource: "https://power.larc.nasa.gov/docs/services/api/temporal/climatology/point/",
      example: {
        parameters: "T2M,PRECTOTCORR",
        community: "re",
        longitude: -76.3,
        latitude: 38.5,
        format: "JSON",
        exampleRequest: "https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,PRECTOTCORR&community=re&longitude=-76.3&latitude=38.5&format=JSON"
      }
    }
  }
}; 