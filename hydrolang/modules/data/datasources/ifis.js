/**
 * https://ifis.iowafloodcenter.org/ifis/ws/
 * This API returns data from the IFIS web service.
 * @type {Object}
 * @name IFIS
 * @memberof datasources
 */

export default {
  //Available data stream from selected locations in Iowa.
  "stream-data": {
    endpoint: "http://ifis.iowafloodcenter.org/ifis/ws/sites.php?",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      site: null,
      period: null,
      format: null,
    },
    methods: {
      type: "xml",
      method: "GET",
    },
  },

  //Sensor water elevation.
  "sensor-elevation": {
    endpoint: "http://ifis.iowafloodcenter.org/ifis/ws/elev_sites.php?",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      site: null,
      period: null,
      format: null,
    },
    methods: {
      type: "xml",
      method: "GET",
    },
  },

  //Soil moisture data on rain gauges.
  "soil-moisture": {
    endpoint: "http://ifis.iowafloodcenter.org/ifis/ws/elev_sites.php?",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      site: null,
      period: null,
      format: null,
    },
    methods: {
      type: "xml",
      method: "GET",
    },
  },

  requirements: {
    needProxy: true,
    requireskey: false,
  },
  info: {
    returnFormats: "xml",
    MoreInfo: "https://ifis.iowafloodcenter.org/ifis/ws/",
    About: "This API returns data from the IFIS web service."
  },
  "endpoint-info": {
    "stream-data": {
      paramFormat: {
        site: "String - Site code (e.g., 'AMEI4')",
        period: "String - Time period (e.g., '7d' for 7 days)",
        format: "String - Output format (xml is default)"
      },
      infoSource: "https://ifis.iowafloodcenter.org/ifis/ws/",
      example: "http://ifis.iowafloodcenter.org/ifis/ws/sites.php?site=AMEI4&period=7d"
    },
    "sensor-elevation": {
      paramFormat: {
        site: "String - Site code (e.g., 'AMEI4')",
        period: "String - Time period (e.g., '7d' for 7 days)",
        format: "String - Output format (xml is default)"
      },
      infoSource: "https://ifis.iowafloodcenter.org/ifis/ws/",
      example: "http://ifis.iowafloodcenter.org/ifis/ws/elev_sites.php?site=CR02&period=7d"
    },
    "soil-moisture": {
      paramFormat: {
        site: "String - Site code (e.g., 'SM01')",
        period: "String - Time period (e.g., '7d' for 7 days)",
        format: "String - Output format (xml is default)"
      },
      infoSource: "https://ifis.iowafloodcenter.org/ifis/ws/",
      example: "http://ifis.iowafloodcenter.org/ifis/ws/elev_sites.php?site=SM01&period=7d"
    }
  }
};
