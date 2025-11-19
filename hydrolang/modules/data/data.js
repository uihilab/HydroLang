import * as datasources from "./datasources.js";
import stats from "../analyze/components/stats.js";
import { cachedFetch } from "./utils/data-cache.js";
import {
  GRIDDED_SOURCES,
  processGriddedSource,
  applyDataScaling,
  convertDataUnits,
  aggregateTemporal,
  applyQualityControl,
  calculateStatistics,
  formatData,
  loadGridDataLibrary,
} from "./utils/index.js";

//import fxparserMin from "./fxparser.min.js";

//import XMLParser from './fxparser.min.js'
//import  {XMLParser} from "./fxparser.min.js";

//Workaround for DOM manipulation using a web worker environment


// 'https://cdnjs.cloudflare.com/ajax/libs/fast-xml-parser/4.5.1/fxparser.min.js'

/**
 * Module for dealing with data retrieval, transformation, upload, and download operations.
 * Provides functions to interact with various hydrological data sources and perform data operations.
 * @class 
 * @name data
 */

/**
 * Main function to retrieve data from various hydrological data sources.
 * Supports multiple data sources including USGS, NLDI, NWS, and others.
 * 
 * @function retrieve
 * @memberof data
 * @async
 * @param {Object} options - Configuration object for data retrieval
 * @param {Object} options.params - Parameters for the request
 * @param {string} options.params.source - Data source identifier (e.g., 'usgs', 'nldi', 'nws')
 * @param {string} options.params.datatype - Type of data to retrieve (varies by source)
 * @param {string} [options.params.type] - Response format ('json', 'xml', 'csv', 'soap') - defaults to source's default
 * @param {boolean} [options.params.transform] - Whether to apply data transformation
 * @param {boolean} [options.params.placeHolder] - Whether to use placeholder data
 * @param {string} [options.params.keyname] - API key parameter name for authenticated sources
 * @param {Object} options.args - Arguments specific to the data source endpoint
 * @param {Object} [options.data] - Additional data payload (for POST requests)
 * @returns {Promise<Object|string>} Promise resolving to retrieved data in specified format
 * 
 * @example
 * // Retrieve USGS instantaneous streamflow data
 * const streamflowData = await hydro.data.retrieve({
 *   params: {
 *     source: 'usgs',
 *     datatype: 'instant-values',
 *     transform: true
 *   },
 *   args: {
 *     format: 'json',
 *     sites: '05454500',
 *     startDT: '2020-01-01',
 *     endDT: '2020-01-07'
 *   }
 * });
 * 
 * @example
 * // Retrieve NLDI basin boundary data
 * const basinData = await hydro.data.retrieve({
 *   params: {
 *     source: 'nldi',
 *     datatype: 'getBasin'
 *   },
 *   args: {
 *     featureSource: 'comid',
 *     featureId: '13297246'
 *   }
 * });
 * 
 * @example
 * // Retrieve NASA POWER meteorological data
 * const powerData = await hydro.data.retrieve({
 *   params: {
 *     source: 'nasapower',
 *     datatype: 'point-data'
 *   },
 *   args: {
 *     parameters: 'T2M,PRECTOTCORR,RH2M',
 *     community: 're',
 *     longitude: -76.3,
 *     latitude: 38.5,
 *     start: '20200101',
 *     end: '20200131',
 *     format: 'JSON'
 *   }
 * });
 * 
 * @example
 * // Retrieve NOAA climate data with API key
 * const climateData = await hydro.data.retrieve({
 *   params: {
 *     source: 'noaa',
 *     datatype: 'prec-15min',
 *     token: 'YOUR_NOAA_TOKEN'
 *   },
 *   args: {
 *     datasetid: 'PRECIP_15',
 *     stationid: 'GHCND:USW00014895',
 *     startdate: '2020-01-01',
 *     enddate: '2020-01-07',
 *     limit: 100
 *   }
 * });
 * 
 * @example
 * // Retrieve Meteostat weather station data
 * const meteoData = await hydro.data.retrieve({
 *   params: {
 *     source: 'meteostat',
 *     datatype: 'dailydata-station',
 *     'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY'
 *   },
 *   args: {
 *     station: '10382',
 *     start: '2020-01-01',
 *     end: '2020-01-31'
 *   }
 * });
 * 
 * @example
 * // Retrieve EPA precipitation data (POST request)
 * const epaData = await hydro.data.retrieve({
 *   params: {
 *     source: 'epa',
 *     datatype: 'precipitation',
 *     type: 'json'
 *   },
 *   args: {
 *     source: 'nldas',
 *     dateTimeSpan: {
 *       startDate: '2020-01-01 00',
 *       endDate: '2020-01-07 00',
 *       dateTimeFormat: 'yyyy-MM-dd HH'
 *     },
 *     geometry: {
 *       point: {
 *         latitude: 33.925,
 *         longitude: -83.356
 *       }
 *     },
 *     dataValueFormat: 'E3',
 *     temporalResolution: 'hourly',
 *     units: 'metric'
 *   }
 * });
 * 
 * @example
 * // Retrieve flood damage scenario data
 * const floodData = await hydro.data.retrieve({
 *   params: {
 *     source: 'flooddamage_dt',
 *     datatype: 'x500_year',
 *     transform: 'eval'
 *   },
 *   args: {
 *     sourceType: 'Cedar Rapids'
 *   }
 * });
 */

