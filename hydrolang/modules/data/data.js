import * as datasources from "./datasources.js";
import stats from "../analyze/components/stats.js";

/**
 * Module for dealing with data.
 * @class 
 * @name data
 */

/**
 * Main function to retrieve data.
 * @function retrieve
 * @memberof data
 * @param {Object} params - Contains: source(USGS, MeteoSTAT, etc.),dataType (streamflow, gauges, etc.),  type (CSV, XML, JSON).
 * @param {Object} args - Contains: Arguments from the API. See each API data source to know how to send the requests.
 * @returns {Object} Object with retrived data. Usually in JSON format.
 * @example
 * hydro.data.retrieve({params: {source: 'someSource', dataType: 'someEndpoint', proxy: 'ifProxyReq'}, args: {'someEndpointArgs'}})
 */

async function retrieve({ params, args, data } = {}) {
  let source = params.source;
  let dataType = params.datatype;
  let placeHolder = params.placeHolder || false;
  let trans = params.transform || false;
  let dataSource = datasources[source]?.[dataType];

  console.log(params)

  if (!dataSource) {
    return Promise.reject(new Error("No data source found for the given specifications."));
  }

  let endpoint =
    source === "waterOneFlow" || source === "hisCentral" || source === "mitigation_dt" || source === "flooddamage_dt"
      ? datasources[source].sourceType(args.sourceType, dataType)
      : dataSource.endpoint;

  let type = params.type || dataSource.methods.type;

  // let proxy = datasources[source]?.requirements?.needProxy
  //   ? datasources.proxies["local-proxy"].endpoint
  //   : "";
  
    let proxy = datasources.proxies["local-proxy"].endpoint
    ;

  let headers = {
    "content-type": (() => {
      if (type === "json") {
        return "application/json";
      } else if (type === "xml" || type === "soap") {
        return "text/xml; charset=utf-8";
      } else if (type === "csv" || type === "tab") {
        return "application/text"; 
      } else {
        return "application/json"; // Default
      }
    })(),
  };

  if (type === "soap") {
    headers["SOAPAction"] = datasources[source].action + dataType;
  }

  let keyname = datasources[source]?.requirements?.keyname;
  if (keyname && params[keyname]) {
    headers[keyname] = params[keyname];
  } else if (keyname) {
    console.warn("info: please verify the keyname of the source."); 
  }

  endpoint = endpoint.replace(/{(\w+)}/g, (match, key) => {
    const value = args[key];
    delete args[key];
    return value;
  });


  let fetchOptions = {
    method: dataSource.methods.method,
    headers: headers,
  };

  if (fetchOptions.method === 'POST') {
    if (type === 'json') {
      fetchOptions.body = JSON.stringify(args);
    } else if (type === 'soap' || type === 'xml') {
      fetchOptions.body = Object.keys(args).length
        ? datasources.envelope(dataSource.body(args))
        : datasources.envelope(dataSource.body());
    }
  } else if (fetchOptions.method === 'GET' && Object.keys(args).length > 0) {
    const queryString = new URLSearchParams(args).toString();
    endpoint += `?${queryString}`;
  }


  return fetch(proxy + endpoint, fetchOptions)
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error ${response.status} fetching ${endpoint}: ${errorData}`);
      }

      if (type === "json") {
        return response.json();
      } else if (type === "xml" || type === "soap" || type === "csv" || type === "tab") {
        return response.text();
      } else {
        return response.json(); // Default to JSON
      }
    })
    .then((responseData) => {
      if (type === "soap") {
        try {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(responseData, "text/xml");
          let j = xml2json(xmlDoc);
          return j["soap:Envelope"]?.["soap:Body"] || j; // Handle cases where soap:Body might not exist
        } catch (xmlError) {
          throw new Error(`Error parsing SOAP response from ${endpoint}: ${xmlError.message}`);
        }
      } else if (type === "xml" || type === "tab" || type === "CSV") {
        return JSON.stringify(responseData);
      } else if (trans) {
        if (source === "usgs") {
          return transform({
            params: { save: 'value'}, 
            args: { keep: '["datetime", "value"]', type: 'ARR'}, 
            data: lowercasing(responseData)
          });
        }
      } else {
        return lowercasing(responseData);
      }
    });
}


/**
 * Convert data types into others based on the premise of having JS objects as primary input.
 * @function transform
 * @memberof data
 * @param {Object} params - Contains: save (string with name of array to save), output (name of output variable)
 * @param {Object} args - Contains: type (CSV, JSON, XML, Tab), keep (JS array with column headers to keep)
 * @param {Object} data - Contains: data object to be transformed in JS format.
 * @returns {Object} Object in different formats with transformed data
 * @example
 * hydro.data.transform({params: {save: 'saveVarNamefromObj', output: 'someFinalName'}, args: {keep: [value2keep1, value2keep2], type: "typeRequired"}, data: {someJSObject}})
 */

function transform({ params, args, data } = {}) {

  console.log(data)
  //initial cleanup to remove metadata from object
  if (!params) {
    data = data;
  } else if (params.save !== undefined && args === undefined) {
    data = recursiveSearch({ obj: data, searchkey: params.save });
    data = data[0];
  } else if (params.save !== undefined && args.keep !== undefined) {
    data = recursiveSearch({ obj: data, searchkey: params.save });
    data = data[0];
    args.keep = JSON.parse(args.keep);
    //Case all parameters are to be saved and the result is an array.
  } else if (params.save !== undefined && args.keep === undefined) {
    data = recursiveSearch({ obj: data, searchkey: params.save });
    return data[0];
  }

  var type = args.type,
    clean;

  if (data instanceof Array) {
    //verify if the object is an object. Go to the following step.
    var arr = data.map((_arrayElement) => Object.assign({}, _arrayElement));
    arr = typeof arr != "object" ? JSON.parse(arr) : arr;

    if (args.hasOwnProperty("keep")) {
      clean = args["keep"];
      //values to be left on the object according to user, fed as array.
      var keep = new RegExp(clean.join("|"));
      for (var i = 0; i < arr.length; i++) {
        for (var k in arr[i]) {
          keep.test(k) || delete arr[i][k];
        }
      }
    }
    if (!args.keep) {
      //if params dont have a keep array, continue.
      arr = arr;
    }
  }
  //convert array of objects into array of arrays for further manipulation.
  if (type === "ARR") {
    var arrays = arr.map(function (obj) {
        return Object.keys(obj)
          .sort()
          .map(function (key) {
            return obj[key];
          });
      }),
      final = Array(arrays[0].length)
        .fill(0)
        .map(() => Array(arrays.length).fill(0));
    for (var j = 0; j < arrays[0].length; j++) {
      for (var n = 0; n < arrays.length; n++) {
        final[j][n] = arrays[n][j];
      }
    }

    if (args.keep) {
      for (var j = 0; j < final.length; j++) {
        final[j].unshift(args.keep[j]);
      }
    }
    return final;
  }

  // convert from JSON to CSV
  else if (type === "CSV") {
    if (data[0] instanceof Array) {
      arr = stats.arrchange({ data: data });
    } else {
      arr = arr;
    }
    var str = "";
    for (var i = 0; i < arr.length; i++) {
      var line = "";
      for (var index in arr[i]) {
        if (line != "") line += ",";

        line += `\"${arr[i][index]}\"`;
      }
      str += line + "\r\n";
    }
    return str;
  }

  //covert data from Object to JSON
  else if (type === "JSON") {
    var js = JSON.stringify(arr);
    return js;
  }

  //convert data from array to XML
  else if (type === "ARR2XML") {
    var xml = "";
    for (var prop in arr) {evalif = datasources[source]["requirements"]["needEval"];
      xml += arr[prop] instanceof Array ? "" : "<" + prop + ">";
      if (arr[prop] instanceof Array) {
        for (var array in arr[prop]) {
          xml += "<" + prop + ">";
          xml += transform({ data: new Object(arr[prop], config) });
        }
      } else if (typeof arr[prop] == "object") {
        xml += transform({ data: new Object(arr[prop], config) });
      } else {
        xml += arr[prop];
      }
      xml += arr[prop] instanceof Array ? "" : "</" + prop + ">";
    }
    var xml = xml.replace(/<\/?[0-9]{1,}>/g, "");
    return xml;
    //Conversion from XML to JSON, XML has been converted previously to a string.
  } else if (type === "XML2JSON") {
    const XMLJSon = (data) => {
      var json = {};
      for (const res of data.matchAll(
        /(?:<(\w*)(?:\s[^>]*)*>)((?:(?!<\1).)*)(?:<\/\1>)|<(\w*)(?:\s*)*\/>/gm
      )) {
        const key = res[1] || res[3],
          value = res[2] && XMLJSon(res[2]);
        json[key] = value && Object.keys(value).length ? value : res[2] || null;
      }
      return json;
    };
    return XMLJSon(data);
  } else {
    throw new Error("Please select a supported data conversion type!");
  }
}

