import * as mapsources from '../../modules/maps/mapsources.js'

function loader(config) {
    if (config['mapType'] = 'Google') {
        const gApiKey = 'xxxxxxxxxxxxxxxxxxx'
        const gmapApi = new mapsources.googlemapsapi(gApiKey)
        gmapApi.load().then(() => {
            renderMap();
        })
    };
    if (config['mapType'] = 'Bing') {
        const bApiKey = 'xxxxxxxxxxxxxxxxxxxx'
        const bmapApi = new mapsources.bingmapsapi(bApiKey)
        bmapApi.load().then(() => {
            renderMap();
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
function addLayer(params) {
    return "addLayer function is called";
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
    addLayer,
    addMarker,
    loader
}