import * as datasources from "./datasources.js";
import $ from "../../modules/jquery/jquery.js";
import stats from "../analyze/core/stats.js";

/**
 * Main function to retrieve data. Requires a callback handler after data has been downloaded.
 * @function retrieve
 * @memberof data
 * @param {Object} params - contain paramaters to retrieve data.
 * @param {Function} callback - data handler: either prompt to console, save to variable, etc.
 * @returns {Object} Object with retrieved data.
 */

function retrieve(params, callback) {
  //obtain data from parameters set by user.
  var source = params["source"];
  var dataType = params["dataType"];
  var args = params["arguments"];
  var type = params["type"];

  //verify if the data is contained within the hydrolang databases.
  if (!(datasources[source] && datasources[source].hasOwnProperty(dataType))) {
    callback({
      info: "No data has been found for given specifications.",
    });
    return;
  }

  //if source exists, then obtain the object from sources.
  var dataSource = datasources[source][dataType];
  var endpoint = dataSource["endpoint"];
  var met = datasources[source]["requirements"]["method"];

  //define proxy if required by the source
  var proxy = "";
  var proxif = datasources[source]["requirements"]["needProxy"];

  if (params.hasOwnProperty("proxyurl")) {
    proxy = params["proxyurl"];
  } else if (proxif == true) {
    callback({ info: "please verify if the resource needs a proxy server." });
  }

  //create headers if required depending on the type supported.
  var head = {};
  var keyname = "";

  //assign key or token to value in case it is required by the source.
  if (datasources[source]["requirements"].hasOwnProperty("keyname")) {
    keyname = datasources[source]["requirements"]["keyname"];
    if (params.hasOwnProperty(keyname)) {
      Object.assign(head, { [keyname]: params[keyname] });
    } else {
      callback({ info: "please verify the keyname of the source." });
    }
  }
  
  //retrieve the data and feed the data into callback.
  $.ajax({
    url: proxy + endpoint,
    data: args,
    type: type,
    method: met,
    headers: head,
    success: function (data, status, xhr) {
      callback(data);
    },
    error: function () {},
  });
}

/**
 * Convert data types to one another.
 * @function transform
 * @memberof data
 * @param {Object} data - to be transformed as an object array.
 * @param {Object} config - transformation configuration
 * @returns {Object} Object in different formats with transformed data
 * @example
 * var data = {"temperature": "64"} as Object;
 * var config = {"type": "CSV", "keep": ["date", "value"]};
 * var dataCSV = transform(data, config);
 */

function transform(data, config) {
  var type = config["type"];
  var clean;

  //verify if the object is an object. Go to the following step.
  var arr = data.map((_arrayElement) => Object.assign({}, _arrayElement));
  arr = typeof arr != "object" ? JSON.parse(arr) : arr;

  if (config.hasOwnProperty("keep")) {
    clean = config["keep"];
  //values to be left on the object according to user, fed as array.
  var keep = new RegExp(clean.join("|"));
  for (var i = 0; i < arr.length; i++) {
    for (var k in arr[i]) {
      keep.test(k) || delete arr[i][k];
    }
  }
} else {
  //if params dont have a keep array, continue.
  arr = arr;
}
  //convert array of objects into array of arrays for further manipulation.
  if (type === "ARR") {
    var arrays = arr.map(function (obj) {
      return Object.keys(obj)
        .sort()
        .map(function (key) {
          return obj[key];
        });
    });
    var final = Array(arrays[0].length)
      .fill(0)
      .map(() => Array(arrays.length).fill(0));
    for (var j = 0; j < arrays[0].length; j++) {
      for (var n = 0; n < arrays.length; n++) {
        final[j][n] = arrays[n][j];
      }
    }
    console.timeEnd("transform");
    return final;
  }

  // convert from JSON to CSV
  else if (type === "CSV") {
    if (data[0] instanceof Array) {
      arr = stats.arrchange(data)
    } else {arr = arr}
    var str = "";
    for (var i = 0; i < arr.length; i++) {
      var line = "";
      for (var index in arr[i]) {
        if (line != "") line += ",";

        line += `\"${arr[i][index]}\"`;
      }
      str += line + "\r\n";
    }
    console.timeEnd("transform");
    return str;
  }

  //covert data from Object to JSON
  else if (type === "JSON") {
    var js = JSON.stringify(arr);
    console.timeEnd("transform");
    return js;
  }

  //convert data from JSON to XML
  else if (type === "XML") {
    var xml = "";
    for (var prop in arr) {
      xml += arr[prop] instanceof Array ? "" : "<" + prop + ">";
      if (arr[prop] instanceof Array) {
        for (var array in arr[prop]) {
          xml += "<" + prop + ">";
          xml += transform(new Object(arr[prop], config));
        }
      } else if (typeof arr[prop] == "object") {
        xml += transform(new Object(arr[prop], config));
      } else {
        xml += arr[prop];
      }
      xml += arr[prop] instanceof Array ? "" : "</" + prop + ">";
    }
    var xml = xml.replace(/<\/?[0-9]{1,}>/g, "");
    console.timeEnd("transform");
    return xml;
  } else {
    throw new Error("Please select a supported data conversion type!");
  }
}