async function retrieve({ params, args, data } = {}) {

  let source = params.source;
  let dataType = params.datatype;
  let placeHolder = params.placeHolder || false;
  let trans = params.transform || false;

  // Set global cache context for this request
  globalThis._hydroCacheContext = {
    source: source,
    dataset: args.dataset || source,
    dataType: dataType,
    cacheId: params.cacheId,  // Allow user to specify custom cache ID
    params: args
  };

  try {
    console.log(params);

  // Check if this is a gridded data source
  const griddedConfig = GRIDDED_SOURCES[source];
  if (griddedConfig) {
    // Run preprocessing if needed (e.g., NLDI lookup for NWM)
    if (griddedConfig.preProcess) {
      const result = await griddedConfig.preProcess(params, args, dataType);
      args = result.args;
    }
    
    // Use the new generic processor (pass datasources, not params)
    return processGriddedSource(source, dataType, args, datasources);
  }

  // For other datasources, check if they exist
  let dataSource = datasources[source]?.[dataType];

  if (!dataSource) {
    return Promise.reject(new Error("No data source found for the given specifications."));
  }

  let endpoint =
    source === "waterOneFlow" || source === "hisCentral" || source === "mitigation_dt" || source === "flooddamage_dt" || source === "nldas"
      ? (source === "nldas" ? datasources[source].sourceType(args.dataset, dataType, args) : datasources[source].sourceType(args.sourceType, dataType))
      : dataSource.endpoint;

  let type = params.type || dataSource.methods.type;

  // Check if proxy is needed based on datasource requirements
  let proxy = "";
  if (datasources[source]?.requirements?.needProxy) {
    // Use specified proxy or default to researchverse
    const proxyName = params.proxyServer || "researchverse";
    proxy = datasources.proxies[proxyName]?.endpoint || datasources.proxies["researchverse"].endpoint;
  }
  // If needProxy is explicitly false, don't use proxy (empty string)
  // This allows direct fetch for APIs that support CORS like USGS WFS

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
  } else if (fetchOptions.method === 'GET') {
    // Merge preset parameters from datasource with user-provided args
    // Start with preset params from datasource definition
    const mergedParams = {};
    
    if (dataSource.params) {
      // Add all preset parameters that have non-null values
      for (const [key, value] of Object.entries(dataSource.params)) {
        if (value !== null && value !== undefined) {
          mergedParams[key] = value;
        }
      }
      
      // Override with user-provided args (for params that were null)
      for (const [key, value] of Object.entries(args)) {
        if (value !== null && value !== undefined) {
          mergedParams[key] = value;
        }
      }
    } else {
      // If no preset params, just use args as before
      Object.assign(mergedParams, args);
    }
    
    // Only add query string if we have parameters
    if (Object.keys(mergedParams).length > 0) {
      const queryString = new URLSearchParams(mergedParams).toString();
    endpoint += `?${queryString}`;
    }
  }


  return cachedFetch(proxy + endpoint, fetchOptions)
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
          //DOM Parser workaround
          // const parser = new DOMParser();
          // const xmlDoc = parser.parseFromString(responseData, "text/xml");

          // const parser = new XMLParser();
          // console.log(parser)
          // const xmlDoc = parser.parse(responseData);

          return responseData

          //let j = xml2json(xmlDoc);
          // return xmlDoc["soap:Envelope"]?.["soap:Body"] || j; // Handle cases where soap:Body might not exist
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
        } else if (trans === "eval") {
          return eval(responseData); // Use eval cautiously
        }
      } else {
        return lowercasing(responseData);
      }
    });
  } finally {
    // Context will be cleaned up by next request or kept for subsequent calls
    // Don't delete here - cachedFetch needs it for caching
  }
}


/**
 * Get a raw cached file for manual processing
 * @param {Object} params - Parameters object
 * @param {string} params.source - Data source
 * @param {string} params.datatype - Data type
 * @param {Object} args - Arguments object
 * @param {string} args.key - Cache key to retrieve
 * @param {Object} data - Data object (unused)
 * @returns {Promise<Object>} Raw file data and metadata
 */
