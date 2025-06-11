/**
 * All proxy servers tried and working can be found here.
 * It is a trial/error to see if a specific error might be working per resource.
 * @type {Object}
 * @name ProxyServers
 * @memberof datasources
 */

export default {
  //If CORS-Anywhere is used, then you need to go to https://cors-anywhere.herokuapp.com/corsdemo to enable
  //the demo version. 
  "cors-anywhere": {
    endpoint: "https://cors-anywhere.herokuapp.com/",
  },

  //All Origins proxy to obtain data as JSON or raw data. More info can be found at:
  ///https://allorigins.win/
  "all-origins": {
    endpoint: "https://api.allorigins.win/raw?url=",
  },

  "hydro-proxy":{
    endpoint: "https://hydro-proxy.herokuapp.com/"
  },

  //Required node application to be available on the local machine.
  "local-proxy":{
    endpoint: "https://hydroinformatics.uiowa.edu/lab/cors/"
  },
  
  info: {
    returnFormats: "json",
    MoreInfo: "https://allorigins.win/",
    About: "All proxy servers tried and working can be found here. It is a trial/error to see if a specific error might be working per resource."
  },
  
  "endpoint-info": {
    "cors-anywhere": {
      paramFormat: {
        url: "String - The URL to proxy"
      },
      infoSource: "https://cors-anywhere.herokuapp.com/",
      example: {
        url: "https://waterservices.usgs.gov/nwis/iv?format=json&sites=01646500",
        exampleRequest: "https://cors-anywhere.herokuapp.com/https://waterservices.usgs.gov/nwis/iv?format=json&sites=01646500"
      }
    },
    "all-origins": {
      paramFormat: {
        url: "String - The URL to proxy"
      },
      infoSource: "https://allorigins.win/",
      example: {
        url: "https://waterservices.usgs.gov/nwis/iv?format=json&sites=01646500",
        exampleRequest: "https://api.allorigins.win/get?url=https://waterservices.usgs.gov/nwis/iv?format=json%26sites=01646500"
      }
    },
    "hydro-proxy": {
      paramFormat: {
        url: "String - The URL to proxy"
      },
      infoSource: "Custom proxy for Hydrolang",
      example: {
        url: "https://waterservices.usgs.gov/nwis/iv?format=json&sites=01646500",
        exampleRequest: "https://hydroproxy.appsfordeveloper.com/api/v1/?url=https://waterservices.usgs.gov/nwis/iv?format=json&sites=01646500"
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
