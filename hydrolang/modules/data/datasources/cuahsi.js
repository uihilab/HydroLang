/**
 * CUAHSI available REST endpoints. This collection includes:
 * waterOneFlow, hisCentral and HydroShare
 * @type {Object}
 * @namespace CUAHSI
 * @memberof datasources
 */

/**
 * Data endpoints for the CUAHSI HIS WaterOneFlow services. The services accessed
 * require POST requests through SOAP protocol. The endpoints are compliant with version 1.1 of the service.
 * More information about the request can be found in the following links:
 * https://cuahsi.zendesk.com/hc/en-us/articles/205153157-HydroServer-and-the-WaterOneFlow-Web-Services-API
 * https://hydroportal.cuahsi.org/ipswich/
 * 
 * Includes the following methods
 * @prop {string} sourceType - source that will be queried. Requires source, see list for more references.
 * @prop {string} GetSiteInfo - returns site metadata, given a specific site number for multiple sites. Values passed as strings.
 * @prop {string} GetSiteInfoMultpleObject - returns site metadata, given a specific site number. Pass value as string
 * @prop {string} GetSiteInfoObject - returns site metadata, given a specific site number. Pass value as string
 * @prop {string} GetSites - given an array of sites, returns the metadata for each site. Pass values as array of strings
 * @prop {string} GetSitesByBoxObject - finds sites for a specific source on a bounding box having properties {west, south, east, north}
 * @prop {string} GetSitesObject - returns site metadata, pass site as array of strings
 * @prop {string} GetValues - returns timeseries for a specific location. Requires {location: string, variable: string, startDate: string, endDate: string}
 * @prop {string} GetValuesForASiteObject - returns values as array of strings as {site: string, startDate: string , endDate: string}
 * @prop {string} GetValuesObject - returns timeseries for a given location and timespan {location: string, variable: string, startDate: string, endDate: string}
 * @prop {string} GetVariableInfo - returns variable name given information for a variable. Pass as string.
 * @prop {string} GetVariableInfoObject - returns a variable's name, given specific information for the variable. Pass value as string
 * @prop {string} GetVariables - get all avaibale variables from a specific source. No parameters required.
 * @prop {string} GetVariablesObject - get all avaibale variables from a specific source. No parameters required.
 *
 * @see https://hydroportal.cuahsi.org/
 * @type {Object}
 * @name waterOneFlow
 * @memberof datasources.CUAHSI
 *
 */
