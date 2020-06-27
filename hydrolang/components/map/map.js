import * as mapsources from '../../modules/maps/mapsources.js'
import tileprov from '../../modules/maps/tileprov.js'
import _ from '../../modules/d3/d3.js'

/**loader = loads the appropiate map type inside a div on an html file.
 * @param {*} config properties passed by the user.
 * @return {map} inside a div.
 */
function loader(config) {
    //import the info from user input as data for further usage.   
    const data = {
        map: config["maptype"],
        lat: config["params"]["lat"],
        lon: config["params"]["lon"],
        zoom: config["params"]["zoom"],     
    };

    //create div for element appending the map and add to data
    var mapEl = document.createElement('div');
    mapEl.id = 'map';
    Object.assign(data,{div: mapEl.id})
    document.body.appendChild(mapEl);

    if (data.map == "google") {
        const gApiKey = config["params"]["key"];
        //call the class  constructor.
        const gmapApi = new mapsources.googlemapsapi(gApiKey)
        gmapApi.load().then(() => {
        })
    };

    if (data.map == "osm"){
        //call the class constructor.
        const mapper = new mapsources.leafletosmapi();

        //assign the tile type to the data object for rendering.
        Object.assign(data, {tile: config["params"]["tile"]});
        var x = data.tile;
        if (!(tileprov.hasOwnProperty(x))) {
            callback({
                "info" : "No tile found for the given specifications."
            })
            return;
        }
        //load the map into the created div.
        mapper.load().then(() =>{});
        console.log(data);
    };
}

/**
 * Brief summary of what this function does
 * @param {example data type} example description
 * @returns {example data type} example description
 * @example
 * example usage code here
 */
function addLayer(data) {
    
}

function renderMap(data) {
    if (data.map == "google") {
        const options = {
        mapTypeId: google.maps.MapTypeId.terrain,
        zoom: data.zoom,
        center: {
            lat: data.lat,
            lng: data.lon,
        }
    }
    const map = new google.maps.Map(data.div, options)
    }

    if (data.map == "osm") {
        //in case further manipulation of the map is required, leave a placeholder for it from the DOM.
        //import the tile options from the given data.
        const tiletype = data.tile;
        const osmap =new L.map(data.div);
        osmap.setView([data.lat, data.lon], data.zoom);
        const tiles = new L.TileLayer(tileprov[tiletype].url,tileprov[tiletype].options);
        osmap.addLayer(tiles);
        console.log(osmap)
    }
}

/**geoJSON = appends geoJSON data to a created map.
 * The map has to be already created within the html file in order to work.
 * @param {*} data
 * @returns {*} geoJSON appended to map.
 */
function geoJSON(type, ormap, data) {
    if (type == "google") {
    }

    if (type == "osm"){
        var map = ormap
        const geodata = data;
        var svg = _.d3.select(map.getPanes().overlayPane).append("svg"),
        g = svg.append("g").attr("class", "leaflet-zoom-hide");

        _.d3.json(geodata, function(geoShape){

            var transform = _.d3.geo.transform({point: projectPoint}),
            path = _.d3.geo.path().projection(transform);

            _.d3_features = g.selectAll("path")
                        .data(geoShape.features)
                        .enter().append("path");
            map.on("viewreset", reset);

            reset();

            function reset() {
                bounds = path.bounds(geoShape);

                var topLeft = bounds[0],
                bottomRight = bounds[1];

                svg.attr("width", bottomRight[0] - topLeft[0])
                        .attr("height", bottomRight[1]-topLeft[1])
                        .style("left", topLeft[0] + "px");
                g.attr("transform", "translate(" + -topLeft[0] + ","
                                                + -topLeft[1] + ")");

                _.d3_features.attr("d", path)
                            .style("fill-opacity", 0.7)
                            .attr('fill', 'blue');
            }

            function projectPoint(x,y) {
                var point = map.latLngToLayerPoint(new L.LatLng(y, x));
                this.stream.point(point.x, point.y);
            }
        })

    }

}

/**
 * Brief summary of what this function does
 * @param {example data type} example description
 * @returns {example data type} example description
 * @example
 * example usage code here
 */
function addMarker(params) {
    return "addMarker function is called";
}

export {
    loader,
    addLayer,
    addMarker,
    renderMap,
    geoJSON
}