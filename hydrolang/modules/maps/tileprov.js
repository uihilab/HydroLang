
/**
 * Tiles provided by different sources. Please check out each source
 * info to see if there are other requirements needed for usage.
 * All sources included here do not require key, but there are sources
 * with other styles that might be useful. Credits to
 * https://github.com/leaflet-extras/leaflet-providers
 * @type {Object}
 */

export default {
  OpenStreetMap: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },

  OpenStreetMapDE: {
    url: "https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png",
    options: {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },

  OpenSeaMap: {
    url: "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
    options: {
      attribution:
        'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors',
    },
  },

  OpenPtMap: {
    url: "http://openptmap.org/tiles/{z}/{x}/{y}.png",
    options: {
      maxZoom: 17,
      attribution:
        'Map data: &copy; <a href="http://www.openptmap.org">OpenPtMap</a> contributors',
    },
  },
  OpenTopoMap: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 17,
      attribution:
        'Map data: {attribution.OpenStreetMap}, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    },
  },
  OpenRailwayMap: {
    url: "https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution:
        'Map data: {attribution.OpenStreetMap} | Map style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    },
  },

  OpenFireMap: {
    url: "http://openfiremap.org/hytiles/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution:
        'Map data: {attribution.OpenStreetMap} | Map style: &copy; <a href="http://www.openfiremap.org">OpenFireMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    },
  },
  SafeCast: {
    url: "https://s3.amazonaws.com/te512.safecast.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 16,
      attribution:
        'Map data: {attribution.OpenStreetMap} | Map style: &copy; <a href="https://blog.safecast.org/about/">SafeCast</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    },
  },

  Stamen: {
    url:
      "https://stamen-tiles-{s}.a.ssl.fastly.net/{variant}/{z}/{x}/{y}{r}.{ext}",
    options: {
      attribution:
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
        '<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; ' +
        "Map data {attribution.OpenStreetMap}",
      subdomains: "abcd",
      minZoom: 0,
      maxZoom: 20,
      variant: "toner",
      ext: "png",
    },
  },

  Esri: {
    url:
      "https://server.arcgisonline.com/ArcGIS/rest/services/{variant}/MapServer/tile/{z}/{y}/{x}",
    options: {
      variant: "World_Street_Map",
      attribution: "Tiles &copy; Esri",
    },
  },

  FreeMapSK: {
    url: "http://t{s}.freemap.sk/T/{z}/{x}/{y}.jpeg",
    options: {
      minZoom: 8,
      maxZoom: 16,
      subdomains: "1234",
      bounds: [
        [47.204642, 15.996093],
        [49.830896, 22.576904],
      ],
      attribution:
        '{attribution.OpenStreetMap}, vizualization CC-By-SA 2.0 <a href="http://freemap.sk">Freemap.sk</a>',
    },
  },
  MtbMap: {
    url: "http://tile.mtbmap.cz/mtbmap_tiles/{z}/{x}/{y}.png",
    options: {
      attribution: "{attribution.OpenStreetMap} &amp; USGS",
    },
  },

  OneMapSG: {
    url: "https://maps-{s}.onemap.sg/v3/{variant}/{z}/{x}/{y}.png",
    options: {
      variant: "Default",
      minZoom: 11,
      maxZoom: 18,
      bounds: [
        [1.56073, 104.11475],
        [1.16, 103.502],
      ],
      attribution:
        '<img src="https://docs.onemap.sg/maps/images/oneMap64-01.png" style="height:20px;width:20px;"/> New OneMap | Map data &copy; contributors, <a href="http://SLA.gov.sg">Singapore Land Authority</a>',
    },
  },

  GeoportailFrance: {
    url:
      "https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER={variant}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
    options: {
      attribution:
        '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
      bounds: [
        [-75, -180],
        [81, 180],
      ],
      minZoom: 2,
      maxZoom: 18,
      // Get your own geoportail apikey here : http://professionnels.ign.fr/ign/contrats/
      // NB : 'choisirgeoportail' is a demonstration key that comes with no guarantee
      apikey: "choisirgeoportail",
      format: "image/jpeg",
      style: "normal",
      variant: "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD",
    },
  },

  JusticeMap: {
    // Justice Map (http://www.justicemap.org/)
    // Visualize race and income data for your community, county and country.
    // Includes tools for data journalists, bloggers and community activists.
    url: "http://www.justicemap.org/tile/{size}/{variant}/{z}/{x}/{y}.png",
    options: {
      attribution:
        '<a href="http://www.justicemap.org/terms.php">Justice Map</a>',
      // one of 'county', 'tract', 'block'
      size: "county",
      // Bounds for USA, including Alaska and Hawaii
      bounds: [
        [14, -180],
        [72, -56],
      ],
    },
  },

  NASAGIBS: {
    url:
      "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/{variant}/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}",
    options: {
      attribution:
        "Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System " +
        '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
      bounds: [
        [-85.0511287776, -179.999999975],
        [85.0511287776, 179.999999975],
      ],
      minZoom: 1,
      maxZoom: 9,
      format: "jpg",
      time: "",
      tilematrixset: "GoogleMapsCompatible_Level",
    },
  },

  BasemapAT: {
    url:
      "https://maps{s}.wien.gv.at/basemap/{variant}/{type}/google3857/{z}/{y}/{x}.{format}",
    options: {
      maxZoom: 19,
      attribution:
        'Datenquelle: <a href="https://www.basemap.at">basemap.at</a>',
      subdomains: ["", "1", "2", "3", "4"],
      type: "normal",
      format: "png",
      bounds: [
        [46.35877, 8.782379],
        [49.037872, 17.189532],
      ],
      variant: "geolandbasemap",
    },
  },

  mapc: {
    url: "http://tiles.mapc.org/basemap/{z}/{x}/{y}.png",
    options: {
      attribution:
        'Tiles by <a href="http://mapc.org">MAPC</a>, Data by <a href="http://mass.gov/mgis">MassGIS</a>',
      maxZoom: 17,
      minZoom: 9,
    },
  },
};
