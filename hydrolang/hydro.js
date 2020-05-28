import * as components from './components/core.js';

class Hydrolang {
    constructor() {
    	// put all the default values here
      	this.metricSystem = "SI";
      	this.mapType = "OSM";

        var context = this;
        Object.entries(components).forEach(function(component){
          let propName = component[0];
          let propModule = component[1];
          Object.assign(context, {[propName]: propModule});
        });
   	}

   	// Setters
   	setConfig(config){
      	this.metricSystem = config.metricSystem;
      	this.mapType = config.mapType;   		
   	}
}

if (typeof window !== 'undefined') {
	window.Hydrolang = Hydrolang;
}

export default Hydrolang;