async function getFile({ params, args, data } = {}) {
  const cache = globalThis.hydro?.cache;
  if (!cache) {
    throw new Error('Cache not available');
  }

  const key = args.key;
  if (!key) {
    throw new Error('Cache key required in args.key');
  }

  const cached = await cache.get(key);
  if (!cached) {
    throw new Error(`No cached file found with key: ${key}`);
  }

  return {
    data: cached.data,
    metadata: cached.metadata,
    key: key,
    raw: true
  };
}

/**
 * Save processed data with a user-defined key
 * @param {Object} params - Parameters object
 * @param {string} params.source - Data source
 * @param {string} params.datatype - Data type
 * @param {Object} args - Arguments object
 * @param {string} args.key - User-defined key for the dataset
 * @param {string} args.name - Optional human-readable name
 * @param {Object} data - Data object to save
 * @returns {Promise<boolean>} Success status
 */
async function saveFile({ params, args, data } = {}) {
  const cache = globalThis.hydro?.cache;
  if (!cache) {
    throw new Error('Cache not available');
  }

  const key = args.key;
  if (!key) {
    throw new Error('Dataset key required in args.key');
  }

  if (!data) {
    throw new Error('Data to save is required');
  }

  const metadata = {
    source: params.source || 'user',
    datatype: params.datatype || 'dataset',
    name: args.name || key,
    savedAt: new Date().toISOString(),
    userSaved: true
  };

  return await cache.saveDataset(key, data, metadata);
}





/**
 * Transform AORC (NOAA Analysis of Record for Calibration) data with comprehensive manipulation capabilities
 * Handles scaling, unit conversion, temporal/spatial aggregation, and various output formats
 *
 * @function transformAORCData
 * @memberof data
 * @param {Object} options - Configuration object for AORC transformation
 * @param {Object} [options.params] - Parameters for transformation type
 * @param {Object} [options.args] - Arguments for transformation options
 * @param {Object|Array} options.data - AORC data to transform
 * @returns {Object|Array|string} Transformed AORC data
 */
  const transformGriddedData = ({ params, args, data }) => {
    console.log('[transform] Processing gridded data transformation');

    // Detect data source and apply appropriate transformations
    const source = params?.source || 'generic';

    // Detect if this is a single variable or multi-variable dataset
    const isMultiVariable = data && typeof data === 'object' && !data.variable && !Array.isArray(data);

    if (isMultiVariable) {
      // Handle multiple variables
      const results = {};
      for (const [variableName, variableData] of Object.entries(data)) {
        try {
          results[variableName] = transformVariable(variableName, variableData, source, params, args);
        } catch (error) {
          console.warn(`Failed to transform ${variableName}: ${error.message}`);
          results[variableName] = { error: error.message };
        }
      }
      return results;
    } else {
      // Handle single variable
      const variableName = data.variable || Object.keys(data)[0];
      return transformVariable(variableName, data, source, params, args);
    }
  };

/**
 * Transform a single gridded data variable with comprehensive manipulations
 */
  const transformVariable = (variableName, variableData, source, params, args) => {
    let processedData = deepClone(variableData);

    // Apply source-specific scaling
    if (source === 'aorc') {
      processedData = applyDataScaling(processedData, variableName, datasources, 'aorc');
    } else if (source === 'nwm') {
      processedData = applyDataScaling(processedData, variableName, datasources, 'nwm');
    } else if (source === 'threedep') {
      processedData = applyDataScaling(processedData, variableName, datasources, 'threedep');
    } else if (source === 'prism') {
      processedData = applyDataScaling(processedData, variableName, datasources, 'prism');
    }

    // Apply unit conversions if requested
    if (args?.units) {
      processedData = convertDataUnits(processedData, variableName, args.units, source, datasources);
    }

    // Apply temporal aggregations
    if (args?.temporalAggregation) {
      processedData = aggregateTemporal(processedData, args.temporalAggregation);
    }

    // Apply spatial aggregations
    if (args?.spatialAggregation) {
      processedData = aggregateSpatial(processedData, args.spatialAggregation);
    }

    // Apply quality control filters
    if (args?.qualityControl) {
      processedData = applyQualityControl(processedData, args.qualityControl);
    }

    // Apply statistical transformations
    if (args?.statistics) {
      processedData = calculateStatistics(processedData, args.statistics);
    }

    // Apply format transformations
    if (args?.type) {
      return formatData(processedData, args, source, datasources);
    }

    return processedData;
  };