const waterOneFlow = {
  availableSources: [
    "USGS Daily Values",
    "USGS GroundWater",
    "USGS Unit Values",
    "Andrew Forest StreamFlow",
    "Curated Brazilian Savana",
    "Aquatic Habitat Lab CALVIN",
    "Crowd Hydrology",
    "Corpus Christi Bay",
    "California DEC",
    "Cedar River WS Forest",
    "Clarksburg CSU",
    "Commmunity Rain Network",
    "Coopercreek Watershed",
    "Charles River Watershed",
    "Cornell Six Mile Isotopes",
    "Delaware River WS",
    "Farmington River Watershed",
    "Florida Everglades LTER",
    "FSU Hydrowell",
    "NOAA GHCN",
    "Boston Harbor",
    "MOPEX",
    "Swedish Monitoring",
    "Humedales Atacama",
    "Global Rivers",
    "NLDAS Hourly Forcings",
    "NLDAS Hourly NOAH Data"
  ],
  action: "http://www.cuahsi.org/his/1.1/ws/",
  sourceType: (type) => {
    var val = "";

    switch (type) {
      case "USGS Daily Values":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=1
        val = "nwisdv";
        break;
      case "USGS GroundWater":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=8
        val = "nwisgw";
        break;
      case "USGS Unit Values":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=3
        val = "nwisuv";
        break;
      case "Andrew Forest StreamFlow":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5658
        val = "Andrewsforestlter";
        break;
      case "Curated Brazilian Savana":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5629
        val = "Brazil_UCB";
        break;
      case "Aquatic Habitat Lab CALVIN":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5649
        val = "CALVIN_HHS";
        break;
      case "Crowd Hydrology":
          //Additional info:
          //https://hiscentral.cuahsi.org/pub_network.aspx?n=5649
          val = "MobileCrowdHydrology";
          break;
      case "Corpus Christi Bay":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5647
        val = "CCBEPDAP";
        break;

      case "California DEC":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5675
        val = "CDEC";
        break;

      case "Cedar River WS Forest":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=4569
        val = "cedarriver";
        break;

      case "Clarksburg CSU":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5616
        val = "clarksburg_sp";
        break;

      case "Commmunity Rain Network":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5632
        val = "CocoRaHs";
        break;

      case "Coopercreek Watershed":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5678
        val = "Coopercreek";
        break;

      case "Charles River Watershed":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5617
        val = "Charles_River_WA";
        break;

      case "Cornell Six Mile Isotopes":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5651
        val = "CUISO";
        break;

      case "Delaware River WS":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5654
        val = "DRWI";
        break;

      case "Farmington River Watershed":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5623
        val = "FRWA";
        break;

      case "Florida Everglades LTER":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5664
        val = "FCELTER";
        break;

      case "FSU Hydrowell":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5669
        val = "FSUHydro";
        break;

      case "NOAA GHCN":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=229
        val = "ghcn";
        break;

      case "Boston Harbor":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5586
        val = "MWRA";
        break;

      case "MOPEX":
        //Additional info:
        //https://hiscentral.cuahsi.org/pub_network.aspx?n=5599
        val = "MOPEX";
        break;
      
      case "Swedish Monitoring":
        //Additional info:
        //http://hiscentral.cuahsi.org/pub_network.aspx?n=431
        val = "SwedishMonitoringData";
        break;

      case "Humedales Atacama":
        //Additional info:
        //http://hiscentral.cuahsi.org/pub_network.aspx?n=5607
        val = "Ramsar_atacama";
        break;
    
      case "Global Rivers":
        //Additional info:
        //http://hiscentral.cuahsi.org/pub_network.aspx?n=3534
        val = "GlobalRiversObservatory";
        break;
      
      case "NLDAS Hourly Forcings":
        //Additional info:
        //http://hiscentral.cuahsi.org/pub_network.aspx?n=267
        val = "NLDAS_FORA";
        break;

      case "NLDAS Hourly NOAH Data":
          //Additional info:
          //http://hiscentral.cuahsi.org/pub_network.aspx?n=274
          val = "NLDAS_NOAH";
          break;

      default:
        //Default value left to the most accessible Google Search for
        //WaterOneFlow
        console.log("Default value returned, there might be an error on the request. Revise parameters.")
        val = "ipswich";
        break;
    }
    return `https://hydroportal.cuahsi.org/${val}/cuahsi_1_1.asmx`;
  },
  GetSiteInfo: {
    //Returns site metadata, given a specific site number.
    //pass value as string
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSiteInfo
    body: (prop) => {
      return `<GetSiteInfo xmlns="${waterOneFlow.action}"><site>${(() => {
        return Object.values(prop)
          .map((val) => `NetworkName:${val}`)
          .join("");
      })()}</site></GetSiteInfo>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  //Multple is NOT a typo
  GetSiteInfoMultpleObject: {
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSiteInfoMultpleObject
    body: (prop) => {
      return `<GetSiteInfoMultpleObject xmlns="${
        waterOneFlow.action
      }"><site>${(() => {
        return Object.values(prop)
          .map((val) => `<string>NetworkName:${val}</string>`)
          .join("");
      })()}</site></GetSiteInfoMultpleObject>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetSiteInfoObject: {
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSiteInfoObject
    body: (prop) => {
      return `<GetSiteInfoObject xmlns="${waterOneFlow.action}"><site>${(() => {
        return Object.values(prop)
          .map((val) => `NetworkName:${val}`)
          .join("");
      })()}</site></GetSiteInfoObject>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },

  GetSites: {
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSites
    body: (prop) => {
      return `<GetSites xmlns="${waterOneFlow.action}"><site>${(() => {
        return Object.values(prop)
          .map((val) => `<string>NetworkName:${val}</string>`)
          .join("");
      })()}</site></GetSites>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },

  GetSitesByBoxObject: {
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSitesByBoxObject
    body: (prop) => {
      return `<GetSitesByBoxObject xmlns="${waterOneFlow.action}"><west>${prop["west"]}</west><south>${prop["south"]}</south><east>${prop["east"]}</east><north>${prop["north"]}</north><IncludeSeries>true</IncludeSeries></GetSitesByBoxObject>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetSitesObject: {
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSitesObject
    body: (prop) => {
      return `<GetSitesObject xmlns="${waterOneFlow.action}"><site>${(() => {
        return Object.values(prop)
          .map((val) => `<string>NetworkName:${val}</string>`)
          .join("");
      })()}</site></GetSitesObject>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetValues: {
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetValues
    body: (prop) => {
      return `<GetValues xmlns="${waterOneFlow.action}"><location>NetworkName:${prop["location"]}</location><variable>NetworkName:${prop["variable"]}</variable><startDate>${prop["startDate"]}</startDate><endDate>${prop["endDate"]}</endDate></GetValues>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetValuesForASiteObject: {
    //Example found in
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetValuesForASiteObject
    body: (prop) => {
      return `<GetValuesForASiteObject xmlns="${waterOneFlow.action}"><site>NetworkName:${prop["site"]}</site><startDate>${prop["startDate"]}</startDate><endDate>${prop["endDate"]}</endDate></GetValuesForASiteObject>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetValuesObject: {
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetValuesObject
    body: (prop) => {
      return `<GetValuesObject xmlns="${waterOneFlow.action}"><location>NetworkName:${prop["location"]}</location><variable>NetworkName:${prop["variable"]}</variable><startDate>${prop["startDate"]}</startDate><endDate>${prop["endDate"]}</endDate></GetValuesObject>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetVariableInfo: {
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetVariableInfo
    body: (prop) => {
      return `<GetVariableInfo xmlns="${
        waterOneFlow.action
      }"><variable>${(() => {
        return Object.values(prop)
          .map((val) => `NetworkName:${val}`)
          .join("");
      })()}</variable></GetVariableInfo>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetVariableInfoObject: {
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetVariableInfoObject
    body: (prop) => {
      return `<GetVariableInfoObject xmlns="${
        waterOneFlow.action
      }"><variable>${(() => {
        return Object.values(prop)
          .map((val) => `NetworkName:${val}`)
          .join("");
      })()}</variable></GetVariableInfoObject>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetVariables: {
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetVariables
    body: () => {
      return `<GetVariables xmlns="${waterOneFlow.action}"></GetVariables>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetVariablesObject: {
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetVariableObject
    body: () => {
      return `<GetVariablesObject xmlns="${waterOneFlow.action}"></GetVariablesObject>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },

  //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
  requirements: {
    needProxy: true,
    requireskey: false,
  },
  info: {
    returnFormats: "soap",
    MoreInfo: "https://hydroportal.cuahsi.org/ipswich/",
    About: "Data endpoints for the CUAHSI HIS WaterOneFlow services. The services accessed require POST requests through SOAP protocol."
  },
  "endpoint-info": {
    sourceType: {
      paramFormat: {
        type: "String - Name of the data source (e.g., 'USGS Daily Values', 'USGS GroundWater')"
      },
      infoSource: "https://hydroportal.cuahsi.org/",
      example: "waterOneFlow.sourceType('USGS Daily Values') returns 'https://hydroportal.cuahsi.org/nwisdv/cuahsi_1_1.asmx'"
    },
    GetSiteInfo: {
      paramFormat: {
        site: "String/Array - Network name and site code (e.g., 'NetworkName:01234567')"
      },
      infoSource: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSiteInfo",
      example: "Requires SOAP request with body: <GetSiteInfo xmlns=\"http://www.cuahsi.org/his/1.1/ws/\"><site>NetworkName:01234567</site></GetSiteInfo>"
    },
    GetSites: {
      paramFormat: {
        site: "Array - Array of network name and site codes (e.g., ['NetworkName:01234567', 'NetworkName:01234568'])"
      },
      infoSource: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSites",
      example: "Requires SOAP request with body: <GetSites xmlns=\"http://www.cuahsi.org/his/1.1/ws/\"><site><string>NetworkName:01234567</string><string>NetworkName:01234568</string></site></GetSites>"
    },
    GetSitesByBoxObject: {
      paramFormat: {
        west: "Number - Western longitude boundary",
        south: "Number - Southern latitude boundary",
        east: "Number - Eastern longitude boundary",
        north: "Number - Northern latitude boundary"
      },
      infoSource: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSitesByBoxObject",
      example: "Requires SOAP request with body: <GetSitesByBoxObject xmlns=\"http://www.cuahsi.org/his/1.1/ws/\"><west>-71.5</west><south>42.2</south><east>-70.5</east><north>43.0</north><IncludeSeries>true</IncludeSeries></GetSitesByBoxObject>"
    },
    GetValues: {
      paramFormat: {
        location: "String - Network name and site code (e.g., 'NetworkName:01234567')",
        variable: "String - Network name and variable code (e.g., 'NetworkName:00060')",
        startDate: "String - Start date (YYYY-MM-DD format)",
        endDate: "String - End date (YYYY-MM-DD format)"
      },
      infoSource: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetValues",
      example: "Requires SOAP request with body: <GetValues xmlns=\"http://www.cuahsi.org/his/1.1/ws/\"><location>NetworkName:01234567</location><variable>NetworkName:00060</variable><startDate>2020-01-01</startDate><endDate>2020-01-31</endDate></GetValues>"
    },
    GetVariables: {
      paramFormat: {},
      infoSource: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetVariables",
      example: "Requires SOAP request with body: <GetVariables xmlns=\"http://www.cuahsi.org/his/1.1/ws/\"></GetVariables>"
    }
  }
};

/**
 * HIS Central serves as the main functions that can be used for a specific resource. It allows for users to obtain specific data from a resource
 * without the need of manipulation a large chunk of data, but rather, allow a function to query the data. Each function has its own usage and is constrained by
 * the parameters passed within HydroLang functions. More information about HIS Central can be found in the following link:
 * https://his.cuahsi.org/
 * @type {Object}
 * @name hisCentral
 * @memberof datasources.CUAHSI
 */

const hisCentral = {
  //The request parameters passed into hisCentral endpoint are compliant with SOAP 1.1
  action: "http://hiscentral.cuahsi.org/20100205/",
  sourceType: (type) => {
    typeof type === undefined ? (type = "") : null;
    return `https://hiscentral.cuahsi.org/webservices/hiscentral.asmx`;
  },
  GetControlledVocabulary: {
    //Retrieves terms and definitions for controlled vocabulary found in:
    //http://his.cuahsi.org/mastercvreg/cv11.aspx
    //pass value as string
    //Example found in:
    //https://hiscentral.cuahsi.org/webservices/hiscentral.asmx?op=GetControlledVocabulary
    endpoint: "https://hiscentral.cuahsi.org/webservices/hiscentral.asmx",
    body: (prop) => {
      return `<GetControlledVocabulary xmlns="${hisCentral.action}"><cvField>${prop["cvField"]}</cvField></GetControlledVocabulary>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetWaterOneFlowServiceInfo: {
    //Gets all the registered data services from the following:
    //http://hiscentral.cuahsi.org/pub_services.aspx
    //No parameters needed
    //Example found in:
    //https://hiscentral.cuahsi.org/webservices/hiscentral.asmx?op=GetWaterOneFlowServiceInfo
    endpoint: "https://hiscentral.cuahsi.org/webservices/hiscentral.asmx",
    body: () => {
      return `<GetWaterOneFlowServiceInfo xmlns="${hisCentral.action}"></GetWaterOneFlowServiceInfo>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetCountOrData: {
    //Retrieves information about the metadata in the HIS catalog.
    //pass value as strings and numbers
    //Not all parameters are required to be passed, but minimum requirements from the API are the bounding box minmax.
    //Example found in:
    //https://hiscentral.cuahsi.org/webservices/hiscentral.asmx?op=GetCountOrData
    endpoint: "https://hiscentral.cuahsi.org/webservices/hiscentral.asmx",
    body: (prop) => {
      return `<GetCountOrData xmlns="${hisCentral.action}">
        <getData>true</getData>
        <getFacetOnCV>true</getFacetOnCV>
        <xmin>${prop["xmin"] === undefined ? "" : prop["xmin"]}</xmin>
        <xmax>${prop["xmax"] === undefined ? "" : prop["xmax"]}</xmax>
        <ymin>${prop["ymin"] === undefined ? "" : prop["ymin"]}</ymin>
        <ymax>${prop["ymax"] === undefined ? "" : prop["ymax"]}</ymax>
        <sampleMedium>${
          prop["sampleMedium"] === undefined ? "" : prop["sampleMedium"]
        }</sampleMedium>
        <dataType>${
          prop["dataType"] === undefined ? "" : prop["dataType"]
        }</dataType>
        <valueType>${
          prop["valueType"] === undefined ? "" : prop["valueType"]
        }</valueType>
        <generalCategory>${
          prop["generalCat"] === undefined ? "" : prop["generalCat"]
        }</generalCategory>
        <conceptKeyword>${
          prop["conceptKey"] === undefined ? "" : prop["conceptKey"]
        }</conceptKeyword>
        <networkIDs>${
          prop["networkID"] === undefined ? "" : prop["networkID"]
        }</networkIDs>
        <beginDate>${
          prop["startDate"] === undefined ? "" : prop["startDate"]
        }</beginDate>
        <endDate>${
          prop["endDate"] === undefined ? "" : prop["endDate"]
        }</endDate>
        </GetCountOrData>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetSearchableConcepts: {
    //Retrieves list of searchable concepts from the HIS ontology.
    //Pass values as array of strings
    //Example found in:
    //https://hiscentral.cuahsi.org/webservices/hiscentral.asmx?op=GetSearchableConcepts
    endpoint: "https://hiscentral.cuahsi.org/webservices/hiscentral.asmx",
    body: () => {
      return `<GetSearchableConcepts xmlns="${hisCentral.action}"></GetSearchableConcepts>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetSeriesCatalogForBox2: {
    // Returns metadata for specific time series matching provided parameters as a subset.
    //Example found in:
    //https://hiscentral.cuahsi.org/webservices/hiscentral.asmx?op=GetSeriesCatalogForBox2
    endpoint: "https://hiscentral.cuahsi.org/webservices/hiscentral.asmx",
    body: (prop) => {
      return `<GetSeriesCatalogForBox2 xmlns="${hisCentral.action}">
        <xmin>${prop["xmin"] === undefined ? "" : prop["xmin"]}</xmin>
        <xmax>${prop["xmax"] === undefined ? "" : prop["xmax"]}</xmax>
        <ymin>${prop["ymin"] === undefined ? "" : prop["ymin"]}</ymin>
        <ymax>${prop["ymax"] === undefined ? "" : prop["ymax"]}</ymax>
        <conceptKeyword>${
          prop["conceptKey"] === undefined ? "" : prop["conceptKey"]
        }</conceptKeyword>
        <networkIDs>${
          prop["networkID"] === undefined ? "" : prop["networkID"]
        }</networkIDs>
        <beginDate>${
          prop["startDate"] === undefined ? "" : prop["startDate"]
        }</beginDate>
        <endDate>${
          prop["endDate"] === undefined ? "" : prop["endDate"]
        }</endDate>
        </GetSeriesCatalogForBox2>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetSeriesCatalogForBox3: {
    // Returns metadata for specific time series matching provided parameters as a full set of info.
    //Example found in:
    //https://hiscentral.cuahsi.org/webservices/hiscentral.asmx?op=GetSeriesCatalogForBox3
    endpoint: "https://hiscentral.cuahsi.org/webservices/hiscentral.asmx",
    body: (prop) => {
      return `<GetSeriesCatalogForBox3 xmlns="${hisCentral.action}">
        <xmin>${prop["xmin"] === undefined ? "" : prop["xmin"]}</xmin>
        <xmax>${prop["xmax"] === undefined ? "" : prop["xmax"]}</xmax>
        <ymin>${prop["ymin"] === undefined ? "" : prop["ymin"]}</ymin>
        <ymax>${prop["ymax"] === undefined ? "" : prop["ymax"]}</ymax>
        <conceptKeyword>${
          prop["conceptKey"] === undefined ? "" : prop["conceptKey"]
        }</conceptKeyword>
        <networkIDs>${
          prop["networkID"] === undefined ? "" : prop["networkID"]
        }</networkIDs>
        <beginDate>${
          prop["startDate"] === undefined ? "" : prop["startDate"]
        }</beginDate>
        <endDate>${
          prop["endDate"] === undefined ? "" : prop["endDate"]
        }</endDate>
        </GetSeriesCatalogForBox3>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },

  //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
  requirements: {
    needProxy: true,
    requireskey: false,
  },
  info: {
    returnFormats: "soap",
    MoreInfo: "https://his.cuahsi.org/",
    About: "HIS Central serves as the main functions that can be used for a specific resource. It allows for users to obtain specific data from a resource without the need of manipulation a large chunk of data."
  },
  "endpoint-info": {
    sourceType: {
      paramFormat: {
        type: "String - Type parameter (optional)"
      },
      infoSource: "https://his.cuahsi.org/",
      example: "hisCentral.sourceType() returns 'https://hiscentral.cuahsi.org/webservices/hiscentral.asmx'"
    },
    GetControlledVocabulary: {
      paramFormat: {
        cvField: "String - Controlled vocabulary field"
      },
      infoSource: "https://hiscentral.cuahsi.org/webservices/hiscentral.asmx?op=GetControlledVocabulary",
      example: "Requires SOAP request with body: <GetControlledVocabulary xmlns=\"http://hiscentral.cuahsi.org/20100205/\"><cvField>SampleMedium</cvField></GetControlledVocabulary>"
    },
    GetWaterOneFlowServiceInfo: {
      paramFormat: {},
      infoSource: "https://hiscentral.cuahsi.org/webservices/hiscentral.asmx?op=GetWaterOneFlowServiceInfo",
      example: "Requires SOAP request with body: <GetWaterOneFlowServiceInfo xmlns=\"http://hiscentral.cuahsi.org/20100205/\"></GetWaterOneFlowServiceInfo>"
    },
    GetCountOrData: {
      paramFormat: {
        xmin: "Number - Minimum longitude",
        xmax: "Number - Maximum longitude",
        ymin: "Number - Minimum latitude",
        ymax: "Number - Maximum latitude",
        sampleMedium: "String - Sample medium (e.g., 'Surface Water')",
        dataType: "String - Data type",
        valueType: "String - Value type",
        generalCat: "String - General category",
        conceptKey: "String - Concept keyword",
        networkID: "String - Network ID",
        startDate: "String - Start date (YYYY-MM-DD format)",
        endDate: "String - End date (YYYY-MM-DD format)"
      },
      infoSource: "https://hiscentral.cuahsi.org/webservices/hiscentral.asmx?op=GetCountOrData",
      example: "Requires SOAP request with body containing xmin, xmax, ymin, ymax parameters"
    }
  }
};

/**
 * HydroShare API, enabling acccess to data resources, examples, models and more hosted within the HydroShare sphere.
 * Swagger example found in the following link:https://www.hydroshare.org/hsapi/
 * @type {Object}
 * @name hydroShare
 * @memberof datasources.CUAHSI
 */
const hydroShare = {
  resource_list: {
    endpoint: "https://www.hydroshare.org/hsapi/resource",
    params: {
      //Example resource should include at least edit permission, published and include obsolete for the response to work.
      page: null,
      count: null,
      creator: null,
      author: null,
      group: null,
      user: null,
      owner: null,
      from_date: null,
      to_date: null,
      subject: null,
      full_text_search: null,
      edit_permission: null,
      published: null,
      type: null,
      coverage_type: null,
      north: null,
      south: null,
      east: null,
      west: null,
      include_obsolete: false,
    },
    methods: {
      type: "json",
      method: "POST",
    },
  },

  resource_create: {
    endpoint: "https://www.hydroshare.org/hsapi/resource",
    params: {
      //Example resource should include at least edit permission, published and include obsolete for the response to work.
      string: null,
      metadata: null,
      extra_metadata: null,
      edit_users: null,
      view_users: null,
      view_groups: null,
      keywords: [null],
      abstract: null,
      resource_type: "CompositeResource",
    },
    methods: {
      type: "json",
      method: "POST",
    },
  },

  content_types: {
    endpoint: "https://www.hydroshare.org/hsapi/resource/content_types",
    params: {},
    methods: {
      type: "json",
      method: "POST",
    },
  },

  search: {
    endpoint: "https://www.hydroshare.org/hsapi/resource/search",
    params: {
      page: null,
      count: null,
      text: null,
      author: null,
      contributor: [null],
      subject: [null],
      abstract: null,
      resource_type: null,
      content_type: [null],
      coverage_type: [null],
      availability: null,
      created: null,
      modified: null,
      start_date: null,
      end_date: null,
      east: null,
      north: null,
      eastlimit: null,
      westlimit: null,
      northlimit: null,
      southlimit: null,
    },
    methods: {
      type: "json",
      method: "GET",
    },
  },

  types: {
    endpoint: "https://www.hydroshare.org/hsapi/resource/types",
    params: {},
    methods: {
      type: "json",
      method: "GET",
    },
  },

  //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
  requirements: {
    needProxy: true,
    requireskey: false,
  },
  info: {
    returnFormats: "json",
    MoreInfo: "https://www.hydroshare.org/hsapi/",
    About: "HydroShare API, enabling acccess to data resources, examples, models and more hosted within the HydroShare sphere."
  },
  "endpoint-info": {
    resource_list: {
      paramFormat: {
        page: "Number - Page number for pagination",
        count: "Number - Number of results per page",
        creator: "String - Filter by creator",
        author: "String - Filter by author",
        group: "String - Filter by group",
        user: "String - Filter by user",
        owner: "String - Filter by owner",
        from_date: "String - Start date filter (YYYY-MM-DD)",
        to_date: "String - End date filter (YYYY-MM-DD)",
        subject: "String - Filter by subject",
        full_text_search: "String - Full text search term",
        edit_permission: "Boolean - Filter by edit permission",
        published: "Boolean - Filter by published status",
        type: "String - Filter by resource type",
        coverage_type: "String - Filter by coverage type",
        north: "Number - Northern boundary",
        south: "Number - Southern boundary",
        east: "Number - Eastern boundary",
        west: "Number - Western boundary",
        include_obsolete: "Boolean - Include obsolete resources"
      },
      infoSource: "https://www.hydroshare.org/hsapi/",
      example: "https://www.hydroshare.org/hsapi/resource?count=10&published=true"
    },
    resource_create: {
      paramFormat: {
        metadata: "Object - Resource metadata",
        abstract: "String - Resource abstract",
        keywords: "Array - Keywords for the resource",
        resource_type: "String - Type of resource (default: 'CompositeResource')"
      },
      infoSource: "https://www.hydroshare.org/hsapi/",
      example: "POST to https://www.hydroshare.org/hsapi/resource with appropriate parameters"
    },
    search: {
      paramFormat: {
        text: "String - Search text",
        author: "String - Filter by author",
        subject: "Array - Filter by subjects",
        abstract: "String - Filter by abstract content",
        resource_type: "String - Filter by resource type",
        coverage_type: "Array - Filter by coverage types",
        start_date: "String - Start date filter",
        end_date: "String - End date filter"
      },
      infoSource: "https://www.hydroshare.org/hsapi/",
      example: "https://www.hydroshare.org/hsapi/resource/search?text=water&resource_type=CompositeResource"
    }
  }
};

export { waterOneFlow, hydroShare, hisCentral };
