import * as components from "./components/core.js";

/**
 * Main framework wrapper. Creates a new instance of all modules as objects.
 * @class Hydrolang
 * @extends core
 * @returns {Object} creates a new instance of the whole library.
 */
class Hydrolang {
  constructor() {
    this.metricSystem = "SI";
    this.mapType = "OSM";

    var context = this;
    Object.entries(components).forEach(function (component) {
      let propName = component[0];
      let propModule = component[1];
      Object.assign(context, {
        [propName]: propModule,
      });
    });
  }

  // Setters
  setConfig(config) {
    this.metricSystem = config.metricSystem;
    this.mapType = config.mapType;
  }
}

if (typeof window !== "undefined") {
  window.Hydrolang = Hydrolang;
}

export default Hydrolang;
