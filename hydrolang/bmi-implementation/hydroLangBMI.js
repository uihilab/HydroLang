//Required imports for the library usage.
import BMI from "./bmi.js";
import { Hydro } from "./globalHydro.js";
import BMIConfig from "./bmiConfig.js";

//Calling the HydroLang instance from previously defined namespace
const hydro = Hydro.ins(),
  config = new BMIConfig();

/**
 * BMI implementation of the functions of HydroLang.js
 * Creates and updates forcings and data following the models from configuration files
 * and makes calls from other modules.
 * If no link is added into the configuration, then an error will be raised.
 * All instances of HydroLang will be accessible through the BMI configuration
 * file.
 * @class 
 * @name HydroLangBMI
 * @extends BMI
 * @param {String} configfile
 */

class HydroLangBMI extends BMI {
  constructor(configfile = undefined) {
    super();
    if (!configfile || configfile == undefined) {
      throw Error(
        "BMI_FAILURE: Cannot initialize library. Please provide configuration file!"
      );
    } else {
      this.initialize(configfile);
    }
  }

  /**
   * @method initialize
   * @memberof HydroLangBMI
   * @param {String} configfile - configuration file that contains minimum the following:
   * model name, component name, module name, model code, function name, arguments, parameters.
   * @returns {void} sets the variables from above to the this object.
   */

