/**
 * https://waterservices.usgs.gov/rest/IV-Service.html
 * This API returns stream stages for US
 * @type {Object}
 * @name USGS
 * @memberof datasources
 */

 export default {
  "instant-values": {
    endpoint: "http://waterservices.usgs.gov/nwis/iv/",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      format: null,
      site: null,
      stateCd: null,
      huc: null,
      countyCd: null,
      startDT: null,
      endDT: null,
      // and more...
    },
    "data-fields": {
      // "output-data-field-1": null,
      // enter data field here
    },
    methods:{
      type: "json",
      method: "GET"
    }
  },

  "daily-values": {
    endpoint: "http://waterservices.usgs.gov/nwis/dv/",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      format: null,
      site: null,
      stateCd: null,
      huc: null,
      countyCd: null,
      startDT: null,
      endDT: null,
      // and more...
    },
    "data-fields": {
      // "output-data-field-1": null,
      // enter data field here
    },
    methods:{
      type: "json",
      method: "GET"
    }
  },

  "groundwater": {
    endpoint: "http://waterservices.usgs.gov/nwis/gwlevels/",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      format: null,
      site: null,
      stateCd: null,
      huc: null,
      countyCd: null,
      startDT: null,
      endDT: null,
      // and more...
    },
    "data-fields": {
      // "output-data-field-1": null,
      // enter data field here
    },
    methods:{
      type: "json",
      method: "GET"
    }
  },

  requirements: {
    needProxy: true,
    requireskey: false,
  },

  /* DATA SOURCE 2 */

  /* DATA SOURCE ... */
};
