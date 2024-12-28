/**
 * https://hydroinformatics.uiowa.edu/lab/fidas/data/functions
 * This API returns community scope flood damage for Cedar Rapids, Cedar Falls and Waterloo
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
};
