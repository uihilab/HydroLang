import * as mapsources from "../../modules/maps/mapsources.js";
import tileprov from "../../modules/maps/tileprov.js";
import _ from "../../modules/d3/d3.js";

var osmap;
var newlayers;

/**
 * Calls the map type according to the user input. The renderMap function is required
 * for map visualization.
 * @param {Object} config - Object with map type and additional parameters if required.
 * @returns {Promise}  source - Libraries appended to the header of webpage.
 */

function loader(config) {
  //For google maps API.
  if (config.maptype == "google") {
    const gApiKey = config.params.key;
    //call the class  constructor.
    const gmapApi = new mapsources.googlemapsapi(gApiKey);
    gmapApi.load();
  }

  //For leaflet API.
  if (config.maptype == "osm") {
    //call the class constructor.
    const mapper = new mapsources.leafletosmapi();
    mapper.load();
  }
}

/**
 * Renders different layers to be applied to a map. Considers
 * creation of layers as well as appending geoJSON layers.
 * @param {Object} config - description of the map type, layer type and data.
 * @returns {div} layer - layer appended to a map div that has already been created.
 */

function Layers(config) {
  if (config.maptype == "google") {
    geoJSON(config);
  } else if (config.maptype == "osm") {
    var layer;
    var layertype = config.layertype.type;
    newlayers = new L.FeatureGroup();

    if (layertype == "tile") {
      const tiletype = config.layertype.name;
      layer = new L.TileLayer(
        tileprov[tiletype].url,
        tileprov[tiletype].options
      );
      osmap.addLayer(layer);
    } else if (layertype == "geodata") {
      var geolay = geoJSON(config);
      newlayers.addLayer(geolay);
    } else if (layertype == "kml") {
      var kmlay = kml(config);
      newlayers.addLayer(kmlay);
    } else if (layertype == "removelayers") {
      osmap.clearLayers();
    } else {
      throw new Error("this is an error");
    }
  }
}

/**
 * Rendering function according to the map selected by the user.
 * It requires the library to be alraedy loaded to the header of the page.
 * @param {Object} config - The configuration file with maptype, lat, long
 * zoom.
 * @returns {div} map - Attaches the required map to a div element on the html
 */

function renderMap(config) {
  //import the info from user input as data for further usage.
  const data = {
    maptype: config.maptype,
    lat: config.lat,
    lon: config.lon,
    zoom: config.zoom,
    layertype: config.layertype,
  };

  //create div for element appending the map and add to data
  var container = document.createElement("div");
  container.id = "map";
  document.body.appendChild(container);

  if (data.maptype == "google") {
    const options = {
      mapTypeId: "terrain",
      zoom: data.zoom,
      center: {
        lat: data.lat,
        lng: data.lon,
      },
    };
    //apend a new map to the map variable.
    osmap = new google.maps.Map(container, options);
  } else if (data.maptype == "osm") {
    //assign the tile type to the data object for rendering.
    const tiletype = data.layertype.name;
    if (!tileprov.hasOwnProperty(tiletype)) {
      callback({
        info: "No tile found for the given specifications.",
      });
    }

    //import the tile options from the given data.
    osmap = new L.map(container.id);
    osmap.setView([data.lat, data.lon], data.zoom);
    this.Layers(data);
  }
}

/**
 * Creates different types of markers depending on what is required.
 * If the marker is for geoJSON layers in leaflet, the markers are added
 * by rendering them using D3 and creating a new SVG layers.
 * Notice how the geotype should be of one single feature.
 * @param {Object} data - data with geo information and map type.
 * @returns {div} geoJSON - appended to map.
 */

