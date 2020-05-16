/**
 * Main function to retrieve data
 * @param {JSON} params contain paramaters to retrieve data
 * @returns {JSON} retrieved data.
 */
function retrieve(params) {
	return "Data retrieved based on: "+params;
}

/**
 * Convert data types to one another
 * @param {Object} data to be transformed
 * @param {JSON} transformation configuration
 * @returns {Object} transformed data
 * @example
 * var data = {"temperature": "64"};
 * var config = {"from": "JSON", "to": "CSV"};
 * var dataCSV = transform(data, config);
 */
function transform(data, config) {
	return "Data is transformed";
}

export{
	retrieve,
	transform
}