import * as mapsources from "../../external/maps/mapsources.js";
import tileprov from "../../external/maps/tileprov.js";
import * as divisors from "../visualize/divisors.js";
import * as visualize from "../visualize/visualize.js";
import geospatial from "../../external/gridded-data/geospatial/geospatial.js";

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
async function loader({ params = { maptype: "leaflet" }, args = {}, data = {} } = {}) {
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

function removeMap() {
  if (osmap) {
    // Remove the map and all its layers
    osmap.remove();

    // Clean up global variables
    osmap = null;
    layercontroller = null;
    window.baselayers = {};
    window.overlayers = {};
    window.usedColors = new Set();
  }
}


function reinitializeController(mapType) {
  if (!osmap) return;

  // Remove existing controller if it exists
  if (layercontroller) {
    if (mapType === "google") {
      const controlDiv = document.getElementById("gmap-control-div");
      if (controlDiv) controlDiv.remove();
    } else if (mapType === "leaflet") {
      layercontroller.remove();
    }
    layercontroller = null;
  }

  // Reinitialize the controller
  if (mapType === "google") {
    // Google Maps controller initialization
    // ... existing Google Maps controller code ...
    return
  } else if (mapType === "leaflet") {
    layercontroller = new L.control.layers().addTo(osmap);

    // Readd existing layers
    Object.entries(window.baselayers).forEach(([name, layer]) => {
      layercontroller.addBaseLayer(layer, name);
    });

    Object.entries(window.overlayers).forEach(([name, layer]) => {
      layercontroller.addOverlay(layer, name);
    });
  }
}

/**
 * Layer function for appending tiles, geodata, markers, kml, georaster, or drawing tools to a map.
 * @function Layers
 * @memberof map
 * @param {Object} args - Contains: type (tile, geodata, markers, kml, georaster, draw, removelayers), name (name of layer)
 * @param {Object} data - Contains: data as a JS array or georaster object.
 * @returns {Element} Layer appended to a map div that has already been created. The layer is added into the global
 * layer object.
 * @example
 * // Add a standard OpenStreetMap tile layer
 * hydro.map.Layers({
 *   args: { type: 'tile', name: 'OpenStreetMap' }
 * });
 * 
 * @example
 * // Add a GeoJSON layer with custom styling
 * hydro.map.Layers({
 *   args: { 
 *     type: 'geojson', 
 *     name: 'Rivers',
 *     styleFunction: (feature) => ({ color: 'blue', weight: 2 })
 *   }, 
 *   data: riverGeoJSON 
 * });
 * 
 * @example
 * // Add markers to the map
 * hydro.map.Layers({
 *   args: { 
 *     type: 'marker', 
 *     name: 'Station Locations',
 *     markertype: 'marker',
 *     coord: [42.3601, -71.0589],
 *     popUpContent: 'Boston Station'
 *   }
 * });
 * 
 * @example
 * // Add a WMS layer (e.g., weather radar)
 * hydro.map.Layers({
 *   args: {
 *     type: 'wms',
 *     name: 'Radar',
 *     layers: 'nexrad-n0r-900913',
 *     format: 'image/png',
 *     transparent: true
 *   },
 *   data: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi'
 * });
 * 
 * @example
 * // Add a GeoRaster layer (DEM/Elevation)
 * hydro.map.Layers({
 *   args: { 
 *     type: 'georaster', 
 *     name: 'Elevation',
 *     styleOptions: { colorScheme: 'terrain', opacity: 0.7 }
 *   }, 
 *   data: georasterObj 
 * });
 */

async function Layers({ params, args, data } = {}) {
  var layertype, mapconfig = {};
  data = data || args.data;


  // Determine map type from params or global variable
  if (params && params.maptype) {
    mapconfig.maptype = params.maptype;
  } else if (typeof mapType !== 'undefined') {
    mapconfig.maptype = mapType;
  } else {
    mapconfig.maptype = 'leaflet'; // Default fallback
  }

  console.log('Layers: maptype determined as:', mapconfig.maptype);

  //Creating configuration object for rendering layers.
  //If a property is not found, is simply set to null.
  //Setting it up as default behavior.
  var layertype = {
    type: args.type,
    markertype: args.markertype,
    geotype: args.geo,
    data: data || args.data,
    name: args.name,
    coord: data || args.coord,
    popUpContent: args.popUp || null,
    styleFunction: args.styleFunction || null,
    popUpFunction: args.popUpFunction || null,
    onClickFunction: args.onClickFunction || null
  };
  console.log('Layers: layertype constructed:', layertype);

  // Handle direct GeoTIFF URL loading
  if (layertype.type === 'georaster' && typeof layertype.data === 'string') {
    console.log('Layers: Detected GeoTIFF URL, fetching and parsing with geospatial module...');
    try {
      // Ensure geospatial libraries are loaded
      await geospatial.load({ includeGeoTIFF: true });

      // Load GeoTIFF using geospatial module
      const result = await geospatial.loadGeoTIFF(layertype.data);

      // Convert to georaster format expected by layer functions
      const georaster = await convertGeoTIFFToGeoraster(result.data);

      layertype.data = georaster;
      data = georaster; // Update local data variable as well
      console.log('Layers: GeoTIFF parsed successfully via geospatial module');
    } catch (error) {
      console.error('Layers: Failed to load GeoTIFF from URL:', error);
      throw error;
    }
  }


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
                  font-weight: bold;
                  margin: 10px 10px 0px 0px;
                }

                #options-container {
                  display: none;
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

                }

                #options-container label {
                  display: block;
                  padding: 8px 10px;
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

        // Toggle the controller list if the Layer button is clicked
        selectBox.addEventListener('click', function (event) {
          optionsContainer.style.display = optionsContainer.style.display === 'block' ? 'none' : 'block';
        });

        // Toggle the layer if checkbox is toggles on or off
        optionsContainer.addEventListener('change', function (event) {
          if (event.target.type === 'checkbox') {
            console.log(event.target.value)
            if (event.target.checked) {
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
        if (!window.AdvancedMarkerElement) {
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
        layer = geoJSON({ params: mapconfig, args: layertype, data: layertype.data });
        osmap.addLayer(layer)
        layer.setMap(osmap);
        baselayers[layername] = layer;
        addLayerToGMapController(layer, layername)
        // Caller for georaster data renderer
      } else if (type === "georaster") {
        layer = addGeoRasterLayer({ params: mapconfig, args: layertype });
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
      return layer; // Return the layer for Google Maps
    }

    //in case the map required is osm.
    if (mapconfig.maptype === "leaflet") {
      var layer,
        type = layertype.type,
        layername = layertype.name;

      // Synchronous handling for tiles to ensure map renders immediately
      if (type === "tile") {
        let tileUrl, tileOptions;

        if (layertype.url) {
          // Custom URL provided
          tileUrl = layertype.url;
          tileOptions = layertype.options || {};
        } else if (tileprov && tileprov[layername]) {
          // Use registered provider
          tileUrl = tileprov[layername].url;
          tileOptions = tileprov[layername].options;
        } else {
          console.error('Layers: Invalid tile provider or layer name:', layername);
          return;
        }

        layer = new L.TileLayer(
          tileUrl,
          tileOptions
        );
        Object.assign(baselayers, { [layername]: layer });
        osmap.addLayer(layer);

        // Initialize controller if needed
        if (typeof layercontroller === "undefined") {
          reinitializeController('leaflet');
        } else {
          layercontroller.addBaseLayer(layer, layername);
        }
        return layer;
      } else if (type === "wms") {
        // WMS Layer Support
        layer = L.tileLayer.wms(layertype.data, {
          layers: layertype.layers,
          format: layertype.format || 'image/png',
          transparent: layertype.transparent !== undefined ? layertype.transparent : true,
          version: layertype.version || '1.1.1',
          attribution: layertype.attribution || ''
        });

        Object.assign(overlayers, { [layername]: layer });
        osmap.addLayer(layer);

        if (typeof layercontroller === "undefined") {
          reinitializeController('leaflet');
        } else {
          layercontroller.addOverlay(layer, layername);
        }
        return layer;
      }

      // Async handling for other layer types
      return new Promise((resolve, reject) => {
        const onReady = async function () {
          try {

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
            } else if (type === "georaster") {
              //Caller for the georaster data renderer.
              layer = await addGeoRasterLayer({ params: mapconfig, args: layertype });
              Object.assign(overlayers, { [layername]: layer });
              osmap.addLayer(layer);
              try {
                if (layercontroller && typeof layercontroller.addOverlay === 'function') {
                  layercontroller.addOverlay(layer, layername);
                }
              } catch (e) { console.log('Controller error:', e); }
            } else if (type === "draw") {
              if (!isDrawToolAdded) {
                drawings = new L.FeatureGroup();
                draw({ params: mapconfig, args: layertype });
                isDrawToolAdded = true
              }
              osmap.addLayer(drawings);
              layer = drawings;
            } else if (type === "removelayers") {
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
              }
            }

            resolve(layer);
          } catch (error) {
            console.error('Layers: Error processing layer:', error);
            reject(error);
          }
        };

        if (osmap && osmap._loaded) {
          onReady();
        } else {
          osmap.whenReady(onReady);
        }
      });
    }
  } catch (error) {
    console.error(`There was an error when generating the map`, error)
  }
}