/**
 * Data upload from the user's local storage for analysis.
 * @function upload
 * @memberof data
 * @param {Object} params - Contains: type(CSV, JSON).
 * @returns {Object} JS object, either array or JSON.
 * @example
 * hydro.data.upload({params: {type: 'someType'}})
 */

async function upload({ params, args, data } = {}) {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = params.type;

  let ret = null;

  const getFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const isNumeric = (value) => {
    return /^-?\d+\.?\d*$/.test(value);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    const content = await getFileContent(file);

    if (params.type === "CSV") {
      const rows = content.split(/\r\n|\n/).map((row) => {
        return row.split(",").map((value) => value.replace(/^"|"$/g, ""));
      });

      const columns = rows[0].map((_, i) => rows.map((row) => row[i]));
      ret = [];
      columns.forEach((column, i) => {
        if (column.every(isNumeric)) {
          ret.push(column.map((value) => parseFloat(value)));
        } else {
          ret.push(column);
        }
      });

    } else if (params.type === "JSON") {
      ret = JSON.parse(content);

    } else if (params.type === "KML") {
      ret = content
    }
  };

  fileInput.addEventListener("change", handleFileSelect);
  fileInput.click();

  return new Promise((resolve) => {
    const intervalId = setInterval(() => {
      if (ret !== null) {
        clearInterval(intervalId);
        resolve(ret);
      }
    }, 100);
  });
}


