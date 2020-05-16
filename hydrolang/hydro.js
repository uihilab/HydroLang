import * as lang from './lang.js';

// This import is encapsulated within this module,
// and will not affect the hosting application.
import $ from './modules/jquery.js';

class hydro {
    constructor() {
    	// put all the default values here
      	this.metricSystem = "SI";
      	this.mapType = "OSM";
        this.lang = lang;
   	}

   	// Setters
   	setConfig(config){
      	this.metricSystem = config.metricSystem;
      	this.mapType = config.mapType;   		
   	}
}

if (typeof window !== 'undefined') {
	window.hydro = hydro;
}

export default hydro;