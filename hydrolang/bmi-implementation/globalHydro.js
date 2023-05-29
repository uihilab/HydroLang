import HydroLang from "../hydro.js";

/**
 * Provides the hydro instance from HydroLang.js and other variables for usage.
 * @namespace HydroBMI
 * @property {function} hydro -  HydroLang instance kept live under the namespace.
 */
var Hydro =
  Hydro ||
  (() => {
    var hydro = new HydroLang();
    return {
      /**
       * @method ins
       * @memberof Hydro
       * @returns {Object} HydroLang instance
       */
      ins: () => {
        return hydro;
      },
    };
  })();

export { Hydro };
