import * as mapsources from '../../modules/maps/mapsources.js'
import tileprov from '../../modules/maps/tileprov.js'
import _ from '../../modules/d3/d3.js'

/**loader = retrieves the libraries required for map rendering depending on the source.
 * @param {*} config properties passed by the user.
 * @return {map} inside a div.
 */
function loader(config) {
    //For maps to be used from google.
    if (config["maptype"] == "google") {
        const gApiKey = config["params"]["key"];
        //call the class  constructor.
        const gmapApi = new mapsources.googlemapsapi(gApiKey)
        gmapApi.load().then(() => {});
        return;
    };

    //for maps to be used from leaflet.
    if (config["maptype"] == "osm"){
        //call the class constructor.
        const mapper = new mapsources.leafletosmapi();
        mapper.load().then(() =>{});
        return;
    };
}

/**
 * Brief summary of what this function does
 * @param {example data type} example description
 * @returns {example data type} example description
 * @example
 * example usage code here
 */
function addLayer(config) {   
    if (config.maptype == "google"){
    }

    if (config.maptype == "osm"){
        new L.Layer.extend({
            onAdd: function(map) {
                var pane = map.getPane(this.options.pane);
                this._container = L.DomUtil.create();
                pane.appendChild(this._container);
                if (config.render == "tile"){
                }
            }
        })
    }
}

function renderMap(config) {
    //import the info from user input as data for further usage.   
    const data = {
        map: config["maptype"],
        lat: config["params"]["lat"],
        lon: config["params"]["lon"],
        zoom: config["params"]["zoom"],
        geo: config["geodata"]
    };

    //create div for element appending the map and add to data
    var container = document.createElement('div');
    container.id= 'map';
    document.body.appendChild(container);
    
    if (data.map == "google") {
        const options = {
        mapTypeId: 'terrain',
        zoom: data.zoom,
        center: {
            lat: data.lat,
            lng: data.lon,
        }
    }
    const map = new google.maps.Map(container, options)
    };

    if (data.map == "osm") {
        //assign the tile type to the data object for rendering.
        Object.assign(data, {tile: config["params"]["tile"]});
        const tiletype = data.tile;
        if (!(tileprov.hasOwnProperty(tiletype))) {
            callback({
                "info" : "No tile found for the given specifications."
            })
            return;
        }
        //in case further manipulation of the map is required, leave a placeholder for it from the DOM.
        //import the tile options from the given data.
        const osmap =new L.map(container.id);
        osmap.setView([data.lat, data.lon], data.zoom);
        const tiles = new L.TileLayer(tileprov[tiletype].url,tileprov[tiletype].options);
        osmap.addLayer(tiles);
    }
    console.log(data)
}

/**geoJSON = appends geoJSON data to a created map.
 * The map has to be already created within the html file in order to work.
 * @param {*} data
 * @returns {*} geoJSON appended to map.
 */
function geoJSON(data, type) {
    if (type == "google") {
    }
    if (type == "osm"){
        const map = window[Object.keys(window).find(key => key.substr(0,3) === "map")];
        this.addMarker(data,map,'pointdata')
    }
}

/**
 * Brief summary of what this function does
 * @param {example data type} example description
 * @returns {example data type} example description
 * @example
 * example usage code here
 */
function addMarker(data, map, type) {
    const inf = data.geo
    if (data.map == "google") {  
    }

    if (data.map == "osm") {
        if (type == 'pointdata'){
            new L.svg({clickable: true}).addTo(map)
            const overlay = _.d3.select(map.getPanes().overlayPane)
            const svg = overlay.select('svg').attr("pointer-events","auto")
            const fig = svg.selectAll('circle')
                        .attr("class", "fig")
                        .data(inf.features)
                        .join('circle')
                            .attr("id", "dotties")
                            .attr("fill", "steelblue")
                            .attr("stroke", "black")
                            .attr("cx", d =>
                            map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).x)
                            .attr("cy", d =>
                            map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).y)
                            .attr("r", 5)
                            .on('mouseover', function(){
                                _.d3.select(this).transition()
                                    .duration('150')
                                    .attr("fill","red")
                                    .attr('r', 10)
                            })
                            .on('mouseout', function(){
                                _.d3.select(this).transition()
                                    .duration('150')
                                    .attr("fill", "steelblue")
                                    .attr('r', 5)
                            });
            const update = () => fig
                            .attr("cx", d =>
                            map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).x)
                            .attr("cy", d =>
                            map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).y)
            
            map.on("zoomend", update)
        };

        if (type == 'polygons'){
            new L.svg({clickable: true}).addTo(map)
            const overlay = _.d3.select(map.getPanes().overlayPane)
            const svg = overlay.select('svg').attr("pointer-events", "auto")
            const g = svg.append('g').attr('class', 'leaflet-zoom-hide')

            const projectPoint = function(x,y) {
                const point = osmap.latLngToLayerPoint(new L.LatLng(y,x))
                this.stream.point(point.x, point.y)
            }

            const projection = _.d3.geoTransform({point: projectPoint})
            const pathCreator = _.d3.geoPath().projection(projection)

            const areaPaths = g.selectAll('path')
                                .data(inf.features)
                                .join('path')
                                .attr('fill-opacity', 0.3)
                                .attr('stroke', 'black')
                                .attr("z-index", 3000)
                                .attr('stroke-width', 2.5)
                                .on("mouseover", function(d){
                                    _.d3.select(this).attr("fill","red")})
                                .on("mouseout", function(d){
                                    _.d3.select(this).attr("fill","black")})
            const onZoom = () => areaPaths.attr('d',pathCreator)
            onZoom()
            map.on('zoomend',onZoom);
        }
    }
}

export {
    loader,
    addLayer,
    addMarker,
    renderMap,
    geoJSON
}