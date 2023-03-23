import * as mapsources from "../../external/maps/mapsources.js";
import tileprov from "../../external/maps/tileprov.js";
import _ from "../../external/d3/d3.js";
import * as divisors from "../visualize/divisors.js";

/**
 * Module for mapping data.
 * @class map
 */

//Controllers, map and layers
//Most variables are left as internal variables for control when the hydrolang instance is live.
var osmap,
layercontroller,
drawings,
drawControl;

//Global variables for library usages.
window.baselayers = {};
window.overlayers = {};

/**
 * Calls the map type according to the user input. The renderMap function is required
 * for map visualization.
 * @function loader
 * @memberof map
 * @param {Object} params - Contains: maptype (google or osm[leaflet])
 * @param {Object} args: Contains: key (required by google)
 * @returns {Element}  Libraries appended to the header of webpage.
 * @example
 * hydro.map.loader({params: {maptype: 'osm'}, args: {key: 'somekey'}})
 */

async function loader({ params, args, data } = {}) {
  //For google maps API.
  if (params.maptype == "google") {
    const gApiKey = args.key,
    //call the class  constructor.
    gmapApi = new mapsources.googlemapsapi(gApiKey);
    await gmapApi.load();
  }

  //For leaflet API.
  if (params.maptype == "leaflet") {
    //call the class constructor.
    const mapper = new mapsources.leafletosmapi();
    await mapper.load();
  }
}

/**
 * Layer function for appending tiles, geodata, markers, kml or drawing tools to a map.
 * @function Layers
 * @memberof map
 * @param {Object} args - Contains: type (tile, geodata, markers, kml, draw, removelayers), output (name of layer)
 * @param {Object} data - Contains: data as a JS array.
 * @returns {Element} Layer appended to a map div that has already been created. The layer is added into the global
 * layer object.
 * @example
 * hydro.map.Layers({args: {type: 'tile', output: 'someName'}, data: [data1, data2...]})
 * hydro.map.Layers({args: {type: 'geodata', output: 'someName'}, data: {somegeoJSON}})
 * hydro.map.Layers({args: {type: 'marker', output: 'someName'}, data: [markerLat, marketLon]})
 */

async function Layers({ params, args, data } = {}) {
  var layertype,
  //The mapconfig is set to be as OSM.
  mapconfig = { maptype: "leaflet" },
  //Creating configuration object for rendering layers.
  //If a property is not found, is simply set to null.
  //Setting it up as default behavior.
  layertype = {
    type: args.type,
    markertype: args.type,
    geotype: args.geo,
    data: data,
    name: args.output,
    coord: data,
  };

  try {
    if (mapconfig.maptype === "google") {
    }
    //in case the map required is osm.
    else if (mapconfig.maptype === "leaflet") {
      var layer,
      type = layertype.type,
      layername = layertype.name;
    
    await osmap.whenReady(function () {
      if (typeof layercontroller === "undefined") {
        //Defining the controller for the layers.
        layercontroller = new L.control.layers().addTo(osmap);
      }

      if (type === "tile") {
        //Defining a new layertype
        layer = new L.TileLayer(
          tileprov[layername].url,
          tileprov[layername].options
        );
        Object.assign(baselayers, {
          [layername]: layer,
        });
        osmap.addLayer(layer)
        layercontroller.addBaseLayer(layer, layername);
      }


      if (type === "geodata") {
        //Caller for the geoJSON data renderer.
        layer = geoJSON({ params: mapconfig, data: data });
        Object.assign(overlayers, { [layername]: layer });
        layercontroller.addOverlay(layer, layername);
        //osmap.fitBounds(layer.getBounds());
      } else if (type === "marker") {
        //Caller for the marker renderer.
        layer = addMarker({ params: mapconfig, args: layertype });
        Object.assign(overlayers, { [layername]: layer });
        osmap.addLayer(layer)
        layercontroller.addOverlay(layer, layername);
      } else if (type === "kml") {
        //Caller for the KML data renderer.
        layer = kml({ params: mapconfig, data: data });
        Object.assign(overlayers, { [layername]: layer });
        layercontroller.addOverlay(layer, layername);
        //osmap.fitBounds(layer.getBounds());
      } else if (type === "draw") {
        //Caller for drawing tool renderer.
        drawings = new L.FeatureGroup();
        draw({ params: mapconfig });
        osmap.addLayer(mapdrawings);
      } else if (type === "removelayers") {
        //If using HydroLang-ML, there is no need to use this functions since the layers that are not to be included in a map
        //Are simply not added into the request as a layer.
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
        } else if (layername === "draw") {
          drawControl.remove();
        } else {
          console.log("there is no layer with that name!");
        }
      }
    });
  }
  } catch (error) {
    console.error(`There was an error when generating the map`,error)
  }
}