/**
 * data upload from the local storage of the user for analysis.
 * @function upload
 * @memberof data
 * @param {string} type - type of data to be uploaded (CSV, JSON).
 * @example var xo = hydro1.data.upload('CSV')
 */

function upload(type) {
  //create a new element to upload on header.
  var f = document.createElement("input");
  f.type = "file";
  f.accept = type;
  var ret;

  //create a new type of object depending on the type selected by user.
  if (type === "CSV") {
    ret = [];
  } else if (type === "JSON") {
    ret = new Object();
  }

  //intialize the caller for obtaining the files.
  const selectors = () => {
    //create input file selector.
    f.onchange = (e) => {
      //select file by the user
      var file = e.target.files[0];

      //read the file
      var reader = new FileReader();

      //read as text file.
      reader.readAsBinaryString(file);

      //file reading started.
      reader.addEventListener("loadstart", () => {
        console.log("File is being read.");
      });

      //file reading failed
      reader.addEventListener("error", () => {
        alert("Error: Failed to read file.");
      });

      //file read progress
      reader.addEventListener("progress", (e) => {
        if (e.lengthComputable == true) {
          var percent = Math.floor((e.loaded / e.total) * 100);
          console.log(percent + "% read.");
          performance.now()
        }
      });

      //after the data has been loaded, change it to the required type.
      reader.onload = (readerEvent) => {
        var content = readerEvent.target.result;

        //conversion of the data from CSV to array.
        if (type === "CSV") {
          var alltext = content.split(/\r\n|\n/);
          var med = [];
          for (var i = 0; i < alltext.length; i++) {
            var data = alltext[i].split(",");
            var tarr = [];
            for (var j = 0; j < data.length; j++) {
              tarr.push(data[j].replace(/^"|"$/g,''));
            }
            med.push(tarr);
          }
          
          //map the objects from m x n to n x m
          const arraycol = (arr, n) => arr.map((x) => x[n]);

          //the uploaded data contains additional "". Remove them once for dates and twice for data.
          for (var j = 0; j < med[0].length; j++) {
            ret.push(arraycol(med, j));
          }

          ret[1] = stats.numerise(ret[1]);

          for (var k = 0; k < ret.length; k++) {
            ret[k].pop()
          };

          for (var j = 0; j < ret.length; j++) {ret[j] = stats.numerise(ret[j])}
          console.timeEnd("upload");

          //transfrom from JSON file to new JS Object.
        } else if (type === "JSON") {
          console.timeEnd("upload");
          Object.assign(ret, JSON.parse(content));
        }
      };
    };
    f.click();
  };
  selectors();
  return ret;
}

/**
 * Download files on different formats, depending on the formatted object. It extends the
 * the transform function to automatically transform the data.
 * @function download
 * @memberof data
 * @param {Object} data to be downloaded, pre processed using transform function.
 * @param {Object} download configuration
 * @returns {Object} downloaded data as link from HTML file.
 */

function download(data, config) {
  var type = config["type"];
  var blob;
  var exportfilename = "";

  //if CSV is required to be download, call the transform function.
  if (type === "CSV") {
    var csv = this.transform(data, config);
    blob = new Blob([csv], {
      type: "text/csv; charset = utf-8;",
    });
    exportfilename = "export.csv";

  //if JSON file is required. Similar as before. 
  } else if (type === "JSON") {
    var js = this.transform(data, config);
    blob = new Blob([js], {
      type: "text/json",
    });
    exportfilename = "export.json";
  }

  //if XML file is required for loading. Needs improvement.

  /*else if (type === 'XML') {
		var xs = this.transform(data,config);
		blob = new Blob([xs], {type: 'text/xml'});
		exportfilename = 'export.xml';
	}; */

  /*if (config['convtype'] = 'CSV') {
    	if (config['options'].hasOwnProperty('headers')){
    		var head= config['options']['headers']
    		arr.unshift(head)
    	};
    */

  
  //after the data has been transformed, create a new download file and link. No name is given but "export".
  if (navigator.msSaveOrOpenBlob) {
    msSaveBlob(blob, exportfilename);
    console.timeEnd("download");
  } else {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = exportfilename;
    a.click();
    a.remove();
    console.timeEnd("download");
  }
}

/**
 * Module for dealing with data.
 * @module data
 * @exports data
 */
export { retrieve, transform, download, upload };