/**
 * Convert data types into various formats based on JavaScript objects as primary input.
 * Supports extraction of nested data, filtering, and format conversion.
 * 
 * @function transform
 * @memberof data
 * @param {Object} options - Configuration object for transformation
 * @param {Object} [options.params] - Parameters for data extraction and saving
 * @param {string} [options.params.save] - Key name to search for and extract from nested objects
 * @param {string} [options.params.output] - Output variable name (currently unused)
 * @param {Object} [options.args] - Arguments for transformation options
 * @param {string} [options.args.type] - Output format: 'ARR', 'ARR-col', 'CSV', 'JSON', 'XML2JSON'
 * @param {string[]|string} [options.args.keep] - Array of column headers to keep (JSON string or array)
 * @param {boolean} [options.args.parse] - Whether to parse strings to numbers/dates/booleans
 * @param {string} [options.args.mode] - Processing mode: 'flatten', 'flatten-objects'
 * @param {number} [options.args.pick] - Pick specific row index from 2D array
 * @param {boolean} [options.args.attachNames=true] - Whether to attach column names to arrays
 * @param {Object|Array} options.data - Input data object to be transformed
 * @returns {Object|Array|string} Transformed data in the specified format
 * 
 * @example
 * // Extract specific data from nested object and convert to array
 * const arrayData = hydro.data.transform({
 *   params: { save: 'timeSeries' },
 *   args: { 
 *     keep: ['dateTime', 'value'], 
 *     type: 'ARR',
 *     parse: true 
 *   },
 *   data: usgsResponseData
 * });
 * 
 * @example
 * // Convert object array to CSV format
 * const csvData = hydro.data.transform({
 *   args: { type: 'CSV' },
 *   data: [
 *     { date: '2023-01-01', flow: 100.5 },
 *     { date: '2023-01-02', flow: 95.3 }
 *   ]
 * });
 * 
 * @example
 * // Flatten nested object structure
 * const flattenedData = hydro.data.transform({
 *   args: { mode: 'flatten-objects' },
 *   data: {
 *     station: {
 *       info: { name: 'USGS Station', id: '01646500' },
 *       data: { flow: 100.5, stage: 2.1 }
 *     }
 *   }
 * });
 * // Result: { 'station.info.name': 'USGS Station', 'station.info.id': '01646500', ... }
 * 
 * @example
 * // Extract specific columns as separate arrays
 * const columnArrays = hydro.data.transform({
 *   args: { 
 *     type: 'ARR-col',
 *     keep: ['dateTime', 'value'],
 *     attachNames: false
 *   },
 *   data: [
 *     { dateTime: '2023-01-01', value: 100.5, quality: 'A' },
 *     { dateTime: '2023-01-02', value: 95.3, quality: 'A' }
 *   ]
 * });
 * // Result: [['2023-01-01', '2023-01-02'], [100.5, 95.3]]
 * 
 * @example
 * // Convert XML string to JSON
 * const jsonData = hydro.data.transform({
 *   args: { type: 'XML2JSON' },
 *   data: '<root><item>value1</item><item>value2</item></root>'
 * });
 * 
 * @example
 * // Pick specific row from 2D array and flatten
 * const singleRow = hydro.data.transform({
 *   args: { 
 *     pick: 0, 
 *     mode: 'flatten' 
 *   },
 *   data: [
 *     ['dates', '2023-01-01', '2023-01-02'],
 *     ['values', 100.5, 95.3]
 *   ]
 * });
 * // Result: [100.5, 95.3] (numeric values from first row, excluding header)
 */
