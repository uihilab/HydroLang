import HydroLang from "../hydro.js";

/**
 * Containers for all the impelmentations for the BMI.js on HydroLang
 * @namespace HydroBMI
 * @property {function} hydro -  HydroLang instance kept live under the namespace.
 */

/**
 * Provides the hydro instance from HydroLang.js and other variables for usage.
 * @namespace HydroBMI.Hydro
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