// Add layer to Google Map Controller
function addLayerToGMapController(layer, layername) {
  let optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML += `
      <label><input type="checkbox" value="${layername}" checked="true">${layername}</label>
    `
}

// Remove layer to Google Map Controller
function removeLayerFromGMapController(layer, layername) {
  let optionsContainer = document.getElementById("options-container");
  for (const child of optionsContainer.children) {
    if (child.firstChild.value === layername) {
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
  await Promise.resolve(loader({ params, args }));
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
  !divisors.isdivAdded({ params: { id: "map" } }) ?
    divisors.createDiv({
      params: {
        id: "map",
        style: `
        #map {
          height: 400px;
          width: 800px;
          margin-left: auto;
          margin-right: auto;
          position: ${maptype === 'leaflet' ? 'fixed' : 'absolute'};
          min-width: 200px;
          min-height: 200px;
        }
      
        .content {
          max-width: 900px;
          margin: auto
        }
        `
      }
    }) : null;
  container = document.getElementById("map");

  // Creating an icon in the bottom right corner of the map that allows the map to be resized
  // !divisors.isdivAdded({params:{id: "resize-icon"}}) ?  
  //   divisors.createDiv({
  //     params: {
  //       id: "resize-icon",
  //       style: `
  //       #resize-icon {
  //         position: absolute;
  //         top: 380px;
  //         left: 780px;
  //         width: 20px;
  //         height: 20px;
  //         background-color: gray;
  //         border-radius: 50%;
  //         opacity: 50%;
  //         color: transparent;
  //       }

  //       #resize-icon:hover  {
  //         background-color: transparent;
  //         font-size: 24px;
  //         color: black;
  //         opacity: 100%;
  //       }

  //       #resize-icon::before {
  //         content: '\\2921';
  //       }
  //     `
  //     }
  //   }) : null;
  // const resizeIcon = document.getElementById('resize-icon');

  // Setup map resizing icon
  // setupMapResizing(container, resizeIcon);

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
    osmap = new google.maps.Map(container, options);

  } else if (mapconfig.maptype === "leaflet") {
    let { type = "tile", name = "OpenStreetMap" } = args
    layertype = {
      ...args,
      type,
      name
    };
    mapType = "leaflet"
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
async function recenter({ params, args, data } = {}) {
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
 * @param {Function} args.markerOptionsCallback - Callback function to set the geojsonMarkerOptions based on geoJson properties
 * @param {Function} args.markerPopupCallback - Callback function to set the bindPopup based on geoJson properties
 * @param {Function} args.onClickFunction - Callback function for an onClick event for the geoJson properties
 * @param {Object} data - Data as geoJSON format compliant to OGM standards. See: https://docs.ogc.org/is/17-003r2/17-003r2.html
 * @returns {Element} geoJSON layer added into a rendered map.
 * @example
 * hydro.map.geoJSON({params: {maptype: 'someMapType'}, data: {somegeoJSON}})
 */

async function geoJSON({ params, args, data } = {}) {
  let geoType;

  let { styleFunction, popUpFunction, onClickFunction } = args;

  console.log('data', data);

  if (data.type === "FeatureCollection") {
    //Get the type of feature to be drawn
    geoType = data.features[0].geometry.type;


  } else if (data.type === "Feature") {
    geoType = data.geometry.type;
  }



  if (params.maptype === "google") {
    const layer = new google.maps.Data();
    const infoWindow = new google.maps.InfoWindow();
    let contentString;

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

    if (geoType === "Point") {
      layer.addGeoJson(data);
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

      layer.addListener("click", function (event) {
        if (popUpFunction) {
          contentString = popUpFunction(event.feature)
        } else {
          contentString = `<div>Coordinates: ${event.latLng}</div>`;
        }
        infoWindow.setContent(contentString);
        infoWindow.setPosition(event.feature.getGeometry().get());
        infoWindow.open(osmap);

        if (onClickFunction) {
          onClickFunction(event)
        }
      });

      //layer.setMap(osmap);
      return layer

    } else if (geoType === "Polygon" || geoType === "MultiPolygon") {
      layer.addGeoJson(data);

      layer.setStyle(function (feature) {
        return {
          map: osmap,
          ...styleFunction ? styleFunction(feature) : geoPolygon,
        }
      });

      layer.addListener("click", function (event) {
        if (popUpFunction) {
          contentString = popUpFunction(event.feature)
        }
        console.log(event.feature.getGeometry())


        infoWindow.setContent(contentString);
        infoWindow.setPosition(event.latLng);
        infoWindow.open(osmap);


        if (onClickFunction) {
          onClickFunction(event.feature.Gg)
        }
      });

      //layer.setMap(osmap);
      return layer;

    }


    //return layer;
  } else if (params.maptype === "leaflet") {

    // Bind Popup values and onClick function values
    const onEachFeature = (feature, layer) => {

      if (popUpFunction) {
        layer.bindPopup(popUpFunction(feature))
      } else if (feature.properties && feature.properties.Name && feature.properties.Lat && feature.properties.Lon) {
        layer.bindPopup(`${feature.properties.Name} (${feature.properties.Lat}, ${feature.properties.Lon})`);
      }

      if (onClickFunction) {
        layer.on(
          "click", onClickFunction
        )
      };
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

      //   return L.geoJSON(data, {
      //     pointToLayer: function (feature, latlng) {
      //         // Apply style function if it exists, otherwise use default geoPoint
      //         const style = styleFunction !== null ? styleFunction(feature) : geoPoint;
      //         return L.circleMarker(latlng, style);
      //     },
      //     onEachFeature: onEachFeature,
      //     style: function (feature) {
      //         // Only needed for non-point features
      //         if (styleFunction !== null) return styleFunction(feature);
      //         return geoPolygon; // Default style for polygons
      //     }
      // });

      return L.geoJSON(data
        //     {
        //     pointToLayer: function (feature, latlng) {
        //         // Apply style function if it exists, otherwise use default geoPoint
        //         const style = styleFunction !== null ? styleFunction(feature) : geoPoint;
        //         return L.circleMarker(latlng, style);
        //     },
        //     onEachFeature: onEachFeature,
        //     style: function (feature) {
        //         // Only needed for non-point features
        //         if (styleFunction !== null) return styleFunction(feature);
        //         return geoPolygon; // Default style for polygons
        //     }
        // }
      )




    } else if (geoType === "LineString" || geoType === "MultiLineString") {
      return L.geoJSON(data, {
        style: function (feature) {
          if (styleFunction !== null) return styleFunction(feature);
          return { color: "#0000FF", weight: 3 }; // Default line style
        },
        onEachFeature: onEachFeature,
      });
    } else if (geoType === "Polygon" || geoType === "MultiPolygon") {
      return L.geoJSON(data, {
        style: function (feature) {
          if (styleFunction !== null) return styleFunction(feature);
          return geoPolygon;
        },
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
  var type = args.markertype,
    coord = args.coord, layer, ltlngCoordinate,
    title = args.name;

  console.log('addMarker called with:', { maptype: params.maptype, markertype: type, coord: coord });

  if (params.maptype === "google") {

    switch (type) {
      case "marker":
        layer = new AdvancedMarkerElement({
          position: { lat: coord[0], lng: coord[1] },
          title: title
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
          center: { lat: coord[0], lng: coord[1] },
        });
        break;
      case "polyline":
        ltlngCoordinate = coord.map(([x, y]) => { return { lat: x, lng: y } })
        layer = new google.maps.Polyline({
          path: ltlngCoordinate,
          geodesic: true,
          ...markerStyles({ params: { map: "google", fig: "polyline" } }),
        });
      case "polygon":
        ltlngCoordinate = coord.map(([x, y]) => { return { lat: x, lng: y } })
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
  google.maps.event.addListener(marker, 'click', function () {
    infowindow.setContent(contentString);
    infowindow.open(map, marker);
  });
}

/**
 * Adds a georaster layer to the map for elevation/terrain visualization
 * @function addGeoRasterLayer
 * @memberof map
 * @param {Object} params - Contains: maptype (google, leaflet)
 * @param {Object} args - Contains: data (georaster object), name (layer name), style options
 * @returns {Object} Georaster layer object
 * @example
 * hydro.map.addGeoRasterLayer({params: {maptype: 'leaflet'}, args: {data: georasterObj, name: 'DEM'}})
 */
async function addGeoRasterLayer({ params = {}, args, data } = {}) {
  let { name: layerName, styleOptions = {} } = args;
  let georaster = data;

  // Default to leaflet if not specified
  const mapType = params.maptype || 'leaflet';

  console.log('addGeoRasterLayer called with:', {
    maptype: mapType,
    hasGeoraster: !!georaster,
    georasterKeys: georaster ? Object.keys(georaster) : null
  });

  if (!georaster) {
    throw new Error("Georaster data is required for georaster layer");
  }

  // Handle ArrayBuffer input (e.g. from generic file fetch)
  if (georaster instanceof ArrayBuffer || (georaster.buffer instanceof ArrayBuffer)) {
    console.log('Detected ArrayBuffer input, parsing as GeoTIFF...');
    try {
      // Ensure geospatial libraries are loaded
      await geospatial.load({ includeGeoTIFF: true });

      const buffer = georaster instanceof ArrayBuffer ? georaster : georaster.buffer;
      const result = await geospatial.loadGeoTIFFFromBuffer(buffer);

      // Convert to georaster format
      georaster = await convertGeoTIFFToGeoraster(result.data);
      console.log('Successfully parsed ArrayBuffer to GeoRaster object');
    } catch (e) {
      console.error('Failed to parse ArrayBuffer as GeoTIFF:', e);
      throw new Error('Failed to parse input data as valid GeoTIFF/GeoRaster');
    }
  }

  // Ensure osmap is available
  if (!osmap) {
    console.warn('Map instance (osmap) not found. Layer created but not added to map.');
  }

  if (mapType === "google") {
    // For Google Maps, we'll create a custom overlay using canvas
    console.log('Creating Google Maps georaster layer');
    const layer = createGoogleMapsGeoRasterLayer(georaster, styleOptions);
    if (osmap) {
      layer.setMap(osmap);
    }
    return layer;
  } else if (mapType === "leaflet") {
    // Handle case where georaster is wrapped (e.g. from hydro.data.retrieve)
    if (georaster && georaster.georaster) {
      georaster = georaster.georaster;
    }

    // For Leaflet, we'll use GeoRasterLayer if available, otherwise create a custom implementation
    const layer = await createLeafletGeoRasterLayer(georaster, styleOptions);

    // Automatically add to map as requested
    if (osmap) {
      layer.addTo(osmap);

      // Add to the library's internal layer controller if it exists
      if (layercontroller && typeof layercontroller.addOverlay === 'function') {
        // Use provided name or default unique name
        const explicitName = layerName || `Raster Layer ${Math.floor(Math.random() * 1000)}`;
        layercontroller.addOverlay(layer, explicitName);

        // Also update global overlayers registry consistent with other modules
        if (typeof window !== 'undefined' && window.overlayers) {
          window.overlayers[explicitName] = layer;
        }
      }
    }

    return layer;
  } else {
    throw new Error(`Unsupported map type for georaster: ${mapType}`);
  }
}

/**
 * Creates a georaster layer for Google Maps using canvas overlay
 * @param {Object} georaster - Georaster object with elevation data
 * @param {Object} styleOptions - Styling options for the layer
 * @returns {Object} Google Maps overlay object
 */
function createGoogleMapsGeoRasterLayer(georaster, styleOptions = {}) {
  const {
    opacity = 0.7,
    colorScheme = 'terrain' // 'terrain', 'grayscale', 'viridis', etc.
  } = styleOptions;

  // Create a custom overlay class for Google Maps
  class GeoRasterOverlay extends google.maps.OverlayView {
    constructor(georaster, options = {}) {
      super();
      this.georaster = georaster;
      this.opacity = options.opacity || 0.7;
      this.colorScheme = options.colorScheme || 'terrain';
      this.canvas = null;
    }

    onAdd() {
      this.canvas = document.createElement('canvas');
      this.canvas.style.position = 'absolute';
      this.canvas.style.opacity = this.opacity;

      const panes = this.getPanes();
      panes.overlayLayer.appendChild(this.canvas);

      this.draw();
    }

    draw() {
      if (!this.canvas) return;

      const overlayProjection = this.getProjection();
      if (!overlayProjection) return;

      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(this.georaster.ymin, this.georaster.xmin),
        new google.maps.LatLng(this.georaster.ymax, this.georaster.xmax)
      );

      const sw = overlayProjection.fromLatLngToDivPixel(bounds.getSouthWest());
      const ne = overlayProjection.fromLatLngToDivPixel(bounds.getNorthEast());

      this.canvas.style.left = sw.x + 'px';
      this.canvas.style.top = ne.y + 'px';
      this.canvas.style.width = (ne.x - sw.x) + 'px';
      this.canvas.style.height = (sw.y - ne.y) + 'px';

      this.canvas.width = ne.x - sw.x;
      this.canvas.height = sw.y - ne.y;

      // Render elevation data to canvas
      this.renderElevationData();
    }

    renderElevationData() {
      const ctx = this.canvas.getContext('2d');
      const imageData = ctx.createImageData(this.canvas.width, this.canvas.height);
      const data = imageData.data;

      const { values, mins, maxs, noDataValue } = this.georaster;
      const elevationData = values[0];
      const minValue = mins[0];
      const maxValue = maxs[0];

      for (let y = 0; y < this.canvas.height; y++) {
        for (let x = 0; x < this.canvas.width; x++) {
          const pixelIndex = (y * this.canvas.width + x) * 4;

          // Scale coordinates to georaster dimensions
          const geoX = Math.floor((x / this.canvas.width) * this.georaster.width);
          const geoY = Math.floor((y / this.canvas.height) * this.georaster.height);

          const elevation = elevationData[geoY]?.[geoX];

          if (elevation === noDataValue || !Number.isFinite(elevation)) {
            // Transparent for no-data
            data[pixelIndex] = 0;
            data[pixelIndex + 1] = 0;
            data[pixelIndex + 2] = 0;
            data[pixelIndex + 3] = 0;
          } else {
            // Color based on elevation
            const normalizedElevation = (elevation - minValue) / (maxValue - minValue);
            const color = this.getColorForElevation(normalizedElevation);

            data[pixelIndex] = color.r;
            data[pixelIndex + 1] = color.g;
            data[pixelIndex + 2] = color.b;
            data[pixelIndex + 3] = 255; // Alpha
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

    getColorForElevation(normalizedValue) {
      // Use the shared helper function to ensure consistency with Leaflet
      return getLeafletColorForElevation(normalizedValue, this.colorScheme);
    }

    onRemove() {
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
        this.canvas = null;
      }
    }
  }

  return new GeoRasterOverlay(georaster, { opacity, colorScheme });
}

/**
 * Creates a georaster layer for Leaflet
 * @param {Object} georaster - Georaster object with elevation data
 * @param {Object} styleOptions - Styling options for the layer
 * @returns {Object} Leaflet layer object
 */
async function createLeafletGeoRasterLayer(georaster, styleOptions = {}) {
  const {
    opacity = 0.7,
    colorScheme = 'terrain'
  } = styleOptions;

  // For custom manually created objects (geoprocessor fallback), skip plugin and use simple overlay
  if (georaster._isGeorasterObject) {
    console.log('Detecting custom georaster object, using simple overlay fallback...');
    return createSimpleGeoRasterOverlay(georaster, { opacity, colorScheme });
  }

  // Try to use GeoRasterLayer if available (from georaster-layer-for-leaflet)
  if (typeof L.GeoRasterLayer !== 'undefined') {
    return new L.GeoRasterLayer({
      georaster: georaster,
      opacity: opacity,
      resolution: 256,
      pixelValuesToColorFn: function (pixelValues) {
        const elevation = pixelValues[0];
        const { mins, maxs, noDataValue } = georaster;

        if (elevation === noDataValue || !Number.isFinite(elevation)) {
          return null; // Transparent
        }

        const normalizedValue = (elevation - mins[0]) / (maxs[0] - mins[0]);
        return getLeafletColorForElevation(normalizedValue, colorScheme);
      }
    });
  }

  // Try to load GeoRasterLayer plugin dynamically
  try {
    console.log('Attempting to load GeoRasterLayer plugin...');
    await loadGeoRasterLayerPlugin();
    if (typeof L.GeoRasterLayer !== 'undefined') {
      console.log('GeoRasterLayer plugin loaded successfully');
      return new L.GeoRasterLayer({
        georaster: georaster,
        opacity: opacity,
        resolution: 256,
        pixelValuesToColorFn: function (pixelValues) {
          const elevation = pixelValues[0];
          const { mins, maxs, noDataValue } = georaster;

          if (elevation === noDataValue || !Number.isFinite(elevation)) {
            return null; // Transparent
          }

          const normalizedValue = (elevation - mins[0]) / (maxs[0] - mins[0]);
          return getLeafletColorForElevation(normalizedValue, colorScheme);
        }
      });
    }
  } catch (error) {
    console.log('GeoRasterLayer plugin not available, using canvas fallback:', error.message);
  }

  // Fallback 1: Try simple image overlay approach
  try {
    console.log('Using simple GeoRaster overlay fallback...');
    return createSimpleGeoRasterOverlay(georaster, { opacity, colorScheme });
  } catch (error) {
    console.log('Simple overlay failed, using canvas fallback:', error.message);
  }

  // Fallback 2: Create custom canvas-based layer
  return createLeafletCanvasGeoRasterLayer(georaster, { opacity, colorScheme });
}

/**
 * Creates a simple image overlay from georaster data
 * @param {Object} georaster - Georaster object with elevation data
 * @param {Object} options - Layer options
 * @returns {Object} Leaflet image overlay
 */
function createSimpleGeoRasterOverlay(georaster, options = {}) {
  const { opacity = 0.7, colorScheme = 'terrain' } = options;

  if (!georaster.width || !georaster.height) {
    console.error('Invalid georaster dimensions:', georaster);
    throw new Error('Georaster dimensions are missing or invalid');
  }

  // Create a canvas to render the georaster data
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size to match georaster dimensions
  canvas.width = georaster.width;
  canvas.height = georaster.height;

  // Render elevation data to canvas
  const imageData = ctx.createImageData(georaster.width, georaster.height);
  const data = imageData.data;

  // Access elevation data - handle different possible structures
  let elevationData;
  if (georaster.values && georaster.values[0]) {
    elevationData = georaster.values[0];
  } else if (georaster.values && Array.isArray(georaster.values)) {
    elevationData = georaster.values;
  } else {
    throw new Error('Georaster values not found or in unexpected format');
  }

  const { mins, maxs, noDataValue } = georaster;



  for (let y = 0; y < georaster.height; y++) {
    for (let x = 0; x < georaster.width; x++) {
      const pixelIndex = (y * georaster.width + x) * 4;
      const elevation = elevationData[y][x];

      if (elevation === noDataValue || !Number.isFinite(elevation)) {
        // Transparent for no-data
        data[pixelIndex] = 0;
        data[pixelIndex + 1] = 0;
        data[pixelIndex + 2] = 0;
        data[pixelIndex + 3] = 0;
      } else {
        // Color based on elevation
        const normalizedValue = (elevation - mins[0]) / (maxs[0] - mins[0]);
        const color = getLeafletColorForElevation(normalizedValue, colorScheme);

        data[pixelIndex] = color.r;
        data[pixelIndex + 1] = color.g;
        data[pixelIndex + 2] = color.b;
        data[pixelIndex + 3] = Math.floor(opacity * 255);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Convert canvas to data URL
  const imageUrl = canvas.toDataURL();

  // Create bounds for the image overlay (Leaflet format: [[lat, lng], [lat, lng]])
  // Ensure proper ordering: southwest to northeast
  const bounds = [
    [Math.min(georaster.ymin, georaster.ymax), Math.min(georaster.xmin, georaster.xmax)],
    [Math.max(georaster.ymin, georaster.ymax), Math.max(georaster.xmin, georaster.xmax)]
  ];

  // Validate bounds
  if (!bounds || bounds.length !== 2 ||
    !Array.isArray(bounds[0]) || !Array.isArray(bounds[1]) ||
    bounds[0].length !== 2 || bounds[1].length !== 2) {
    throw new Error('Invalid georaster bounds');
  }

  // Check for valid coordinate values
  const [lat1, lng1] = bounds[0];
  const [lat2, lng2] = bounds[1];

  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    throw new Error('Georaster bounds contain invalid coordinate values');
  }

  // Validate and clamp bounds if slightly out of range (due to float precision)
  const EPSILON = 0.01; // Allow some wiggle room for floating point noise

  if (lat1 < -90 - EPSILON || lat1 > 90 + EPSILON || lat2 < -90 - EPSILON || lat2 > 90 + EPSILON ||
    lng1 < -180 - EPSILON || lng1 > 180 + EPSILON || lng2 < -180 - EPSILON || lng2 > 180 + EPSILON) {
    throw new Error(`Georaster bounds contain out-of-range coordinate values: [[${lat1}, ${lng1}], [${lat2}, ${lng2}]]`);
  }

  // Clamp to exact limits for Leaflet to avoid any internal Leaflet errors
  bounds[0][0] = Math.max(-90, Math.min(90, bounds[0][0]));
  bounds[0][1] = Math.max(-180, Math.min(180, bounds[0][1]));
  bounds[1][0] = Math.max(-90, Math.min(90, bounds[1][0]));
  bounds[1][1] = Math.max(-180, Math.min(180, bounds[1][1]));

  // Create Leaflet image overlay
  const imageOverlay = L.imageOverlay(imageUrl, bounds, {
    opacity: opacity,
    interactive: false
  });



  return imageOverlay;
}

/**
 * Creates a canvas-based georaster layer for Leaflet (fallback)
 * @param {Object} georaster - Georaster object with elevation data
 * @param {Object} options - Layer options
 * @returns {Object} Leaflet canvas layer
 */
function createLeafletCanvasGeoRasterLayer(georaster, options = {}) {
  const { opacity = 0.7, colorScheme = 'terrain' } = options;

  // Create the layer class
  const GeoRasterCanvasLayer = L.GridLayer.extend({
    options: {
      opacity: opacity,
      colorScheme: colorScheme
    },

    initialize: function (georaster, options) {
      this.georaster = georaster;
      L.GridLayer.prototype.initialize.call(this, options);
    },
  });

  // Return instantiated layer
  return new GeoRasterCanvasLayer(georaster, options);
}

/**
 * Gets color for elevation value in Leaflet format
 * @param {number} normalizedValue - Normalized elevation (0-1)
 * @param {string} colorScheme - Color scheme name
 * @returns {Object} RGB color object
 */
/**
 * Gets color for elevation value in Leaflet format
 * @param {number} normalizedValue - Normalized elevation (0-1)
 * @param {string|Array} colorScheme - Color scheme name or array of hex colors
 * @returns {Object} RGB color object
 */
function getLeafletColorForElevation(normalizedValue, colorScheme) {
  // 1. Custom Array Scheme (e.g., ['#ffffff', '#0000ff'])
  if (Array.isArray(colorScheme) && colorScheme.length >= 2) {
    // Find segment
    const step = 1 / (colorScheme.length - 1);
    const segmentIndex = Math.min(Math.floor(normalizedValue / step), colorScheme.length - 2);
    const segmentFactor = (normalizedValue - (segmentIndex * step)) / step;

    const c1 = parseColor(colorScheme[segmentIndex]);
    const c2 = parseColor(colorScheme[segmentIndex + 1]);

    return interpolateColor(c1, c2, segmentFactor);
  }

  // 2. Named Schemes
  if (colorScheme === 'terrain') {
    if (normalizedValue < 0.2) return { r: 0, g: 100, b: 0 };      // Dark green
    if (normalizedValue < 0.4) return { r: 34, g: 139, b: 34 };   // Green
    if (normalizedValue < 0.6) return { r: 255, g: 255, b: 0 };   // Yellow
    if (normalizedValue < 0.8) return { r: 255, g: 165, b: 0 };   // Orange
    return { r: 139, g: 69, b: 19 };                             // Brown
  }

  if (colorScheme === 'blues') {
    // Simple white-to-blue gradient
    return interpolateColor({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 255 }, normalizedValue);
  }

  // 3. Grayscale Fallback
  const gray = Math.floor(normalizedValue * 255);
  return { r: gray, g: gray, b: gray };
}

// Stats Helpers

function parseColor(input) {
  if (typeof input === 'string') {
    if (input === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    if (input.startsWith('#')) return hexToRgb(input);
    // Add basic named colors if needed or rely on canvas context for parsing (complex/async)
    // For now support basic hex/rgb
  }
  return { r: 0, g: 0, b: 0 }; // Default black
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function interpolateColor(c1, c2, factor) {
  return {
    r: Math.round(c1.r + factor * (c2.r - c1.r)),
    g: Math.round(c1.g + factor * (c2.g - c1.g)),
    b: Math.round(c1.b + factor * (c2.b - c1.b))
  };
}

/**
 * Attempts to load the GeoRasterLayer plugin for Leaflet
 * @returns {Promise<void>}
 */
async function loadGeoRasterLayerPlugin() {
  if (typeof L.GeoRasterLayer !== 'undefined') {
    return; // Already loaded
  }

  try {
    // Try to load the georaster-layer-for-leaflet plugin
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/georaster-layer-for-leaflet@3.5.0/dist/georaster-layer-for-leaflet.min.js';
    script.type = 'text/javascript';

    return new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('GeoRasterLayer plugin loaded');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load GeoRasterLayer plugin'));
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    throw new Error(`GeoRasterLayer plugin loading failed: ${error.message}`);
  }
}

/**
 * Attempts to load the georaster parsing library
 * @returns {Promise<void>}
 */
/**
 * Converts a GeoTIFF object (from geotiff.js) to the georaster format expected by layer functions
 * @param {Object} tiff - GeoTIFF object
 * @returns {Promise<Object>} Georaster-like object
 */
async function convertGeoTIFFToGeoraster(tiff) {
  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();
  const rasters = await image.readRasters();

  // Calculate basic stats for visualization
  const mins = [], maxs = [], ranges = [];
  const numBands = rasters.length;

  // Process each band
  const values = [];

  for (let i = 0; i < numBands; i++) {
    const band = rasters[i];
    let min = Infinity, max = -Infinity;

    // Convert to 2D array structure expected by fallback renderer
    const bandValues = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const val = band[y * width + x];
        row.push(val);
        if (val > max) max = val;
        if (val < min) min = val;
      }
      bandValues.push(row);
    }
    values.push(bandValues);

    mins.push(min);
    maxs.push(max);
    ranges.push(max - min);
  }

  // Get raw bounds
  const origin = image.getOrigin();
  const resolution = image.getResolution();
  let xmin = origin[0];
  let ymax = origin[1];
  const pixelWidth = resolution[0];
  const pixelHeight = Math.abs(resolution[1]);
  let xmax = xmin + width * pixelWidth;
  let ymin = ymax - height * pixelHeight;

  // Extract Projection Information
  const geoKeys = image.getGeoKeys();
  let projection = 4326;
  if (geoKeys) {
    projection = geoKeys.ProjectedCSTypeGeoKey || geoKeys.GeographicTypeGeoKey || 4326;
  }

  console.log(`Parsed GeoTIFF: Projection=${projection}, Raw Bounds=[${xmin}, ${ymin}, ${xmax}, ${ymax}]`);

  // Reproject to WGS84 if needed (Leaflet requires Lat/Lng)
  // Simple check: if coordinates are huge, it's likely meters (Projected)
  if ((Math.abs(xmin) > 180 || Math.abs(ymax) > 90) && projection !== 4326 && geospatial.isLoaded()) {
    console.log('Detected projected coordinates. Attempting reprojection to WGS84...');
    try {
      const fromProj = `EPSG:${projection}`;
      const toProj = 'EPSG:4326';

      // Reproject corners
      const sw = geospatial.transformCoordinates([xmin, ymin], fromProj, toProj);
      const ne = geospatial.transformCoordinates([xmax, ymax], fromProj, toProj);

      // Update bounds
      xmin = sw[0];
      ymin = sw[1];
      xmax = ne[0];
      ymax = ne[1];

      console.log(`Reprojected Bounds to WGS84: [${xmin}, ${ymin}, ${xmax}, ${ymax}]`);
    } catch (projError) {
      console.warn('Failed to reproject GeoTIFF bounds:', projError);
      // Fallback: don't fail immediately, let the layer try or user see the error
    }
  }


  return {
    width,
    height,
    values, // array of bands, each band is 2D array
    pixelWidth: pixelWidth, // Note: these might be invalid after reprojection but width/height stay same
    pixelHeight: pixelHeight,
    xmin,
    xmax,
    ymin,
    ymax,
    noDataValue: null, // extracted from tiff if possible
    numberOfRasters: numBands,
    projection: projection,
    _isGeorasterObject: true, // Marker for our internal check
    mins,
    maxs,
    ranges
  };
}

/**
 * Adds a popup to a specific layer with support for various content types including charts.
 * @function addPopup
 * @memberof map
 * @param {Object} params - Configuration parameters
 * @param {string} params.type - Type of popup content: 'chart', 'html', 'text'
 * @param {string} [params.name] - Optional title for the popup
 * @param {Object} args - Arguments
 * @param {Object} args.layer - The layer object to attach the popup to
 * @param {Object} [args.chartOptions] - Configuration options for the chart (passed to visualize.draw)
 * @param {Object|Array} data - Data to be visualized in the popup
 */
function addPopup({ params, args, data } = {}) {
  const { type = 'text', name } = params;
  const { layer, chartOptions = {} } = args;

  if (!layer) {
    throw new Error('addPopup: Layer is required');
  }

  // Check if layer supports Leaflet popup API
  if (typeof layer.bindPopup !== 'function') {
    throw new Error('addPopup: Layer does not support bindPopup (Google Maps not currently supported)');
  }

  if (type === 'chart') {
    // Create a unique ID for the chart container
    const chartId = `popup-chart-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create the content HTML
    let contentHtml = '<div class="popup-content" style="min-width: 300px; min-height: 200px;">';
    if (name) {
      contentHtml += `<h3>${name}</h3>`;
    }
    contentHtml += `<div id="${chartId}" style="width: 100%; height: 200px;">Loading chart...</div>`;
    contentHtml += '</div>';

    // Bind the popup
    layer.bindPopup(contentHtml);

    // Add event listener for when the popup opens
    layer.on('popupopen', () => {
      // Wait a brief moment for the DOM to be ready
      setTimeout(() => {
        const container = document.getElementById(chartId);
        if (container) {
          // Clear loading text
          container.innerHTML = '';

          // Render the chart using visualize module
          visualize.draw({
            params: {
              type: 'chart',
              id: chartId,
              ...chartOptions
            },
            args: chartOptions,
            data: data
          });
        }
      }, 100);
    });

  } else if (type === 'html' || type === 'text') {
    let content = data;
    if (name) {
      content = `<h3>${name}</h3><div>${data}</div>`;
    }
    layer.bindPopup(content);
  }
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

  console.log('mapType', type);

  // Handle the case when the map type is 'google'
  if (type === "google") {
    switch (position) {
      case 'top':
        osmap.controls[google.maps.ControlPosition.TOP_CENTER].push(div);
        break;
      case 'top left':
        osmap.controls[google.maps.ControlPosition.TOP_LEFT].push(div);
        break;
      case 'left':
        osmap.controls[google.maps.ControlPosition.LEFT_CENTER].push(div);
        break;
      case 'bottom left':
        osmap.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(div);
        break;
      case 'bottom':
        osmap.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(div);
        break;
      case 'bottom right':
        osmap.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(div);
        break;
      case 'right':
        osmap.controls[google.maps.ControlPosition.RIGHT_CENTER].push(div);
        break;
      case 'top right':
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
    position = position.replace(" ", "")

    if (position === 'topleft' || position === 'topright' || position === 'bottomleft' || position === 'bottomright') {
      const legend = L.control({ position: position });
      legend.onAdd = function (map) {
        // Add the legend to the map
        let legendDiv = L.DomUtil.create('div', 'legend-container')
        console.log(div)
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
          fillColor: "#800080",
          strokeColor: "#800080",
        };
      case "circle":
        return {
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillOpacity: 0.5,
          fillColor: "#3CB043",
          strokeColor: "#3CB043",
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
 * // Enable standard drawing tools on the map
 * hydro.map.draw({
 *   params: { maptype: 'leaflet' }
 * });
 * 
 * @example
 * // The draw tool allows users to create:
 * // - Markers
 * // - Polylines
 * // - Polygons
 * // - Rectangles
 * // - Circles
 * // Created shapes are added to a FeatureGroup and can be interacted with.
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
            color: "#3388ff",
            weight: 4,
            opacity: 0.7
          },
        },
        polygon: {
          allowIntersection: false,
          metric: true,
          drawError: {
            color: "#ff0000",
            message: "<strong> You cant do that!",
          },
          shapeOptions: {
            color: "#3388ff",
            weight: 4,
            opacity: 0.7,
            fillColor: "#3388ff",
            fillOpacity: 0.2
          },
        },
        rectangle: {
          allowIntersection: false,
          metric: true,
          drawError: {
            color: "#ff0000",
            message: "<strong> You cant do that!",
          },
          shapeOptions: {
            color: "#3388ff",
            weight: 4,
            opacity: 0.7,
            fillColor: "#3388ff",
            fillOpacity: 0.2
          },
        },
        circle: {
          metric: true,
          feet: true,
          shapeOptions: {
            color: "#3388ff",
            weight: 4,
            opacity: 0.7,
            fillColor: "#3388ff",
            fillOpacity: 0.2
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
        latLngs = layer.getLatLngs ? layer.getLatLngs() : layer.getLatLng();

      // Attach custom onClickFunction if provided
      if (args && args.onClickFunction) {
        layer.on("click", function (event) {
          args.onClickFunction(e);
        });
      } else {
        // Default behavior if no custom function provided
        if (type === "marker") {
          layer.on("click", function () {
            layer.bindPopup(`Marker coordinates: ${latLngs}.`).openPopup();
          });
        } else if (type === "rectangle") {
          layer.on("click", function () {
            layer.bindPopup(
              `Rectangle corners coordinates: ${latLngs}.`
            ).openPopup();
          });
        } else if (type === "circle") {
          layer.on("click", function () {
            layer.bindPopup(
              `Circle coordinates: ${layer.getLatLng()} with radius: ${layer.getRadius()}.`
            ).openPopup();
          });
        } else if (type === "polygon") {
          layer.on("click", function () {
            layer.bindPopup(
              `Polygon corners coordinates: ${layer.getLatLngs()} with area.`
            ).openPopup();
          });
        }
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
function generateColors() {
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


/**
 * Returns the current map instance (Leaflet or Google Maps)
 * @returns {Object} Map instance
 */
function getMap() {
  return osmap;
}



//export { loader, Layers, renderMap, recenter, addCustomLegend, addGeoRasterLayer, removeMap, reinitializeController, addPopup, getMap };
export default {
  loader, Layers, renderMap, recenter, addCustomLegend, addGeoRasterLayer, removeMap, reinitializeController, addPopup, getMap
};