function transform({ params, args, data } = {}) {
  function deepClone(value) {
    if (value === null || typeof value !== 'object') return value;
    if (value instanceof Date) return new Date(value.getTime());
    if (Array.isArray(value)) return value.map(deepClone);
    const result = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = deepClone(value[key]);
      }
    }
    return result;
  }

  const convertToNumberIfPossible = (value) => {
    if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
      return Number(value);
    }
    return value;
  };

  const cleanData = (data) => {
    if (Array.isArray(data)) {
      return data.map(item => cleanData(item));
    } else if (typeof data === 'object' && data !== null) {
      const cleaned = {};
      for (const key in data) {
        cleaned[key] = cleanData(data[key]);
      }
      return cleaned;
    } else {
      return convertToNumberIfPossible(data);
    }
  };

  const parseSpecialTypes = (value) => {
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
      if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        return value.toLowerCase() === 'true';
      }
    }
    return value;
  };

  const extractNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  };

  const flattenObject = (obj, parentKey = '', result = {}) => {
    for (const key in obj) {
      const value = obj[key];
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, newKey, result);
      } else {
        result[newKey] = value;
      }
    }
    return result;
  };

  // === AORC-SPECIFIC HELPER FUNCTIONS ===
  const findNearestIndex = (coordSystem, targetValue) => {
    const { min, resolution } = coordSystem;
    const index = Math.round((targetValue - min) / resolution);
    return Math.max(0, Math.min(index, Math.floor((coordSystem.max - min) / resolution)));
  };

  const aggregateTime = (date, timeStep, direction) => {
    const dateObj = new Date(date);
    const hours = timeStep === '1D' ? 24 : parseInt(timeStep) || 1;

    if (direction === 'start') {
      const startOfPeriod = new Date(dateObj);
      startOfPeriod.setHours(Math.floor(dateObj.getHours() / hours) * hours, 0, 0, 0);
      return startOfPeriod.toISOString();
    } else {
      const endOfPeriod = new Date(dateObj);
      endOfPeriod.setHours(Math.ceil((dateObj.getHours() + 1) / hours) * hours, 0, 0, 0);
      return endOfPeriod.toISOString();
    }
  };



  // Start transforming
  console.log('[transform] Original input data:', data);
  data = deepClone(data);

  // === GRIDDED DATA TRANSFORMATIONS ===
  if (params?.source === 'aorc' || params?.source === 'nwm' || params?.source === 'threedep' || params?.source === 'prism' ||
      (data && typeof data === 'object' && data.variable)) {
    return transformGriddedData({ params, args, data });
  }

  // === PARAMS & ARGS LOGIC ===
  if (!params) {
    data = args?.parse ? cleanData(data) : data;
  } else if (params.save !== undefined && args === undefined) {
    const found = recursiveSearch({ obj: data, searchkey: params.save });
    data = found?.[0];
  } else if (params.save !== undefined && args.keep !== undefined) {
    const found = recursiveSearch({ obj: data, searchkey: params.save });
    data = found?.[0];

    if (!data) return null;
    if (args.parse) {
      data = cleanData(data);
    }

    if (typeof args.keep === 'string') {
      args.keep = JSON.parse(args.keep);
    }

    const keepKeys = new RegExp(args.keep.join('|'));

    if (Array.isArray(data)) {
      data = data.map(obj => {
        if (typeof obj !== 'object') return obj;
        const filtered = {};
        for (const key in obj) {
          if (keepKeys.test(key)) {
            filtered[key] = obj[key];
          }
        }
        return filtered;
      });
    } else if (typeof data === 'object' && data !== null) {
      const filtered = {};
      for (const key in data) {
        if (keepKeys.test(key)) {
          filtered[key] = data[key];
        }
      }
      data = filtered;
    }
  } else if (params.save !== undefined && args.keep === undefined) {
    const found = recursiveSearch({ obj: data, searchkey: params.save });
    data = found?.[0];
    data = args?.parse ? cleanData(data) : data;
  }

    // === PICKING A SPECIFIC ROW FROM 2D ARRAY ===
    if (args?.pick !== undefined) {
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const idx = Number(args.pick);
        if (!isNaN(idx) && data.length > idx) {
          data = data[idx];
        }
      }
    }

  // === MODE HANDLING ===
  if (args?.mode === 'flatten') {
    if (Array.isArray(data) && Array.isArray(data[0])) {
      if (typeof data[0][0] === 'string' && data[0].length > 1) {
        return data[0].slice(1).map(convertToNumberIfPossible);
      }
    }
    if (Array.isArray(data)) {
      return data
        .map(convertToNumberIfPossible)
        .filter(val => typeof val === 'number' && !isNaN(val));
    }
  }

  if (args?.mode === 'flatten-objects') {
    if (Array.isArray(data) && typeof data[0] === 'object') {
      data = data.map(flattenObject);
    } else if (typeof data === 'object') {
      data = flattenObject(data);
    }
  }

  // === KEEP NESTED KEYS AFTER FLATTEN ===
  if (Array.isArray(data) && args?.keep) {
    const keepPaths = args.keep;
    data = data.map(item => {
      const extracted = {};
      for (const path of keepPaths) {
        const key = path.includes('.') ? path.split('.').pop() : path;
        extracted[key] = extractNestedValue(item, path);
      }
      return extracted;
    });
  }

  const type = args?.type;
  let arr;

  if (Array.isArray(data)) {
    arr = deepClone(data);

    if (args?.keep) {
      const keep = new RegExp(args.keep.join('|'));
      for (let i = 0; i < arr.length; i++) {
        for (const k in arr[i]) {
          if (!keep.test(k)) {
            delete arr[i][k];
          }
        }
      }
    }
  }

  // === FORMAT TRANSFORMATIONS ===
  if (type === 'ARR') {
    if (!arr || !Array.isArray(arr)) {
      console.error('[transform] arr is undefined or not an array:', arr);
      return null;
    }
  
    const arrays = arr.map(obj =>
      Object.keys(obj)
        .sort()
        .map(key => args.parse ? parseSpecialTypes(obj[key]) : obj[key])
    );
  
    const final = Array(arrays[0]?.length || 0)
      .fill(0)
      .map(() => Array(arrays.length).fill(0));
  
    for (let j = 0; j < arrays[0]?.length; j++) {
      for (let n = 0; n < arrays.length; n++) {
        final[j][n] = arrays[n][j];
      }
    }
  
    // Attach names only if requested
    if (args.keep && args.attachNames !== false) {
      for (let j = 0; j < final.length; j++) {
        final[j].unshift(args.keep[j]);
      }
    }
  
    return final;
  }

  else if (type === 'ARR-col') {
    if (!arr || !Array.isArray(arr)) return null;

    const keysToUse = args.keep;
    const arrays = keysToUse.map(key => {
      const column = [];
      if (args.attachNames !== false) {
        column.push(key); // Only attach name if requested
      }
      for (let i = 0; i < arr.length; i++) {
        const val = arr[i]?.[key];
        column.push(args.parse ? parseSpecialTypes(val) : val);
      }
      return column;
    });
  
    return arrays;
  }

  else if (type === 'CSV') {
    if (!arr || !Array.isArray(arr)) {
      console.error('[transform] CSV conversion failed: arr is invalid');
      return null;
    }

    let str = '';
    for (let i = 0; i < arr.length; i++) {
      let line = '';
      for (const index in arr[i]) {
        if (line !== '') line += ',';
        line += `"${arr[i][index]}"`;
      }
      str += line + '\r\n';
    }
    return str;
  }

  else if (type === 'JSON') {
    return JSON.stringify(data);
  }

  else if (type === 'XML2JSON') {
    const XMLJSon = (data) => {
      const json = {};
      for (const res of data.matchAll(/(?:<(\w*)(?:\s[^>]*)*>)((?:(?!<\1).)*)(?:<\/\1>)|<(\w*)(?:\s*)*\/>/gm)) {
        const key = res[1] || res[3],
              value = res[2] && XMLJSon(res[2]);
        json[key] = value && Object.keys(value).length ? value : res[2] || null;
      }
      return json;
    };
    return XMLJSon(data);
  }

  else if (type) {
    throw new Error('Please select a supported data conversion type!');
  }

  return data;
}


