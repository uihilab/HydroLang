/**
 * https://waterservices.usgs.gov/rest/IV-Service.html
 * This API returns stream stages for US
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
      methods:{
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
      methods:{
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
      methods:{
        type: "json",
        method: "GET"
      }
    },
  
    // Adding new endpoint for drought monitor data
    "drought-monitor": {
      endpoint: "https://droughtmonitor.unl.edu/data/json/",
      params: {
        aoi: null,
        fips: null,
        hucLevel: null,
        hucId: null,
        week: null
      },
      methods:{
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
          site: "01646500",
          startDT: "2020-01-01",
          endDT: "2020-01-31",
          exampleRequest: "http://waterservices.usgs.gov/nwis/iv/?format=json&sites=01646500&startDT=2020-01-01&endDT=2020-01-31"
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
          site: "01646500",
          startDT: "2020-01-01",
          endDT: "2020-01-31",
          exampleRequest: "http://waterservices.usgs.gov/nwis/dv/?format=json&sites=01646500&startDT=2020-01-01&endDT=2020-01-31"
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
          site: "414638088384201",
          startDT: "2020-01-01",
          endDT: "2020-12-31",
          exampleRequest: "http://waterservices.usgs.gov/nwis/gwlevels/?format=json&sites=414638088384201&startDT=2020-01-01&endDT=2020-12-31"
        }
      },
      // Adding a new endpoint for drought monitor data
      "drought-monitor": {
        paramFormat: {
          aoi: "String - Area of interest (e.g., 'state', 'county', 'huc')",
          fips: "String - FIPS code (when aoi='county' or 'state')",
          hucLevel: "Number - HUC level (when aoi='huc')",
          hucId: "String - HUC ID (when aoi='huc')",
          week: "String - Week date (YYYYMMDD format)"
        },
        infoSource: "https://droughtmonitor.unl.edu/Data/GISData.aspx",
        example: {
          aoi: "state",
          fips: "06",
          week: "20200101",
          exampleRequest: "https://droughtmonitor.unl.edu/data/json/state_06_20200101.json"
        }
      }
    },
  
    /* DATA SOURCE 2 */
  
    /* DATA SOURCE ... */
  };
  