/**
 * Rendering function according to the map selected by the user.
 * Currently loads everything with the Leaflet render and OSM tile. The funciton loads the library to the header.
 * It automatically is zoomed to 15.
 * @function renderMap
 * @memberof map
 * @param {Object} param - Contains: null object, not necessary to be passed.
 * @param {Object} args - Contains: maptype (osm, google maps), lat, lon
 * @returns {Element} Map object appended to the web page.
 * zoom.
 * @example
 * hydro.map.renderMap({params: {}, args: {{maptype: "leaflet", lat: "40", lon: "-100"}})
 */

async function renderMap({ params, args, data } = {}) {
  //Reading layer types and map configurations from the user's parameters inputs.
  var layertype,
  mapconfig = {
    maptype: args.maptype,
    lat: args.lat,
    lon: args.lon,
    zoom: 15,
  };

  //Default scenario using Open Street Maps over Iowa Flood Center.
  if (
    typeof mapconfig.maptype === "undefined" ||
    typeof mapconfig.maptype === null ||
    !params
  ) {
    layertype = {
      type: "tile",
      output: "OpenStreetMap",
    };

    mapconfig = {
      maptype: "leaflet",
      lat: 41.6572,
      lon: -91.5414,
      zoom: 13,
    };
  }
  //Rendering the map into screen.
  //await loader({ params: mapconfig });

  //Creating internal divisors for the requested maps. Each map call would have its own div inside the maps
  //larger div.
  // divisors.createDiv({
  //   params: {
  //     id: "map",
  //     class: "maps",
  //     maindiv: document
  //       .getElementById("hydrolang")
  //       .getElementsByClassName("maps")[0],
  //   },
  // });

  //Allocating a container object where the map should be set.
  var container;
  if (divisors.isdivAdded) {
    container = document.getElementById("map");
  }

  //From here onwards, the the library caller renders either Google Maps or Leaflet Maps.
  if (mapconfig.maptype === "google") {
    const options = {
      mapTypeId: "terrain",
      zoom: mapconfig.zoom,
      center: {
        lat: mapconfig.lat,
        lng: mapconfig.lon,
      },
    };
    //append a new map to the map variable.
    osmap = new google.maps.Map(container, options);
  } else if (mapconfig.maptype === "leaflet") {
    osmap = new L.map(container.id);
    //assign the tile type to the data object for rendering.
    const tiletype = layertype.output;
    //Rendering the tile type the user has requested from the available tile types.
    if (tiletype === "tile" && !tileprov.hasOwnProperty(tiletype)) {
      console.log("No tile found!");
      return;
    }
    //import the tile options from the given data.
    osmap.setView([mapconfig.lat, mapconfig.lon], mapconfig.zoom);
    Layers({ params: mapconfig, args: layertype });

    //Allow for popups to be prompted when touching the screen.
    var popup = new L.popup();
    var onMapClick = (e) => {
      popup
        .setLatLng(e.latlng)
        .setContent(`You clicked the map at ${e.latlng.toString()}`)
        .openOn(osmap);
    };
    osmap.on("click", onMapClick);
  }
}

async function recenter ({ params, args, data } = {}) {
  let latLon = L.latLng(args.lat, args.lon);
  var bounds = latLon.toBounds(12000); // 500 = metres
  osmap.panTo(latLon).fitBounds(bounds);
}

/***************************/
/*** Supporting functionargs.lat, args.lon, 40s **/
/***************************/

/**
 *geoJSON type renderer for Leaflet and Google Maps. It attaches point, lines, and polygon layers to
 * a rendered map. Must be called through the Layers function passing the argument
 * @function geoJSON
 * @memberof map
 * @param {Object} params - Contains: maptype (google, osm)
 * @param {Object} data - Data as geoJSON format compliant to OGM standards. See: https://docs.ogc.org/is/17-003r2/17-003r2.html
 * @returns {Element} geoJSON layer added into a rendered map.
 * @example
 * hydro.map.geoJSON({params: {maptype: 'someMapType'}, data: {somegeoJSON}})
 */

