/**
 * https://hydroinformatics.uiowa.edu/lab/fidas/data/functions
 * This API returns community scope flood damage for Cedar Rapids, Cedar Falls and Waterloo. This is an example of the data retrieval for flood damage estimations to be set up in a map interface. This will/can be further expanded to accomodate to other locations and datatypes.
 * @type {Object}
 * @name flooddamage_dt
 * @memberof datasources
 */

/**
 * @prop {string} sourceType - name of the community that will be queried. 
 * Currently supported communities are 'Bettendorf', 'Cedar Rapids', 'Cedar Falls', 'Davenport', 'Iowa City', 'Waterloo', 'Waverly'
 */

export default {
    sourceType: (sourceType, dataType) => {
      let endpoint = "https://hydroinformatics.uiowa.edu/lab/fidas/data/";
      let val = "";
      if (dataType === "x100_year") {
        val += "/flood_extent_100yr.geojson";
        switch (sourceType) {
          case "Bettendorf":
            endpoint += "bettendorf" + val;
            break;
          case "Cedar Falls":
            endpoint += "cedar_falls" + val;
            break;
          case "Cedar Rapids":
            endpoint += "cedar_rapids" + val;
            break;
          case "Davenport":
            endpoint += "davenport" + val;
            break;
          case "Iowa City":
            endpoint += "iowa_city" + val;
            break;
          case "Waterloo":
            endpoint += "waterloo" + val;
            break;
          case "Waverly":
            endpoint += "waverly" + val;
            break;
          default:
            break;
        }
      }
      if (dataType === "x500_year") {
        val += "/flood_extent_500yr.geojson";
        switch (sourceType) {
          case "Bettendorf":
            endpoint += "bettendorf" + val;
            break;
          case "Cedar Falls":
            endpoint += "cedar_falls" + val;
            break;
          case "Cedar Rapids":
            endpoint += "cedar_rapids" + val;
            break;
          case "Davenport":
            endpoint += "davenport" + val;
            break;
          case "Iowa City":
            endpoint += "iowa_city" + val;
            break;
          case "Waterloo":
            endpoint += "waterloo" + val;
            break;
          case "Waverly":
            endpoint += "waverly" + val;
            break;
          default:
            break;
        }
      }
      if (dataType === "utilities") {
          val += "/utility.geojson";
          switch (sourceType) {
            case "Cedar Falls":
              endpoint += "cedar_falls" + val;
              break;
            default:
              break;
          }
        }
        if (dataType === "vehicles") {
          val += "/vehicle_Day_Night.geojson";
          switch (sourceType) {
            case "Bettendorf":
              endpoint += "bettendorf" + val;
              break;
            case "Cedar Falls":
              endpoint += "cedar_falls" + val;
              break;
            case "Cedar Rapids":
              endpoint += "cedar_rapids" + val;
              break;
            case "Davenport":
              endpoint += "davenport" + val;
              break;
            case "Iowa City":
              endpoint += "iowa_city" + val;
              break;
            case "Waterloo":
              endpoint += "waterloo" + val;
              break;
            case "Waverly":
              endpoint += "waverly" + val;
              break;
            default:
              break;
          }
        }
        if (dataType === "buildings") {
          val += "/buildings.geojson";
          switch (sourceType) {
            case "Bettendorf":
              endpoint += "bettendorf" + val;
              break;
            case "Cedar Falls":
              endpoint += "cedar_falls" + val;
              break;
            case "Cedar Rapids":
              endpoint += "cedar_rapids" + val;
              break;
            case "Davenport":
              endpoint += "davenport" + val;
              break;
            case "Iowa City":
              endpoint += "iowa_city" + val;
              break;
            case "Waterloo":
              endpoint += "waterloo" + val;
              break;
            case "Waverly":
              endpoint += "waverly" + val;
              break;
            default:
              break;
          }
        }
        if (dataType === "bridges") {
          val += "/bridge_locations.geojson";
          switch (sourceType) {
            case "Cedar Falls":
              endpoint += "cedar_falls" + val;
              break;
            case "Cedar Rapids":
              endpoint += "cedar_rapids" + val;
              break;
            case "Davenport":
              endpoint += "davenport" + val;
              break;
            case "Waverly":
              endpoint += "waverly" + val;
              break;
            default:
              break;
          }
        }
        
      return endpoint;
    },
  
    x100_year: {
      endpoint:
        "https://hydroinformatics.uiowa.edu/lab/fidas/data/<community>/<source>.json",
      params: {},
      "data-fields": {},
      methods: {
        type: "text",
        method: "GET",
      },
    },
  
    x500_year: {
      endpoint:
        "https://hydroinformatics.uiowa.edu/lab/fidas/data/<community>/<source>.json",
      params: {},
      "data-fields": {},
      methods: {
        type: "text",
        method: "GET",
      },
    },
  
    vehicles: {
      endpoint:
        "https://hydroinformatics.uiowa.edu/lab/fidas/data/<community>/<source>.json",
      params: {},
      "data-fields": {},
      methods: {
        type: "text",
        method: "GET",
      },
    },
    utilities: {
      endpoint:
        "https://hydroinformatics.uiowa.edu/lab/fidas/data/<community>/<source>.json",
      params: {},
      "data-fields": {},
      methods: {
        type: "text",
        method: "GET",
      },
    },
    buildings: {
      endpoint:
        "https://hydroinformatics.uiowa.edu/lab/fidas/data/<community>/<source>.json",
      params: {},
      "data-fields": {},
      methods: {
        type: "text",
        method: "GET",
      },
    },
  
    bridges: {
      endpoint:
        "https://hydroinformatics.uiowa.edu/lab/fidas/data/<community>/<source>.json",
      params: {},
      "data-fields": {},
      methods: {
        type: "text",
        method: "GET",
      },
    },
  
    requirements: {
      needProxy: true,
      requireskey: false,
    },
    info: {
      returnFormats: "text",
      MoreInfo: "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions",
      About: "This API returns community scope flood damage for Cedar Rapids, Cedar Falls and Waterloo. This is an example of the data retrieval for flood damage estimations to be set up in a map interface."
    },
    "endpoint-info": {
      x100_year: {
        paramFormat: {
          sourceType: "String - Name of the community (e.g., 'Cedar Rapids', 'Cedar Falls', 'Waterloo', 'Bettendorf', 'Davenport', 'Iowa City', 'Waverly')"
        },
        infoSource: "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions",
        example: "Usage with sourceType function: sourceType('Cedar Rapids', 'x100_year') returns 'https://hydroinformatics.uiowa.edu/lab/fidas/data/cedar_rapids/flood_extent_100yr.geojson'"
      },
      x500_year: {
        paramFormat: {
          sourceType: "String - Name of the community (e.g., 'Cedar Rapids', 'Cedar Falls', 'Waterloo', 'Bettendorf', 'Davenport', 'Iowa City', 'Waverly')"
        },
        infoSource: "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions",
        example: "Usage with sourceType function: sourceType('Cedar Rapids', 'x500_year') returns 'https://hydroinformatics.uiowa.edu/lab/fidas/data/cedar_rapids/flood_extent_500yr.geojson'"
      },
      vehicles: {
        paramFormat: {
          sourceType: "String - Name of the community (e.g., 'Cedar Rapids', 'Cedar Falls', 'Waterloo', 'Bettendorf', 'Davenport', 'Iowa City', 'Waverly')"
        },
        infoSource: "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions",
        example: "Usage with sourceType function: sourceType('Cedar Rapids', 'vehicles') returns 'https://hydroinformatics.uiowa.edu/lab/fidas/data/cedar_rapids/vehicle_Day_Night.geojson'"
      },
      utilities: {
        paramFormat: {
          sourceType: "String - Name of the community (currently only 'Cedar Falls' is supported)"
        },
        infoSource: "htt ps://hydroinformatics.uiowa.edu/lab/fidas/data/functions",
        example: "Usage with sourceType function: sourceType('Cedar Falls', 'utilities') returns 'https://hydroinformatics.uiowa.edu/lab/fidas/data/cedar_falls/utility.geojson'"
      },
      buildings: {
        paramFormat: {
          sourceType: "String - Name of the community (e.g., 'Cedar Rapids', 'Cedar Falls', 'Waterloo', 'Bettendorf', 'Davenport', 'Iowa City', 'Waverly')"
        },
        infoSource: "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions",
        example: "Usage with sourceType function: sourceType('Cedar Rapids', 'buildings') returns 'https://hydroinformatics.uiowa.edu/lab/fidas/data/cedar_rapids/buildings.geojson'"
      },
      bridges: {
        paramFormat: {
          sourceType: "String - Name of the community (e.g., 'Cedar Rapids', 'Cedar Falls', 'Davenport', 'Waverly')"
        },
        infoSource: "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions",
        example: "Usage with sourceType function: sourceType('Cedar Rapids', 'bridges') returns 'https://hydroinformatics.uiowa.edu/lab/fidas/data/cedar_rapids/bridge_locations.geojson'"
      }
    }
  };
  