/**
 * Upload data from the user's local file system for analysis.
 * Creates a file input dialog and processes the selected file based on its type.
 * 
 * @function upload
 * @memberof data
 * @async
 * @param {Object} options - Configuration object for file upload
 * @param {Object} options.params - Parameters for upload configuration
 * @param {string} options.params.type - File type to accept ('CSV', 'JSON', 'KML')
 * @param {Object} [options.args] - Additional arguments (currently unused)
 * @param {Object} [options.data] - Additional data (currently unused)
 * @returns {Promise<Array|Object|string>} Promise resolving to parsed file content
 * 
 * @example
 * // Upload and parse CSV file
 * const csvData = await hydro.data.upload({
 *   params: { type: 'CSV' }
 * });
 * // Returns array of arrays with numeric conversion for numeric columns
 * // Example result: [['Date', 'Flow', 'Stage'], ['2023-01-01', 100.5, 2.1], ...]
 * 
 * @example
 * // Upload and parse JSON file
 * const jsonData = await hydro.data.upload({
 *   params: { type: 'JSON' }
 * });
 * // Returns parsed JSON object
 * 
 * @example
 * // Upload KML file as raw text
 * const kmlData = await hydro.data.upload({
 *   params: { type: 'KML' }
 * });
 * // Returns raw KML content as string
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
 * Download data in various formats to the user's local file system.
 * Automatically transforms data using the transform function and creates a downloadable file.
 * 
 * @function download
 * @memberof data
 * @async
 * @param {Object} options - Configuration object for download
 * @param {Object} [options.params] - Parameters for download configuration
 * @param {string} [options.params.fileName] - Name for the downloaded file (without extension)
 * @param {Object} options.args - Arguments for download format and transformation
 * @param {string} options.args.type - Download format ('CSV', 'JSON')
 * @param {string[]} [options.args.keep] - Column headers to keep (for CSV)
 * @param {Object|Array|Promise} options.data - Data to download (can be a Promise)
 * @returns {Promise<void>} Promise that resolves when download is initiated
 * 
 * @example
 * // Download data as CSV file
 * await hydro.data.download({
 *   params: { fileName: 'streamflow_data' },
 *   args: { 
 *     type: 'CSV',
 *     keep: ['dateTime', 'value']
 *   },
 *   data: transformedData
 * });
 * // Downloads file as 'streamflow_data.csv'
 * 
 * @example
 * // Download data as JSON file
 * await hydro.data.download({
 *   params: { fileName: 'station_info' },
 *   args: { type: 'JSON' },
 *   data: stationData
 * });
 * // Downloads file as 'station_info.json'
 * 
 * @example
 * // Download with auto-generated filename
 * await hydro.data.download({
 *   args: { type: 'CSV' },
 *   data: myData
 * });
 * // Downloads with timestamp-based filename like '23.12.15.14:30.csv'
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

/**********************************/
/****** Helper functions **********/
/**********************************/

