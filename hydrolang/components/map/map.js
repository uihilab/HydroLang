import * as mapsources from "../../modules/maps/mapsources.js";
import tileprov from "../../modules/maps/tileprov.js";
import _ from "../../modules/d3/d3.js";

//Controllers, map and layers
var osmap;
var layercontroller;
var baselayers = {};
var overlayers = {};
var drawings;
var drawControl;

/**
 * Calls the map type according to the user input. The renderMap function is required
 * for map visualization.
 * @async
 * @function loader
 * @memberof maps
 * @param {Object} config - Object with map type and additional parameters if required.
 * @example //config = {maptype: "osm"}
 * @returns {Promise}  Libraries appended to the header of webpage.
 */

async function loader(config) {
  //For google maps API.
  if (config.maptype == "google") {
    const gApiKey = config.params.key;
    //call the class  constructor.
    const gmapApi = new mapsources.googlemapsapi(gApiKey);
    await gmapApi.load();
  }

  //For leaflet API.
  if (config.maptype == "osm") {
    //call the class constructor.
    const mapper = new mapsources.leafletosmapi();
    await mapper.load();
  }
}

/**
 * Layer function for appending tiles, geodata, markers, kml or drawing tools to a map.
 * @function Layers
 * @memberof maps
 * @param {Object} config - description of the map type, layer type and data.
 * @returns {Object} layer appended to a map div that has already been created.
 */

function Layers(config) {

  //in case the map required is google.
  if (config.maptype == "google") {
    geoJSON(config);
  }
  //in case the map required is osm. 
  else if (config.maptype == "osm") {
    var layer;
    var layertype = config.layertype.type;
    var layername = config.layertype.name;
    if (layercontroller === undefined) {
      layercontroller = new L.control.layers();
    } else {
      layercontroller = layercontroller;
    }

    if (layertype === "tile") {
      layer = new L.TileLayer(
        tileprov[layername].url,
        tileprov[layername].options
      );
      Object.assign(baselayers, {
        [layername]: layer
      })
      layercontroller.addBaseLayer(layer, layername).addTo(osmap);
      
    } else if (layertype === "geodata") {
      layer = geoJSON(config);
      Object.assign(overlayers, {[layername]: layer})
      layercontroller.addOverlay(layer, layername).addTo(osmap);
      osmap.fitBounds(layer.getBounds());

    } else if (layertype === "marker") {
      layer = addMarker(config);
      Object.assign(overlayers, {[layername]: layer})
      layercontroller.addOverlay(layer, layername).addTo(osmap);

    } else if (layertype === "kml") {
      layer = kml(config);
      Object.assign(overlayers, {[layername]: layer})
      layercontroller.addOverlay(layer, layername).addTo(osmap);
      osmap.fitBounds(layer.getBounds());

    } else if (layertype === "draw"){
      drawings = new L.FeatureGroup();
      draw(config);
      osmap.addLayer(drawings);

    } else if (layertype === "removelayers") {
      if (baselayers.hasOwnProperty(layername)) {
        osmap.removeLayer(baselayers[layername]);
        layercontroller.removeLayer(baselayers[layername]);
        delete baselayers[layername];

      } else if (overlayers.hasOwnProperty(layername)) {
        osmap.removeLayer(overlayers[layername]);
        layercontroller.removeLayer(overlayers[layername]);
        delete overlayers[layername];
        
      } else if (layername === "map") {
        osmap.remove();

      } else if (layername === "draw"){
        drawControl.remove()
      } else {
        alert("there is no layer with that name!");
      };
    }
  }
}

/**
 * Rendering function according to the map selected by the user.
 * It requires the library to be alraedy loaded to the header of the page.
 * @function renderMap
 * @memberof maps
 * @param {Object} config - The configuration file with maptype, lat, long
 * zoom.
 * @example // var mapconfig = {maptype: "osm", lat: "40", lon: "-100", zoom: "13", layertype: {type: "tile", name: "OpenStreetMap"}} //
 * @returns {Object} Attaches the required map to a div element on the html file.
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
    //append a new map to the map variable.
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

    var popup = new L.popup();

    var onMapClick = (e => {
      popup.setLatLng(e.latlng).setContent(`You clicked the map at ${e.latlng.toString()}`).openOn(osmap);
    })
    osmap.on('click', onMapClick)
  }
}

/**
 * Creates different types of markers depending on what is required.
 * The geotype should be of one single feature.
 * @function geoJSON
 * @memberof maps
 * @param {Object} data - data with geo information and map type.
 * @returns {Object} geoJSON rendered file.
 */

function geoJSON(data) {
  var inf = data.layertype.data;
  var geotype = inf.features[0].geometry.type;

  if (data.maptype == "google") {
    var geogoogle = osmap.data.addGeoJson(inf);
    return geogoogle;
  } else if (data.maptype == "osm") {

    var onEachFeature = (feature, layer) => {
      if (feature.properties && feature.properties.Name && feature.properties.Lat && feature.properties.Lon) {
        layer.bindPopup(feature.properties.Name + "(" + feature.properties.Lat + "," + feature.properties.Lon + ")", );
      }
    }
    var geopoint = () => {
      var style = {
        radius: 5,
        fillColor: "#2ce4f3",
        color: "#0dc1d3",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      };
      var xo = new L.geoJSON(inf, {
        pointToLayer: function (feature, latlng) {
          return new L.circleMarker(latlng, style)
        },
        onEachFeature: onEachFeature,
        style: style
      })
      return xo;
    };

    var geopoly = () => {
      var style = {
        weight: 2,
        color: "#432"
      };
      var xa = new L.geoJSON(inf, {
        style: style,
        onEachFeature: onEachFeature
      })
      return xa;
    };
    if (geotype == "Point") {
      return geopoint();
    } else if (geotype == "Polygon") {
      return geopoly();
    }
  }
}

