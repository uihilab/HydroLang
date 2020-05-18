import datasources from './datasources.js';
import $ from '../../modules/jquery.js';

/**
 * Main function to retrieve data
 * @param {JSON} params contain paramaters to retrieve data
 * @returns {JSON} retrieved data.
 */
function retrieve(params, callback) {
	var source = params["source"];
	var dataType = params["dataType"]
	if(!(datasources.hasOwnProperty(source) && datasources[source].hasOwnProperty(dataType))){
		return {
			"info": "No data has been found for given specifications."
		};
	}

	var dataSource = datasources[source][dataType];

	$.get(dataSource["endpoint"], params["arguments"], function(data,status,xhr){
		callback(data);
	});
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