function geoJSON(data) {
  var inf = data.layertype.geodata;
  var geotype = inf.features[0].geometry.type;

  if (data.maptype == "google") {
    var geogoogle = osmap.data.addGeoJson(inf);
    return geogoogle;
  } else if (data.maptype == "osm") {
    var geopoint = () => {
      new L.svg({
        clickable: true,
      }).addTo(osmap);

      const overlay = _.d3.select(osmap.getPanes().overlayPane);
      const svg = overlay.select("svg").attr("pointer-events", "auto");

      const fig = svg
        .selectAll("circle")
        .attr("class", "fig")
        .data(inf.features)
        .join("circle")
        .attr("id", "dotties")
        .attr("fill", "steelblue")
        .attr("stroke", "black")
        .attr(
          "cx",
          (d) =>
            osmap.latLngToLayerPoint([
              d.geometry.coordinates[1],
              d.geometry.coordinates[0],
            ]).x
        )
        .attr(
          "cy",
          (d) =>
            osmap.latLngToLayerPoint([
              d.geometry.coordinates[1],
              d.geometry.coordinates[0],
            ]).y
        )
        .attr("r", 5)
        .on("mouseover", function () {
          _.d3
            .select(this)
            .transition()
            .duration("150")
            .attr("fill", "red")
            .attr("r", 10);
        })
        .on("mouseout", function () {
          _.d3
            .select(this)
            .transition()
            .duration("150")
            .attr("fill", "steelblue")
            .attr("r", 5);
        });

      const update = () =>
        fig
          .attr(
            "cx",
            (d) =>
              osmap.latLngToLayerPoint([
                d.geometry.coordinates[1],
                d.geometry.coordinates[0],
              ]).x
          )
          .attr(
            "cy",
            (d) =>
              osmap.latLngToLayerPoint([
                d.geometry.coordinates[1],
                d.geometry.coordinates[0],
              ]).y
          );
      osmap.on("zoomend", update);

      const bounds = fig.getBounds();
      osmap.fitBounds(bounds);

      console.log("im i working bro?");
    };

    var geopoly = () => {
      new L.svg({
        clickable: true,
      }).addTo(osmap);

      console.log("i might be here too");
      const overlay = _.d3.select(osmap.getPanes().overlayPane);
      const svg = overlay.select("svg").attr("pointer-events", "auto");
      const g = svg.append("g").attr("class", "leaflet-zoom-hide");

      const projectPoint = function (x, y) {
        const point = osmap.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
      };

      const projection = _.d3.geoTransform({
        point: projectPoint,
      });

      const pathCreator = _.d3.geoPath().projection(projection);

      const areaPaths = g
        .selectAll("path")
        .data(inf.features)
        .join("path")
        .attr("fill-opacity", 0.3)
        .attr("stroke", "black")
        .attr("z-index", 3000)
        .attr("stroke-width", 2.5)
        .on("mouseover", function (d) {
          _.d3.select(this).attr("fill", "red");
        })
        .on("mouseout", function (d) {
          _.d3.select(this).attr("fill", "black");
        });
      const onZoom = () => areaPaths.attr("d", pathCreator);
      onZoom();
      osmap.on("zoomend", onZoom);

      const bounds = areaPaths.getBounds();
      osmap.fitBounds(bounds);
      console.log("im i working bro?");
    };
    if (geotype == "Point") {
      geopoint();
    } else if (geotype == "Polygon") {
      geopoly();
    }
  }
}

/**
 * Creates layer of kml data passed through an object to an
 * existing map. Notice that the map most be already created
 * for the method to be used.
 * @param {Object} data - data object with maptype and KML data.
 * @returns {div} layer - appends layer to existing map.
 */

function kml(data) {
  if (data.map == "google") {
    var kmlLayer = new google.maps.KmlLayer(data.kml, {
      suppressInfoWindows: true,
      preserveViewport: false,
      map: osmap,
    });
    kmlLayer.addListener("click", function (event) {
      var content = event.featureData.infoWindowHtml;
      var testimonial = document.getElementById("capture");
      testimonial.innerHTML = content;
    });
  } else if (data.map == "osm") {
    const parser = new DOMParser();
    const kml = parser.parseFromString(data.kml, "text/xml");
    const track = new L.KML(kml);
    osmap.addLayer(track);

    const bounds = track.getBounds();
    osmap.fitBounds(bounds);
  }
}

/**
 * @param {example data type} example description
 * @returns {example data type} example description
 * @example
 * example usage code here
 */
function addMarker(data) {
  var rectangle;
  var circle;
  var line;
  var spline;

  if (data.map == "google") {
  }

  if (data.map == "osm") {
  }
}

export { loader, Layers, renderMap };