function geoJSON({ params, args, data } = {}) {
  var geotype;
  if (data.type === "FeatureCollection") {
    geotype = data.features[0].geometry.type;
  } else if (data.type === "Feature") {
    geotype = data.geometry.type;
  }

  if (params.maptype === "google") {
    var geogoogle = osmap.data.addGeoJson(inf);
    return geogoogle;
  } else if (params.maptype === "leaflet") {
    var onEachFeature = (feature, layer) => {
      if (
        feature.properties &&
        feature.properties.Name &&
        feature.properties.Lat &&
        feature.properties.Lon
      ) {
        layer.bindPopup(
          feature.properties.Name +
            "(" +
            feature.properties.Lat +
            "," +
            feature.properties.Lon +
            ")"
        );
      }
    };
    //Each type of geometry point has an already predefined style attached to it.
    //If a different style is requred please change the following section.
    var geopoint = () => {
      var style = {
        radius: 10,
        fillColor: "#2ce4f3",
        color: "#0dc1d3",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7,
      };
      var xo = new L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          return new L.circleMarker(latlng, style);
        },
        onEachFeature: onEachFeature,
        style: style,
      });
      return xo;
    };

    var geopoly = () => {
      var style = {
        weight: 2,
        color: "#432",
      };
      var xa = new L.geoJSON(data, {
        style: style,
        onEachFeature: onEachFeature,
      });
      return xa;
    };
    if (geotype === "Point") {
      return geopoint();
    } else if (geotype === "Polygon") {
      return geopoly();
    }
  }
}

/**
 * Creates layer of kml data passed through an object to anexisting map.
 * Notice that the map most be already created for the method to be used.
 * @function kml
 * @memberof map
 * @param {Object} params - Contains: maptype (google, osm)
 * @param {Object} data - Contains: KML data in XML format.
 * @returns {Element} Appends KML layer to rendered map.
 * @example
 * hydro.map.kml({params: {maptype: 'someMapType'}, data: {someKMLdata}})
 */

function kml({ params, args, data } = {}) {
  if (params.maptype == "google") {
    var kmlLayer = new google.maps.KmlLayer(data.kml, {
      suppressInfoWindows: true,
      preserveViewport: false,
      map: osmap,
    });
    kmlLayer.addListener("click", function (event) {
      var content = event.featureData.infoWindowHtml,
      testimonial = document.getElementById("capture");
      testimonial.innerHTML = content;
    });
  } else if (params.maptype == "leaflet") {
    const parser = new DOMParser(),
    kml = parser.parseFromString(data.kml, "text/xml"),
    track = new L.KML(kml);
    return track;
  }
}

/**
 * Adds a new marker to the map, given coordinates, map type and marker type.
 * @function addMarker
 * @memberof map
 * @param {Object} params - Contains: maptype (google, osm)
 * @param {Object} args - Contains: markertype (rectangle, circle, circleMarker, polyline, polygon, marker), coord (JS array with coordinates)
 * @returns {Element} Layer object rendered on the map
 * @example
 * hydro.map.addMarker({params: {maptype: 'someMap'}, args: {markertype: 'someMarker', coord: [markerLat, markerLon]}})
 */
function addMarker({ params, args, data } = {}) {
  var layer;
  if (params.maptype === "google") {
  }

  if (params.maptype === "leaflet") {
    var type = args.markertype,
    coord = args.coord;

    //the markerstyle function renders different types of preset styles. If other style types are needed
    //change the code accordingly.
    switch (type) {
      case "rectangle":
        layer = new L.rectangle(
          coord,
          markerStyles({ params: { map: "leaflet", fig: "rectangle" } })
        );
        break;
      case "circle":
        layer = new L.circle(
          coord,
          markerStyles({ params: { map: "leaflet", fig: "circle" } })
        );
        break;
      case "circlemarker":
        layer = new L.circleMarker(
          coord,
          markerStyles({ params: { map: "leaflet", fig: "circlemarker" } })
        );
        break;
      case "polyline":
        layer = new L.polyline(
          coord,
          markerStyles({ params: { map: "leaflet", fig: "polyline" } })
        );
        break;
      case "polygon":
        layer = new L.polygon(
          coord,
          markerStyles({ params: { map: "leaflet", fig: "polygon" } })
        );
        break;
      case "marker":
        layer = new L.marker(
          coord,
          markerStyles({ params: { map: "leaflet", fig: "marker" } })
        );
        break;
      default:
        alert("no markers with that name");
    }
  }
  return layer;
}