/**
 * Recursively searches for arrays with specific key names in nested objects.
 * Useful for extracting data from complex nested JSON structures returned by APIs.
 * 
 * @function recursiveSearch
 * @memberof data
 * @param {Object} options - Search configuration object
 * @param {Object} options.obj - Object to search within
 * @param {string} options.searchkey - Key name to search for
 * @param {Array} [options.results=[]] - Array to store found values (used internally for recursion)
 * @returns {Array} Array containing all found values for the specified key
 * 
 * @example
 * // Search for 'timeSeries' arrays in USGS response
 * const complexData = {
 *   value: {
 *     queryInfo: { ... },
 *     timeSeries: [
 *       { name: 'Streamflow', values: [{ value: 100 }, { value: 95 }] }
 *     ]
 *   }
 * };
 * 
 * const timeSeries = hydro.data.recursiveSearch({
 *   obj: complexData,
 *   searchkey: 'timeSeries'
 * });
 * // Returns: [[{ name: 'Streamflow', values: [...] }]]
 * 
 * @example
 * // Search for 'values' arrays in nested data
 * const found = hydro.data.recursiveSearch({
 *   obj: complexData,
 *   searchkey: 'values'
 * });
 * // Returns all arrays with key 'values'
 */
function recursiveSearch({ obj, searchkey, results = [] } = {}) {
  const r = results;
  Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (key === searchkey && Array.isArray(value)) {
          r.push(value);
          return;
      } else if (typeof value === "object" && value !== null) {
          recursiveSearch({ obj: value, searchkey: searchkey, results: r });
      }
  });
  return r;
}

/**
 * Converts all object keys to lowercase recursively, including nested objects and arrays.
 * Useful for normalizing API responses that may have inconsistent casing.
 * 
 * @function lowercasing
 * @memberof data
 * @param {Object|Array|*} obj - Object, array, or value to process
 * @returns {Object|Array|*} Copy of input with all object keys converted to lowercase
 * 
 * @example
 * // Normalize object keys
 * const normalized = hydro.data.lowercasing({
 *   StationName: "USGS Station",
 *   FlowData: {
 *     DateTime: "2023-01-01T12:00:00Z",
 *     Value: 100.5
 *   }
 * });
 * // Returns: { stationname: "USGS Station", flowdata: { datetime: "2023-01-01T12:00:00Z", value: 100.5 } }
 * 
 * @example
 * // Process array of objects
 * const normalizedArray = hydro.data.lowercasing([
 *   { StationID: "01646500", FlowRate: 100 },
 *   { StationID: "01647000", FlowRate: 85 }
 * ]);
 * // Returns: [{ stationid: "01646500", flowrate: 100 }, { stationid: "01647000", flowrate: 85 }]
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
 * Recursively converts XML document format to JSON format.
 * Handles XML attributes, text content, and nested elements.
 * 
 * @function xml2json
 * @memberof data
 * @param {Document|Element} xml - Parsed XML document or element from DOMParser
 * @returns {Object|string|null} Object representation of XML structure, or null if error occurs
 * 
 * @example
 * // Convert XML to JSON
 * const parser = new DOMParser();
 * const xmlDoc = parser.parseFromString(xmlString, "text/xml");
 * const jsonResult = hydro.data.xml2json(xmlDoc);
 * 
 * // For XML like: <station id="01646500"><name>Potomac River</name><flow>100.5</flow></station>
 * // Returns: { station: { "@id": "01646500", name: "Potomac River", flow: "100.5" } }
 * 
 * @example
 * // Handle XML with multiple elements
 * // XML: <stations><station>Station1</station><station>Station2</station></stations>
 * // Returns: { stations: { station: ["Station1", "Station2"] } }
 */
function xml2json(xml) {
  try {
      let obj = {};

      // Handle attributes
      if (xml.attributes && xml.attributes.length > 0) {
          for (let i = 0; i < xml.attributes.length; i++) {
              const attr = xml.attributes.item(i);
              obj[`@${attr.nodeName}`] = attr.nodeValue;
          }
      }

      // Handle child nodes
      for (let i = 0; i < xml.childNodes.length; i++) {
          const node = xml.childNodes[i];

          if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent.trim();
              if (text.length > 0) {
                  obj["#text"] = text;
              }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
              const nodeName = node.nodeName;
              const childObj = xml2json(node);

              if (obj[nodeName] === undefined) {
                  obj[nodeName] = childObj;
              } else {
                  if (!Array.isArray(obj[nodeName])) {
                      obj[nodeName] = [obj[nodeName]];
                  }
                  obj[nodeName].push(childObj);
              }
          }
      }

      // Edge case: If no children or attributes and there's textContent
      if (
          Object.keys(obj).length === 0 &&
          xml.textContent &&
          xml.textContent.trim().length > 0
      ) {
          return xml.textContent.trim();
      }

      return obj;
  } catch (e) {
      console.error('[xml2json] Error during conversion:', e.message);
      return null;
  }
}


