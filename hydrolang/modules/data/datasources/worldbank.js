/**
 * World Bank API for data retrieval.
 * Provides access to global climate data (precipitation/temperature) and development indicators.
 *
 * **Data Information:**
 * - **Source:** World Bank Climate Change Knowledge Portal & Indicators API
 * - **Coverage:** Global (by Country or Basin)
 * - **Services:** Historical Weather, Climate Projections, Development Indicators
 *
 * **Available Data Types:**
 * - `monavgs-country` / `annualavgs-country`: Historical averages by country.
 * - `monavgs-basin` / `annualavgs-basin`: Historical averages by basin ID.
 * - `indicators`: General development indicators (GDP, Pop, etc.).
 * - `country-indicators`: Specific indicators for a country.
 *
 * **Key Parameters:**
 * - `ISO3`: Country code (e.g., "USA", "BRA")
 * - `start` / `end`: Years (YYYY)
 * - `indicator`: Indicator code (e.g., "NY.GDP.MKTP.CD")
 *
 * @example
 * // 1. Retrieve Historical Monthly Precipitation Averages for USA
 * const rainfall = await hydro.data.retrieve({
 *   params: {
 *     source: 'worldbank',
 *     datatype: 'monavgs-country'
 *   },
 *   args: {
 *     ISO3: 'USA',
 *     start: 1980,
 *     end: 1999
 *   }
 * });
 *
 * @example
 * // 2. Retrieve GDP Indicator for Brazil
 * const gdpData = await hydro.data.retrieve({
 *   params: {
 *     source: 'worldbank',
 *     datatype: 'country-indicators'
 *   },
 *   args: {
 *     country: 'BRA',
 *     indicator: 'NY.GDP.MKTP.CD',
 *     date: '2010:2020',
 *     format: 'json'
 *   }
 * });
 *
 * @see https://datahelpdesk.worldbank.org/
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
    methods: {
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
    methods: {
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
    methods: {
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
    methods: {
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
    methods: {
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
    methods: {
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
    methods: {
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
    methods: {
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
    methods: {
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
