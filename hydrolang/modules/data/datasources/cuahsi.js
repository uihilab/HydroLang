/**
 * CUAHSI available REST endpoints. This collection includes:
 * waterOneFlow, hisCentral and HydroShare
 * @type {Object}
 * @memberof datasources
 */

/**
 * Data endpoints for the CUAHSI HIS WaterOneFlow services. The services accessed
 * require POST requests through SOAP protocol. The endpoints are compliant with version 1.1 of the service.
 * More information about the request can be found in the following links:
 * https://cuahsi.zendesk.com/hc/en-us/articles/205153157-HydroServer-and-the-WaterOneFlow-Web-Services-API
 * https://hydroportal.cuahsi.org/ipswich/
 *
 * Main request site
 * https://hydroportal.cuahsi.org/
 *
 */
const waterOneFlow = {
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

      default:
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
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
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
  GetSiteInfoMultpleObject: {
    //Returns site metadata, given a specific site number for multiple sites
    //values passed as strings.
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSiteInfoMultpleObject
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
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
    //Returns site metadata, given a specific site number.
    //pass value as string
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSiteInfoObject
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
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
    //Given an array of sites, returns the metadata for each site.
    //Pass values as array of strings
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSites
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
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
    //Given a site, returns metadata falling within a bounding box.
    //Passed values must be specified within the request object (i.e. {west: somevalue, north, somevalue...})
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSitesByBoxObject
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
    body: (prop) => {
      return `<GetSitesByBoxObject xmlns="${waterOneFlow.action}"><west>${prop["west"]}</west><south>${prop["south"]}</south><east>${prop["east"]}</east><north>${prop["north"]}</north><IncludeSeries>true</IncludeSeries></GetSitesByBoxObject>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetSitesObject: {
    //Given multiple sites, returns site metadata.
    //Pass values as array of strings
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetSitesObject
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
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
    //Returns a timeseries with given a location and timespan.
    //Pass values as array of strings in the following positions:
    //{location: string, variable: string, startDate: string, endDate: string}
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetValues
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
    body: (prop) => {
      return `<GetValues xmlns="${waterOneFlow.action}"><location>NetworkName:${prop["location"]}</location><variable>NetworkName:${prop["variable"]}</variable><startDate>${prop["startDate"]}</startDate><endDate>${prop["endDate"]}</endDate></GetValues>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetValuesForASiteObject: {
    //Pass values as array of strings in the following positions:
    //{site: string, startDate: string , endDate: string}
    //Example found in
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetValuesForASiteObject
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
    body: (prop) => {
      return `<GetValuesForASiteObject xmlns="${waterOneFlow.action}"><site>NetworkName:${prop["site"]}</site><startDate>${prop["startDate"]}</startDate><endDate>${prop["endDate"]}</endDate></GetValuesForASiteObject>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetValuesObject: {
    //Returns a timeseries with given a location and timespan.
    //Pass values as array of strings in the following positions:
    //{location: string, variable: string, startDate: string, endDate: string}
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetValuesObject
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
    body: (prop) => {
      return `<GetValuesObject xmlns="${waterOneFlow.action}"><location>NetworkName:${prop["location"]}</location><variable>NetworkName:${prop["variable"]}</variable><startDate>${prop["startDate"]}</startDate><endDate>${prop["endDate"]}</endDate></GetValuesObject>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetVariableInfo: {
    //Returns a variable's name, given specific information for the variable.
    //pass value as string
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetVariableInfo
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
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
    //Returns a variable's name, given specific information for the variable.
    //pass value as string
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetVariableInfoObject
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
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
    //Get all the available variables from the API.
    //No parameters required
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetVariables
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
    body: () => {
      return `<GetVariables xmlns="${waterOneFlow.action}"></GetVariables>`;
    },
    methods: {
      type: "soap",
      method: "POST",
    },
  },
  GetVariablesObject: {
    //Get all the available variables from the API.
    //No parameters required
    //Example found in:
    //https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx?op=GetVariableObject
    endpoint: "https://hydroportal.cuahsi.org/ipswich/cuahsi_1_1.asmx",
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
};

/**
 * HIS Central serves as the main functions that can be used for a specific resource. It allows for users to obtain specific data from a resource
 * without the need of manipulation a large chunk of data, but rather, allow a function to query the data. Each function has its own usage and is constrained by
 * the parameters passed within HydroLang functions. More information about HIS Central can be found in the following link:
 * https://his.cuahsi.org/
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
};

//HydroShare API, enabling acccess to data resources, examples, models and more hosted within the HydroShare sphere.
//Swagger example found in the following link:
//https://www.hydroshare.org/hsapi/
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
};

export { waterOneFlow, hydroShare, hisCentral };
