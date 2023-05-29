import * as components from "./modules/core.js";

/**
 * Main framework wrapper. Creates a new instance of all modules as objects.
 * @class 
 * @namespace Hydrolang
 * @extends core
 * @returns {Object} creates a new instance of the whole library.
 */
class Hydrolang {
  constructor() {
    var context = this;
    Object.entries(components).forEach((component) => {
      let propName = component[0];
      let propModule = component[1];
      Object.assign(context, {
        [propName]: propModule,
      });
    });
  }
}

if (typeof window !== "undefined") {
  window.Hydrolang = Hydrolang;
}

export default Hydrolang;
