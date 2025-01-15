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

// Google Maps specific variables
var mapId, mapType;

//Global variables for library usages.
window.baselayers = {};
window.overlayers = {};
window.usedColors = new Set()

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
  var layertype, mapconfig = {};
  //The mapconfig is set to be as OSM.
  if(mapType === "google") {
    mapconfig.maptype= "google" 
  } else if(mapType === "leaflet"){
    mapconfig.maptype= "leaflet" }
  
  //Creating configuration object for rendering layers.
  //If a property is not found, is simply set to null.
  //Setting it up as default behavior.
  var layertype = {
    type: args.type,
    markertype: args.markertype,
    geotype: args.geo,
    data: data,
    name: args.name,
    coord: data,
    popUpContent:  args.popUp|| null,
    styleFunction: args.styleFunction || null,
    popUpFunction: args.popUpFunction || null,
    onClickFunction: args.onClickFunction || null
  };


  try {
    //in case the map required is google.
    if (mapconfig.maptype === "google") {
      var layer,
      type = layertype.type,
      layername = layertype.name;

      // Create layer controller if undefined
      if (typeof layercontroller === "undefined") {

        // Creating layers div for Google Maps
        !divisors.isdivAdded({ params: { id: "gmap-control-div" } })
          ? divisors.createDiv({
              params: {
                id: "gmap-control-div", 
                title: "Show Map Layers",
                style: `
                #gmap-control-div {
                  position: relative;
                  width: 200px;
                  font-family: Arial, sans-serif;
                }

                #select-box {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 11px 23px;
                  border: 1px solid #ccc;
                  cursor: pointer;
                  text-align: left;
                  color: rgb(0, 0, 0);
                  font-family: Roboto, Arial, sans-serif;
                  font-size: 18px;
                  border-radius: 2px;
                  box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;
                  background: none padding-box rgb(255, 255, 255);
                  font-weight: 500;
                  margin: 10px 10px 0px 0px;
                }

                #select-box:hover {
                  background-color: rgb(235, 235, 235);
                }

                #options-container {
                  background-color: rgb(255, 255, 255);
                  display: none;
                  padding: 2px;
                  position: absolute;
                  top: 100%;
                  left: 0;
                  right: 0;
                  border: 1px solid #ccc;
                  border-top: none;
                  max-height: 200px;
                  overflow-y: auto;
                  background-color: white;
                  margin: 0px 10px 0px 0px;
                  border-bottom-left-radius: 2px;
                  border-bottom-right-radius: 2px;
                  box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;
                  text-align: left;
                }

                #options-container label {
                  display: block;
                  padding: 8px 10px;

                  color: rgb(0, 0, 0);
                  font-family: Roboto, Arial, sans-serif;
                  user-select: none;
                  font-size: 18px;
                  background-color: rgb(255, 255, 255);
                  padding: 7px 8px 7px 7px;
                  direction: ltr;
                  text-align: left;
                  white-space: nowrap;
                }

                #options-container label:hover {
                  background-color: #f0f0f0;
                }
                  `
              },
            })
          : null;

        let controlDiv = document.getElementById("gmap-control-div");
        layercontroller = controlDiv;

        // Create select list for Layers
        controlDiv.innerHTML = `
            <div id="select-box">
              <span class="selected-options">Layers</span>
              <span class="arrow">&#9662;</span>
            </div>
            <div id="options-container">
            </div>
          `;

        // Add Layer button to top right of the map
        osmap.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);

        const selectBox = document.querySelector('#select-box');
        const optionsContainer = document.querySelector('#options-container');

        let isMouseOver = false;

        // Toggle the controller list if the Layer button is clicked
        selectBox.addEventListener('mouseover', function(event) {
          isMouseOver = true;
          optionsContainer.style.display = 'block';
        });

        selectBox.addEventListener('mouseout', function(event) {
          isMouseOver = false;
          setTimeout(() => {
            if(!isMouseOver) {
              optionsContainer.style.display = 'none';
            }
          }, 1000);
        });

        // Toggle the layer if checkbox is toggles on or off
        optionsContainer.addEventListener('change', function(event) {
          if (event.target.type === 'checkbox') {
              if(event.target.checked) {
                baselayers[event.target.value].setMap(osmap);
              } else {
                baselayers[event.target.value].setMap(null);
              }
          }
        });
      }
      
      //Caller for the marker data renderer.
      if (type === "marker") {
        // Load AdvancedMarkerElement for Markers
        if(!window.AdvancedMarkerElement) {
          var { AdvancedMarkerElement } = await google.maps.importLibrary(
            "marker",
          );
          window.AdvancedMarkerElement = AdvancedMarkerElement
        };
        layer = addMarker({ params: mapconfig, args: layertype });
        layer.setMap(osmap);
        baselayers[layername] = layer;
        addLayerToGMapController(layer, layername)
      //Caller for the geoJSON data renderer.
      } else if (type === "geojson") {
        layer = await geoJSON({ params: mapconfig, args: layertype, data: layertype.data });
        layer.setMap(osmap);
        baselayers[layername] = layer;
        addLayerToGMapController(layer, layername)
      // Caller for removing layers using layer name
      } else if (type === "removelayers") {
        if (baselayers.hasOwnProperty(layername)) {
          baselayers[layername].setMap(null);
          delete baselayers[layername];
          removeLayerFromGMapController(layer, layername)
        } else {
          console.log("there is no layer with that name!");
        }
      }
    }

    //in case the map required is osm.
    else if (mapconfig.maptype === "leaflet") {
      var layer,
      type = layertype.type,
      layername = layertype.name;
    
    await osmap.whenReady(async function () {
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
        layer = await geoJSON({ 
          params: mapconfig, 
          args: layertype, 
          data: data 
        });
        Object.assign(overlayers, { [layername]: layer });
        osmap.addLayer(layer)
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

// Add layer to Google Map Controller
function addLayerToGMapController(layer, layername) {
  let optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML+= `
      <label><input type="checkbox" value="${layername}" checked="true">${layername}</label>
    `
}

// Remove layer to Google Map Controller
function removeLayerFromGMapController(layer, layername) {
  let optionsContainer = document.getElementById("options-container");
  for (const child of optionsContainer.children) {
    if(child.firstChild.value === layername) {
      child.remove()
    }
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
  await Promise.resolve(loader({params, args}));
  //Reading layer types and map configurations from the user's parameters inputs.
  var layertype,
  { maptype = "leaflet", lat = 41.6572, lon = -91.5414, zoom = 10 } = params;

  let mapconfig = {
    maptype,
    lat,
    lon,
    zoom
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
          position: 'absolute';
          min-width: 200px;
          min-height: 200px;
          resize: both;
        }
      
        .content {
          max-width: 900px;
          margin: auto
        }
        `
      }
    }) : null;
  container = document.getElementById("map");


  mapId = 'MAP_ID'

  //From here onwards, the the library caller renders either Google Maps or Leaflet Maps.
  if (mapconfig.maptype === "google") {
    const options = {
      mapTypeId: "terrain",
      zoom: mapconfig.zoom,
      center: {
        lat: mapconfig.lat,
        lng: mapconfig.lon,
      },
      mapId: mapId
    };
    
    mapType = 'google';
    //append a new map to the map variable.
    //osmap = new google.maps.Map(container, options);
    const { Map } = await google.maps.importLibrary("maps");
    osmap = new Map(container, options);
    
  } else if (mapconfig.maptype === "leaflet") {
    let {type = "tile", name = "OpenStreetMap"} = args
    layertype = {
      type,
      name
    };
    mapType = "leaflet"
    osmap = new L.map(container.id);
    // Ensure correct resizing of Leaflet map
    const resizeObserver = new ResizeObserver((entry) => {
      setTimeout(function(){ osmap.invalidateSize()}, 400);
    });
    resizeObserver.observe(container);
    //assign the tile type to the data object for rendering.
    const tiletype = layertype.name;
    //Rendering the tile type the user has requested from the available tile types.
    if (tiletype === "tile" && !tileprov.hasOwnProperty(tiletype)) {
      console.log("No tile found!");
      return;
    }

    console.log('mapconfig.zoom',mapconfig.zoom)
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

// Helper function to implement drag and drop map resizing functionality
function setupMapResizing(map, resizeIcon) {
  // State variables for tracking drag operation
  let isDragging = false;
  let startX, startY;

  // Add event listeners for drag operations
  resizeIcon.addEventListener('mousedown', startDrag);

  // Function to initiate dragging
  function startDrag(e) {
    isDragging = true;
    // Calculate the offset of the mouse position from the icon's top-left corner
    startX = e.clientX - resizeIcon.offsetLeft;
    startY = e.clientY - resizeIcon.offsetTop;

    // Add listeners only when dragging starts
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
  }

  // Function to handle dragging
  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    // Calculate new position of the resize icon
    let left = e.clientX - startX;
    let top = e.clientY - startY;
    // Update the position of the resize icon
    resizeIcon.style.left = `${left}px`;
    resizeIcon.style.top = `${top}px`;
  }

  // Function to end dragging and resize the map
  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    
    // Calculate new dimensions, ensuring they're at least 200px
    const newWidth = Math.max(resizeIcon.offsetLeft, 200);
    const newHeight = Math.max(resizeIcon.offsetTop, 200);

    // Resize the map and reposition the resize icon
    resizeMap(map, newWidth, newHeight);
    repositionResizeIcon(resizeIcon, newWidth, newHeight);

    // Remove listeners when dragging ends
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', endDrag);
  }

  // Helper function to resize the map
  function resizeMap(map, width, height) {
    map.style.width = `${width}px`;
    map.style.height = `${height}px`;
  }

  // Helper function to reposition the resize icon to the bottom-right corner
  function repositionResizeIcon(icon, mapWidth, mapHeight) {
    icon.style.left = `${mapWidth - icon.offsetWidth}px`;
    icon.style.top = `${mapHeight - icon.offsetHeight}px`;
  }
}
/**
 * 
 * @param {*} param0 
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
 * @args.styleFunction {Function} args.markerOptionsCallback - Callback function to set the geojsonMarkerOptions based on geoJson properties
 * @args.popUpFunction {Function} args.markerPopupCallback - Callback function to set the bindPopup based on geoJson properties
 * @args.onClickFunction {Function} args.onClickFunction - Callback function for an onClick event for the geoJson properties
 * @param {Object} data - Data as geoJSON format compliant to OGM standards. See: https://docs.ogc.org/is/17-003r2/17-003r2.html
 * @returns {Element} geoJSON layer added into a rendered map.
 * @example
 * hydro.map.geoJSON({params: {maptype: 'someMapType'}, data: {somegeoJSON}})
 */
async function geoJSON({ params, args, data } = {}) {
  let geoType; // Variable to hold the type of geometry (Point, Polygon, etc.)

  // Destructuring the style, popup, and click functions from the args parameter
  let { styleFunction, popUpFunction, onClickFunction } = args;

  // Determine the type of GeoJSON data (FeatureCollection or single Feature) and get the geometry type
  if (data.type === "FeatureCollection") {
    geoType = data.features[0].geometry.type; // Get the type from the first feature in the collection
  } else if (data.type === "Feature") {
    geoType = data.geometry.type; // Get the type directly from the feature
  }

  // Check if the map type specified in params is Google Maps
  if (params.maptype === "google") {
    const layer = new google.maps.Data(); // Create a new Google Maps data layer
    const infoWindow = new google.maps.InfoWindow(); // Initialize an InfoWindow for displaying popups
    let contentString; // Variable to hold the content for the InfoWindow

    // Default styles for points and polygons on Google Maps
    const geoPoint = {
      scale: 5,
      fillColor: "red",
      color: "#0dc1d3",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.6,
      strokeWeight: 0.7
    };

    const geoPolygon = {
      fillColor: "#2ce4f3",
      color: "#0dc1d3",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.6,
    };

    // If the geometry type is a Point
    if (geoType === "Point") {
      layer.addGeoJson(data); // Add the GeoJSON data to the layer

      // Set the style of the layer, either using the styleFunction or the default geoPoint style
      layer.setStyle(function (feature) {
        return {
          map: osmap,
          center: feature.getGeometry().get(),
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            ...styleFunction ? styleFunction(feature) : geoPoint,
          }
        }
      });

      // Add a click listener to the layer
      layer.addListener("click", function (event) {
        // If a popUpFunction is provided, use it to generate the content of the InfoWindow
        if (popUpFunction) {
          contentString = popUpFunction(event.feature);
        } else {
          contentString = `<div>Coordinates: ${event.latLng}</div>`; // Default content
        }
        infoWindow.setContent(contentString); // Set the content of the InfoWindow
        infoWindow.setPosition(event.feature.getGeometry().get()); // Position the InfoWindow
        infoWindow.open(osmap); // Open the InfoWindow on the map

        // If an onClickFunction is provided, execute it
        if (onClickFunction) {
          onClickFunction(event);
        }
      });

      return layer; // Return the configured layer

    } else if (geoType === "Polygon" || geoType === "MultiPolygon") {
      layer.addGeoJson(data); // Add the GeoJSON data to the layer

      // Set the style of the layer, either using the styleFunction or the default geoPolygon style
      layer.setStyle(function (feature) {
        return {
          map: osmap,
          ...styleFunction ? styleFunction(feature) : geoPolygon,
        }
      });

      // Add a click listener to the layer
      layer.addListener("click", function (event) {
        if (popUpFunction) {
          contentString = popUpFunction(event.feature); // Generate the content for the InfoWindow
        }
        infoWindow.setContent(contentString); // Set the content of the InfoWindow
        infoWindow.setPosition(event.latLng); // Position the InfoWindow
        infoWindow.open(osmap); // Open the InfoWindow on the map

        // If an onClickFunction is provided, execute it
        if (onClickFunction) {
          onClickFunction(event); // Passing the feature object to the onClick function
        }
      });

      return layer; // Return the configured layer
    }

    // Check if the map type specified in params is Leaflet
  } else if (params.maptype === "leaflet") {

    // Define a function that binds a popup and click event handler to each feature
    const onEachFeature = (feature, layer) => {
      if (popUpFunction) {
        layer.bindPopup(popUpFunction(feature)); // Bind the popup content using the popUpFunction
      } else if (feature.properties && feature.properties.Name && feature.properties.Lat && feature.properties.Lon) {
        // Default popup content if popUpFunction is not provided
        layer.bindPopup(`${feature.properties.Name} (${feature.properties.Lat}, ${feature.properties.Lon})`);
      }

      // If an onClickFunction is provided, attach it to the 'click' event of the layer
      if (onClickFunction) {
        layer.on("click", onClickFunction);
      }
    };

    // Default styles for points and polygons on Leaflet
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

    // If the geometry type is a Point
    if (geoType === "Point") {
      return L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          // Convert each point to a circle marker, applying the styleFunction or the default geoPoint style
          return L.circleMarker(latlng, function (feature) {
            if (styleFunction !== null) return styleFunction(feature);
            return geoPoint;
          });
        },
        onEachFeature: onEachFeature, // Apply the onEachFeature function to bind popups and events
        style: function (feature) {
          if (styleFunction !== null) return styleFunction(feature);
          return geoPoint;
        },
      });
      // If the geometry type is a Polygon or MultiPolygon
    } else if (geoType === "Polygon" || geoType === "MultiPolygon") {
      return L.geoJSON(data, {
        style: function (feature) {
          // Apply the styleFunction or the default geoPolygon style
          if (styleFunction !== null) return styleFunction(feature);
          return geoPolygon;
        },
        onEachFeature: onEachFeature, // Apply the onEachFeature function to bind popups and events
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
  var type = args.markertype,
    coord = args.coord, layer, ltlngCoordinate,
    title = args.name;

  if (params.maptype === "google") {

    switch(type) {
      case "marker":
        layer = new AdvancedMarkerElement({
          position: {lat:coord[0], lng:coord[1]},
          title : title
        });
        // Bind popup to marker layer
        var infowindow = new google.maps.InfoWindow();
        makeInfoWindowEvent(
          osmap, 
          infowindow, 
          args.popUpContent || `Coordinates: lat: ${coord[0]}, lon: ${coord[1]}`, 
          layer
        );
        break;
      case "rectangle":
        layer = new google.maps.Rectangle({
          ...markerStyles({ params: { map: "google", fig: "rectangle" } }),
          bounds: {
            north: coord[0] + 0.01,
            south: coord[0] - 0.01,
            east: coord[1] + 0.01,
            west: coord[1] - 0.01,
          },
        });
        break;
      case "circle":
        layer = new google.maps.Circle({
          ...markerStyles({ params: { map: "google", fig: "circle" } }),
          center: {lat:coord[0],lng:coord[1]},
        });
        break;
      case "polyline":
        ltlngCoordinate = coord.map(([x, y]) => {return {lat:x, lng:y}})
        layer = new google.maps.Polyline({
          path: ltlngCoordinate,
          geodesic: true,
          ...markerStyles({ params: { map: "google", fig: "polyline" } }),
        });
      case "polygon":
        ltlngCoordinate = coord.map(([x, y]) => {return {lat:x, lng:y}})
        layer = new google.maps.Polygon({
          path: ltlngCoordinate,
          geodesic: true,
          ...markerStyles({ params: { map: "google", fig: "polygon" } })
        });
    }
  }

  if (params.maptype === "leaflet") {
    
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

// Helper function for google maps based visualization to bind popup value on layers
function makeInfoWindowEvent(map, infowindow, contentString, marker) {
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(contentString);
    infowindow.open(map, marker);
  });
}

/**
 * Adds a custom legend to the map based on the map type and position specified.
 * @param {Object} param0 - Object containing the map type and position for the legend.
 * @param {string} param0.position - The position for the legend (top, top left, left, bottom left, bottom, bottom right, right, top right).
 */
async function addCustomLegend({ params, args, data } = {}) {
  const { position } = params;
  const { div } = args;

  // If no div is provided, return an error message
  if (!div) {
    return "Pass in a div for overlay";
  }

  let type = mapType;

  // Handle the case when the map type is 'google'
  if (type === "google") {
    switch (position) {
      case 'top':
        osmap.controls[google.maps.ControlPosition.TOP_CENTER].push(div);
        break;
      case 'top left':
        osmap.controls[google.maps.ControlPosition.TOP_LEFT].push(div);
        break;
      case 'left top':
        osmap.controls[google.maps.ControlPosition.LEFT_TOP].push(div);
        break;
      case 'left':
        osmap.controls[google.maps.ControlPosition.LEFT_CENTER].push(div);
        break;
      case 'bottom left':
        osmap.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(div);
        break;
      case 'left bottom':
          osmap.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(div);
          break;
      case 'bottom':
        osmap.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(div);
        break;
      case 'bottom right':
        osmap.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(div);
        break;
      case 'right bottom':
        osmap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(div);
        break;
      case 'right':
        osmap.controls[google.maps.ControlPosition.RIGHT_CENTER].push(div);
        break;
      case 'top right':
        osmap.controls[google.maps.ControlPosition.RIGHT_TOP].push(div);
        break;
      case 'right top':
        osmap.controls[google.maps.ControlPosition.TOP_RIGHT].push(div);
        break;
      default:
        console.log("Possible values for position are 'top', 'left', 'bottom', 'right', 'top left', 'top right', 'bottom left', 'bottom right'");
        break;
    }
  }
  // Handle the case when the map type is 'leaflet'
  else if (type === "leaflet") {
    let { position } = params;
    position = position.replace(" ","")

    if (position === 'topleft' || position === 'topright' || position === 'bottomleft' || position === 'bottomright') {
      const legend = L.control({ position: position });
      legend.onAdd = function (map) {
        // Add the legend to the map
        let legendDiv = L.DomUtil.create('div', 'legend-container')
        legendDiv.innerHTML = args.div.innerHTML;

        return legendDiv
      };
      legend.addTo(osmap);
    } else {
      console.log("Possible values for position are 'top left', 'top right', 'bottom left' or 'bottom right'");
    }
  }
  // If no map type is specified, log an error message
  else {
    console.log("Error: map not found");
  }
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
    switch (fig) {
      case "rectangle":
        return {
          strokeColor: "#FF0000",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillOpacity: 0.5,
          fillColor:"#800080", 
          strokeColor:"#800080",
        };
      case "circle":
        return {
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillOpacity: 0.5,
          fillColor:"#3CB043",
          strokeColor:"#3CB043",
          radius: 1000,
        };
      case "polyline":
        return {
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 2,
        };
      case "polygon":
        return {
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 2,
          fillColor: "#FF0000",
          fillOpacity: 0.35,
        };
    }
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

/**
 * Returns a hex color for rendering
 * @function generateColors
 * @memberof map
 * @returns {String} - Random color to be rendered.
 */
function generateColors () {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**********************************/
/*** End of Supporting functions **/
/**********************************/

export { loader, Layers, renderMap, recenter, addCustomLegend };