/**
 * Download files on different formats, depending on the formatted object. It extends the
 * the transform function to automatically transform the data. The default format
 * @function download
 * @memberof data
 * @param {Object} params - Contains: save (string with name of array to save), output (name of output variable)
 * @param {Object} args - Contains: type ('CSV, JSON, XML')
 * @param {Object} data - type (CSV, JSON, XML, Tab), keep (JS array with column headers to keep)
 * @returns {Object} Downloaded data as link from HTML file.
 * @example
 * hydro.data.transform({params: {save: 'saveVarNamefromObj', output: 'someFinalName'}, args: {keep: [value2keep1, value2keep2]}, data: {someJSObject}})
 */

async function download({ params, args, data } = {}) {
  let { type } = args;
  let blob = null;
  let exportfilename = null;
  const { fileName } = params || generateDateString();

  //if CSV is required to be download, call the transform function.
  if (type === "CSV") {
    const csv = this.transform({ params, args, data: await data });
    blob = new Blob([csv], {
      type: "text/csv; charset=utf-8;",
    });
    exportfilename = `${fileName}.csv`;

  //if JSON file is required. Similar as before.
  } else if (type === "JSON") {
    let js;
    if (Array.isArray(data)) {
      js = this.transform({ params, args, data });
    } else {
      js = data;
    }
    blob = new Blob([JSON.stringify(await js)], {
      type: "text/json",
    });
    exportfilename = `${fileName}.json`;
  }

  //if XML file is required for loading. Needs improvement.
  /*else if (type === 'XML') {
    const xs = this.transform(data, config);
    blob = new Blob([xs], {type: 'text/xml'});
    exportfilename = 'export.xml';
  };*/

  //after the data has been transformed, create a new download file and link. No name is given but "export".
  if (navigator.msSaveOrOpenBlob) {
    navigator.msSaveOrOpenBlob(blob, exportfilename);
  } else {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = exportfilename;
    a.click();
    a.remove();
  }
}

