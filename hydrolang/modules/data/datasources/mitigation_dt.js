/**
 * https://hydroinformatics.uiowa.edu/lab/midas/communities
 * This API returns community scope flood damage for Cedar Rapids, Cedar Falls and Waterloo. . This is an example of the data retrieval for flood damage estimations to be set up in a map interface. This will/can be further expanded to accomodate to other locations and datatypes.
 * @type {Object}
 * @name mitigation_dt
 * @memberof datasources
 */

/**
 * @prop {string} sourceType - name of the community that will be queried. Currently supported communities are 'Cedar Rapids', 'Cedar Falls' and 'Waterloo'
 */

export default {

    sourceType: (sourceType, dataType) => {
      let endpoint = '';
      switch (dataType) {
        case "community_flood_damage":
          endpoint = "https://hydroinformatics.uiowa.edu/lab/midas/communities/";
          switch (sourceType) {
            case "Waterloo":
              endpoint += "waterloo.json";
              break;
            case "Cedar Rapids":
              endpoint += "cedar_rapids.json";
              break;
            case "Cedar Falls":
              endpoint += "cedar_falls.json";
              break;
            default:
              break;
          }
          break;
        case "community_flood_inundation":
          endpoint = "https://hydroinformatics.uiowa.edu/lab/midas/communities/";
          switch (sourceType) {
            case "Waterloo":
              endpoint += "waterloo.geojson";
              break;
            case "Cedar Rapids":
              endpoint += "cedar_rapids.geojson";
              break;
            case "Cedar Falls":
              endpoint += "cedar_falls.geojson";
              break;
            default:
              break;
          }
          break;
        case "property_mitigation_cost":
          endpoint = "https://hydroinformatics.uiowa.edu/lab/midas/jsons/mitigations.json";
          break;
        default:
          break;
      }
      return endpoint;
    },
  
    community_flood_damage: {
      endpoint: "https://hydroinformatics.uiowa.edu/lab/midas/communities/<community>.json",
      params: {},
      "data-fields": {},
      methods: {
        type: "json",
        method: "GET",
      },
    },
  
    community_flood_inundation: {
      endpoint:
        "https://hydroinformatics.uiowa.edu/lab/midas/communities/<community>.geojson",
      params: {},
      "data-fields": {},
      methods: {
        type: "json",
        method: "GET",
      },
    },
  
    property_mitigation_cost: {
      endpoint: "https://hydroinformatics.uiowa.edu/lab/midas/jsons/mitigations.json",
      params: {},
      "data-fields": {},
      methods: {
        type: "json",
        method: "GET",
      },
    },
  
    requirements: {
      needProxy: true,
      requireskey: false,
    },
  };
  