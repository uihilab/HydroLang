/** "The Basic Model Interface (BMI) JavaScript specification."
 * This language specification is derived from the Scientific Interface
 * Definition Language (SIDL) file bmi.sidl located at
 * https://github.com/csdms/bmi.
 * @class
 * @name BMI
 * @memberof HydroBMI
 * @see https://github.com/uihilab/BMI-JS
 */

 export default class BMI {
  /**
   * Perform startup tasks for the model.
   * Perform all tasks that take place before entering the model's time
   * loop, including opening files and initializing the model state. Model
   * inputs are read from a text-based configuration file, specified by
   * "config_file".
   * @method initialize
   * @memberof BMI
   * @param {String} config_file - The path to the model configuration file
   */

  initialize(config_file) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Advance model state by one time step.
   * Perform all tasks that take place within one pass through the model's
   * time loop. This typically includes incrementing all of the model's
   * state variables. If the model's state variables don't change in time,
   * then they can be computed by the :function:`initialize` method and this
   * method can return with no action.
   * @method update
   * @memberof BMI
   */

  update() {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Advance model state until the given time.
   * @method update_until
   * @memberof BMI
   * @param {Number} time - A model time.
   */

  update_until(time) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Perform tear-down tasks for the model.
   * Perform all tasks that take place after exiting the model's time
   * loop. This typically includes deallocating memory, closing files and
   * printing reports.
   * @method finalize
   * @memberof BMI
   */

  finalize() {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Gets name of the component.
   * @method get_component_name
   * @memberof BMI
   * @returns {String} - The name of the component
   */

  get_component_name() {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Count of a model's input variables.
   * @method get_input_item_count
   * @memberof BMI
   * @returns {Number} - The number of input variables.
   */

  get_input_item_count() {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Count of a model's output variables.
   * @method get_output_item_count
   * @memberof BMI
   * @returns {Number} - The number of output variables.
   */

  get_output_item_count() {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Gets an Array of names for the variables the model can use from other models implementing a BMI.
   * @method get_input_var_names
   * @memberof BMI
   * @returns {Object[]} -  The names are returned from the function in an Array, a standard container in the language.
   */

  get_input_var_names() {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Gets an Array of names for the variables the model can provide to other models implementing a BMI.
   * @method get_output_var_names
   * @memberof BMI
   * @returns {Object[]} -  The names are returned from the function in an Array, a standard container in the language.
   */

  get_output_var_names() {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get grid identifier for the given variable.
   * @method get_var_grid
   * @memberof BMI
   * @param {String} name - An input or output variable name, a CSDMS Standard Name
   * @returns {Number} - The grid identifier.
   */

  get_var_grid(name) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get data type of the given variable.
   * @method get_var_type
   * @memberof BMI
   * @param {String} name - An input or output variable name, a CSDMS Standard Name
   * @returns {String} - The variable type; e.g., "str", "int", "float".
   */

  get_var_type(name) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   *  Get units of the given variable.
   *  Standard unit names, in lower case, should be used, such as
   *  "meters" or "seconds". Standard abbreviations, like "m" for
   *  meters, are also supported. For variables with compound units,
   *  each unit name is separated by a single space, with exponents
   *  other than 1 placed immediately after the name, as in "m s-1"
   *  for velocity, "W m-2" for an energy flux, or "km2" for an
   *  area.
   * @method get_var_units
   * @memberof BMI
   * @param {String} name - An input or output variable name, a CSDMS Standard Name
   * @returns {String} - The variable units.
   */

  get_var_units(name) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Provides the size, in bytes, of a single element of the variable
   * @method get_var_itemsize
   * @memberof BMI
   * @param {String} name - An input or output variable name, a CSDMS Standard Name
   * @returns {Number} - Item size in bytes.
   */

  get_var_itemsize(name) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * The function provides the total amount of memory used to store a variable; i.e., the number of items multiplied by the size of each item
   * @method get_var_nbytes
   * @memberof BMI
   * @param {String} name - An input or output variable name, a CSDMS Standard Name
   * @returns {Number} - the total amount of memory used by the variable is returned from the function.
   */

  get_var_nbytes(name) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get the grid element type that the a given variable is defined on.
   * The grid topology can be composed of *nodes*, *edges*, and *faces*.
   * *node*
   *     A point that has a coordinate pair or triplet: the most
   *     basic element of the topology.
   * *edge*
   *     A line or curve bounded by two *nodes*.
   * *face*
   *     A plane or surface enclosed by a set of edges. In a 2D
   *     horizontal application one may consider the word “polygon”,
   *     but in the hierarchy of elements the word “face” is most common.
   * @method get_var_location
   * @memberof BMI
   * @param {String} name - An input or output variable name, a CSDMS Standard Name
   * @returns {String} - The grid location on which the variable is defined. Must be one of "node", "edge", or "face".
   */

  get_var_location(name) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Current time of the model
   * @method get_current_time
   * @memberof BMI
   * @param {String} name - An input or output variable name, a CSDMS Standard Name
   * @returns {Number} - The current model time.
   */

  get_current_time() {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Start time of the model. Model times should be of type float
   * @method get_start_time
   * @memberof BMI
   * @returns {Number} -The model start time.
   */

  get_start_time() {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * End time of the model
   * @method get_end_time
   * @memberof BMI
   * @returns {Number} -The maximum model time.
   */

  get_end_time() {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Time units of the model
   * @method get_time_units
   * @memberof BMI
   * @returns {String} -The model time unit; e.g., 'days' or 's'.
   */

  get_time_units() {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Current time step of the model. The model time step should be of type Number
   * @method get_time_step
   * @memberof BMI
   * @returns {Number} -The time step used in model.
   */

  get_time_step() {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   *  Get a copy of values of the given variable.
   *  This is a method for the model, used to access the model's
   *  current state. It returns a *copy* of a model variable, with
   *  the return type, size and rank dependent on the variable.
   * @method get_value
   * @memberof BMI
   * @param {String} name - An input or output variable name, a CSDMS Standard Name
   * @param {Object[]} dest - An Array into which to place the values
   * @returns {Object[]} -The same Array that was passed as an input.
   */

  get_value(name, dest) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   *  Get a reference to values of the given variable.
   *  This is a method for the model, used to access the model's
   *  current state. It returns a reference to a model variable,
   *  with the return type, size and rank dependent on the variable.
   * @method get_value_ptr
   * @memberof BMI
   * @param {String} name - An input or output variable name, a CSDMS Standard Name
   * @returns {Object[]} -A reference to a model variable.
   */

  get_value_ptr(name) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get values at particular indices.
   * @method get_value_at_indices
   * @memberof BMI
   * @param {String} name - An input or output variable name, a CSDMS Standard Name
   * @param {Object[]} dest - An Array into which to place the values
   * @param {Object[]} inds - The indices into the variable Array
   * @returns {Object[]} -Value of the model variable at the given location.
   */

  get_value_at_indices(name, dest, inds) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Specify a new value for a model variable.
   * This is the setter for the model, used to change the model's
   * current state. It accepts, through *src*, a new value for a
   * model variable, with the type, size and rank of *src*
   * dependent on the variable.
   * @method set_value
   * @memberof BMI
   * @param {String} name - An input or output variable name, a CSDMS Standard Name
   * @param {Object[]} src - The new value for the specified variable
   */

  set_value(name, src) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Specify a new value for a model variable at particular indices.
   * @method set_value_at_indices
   * @memberof BMI
   * @param {String} name - An input or output variable name, a CSDMS Standard Name
   * @param {Object[]} inds - The indices into the variable Array
   * @param {Object[]} src - The new value for the specified variable
   */

  set_value_at_indices(name, inds, src) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get the grid type as a string.
   * @method get_grid_type
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @returns {String} Type of grid as a string.
   */

  get_grid_type(grid) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get number of dimensions of the computational grid.
   * @method get_grid_rank
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @returns {Number} Rank of the grid.
   */

  get_grid_rank(grid) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get the total number of elements in the computational grid.
   * @method get_grid_size
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @returns {Number} Size of the grid.
   */

  get_grid_size(grid) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get dimensions of the computational grid
   * @method get_grid_shape
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @param {Object[]} shape - A Number Array of n-dim shape into which to place the shape of the grid.
   */

  get_grid_shape(grid, shape) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get dimensions of the computational grid
   * @method get_grid_spacing
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @param {Object[]} spacing - A Number Array of n-dim shape to hold the spacing between grid rows and columns.
   */

  get_grid_spacing(grid, spacing) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get coordinates for the lower-left corner of the computational grid.
   * @method get_grid_origin
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @param {Object[]} origin - A number Array of n-dim shape to hold the coordinates of the lower-left corner of the grid.
   */

  get_grid_origin(grid, origin) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get coordinates of grid nodes in the x direction.
   * @method get_grid_x
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @param {Object[]} x - A Number Array of n-rows shape to hold the x-coordinates of the grid node columns
   */

  get_grid_x(grid, x) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get coordinates of grid nodes in the y direction.
   * @method get_grid_y
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @param {Object[]} y - A Number Array of n-cols shape to hold the y-coordinates of the grid node rows
   */

  get_grid_y(grid, y) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get coordinates of grid nodes in the z direction.
   * @method get_grid_z
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @param {Object[]} z - A Number Array of n-layers shape to hold the z-coordinates of the grid nodes layers.
   */

  get_grid_z(grid, z) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get the number of nodes in the grid.
   * @method get_grid_node_count
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @returns {Number} The total number of grid nodes
   */

  get_grid_node_count(grid) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get the number of edges in the grid
   * @method get_grid_edge_count
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @returns {Number} The total number of grid edges
   */

  get_grid_edge_count(grid) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get the number of faces in the grid.
   * @method get_grid_face_count
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @returns {Number} The total number of grid faces.
   */

  get_grid_face_count(grid) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get the edge-node connectivity.
   * @method get_grid_edge_nodes
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @param {Object[]} edge_nodes - A Number Array of (2 x n-nodes) shape to place the edge-node connectivity. For each edge, connectivity is given as node at edge tail, followed by node at edge head.
   */

  get_grid_edge_nodes(grid, edge_nodes) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get the face-edge connectivity.
   * @method get_grid_face_edges
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @param {Object[]} face_edges - A Number Array to place the face-edge connectivity.
   */

  get_grid_face_edges(grid, face_edges) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get the face-edge connectivity.
   * @method get_grid_face_nodes
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @param {Object[]} face_nodes - A number Array to place the face-node connectivity. For each face, the nodes (listed in a counter-clockwise direction) that form the boundary of the face.
   */

  get_grid_face_nodes(grid, face_nodes) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }

  /**
   * Get the face-edge connectivity.
   * @method get_grid_nodes_per_face
   * @memberof BMI
   * @param {Number} grid - A grid identifier
   * @param {Object[]} nodes_per_face - A number Array of (n-faces)shape to place the number of nodes per face.
   */

  get_grid_nodes_per_face(grid, nodes_per_face) {
    throw new Error(
      "BMI.js does not have an implementation of this method. Implement where class is inherited"
    );
  }
}