/***************************/
/***** Helper functions ****/
/***************************/

/**
 * Searches for an array with data passed as string.
 * @function recursiveSearch
 * @memberof data
 * @param {Object} obj - Object to find the results from.
 * @param {String} searchKey - Key to find inside the object.
 * @param {Object[]} results - default parameter used to save objects.
 * @returns {Object[]} Saved object from the search.
 * @example
 * recursiveSearch({obj: {key1: "thisiskey", data: ["data1", "data2"]}, searchkey: 'data'})
 * returns ["data1", "data2"]
 */

function recursiveSearch({ obj, searchkey, results = [] } = {}) {
  const r = results;
  //if (!obj.hasOwnProperty(searchkey)) {return}
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (key === searchkey && Array.isArray(value)) {
      r.push(value);
      //evalif = datasources[source]["requirements"]["needEval"];
      return;
    } else if (typeof value === "object" && value !== null) {
      recursiveSearch({ obj: value, searchkey: searchkey, results: r });
    }
  });
  return r;
}

/**
 * Lowercases the keys in an object. Can be nested object with arrays or what not.
 * @function lowercasing
 * @memberof data
 * @param {Object} obj - Object keys to lowercase them.
 * @returns {Object[]} Copy of object with keys in lowercase.
 * @example
 * lowercasing({NaMe: "myname", OtherName: "nextname"})
 * returns {name: "myname", othername: "nextname"}
 */

function lowercasing(obj) {
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(lowercasing);
  return Object.keys(obj).reduce((newObj, key) => {
    let val = obj[key],
      newVal = typeof val === "object" && val !== null ? lowercasing(val) : val;
    newObj[key.toLowerCase()] = newVal;
    return newObj;
  }, {});
}

/**
 * Recursive function that iteratively converts XML document format to JSON format.
 * Required the XML input to be a JQUERY object parsed from string.
 * Credit: https://stackoverflow.com/a/20861541
 * @function xml2json
 * @memberof data
 * @param {Document} xml - parsed XML document from text
 * @returns {Object} obj - tagged key-value pair from the XML document.
 * @example 
 * xml2json(<someString attr1:1 attr2:2></someString>)
 * returns {somestring{ attr1: 1, attr2: 2}}
 *
 */
function xml2json(xml) {
  try {
    var obj = {};
    if (xml.children.length > 0) {
      for (var i = 0; i < xml.children.length; i++) {
        var item = xml.children.item(i),
          nodeName = item.nodeName;

        if (typeof obj[nodeName] == "undefined") {
          obj[nodeName] = xml2json(item);
        } else {
          if (typeof obj[nodeName].push == "undefined") {
            var old = obj[nodeName];

            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xml2json(item));
        }
      }
    } else {
      obj = xml.textContent;
    }
    return obj;
  } catch (e) {
    console.log(e.message);
  }
}

/**
 * Creates a date a outof a string.
 * @function generateDateString
 * @memberof data
 * @returns {String} - generates a string in format YY.MM.DD.HH.MM
 */
function generateDateString() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${year}.${month}.${day}.${hours}:${minutes}`;
}

/**********************************/
/*** End of Helper functions **/
/**********************************/

export { retrieve, transform, download, upload, recursiveSearch };
