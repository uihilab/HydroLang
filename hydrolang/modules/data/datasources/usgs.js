/**
 * USGS Water Services (NWIS) datasource
 * Provides access to water data for the United States, including streamflow, groundwater, and water quality.
 *
 * **Data Information:**
 * - **Source:** USGS National Water Information System (NWIS)
 * - **Services:** Instant Values (IV), Daily Values (DV), Groundwater, Water Quality, Site Info
 *
 * **Available Data Types:**
 * - `instant-values`: Real-time/Instantaneous data (e.g., streamflow every 15 min).
 * - `daily-values`: Daily aggregated data (e.g., daily mean discharge).
 * - `groundwater`: Groundwater levels.
 * - `water-quality`: Discrete water quality samples.
 * - `site-information`: Metadata about measurement sites.
 *
 * **Key Parameters:**
 * - `site`: USGS Site Number (e.g., "05454500")
 * - `startDT` / `endDT`: Start and End dates (YYYY-MM-DD)
 * - `parameterCd`: (Implicit in some requests, 00060=Discharge, 00065=Gage Height)
 *
 * @example
 * // 1. Retrieve Instantaneous Streamflow (IV)
 * const flowData = await hydro.data.retrieve({
 *   params: {
 *     source: 'usgs',
 *     datatype: 'instant-values'
 *   },
 *   args: {
 *     format: 'json',
 *     sites: '05454500', // Iowa River at Iowa City
 *     startDT: '2023-01-01',
 *     endDT: '2023-01-07'
 *   }
 * });
 *
 * @example
 * // 2. Retrieve Daily Mean Values (DV)
 * const dailyData = await hydro.data.retrieve({
 *   params: {
 *     source: 'usgs',
 *     datatype: 'daily-values'
 *   },
 *   args: {
 *     format: 'json',
 *     sites: '05454500',
 *     startDT: '2020-01-01',
 *     endDT: '2020-12-31' // Full year
 *   }
 * });
 *
 * @example
 * // 3. Retrieve Site Information
 * const siteMeta = await hydro.data.retrieve({
 *   params: {
 *     source: 'usgs',
 *     datatype: 'site-information'
 *   },
 *   args: {
 *     format: 'rdb',
 *     sites: '05454500',
 *     siteOutput: 'expanded'
 *   }
 * });
 *
 * @see https://waterservices.usgs.gov/
 * @type {Object}
 * @name USGS
 * @memberof datasources
 */

