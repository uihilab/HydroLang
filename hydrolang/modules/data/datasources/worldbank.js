/**
 * World Bank API for data retrieval. Handles many types of data
 * depending on the requirements of the user.
 * Note: Different data sources may have different limitations
 * -> E.g., they may limit the # of queries per unit time
 * World Bank does not requires no key, but supports 3 different types
 * of output files. Consider visiting the website for more guidance.
 * https://datahelpdesk.worldbank.org/knowledgebase/articles/902061-climate-data-api
 * For identification of country ISO3 codes, refer to https://unstats.un.org/unsd/methodology/m49/
 * For identification of basin ISO3 codes, refer to https://github.com/hrbrmstr/basins
 * Dates in format YYYY
 * @type {Object}
 * @name Worldbank
 * @memberof datasources
 */

 export default {
  // yearly, monthlyvprecipitation per country or per basin.
  "monavgs-country": {
    endpoint: "http://climatedataapi.worldbank.org/climateweb/rest/v1/mavg/pr",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      country: null,
      start: null,
      end: null,
      ISO3: null,
      ext: null,
      // and more...
    },
    methods:{
      type: "json",
      method: "GET"
    }
  },

  "annualavgs-country": {
    endpoint:
      "http://climatedataapi.worldbank.org/climateweb/rest/v1/annualavg/pr",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      country: null,
      start: null,
      end: null,
      ISO3: null,
      ext: null,
      // and more...
    },
    methods:{
      type: "json",
      method: "GET"
    }
  },

  "monavgs-basin": {
    endpoint: "http://climatedataapi.worldbank.org/climateweb/rest/v1/mavg/pr",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      country: null,
      start: null,
      end: null,
      basinID: null,
      ext: null,
      // and more...
    },
    methods:{
      type: "json",
      method: "GET"
    }
  },

  "annualavgs-basin": {
    endpoint:
      "http://climatedataapi.worldbank.org/climateweb/rest/v1/annualavg/pr",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      country: null,
      start: null,
      end: null,
      basinID: null,
      ext: null,
      // and more...
    },
    methods:{
      type: "json",
      method: "GET"
    }
  },

  // yearly, monthly, daily precipitation ensembles per country or per basin.
  "dailyprec-country": {
    endpoint:
      "http://climatedataapi.worldbank.org/climateweb/rest/v1/ensemble/ppt_means",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      country: null,
      start: null,
      end: null,
      ISO3: null,
      ext: null,
      // and more...
    },
    methods:{
      type: "json",
      method: "GET"
    }
  },

  "dailyprec-basin": {
    endpoint:
      "http://climatedataapi.worldbank.org/climateweb/rest/v1/ensemble/ppt_means",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      country: null,
      start: null,
      end: null,
      basinID: null,
      ext: null,
      // and more...
    },
    methods:{
      type: "json",
      method: "GET"
    }
  },

  // Temperature data for specific countries
  "temperature-country": {
    endpoint: "http://climatedataapi.worldbank.org/climateweb/rest/v1/mavg/tas",
    params: {
      country: null,
      start: null,
      end: null,
      ISO3: null,
      ext: null,
    },
    methods:{
      type: "json",
      method: "GET"
    }
  },

  // Temperature data for specific basins
  "temperature-basin": {
    endpoint: "http://climatedataapi.worldbank.org/climateweb/rest/v1/mavg/tas",
    params: {
      country: null,
      start: null,
      end: null,
      basinID: null,
      ext: null,
    },
    methods:{
      type: "json",
      method: "GET"
    }
  },

  // Retrieves World Bank indicators data
  "indicators": {
    endpoint: "https://api.worldbank.org/v2/indicator",
    params: {
      format: null,
      page: null,
      per_page: null,
      source: null,
      topic: null
    },
    methods:{
      type: "json",
      method: "GET"
    }
  },

  // Get specific indicator data for a country
  "country-indicators": {
    endpoint: "https://api.worldbank.org/v2/countries/{country}/indicators/{indicator}",
    params: {
      country: null,
      indicator: null,
      date: null,
      format: null,
      per_page: null,
      page: null
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
    MoreInfo: "https://datahelpdesk.worldbank.org/knowledgebase/articles/902061-climate-data-api",
    About: "World Bank API for data retrieval. Handles many types of data depending on the requirements of the user. World Bank requires no key, but supports 3 different types of output files."
  },
  "endpoint-info": {
    "monavgs-country": {
      paramFormat: {
        country: "String - Full country name",
        start: "Number - Start year",
        end: "Number - End year",
        ISO3: "String - ISO3 country code (e.g., 'USA', 'GBR')",
        ext: "String - Response format extension (json, xml, csv)"
      },
      infoSource: "https://datahelpdesk.worldbank.org/knowledgebase/articles/902061-climate-data-api",
      example: {
        ISO3: "USA",
        start: 1980,
        end: 1999,
        exampleRequest: "http://climatedataapi.worldbank.org/climateweb/rest/v1/mavg/pr/USA/1980/1999"
      }
    },
    "annualavgs-country": {
      paramFormat: {
        country: "String - Full country name",
        start: "Number - Start year",
        end: "Number - End year",
        ISO3: "String - ISO3 country code (e.g., 'USA', 'GBR')",
        ext: "String - Response format extension (json, xml, csv)"
      },
      infoSource: "https://datahelpdesk.worldbank.org/knowledgebase/articles/902061-climate-data-api",
      example: {
        ISO3: "USA",
        start: 1980,
        end: 1999,
        exampleRequest: "http://climatedataapi.worldbank.org/climateweb/rest/v1/annualavg/pr/USA/1980/1999"
      }
    },
    "monavgs-basin": {
      paramFormat: {
        country: "String - Full country name",
        start: "Number - Start year",
        end: "Number - End year",
        basinID: "Number - Basin ID",
        ext: "String - Response format extension (json, xml, csv)"
      },
      infoSource: "https://datahelpdesk.worldbank.org/knowledgebase/articles/902061-climate-data-api",
      example: {
        basinID: 123,
        start: 1980,
        end: 1999,
        exampleRequest: "http://climatedataapi.worldbank.org/climateweb/rest/v1/mavg/pr/basin/123/1980/1999"
      }
    },
    "annualavgs-basin": {
      paramFormat: {
        country: "String - Full country name",
        start: "Number - Start year",
        end: "Number - End year",
        basinID: "Number - Basin ID",
        ext: "String - Response format extension (json, xml, csv)"
      },
      infoSource: "https://datahelpdesk.worldbank.org/knowledgebase/articles/902061-climate-data-api",
      example: {
        basinID: 123,
        start: 1980,
        end: 1999,
        exampleRequest: "http://climatedataapi.worldbank.org/climateweb/rest/v1/annualavg/pr/basin/123/1980/1999"
      }
    },
    "dailyprec-country": {
      paramFormat: {
        country: "String - Full country name",
        start: "Number - Start year",
        end: "Number - End year",
        ISO3: "String - ISO3 country code (e.g., 'USA', 'GBR')",
        ext: "String - Response format extension (json, xml, csv)"
      },
      infoSource: "https://datahelpdesk.worldbank.org/knowledgebase/articles/902061-climate-data-api",
      example: {
        ISO3: "USA",
        start: 1980,
        end: 1999,
        exampleRequest: "http://climatedataapi.worldbank.org/climateweb/rest/v1/ensemble/ppt_means/USA/1980/1999"
      }
    },
    "dailyprec-basin": {
      paramFormat: {
        country: "String - Full country name",
        start: "Number - Start year",
        end: "Number - End year",
        basinID: "Number - Basin ID",
        ext: "String - Response format extension (json, xml, csv)"
      },
      infoSource: "https://datahelpdesk.worldbank.org/knowledgebase/articles/902061-climate-data-api",
      example: {
        basinID: 123,
        start: 1980,
        end: 1999,
        exampleRequest: "http://climatedataapi.worldbank.org/climateweb/rest/v1/ensemble/ppt_means/basin/123/1980/1999"
      }
    },
    "temperature-country": {
      paramFormat: {
        country: "String - Full country name",
        start: "Number - Start year",
        end: "Number - End year",
        ISO3: "String - ISO3 country code (e.g., 'USA', 'GBR')",
        ext: "String - Response format extension (json, xml, csv)"
      },
      infoSource: "https://datahelpdesk.worldbank.org/knowledgebase/articles/902061-climate-data-api",
      example: {
        ISO3: "USA",
        start: 1980,
        end: 1999,
        exampleRequest: "http://climatedataapi.worldbank.org/climateweb/rest/v1/mavg/tas/USA/1980/1999"
      }
    },
    "temperature-basin": {
      paramFormat: {
        country: "String - Full country name",
        start: "Number - Start year",
        end: "Number - End year",
        basinID: "Number - Basin ID",
        ext: "String - Response format extension (json, xml, csv)"
      },
      infoSource: "https://datahelpdesk.worldbank.org/knowledgebase/articles/902061-climate-data-api",
      example: {
        basinID: 123,
        start: 1980,
        end: 1999,
        exampleRequest: "http://climatedataapi.worldbank.org/climateweb/rest/v1/mavg/tas/basin/123/1980/1999"
      }
    },
    "indicators": {
      paramFormat: {
        format: "String - Response format (json, xml)",
        page: "Number - Page number for pagination",
        per_page: "Number - Number of results per page",
        source: "Number - Source ID for indicators",
        topic: "Number - Topic ID for indicators"
      },
      infoSource: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-api-documentation",
      example: {
        format: "json",
        per_page: 50,
        topic: 19,
        exampleRequest: "https://api.worldbank.org/v2/indicator?format=json&per_page=50&topic=19"
      }
    },
    "country-indicators": {
      paramFormat: {
        country: "String - ISO2 or ISO3 country code or 'all' for all countries",
        indicator: "String - Indicator code (e.g., 'NY.GDP.MKTP.CD' for GDP)",
        date: "String - Date range (e.g., '2010:2020')",
        format: "String - Response format (json, xml)",
        per_page: "Number - Number of results per page",
        page: "Number - Page number for pagination"
      },
      infoSource: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-api-documentation",
      example: {
        country: "USA",
        indicator: "NY.GDP.MKTP.CD",
        date: "2010:2020",
        format: "json",
        per_page: 100,
        exampleRequest: "https://api.worldbank.org/v2/countries/USA/indicators/NY.GDP.MKTP.CD?format=json&date=2010:2020&per_page=100"
      }
    }
  }
};
