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
  },

  requirements: {
    needProxy: true,
    requireskey: false,
    method: "GET",
  },
};
