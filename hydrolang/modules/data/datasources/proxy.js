/**
 * All proxy servers tried and working can be found here.
 * It is a trial/error to see if a specific error might be working per resource.
 * @type {Object}
 * @name ProxyServers
 * @memberof datasources
 */

export default {
  //Required node application to be available on the local machine.
  "local-proxy":{
    endpoint: "https://hydroinformatics.uiowa.edu/lab/cors/"
  },
  "researchverse":{
    endpoint: "https://researchverse.ai/backend/api/simple-proxy/"
  },
  
  info: {
    returnFormats: "json",
    MoreInfo: "https://allorigins.win/",
    About: "All proxy servers tried and working can be found here. It is a trial/error to see if a specific error might be working per resource."
  },
  
  "endpoint-info": {
    "researchverse": {
      paramFormat: {
        url: "String - The URL to proxy"
      },
      infoSource: "Researchverse proxy server",
      example: {
        url: "https://waterservices.usgs.gov/nwis/iv?format=json&sites=01646500",
        exampleRequest: "http://localhost:9000/api/v1/?url=https://waterservices.usgs.gov/nwis/iv?format=json&sites=01646500"
      }
    },
    "local-proxy": {
      paramFormat: {
        url: "String - The URL to proxy"
      },
      infoSource: "Local proxy server",
      example: {
        url: "https://waterservices.usgs.gov/nwis/iv?format=json&sites=01646500",
        exampleRequest: "http://localhost:9000/api/v1/?url=https://waterservices.usgs.gov/nwis/iv?format=json&sites=01646500"
      }
    }
  }
};