  initialize(configfile = undefined) {
    if (configfile) {
      fetch(configfile)
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          this._modelName = data["modelName"];
          this._componentName = data["componentName"];
          this._moduleName = data["moduleName"];
          this._modelCode = data["modelCode"];
          this._functionName = data["functionName"];
          this._args = data["args"];
          this._params = data["params"];
          this.results = [];

          //Defining the default step to be 1 unit in case there is nothing passed as a parameter
          //Time stamp parameter still dealt with in unixtime to avoid further confusion down the line
          !data["duration"]["defaultStep"]
            ? (this._defaultStep = 1 * 3600)
            : (this._defaultStep = data["duration"]["defaultStep"] * 3600);

          //Defining the default units for the time

          //Possibilities in time types: s, min, h, d
          !data["duration"]["timeUnit"]
            ? (this._timeUnit = "h")
            : (this._timeUnit = data["duration"]["timeUnit"]);

          //Time parameters
          //Assuming the required data to be used for simulations are the same as the API calls. If not, a time parameter must be specified.
          !data["duration"]["startTime"]
            ? (() => {
                var stageDate = new Date(this._args["startDate"]),
                stgUnix = stageDate.getTime() / 1000;
                this._timeUnit === "hr" ? stgUnix / 1000 : stgUnix;
                return (this._startTime = stgUnix);
              })()
            : (this._startTime = data["duration"]["startTime"]);
          !data["duration"]["endTime"]
            ? (() => {
                var stageDate = new Date(this._args["endDate"]),
                stgUnix = stageDate.getTime() / 1000;
                this._timeUnit === "hr" ? stgUnix / 1000 : stgUnix;
                return (this._endTime = stgUnix);
              })()
            : (this._endTime = data["duration"]["endTime"]);

          this._inputVars = data["inputVars"];
          this._inputVars.forEach((str) => {
            eval(`this._${str}`);
          });
          this._outputVars = data["outputVars"];
          this._outputVars.forEach((str) => {
            eval(`this._${str}`);
          });
          this._now = 0;

          this._inputUnits = data["units"]["input"];
          this._outputUnits = data["units"]["output"];

          this._params.calls
            ? console.log("Multiple Calls Required.")
            : this.handleConfig();
        });
    }
  }

  /**
   * Update the model until a required time,
   * Depending on the module and function required.
   * @method update
   * @memberof HydroLangBMI
   */

  update() {
    this.update_until();
  }

  /**
   * Updates a model and function call depending on the requirements
   * of the function and module called.
   * @method update_until
   * @memberof HydroLangBMI
   * @param {Number} time - default time to be updated depending on the model
   * @returns {void} updates the current variable to the required timestep.
   */

  update_until(time = this._now + this._defaultStep) {
    var finalUpate = Math.min(this._endDate, time);
    this._now = finalUpate;
    return this.now;
  }

  /**
   * Finalizes the requirements of a specific function.
   * @method finalize
   * @memberof HydroLangBMI
   * @returns {void} alert about model simulation being finalized.
   */

  finalize() {
    for (const prop of Object.getOwnPropertyNames(this)) {
      delete this[prop];
    }
    return alert("Model has finished");
  }

  /**
   * Gives back a model name defined by the configuration file
   * @method get_component_name
   * @memberof HydroLangBMI
   * @param {void}
   * @returns {String} model and modelcode as a full name
   */

  get_component_name() {
    return `${this._modelName} - ${this._modelCode}`;
  }

  /**
   * Lets other models see the available variables included within the model
   * @method get_input_item_count
   * @memberof HydroLangBMI
   * @param {void}
   * @return {Object} array with names as strings
   */

  get_input_item_count() {
    return Object.keys(this._inputVars).length;
  }

  /**
   * Lets other models see the number of available variables as outputs from this model
   * @method get_output_item_count
   * @memberof hydroLangBMI
   * @returns {Number} Number of output variables
   */

  get_output_item_count() {
    return this._outputVars.length;
  }

  /**
   * Returns the names of the variables used as inputs for this model
   * @method get_input_var_names
   * @memberof hydroLangBMI
   * @returns {Object[]} Array with strings of input variable names
   */

  get_input_var_names() {
    return this._inputVars;
  }

  /**
   * Returns the names of the variables used as outputs for this model
   * @method get_ouput_var_names
   * @memberof hydroLangBMI
   * @returns {Object[]} Array with strings of input variable names
   */

  get_output_var_names() {
    return this._outputVars;
  }

  /**
   * Returns the id for the grid used in a model for a specific variable.
   * HydroLang does not used a grid system. If implemented, uses 1 single location at '0' index.
   * @method get_var_grid
   * @memberof hydroLangBMI
   * @returns {Number} Grid identifier.
   */

  get_var_grid() {
    return 0;
  }

  /**
   * Returns the data type of the given variable.
   * @method get_var_type
   * @memberof HydroLangBMI
   * @param {String} name - input or output variable name, a CSDMS Standard Name
   * @returns {String} Variable nme depending on the type of variable.
   */

  get_var_type(varName) {
    varName = 0;
    return typeof varName;
  }

  /**
   * Returns the units of the given variable.
   * @method get_var_units
   * @memberof hydroLangBMI
   * @param {String} var_name
   * @returns {String} units of the variable in question.
   */

  get_var_units(var_name) {
    var unitsIn = this.value_index(var_name, this._inputVars),
      unitsOut = this.value_index(var_name, this._outputUnits);
    if (unitsIn != "object") {
      return this._inputUnits[unitsIn];
    }
    if (unitsOut != "object") {
      return this._outputUnits[unitsOut];
    }
  }

  /**
   * Returns the size, in bytes, of a single element of a variable.
   * @method get_var_itemsize
   * @memberof hydroLangBMI
   * @param {String} var_name - Input name of the variable
   * @returns {Number} Size of a single item in a variable
   */

  get_var_itemsize(var_name) {
    return this.dataTypes[typeof var_name](var_name);
  }

  /**
   * Provides the total amount of memory used for a variable.
   * @method get_var_nbytes
   * @memberof hydroLangBMI
   * @param {String} var_name - Input or ouput variable
   * @returns {Number} Total size of the variable
   */

  get_var_nbytes(var_name) {
    return this.dataTypes[typeof var_name](var_name);
  }

  /**
   * Returns the location of a variable in space or time (whether input or output)
   * @method get_var_location
   * @memberof hydroLangBMI
   * @param {String} var_name - Input or output variable
   * @returns {String} Location of the variable in the predfined structure of the model (node, edge, face)
   */

  get_var_location(var_name) {
    throw new Error("Please implement as required in your case study.");
  }

  /**
   * Start time of the model.
   * @method get_start_time
   * @memberof hydroLangBMI
   * @returns {Number} start time of the simulation as specified by the simulation file
   */
  get_start_time() {
    return this._startTime;
  }

  /**
   * End time of the model.
   * @method get_end_time
   * @memberof HydroLangBMI
   * @returns {Number} end time specified.
   */

  get_end_time() {
    return this._endTime;
  }

  /**
   * Time units of the model
   * @method get_time_units
   * @memberof HydroLangBMI
   * @returns {String} unit of time. If not specified in config file, the unit used throughout HydroLang is hour
   */

  get_time_units() {
    return this._timeUnit;
  }

  /**
   * Returns the current state of the model. For HydroLangBMI is the default time step.
   * @method get_time_step
   * @memberof HydroLangBMI
   * @returns {Number} default time step
   */

  get_time_step() {
    return this._defaultStep;
  }

  /**
   * Current time of the model
   * @method get_current_time
   * @memberof HydroLangBMI
   * @returns {Number} - The current model time.
   */

  get_current_time() {
    return this._now;
  }

  /**
   * Copies the values from a variable into an array.
   * @method get_value
   * @memberof hydroLangBMI
   * @param {String} var_name - name of input or output variable
   * @param {Object[]} array - Array object that will hold a copy of the values of the var
   * @returns {Object[]} - Array with copied values
   */

  get_value(var_name, array) {
    array = [...var_name];
    return array;
  }

  /**
   * Get a reference to the values of a given variable. Tailored towards the
   * final implementation of the
   * @method get_value_ptr
   * @memberof HydroLangBMI
   * @param {String} var_name - name of input or output variable
   * @param {Object[]} array - array object holding result
   * @returns {Error} no implementation for HydroLangBMI/JavaScript.
   */

  get_value_ptr(var_name, array) {
    throw new Error("No implementation for HydroLangBMI in JavaScript.");
  }

  /**
   * @method get_value_at_indices
   * @memberof HydroLangBMI
   * @param {String} var_name - name of input variable
   * @param {Object[]} dest - array destiny for the results
   * @param {Object[]} inds - array containing the indices
   * @returns {Object[]} destiny array with objects
   */

  get_value_at_indices(var_name, dest, inds) {
    throw new Error("Please implement as required in your case study.");
  }

  /**
   * Sets a value for an exisiting variable from an array.
   * @method set_value
   * @memberof HydroLangBMI
   * @param {String} var_name - name of the input variable
   * @param {Object[]} array - array with values to be copied
   */

  set_value(var_name, array) {
    var_name = [...array];
  }

  /**
   * Sets values at particular indices
   * @method set_value_at_indices
   * @memberof HydroLangBMI
   * @param {String} var_name - name of input variable
   * @param {Object[]} inds - array containing the indices
   * @param {Object[]} dest - array contaiing the results
   */

  set_value_at_indices(var_name, inds, dest) {
    throw new Error("Please implement as required in your case study.");
  }

  /**
   * Get the grid type as a string.
   * @method get_grid_type
   * @memberof HydroLangBMI
   * @param {Number} grid - A grid identifier
   * @returns {String} Type of grid as a string.
   */

  get_grid_type(grid) {
    throw new Error("Please implement as required in your case study.");
  }

  /**
   * Get the dimensions of a computational grid.
   * @method get_grid_size
   * @memberof HydroLangBMI
   * @param {Number} grid- grid identifier
   * @returns {Number} Grid rank
   */

  get_grid_rank(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Get the dimensions of a computational grid.
   * @method get_grid_size
   * @memberof HydroLangBMI
   * @param {Number} grid - grid identifier
   * @returns {Number} Grid size
   */

  get_grid_size(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Get dimensions of the computational grid
   * @method get_grid_shape
   * @memberof HydroLangBMI
   * @param {Number} grid - grid identifier
   * @param {Object[]} shape - A Number Array of n-dim shape into which to place the shape of the grid.
   */

  get_grid_shape(grid, shape) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Get the spacing between grid nodes.
   * @method get_grid_spacing
   * @memberof HydroLangBMI
   * @param {Number} grid - grid identifier
   * @returns {Object[]} spacing of computational grid
   */

  get_grid_spacing(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Get the origin of a grid.
   * @method get_grid_origin
   * @memberof HydroLangBMI
   * @param {Number} grid - grid identifier
   * @returns {Object[]} coordinates of the origin of a specific grid
   */

  get_grid_origin(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Get the locations of a grid’s nodes in dimension x.
   * @method get_grid_x
   * @memberof HydroLangBMI
   * @param {Number} grid - grid identifier
   * @returns {Object[]} array containing n-rows holding x-coordinates
   */

  get_grid_x(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Get the locations of a grid’s nodes in dimension y.
   * @method get_grid_y
   * @memberof HydroLangBMI
   * @param {Number} grid - grid identifier
   * @returns {Object[]} array containing n-rows holding y-coordinates
   */

  get_grid_y(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Get the locations of a grid’s nodes in dimension z.
   * @method get_grid_z
   * @memberof HydroLangBMI
   * @param {Number} grid - grid identifier
   * @returns {Object[]} array containing n-rows holding z-coordinates
   */

  get_grid_z(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Get the number of nodes in the grid.
   * @method get_grid_node_count
   * @memberof HydroLangBMI
   * @param {Number} grid - grid identifier
   * @returns {Number} total number of grid nodes
   */

  get_grid_node_count(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Get the number of edges in the grid.
   * @method get_grid_edge_count
   * @memberof HydroLangBMI
   * @param {Number} grid - grid identifier
   * @returns {Number} total number of grid edges
   */

  get_grid_edge_count(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Get the number of faces in the grid.
   * @method get_grid_face_count
   * @memberof HydroLangBMI
   * @param {Number} grid - A grid identifier
   * @returns {Number} The total number of grid faces.
   */

  get_grid_face_count(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Get the edge-node connectivity.
   * @method get_grid_edge_nodes
   * @memberof HydroLangBMI
   * @param {Number} grid - A grid identifier
   * @returns {Object[]} number array of (2 x n-nodes) shape to place the edge-node connectivity. For each edge, connectivity is given as node at edge tail, followed by node at edge head.
   */

  get_grid_edge_nodes(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Returns the face-edge connectivity.
   * @method get_grid_face_nodes
   * @memberof HydroLangBMI
   * @param {Number} grid - grid identifier
   * @returns {Object[]} number array to place face-edge connectivity
   */

  get_grid_face_edges(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Returns the face-node connectivity for a grid.
   * @method get_grid_face_nodes
   * @memberof HydroLangBMI
   * @param {Number} grid - grid identifier
   * @returns {Object[]} number array to place face-node connectivity
   */

  get_grid_face_nodes(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**
   * Returns the number of nodes per face of grid.
   * @method get_grid_nodes_per_face
   * @memberof HydroLangBMI
   * @param {Number} grid - grid identifier
   * @returns {Object[]} A number Array of (n-faces)shape to place the number of nodes per face.
   */

  get_grid_nodes_per_face(grid) {
    throw Error("Please implement as required in your case study.");
  }

  /**********************************/
  /*** Helper functions **/
  /**********************************/

  /**
   * Configuration object that creates a result based on the passed configurations to the HydroLang instance requirement.
   * It saves any results on a result variable that is attached into the class after its called. The method runs
   * once the HydroLangBMI class is called.
   * @method handleConfig
   * @memberof HydroLangBMI
   * @returns {void} - creates a result variable attached to the class.
   */

  async handleConfig() {
    !this._componentName === null || this._componentName == undefined
      ? this.results.push(
          await hydro[this._moduleName][this._functionName]({
            args: this._args,
            params: this._params,
            data: this._inputVars,
          })
        )
      : this.results.push(
          await hydro[this._moduleName][this._componentName][
            this._functionName
          ]({ args: this._args, params: this._params, data: this._inputVars })
        );
  }

  /**
   * @method value_index
   * @memberof hydroLangBMI
   * @returns {Number} index location of variable in array
   * Retrieves the index of variables in any specific array
   */

  value_index(value, searchArray) {
    var res;
    searchArray.indexOf(value) != -1 || searchArray.indexOf(value) != undefined
      ? (res = searchArray.indexOf(value))
      : (res = Error("No variable with that naming found in the given array."));
    return res;
  }

  /**
   * @method visualizer
   * @memberof HydroLangBMI
   * @param {String} type - either column or line chart
   * @param {Object[]} data - n-d array containing the data to render
   * @returns {Object} creates a div on screen that renders the graph using HydroLang's visualize module.
   */

  visualizer(chart, data, name) {
    name = name || null;
    hydro["visualize"]["draw"]({
      params: { type: "chart", name: name ? name : this._modelName },
      args: { charttype: chart },
      data: data,
    });
  }

  /**
   * Creates an output file downloaded to local machine with the outputs of the model
   * results.
   * @method generateOutputs
   * @todo Finilize implementation
   * @memberof HydroLangBMI
   * @returns {Object} creates a memory reporter for all the values and actions taken for the model run
   */

  generateOutputs(data) {
    var outputData = {};
    //Data manipulation for downloading and stuff
    config.configGen(outputData);
  }

  /**
   * Returns the data types found within JS and used throughout
   * a specific model run.
   * @method dataTypes
   * @memberof HydroLangBMI
   * @returns {String} type of value passed to the function
   */

  dataTypes = {
    undefined: () => 0,
    boolean: () => 4,
    number: () => 8,
    string: (item) => 2 * item.length,
    object: (item) => {
      let str = JSON.stringify(item);
      const bytes = new TextEncoder().encode(str).length;
      return bytes;
    },
  };

  /**********************************/
  /*** End of Helper functions **/
  /**********************************/
}
typeof window !== "undefined" ? (window.HydroLangBMI = HydroLangBMI) : null;

export default HydroLangBMI;