import * as datasources from './datasources.js';
import $ from '../../modules/jquery/jquery.js';


/**
 * Main function to retrieve data
 * @param {JSON} params contain paramaters to retrieve data
 * @returns {JSON} retrieved data.
 */
function retrieve(params, callback) {
	var source = params["source"];
	var dataType = params["dataType"]
	if(!(datasources[source] && datasources[source].hasOwnProperty(dataType))){
		callback({
			"info": "No data has been found for given specifications."
		});
		return;
	};

	var dataSource = datasources[source][dataType];
	var head = "";
	
	if (params.hasOwnProperty("token") || params.hasOwnProperty("key")) {
		head=params["token"];
	};	

	$.ajax({
		url: dataSource["endpoint"],
		data: params["arguments"],
		dataType: params["type"],
		method: 'GET',
		headers: {'token' : head,
		},
		success: function(data, status, xhr){
			callback(data)
		},
		error: function(){}
	});
};


/**
 * Convert data types to one another
 * @param {Object} data to be transformed as an object array.
 * @param {JSON} transformation configuration
 * @returns {Object} transformed data
 * @example
 * var data = {"temperature": "64"} as Object;
 * var config = {"type": "CSV", "keep": ["date", "values"]};
 * var dataCSV = transform(data, config);
 */
function transform(data, config) {
	var type = config['type'];
	var clean;
	if (config.hasOwnProperty('keep')) {
	clean = config['keep'];
	};
	
	//verify if the object is an object to go to the following step.
	var arr = data.map((_arrayElement) => Object.assign({}, _arrayElement));
	arr = typeof arr != 'object' ? JSON.parse(arr) : arr;

	//values to be left on the object according to user, fed as array.
	var keep = new RegExp(clean.join("|"));
	for (var i = 0; i < arr.length; i++) {
		for (var k in arr[i]) {
			keep.test(k) || delete arr[i][k];
		};
	};

	//convert array of objects into array of arrays for further manipulation.
	if (type === 'ARR') {
		var arrays = arr.map(function(obj) { return Object.keys(obj).sort().map(function(key) { return obj[key]})})
		var final = Array(arrays[0].length).fill(0).map(() => Array(arrays.length).fill(0));
		for (var j = 0; j < arrays[0].length; j++) {
			for (var n = 0; n < arrays.length; n++) {
				final[j][n] = arrays[n][j];
			};
		};
		return final;
	}
	
	// convert from JSON to CSV
	 else if (type === 'CSV') {
		var str = '';
		for (var i = 0; i < arr.length; i++){
			var line = '';
			for (var index in arr[i]) {
				if (line != '') line += ','

				line += `\"${arr[i][index]}\"`;
			};
			str += line + '\r\n'
		};
		return str;
	}

	//covert data from Object to JSON
	else if (type === 'JSON') {
		return arr;
	}

	//convert data from JSON to XML
	else if (type === 'XML') {
		var xml = '';
		for (var prop in data) {
			xml += data[prop] instanceof Array ? '' : "<" + prop + ">";
			if (data[prop] instanceof Array) {
				for (var array in data[prop]) {
					xml += "<" + prop + ">";
					xml += transform(new Object(data[prop], config));
				}
			} else if (typeof data[prop] == "object") {
				xml += transform(new Object(data[prop], config));
			} else {
				xml += data[prop];
			}
			xml += data[prop] instanceof Array ? '' : "</" + prop + ">";
		}
		var xml = xml.replace(/<\/?[0-9]{1,}>/g,'');
		return xml;
	} else {
		throw new Error ('Please select a supported data conversion type!')
	}
}

/**
 * Download files on different formats, depending on the formatted object.
 * @param {Object} data to be downloaded, pre processed using transform function.
 * @param {JSON} download configuration
 * @returns {Object} downloaded data as link from HTML file.
 * @example
 */
function datadownload(data, config) {
	var cof = config;
	var blob;
	var exportfilename;
	switch (blob) {
		case (cof === 'CSV') :
			blob = new Blob([data], {type: 'application/csv; charset = utf-8;'});
			exportfilename = 'export.csv';
			break;
		case (cof  === 'XML'):
			blob = new Blob([data], {type: 'text/xml'});
			exportfilename = 'export.xml';
			break;
		case (cof === 'JSON'):
			blob = new Blob([data], {type: 'text/json'});
			exportfilename = 'export.json';
			break;
		default:
			break;
	};
	
	/*if (config['convtype'] = 'CSV') {
		if (config['options'].hasOwnProperty('headers')){
			var head= config['options']['headers']
			arr.unshift(head)
		}
		*/
	if (window.navigator.msSaveOrOpenBlob) {
		window.navigator.msSaveBlob(blob, exportfilename);
	} else {
		var a = window.document.createElement("a");
		a.href = window.URL.createObjectURL(blob, {type: "text/plain"});
		a.download = exportfilename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
}

export{
	retrieve,
	transform,
	datadownload
}