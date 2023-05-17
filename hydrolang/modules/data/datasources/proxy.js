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
  }
};