/**
 * Creates layer of kml data passed through an object to an
 * existing map. Notice that the map most be already created
 * for the method to be used.
 * @function kml
 * @memberof maps
 * @param {Object} data - data object with maptype and KML data.
 * @returns {Object} appends layer to existing map.
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
    return track;
  }
}

/**
 * Adds a new marker to the map, given coordinates, map type and marker type.
 * @function addMarker
 * @memberof maps
 * @param {Object} data - configuration with maptype, 
 * @returns {Object} layer object.
 */
function addMarker(data) {
  var layer;

  if (data.maptype === "google") {}

  if (data.maptype === "osm") {
    var type = data.layertype.markertype;
    var coord = data.layertype.coord;

    switch (type) {
      case "rectangle":
        layer = new L.rectangle(coord, markerstyles('osm', 'rectangle'));
        break;
      case "circle":
        layer = new L.circle(coord, markerstyles('osm', 'circle'));
        break;
      case "circlemarker":
        layer = new L.circleMarker(coord, markerstyles('osm', 'circlemarker'));
        break;
      case "polyline":
        layer = new L.polyline(coord, markerstyles('osm', 'polyline'));
        break;
      case "polygon":
        layer = new L.polygon(coord, markerstyles('osm', 'polygon'));
        break;
      case "marker":
        layer = new L.marker(coord, markerstyles('osm', 'marker'));
        break;
      default:
        alert("no markers with that name");
    }
  }
  return layer
}

/**
 * Creaes different styles for depending on the marker that has been selected for drawing.
 * @function markerstyles
 * @memberof maps
 * @param {string} map - map type: google or osm.
 * @param {string} fig - type of marker to be drawn.
 * @returns {Object} new styles that are used for drawing a marker.
 */

 function markerstyles (map, fig){
  var layer;

   if (map === "google") {
   }

   if (map === "osm") {
     var type = fig;

     switch (type) {
       case "rectangle":
         layer = {
           weight: 2,
           color: "#e1e1100",
         }
         break;
       case "circle":
         layer = {
            radius: 200,
            fillColor: "#2ce4f3",
            color: "#0dc1d3",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.6
          }
          break;
        case "circlemarker":
          layer = {
              radius: 5,
              fillColor: "#2ce4f3",
              color: "#0dc1d3",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.6
            }
            break;
        case "polyline":
          layer = {
            weight: 1,
            color: '#432',
            opacity: 1
          }
          break;
        case "polygon":
          layer = {
            weight: 2,
            color: "#e1e1100",
            opacity: 1
          };
          break;
        case "marker":
          layer ={
            markerIcon: null,
            zIndexOffset: 2000,
          }
          break;
        default:
          break;
        }
      }
   return layer;
 }

 /**
  * @function draw
  * @memberof maps
  * @param {Object} config - configuration of the map.
  * @returns {Object} toolkit added to map.
  */

  function draw(config) {
    if (config.maptype == "google") {} 
    
    else if (config.maptype == "osm") {
      var options = {
        position: 'topleft',
        scale: true,
        draw: {
          polyline: {
            metric: true,
            shapeOptions: {
              color: '#bada55',
            }
          },
          polygon: {
            allowIntersection: false,
            metric: true,
            drawError: {
              color: '#e1e1100',
              message: '<strong> You cant do that!',
            },
            shapeOptions: {
              color: '#432'
            }
          },
          rectangle: {
            allowIntersection: false,
            metric: true,
            drawError: {
              color: '#e1e1100',
              message: '<strong> You cant do that!'
            },
            shapeOptions: {
              color: '#432'
            }
          },
          circle: {
            metric: true,
            feet: true,
            shapeOptions: {
              color: '#432'
            }
          },
          marker: {
            markerIcon: null,
            zIndexOffset: 2000
          }
        },
        edit: {
          featureGroup: drawings,
          remove: true
        }
      }

      drawControl = new L.Control.Draw(options);
      osmap.addControl(drawControl)

      osmap.on('draw:created', function (e) {
        var type = e.layerType,
            layer = e.layer;
        if (type === 'marker') {
          layer.on('click', function(){
            layer.bindPopup(`Marker coordinates: ${layer.getLatLng()}.`);
          })
        }
        else if(type === 'rectangle') {
        layer.on('click', function(){
          layer.bindPopup(`Rectangle corners coordinates: ${layer.getLatLngs()}.`)
          })
        }       
        else if (type === 'circle'){
          layer.on('click', function(){
            layer.bindPopup(`Circle coordinates: ${layer.getLatLng()} with radius: ${layer.getRadius()}.`)
          })
        }
        else if(type === 'polygon') {
          layer.on('click', function(){
            layer.bindPopup(`Polygon corners coordinates: ${layer.getLatLngs()} with area.`)
            })
          } 
        drawings.addLayer(layer)
      })
    }
  }

  /**
 * Module for mapping data.
 * @module maps
 */

export {
  loader,
  Layers,
  renderMap,
};