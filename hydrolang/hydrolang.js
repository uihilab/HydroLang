import Data from './components/data/data.js';

class Hydrolang {
    constructor() {
    	// put all the default values here
      	this.metricSystem = "SI";
      	this.mapType = "OSM";
   	}

   	Data(source){
   		return new Data(source);
   	}


   	// Setters
   	setConfig(config){
      	this.metricSystem = config.metricSystem;
      	this.mapType = config.mapType;   		
   	}
}

if (typeof window !== 'undefined') {
	window.Hydrolang = new Hydrolang;
}

export default Hydrolang;