/**
 * Creaes different styles for depending on the marker that has been selected for drawing.
 * @function markerStyles
 * @memberof map
 * @param {Object} params - Contains: maptype (google, osm), fig (rectangle, circle, circleMarker, polyline, polygon, marker)
 * @returns {CSSRule} New styles that are used for drawing a marker.
 * @example
 * hydro.map.markerStyles({params: {map: 'someMap', fig: 'someFig'}})
 */

function markerStyles({ params, args, data } = {}) {
  var map = params.map,
  fig = params.fig,
  layer;

  //Implementation for google markers still ongoing.
  if (map === "google") {
  }

  //Full implementation of the OpenStreetMap ready for usage.
  if (map === "leaflet") {
    switch (fig) {
      case "rectangle":
        layer = {
          weight: 2,
          color: "#e1e1100",
        };
        break;
      case "circle":
        layer = {
          radius: 200,
          fillColor: "#2ce4f3",
          color: "#0dc1d3",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.6,
        };
        break;
      case "circlemarker":
        layer = {
          radius: 5,
          fillColor: "#2ce4f3",
          color: "#0dc1d3",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.6,
        };
        break;
      case "polyline":
        layer = {
          weight: 1,
          color: "#432",
          opacity: 1,
        };
        break;
      case "polygon":
        layer = {
          weight: 2,
          color: "#e1e1100",
          opacity: 1,
        };
        break;
      case "marker":
        layer = {
          markerIcon: null,
          zIndexOffset: 2000,
        };
        break;
      default:
        break;
    }
  }
  return layer;
}

/**
 * Adds a drawing tool functionality to an exisiting map to create layers inside.
 * @function draw
 * @memberof map
 * @param {Object} params - Contains: maptype(google, osm)
 * @returns {Element} Toolkit layer added to map.
 * @example
 * hydro.map.draw({params:{maptype: 'someMap'}})
 */

function draw({ params, args, data } = {}) {
  //Implementation of Google Maps API still ongoing.
  if (params.maptype == "google") {
  }
  //Full implementation of OpenStreetMaps ready for usage.
  else if (params.maptype == "leaflet") {
    var options = {
      position: "topleft",
      scale: true,
      draw: {
        polyline: {
          metric: true,
          shapeOptions: {
            color: "#bada55",
          },
        },
        polygon: {
          allowIntersection: false,
          metric: true,
          drawError: {
            color: "#e1e1100",
            message: "<strong> You cant do that!",
          },
          shapeOptions: {
            color: "#432",
          },
        },
        rectangle: {
          allowIntersection: false,
          metric: true,
          drawError: {
            color: "#e1e1100",
            message: "<strong> You cant do that!",
          },
          shapeOptions: {
            color: "#432",
          },
        },
        circle: {
          metric: true,
          feet: true,
          shapeOptions: {
            color: "#432",
          },
        },
        marker: {
          markerIcon: null,
          zIndexOffset: 2000,
        },
      },
      edit: {
        featureGroup: drawings,
        remove: true,
      },
    };

    //Defining a drawing control for the Leaflet library.
    drawControl = new L.Control.Draw(options);
    osmap.addControl(drawControl);

    //Event triggers added to clicking inside the maps through different types of markers and styles..
    osmap.on("draw:created", function (e) {
      var type = e.layerType,
        layer = e.layer;
      if (type === "marker") {
        layer.on("click", function () {
          layer.bindPopup(`Marker coordinates: ${layer.getLatLng()}.`);
        });
      } else if (type === "rectangle") {
        layer.on("click", function () {
          layer.bindPopup(
            `Rectangle corners coordinates: ${layer.getLatLngs()}.`
          );
        });
      } else if (type === "circle") {
        layer.on("click", function () {
          layer.bindPopup(
            `Circle coordinates: ${layer.getLatLng()} with radius: ${layer.getRadius()}.`
          );
        });
      } else if (type === "polygon") {
        layer.on("click", function () {
          layer.bindPopup(
            `Polygon corners coordinates: ${layer.getLatLngs()} with area.`
          );
        });
      }
      drawings.addLayer(layer);
    });
  }
}

/**********************************/
/*** End of Supporting functions **/
/**********************************/

export { loader, Layers, renderMap, recenter };
