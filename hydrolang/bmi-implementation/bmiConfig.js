//Instantiation of the HydroLang class for usage in BMI
import { Hydro } from "./globalHydro.js";
const hydro = Hydro.ins();

/**
 * Class creator for BMI configuration file. Allows for specification or requirements
 * easily and without need for compromises on errors.
 * Arguments passed to the constructor depend on the type of requirements needed from HydroLang
 * @class
 * @name BMIConfig
 * @memberof HydroBMI
 * @member HydroBMI.BMIConfig
 */
class BMIConfig {

  /**
   * Creates a configuration steering file to be used on the BMI HydroLang implementation.
   * @memberof BMIConfig
   * @member configGen
   * @param {String} model - model name
   * @param {String} modelCode - code for model if required
   * @param {String} module - module name
   * @param {String} func - function required from module
   * @param {Object} arg - JSON with the arguments required for the function
   * @param {Object} params - JSON with the parameters required for the function
   * @param {Object} inputVars -  Array with strings of names passed to the model
   * @param {Object} outputVars - Array with string of names passed to the model
   * @param {Object} timeData  - JSON with the configuration of startTime, endTime, and timeStep
   */

  configGen(...args) {
    var fileExport = args[0]
    ;

    //Due to security reasons, the downloaded data will be saved in the download folder. Move to the model location afterwards.
    hydro.data.download({
      params: { input: 'config' },
      args: { type: "JSON",  },
      data: fileExport,
    });
    return;
  }
};

(typeof window !== "undefined") ? window.BMIConfig = BMIConfig : null
export default BMIConfig