export default {
  "instant-values": {
    endpoint: "http://waterservices.usgs.gov/nwis/iv/",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      format: null,
      site: null,
      stateCd: null,
      huc: null,
      countyCd: null,
      startDT: null,
      endDT: null,
      // and more...
    },
    "data-fields": {
      // "output-data-field-1": null,
      // enter data field here
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  "daily-values": {
    endpoint: "http://waterservices.usgs.gov/nwis/dv/",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      format: null,
      site: null,
      stateCd: null,
      huc: null,
      countyCd: null,
      startDT: null,
      endDT: null,
      // and more...
    },
    "data-fields": {
      // "output-data-field-1": null,
      // enter data field here
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  "groundwater": {
    endpoint: "http://waterservices.usgs.gov/nwis/gwlevels/",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      format: null,
      site: null,
      stateCd: null,
      huc: null,
      countyCd: null,
      startDT: null,
      endDT: null,
      // and more...
    },
    "data-fields": {
      // "output-data-field-1": null,
      // enter data field here
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  "site-information": {
    endpoint: "https://waterservices.usgs.gov/nwis/site/",
    params: {
      format: null,
      sites: null,
      stateCd: null,
      huc: null,
      bBox: null,
      countyCd: null,
      siteType: null,
      hasDataTypeCd: null
    },
    "data-fields": {
      // enter data field here
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  "water-quality": {
    endpoint: "https://nwis.waterdata.usgs.gov/nwis/qwdata",
    params: {
      search_site_no: null,
      site_tp_cd: null,
      huc: null,
      format: null,
      sample_media: null,
      begin_date: null,
      end_date: null,
      column_name: null
    },
    "data-fields": {
      // enter data field here
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  "water-use": {
    endpoint: "https://waterdata.usgs.gov/nwis/water_use",
    params: {
      format: null,
      stateCd: null,
      countyCd: null,
      year: null,
      category: null,
      wu_area: null,
      wu_county: null,
      wu_year: null
    },
    "data-fields": {
      // enter data field here
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
    returnFormats: "json",
    MoreInfo: "https://waterservices.usgs.gov/rest/IV-Service.html",
    About: "This API returns stream stages for US"
  },

  "endpoint-info": {
    "instant-values": {
      paramFormat: {
        format: "String - Response format (json, waterml, etc.)",
        site: "String - Site number(s), comma-separated",
        stateCd: "String - State code (e.g., 'ia' for Iowa)",
        huc: "String - Hydrologic Unit Code",
        countyCd: "String - County code",
        startDT: "String - Start date (YYYY-MM-DD format)",
        endDT: "String - End date (YYYY-MM-DD format)"
      },
      infoSource: "https://waterservices.usgs.gov/rest/IV-Service.html",
      example: {
        format: "json",
        sites: "05454500",
        startDT: "2020-01-01",
        endDT: "2020-01-07",
        exampleRequest: "http://waterservices.usgs.gov/nwis/iv/?format=json&sites=05454500&startDT=2020-01-01&endDT=2020-01-07"
      }
    },
    "daily-values": {
      paramFormat: {
        format: "String - Response format (json, waterml, etc.)",
        site: "String - Site number(s), comma-separated",
        stateCd: "String - State code (e.g., 'ia' for Iowa)",
        huc: "String - Hydrologic Unit Code",
        countyCd: "String - County code",
        startDT: "String - Start date (YYYY-MM-DD format)",
        endDT: "String - End date (YYYY-MM-DD format)"
      },
      infoSource: "https://waterservices.usgs.gov/rest/DV-Service.html",
      example: {
        format: "json",
        sites: "05454500",
        startDT: "2020-01-01",
        endDT: "2020-01-31",
        exampleRequest: "http://waterservices.usgs.gov/nwis/dv/?format=json&sites=05454500&startDT=2020-01-01&endDT=2020-01-31"
      }
    },
    "groundwater": {
      paramFormat: {
        format: "String - Response format (json, waterml, etc.)",
        site: "String - Site number(s), comma-separated",
        stateCd: "String - State code (e.g., 'ia' for Iowa)",
        huc: "String - Hydrologic Unit Code",
        countyCd: "String - County code",
        startDT: "String - Start date (YYYY-MM-DD format)",
        endDT: "String - End date (YYYY-MM-DD format)"
      },
      infoSource: "https://waterservices.usgs.gov/rest/GW-Levels-Service.html",
      example: {
        format: "json",
        sites: "414638088384201",
        startDT: "2020-01-01",
        endDT: "2020-12-31",
        exampleRequest: "http://waterservices.usgs.gov/nwis/gwlevels/?format=json&sites=414638088384201&startDT=2020-01-01&endDT=2020-12-31"
      }
    },
    "site-information": {
      paramFormat: {
        format: "String - Response format (json, rdb, etc.)",
        sites: "String - Site number(s), comma-separated",
        stateCd: "String - State code (e.g., 'ia' for Iowa)",
        huc: "String - Hydrologic Unit Code",
        bBox: "String - Bounding box (west,south,east,north)",
        countyCd: "String - County code",
        siteType: "String - Site type (e.g., 'ST' for stream, 'LK' for lake)",
        hasDataTypeCd: "String - Data type code (e.g., 'dv' for daily values)"
      },
      infoSource: "https://waterservices.usgs.gov/rest/Site-Service.html",
      example: {
        format: "rdb",
        sites: "05454500,05481000",
        siteOutput: "expanded",
        exampleRequest: "https://waterservices.usgs.gov/nwis/site/?format=rdb&sites=05454500,05481000&siteOutput=expanded"
      }
    },
    "water-quality": {
      paramFormat: {
        search_site_no: "String - Site number(s), comma-separated",
        site_tp_cd: "String - Site type code",
        huc: "String - Hydrologic Unit Code",
        format: "String - Response format",
        sample_media: "String - Sample media (e.g., 'Water', 'Sediment')",
        begin_date: "String - Start date (YYYY-MM-DD format)",
        end_date: "String - End date (YYYY-MM-DD format)",
        column_name: "String - Column name for output"
      },
      infoSource: "https://nwis.waterdata.usgs.gov/nwis/qw",
      example: {
        search_site_no: "05454500",
        format: "rdb",
        begin_date: "2020-01-01",
        end_date: "2020-12-31",
        exampleRequest: "https://nwis.waterdata.usgs.gov/nwis/qwdata?search_site_no=05454500&format=rdb&begin_date=2020-01-01&end_date=2020-12-31"
      }
    },
    "water-use": {
      paramFormat: {
        format: "String - Response format",
        stateCd: "String - State code (e.g., 'ia' for Iowa)",
        countyCd: "String - County code",
        year: "String - Year for data retrieval",
        category: "String - Water use category",
        wu_area: "String - Water use area",
        wu_county: "String - Water use county",
        wu_year: "String - Water use year"
      },
      infoSource: "https://waterdata.usgs.gov/nwis/wu",
      example: {
        format: "rdb",
        wu_area: "US",
        wu_year: "2015",
        wu_category: "ALL",
        exampleRequest: "https://waterdata.usgs.gov/nwis/water_use?format=rdb&wu_area=US&wu_year=2015&wu_category=ALL"
      }
    }
  },

  /* DATA SOURCE 2 */

  /* DATA SOURCE ... */
};