/**
 * Generates a timestamp-based string for file naming.
 * Creates a formatted date string in YY.MM.DD.HH:MM format.
 * 
 * @function generateDateString
 * @memberof data
 * @returns {string} Formatted date string
 * 
 * @example
 * // Get current timestamp for filename
 * const timestamp = hydro.data.generateDateString();
 * // Returns something like: "23.12.15.14:30"
 * 
 * @example
 * // Use in file download
 * const filename = `data_${hydro.data.generateDateString()}.csv`;
 * // Results in: "data_23.12.15.14:30.csv"
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
/*** NWM Processing Functions ****/
/**********************************/











/**********************************/
/*** End of Helper functions **/
/**********************************/

// Saved data accessor - provides access to user-saved datasets
/**
 * Cache management API for user access to saved datasets
 * Provides user-friendly interface to view, access, and manage cached data
 */
export const cache = {
  /**
   * List all cached datasets
   * @param {Object} options - Filter options
   * @param {string} options.source - Filter by data source (e.g., 'nhdplus', 'hrrr')
   * @param {string} options.dataType - Filter by data type (e.g., 'flowlines', 'point-data')
   * @returns {Promise<Array>} Array of cached dataset info with human-readable details
   * 
   * @example
   * // List all cached data
   * const all = await hydro.data.cache.list();
   * console.log(all);
   * // [{cacheKey: 'nhdplus/flowlines/abc1', size: 1024000, ageFormatted: '2 days ago', ...}]
   * 
   * @example
   * // List only NHDPlus data
   * const nhdplus = await hydro.data.cache.list({ source: 'nhdplus' });
   */
  async list(options = {}) {
    const cacheInstance = globalThis._hydroCache;
    if (!cacheInstance) {
      console.warn('Cache not initialized');
      return [];
    }
    return await cacheInstance.list(options);
  },

  /**
   * Get a cached dataset by cache key
   * @param {string} cacheKey - The cache key (e.g., 'nhdplus/flowlines/abc1')
   * @returns {Promise<Object|null>} Dataset with data and metadata, or null if not found
   * 
   * @example
   * const data = await hydro.data.cache.get('nhdplus/flowlines/iowa-city');
   * console.log(data);
   */
  async get(cacheKey) {
    const cacheInstance = globalThis._hydroCache;
    if (!cacheInstance) {
      console.warn('Cache not initialized');
      return null;
    }
    return await cacheInstance.get(cacheKey);
  },

  /**
   * Delete a cached dataset
   * @param {string} cacheKey - The cache key to delete
   * @returns {Promise<boolean>} Success status
   * 
   * @example
   * await hydro.data.cache.delete('nhdplus/flowlines/abc1');
   */
  async delete(cacheKey) {
    const cacheInstance = globalThis._hydroCache;
    if (!cacheInstance) {
      console.warn('Cache not initialized');
      return false;
    }
    await cacheInstance.delete(cacheKey);
    return true;
  },

  /**
   * Clear all cached data
   * @returns {Promise<boolean>} Success status
   * 
   * @example
   * await hydro.data.cache.clear();
   */
  async clear() {
    const cacheInstance = globalThis._hydroCache;
    if (!cacheInstance) {
      console.warn('Cache not initialized');
      return false;
    }
    await cacheInstance.clear();
    return true;
  },

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   * 
   * @example
   * const stats = await hydro.data.cache.stats();
   * console.log(stats);
   * // {totalSize: 104857600, totalEntries: 42, sizeFormatted: '100 MB', ...}
   */
  async stats() {
    const cacheInstance = globalThis._hydroCache;
    if (!cacheInstance) {
      console.warn('Cache not initialized');
      return { totalSize: 0, totalEntries: 0, sizeFormatted: '0 B' };
    }
    
    const allEntries = await cacheInstance.list({ includeVariables: true });
    const totalSize = allEntries.reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      totalSize,
      totalEntries: allEntries.length,
      sizeFormatted: cacheInstance.formatBytes(totalSize),
      entries: allEntries
    };
  }
};

export { retrieve, transform, download, upload, recursiveSearch, xml2json, getFile, saveFile };
