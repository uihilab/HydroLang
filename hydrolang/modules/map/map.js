import * as mapsources from "../../external/maps/mapsources.js";
import tileprov from "../../external/maps/tileprov.js";
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
isDrawToolAdded = false,
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

async function loader({ params = {maptype: "leaflet"}, args = {}, data = {}} = {}) {
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
 * @param {Object} args - Contains: type (tile, geodata, markers, kml, draw, removelayers), name (name of layer)
 * @param {Object} data - Contains: data as a JS array.
 * @returns {Element} Layer appended to a map div that has already been created. The layer is added into the global
 * layer object.
 * @example
 * hydro.map.Layers({args: {type: 'tile', name: 'someName'}, data: [data1, data2...]})
 * hydro.map.Layers({args: {type: 'geodata', name: 'someName'}, data: {somegeoJSON}})
 * hydro.map.Layers({args: {type: 'marker', name: 'someName'}, data: [markerLat, marketLon]})
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
    name: args.name,
    coord: data,
    popUpContent:  args.popUp|| null
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


      if (type === "geojson") {
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
        if (!isDrawToolAdded) {
        //Caller for drawing tool renderer.
        drawings = new L.FeatureGroup();
        draw({ params: mapconfig });
        isDrawToolAdded = true
      } else {
        console.log("Draw tool is already added in the map.")
      }
        osmap.addLayer(drawings);
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

async function renderMap({ params = {}, args = {}, data } = {}) {
  await Promise.resolve(loader({params}));
  //Reading layer types and map configurations from the user's parameters inputs.
  var layertype,
  { maptype = "leaflet", lat = 41.6572, lon = -91.5414 } = params;

  let mapconfig = {
    maptype,
    lat,
    lon,
    zoom: 10
  };

  //Allocating a container object where the map should be set.
  var container;
  !divisors.isdivAdded({params:{id: "map"}}) ? 
    divisors.createDiv({
      params: {
        id: "map",
        style: `
        #map {
          height: 400px;
          width: 800px;
          margin-left: auto;
          margin-right: auto;
        }
      
        .content {
          max-width: 900px;
          margin: auto
        }
      `
      }
    }) : null;
  container = document.getElementById("map");

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
    let {type = "tile", name = "OpenStreetMap"} = args
    layertype = {
      type,
      name
    };

    osmap = new L.map(container.id);
    //assign the tile type to the data object for rendering.
    const tiletype = layertype.name;
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

/**
 * Recenters a map at zoom of 500 m to a specific latlon.
 * @method recenter
 * @memberof map
 * @param {Object} args - lat and lon for recentering a map.
 */
async function recenter ({ params, args, data } = {}) {
  let latLon = L.latLng(args.lat, args.lon);
  var bounds = latLon.toBounds(12000); // 500 = metres
  osmap.panTo(latLon).fitBounds(bounds);
}

/***************************/
/*** Supporting functions **/
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
  let geoType;
  if (data.type === "FeatureCollection") {
    geoType = data.features[0].geometry.type;
  } else if (data.type === "Feature") {
    geoType = data.geometry.type;
  }

  if (params.maptype === "google") {
    return osmap.data.addGeoJson(data);
  } else if (params.maptype === "leaflet") {
    const onEachFeature = (feature, layer) => {
      if (feature.properties && feature.properties.Name && feature.properties.Lat && feature.properties.Lon) {
        layer.bindPopup(`${feature.properties.Name} (${feature.properties.Lat}, ${feature.properties.Lon})`);
      }
    };
    const geoPoint = {
      radius: 10,
      fillColor: "#2ce4f3",
      color: "#0dc1d3",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.7,
    };
    const geoPolygon = {
      weight: 2,
      color: "#432",
    };

    if (geoType === "Point") {
      return L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, geoPoint);
        },
        onEachFeature: onEachFeature,
        style: geoPoint,
      });
    } else if (geoType === "Polygon") {
      return L.geoJSON(data, {
        style: geoPolygon,
        onEachFeature: onEachFeature,
      });
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
    var kmlLayer = new google.maps.KmlLayer(data, {
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
    kml = parser.parseFromString(data, "text/xml"),
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
        ).bindPopup(args.popUpContent || `Coordinates: lat: ${coord[0]}, lon: ${coord[1]}`);
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
        layer = e.layer,
        latLngs = layer.getLatLngs();
      if (type === "marker") {
        layer.on("click", function () {
          layer.bindPopup(`Marker coordinates: ${latLngs}.`);
        });
      } else if (type === "rectangle") {
        layer.on("click", function () {
          layer.bindPopup(
            `Rectangle corners coordinates: ${latLngs}.`
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
