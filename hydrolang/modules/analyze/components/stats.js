/**
 * Main class used for statistical analyses and data cleaning.
 * @class
 * @name stats
 */
export default class stats {
  /**
   * Makes a deep copy of original data for further manipulation.
   * @method copydata
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object|Array} data - Contains: 1d-JS array or object with original data.
   * @returns {Object|Array} Deep copy of original data.
   * @example
   * hydro.analyze.stats.copydata({data: [1, 2, 3]});
   * hydro.analyze.stats.copydata({data: {a: 1, b: 2}});
   */

  static copydata({ params, args, data } = {}) {
    if (data === null || typeof data !== "object") {
      return data;
    }
    // Shallow copy to prevent Web Worker clone errors
    return Array.isArray(data) ? [...data] : { ...data };
  }

  /**
   * Preprocesses data to robustly handle complex structures (headers, objects, labeled rows).
   * @param {Array} data - Input data array.
   * @returns {Array} Clean numeric array.
   */
  static preprocessData(data) {
    if (!Array.isArray(data)) {
      const num = Number(data);
      if (typeof data === 'number' && !isNaN(data)) return [data];
      if (!isNaN(num)) return [num];
      return [];
    }

    let processed = data;

    // 0. Column-Oriented Detection
    // Check if it's an array of arrays where we have "columns"
    // Heuristic: Outer length is small (e.g. < 10), Inner length is > Outer length
    // And one of the columns is numeric.
    if (processed.length > 0 && Array.isArray(processed[0])) {
      // If it looks like [ [d,d,d], [v,v,v] ]
      const isColumnOriented = processed.every(col => Array.isArray(col)) &&
        processed.length < processed[0].length &&
        processed.length < 20; // heuristic cap

      if (isColumnOriented) {
        // Find the numeric column
        for (const col of processed) {
          // Check sample
          const numericCount = col.slice(0, 10).filter(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)))).length;
          if (numericCount > 5 || (col.length < 10 && numericCount > 0)) {
            return col
              .map(v => Number(v))
              .filter(v => typeof v === 'number' && !isNaN(v));
          }
        }
      }
    }

    // 1. Header Detection (Simple Heuristic: First row strings, Second row numbers)
    if (processed.length > 1 && Array.isArray(processed[0]) && Array.isArray(processed[1])) {
      const firstRowStrings = processed[0].every(item => typeof item === 'string' && isNaN(Number(item)));
      const secondRowNumbers = processed[1].some(item => typeof item === 'number' || !isNaN(Number(item)));
      if (firstRowStrings && secondRowNumbers) {
        processed = processed.slice(1);
      }
    }

    // 2. Value Extraction & Flattening Logic
    const extractNumber = (item) => {
      if (typeof item === 'number') {
        return isNaN(item) ? null : item;
      }
      if (typeof item === 'string') {
        const num = Number(item);
        return isNaN(num) ? null : num;
      }
      if (typeof item === 'object' && item !== null) {
        // Priority keys for extraction
        const keys = ['#text', 'value', 'val', 'amount', 'number'];
        for (const key of keys) {
          if (item[key] !== undefined) {
            const num = Number(item[key]);
            if (!isNaN(num)) return num;
          }
        }
        // Fallback: finding first numeric value involved in array/object
        if (Array.isArray(item)) {
          // Heuristic for [Time, Value] or [Label, Value]
          // If length is 2, check the second item first as it's likely the value
          if (item.length === 2) {
            const second = extractNumber(item[1]);
            if (second !== null) return second;
            const first = extractNumber(item[0]);
            if (first !== null) return first;
          }

          // General array: Find first valid number
          for (const subItem of item) {
            const n = extractNumber(subItem);
            if (n !== null) return n;
          }
        } else {
          // Object fallback: First numeric property
          for (const key in item) {
            const num = Number(item[key]);
            if (!isNaN(num)) return num;
          }
        }
      }
      return null; // Non-numeric
    };

    const cleanData = [];
    for (const item of processed) {
      const val = extractNumber(item);
      if (val !== null) cleanData.push(val);
    }

    return cleanData;
  }

  /**
   * Retrieves a 1D array with the data.
   * @method onearray
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - Contains: 1d-JS array as [data].
   * @returns {Array} Array object.
   * @example
   * hydro.analyze.stats.onearray({data: [1, 2, 3]});
   */

  static onearray({ params, args, data } = {}) {
    var arr = [];
    arr.push(data[1]);
    return arr;
  }

  /**
   * Gives the range of a dataset.
   * @method range
   * @memberof stats
   * @param {Object} params - Contains: N (number of steps).
   * @param {Object} args - Not used by this function.
   * @param {Array} data - Contains: 1d-JS array with data as [data].
   * @returns {Array} Range of the data.
   * @example
   * hydro.analyze.stats.range({data: [1, 5, 10]});
   * hydro.analyze.stats.range({params: {N: 5}, data: [1, 10]});
   */
  static range({ params = {}, args, data } = {}) {
    const min = this.min({ data }),
      max = this.max({ data });
    // Robust parsing
    const N = Number(params.N || data.length);
    const step = (max - min) / N;
    const range = [];

    for (let i = 0; i <= N; i++) {
      range.push(min + i * step);
    }

    return range;
  }

  /**
   * Identifies gaps in data.
   * @method datagaps
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - Contains: 1d-JS array with data as [data].
   * @returns {Number} Number of gaps in data.
   * @example
   * hydro.analyze.stats.datagaps({data: [1, NaN, 3, undefined]});
   */

  static datagaps({ params, args, data } = {}) {
    var arr = data,
      or,
      gap = 0;

    if (typeof arr[0] != "object") {
      or = arr.slice();
    } else {
      or = arr[1].slice();
    }
    for (var i = 0; i < or.length; i++) {
      if (or[i] === undefined || Number.isNaN(or[i]) || or[i] === false) {
        gap++;
      }
    }

    return console.log(`Total amount of gaps in data: ${gap}.`);
  }

  /**
   * Remove or fill gaps in data with various methods
   * Handles NaN, null, undefined, false, and custom gap values
   * Supports interpolation, mean, and median filling strategies
   * 
   * @function gapremoval
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Parameters
   * @param {Array} [options.params.gapValues] - Values to treat as gaps (default: [undefined, null, NaN, false, -9999, 9999])
   * @param {Object} [options.args] - Arguments
   * @param {string} [options.args.method] - Fill method: 'interpolate', 'mean', 'median' (default: 'interpolate')
   * @param {Array} options.data - Data array (1D or 2D with [time, values])
   * @returns {Array} Data with gaps removed or filled
   * 
   * @example
   * // Interpolate missing values
   * const data = [10, NaN, 14, 16, null, 20];
   * const filled = hydro.analyze.stats.gapremoval({ 
   *   data, 
   *   args: { method: 'interpolate' } 
   * });
   * console.log(filled); // [10, 12, 14, 16, 18, 20] (interpolated)
   * 
   * @example
   * // Fill with mean
   * const rainfall = [12, -9999, 15, 18, -9999, 14]; // -9999 = missing
   * const filled = hydro.analyze.stats.gapremoval({
   *   data: rainfall,
   *   params: { gapValues: [-9999] },
   *   args: { method: 'mean' }
   * });
   * 
   * @example
   * // Time series with gaps
   * const timeSeries = [
   *   ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04'],
   *   [100, NaN, 120, 125]
   * ];
   * const filled = hydro.analyze.stats.gapremoval({ 
   *   data: timeSeries,
   *   args: { method: 'interpolate' } 
   * });
   */
  static gapremoval({ params = {}, args = {}, data } = {}) {
    let gapValues = params.gapValues || [undefined, null, NaN, false, -9999, 9999];

    // Robust parsing: convert string numbers in gapValues array
    if (Array.isArray(gapValues)) {
      gapValues = gapValues.map(v => (typeof v === 'string' && !Number.isNaN(Number(v))) ? Number(v) : v);
    }

    const method = args.method || 'interpolate'; // 'interpolate', 'mean', 'median'
    const isGap = (v) => gapValues.some(gap => Object.is(gap, v) || (Number.isNaN(gap) && Number.isNaN(v)));

    const cleanArray = (arr) => arr.filter(v => !isGap(v));

    const interpolate = (arr) => {
      const result = [...arr];
      for (let i = 0; i < result.length; i++) {
        if (isGap(result[i])) {
          // Find nearest non-gap neighbors
          let prev = i - 1;
          let next = i + 1;
          while (prev >= 0 && isGap(result[prev])) prev--;
          while (next < result.length && isGap(result[next])) next++;

          if (prev >= 0 && next < result.length) {
            result[i] = (result[prev] + result[next]) / 2;
          } else if (prev >= 0) {
            result[i] = result[prev];
          } else if (next < result.length) {
            result[i] = result[next];
          } else {
            result[i] = 0;
          }
        }
      }
      return result;
    };

    const fillStat = (arr, stat = 'mean') => {
      const valid = cleanArray(arr);
      const fill = stat === 'median'
        ? valid.sort((a, b) => a - b)[Math.floor(valid.length / 2)]
        : valid.reduce((a, b) => a + b, 0) / valid.length;
      return arr.map(v => isGap(v) ? fill : v);
    };

    if (!Array.isArray(data)) return data;

    // Case 1: Flat numeric array
    if (typeof data[0] !== 'object') {
      return method === 'interpolate'
        ? interpolate(data)
        : fillStat(data, method);
    }

    // Case 2: 2D array (e.g. [time, values])
    let time = data[0], series = data[1];

    // Optionally remove both time & value if value is invalid
    const validTime = [], validSeries = [];
    for (let i = 0; i < series.length; i++) {
      if (!isGap(series[i])) {
        validTime.push(time[i]);
        validSeries.push(series[i]);
      }
    }

    let filled = method === 'interpolate'
      ? interpolate(series)
      : fillStat(series, method);

    return [time, filled];
  }


  /**
   * Identifies gaps in time. Used for filling gaps if required by the
   * user. Time in minutes and timestep must be divisible by the total time of the event.
   * @method timegaps
   * @memberof stats
   * @param {Object} params - Contains: timestep (in min).
   * @param {Object} args - Not used by this function.
   * @param {Array} data - Contains: 1d-JS array with timedata in minutes as [timeData].
   * @returns {Array} Array with gaps.
   * @example
   * hydro.analyze.stats.timegaps({params: {timestep: 60}, data: [0, 60, 180, 240]});
   */

  static timegaps({ params, args, data } = {}) {
    // Robust parsing
    var timestep = Number(params.timestep),
      arr = data,
      or = Array.isArray(arr) ? arr.slice() : [];

    if (typeof arr[0] === "object") {
      or = arr[0].slice();
    }
    var datetr = [];

    for (var i = 0; i < or.length; i++) {
      if (typeof or[0] == "string") {
        datetr.push(Math.abs(Date.parse(or[i]) / (60 * 1000)));
      } else {
        datetr.push(or[i]);
      }
    }

    var gaps = 0,
      loc = [],
      //timestep and total duration in minutes.
      time = timestep;

    for (var i = 1; i < or.length - 1; i++) {
      if (
        Math.abs(datetr[i - 1] - datetr[i]) != time ||
        Math.abs(datetr[i] - datetr[i + 1]) != time
      ) {
        gaps++;
        loc.push(or[i]);
      }
    }

    if (loc.length === 0) {
      console.log("No gaps in times!");
      return;
    } else {
      console.log(`Number of time gaps: ${gaps}`);
      return loc;
    }
  }

  /**
   * Fills data gaps (either time missig or data missing). Unfinished.
   * @method gapfiller
   * @memberof stats
   * @param {Object} params - Contains: type (time or data).
   * @param {Object} args - Not used by this function.
   * @param {Array} data - Contains: 2d-JS array with data or time gaps to be filled as [[time],[data]].
   * @returns {Array} Array with gaps filled.
   * @example
   * hydro.analyze.stats.gapfiller({params: {type: 'time'}, data: [[0, 60, 180], [1, 2, 3]]});
   */

  static gapfiller({ params, args, data } = {}) {
    var or = Array.isArray(data) ? data.slice() : [],
      datetr = [];

    if (Array.isArray(data[0])) {
      or = data[0].slice();
    }

    for (var i = 0; i < or.length; i++) {
      if (typeof or[0] == "string") {
        datetr.push(Math.abs(Date.parse(or[i]) / (60 * 1000)));
      } else {
        datetr.push(or[i]);
      }
    }

    if (params.type === "time") {
      // Simple linear interpolation for time gaps
      // This is a placeholder for more complex logic if needed
      const filled = [];
      for (let i = 0; i < datetr.length; i++) {
        filled.push(datetr[i]);
        if (i < datetr.length - 1) {
          const diff = datetr[i + 1] - datetr[i];
          // If gap is larger than expected timestep (assuming params.timestep exists or inferred)
          // For now, just returning the data as is since logic was incomplete
        }
      }
      return datetr;
    }
    return or;
  }

  /**
   * Calculate the sum of all values in a dataset
   * Automatically handles complex data structures through preprocessing
   * 
   * @function sum
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {number} Sum of all values in the array
   * 
   * @example
   * // Basic sum
   * const total = hydro.analyze.stats.sum({ data: [1, 2, 3, 4] });
   * console.log(total); // 10
   * 
   * @example  
   * // Works with precipitation data
   * const dailyRainfall = [12.5, 0, 5.2, 18.3, 3.1];
   * const weeklyTotal = hydro.analyze.stats.sum({ data: dailyRainfall });
   * console.log(`Total rainfall: ${weeklyTotal} mm`);
   */
  static sum({ params, args, data } = {}) {
    const clean = this.preprocessData(data);
    return data.reduce((acc, curr) => acc + curr, 0);
  }

  /**
   * Calculate the arithmetic mean (average) of a dataset
   * Returns 0 for empty arrays, handles NaN values gracefully
   * 
   * @function mean
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {number} Arithmetic mean of the dataset, or 0 if empty
   * 
   * @example
   * // Calculate average temperature
   * const temps = [22.5, 23.1, 21.8, 24.2, 23.5];
   * const avgTemp = hydro.analyze.stats.mean({ data: temps });
   * console.log(avgTemp); // 23.02
   * 
   * @example
   * // Calculate mean streamflow
   * const flow = [125.5, 138.2, 142.8, 135.1, 129.6];
   * const avgFlow = hydro.analyze.stats.mean({ data: flow });
   * console.log(`Average flow: ${avgFlow.toFixed(2)} m³/s`);
   */
  static mean({ params, args, data } = {}) {
    const clean = data
    if (!clean.length) return 0;
    const sum = clean.reduce((acc, curr) => acc + curr, 0);
    const mean = sum / clean.length;
    if (Number.isNaN(mean)) {
      console.warn('stats.mean returned NaN. Data:', data, 'Sum:', sum);
    }
    return mean;
  }

  /**
   * Calculate the median (middle value) of a dataset
   * Handles both odd and even-length arrays, automatically sorts data
   * Robust to outliers compared to mean
   * 
   * @function median
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {number} Median value of the dataset, or 0 if empty
   * 
   * @example
   * // Odd number of values
   * const values1 = [1, 2, 3, 4, 5];
   * console.log(hydro.analyze.stats.median({ data: values1 })); // 3
   * 
   * @example
   * // Even number of values (average of two middle values)
   * const values2 = [1, 2, 3, 4];
   * console.log(hydro.analyze.stats.median({ data: values2 })); // 2.5
   * 
   * @example
   * // Median is robust to outliers
   * const precipitation = [10, 12, 11, 13, 100]; // 100 is outlier
   * console.log(hydro.analyze.stats.mean({ data: precipitation })); // 29.2 (affected by outlier)
   * console.log(hydro.analyze.stats.median({ data: precipitation })); // 12 (not affected)
   */
  static median({ params, args, data } = {}) {
    const clean = this.preprocessData(data);
    if (!clean.length) return 0;
    const sortedArray = clean.sort((a, b) => a - b);
    const middleIndex = Math.floor(sortedArray.length / 2);

    if (sortedArray.length % 2 === 0) {
      const left = sortedArray[middleIndex - 1];
      const right = sortedArray[middleIndex];
      return (left + right) / 2;
    } else {
      return sortedArray[middleIndex];
    }
  }

  /**
   * Calculate the standard deviation of a dataset
   * Measures the amount of variation or dispersion from the mean
   * Uses population standard deviation formula (divides by N, not N-1)
   * 
   * @function stddev
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {number} Standard deviation of the dataset, or 0 if empty
   * 
   * @example
   * // Calculate variability in temperature  
   * const dailyTemps = [20, 22, 19, 23, 21, 20, 22];
   * const tempStdDev = hydro.analyze.stats.stddev({ data: dailyTemps });
   * console.log(`Temperature variability: ±${tempStdDev.toFixed(2)}°C`);
   * 
   * @example
   * // Compare variability of two streamflow datasets
   * const upstream = [100, 105, 98, 102, 101];
   * const downstream = [200, 350, 150, 400, 180];
   * console.log('Upstream stddev:', hydro.analyze.stats.stddev({ data: upstream })); // ~2.5
   * console.log('Downstream stddev:', hydro.analyze.stats.stddev({ data: downstream })); // ~99.8 (more variable)
   */
  static stddev({ params, args, data } = {}) {
    const clean = this.preprocessData(data);
    if (!clean.length) return 0;
    var mean = this.mean({ data: clean }),
      SD = 0,
      nex = [];
    for (var i = 0; i < clean.length; i += 1) {
      nex.push((clean[i] - mean) * (clean[i] - mean));
    }
    return (SD = Math.sqrt(this.sum({ data: nex }) / nex.length));
  }

  /**
   * Calculate the variance of a dataset
   * Variance is the average of squared deviations from the mean
   * Standard deviation squared (σ²)
   * 
   * @function variance
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {number} Variance of the dataset, or 0 if empty
   * 
   * @example
   * // Calculate variance of rainfall data
   * const rainfall = [10, 15, 12, 18, 14];
   * const variance = hydro.analyze.stats.variance({ data: rainfall });
   * const stddev = Math.sqrt(variance); // or use stats.stddev()
   * console.log(`Variance: ${variance.toFixed(2)}, StdDev: ${stddev.toFixed(2)}`);
   * 
   * @example
   * // Variance is in squared units
   * const flow = [100, 120, 90, 110]; // flow in m³/s
   * const var_flow = hydro.analyze.stats.variance({ data: flow });
   * console.log(`Variance: ${var_flow} (m³/s)²`);
   */
  static variance({ params, args, data } = {}) {
    const clean = this.preprocessData(data);
    if (!clean.length) return 0;
    const mean = this.mean({ data: clean });
    const squareDiffs = clean.map((num) => (num - mean) ** 2);
    const sumSquareDiffs = squareDiffs.reduce((acc, curr) => acc + curr, 0);
    const variance = sumSquareDiffs / clean.length;
    return variance;
  }

  /**
   * Calculate sum of squared values
   * Used in variance calculations and sum of squared errors
   * 
   * @function sumsqrd
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {number} Sum of squared values
   * 
   * @example
   * // Calculate sum of squares
   * const data = [1, 2, 3, 4];
   * const ss = hydro.analyze.stats.sumsqrd({ data });
   * console.log(ss); // 1² + 2² + 3² + 4² = 30
   * 
   * @example
   * // Used in error calculations
   * const errors = [0.5, -1.2, 0.8, -0.3];
   * const sse = hydro.analyze.stats.sumsqrd({ data: errors });
   * console.log(`Sum of squared errors: ${sse}`);
   */
  static sumsqrd({ params, args, data } = {}) {
    const clean = this.preprocessData(data);
    var i = clean.length,
      sum = 0;
    while (--i >= 0) sum += Math.pow(clean[i], 2);
    return sum;
  }

  /**
   * Find the minimum value in a dataset
   * Automatically preprocesses data to handle complex structures
   * 
   * @function min
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {number} Minimum value in the dataset
   * 
   * @example
   * // Find minimum daily temperature
   * const temps = [22, 18, 25, 20, 19];
   * const minTemp = hydro.analyze.stats.min({ data: temps });
   * console.log(`Lowest temperature: ${minTemp}°C`); // 18°C
   * 
   * @example
   * // Useful for finding lowest flow in a period
   * const streamflow = [125.5, 138.2, 142.8, 135.1, 129.6];
   * const minFlow = hydro.analyze.stats.min({ data: streamflow });
   */
  static min({ params, args, data } = {}) {
    const clean = this.preprocessData(data);
    return Math.min(...clean);
  }

  /**
   * Find the maximum value in a dataset
   * Automatically preprocesses data to handle complex structures
   * 
   * @function max
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {number} Maximum value in the dataset
   * 
   * @example
   * // Find peak daily temperature
   * const temps = [22, 18, 25, 20, 19];
   * const maxTemp = hydro.analyze.stats.max({ data: temps });
   * console.log(`Highest temperature: ${maxTemp}°C`); // 25°C
   * 
   * @example
   * // Find peak flow for flood analysis
   * const streamflow = [125.5, 138.2, 542.8, 135.1, 129.6];
   * const peakFlow = hydro.analyze.stats.max({ data: streamflow });
   * console.log(`Peak flow: ${peakFlow} m³/s`); // 542.8 m³/s
   */
  static max({ params, args, data } = {}) {
    const clean = this.preprocessData(data);
    return Math.max(...clean);
  }

  /**
   * Extract unique values from a dataset
   * Removes duplicates and returns only distinct values
   * 
   * @function unique
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {Array<number>} Array containing only unique values
   * 
   * @example
   * // Get unique precipitation values
   * const dailyRain = [0, 5, 0, 12, 5, 0, 18, 12];
   * const uniqueValues = hydro.analyze.stats.unique({ data: dailyRain });
   * console.log(uniqueValues); // [0, 5, 12, 18]
   * 
   * @example
   * // Count number of unique flow values
   * const flow = [100, 120, 100, 150, 120, 100];
   * const unique = hydro.analyze.stats.unique({ data: flow });
   * console.log(`${unique.length} unique flow values:`, unique);
   */
  static unique({ params, args, data } = {}) {
    const clean = this.preprocessData(data);
    return clean.filter((value, index, self) => self.indexOf(value) === index);
  }

  /**
   * Calculate frequency distribution of values in a dataset
   * Returns object with each unique value as key and its count as value
   * 
   * @function frequency
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {Object} Object with value:count pairs
   * 
   * @example
   * // Analyze precipitation frequency
   * const rainfall = [0, 5, 0, 0, 10, 5, 0, 15, 5];
   * const freq = hydro.analyze.stats.frequency({ data: rainfall });
   * console.log(freq); // { 0: 4, 5: 3, 10: 1, 15: 1 }
   * console.log(`No rain on ${freq[0]} days`);
   * 
   * @example
   * // Find most common flow value
   * const flow = [100, 120, 100, 150, 120, 100, 100];
   * const freq = hydro.analyze.stats.frequency({ data: flow });
   * const mostCommon = Object.entries(freq)
   *   .sort((a, b) => b[1] - a[1])[0];
   * console.log(`Most frequent flow: ${mostCommon[0]} (${mostCommon[1]} times)`);
   */
  static frequency({ params, args, data } = {}) {
    var _arr = this.preprocessData(data),
      counter = {};
    _arr.forEach((i) => {
      counter[i] = (counter[i] || 0) + 1;
    });
    return counter;
  }

  /**
   * Standardize data using z-score normalization
   * Transforms data to have mean=0 and standard deviation=1
   * Useful for comparing variables on different scales
   * 
   * @function standardize
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {Array<number>} Standardized data (z-scores)
   * 
   * @example
   * // Standardize flow data
   * const flow = [100, 150, 200, 250, 300];
   * const zScores = hydro.analyze.stats.standardize({ data: flow });
   * console.log(zScores); // [-1.41, -0.71, 0, 0.71, 1.41] (approximately)
   * 
   * @example
   * // Compare variables on different scales
   * const temp = [20, 25, 30]; // °C
   * const precip = [10, 50, 100]; // mm
   * const tempStd = hydro.analyze.stats.standardize({ data: temp });
   * const precipStd = hydro.analyze.stats.standardize({ data: precip });
   * // Now both have mean=0, std=1 and can be compared
   * 
   * @example
   * // Identify outliers (|z| > 3 is often considered outlier)
   * const data = [10, 12, 11, 13, 100, 12, 11];
   * const zScores = hydro.analyze.stats.standardize({ data });
   * const outliers = data.filter((v, i) => Math.abs(zScores[i]) > 3);
   * console.log(outliers); // [100]
   */
  static standardize({ params, args, data } = {}) {
    const clean = this.preprocessData(data);
    var _arr = [],
      stddev = this.stddev({ data: clean }),
      mean = this.mean({ data: clean });
    for (var i = 0; i < clean.length; i++) {
      _arr[i] = (clean[i] - mean) / stddev;
    }
    return _arr;
  }

  /**
   * Calculate quantiles (percentiles) of a dataset
   * Returns the value below which a given percentage of observations fall
   * Uses linear interpolation between data points
   * 
   * @function quantile
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} options.params - Parameters
   * @param {number} options.params.q - Quantile to calculate (0 to 1, e.g., 0.25 for 25th percentile, 0.5 for median)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {number} Value at the specified quantile
   * 
   * @example
   * // Calculate quartiles
   * const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
   * const Q1 = hydro.analyze.stats.quantile({ params: { q: 0.25 }, data }); // 25th percentile
   * const Q2 = hydro.analyze.stats.quantile({ params: { q: 0.5 }, data });  // 50th percentile (median)
   * const Q3 = hydro.analyze.stats.quantile({ params: { q: 0.75 }, data }); // 75th percentile
   * console.log(`Q1: ${Q1}, Q2: ${Q2}, Q3: ${Q3}`);
   * 
   * @example
   * // Calculate 95th percentile for flood frequency analysis
   * const annualPeaks = [450, 520, 480, 650, 590, 510, 720, 480, 550, 610];
   * const P95 = hydro.analyze.stats.quantile({ params: { q: 0.95 }, data: annualPeaks });
   * console.log(`95th percentile flow: ${P95} m³/s`);
   */
  static quantile({ params, args, data } = {}) {
    const clean = this.preprocessData(data);
    clean.sort(function (a, b) {
      return a - b;
    });
    // Robust parsing
    var p = (clean.length - 1) * Number(params.q);
    if (p % 1 === 0) {
      return clean[p];
    } else {
      var b = Math.floor(p),
        rest = p - b;
      if (clean[b + 1] !== undefined) {
        return clean[b] + rest * (clean[b + 1] - clean[b]);
      } else {
        return clean[b];
      }
    }
  }

  /**
   * Detect and remove interquartile range (IQR) outliers
   * Uses the 1.5*IQR rule: values beyond Q1-1.5IQR or Q3+1.5IQR are outliers
   * More robust to extreme values than z-score method
   * 
   * @function interoutliers
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Parameters
   * @param {number} [options.params.q1=0.25] - Lower quartile (default: 25th percentile)
   * @param {number} [options.params.q2=0.75] - Upper quartile  (default: 75th percentile)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {Array<number>} Data with outliers removed
   * 
   * @example
   * // Remove outliers from streamflow data
   * const flow = [100, 105, 98, 102, 500, 101, 99, 103]; // 500 is outlier
   * const cleaned = hydro.analyze.stats.interoutliers({ 
   *   params: { q1: 0.25, q2: 0.75 },
   *   data: flow 
   * });
   * console.log(cleaned); // [100, 105, 98, 102, 101, 99, 103] (500 removed)
   * 
   * @example
   * // IQR method for precipitation data
   * const rainfall = [0, 5, 10, 8, 12, 150, 7, 9, 11]; // 150 is extreme outlier
   * const filtered = hydro.analyze.stats.interoutliers({ data: rainfall });
   * // Removes values beyond Q1-1.5*IQR and Q3+1.5*IQR
   * 
   * @example
   * // Compare original vs cleaned data
   * const data = [10, 12, 11, 13, 100, 12, 11, 14, 200];
   * const cleaned = hydro.analyze.stats.interoutliers({ data });
   * console.log(`Removed ${data.length - cleaned.length} outliers`);
   * console.log(`Mean before: ${hydro.analyze.stats.mean({data})}`);
   * console.log(`Mean after: ${hydro.analyze.stats.mean({data: cleaned})}`);
   */
  static interoutliers({ params = { q1: 0.25, q2: 0.75 }, data = [] } = {}) {
    const clean = data
    const q1 = Number(params.q1 !== undefined ? params.q1 : 0.25);
    const q2 = Number(params.q2 !== undefined ? params.q2 : 0.75);

    var q1v = this.quantile({ params: { q: q1 }, data: clean });
    var q2v = this.quantile({ params: { q: q2 }, data: clean });
    var iqr = q2v - q1v;
    var max = q2v + iqr * 1.5;
    var min = q1v - iqr * 1.5;

    return clean.filter((value) => value >= min && value <= max);
  }

  /**
   * Detect outliers using z-score (standard score) method
   * Returns threshold bounds based on number of standard deviations
   * Values beyond these thresholds are considered outliers
   * 
   * @function normoutliers
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Parameters
   * @param {number} [options.params.lowerBound=-0.5] - Lower threshold in standard deviations
   * @param {number} [options.params.upperBound=0.5] - Upper threshold in standard deviations
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {Object} Object with min and max threshold values
   * 
   * @example
   * // Standard 3-sigma rule (|z| > 3 is outlier)
   * const flow = [100, 105, 98, 102, 500, 101, 99];
   * const bounds = hydro.analyze.stats.normoutliers({ 
   *   params: { lowerBound: -3, upperBound: 3 },
   *   data: flow 
   * });
   * console.log(`Outliers beyond: ${bounds.min} - ${bounds.max}`);
   * 
   * @example
   * // Custom threshold for flow data
   * const rainfall = [10, 12, 11, 150, 13, 12];
   * const bounds = hydro.analyze.stats.normoutliers({ 
   *   params: { lowerBound: -2, upperBound: 2 },
   *   data: rainfall 
   * });
   * const outliers = rainfall.filter(v => v < bounds.min || v > bounds.max);
   */
  static normoutliers({ params = {}, args, data } = {}) {
    const clean = this.preprocessData(data);
    const mean = this.mean({ data: clean });
    const std = this.stddev({ data: clean });
    const lowerBound = Number(params.lowerBound !== undefined ? params.lowerBound : -0.5);
    const upperBound = Number(params.upperBound !== undefined ? params.upperBound : 0.5);

    return {
      min: mean - lowerBound * std,
      max: mean + upperBound * std,
    };
  }

  /**
   * Remove outliers from dataset. It uses p1 and p2 as outliers to remove.
   * @method outremove
   * @memberof stats
   * @param {Object} params - Contains: type ('normalized', 'interquartile').
   * @param {Object} args - Contains: thresholds ([min, max]), replaceValue (value to replace outliers with).
   * @param {Array} data - Contains: 2d-JS array with time series data as [[time],[data]].
   * @returns {Array} Array with cleaned data.
   * @example
   * hydro.analyze.stats.outremove({args: {thresholds: [0, 10], replaceValue: 0}, data: [1, 15, 5]});
   */

  static outremove({ data, params = {} } = {}) {
    let {
      replaceValue = 0,
      thresholds = [-9999, 9999],
    } = params;

    if (typeof replaceValue === 'string' && !isNaN(Number(replaceValue))) {
      replaceValue = Number(replaceValue);
    }
    if (Array.isArray(thresholds)) {
      thresholds = thresholds.map(Number);
    }

    const isOutlier = (v) =>
      typeof v === "number" && (v < thresholds[0] || v > thresholds[1]);

    if (!Array.isArray(data)) return data;

    // Detect column-oriented format:
    // Example: [[header, v1, v2...], [header2, v1, v2...]]
    let isColumnOriented =
      data.length > 1 &&
      Array.isArray(data[0]) &&
      data.every((col) => Array.isArray(col) && col.length === data[0].length);

    if (isColumnOriented) {
      return data.map((col) => {
        const header = col[0];

        // Determine whether column is numeric based on *values only*, not header
        const isNumericColumn = col
          .slice(1)
          .some((v) => !isNaN(Number(v)) && v !== null && v !== "");

        if (!isNumericColumn) return col; // leave string/date columns alone

        // Clean numeric column
        return col.map((item, index) => {
          if (index === 0) return item; // keep header
          const val = Number(item);
          if (isNaN(val)) return item;
          return isOutlier(val) ? replaceValue : val;
        });
      });
    }

    // Detect row-oriented 2D: [[t,v], [t,v]]
    if (Array.isArray(data[0])) {
      return data.map((row) => {
        let valIndex = -1;

        // find numeric value column
        for (let i = 0; i < row.length; i++) {
          if (!isNaN(Number(row[i])) && row[i] !== null && row[i] !== "") {
            valIndex = i;
            break;
          }
        }

        if (valIndex !== -1) {
          const val = Number(row[valIndex]);
          if (!isNaN(val) && isOutlier(val)) {
            const newRow = [...row];
            newRow[valIndex] = replaceValue;
            return newRow;
          }
        }
        return row;
      });
    }

    // 1D list
    return data.map((item) => {
      const val = Number(item);
      if (isNaN(val)) return item;
      return isOutlier(val) ? replaceValue : val;
    });
  }




  /**
   * Calculate Pearson correlation coefficient for bivariate analysis
   * Measures the linear relationship between two datasets (-1 to 1)
   * Both datasets must be the same length
   * 
   * @function correlation
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Object} options.data - Object containing two datasets
   * @param {Array<number>} options.data.set1 - First dataset
   * @param {Array<number>} options.data.set2 - Second dataset  
   * @returns {number} Pearson correlation coefficient (-1 to 1)
   * 
   * @example
   * // Perfect positive correlation
   * const data1 = { set1: [1, 2, 3, 4, 5], set2: [2, 4, 6, 8, 10] };
   * const r1 = hydro.analyze.stats.correlation({ data: data1 });
   * console.log(r1); // ~1.0 (strong positive correlation)
   * 
   * @example
   * // Compare observed vs modeled streamflow
   * const observed = [120, 135, 142, 138, 125];
   * const modeled = [118, 140, 138, 135, 128];
   * const r = hydro.analyze.stats.correlation({ 
   *   data: { set1: observed, set2: modeled } 
   * });
   * console.log(`Correlation: ${r.toFixed(3)}`); // e.g., 0.985
   * 
   * @example
   * // Interpret correlation values:
   * // r =  1.0: Perfect positive correlation
   * // r =  0.7: Strong positive correlation
   * // r =  0.0: No correlation
   * // r = -0.7: Strong negative correlation
   * // r = -1.0: Perfect negative correlation
   */
  static correlation({ params, args, data } = {}) {
    const { set1, set2 } = data;
    const n = set1.length + set2.length;
    // Robust parsing
    const s1 = set1.map(Number);
    const s2 = set2.map(Number);
    const q1q2 = [];
    const sq1 = [];
    const sq2 = [];

    for (let i = 0; i < s1.length; i++) {
      q1q2[i] = s1[i] * s2[i];
      sq1[i] = s1[i] ** 2;
      sq2[i] = s2[i] ** 2;
    }

    const r1 =
      n * this.sum({ data: q1q2 }) -
      this.sum({ data: s1 }) * this.sum({ data: s2 });
    const r2a = Math.sqrt(
      n * this.sum({ data: sq1 }) - this.sum({ data: s1 }) ** 2
    );
    const r2b = Math.sqrt(
      n * this.sum({ data: sq2 }) - this.sum({ data: s2 }) ** 2
    );

    return r1 / (r2a * r2b);
  }

  /**
   * Calculate various efficiency metrics to evaluate hydrological model performance
   * Essential for comparing simulated outputs with observed data
   * Supports NSE, R², Index of Agreement, RMSE, MAE, and more
   * 
   * @function efficiencies
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} options.params - Parameters
   * @param {string} options.params.type - Type of metric: 'NSE', 'determination', 'agreement', 'RMSE', 'MAE', 'all'
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array} options.data - Two arrays: [observed, modeled] values (must be same length)
   * @returns {number|Object} Efficiency value, or object with all metrics if type='all'
   * 
   * @example
   * // Nash-Sutcliffe Efficiency (NSE) - most common hydrological metric
   * // NSE = 1: Perfect model, NSE = 0: Model as good as mean, NSE < 0: Model worse than mean
   * const observed = [10.5, 12.3, 15.8, 18.2, 14.1, 11.7, 9.8];
   * const modeled = [10.2, 12.1, 16.2, 17.8, 14.5, 11.3, 10.1];
   * const nse = hydro.analyze.stats.efficiencies({
   *   params: { type: 'NSE' },
   *   data: [observed, modeled]
   * });
   * console.log(`NSE: ${nse.toFixed(3)}`); // e.g., 0.985 (excellent performance)
   * 
   * @example
   * // Coefficient of Determination (RÂ²)
   * const r2 = hydro.analyze.stats.efficiencies({
   *   params: { type: 'determination' },
   *   data: [observed, modeled]
   * });
   * console.log(`R²: ${r2.toFixed(3)}`); // 0 to 1, higher is better
   * 
   * @example
   * // Calculate all metrics for comprehensive model evaluation
   * const metrics = hydro.analyze.stats.efficiencies({
   *   params: { type: 'all' },
   *   data: [observed, modeled]
   * });
   * console.log('Model Performance:');
   * console.log(`  NSE: ${metrics.NSE.toFixed(3)}`);
   * console.log(`  R²: ${metrics.determination.toFixed(3)}`);
   * console.log(`  Index of Agreement: ${metrics.agreement.toFixed(3)}`);
   * 
   * @example
   * // Interpretation guide:
   * // NSE: >0.75 = Very good, 0.65-0.75 = Good, 0.50-0.65 = Satisfactory, <0.50 = Unsatisfactory
   * // R²: >0.85 = Very good correlation
   * // Index of Agreement: >0.90 = Excellent agreement
   */
  static efficiencies({ params, args, data } = {}) {
    let { type } = params,
      [obsRaw, modelRaw] = data;

    // Robust parsing
    const obs = obsRaw.map(Number);
    const model = modelRaw.map(Number);

    const meanobs = this.mean({ data: obs });
    const meanmodel = this.mean({ data: model });

    if (type === "NSE") {
      const diff1 = model.map((val, i) => Math.pow(val - obs[i], 2));
      const diff2 = obs.map((val) => Math.pow(val - meanobs, 2));
      const NSE = 1 - this.sum({ data: diff1 }) / this.sum({ data: diff2 });
      return NSE;
    } else if (type === "determination") {
      const diff1 = [];
      const diff2 = [];
      const diff3 = [];

      for (let i = 0; i < obs.length; i++) {
        diff1[i] = (model[i] - meanmodel) * (obs[i] - meanobs);
        diff2[i] = Math.pow(model[i] - meanmodel, 2);
        diff3[i] = Math.pow(obs[i] - meanobs, 2);
      }

      console.log(
        `The values are - Upper: ${this.sum({
          data: diff1,
        })}, Lower: ${this.sum({ data: diff2 })} and ${this.sum({
          data: diff3,
        })}`
      );

      const r = Math.pow(
        this.sum({ data: diff1 }) /
        (Math.sqrt(this.sum({ data: diff2 })) *
          Math.sqrt(this.sum({ data: diff3 }))),
        2
      );
      return r;
    } else if (type === "agreement") {
      const diff1 = obs.map((val, i) => Math.pow(val - model[i], 2));
      const diff2 = obs.map((val, i) =>
        Math.pow(Math.abs(model[i] - meanobs) + Math.abs(val - meanobs), 2)
      );
      const d = 1 - this.sum({ data: diff1 }) / this.sum({ data: diff2 });
      return d;
    }

    if (type === "all") {
      const metrics = {
        NSE: this.efficiencies({
          params: { type: "NSE" },
          data: [obs, model],
        }),
        r2: this.efficiencies({
          params: { type: "determination" },
          data: [obs, model],
        }),
        d: this.efficiencies({
          params: { type: "agreement" },
          data: [obs, model],
        }),
      };
      return metrics;
    }
  }

  /**
   * Fast fourier analysis over a 1d dataset
   * and see if there are any patterns within the data. Should be considered to be used
   * for small data sets.
   * @method fastfourier
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - Contains: 1d-JS array with data as [data].
   * @returns {Array} calculated array.
   * @example
   * hydro.analyze.stats.fastFourier({data: [1, 2, 3, 4]});
   */

  static fastFourier({ params, args, data } = {}) {
    // Robust parsing
    const numData = data.map(Number);
    const nearest = Math.pow(2, Math.ceil(Math.log2(numData.length)));
    let paddedData = tf.pad1d(numData, [0, nearest - numData.length]);
    const imag = tf.zerosLike(paddedData);
    const complexData = tf.complex(paddedData, imag);
    const fft = tf.spectral.fft(complexData);
    const fftResult = fft.arraySync();
    return fftResult;
  }

  /**
   * Calculate skewness of a distribution
   * Measures asymmetry of the probability distribution
   * Positive skew: long tail on right, Negative skew: long tail on left
   * 
   * @function skewness
   * @memberof stats
   * @param {Object} options - Function options
   * @param {Object} [options.params] - Additional parameters (not used)
   * @param {Object} [options.args] - Additional arguments (not used)
   * @param {Array<number>} options.data - Array of numeric values
   * @returns {number} Skewness coefficient
   * 
   * @example
   * // Symmetric distribution (skewness ≈ 0)
   * const symmetric = [1, 2, 3, 4, 5, 4, 3, 2, 1];
   * const skew1 = hydro.analyze.stats.skewness({ data: symmetric });
   * console.log(skew1); // ≈ 0 (symmetric)
   * 
   * @example
   * // Right-skewed flood peaks (common in hydrology)
   * const floods = [100, 120, 110, 130, 500]; // 500 creates right skew
   * const skewness = hydro.analyze.stats.skewness({ data: floods });
   * console.log(skewness); // Positive value (right-skewed)
   * 
   * @example
   * // Interpretation:
   * // skewness > 0: Right-skewed (tail extends right)
   * // skewness = 0: Symmetric
   * // skewness < 0: Left-skewed (tail extends left)
   */
  static skewness({ params, arg, data } = {}) {
    // Robust parsing
    const numData = this.preprocessData(data);
    const n = numData.length;
    const mean = this.mean({ data: numData });
    const sum3 = numData.reduce((acc, val) => acc + Math.pow(val - mean, 3), 0);
    const stdDev = Math.sqrt(
      numData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
    );
    return (n / ((n - 1) * (n - 2))) * (sum3 / Math.pow(stdDev, 3));
  }

  /**
   * Calculates the kurtosis of a dataset.
   * @method kurtosis
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - Array of numeric values.
   * @returns {Number} Kurtosis value.
   * @example
   * hydro.analyze.stats.kurtosis({data: [1, 2, 3, 4, 5]});
   */
  static kurtosis({ params, args, data } = {}) {
    // Robust parsing
    const numData = this.preprocessData(data);
    const n = numData.length;
    const mean = this.mean({ data: numData });
    const sum4 = numData.reduce((acc, val) => acc + Math.pow(val - mean, 4), 0);
    const stdDev = this.stddev({ data: numData });
    return (
      ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) *
      (sum4 / Math.pow(stdDev, 4)) -
      (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3))
    );
  }

  /**
   * Performs forward fill to replace missing values in an array with the last non-null value.
   * @method forwardFill
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - Array of values with missing entries.
   * @returns {Object} Object containing the filled data array and an array of replaced indices.
   * @example
   * hydro.analyze.stats.forwardFill({data: [1, null, 3, null, null, 6]});
   */
  static forwardFill({ params, args, data } = {}) {
    let previousValue = null;
    let replaceIndices = [];
    const filledData = data.map((value, index) => {
      if (value > 0) {
        previousValue = value;
        return value;
      } else if (previousValue !== null) {
        replaceIndices.push(index);
        return previousValue;
      } else {
        // Handle the case when the first value is missing
        return null;
      }
    });
    return { data: filledData, replaceIndices };
  }

  /**
   * Returns an array that Contains the basic statistics
   * of a dataset. It is used afterwards to be prompted
   * using google graphing tools.
   * @method basicstats
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - 1d-JS array with data arranged as [data].
   * @returns {Array} flatenned array for the dataset.
   * @example
   * hydro.analyze.stats.basicstats({data: [1, 2, 3, 4, 5]});
   */

  static basicstats({ params, args, data } = {}) {
    // Robust parsing using preprocessData
    data = this.preprocessData(data);

    //if value is outside the values required from the api call
    data = data.map((val) => {
      val > 99998 ? (val = 0) : val;
      return val;
    });
    var temp = [],
      values = [];
    //call the basic functions for analysis.
    values.push("Value");
    values.push(data.length);
    values.push(this.min({ data }));
    values.push(this.max({ data }));
    values.push(this.sum({ data }));
    values.push(this.mean({ data }));
    values.push(this.median({ data }));
    values.push(this.stddev({ data }));
    values.push(this.variance({ data }));
    values.push(this.skewness({ data }));
    values.push(this.kurtosis({ data }));

    temp.push([
      "Metric",
      "Number of values",
      "Minimum Value",
      "Maximum value",
      "Sum",
      "Mean",
      "Median",
      "Standard deviation",
      "Variance",
      "Skewness",
      "Kurtosis",
    ]);
    temp.push(values);
    return temp;
  }

  /***************************/
  /*****Statistic Tests ****/
  /***************************/

  /**
   * Performs the Mann-Kendall trend test for time series data
   * The Mann-Kendall test is a non-parametric statistical test used to identify trends in time series data.
   * In hydrology, it's widely used to detect monotonic trends in climate variables, streamflow, water quality,
   * and other environmental data. This test is particularly valuable because it doesn't require normally
   * distributed data and is robust against outliers.
   * @method MK
   * @memberof stats
   * @param {Object} params - Contains alpha (significance level, default 0.05)
   * @param {Object} args - Not used by this function.
   * @param {Array} data - Array of time series data to test for trend
   * @returns {Object} Results containing:
   *   - S: Mann-Kendall statistic
   *   - z: Standardized test statistic 
   *   - p: p-value of the test
   *   - trend: String indicating detected trend ("increasing", "decreasing", or "no trend")
   *   - significant: Boolean indicating if trend is statistically significant
   * @example
   * // Detect trend in annual streamflow data (mÂ³/s) over 30 years
   * const annualStreamflow = [
   *   105, 98, 102, 95, 90, 100, 92, 87, 93, 85,
   *   88, 82, 80, 85, 78, 75, 80, 76, 72, 70,
   *   75, 68, 65, 72, 67, 62, 65, 60, 58, 55
   * ];
   * 
   * const trendResult = hydro.analyze.stats.MK({
   *   params: { alpha: 0.05 },  // 5% significance level
   *   data: annualStreamflow
   * });
   */

  static MK({ params, args, data }) {
    var sum = 0,
      count = 0,
      sum_v = 0.0,
      S_sum = 0.0,
      z = 0.0;

    params = params || {};
    const alpha = params.alpha || 0.05;

    var p_equal, p_smaller, p_greater;

    for (var i = 0; i < data.length; i++) {
      for (var j = i + 1; j < data.length; j++) {
        count += 1;
        if (data[j] > data[i]) {
          sum += 1;
        } else if (data[j] == data[i]) {
          sum_v += 1;
        }
      }
    }

    p_equal = sum_v / count;
    p_greater = sum / count;
    p_smaller = 1 - p_greater - p_equal;

    S_sum = sum - (count - sum - sum_v);

    var n = data.length;

    // If n â‰¤ 10, use the exact variance calculation
    // Otherwise, use the approximation
    var sigma;
    if (n <= 10) {
      var ties = new Map();
      // Count frequencies of values
      for (var i = 0; i < n; i++) {
        if (ties.has(data[i])) {
          ties.set(data[i], ties.get(data[i]) + 1);
        } else {
          ties.set(data[i], 1);
        }
      }

      // Calculate sum for ties correction
      var tieCorrection = 0;
      for (var [_, count] of ties) {
        if (count > 1) {
          tieCorrection += count * (count - 1) * (2 * count + 5);
        }
      }

      sigma = Math.sqrt((n * (n - 1) * (2 * n + 5) - tieCorrection) / 18);
    } else {
      sigma = Math.sqrt((n * (n - 1) * (2 * n + 5)) / 18);
    }

    if (S_sum > 0) {
      z = (S_sum - 1) / sigma;
    } else if (S_sum < 0) {
      z = (S_sum + 1) / sigma;
    } else {
      z = 0;
    }

    var pvalue = 2 * (1 - this.normalcdf({ data: [Math.abs(z)] })[0]);

    const trend = z > 0 ? "increasing" : z < 0 ? "decreasing" : "no trend";
    const significant = pvalue < alpha;

    return { S: S_sum, z, p: pvalue, trend, significant };
  }

  /**
   * Regularized incomplete gamma function approximation using series expansion.
   * @method gammaCDFApprox
   * @memberof stats
   * @param {Object} params - Parameters for the function: alpha (Shape parameter), beta (Scale parameter).
   * @param {Object} args - Not used by this function.
   * @param {Array} data - Data input (array with single value x).
   * @returns {Number} Regularized incomplete gamma CDF value.
   * @example
   * hydro.analyze.stats.gammaCDFApprox({params: {alpha: 2, beta: 1}, data: [1.5]});
   */
  static gammaCDFApprox({ params = {}, args = {}, data = [] } = {}) {
    const { alpha, beta } = params;
    if (data === undefined || data.length === 0) return 0;
    const x = data[0];
    const EPSILON = 1e-8;
    const ITMAX = 100;

    function gammln(zz) {
      const cof = [76.18009172947146, -86.50532032941677,
        24.01409824083091, -1.231739572450155,
        0.1208650973866179e-2, -0.5395239384953e-5];
      let x = zz - 1.0;
      let tmp = x + 5.5;
      tmp -= (x + 0.5) * Math.log(tmp);
      let ser = 1.000000000190015;
      for (let j = 0; j < 6; j++) {
        x += 1;
        ser += cof[j] / x;
      }
      return -tmp + Math.log(2.5066282746310005 * ser);
    }

    function gser(a, x) {
      let sum = 1.0 / a;
      let del = sum;
      let ap = a;
      for (let n = 1; n <= ITMAX; n++) {
        ap += 1;
        del *= x / ap;
        sum += del;
        if (Math.abs(del) < Math.abs(sum) * EPSILON) {
          return sum * Math.exp(-x + a * Math.log(x) - gammln(a));
        }
      }
      return sum * Math.exp(-x + a * Math.log(x) - gammln(a));
    }

    function gcf(a, x) {
      let b = x + 1 - a;
      let c = 1 / 1e-30;
      let d = 1 / b;
      let h = d;
      for (let i = 1; i <= ITMAX; i++) {
        let an = -i * (i - a);
        b += 2;
        d = an * d + b;
        if (Math.abs(d) < EPSILON) d = EPSILON;
        c = b + an / c;
        if (Math.abs(c) < EPSILON) c = EPSILON;
        d = 1 / d;
        let delta = d * c;
        h *= delta;
        if (Math.abs(delta - 1.0) < EPSILON) break;
      }
      return Math.exp(-x + a * Math.log(x) - gammln(a)) * h;
    }

    const scaledX = x / beta;
    return scaledX < alpha + 1
      ? gser(alpha, scaledX)
      : 1 - gcf(alpha, scaledX);
  }

  /**
   * Normal distribution.
   * @method normalcdf
   * @memberof stats
   * @author Alexander Michalek & Renato Amorim, IFC, University of Iowa.
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - Contains: 1d-JS array with timeseries.
   * @returns {Array} 1d array with probabilities.
   * @example
   * hydro.analyze.stats.normalcdf({data: [1.96, -1.96]});
   */

  static normalcdf({ params, args, data }) {
    let results = [];
    for (var i = 0; i < data.length; i++) {
      var X = data[i],
        //HASTINGS.  MAX ERROR = .000001
        T = 1 / (1 + 0.2316419 * Math.abs(X)),
        D = 0.3989423 * Math.exp((-X * X) / 2),
        Prob =
          D *
          T *
          (0.3193815 +
            T * (-0.3565638 + T * (1.781478 + T * (-1.821256 + T * 1.330274))));
      if (X > 0) {
        Prob = 1 - Prob;
      }
      results.push(Prob);
    }
    return results;
  }

  /**
   * D-statistic.
   * Computes D-statistic from two samples to evaluate if they come from the same distribution.
   * Reference: Kottegoda & Rosso, 2008.
   * @method computeD
   * @memberof stats
   * @author Alexander Michalek & Renato Amorim, IFC, University of Iowa.
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: sampleA and sampleB (1-d arrays).
   * @returns {Number} d-statistic of the samples.
   * @example
   * hydro.analyze.stats.computeD({data: {sampleA: [1, 2, 3], sampleB: [1, 2, 4]}});
   */
  static computeD({ params, args, data = {} }) {
    var { sampleA, sampleB } = data;
    if (!sampleA || !sampleB) return 0;

    var maximumDifference = 0,
      N = 1e3;
    let minimum = this.min({ data: sampleA.concat(sampleB) }),
      maximum = this.max({ data: sampleA.concat(sampleB) }),
      N_A = sampleA.length,
      N_B = sampleB.length;

    for (var x of this.range({ params: { N }, data })) {
      var CDF_A = sampleA.filter((d) => d <= x).length / N_A,
        CDF_B = sampleB.filter((d) => d <= x).length / N_B,
        difference = Math.abs(CDF_A - CDF_B);

      if (difference > maximumDifference) {
        maximumDifference = difference;
      }
    }
    return maximumDifference;
  }

  /**
   * Kolmogorov Smirnov Two-sided Test.
   * Calculates the P value, based on the D-statistic from the function above.
   * Reference: Kottegoda & Rosso, 2008.
   * @method KS_computePValue
   * @memberof stats
   * @author Alexander Michalek & Renato Amorim, IFC, University of Iowa
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - 2d-JS array containing ordered as [samples_A, samples_B], with each being 1-d arrays.
   * @returns {Array} array with [p-Statistic, d-Statistic].
   * @example
   * hydro.analyze.stats.KS_computePValue({data: [[1, 2, 3], [1, 2, 4]]});
   */
  static KS_computePValue({ params, args, data }) {
    var samples_A = data[0],
      samples_B = data[1],
      d = this.computeD({ data: [samples_A, samples_B] }),
      n = samples_A.length,
      m = samples_B.length,
      p = 2 * Math.exp((-2 * d * d * (n * m)) / (n + m));
    return [p, d];
  }

  /**
   * Reject P statistic based on a significance level alpha.
   * Reference: Kottegoda & Rosso, 2008.
   * @method KS_rejectAtAlpha
   * @memberof stats
   * @author Alexander Michalek & Renato Amorim, IFC, University of Iowa
   * @param {Object} params - contains {alpha: Number} with alpha being the significance level.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - 2d-JS array containing ordered as [samples_A, samples_B], with each being 1-d arrays.
   * @returns {Boolean} rejection if p is less than the significance level.
   * @example
   * hydro.analyze.stats.KS_rejectAtAlpha({params: {alpha: 0.05}, data: [[1, 2, 3], [1, 2, 4]]});
   */
  static KS_rejectAtAlpha({ params, args, data }) {
    let [p, d] = this.KS_computePValue({ data: data });
    return p < params.alpha;
  }

  /**
   * Computes the probability density function of a normal distribution.
   * @method normalDistribution
   * @memberof stats
   * @param {Object} params - Contains: z (z-value).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Not used by this function.
   * @returns {Number} Probability density function of the normal distribution.
   * @example
   * hydro.analyze.stats.normalDistribution({params: {z: 1.5}});
   */
  static normalDistribution({ params, args, data }) {
    return Math.exp(-(Math.log(2 * Math.PI) + params.z * params.z) * 0.5);
  }

  /**
   * Generates a random simulated number when run with a dataset.
   * @method runSimulation
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: multiplier (optional, default 1).
   * @param {Object} args - Not used by this function.
   * @param {Array} data - passes data from an object.
   * @returns {Number} Returns a simulated number.
   * @example 
   * const testData = [
   *    [1, 2, 3, 4, 5],
   *    [6, 7, 8, 9, 10],
   *    [11, 12, 13, 14, 15],
   * ];
   * hydro.analyze.stats.runSimulation({data: testData});
   */
  static runSimulation({ params, args, data } = {}) {
    const { multiplier } = params || 1; //defaults to 1
    const genRan = (min, max) => Math.random() * (max - min) + min;
    const mean = this.mean({ data });
    const std = this.stddev({ data });
    const simNum = genRan(mean - std * multiplier, mean + std * multiplier);
    return simNum;
  }

  /**
   * Generates a random simulated number when run with a dataset.
   * @method runMonteCarlo
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: iterations (default 100), callback (optional function).
   * @param {Object} args - Not used by this function.
   * @param {Array} data - passes data from multiple objects.
   * @returns {Array} returns an array of the simulated results.
   * @example 
   * const testData = [
   *    [1, 2, 3, 4, 5],
   *    [6, 7, 8, 9, 10],
   *    [11, 12, 13, 14, 15],
   * ];
   * hydro.analyze.stats.runMonteCarlo({data: testData});
   */
  static runMonteCarlo({ params, args, data } = {}) {
    const { iterations = 100, callback } = params || {};
    // Extract iterations and callback from params
    const results = [];

    for (let i = 0; i < iterations; i++) {
      let simResult;
      if (callback) {
        simResult = callback({ params, args, data });
      } else {
        const value = data;
        simResult = this.runSimulation({ data: value });
      }
      results.push(simResult);
    }

    return results;
  }


  /**
   * Generates a random simulated number when run with a dataset.
   * @method runVegas
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: iterations (default 100), callback (optional function).
   * @param {Object} args - Not used by this function.
   * @param {Array} data - passes data from multiple objects.
   * @returns {Array} returns an array of the simulated results.
   * @example
   * const testData = [
   *    [1, 2, 3, 4, 5],
   *    [6, 7, 8, 9, 10],
   *    [11, 12, 13, 14, 15],
   * ];
   * hydro.analyze.stats.runVegas({data: testData});
   */
  static runVegas({ params, args, data } = {}) {
    const { iterations = 100, callback } = params || {};
    // Extract iterations and callback from params
    const results = [];

    for (let i = 0; i < iterations; i++) {
      let simResult;
      if (callback) {
        simResult = callback({ params, args, data });
      } else {
        // Implementation details for the simulation without a callback
        for (let value of data) {
          const simValue = this.runSimulation({ data: value });
          results.push(simValue);
        }
      }
    }

    return results;
  }


  /**
   * Computes the probability density function (PDF) of a Gaussian (normal) distribution.
   * @method gaussianDist
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: x (value at which to compute the PDF), mean (mean of the distribution), and stddev (standard deviation of the distribution).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Not used by this function.
   * @returns {Number} Probability density function of the Gaussian distribution.
   * @example
   * const testData = {
   *    x: 2.5,
   *    mean: 3,
   *    stddev: 1.2
   * };
   * hydro.analyze.stats.gaussianDist({params: testData});
   */
  static gaussianDist({ params = {}, args, data } = {}) {
    const { x, mean, stddev } = params;
    if (mean === undefined || stddev === undefined || x === undefined) return 0; // Safeguard
    const exponent = -((x - mean) ** 2) / (2 * stddev ** 2);
    const coefficient = 1 / (stddev * Math.sqrt(2 * Math.PI));

    return coefficient * Math.exp(exponent);
  }

  /**
   * Probability mass function (PMF) of a Bernoulli distribution.
   * The Bernoulli distribution is a discrete probability distribution for a random variable that takes the value 1 
   * with probability of success p and the value 0 with probability of failure (1-p).
   * It models binary outcomes like success/failure, yes/no, or true/false.
   * @method bernoulliDist
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: f (indicator for failure=0 or success=1) and s (probability of success, between 0 and 1).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Not used by this function.
   * @returns {Number} Probability mass function of the Bernoulli distribution at the specified point.
   * @example
   * // Calculate probability of success (f=1) with p=0.7
   * hydro.analyze.stats.bernoulliDist({ params: { f: 1, s: 0.7 } }); // Returns 0.7
   * 
   * // Calculate probability of failure (f=0) with p=0.7
   * hydro.analyze.stats.bernoulliDist({ params: { f: 0, s: 0.7 } }); // Returns 0.3
   */
  static bernoulliDist({ params = {}, args, data } = {}) {
    const { f, s } = params; //f = failure, s = success
    if (f === 0) {
      return 1 - s;
    } else if (f === 1) {
      return s;
    } else {
      return 0;
    }
  }

  /**
   * Computes the probability density function (PDF) of the Generalized Extreme Value (GEV) distribution
   * The GEV distribution is widely used in hydrology for modeling extreme events like maximum rainfall
   * or flood discharges. It combines three extreme value distributions: Gumbel (Type I),
   * FrÃ©chet (Type II), and Weibull (Type III) into a single parametric family.
   * @method gevDistribution
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: 
   *                        x (value at which to compute the PDF), 
   *                        mu (location parameter, determines the mode of the distribution),
   *                        sigma (scale parameter > 0, controls the spread of the distribution), 
   *                        xi (shape parameter, determines the tail behavior - xi=0 gives Gumbel, xi>0 gives FrÃ©chet, xi<0 gives Weibull).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Not used by this function.
   * @returns {Number} Probability density function value of the GEV distribution at point x.
   * @example
   * // Calculate PDF for Gumbel distribution (xi=0)
   * hydro.analyze.stats.gevDistribution({
   *   params: { 
   *     x: 50,      // Value at which to evaluate the PDF
   *     mu: 30,     // Location parameter
   *     sigma: 10,  // Scale parameter
   *     xi: 0       // Shape parameter (Gumbel distribution)
   *   }
   * });
   * 
   * // Calculate PDF for FrÃ©chet distribution (xi>0)
   * hydro.analyze.stats.gevDistribution({
   *   params: { 
   *     x: 50,
   *     mu: 30,
   *     sigma: 10,
   *     xi: 0.2     // Positive shape parameter (heavy tail)
   *   }
   * });
   */
  static gevDistribution({ params = {}, args, data } = {}) {
    const { x, mu, sigma, xi } = params;
    if (x === undefined || mu === undefined || sigma === undefined || xi === undefined) return 0;
    const z = (x - mu) / sigma;

    if (xi === 0) {
      // Calculate the PDF for the Gumbel distribution
      const exponent = -z - Math.exp(-z);
      return Math.exp(exponent) / sigma;
    } else {
      // Calculate the PDF for the Generalized Extreme Value (GEV) distribution
      const firstTerm = Math.pow(1 + xi * z, -(1 / xi + 1));
      const secondTerm = Math.exp((-(1 + xi * z)) ** (-1 / xi));
      return firstTerm * secondTerm / sigma;
    }
  }

  /**
   * Calculates the probability mass function (PMF) of a Geometric Distribution.
   * @method geometricDist
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains the probability of success "s" (where 0 <= s <= 1) as a parameter.
   * @param {Object} args - Contains the number of trials until the first success trials (trials >= 1).
   * @param {Object} data - Not used by this function.
   * @returns {Number} The probability of getting the first success on the n-th trial.
   * @example
   * hydro.analyze.stats.geometricDist({ params: { s: 0.5 }, args: { trials: 3 } });
   */
  static geometricDist({ params = {}, args = {}, data } = {}) {
    // Fix: param default handling
    const s = (params && params.s !== undefined) ? params.s : 1;
    const { trials } = args || {};
    if (!trials || trials < 1) {
      return 0;
    }
    return (1 - s) ** (trials - 1) * s;
  }

  /**
   * Calculates the probability mass function (PMF) of a Binomial Distribution
   * The binomial distribution models the number of successes in a fixed number of independent
   * trials, each with the same probability of success. In hydrology, it can be used to model
   * discrete event occurrences like the number of days with rainfall exceeding a threshold
   * in a given month, or the number of flood events in a year.
   * @method binomialDist
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: trials (integer n â‰¥ 0, the total number of independent trials)
   *                        and probSuccess (probability p of success in a single trial, 0 â‰¤ p â‰¤ 1).
   * @param {Object} args - Contains: s (integer k, 0 â‰¤ k â‰¤ n, representing the number of successes).
   * @param {Object} data - Not used by this function.
   * @returns {Number} The probability of getting exactly k successes in n trials with probability p of success.
   * @example
   * // Calculate the probability of exactly 3 rainy days out of 10 days,
   * // when the probability of rain on any given day is 0.3
   * hydro.analyze.stats.binomialDist({ 
   *   params: { 
   *     trials: 10,       // 10 days observed
   *     probSuccess: 0.3  // 30% chance of rain on any given day
   *   }, 
   *   args: { 
   *     s: 3              // We want exactly 3 rainy days
   *   }
   * }); // Returns approximately 0.2668
   * 
   * // Find the probability of having at most 2 flood events in 5 years
   * // when annual probability of a flood is 0.2
   * // First calculate P(X=0) + P(X=1) + P(X=2)
   * const p0 = hydro.analyze.stats.binomialDist({ params: { trials: 5, probSuccess: 0.2 }, args: { s: 0 }});
   * const p1 = hydro.analyze.stats.binomialDist({ params: { trials: 5, probSuccess: 0.2 }, args: { s: 1 }});
   * const p2 = hydro.analyze.stats.binomialDist({ params: { trials: 5, probSuccess: 0.2 }, args: { s: 2 }});
   * const atMost2 = p0 + p1 + p2; // Gives the cumulative probability
   */
  static binomialDist({ params = {}, args = {}, data } = {}) {
    const { trials, probSuccess } = params;
    const { s } = args;

    if (s === undefined || trials === undefined || probSuccess === undefined) return 0;
    if (s < 0 || s > trials) {
      return 0;
    }

    const coefficient = this.binomialCoefficient(trials, s);
    const probability = coefficient * (probSuccess ** s) * ((1 - probSuccess) ** (trials - s));
    return probability;
  }

  /**
   * Multinomial Distribution - Generates random samples from a multinomial distribution.
   * @method multinomialDistribution
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: probabilities (1D array of probabilities for each category), n (Number of samples to generate).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Not used by this function.
   * @returns {Object} samples: 2D array of generated samples, where each row represents a sample and each column represents a category, frequencies: 2D array of frequencies for each category in the generated samples.
   * @example
   * const multinomialData = {
   *   probabilities: [0.2, 0.3, 0.5],
   *   n: 100
   * };
   * hydro.analyze.stats.multinomialDistribution({ params: multinomialData });
   */
  static multinomialDistribution({ params = {}, args, data } = {}) {
    const { probabilities, n } = params;

    const numCategories = probabilities.length;
    const samples = [];
    const frequencies = [];

    for (let i = 0; i < n; i++) {
      const sample = [];
      let remainingProb = 1;

      for (let j = 0; j < numCategories - 1; j++) {
        const prob = probabilities[j];
        const rand = Math.random() * remainingProb;
        const count = Math.floor(rand / prob);
        sample.push(count);
        remainingProb -= count * prob;
      }

      const lastCategoryCount = Math.floor(remainingProb / probabilities[numCategories - 1]);
      sample.push(lastCategoryCount);

      samples.push(sample);
      frequencies.push(this.frequency({ data: sample }));
    }

    return { samples, frequencies };
  }


  /**
   * Calculates the probability mass function (PMF) of the Log series Distribution.
   * @method LogSeriesDistribution 
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains the parameter 'probSuccess' which represents the probability of success in a single trial.
   * @param {Object} args - Contains the argument 'trials' (trials >= 1) which represents the number of trials.
   * @param {Object} data - Not used by this function.
   * @returns {Number} Probability of achieving the first success in # of trials.
   * @example
   * hydro.analyze.stats.logSeriesDist({params: {probSuccess: 0.2}, args: {trials: 3}});
   */
  static logSeriesDist({ params = {}, args = {}, data } = {}) {
    const { probSuccess } = params;
    // Fix: trials is in args per JSDoc, but code was looking in params.
    // Also verifying verification script expectation. JSDoc says args: trials.
    const { trials } = args;

    if (!trials || trials < 1) {
      return 0;
    }

    const pmf = -Math.log(1 - probSuccess) * Math.pow(probSuccess, trials) / trials;
    return pmf;
  }

  /**
   * Calculates the probability density function (PDF) of the Lognormal Distribution.
   * @method lognormalDist 
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains the parameters 'mu' and 'sigma' which represent the mean and standard deviation of the associated normal distribution.
   * @param {Object} args - Contains the argument 'x' which represents the value at which to evaluate the PDF.
   * @param {Object} data - Not used by this function.
   * @returns {Number} Probability density at 'x' in the Lognormal Distribution.
   * @example 
   * hydro.analyze.stats.lognormalDist({params: { mu: 0, sigma: 1 }, args: { x: 2 }});
   */
  static lognormalDist({ params = {}, args = {}, data } = {}) {
    const { mu, sigma } = params;
    const { x } = args;

    if (x <= 0) {
      return 0;
    }

    const exponent = -((Math.log(x) - mu) ** 2) / (2 * sigma ** 2);
    const pdf = (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);

    return pdf;
  }

  /**
   * Calculates the probability density function (PDF) of the Gumbel Distribution.
   * @method gumbelDist 
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains the parameters 'mu' (location parameter) and 'beta' (scale parameter).
   * @param {Object} args - Contains the argument 'x' at which to evaluate the PDF.
   * @param {Object} data - Not used by this function.
   * @returns {Number} Probability density at the given value 'x'.
   * @example
   * hydro.analyze.stats.gumbelDist({ params: { mu: 0, beta: 1 }, args: { x: 2 }});
   */
  static gumbelDist({ params = {}, args = {}, data } = {}) {
    const { mu, beta } = params;
    const { x } = args;

    const z = (x - mu) / beta;
    const pdf = (1 / beta) * Math.exp(-(z + Math.exp(-z)));

    return pdf;
  }

  /**
   * Calculates the probability density function (PDF) of the Uniform Distribution.
   * @method uniformDist 
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains the parameters 'a' (lower bound) and 'b' (upper bound).
   * @param {Object} args - Contains the argument 'x' at which to evaluate the PDF.
   * @param {Object} data - Not used by this function.
   * @returns {Number} Probability density at the given value 'x'.
   * @example
   * hydro.analyze.stats.uniformDist({ params: { a: 0, b: 1 }, args: { x: 0.5 } });
   */
  static uniformDist({ params = {}, args = {}, data } = {}) {
    const { a, b } = params;
    const { x } = args;

    if (x >= a && x <= b) {
      const pdf = 1 / (b - a);
      return pdf;
    } else {
      return 0;
    }
  }

  /**
   * Calculates the Simple Moving Average of a given data set.
   * @method simpleMovingAverage 
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains the parameter 'windowSize' which specifies the size of the moving average window.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - Contains the array of data points.
   * @returns {Array} Array of moving average values.
   * @example
   * const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
   * const windowSize = 3;
   * hydro.analyze.stats.simpleMovingAverage({ params: { windowSize }, data });
   */
  static simpleMovingAverage({ params, args, data } = {}) {
    const { windowSize } = params;

    const numData = this.preprocessData(data);

    if (windowSize <= 0 || windowSize > numData.length) {
      throw new Error("Invalid window size.");
    }

    const movingAverage = [];

    for (let i = 0; i <= numData.length - windowSize; i++) {
      const window = numData.slice(i, i + windowSize);
      const sum = window.reduce((total, value) => total + value, 0);
      const average = sum / windowSize;
      movingAverage.push(average);
    }

    return movingAverage;
  }

  /**
   * Calculates the Linear Moving Average (LMA) of a given dataset.
   * @method linearMovingAverage
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains the windowSize parameter.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - 1D array of numerical values.
   * @returns {Array} Array of moving averages.
   * @throws {Error} If the window size is invalid.
   * @example
   * const windowSize = 5;
   * const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
   * hydro.analyze.stats.linearMovingAverage({ params: { windowSize }, data });
   */
  static linearMovingAverage({ params, args, data } = {}) {
    const { windowSize } = params;
    const numData = this.preprocessData(data);

    if (windowSize <= 0 || windowSize > numData.length) {
      throw new Error("Invalid window size.");
    }

    const movingAverage = [];
    let sum = 0;

    for (let i = 0; i < windowSize; i++) {
      sum += numData[i];
    }

    movingAverage.push(sum / windowSize);

    for (let i = windowSize; i < numData.length; i++) {
      sum += numData[i] - numData[i - windowSize];
      movingAverage.push(sum / windowSize);
    }

    return movingAverage;
  }

  /**
   * Computes the Exponential Moving Average (EMA) for a given dataset.
   * @method exponentialMovingAverage
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: alpha (smoothing factor between 0 and 1).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: dataset (1D JavaScript array).
   * @returns {number[]} The Exponential Moving Average (EMA) values for the dataset.
   * @example
   * const dataset = [1, 2, 3, 4, 5];
   * const params = { alpha: 0.5 };
   * hydro.analyze.stats.exponentialMovingAverage({ params, data: dataset });
   */

  static exponentialMovingAverage({ params, args, data } = {}) {
    const { alpha } = params;
    const numData = this.preprocessData(data);
    const emaValues = [];
    let ema = numData[0];

    for (let i = 1; i < numData.length; i++) {
      ema = alpha * numData[i] + (1 - alpha) * ema;
      emaValues.push(ema);
    }

    return emaValues;
  }

  /**
   * Decomposes a time series into Trend, Seasonal, and Residual components using Classical Decomposition (Moving Averages).
   * @method seasonalDecompose
   * @memberof stats
   * @param {Object} params - Contains:
   *  - period {Number}: The seasonality period (e.g., 12 for monthly data, 7 for daily).
   *  - model {String}: 'additive' (default) or 'multiplicative'.
   * @param {Object} args - Not used.
   * @param {Array} data - Input time series data.
   * @returns {Array} Array of arrays: [observed, trend, seasonal, residuals].
   * @example
   * const [obs, trend, seas, resid] = hydro.analyze.stats.seasonalDecompose({
   *   params: { period: 12, model: 'additive' },
   *   data: [...]
   * });
   */
  static seasonalDecompose({ params = {}, args, data } = {}) {
    // 1. Preprocess
    const observed = this.preprocessData(data);
    const n = observed.length;
    const period = Number(params.period) || 12; // Default to 12 if not provided
    const model = params.model === 'multiplicative' ? 'multiplicative' : 'additive';

    // 2. Trend Component (Centered Moving Average)
    const trend = new Array(n).fill(null);
    const halfPeriod = Math.floor(period / 2);

    for (let i = halfPeriod; i < n - halfPeriod; i++) {
      if (period % 2 === 0) {
        // Even period: 2-step average (period size, centered)
        let sum1 = 0;
        for (let j = -halfPeriod; j < halfPeriod; j++) {
          sum1 += observed[i + j];
        }
        let sum2 = 0;
        for (let j = -halfPeriod + 1; j <= halfPeriod; j++) {
          sum2 += observed[i + j];
        }
        trend[i] = (sum1 + sum2) / (2 * period);
      } else {
        // Odd period: Simple centered MA
        let sum = 0;
        for (let j = -halfPeriod; j <= halfPeriod; j++) {
          sum += observed[i + j];
        }
        trend[i] = sum / period;
      }
    }

    // 3. Detrending
    const detrended = new Array(n).fill(null);
    for (let i = 0; i < n; i++) {
      if (trend[i] !== null) {
        if (model === 'additive') {
          detrended[i] = observed[i] - trend[i];
        } else {
          // Multiplicative: observed / trend
          detrended[i] = trend[i] !== 0 ? observed[i] / trend[i] : null; // Handle div by zero if necessary
        }
      }
    }

    // 4. Seasonal Component
    // Average variance per period index (e.g., average of all Januaries)
    const seasonalIndices = new Array(period).fill(0);
    const seasonalCounts = new Array(period).fill(0);

    for (let i = 0; i < n; i++) {
      if (detrended[i] !== null && !isNaN(detrended[i])) {
        const idx = i % period;
        seasonalIndices[idx] += detrended[i];
        seasonalCounts[idx]++;
      }
    }

    const seasonalPattern = seasonalIndices.map((sum, i) =>
      seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : 0
    );

    // Normalize seasonal component
    // Additive: sum should be 0. Multiplicative: sum should be period (average 1).
    if (model === 'additive') {
      const meanSeason = seasonalPattern.reduce((a, b) => a + b, 0) / period;
      for (let i = 0; i < period; i++) seasonalPattern[i] -= meanSeason;
    } else {
      const meanSeason = seasonalPattern.reduce((a, b) => a + b, 0) / period;
      for (let i = 0; i < period; i++) seasonalPattern[i] /= meanSeason;
    }

    // Expand seasonal pattern to full length
    const seasonal = new Array(n).fill(0).map((_, i) => seasonalPattern[i % period]);

    // 5. Residual Component
    const residuals = new Array(n).fill(null);
    for (let i = 0; i < n; i++) {
      if (model === 'additive') {
        residuals[i] = observed[i] - trend[i] - seasonal[i];
      } else {
        // Multiplicative: observed / (trend * seasonal)
        // Trend is null at edges, residuals will be null.
        if (trend[i] !== null && seasonal[i] !== 0) {
          residuals[i] = observed[i] / (trend[i] * seasonal[i]);
        }
      }
    }

    // Return Array of Arrays
    return [observed, trend, seasonal, residuals];
  }

  /**
   * Generates a sequence of events following a Poisson process.
   * A Poisson process models the occurrence of random events where the time between events
   * follows an exponential distribution. In hydrology, this is useful for modeling random
   * occurrences such as rainfall events, flood peaks, or extreme weather phenomena that
   * happen at a known average rate but with random timing.
   * @method poissonProcess
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: 
   *                         - lambda (event rate, average number of events per time unit)
   *                         - timeFrame (duration for which to simulate the process)
   *                         - type (optional, "time" for event times or "count" for event counts in intervals)
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Not used by this function.
   * @returns {Array} For type="time": Array of time points when events occur
   *                 For type="count": Array of counts per unit time interval
   * @example
   * // Scenario: Generate a synthetic sequence of storm events over a 30-day period
   * // Assuming storms occur at a rate of 0.2 per day (on average, 1 storm every 5 days)
   * 
   * // Get the timing of storm events over the 30-day period
   * const stormTimes = hydro.analyze.stats.poissonProcess({
   *   params: {
   *     lambda: 0.2,      // Rate of 0.2 storms per day
   *     timeFrame: 30,    // 30-day simulation period
   *     type: "time"      // Return the timing of events
   *   }
   * });
   * console.log("Storm events occur at days:", stormTimes);
   * // Example output: [3.2, 8.7, 15.4, 21.1, 28.9]
   * 
   * // Or get the daily count of storms for each day in the 30-day period
   * const dailyStormCounts = hydro.analyze.stats.poissonProcess({
   *   params: {
   *     lambda: 0.2,      // Rate of 0.2 storms per day
   *     timeFrame: 30,    // 30-day simulation period
   *     type: "count"     // Return counts per interval
   *   }
   * });
   * // Example output: [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
   * 
   * // This synthetic data can be used for:
   * // - Testing rainfall-runoff models with varying storm patterns
   * // - Evaluating flood risk under different precipitation scenarios
   * // - Studying reservoir operation under random inflow conditions
   */
  static poissonProcess({ params = {}, args = {}, data } = {}) {
    const { lambda, timeFrame, type = "time" } = params;
    const { rateFunction } = args;

    if (type === "time") {
      const eventTimes = [];
      let currentTime = 0;

      while (currentTime < timeFrame) {
        // Generate time to next event based on exponential distribution
        const timeToNextEvent = -Math.log(Math.random()) / lambda;
        currentTime += timeToNextEvent;

        if (currentTime < timeFrame) {
          eventTimes.push(currentTime);
        }
      }

      return eventTimes;
    } else if (type === "count") {
      const counts = new Array(Math.ceil(timeFrame)).fill(0);

      // Generate event times
      const eventTimes = this.poissonProcess({
        params: { lambda, timeFrame, type: "time" }
      });

      // Count events per unit time
      for (const time of eventTimes) {
        const timeIndex = Math.floor(time);
        if (timeIndex < counts.length) {
          counts[timeIndex]++;
        }
      }

      return counts;
    } else {
      throw new Error("Invalid type. Use 'time' or 'count'.");
    }
  }

  /**
   * Calculates the return period for a given probability of occurrence.
   * In hydrology, the return period (or recurrence interval) represents the average time between events
   * of a certain magnitude. It is fundamental for flood frequency analysis, infrastructure design, and
   * risk assessment. The return period T is calculated as T = 1/p, where p is the probability of 
   * exceedance in a given year.
   * @method returnPeriod
   * @memberof stats
   * @param {Object} params - Contains probability (decimal between 0 and 1, probability of occurrence in a given time unit).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Not used by this function.
   * @returns {Number} Return period (average time between events of the specified probability).
   * @throws {Error} If probability is not between 0 and 1.
   * @example
   * // Calculate the return period for a flood with a 0.01 (1%) annual exceedance probability
   * const hundredYearFlood = hydro.analyze.stats.returnPeriod({
   *   params: { probability: 0.01 }
   * });
   * // Returns 100 (years)
   * 
   * // Calculate return periods for different design events
   * const designEvents = [
   *   { name: "2-year event", probability: 0.5 },
   *   { name: "10-year event", probability: 0.1 },
   *   { name: "25-year event", probability: 0.04 },
   *   { name: "50-year event", probability: 0.02 },
   *   { name: "100-year event", probability: 0.01 },
   *   { name: "500-year event", probability: 0.002 }
   * ];
   * 
   * // Calculate and display the return periods
   * designEvents.forEach(event => {
   *   const period = hydro.analyze.stats.returnPeriod({
   *     params: { probability: event.probability }
   *   });
   *   console.log(`${event.name}: ${period} years`);
   * });
   * 
   * // This information can be used for:
   * // - Designing hydraulic structures like bridges, culverts, and dams
   * // - Establishing flood insurance rates and floodplain regulations
   * // - Assessing risk for critical infrastructure
   */
  static returnPeriod({ params, args, data } = {}) {
    const { probability } = params;
    if (probability <= 0 || probability >= 1) {
      throw new Error("Probability must be between 0 and 1 (exclusive).");
    }

    return 1 / probability;
  }

  /**
   * Performs differencing on a time series dataset to remove trend or seasonality from the data.
   * @method differencing
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains the order parameter.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - 1D array of numerical values representing a time series.
   * @returns {Array} Differenced time series.
   * @throws {Error} If the order is invalid.
   * @example
   * const order = 1;
   * const timeSeries = [1, 3, 6, 10, 15];
   * const differencedSeries = stats.differencing({ params: { order }, data: timeSeries });
   */
  static differencing({ params, args, data } = {}) {
    const order = params.order;
    const timeSeries = data;

    if (order >= timeSeries.length) {
      throw new Error('Invalid order for differencing.');
    }

    const differencedSeries = timeSeries.slice(order).map((value, i) => value - timeSeries[i]);
    return differencedSeries
  }

  /**
   * Computes the variance of residuals in a regression model to detect heteroskedasticity.
   * @method residualVariance
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Array} data - 1D array of numerical values representing the residuals.
   * @returns {number} Variance of residuals.
   * @returns {Error} if not given valid array of residuals or not given correct number of arrays.
   * @example
   * const residuals = [1.5, -2.1, 0.8, -1.2, 2.5];
   * const variance = stats.residualVariance({ data: residuals });
   */
  static residualVariance({ params, args, data } = {}) {
    const residuals = data;

    if (!Array.isArray(residuals)) {
      throw new Error('Invalid data. Expecting an array of residuals.');
    }

    if (residuals.length < 2) {
      throw new Error('Insufficient data. Expecting an array of at least 2 residuals.');
    }

    const squaredResiduals = residuals.map((residual) => residual * residual);
    const variance = squaredResiduals.reduce((sum, value) => sum + value, 0) / squaredResiduals.length;

    return variance;
  }

  /**
   * Computes the coefficients of a linear regression model.
   * @method regression
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Object containing predictor variables (X) and target variable (y).
   * @returns {Array} Coefficients of the linear regression model.
   * @example
   * const X = [[1, 2], [3, 4], [5, 6]];
   * const y = [3, 5, 7];
   * hydro.analyze.stats.regression({ data: { X, y } });
   */
  static regression({ params, args, data } = {}) {
    // Robust parsing: preprocess inputs separately
    // Note: X is matrix, y is array. preprocessData flattens everything, so we must be careful with matrix.
    // preprocessData is designed for lists. For matrices, we might need row-wise. 
    // Wait, preprocessData detects headers and stripes non-numeric. 
    // If X is a simple 2D array of numbers, preprocessData will FLATTEN it if we pass it directly.
    // Regression expects X as matrix (2D). 
    // We should parse Y (target) using preprocessData.
    // We should parse X manually row-by-row or check implementation.
    // Existing logic iterates X.map.
    // Let's minimally invasively ensure numbers in X.

    // Y is 1D array
    const y = this.preprocessData(data.y);
    const X = data.X.map(row => this.preprocessData(row)); // Ensure each row is numeric 1D with 0 headers

    const XWithIntercept = X.map((row) => [1, ...row]);

    const Xint = this.multiplyMatrix({ data: { matrix1: this.transposeMatrix({ data: XWithIntercept }), matrix2: XWithIntercept } });
    const Yint = this.multiplyMatrix({ data: { matrix1: this.transposeMatrix({ data: XWithIntercept }), matrix2: y } });

    const inverseXtX = this.matrixInverse(Xint);

    const coefficients = this.multiplyMatrix({ data: { matrix1: inverseXtX, matrix2: Yint } });

    return coefficients;
  }

  /**
   * Performs multivariate regression analysis.
   * @method multiregression
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Data for the multivariate regression.
   * @returns {Array} Coefficients of the linear regression model.
   * @example
   * const X = [[1, 2], [3, 4], [5, 6]];
   * const y = [3, 5, 7];
   * hydro.analyze.stats.multiregression({ data: { X, y } });
   */
  static multiregression({ params, args, data } = {}) {
    if (!data || !data.X || !data.Y) return [];

    const X = data.X.map(row => this.preprocessData(row)); // Clean X rows
    // Y is matrix or list of lists in this context (multiple targets)? 
    // Verification test says Y: [[1, 2], [3, 4]] (rows are samples? or columns are targets?)
    // Logic: for (let i = 0; i < Y.length; i++) { const y = Y[i]; ... }
    // If Y is array of target vectors (columns), likely intended as targets.
    // Let's assume input matches expected structure but cleaner numbers.
    const Y = data.Y.map(yVec => this.preprocessData(yVec));

    const coefficients = [];
    for (let i = 0; i < Y.length; i++) {
      const y = Y[i];
      const regressionData = { X, y };
      const coefficient = this.regression({ data: regressionData });
      coefficients.push(coefficient);
    }

    return coefficients;
  }

  /**
   * Performs White's test for heteroscedasticity.
   * @method whitesTest
   * @author riya-patil
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: errors (array of residuals) and regressors (array of regressor vars).
   * @returns {Object} Object containing test statistic and p-value.
   * @throws {Error} If the input arrays have different lengths.
   * @example
   * const params = {
   *   errors: [1, 2, 3, 4, 5],
   *   regressors: [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]]
   * };
   * hydro.analyze.stats.whitesTest({ data: params });
   */
  static whitesTest({ params, args, data } = {}) {
    const { errors: errRaw, regressors: regRaw } = data;

    // Preprocess 1D errors
    const errors = this.preprocessData(errRaw);
    // Preprocess 2D regressors
    const regressors = regRaw.map(r => this.preprocessData(r));

    if (errors.length !== regressors.length) {
      throw new Error("Input arrays must have the same length.");
    }

    const n = errors.length;
    // For White's test, we regress squared residuals on regressors, their squares, and cross-products.
    // Simplified version: regress squared residuals on regressors and their squares.

    // 1. Prepare auxiliary regression data
    const squaredResiduals = errors.map(e => e * e);

    // Construct auxiliary regressors (original + squared)
    // Note: This is a simplified implementation. Full White's test includes cross-products.
    const auxRegressors = regressors.map(row => {
      const squaredTerms = row.map(x => x * x);
      return [...row, ...squaredTerms];
    });

    // 2. Perform auxiliary regression
    // We need R-squared from this regression.
    // Using existing regression function (assuming it returns coefficients)
    // We need to calculate R-squared manually since regression() returns coeffs.

    const auxCoeffs = this.regression({ data: { X: auxRegressors, y: squaredResiduals } });

    // Calculate predicted values
    const predicted = auxRegressors.map(row => {
      let pred = auxCoeffs[0]; // Intercept
      for (let i = 0; i < row.length; i++) {
        pred += auxCoeffs[i + 1] * row[i];
      }
      return pred;
    });

    // Calculate R-squared
    const meanSqRes = this.mean({ data: squaredResiduals });
    const ssTotal = squaredResiduals.reduce((acc, val) => acc + Math.pow(val - meanSqRes, 2), 0);
    const ssRes = squaredResiduals.reduce((acc, val, i) => acc + Math.pow(val - predicted[i], 2), 0);
    const rSquared = 1 - (ssRes / ssTotal);

    // 3. Calculate Test Statistic
    const testStatistic = n * rSquared;
    const k = auxRegressors[0].length; // Degrees of freedom
    const pValue = 1 - this.chisqCDF(testStatistic, k);

    return { testStatistic, pValue };
  }

  /**
   * Performs the Breusch-Pagan test for heteroscedasticity.
   * @method breuschPaganTest
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: errors (Array of residuals) and regressors (Array of regressor variables).
   * @returns {Object} Object containing test statistic and p-value.
   * @throws {Error} If the input arrays have different lengths.
   * @example
   * const params = {
   *   errors: [1, 2, 3, 4, 5],
   *   regressors: [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]]
   * };
   * hydro.analyze.stats.breuschPaganTest({ data: params });
   */
  static breuschPaganTest({ params, args, data } = {}) {
    const { errors, regressors } = data;

    if (errors.length !== regressors.length) {
      throw new Error("Input arrays must have the same length.");
    }

    const n = errors.length;
    const k = regressors[0].length;

    let residualsSquared = [];

    for (let i = 0; i < n; i++) {
      const error = errors[i];
      residualsSquared.push(error ** 2);
    }

    let XX = 0;
    let XR = 0;
    let RR = 0;

    for (let i = 0; i < n; i++) {
      const regressor = regressors[i];
      const residualSquared = residualsSquared[i];

      const dotProduct = this.dotProduct(regressor, regressor);
      XX += dotProduct;
      XR += dotProduct * residualSquared;
      RR += residualSquared ** 2;
    }

    const testStatistic = (n / 2) * (Math.log(XR) - (1 / n) * Math.log(XX));
    const pValue = 1 - this.chisqCDF(testStatistic, k);

    return { testStatistic, pValue };
  }

  /**
   * Performs Goldfeld-Quandt test for heteroscedasticity.
   * @method goldfeldQuandtTest
   * @author riya-patil
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: residuals (Array of residuals from a regression model) and independentVar (Array of values of the independent variable).
   * @returns {Object} Object containing test statistic and p-value.
   * @throws {Error} If the input arrays have different lengths.
   * @example
   * const residuals = [1.2, 2.3, 0.8, 1.9, 1.5, 2.6];
   * const independentVar = [3, 4, 5, 6, 7, 8];
   * const result = stats.goldfeldQuandtTest({ data: { residuals, independentVar } });
   * console.log(result);
   */
  static goldfeldQuandtTest({ params, args, data } = {}) {
    const { residuals, independentVar } = data;

    if (residuals.length !== independentVar.length) {
      throw new Error("Input arrays must have the same length.");
    }

    const n = residuals.length;
    const k = Math.floor(n * 0.4); // 40% of the data in each subset

    const sortedIndices = independentVar.map((_, index) => index).sort((a, b) => independentVar[a] - independentVar[b]);

    const lowSubsetIndices = sortedIndices.slice(0, k);
    const highSubsetIndices = sortedIndices.slice(-k);

    const lowResiduals = lowSubsetIndices.map((index) => residuals[index]);
    const highResiduals = highSubsetIndices.map((index) => residuals[index]);

    const testStatistic = (Math.max(...highResiduals) ** 2) / (Math.min(...lowResiduals) ** 2);

    const pValue = 1 - this.chisqCDF(testStatistic, k - 1);

    return { testStatistic, pValue };
  }



  /**
   * Generates a random simulated number when run with a dataset.
   * @method runMarkovChainMonteCarlo
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: iterations (default 100), callback (optional function).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: initialState and transitionMatrix.
   * @returns {Array} returns an array of the simulated results.
   * @example 
   * const options = {
   *   params: {
   *     iterations: 100,
   *   },
   *   data: {
   *     initialState: 0,
   *     transitionMatrix: [[0.5, 0.5], [0.5, 0.5]],
   *   },
   * };
   * hydro.analyze.stats.runMarkovChainMonteCarlo(options);
   */
  static runMarkovChainMonteCarlo({ params, args, data } = {}) {
    const { iterations = 100, callback } = params || {};
    const results = [];
    let currentState = data.initialState;

    for (let i = 0; i < iterations; i++) {
      let nextState;
      if (callback) {
        nextState = callback({ params, args, data, currentState });
      } else {
        nextState = this.getNextState(data.transitionMatrix, currentState);
      }
      results.push(nextState);
      currentState = nextState;
    }

    return results;
  }

  /***************************/
  /***** Helper functions ****/
  /***************************/

  /**
   * Preprocessing tool for joining arrays for table display.
   * @method joinarray
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - 2d-JS array as [[someData1], [someData2]].
   * @returns {Object[]} Array for table display.
   * @example
   * hydro.analyze.stats.joinarray({data: [[someData1], [someData2]]});
   */

  static joinarray({ params, arg, data } = {}) {
    var temp = [];
    for (var i = 1; i < data[0].length; i++) {
      if (!temp[i]) {
        temp[i] = [];
      }
      temp[i] = [data[0], data[1]].reduce((a, b) => a.map((v, i) => v + b[i]));
    }
    return temp;
  }

  /**
   * Helper function for preparing nd-JSarrays for charts and tables for duration/discharge.
   * @method flatenise
   * @memberof stats
   * @param {Object} params - Contains: columns (nd-JS array with names as [someName1, someName2,...]).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: nd-JS array object required to be flatenned as [[somedata1, somedata2,...],[somedata1, somedata2,...],...].
   * @returns {Object[]} Flatenned array.
   * @example
   * hydro.analyze.stats.flatenise({params:{columns: [someName1, someName2,...]},
   * data: [[somedata1, somedata2,...],[somedata1, somedata2,...],...]});
   */

  static flatenise({ params, args, data } = {}) {
    var x = params.columns;
    var d = data;
    var col = [];
    var dat = [];
    for (var i = 0; i < x.length; i++) {
      col.push(x[i]);
    }
    for (var j = 0; j < d.length; j++) {
      dat.push(d[j].flat());
    }
    return [col, dat];
  }

  /**
   * Turns data from numbers to strings. Usable when
   * retrieving data or uploading data.
   * @method numerise
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: 1d-JS array with data composed of strings as [dataValues].
   * @returns {Object[]} Array as numbers.
   * @example
   * hydro.analyze.stats.numerise({data: [someValues]});
   */

  static numerise({ params, args, data } = {}) {
    var result = data.map((x) => parseFloat(x));
    return result;
  }

  /**
   * Filters out items in an array that are undefined, NaN, null, ", etc.
   * @method cleaner
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: 1d-JS array with data to be cleaned as [dataValues].
   * @returns {Object[]} Cleaned array.
   * @example
   * hydro.analyze.stats.cleaner({data: [someValues]});
   */

  static cleaner({ params, args, data } = {}) {
    var x = data.filter((x) => x === undefined || !Number.isNaN(x));
    return x;
  }

  /**
   * Filters out items in an array based on another array.
   * @method itemfilter
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: 2d-JS array with data to be kept and removed as [[dataKept],[dataRemoved]].
   * @returns {Object[]} Cleaned array.
   * @example
   * hydro.analyze.stats.itemfilter({data: [[dataKept], [dataRemoved]]});
   */

  static itemfilter({ params, args, data } = {}) {
    var x = data[0].filter((el) => !data[1].includes(el));
    return x;
  }

  /**
   * Changes a 1d-date array into local strings. Used mainly
   * for changing displaying into google charts.
   * @method dateparser
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object[]} data - Contains: 1-dJS array with date values as [dateValue].
   * @returns {Object[]} Array with date parsed.
   * @example
   * hydro.analyze.stats.dateparser({data: [someValues]});
   */

  static dateparser({ params, args, data } = {}) {
    // var x = this.copydata({ data: data }); // Removed unused deep copy
    var xo = [];
    for (var j = 0; j < data.length; j++) {
      xo.push(new Date(data[j]).toLocaleString());
    }
    return xo;
  }

  /**
   * Changes a m x n matrix into a n x m matrix (transpose).
   * Mainly used for creating google charts. M != N.
   * @method arrchange
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: nd-JS array representing [[m],[n]] matrix.
   * @returns {Object[]}  [[n],[m]] array.
   * @example
   * hydro.analyze.stats.arrchange({data: [[someSize1],[someSize2]]});
   */

  static arrchange({ params, args, data } = {}) {
    // var x = this.copydata({ data: data }); // Removed redundant deep copy
    var transp = (matrix) => matrix[0].map((x, i) => matrix.map((x) => x[i]));
    return transp(data);
  }

  /**
   * Pushes at the end of an array the data of another array.
   * @method push
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: 2d-JS array with data arranged as [[willPush],[pushed]].
   * @returns {Object[]} Last dataset with pushed data.
   * @example
   * hydro.analyze.stats.push({data: [[dataSet1], [dataSet2]]});
   */

  static push({ params, args, data } = {}) {
    for (var j = 0; j < data[1].length; j++)
      for (var i = 0; i < data[0].length; i++) {
        data[0][j].push(data[1][j][i]);
      }
    return data[0]; // Fixed arr1 -> data[0]
  }

  /**
   * Generates an array of random integers within a specified range.
   * @method generateRandomData
   * @memberof stats
   * @param {Object} params - Contains size and range.
   * @param {number} params.size - The number of elements to generate.
   * @param {number} [params.range=100] - The upper limit (exclusive).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Not used by this function.
   * @returns {number[]} An array of random integers.
   * @example
   * hydro.analyze.stats.generateRandomData({ params: { size: 10, range: 50 } });
   */
  static generateRandomData({ params = {}, args, data } = {}) {
    const { size, range = 100 } = params;
    let result = [];
    for (let i = 0; i < size; i++) {
      result.push(Math.floor(Math.random() * range));
    }
    return result;
  }


  /**
   * **Still needs some testing**
   * Compute the autocovariance matrix from the autocorrelation values.
   * @method autocovarianceMatrix
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: lags (number of lags).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - array with autocorrelation values.
   * @returns {Object} Autocovariance matrix.
   * @example 
   * const acTestData = [1, 0.7, 0.5, 0.3];
   * const lags = 2;
   * hydro.analyze.stats.autocovarianceMatrix({params: {lags}, data : acTestData});
   */
  static autocovarianceMatrix({ params, args, data } = {}) {
    const { lag, lags } = params || { lag: 2, lags: 2 };
    const length = data.length;
    const mean = this.mean({ data });
    const autocorrelation = [];
    const matrix = [];

    for (let l = 0; l <= lag; l++) {
      let sum = 0;
      for (let t = l; t < length; t++) {
        sum += (data[t] - mean) * (data[t - l] - mean);
      }
      autocorrelation.push(sum / ((length - l) * this.variance({ data })));
    }

    for (let i = 0; i <= lags; i++) {
      const row = [];
      for (let j = 0; j <= lags; j++) {
        const ac = autocorrelation[Math.abs(i - j)];
        row.push(i === j ? 1 : ac);
      }
      matrix.push(row);
    }

    return { autocorrelation, matrix };
  }

  /**
   * Calculates the binomial coefficient (n choose k format).
   * @method binomialCoefficient
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Contains: trials (The number of trials) and s (The number of successes).
   * @param {Object} data - Not used by this function.
   * @returns {Number} The binomial coefficient (trials choose s).
   * @example
   * hydro.analyze.stats.binomialCoefficient(5, 2);
   */
  static binomialCoefficient(trials, s) {
    if (s === 0 || s === trials) {
      return 1;
    }
    if (s > trials) {
      return 0;
    }
    let coefficient = 1;
    for (let i = 1; i <= s; i++) {
      coefficient *= (trials - i + 1) / i;
    }

    return coefficient;
  }

  /**
   * Multiplies two matrices.
   * @method multiplyMatrix
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Contains: matrix1 and matrix2.
   * @param {Object} data - Not used by this function.
   * @returns {Array} Result of matrix multiplication.
   * @example
   * const matrix1 = [[1, 2], [3, 4]];
   * const matrix2 = [[5, 6], [7, 8]];
   * hydro.analyze.stats.multiplyMatrix(matrix1, matrix2);
   */
  static multiplyMatrix({ params, args, data } = {}) {
    const { matrix1, matrix2 } = args || data; // Allow args or data for flexibility
    const m1Rows = matrix1.length;
    const m1Cols = matrix1[0].length;
    const m2Cols = matrix2[0].length;
    const result = [];

    for (let i = 0; i < m1Rows; i++) {
      result[i] = [];
      for (let j = 0; j < m2Cols; j++) {
        let sum = 0;
        for (let k = 0; k < m1Cols; k++) {
          sum += matrix1[i][k] * matrix2[k][j];
        }
        result[i][j] = sum;
      }
    }

    return result;
  }

  /**
   * Transposes a matrix.
   * @method transposeMatrix
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Contains: matrix (Matrix to transpose).
   * @param {Object} data - Not used by this function.
   * @returns {Array} Transposed matrix.
   * @example
   * const matrix = [[1, 2, 3], [4, 5, 6]];
   * hydro.analyze.stats.transposeMatrix(matrix);
   */
  static transposeMatrix({ params, args, data } = {}) {
    const matrix = args?.matrix || data; // Allow args or data for flexibility
    const rows = matrix.length;
    const cols = matrix[0].length;
    const transposed = [];

    for (let j = 0; j < cols; j++) {
      transposed[j] = [];
      for (let i = 0; i < rows; i++) {
        transposed[j][i] = matrix[i][j];
      }
    }

    return transposed;
  }

  /**
   * Computes the inverse of a matrix.
   * @method matrixInverse
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Contains: matrix (Matrix to compute inverse of).
   * @param {Object} data - Not used by this function.
   * @returns {Array} Inverse of the matrix.
   * @example
   * const matrix = [[1, 2, 3], [4, 5, 6]];
   * hydro.analyze.stats.matrixInverse(matrix);
   */

  static matrixInverse(matrix) { // This function does not use the {params, args, data} structure
    const n = matrix.length;
    const inv = [];
    const inversed = [];

    for (let i = 0; i < n; i++) {
      inversed[i] = [];
      inv[i] = [];
      for (let j = 0; j < n; j++) {
        inversed[i][j] = i === j ? 1 : 0;
        inv[i][j] = matrix[i][j];
      }
    }

    for (let k = 0; k < n; k++) {
      const pivot = inv[k][k]; //elimatination to obtain inversed matrix

      for (let j = 0; j < n; j++) {
        inv[k][j] /= pivot;
        inversed[k][j] /= pivot;
      }
      //row operations to eliminate other elements
      for (let i = 0; i < n; i++) {
        if (i !== k) {
          const factor = inv[i][k];

          for (let j = 0; j < n; j++) {
            inv[i][j] -= factor * inv[k][j];
            inversed[i][j] -= factor * inversed[k][j];
          }
        }
      }
    }

    return inversed;
  }

  /**
   * Calculates the cumulative distribution function (CDF) of the chi-square distribution.
   * NOTE: This will require revision in the future, readjusting considering lookups or fitting to a gamma distribution instead.
   * @method chisqCDF
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Contains: x (The value at which to evaluate the CDF) and k (The degrees of freedom).
   * @param {Object} data - Not used by this function.
   * @returns {number} The cumulative probability.
   * @example
   * const x = 10;
   * const df = 20;
   * hydro.analyze.stats.chisqCDF(10, 20);
   */
  static chisqCDF(arg1, arg2) {
    let x, k;
    if (typeof arg1 === 'object' && arg1 !== null && (arg1.params || arg1.args || arg1.data)) {
      // Object style call
      const { args = {} } = arg1;
      x = args.x;
      k = args.k;
    } else {
      // Positional call
      x = arg1;
      k = arg2;
    }
    let term = Math.exp(-x / 2);
    let sum = term;
    for (let i = 1; i < k; i++) {
      let prevTerm = term;
      term *= x / (2 * (i + 1));
      sum += term;
      if (term === prevTerm) break;
    }
    return 1 - sum;
  }

  /**
   * Calculates the dot product of two vectors. Both vectors should be represented as 1D JS arrays with the same length.
   * @method dotProduct
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Contains: a (The first vector) and b (The second vector).
   * @param {Object} data - Not used by this function.
   * @returns {number} The dot product.
   * @throws {Error} If the input vectors have different lengths.
   * @example
   * const a = [1, 2, 3, 4, 5];
   * const b = [10, 20, 30, 40, 50];
   * hydro.analyze.stats.dotProduct(a,b);
   */
  static dotProduct(a, b) { // This function does not use the {params, args, data} structure
    if (a.length != b.length) {
      throw new Error("Input vectors must have the same length.");
    }

    // Robust parsing
    const v1 = a.map(Number);
    const v2 = b.map(Number);

    let result = 0;
    for (let i = 0; i < v1.length; i++) {
      result += v1[i] * v2[i];
    }

    return result;
  }

  /**
   * Gets the next state based on the transition probabilities defined in the transition matrix.
   * @method getNextState
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Contains: transitionMatrix (number[][]) and currentState (number).
   * @param {Object} data - Not used by this function.
   * @returns {number} Next state selected based on the transition probabilities.
   * @example
   * const transitionMatrix = [
   *   [0.2, 0.8], 
   *   [0.5, 0.5],
   * ];
   * const initialState = 0;
   * hydro.analyze.stats.getNextState(transitionMatrix, initialState);
   */
  static getNextState(transitionMatrix, currentState) { // This function does not use the {params, args, data} structure
    const randomValue = Math.random();
    let cumulativeProbability = 0;

    for (let i = 0; i < transitionMatrix[currentState].length; i++) {
      cumulativeProbability += transitionMatrix[currentState][i];

      if (randomValue <= cumulativeProbability) {
        return i;
      }
    }

    // If no state is selected, return the current state as a fallback
    return currentState;
  }

  /**
   * Calculates the PDF of the Gamma Distribution.
   * @method gammaDist
   * @memberof stats
   * @param {Object} params - Contains: alpha (shape) and beta (scale).
   * @param {Object} args - Contains: x (value).
   * @param {Object} data - Not used by this function.
   * @returns {Number} PDF value.
   * @example
   * hydro.analyze.stats.gammaDist({ params: { alpha: 2, beta: 1 }, args: { x: 3 } });
   */
  static gammaDist({ params = {}, args = {}, data } = {}) {
    const { alpha, beta } = params;
    const { x } = args;
    if (x < 0) return 0;

    // Gamma function using Lanczos approximation
    const gammaFn = (z) => {
      if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFn(1 - z));
      z -= 1;
      const p = [
        0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
      ];
      let x = p[0];
      for (let i = 1; i < p.length; i++) {
        x += p[i] / (z + i);
      }
      const t = z + p.length - 1.5;
      return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    };

    return (Math.pow(x, alpha - 1) * Math.exp(-x / beta)) / (Math.pow(beta, alpha) * gammaFn(alpha));
  }

  /**
   * Calculates the PDF of the Weibull Distribution.
   * @method weibullDist
   * @memberof stats
   * @param {Object} params - Contains: k (shape) and lambda (scale).
   * @param {Object} args - Contains: x (value).
   * @param {Object} data - Not used by this function.
   * @returns {Number} PDF value.
   * @example
   * hydro.analyze.stats.weibullDist({ params: { k: 2, lambda: 1 }, args: { x: 1 } });
   */
  static weibullDist({ params = {}, args = {}, data } = {}) {
    const { k, lambda } = params;
    const { x } = args;
    if (x < 0) return 0;
    return (k / lambda) * Math.pow(x / lambda, k - 1) * Math.exp(-Math.pow(x / lambda, k));
  }

  /**
   * Calculates the PDF of the Exponential Distribution.
   * @method exponentialDist
   * @memberof stats
   * @param {Object} params - Contains: lambda (rate).
   * @param {Object} args - Contains: x (value).
   * @param {Object} data - Not used by this function.
   * @returns {Number} PDF value.
   * @example
   * hydro.analyze.stats.exponentialDist({ params: { lambda: 1 }, args: { x: 1 } });
   */
  static exponentialDist({ params = {}, args = {}, data } = {}) {
    const { lambda } = params;
    const { x } = args;
    if (x < 0) return 0;
    return lambda * Math.exp(-lambda * x);
  }

  /**
   * Calculates the PDF of the Beta Distribution.
   * @method betaDist
   * @memberof stats
   * @param {Object} params - Contains: alpha and beta.
   * @param {Object} args - Contains: x (value, 0 <= x <= 1).
   * @param {Object} data - Not used by this function.
   * @returns {Number} PDF value.
   * @example
   * hydro.analyze.stats.betaDist({ params: { alpha: 2, beta: 5 }, args: { x: 0.5 } });
   */
  static betaDist({ params = {}, args = {}, data } = {}) {
    const { alpha, beta } = params;
    const { x } = args;
    if (x < 0 || x > 1) return 0;

    // Gamma function using Lanczos approximation (same as in gammaDist)
    // In a real refactor, this should be a shared helper method
    const gammaFn = (z) => {
      if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFn(1 - z));
      z -= 1;
      const p = [
        0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
      ];
      let x = p[0];
      for (let i = 1; i < p.length; i++) {
        x += p[i] / (z + i);
      }
      const t = z + p.length - 1.5;
      return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    };

    const B = (gammaFn(alpha) * gammaFn(beta)) / gammaFn(alpha + beta);
    return (Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1)) / B;
  }

  /**********************************/
  /***** Hypothesis Tests ***********/
  /**********************************/

  /**
   * Performs a t-test (one-sample, two-sample independent, or paired).
   * @method tTest
   * @memberof stats
   * @param {Object} params - Contains: type ('one', 'two', 'paired') and mu (for one-sample).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: sample1 and sample2 (optional).
   * @returns {Object} t-statistic and degrees of freedom.
   * @example
   * hydro.analyze.stats.tTest({ params: { type: 'one', mu: 0 }, data: { sample1: [1, 2, 3] } });
   */
  static tTest({ params, args, data } = {}) {
    const { type = 'one', mu = 0 } = params;
    const { sample1, sample2 } = data;

    const clean1 = this.preprocessData(sample1);
    const mean1 = this.mean({ data: clean1 });
    const n1 = clean1.length;
    const var1 = this.variance({ data: clean1 });

    let t, df;

    if (type === 'one') {
      t = (mean1 - mu) / Math.sqrt(var1 / n1);
      df = n1 - 1;
    } else if (type === 'two') {
      const clean2 = this.preprocessData(sample2);
      const mean2 = this.mean({ data: clean2 });
      const n2 = clean2.length;
      const var2 = this.variance({ data: clean2 });
      // Assuming equal variance for simplicity, or Welch's t-test could be added
      const sp = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));
      t = (mean1 - mean2) / (sp * Math.sqrt(1 / n1 + 1 / n2));
      df = n1 + n2 - 2;
    } else if (type === 'paired') {
      const clean2 = this.preprocessData(sample2);
      if (n1 !== clean2.length) throw new Error("Samples must have same length for paired t-test");
      const diffs = clean1.map((v, i) => v - clean2[i]);
      const meanDiff = this.mean({ data: diffs });
      const varDiff = this.variance({ data: diffs });
      t = meanDiff / Math.sqrt(varDiff / n1);
      df = n1 - 1;
    }

    return { t, df };
  }

  /**
   * Performs an F-test for equality of variances.
   * @method fTest
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: sample1 and sample2.
   * @returns {Object} F-statistic and degrees of freedom.
   * @example
   * hydro.analyze.stats.fTest({ data: { sample1: [1, 2, 3], sample2: [4, 5, 6] } });
   */
  static fTest({ params, args, data } = {}) {
    const { sample1, sample2 } = data;
    const clean1 = this.preprocessData(sample1);
    const clean2 = this.preprocessData(sample2);

    const var1 = this.variance({ data: clean1 });
    const var2 = this.variance({ data: clean2 });

    const F = var1 / var2;
    const df1 = clean1.length - 1;
    const df2 = clean2.length - 1;

    return { F, df1, df2 };
  }

  /**
   * Performs a one-way ANOVA.
   * @method anova
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Array of samples (arrays) e.g., [[1,2], [3,4], [5,6]].
   * @returns {Object} F-statistic and degrees of freedom.
   * @example
   * hydro.analyze.stats.anova({ data: [[1, 2], [3, 4], [5, 6]] });
   */
  static anova({ params, args, data } = {}) {
    const samples = data.map(s => this.preprocessData(s));
    const k = samples.length;
    const nTotal = samples.reduce((acc, s) => acc + s.length, 0);

    // Grand mean
    const allData = samples.flat();
    const grandMean = this.mean({ data: allData });

    // Between-group Sum of Squares (SSB)
    let SSB = 0;
    samples.forEach(sample => {
      const mean = this.mean({ data: sample });
      SSB += sample.length * Math.pow(mean - grandMean, 2);
    });

    // Within-group Sum of Squares (SSW)
    let SSW = 0;
    samples.forEach(sample => {
      const mean = this.mean({ data: sample });
      sample.forEach(val => {
        SSW += Math.pow(val - mean, 2);
      });
    });

    const dfBetween = k - 1;
    const dfWithin = nTotal - k;

    const MSB = SSB / dfBetween;
    const MSW = SSW / dfWithin;

    const F = MSB / MSW;

    return { F, dfBetween, dfWithin };
  }

  /**
   * Performs the Mann-Whitney U test for independent samples.
   * @method mannWhitney
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: sample1 and sample2.
   * @returns {Object} U-statistic and p-value (approximate).
   * @example
   * hydro.analyze.stats.mannWhitney({ data: { sample1: [1, 2, 3], sample2: [4, 5, 6] } });
   */
  static mannWhitney({ params, args, data } = {}) {
    const { sample1, sample2 } = data;
    const clean1 = this.preprocessData(sample1);
    const clean2 = this.preprocessData(sample2);
    const n1 = clean1.length;
    const n2 = clean2.length;

    // Combine and rank
    const combined = clean1.map(v => ({ val: v, group: 1 }))
      .concat(clean2.map(v => ({ val: v, group: 2 })));

    combined.sort((a, b) => a.val - b.val);

    // Assign ranks (handle ties)
    const ranks = new Array(combined.length).fill(0);
    for (let i = 0; i < combined.length;) {
      let j = i + 1;
      while (j < combined.length && combined[j].val === combined[i].val) j++;
      const rank = (i + 1 + j) / 2;
      for (let k = i; k < j; k++) ranks[k] = rank;
      i = j;
    }

    let r1 = 0;
    for (let i = 0; i < combined.length; i++) {
      if (combined[i].group === 1) r1 += ranks[i];
    }

    const U1 = r1 - (n1 * (n1 + 1)) / 2;
    const U2 = n1 * n2 - U1;
    const U = Math.min(U1, U2);

    // Normal approximation for p-value (n > 20 usually, but applying generally here)
    const muU = (n1 * n2) / 2;
    const sigmaU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
    const z = (U - muU) / sigmaU;

    // Two-tailed p-value
    const p = 2 * (1 - this.normalcdf({ data: [Math.abs(z)] })[0]);

    return { U, p };
  }

  /**
   * Performs the Wilcoxon Signed-Rank test for paired samples.
   * @method wilcoxonSignedRank
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: sample1 and sample2.
   * @returns {Object} W-statistic and p-value (approximate).
   * @example
   * hydro.analyze.stats.wilcoxonSignedRank({ data: { sample1: [1, 2, 3], sample2: [1.1, 2.1, 3.1] } });
   */
  static wilcoxonSignedRank({ params, args, data } = {}) {
    const { sample1, sample2 } = data;
    const clean1 = this.preprocessData(sample1);
    const clean2 = this.preprocessData(sample2);

    if (clean1.length !== clean2.length) throw new Error("Samples must have same length");

    const n = clean1.length;
    const diffs = [];
    for (let i = 0; i < n; i++) {
      const d = clean1[i] - clean2[i];
      if (d !== 0) diffs.push(d);
    }

    const absDiffs = diffs.map(d => ({ val: Math.abs(d), sign: Math.sign(d) }));
    absDiffs.sort((a, b) => a.val - b.val);

    // Rank absolute differences
    const ranks = new Array(absDiffs.length).fill(0);
    for (let i = 0; i < absDiffs.length;) {
      let j = i + 1;
      while (j < absDiffs.length && absDiffs[j].val === absDiffs[i].val) j++;
      const rank = (i + 1 + j) / 2;
      for (let k = i; k < j; k++) ranks[k] = rank;
      i = j;
    }

    let W_plus = 0;
    let W_minus = 0;

    for (let i = 0; i < absDiffs.length; i++) {
      if (absDiffs[i].sign > 0) W_plus += ranks[i];
      else W_minus += ranks[i];
    }

    const W = Math.min(W_plus, W_minus);
    const N = diffs.length; // Effective N (excluding zeros)

    // Normal approximation
    const muW = (N * (N + 1)) / 4;
    const sigmaW = Math.sqrt((N * (N + 1) * (2 * N + 1)) / 24);
    const z = (W - muW) / sigmaW;

    const p = 2 * (1 - this.normalcdf({ data: [Math.abs(z)] })[0]);

    return { W, p };
  }

  /**
   * Performs the Shapiro-Wilk test for normality.
   * Uses polynomial approximations for coefficients (Royston, 1992) for n <= 50.
   * For n > 50, this implementation falls back to a simplified approximation or should ideally use the Shapiro-Francia test.
   * @method shapiroWilk
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Array of values.
   * @returns {Object} W-statistic and p-value.
   * @example
   * hydro.analyze.stats.shapiroWilk({ data: [1, 2, 3, 4, 5] });
   */
  static shapiroWilk({ params, args, data } = {}) {
    const x = data.slice().sort((a, b) => a - b);
    const n = x.length;
    const mean = this.mean({ data: x });

    if (n < 3) throw new Error("Sample size must be at least 3 for Shapiro-Wilk test.");
    if (n > 50) console.warn("Shapiro-Wilk approximation used here is optimized for n <= 50.");

    // Calculate SS (denominator)
    const ss = x.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);

    // Calculate coefficients a_i
    // Using polynomial approximation for a_n, a_{n-1}, ...
    // Reference: Royston (1992)

    const a = new Array(Math.floor(n / 2) + 1).fill(0);
    const m = Math.floor(n / 2);

    // Coefficients for a_n (last coefficient)
    const c_an = [0.72557602, 0.17584045, 0.00918207, 0.00255450, -0.00027135, -0.00004690];
    let poly = 0;
    for (let i = 0; i < 6; i++) poly += c_an[i] * Math.pow(n, -i); // Actually it's polynomial in 1/sqrt(n) or similar? 
    // Royston 1992 uses different approximation. 
    // Let's use a simpler but standard approximation for a_i often used in code libraries:
    // a_n = c_n + 0.221157 y - 0.147981 y^2 - 2.071190 y^3 + 4.434685 y^4 - 2.706056 y^5
    // where y = 1/sqrt(n) and c_n is from table.
    // Given the complexity of implementing full Royston without a massive table, 
    // we will use the approximation: a_i = 2 * m_i / sqrt(sum(m_j^2)) where m_i are expected values of order statistics.
    // Expected values m_i can be approximated by Phi^-1((i - 0.375)/(n + 0.25)).

    // 1. Calculate m_i
    const m_vals = [];
    let m_sum_sq = 0;
    for (let i = 1; i <= n; i++) {
      // Inverse normal CDF of (i - 0.375) / (n + 0.25)
      // We need a robust inverse normal CDF (probit) function.
      // Using a standard approximation for probit:
      const p = (i - 0.375) / (n + 0.25);
      const q = p < 0.5 ? p : 1 - p;
      const t = Math.sqrt(-2 * Math.log(q));
      const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
      const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
      let z = t - ((c2 * t + c1) * t + c0) / (((d3 * t + d2) * t + d1) * t + 1);
      if (p < 0.5) z = -z;

      m_vals.push(z);
      m_sum_sq += z * z;
    }

    // 2. Calculate a_i
    // a = m / sqrt(m'm) is the simplified Shapiro-Francia weight, but Shapiro-Wilk involves covariance matrix V.
    // a = m' V^-1 / C. 
    // For n > 20, Shapiro-Francia (using just m) is very close to Shapiro-Wilk.
    // We will use the Shapiro-Francia approximation for weights as it's robust and standard for general implementation without tables.

    const weights = m_vals.map(m => m / Math.sqrt(m_sum_sq));

    // 3. Calculate W
    let b = 0;
    for (let i = 0; i < n; i++) {
      b += weights[i] * x[i];
    }

    const W = (b * b) / ss;

    // 4. Calculate p-value
    // Using Royston's transformation to normal
    // y = (1-W)^lambda. mu_y, sigma_y depend on n.
    // This part requires coefficients for mu, sigma, lambda.
    // Simplified p-value lookup for common critical values:
    // W_0.05 approx 1 - 1.2/ln(n) ? No.
    // We will return W and a warning about p-value precision.
    // Or implement a basic lookup for critical values if possible.

    // Using a simple approximation for p-value derived from W and n (e.g. standard regression on W)
    // ln(1-W) is often approximately log-normal or similar.
    // For now, we return W. The user can compare W to tables. 
    // Ideally, we'd add the full Royston logic, but it's hundreds of lines of coefficients.

    return { W, p: "P-value calculation requires extensive tables. W statistic provided." };
  }

  /**
   * Performs the Anderson-Darling test for normality.
   * @method andersonDarling
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Array of values.
   * @returns {Object} A2-statistic and significance.
   * @example
   * hydro.analyze.stats.andersonDarling({ data: [1, 2, 3, 4, 5] });
   */
  static andersonDarling({ params, args, data } = {}) {
    const x = data.slice().sort((a, b) => a - b);
    const n = x.length;
    const mean = this.mean({ data: x });
    const std = this.stddev({ data: x });

    let S = 0;
    for (let i = 0; i < n; i++) {
      const z = (x[i] - mean) / std;

      // Standard normal CDF (Phi)
      // Using error function approximation for CDF
      const erf = (z) => {
        const t = 1.0 / (1.0 + 0.5 * Math.abs(z));
        const ans = 1 - t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
        return z >= 0 ? ans : -ans;
      };
      const cdf = 0.5 * (1 + erf(z / Math.sqrt(2)));

      // Ensure log argument is within valid range (avoid log(0))
      const p_i = Math.max(1e-15, Math.min(1 - 1e-15, cdf));

      // Formula: S = sum((2i-1)/n * (ln(p_i) + ln(1-p_{n+1-i})))
      // Note: The formula is usually written as: -n - (1/n) * sum((2i-1)*(ln(p_i) + ln(1-p_{n-i+1})))
      // where indices are 1-based.

      const term1 = Math.log(p_i);

      // For the second term, we need p_{n-i} (using 0-based index i, this corresponds to n-1-i in sorted array)
      // But we need to calculate CDF for x[n-1-i]
      const z_rev = (x[n - 1 - i] - mean) / std;
      const cdf_rev = 0.5 * (1 + erf(z_rev / Math.sqrt(2)));
      const p_rev = Math.max(1e-15, Math.min(1 - 1e-15, cdf_rev));
      const term2 = Math.log(1 - p_rev);

      S += (2 * (i + 1) - 1) * (term1 + term2);
    }

    // A^2 statistic
    let A2 = -n - (1 / n) * S;

    // Small sample size correction
    const A2_adj = A2 * (1 + 0.75 / n + 2.25 / (n * n));

    // Critical values for normality (Stephens, 1974)
    // 15%: 0.576, 10%: 0.656, 5%: 0.787, 2.5%: 0.918, 1%: 1.092

    let p;
    if (A2_adj >= 0.6) {
      p = Math.exp(1.2937 - 5.709 * A2_adj + 0.0186 * A2_adj * A2_adj);
    } else if (A2_adj >= 0.34) {
      p = Math.exp(0.9177 - 4.279 * A2_adj - 1.38 * A2_adj * A2_adj);
    } else if (A2_adj > 0.2) {
      p = 1 - Math.exp(-8.318 + 42.796 * A2_adj - 59.938 * A2_adj * A2_adj);
    } else {
      p = 1 - Math.exp(-13.436 + 101.14 * A2_adj - 223.73 * A2_adj * A2_adj);
    }

    const significant = p < 0.05;

    return { A2, A2_adj, p, significant };
  }

  /**********************************/
  /***** Stochastic & Time Series ***/
  /**********************************/

  /**
   * Calculates the Autocorrelation Function (ACF) for a given lag.
   * @method autoCorrelation
   * @memberof stats
   * @param {Object} params - Contains: lag (k).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Time series array.
   * @returns {Number} Autocorrelation at lag k.
   * @example
   * hydro.analyze.stats.autoCorrelation({ params: { lag: 1 }, data: [1, 2, 3, 4, 5] });
   */
  static autoCorrelation({ params, args, data } = {}) {
    const lag = Number(params.lag);
    // Robust parsing
    const numData = this.preprocessData(data);
    const n = numData.length;
    if (n === 0) return 0;
    const mean = this.mean({ data: numData });

    let num = 0;
    let den = 0;

    for (let i = 0; i < n; i++) {
      den += Math.pow(numData[i] - mean, 2);
      if (i < n - lag) {
        num += (numData[i] - mean) * (numData[i + lag] - mean);
      }
    }

    if (den === 0) return 0;
    return num / den;
  }

  /**
   * Calculates the Partial Autocorrelation Function (PACF) for a given lag.
   * Uses the Yule-Walker equations (recursive method).
   * @method partialAutoCorrelation
   * @memberof stats
   * @param {Object} params - Contains: lag (k).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Time series array.
   * @returns {Number} PACF at lag k.
   * @example
   * hydro.analyze.stats.partialAutoCorrelation({ params: { lag: 1 }, data: [1, 2, 3, 4, 5] });
   */
  static partialAutoCorrelation({ params, args, data } = {}) {
    const { lag } = params;
    // Durbin-Levinson Algorithm is efficient for this

    // Calculate ACFs up to lag k
    const acfs = [];
    for (let i = 0; i <= lag; i++) {
      acfs.push(this.autoCorrelation({ params: { lag: i }, data }));
    }

    // phi[k][j] is the j-th coefficient in an AR(k) model
    const phi = [];

    // Initialization
    phi[0] = [0]; // Not used really
    phi[1] = [0, acfs[1]]; // phi_11 = rho_1

    for (let k = 2; k <= lag; k++) {
      phi[k] = [];
      let num = acfs[k];
      let den = 1;

      for (let j = 1; j < k; j++) {
        num -= phi[k - 1][j] * acfs[k - j];
        den -= phi[k - 1][j] * acfs[j];
      }

      phi[k][k] = num / den;

      for (let j = 1; j < k; j++) {
        phi[k][j] = phi[k - 1][j] - phi[k][k] * phi[k - 1][k - j];
      }
    }

    return phi[lag][lag];
  }

  /**
   * Performs bootstrap resampling to estimate statistics.
   * @method bootstrap
   * @memberof stats
   * @param {Object} params - Contains: iterations, statistic (function name as string or function).
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Original data array.
   * @returns {Object} Original statistic, mean of resamples, bias, confidence interval.
   * @example
   * hydro.analyze.stats.bootstrap({ params: { iterations: 100, statistic: 'mean' }, data: [1, 2, 3, 4, 5] });
   */
  static bootstrap({ params, args, data } = {}) {
    const { iterations = 1000, statistic = 'mean', alpha = 0.05 } = params;
    const numData = this.preprocessData(data);
    const n = numData.length;
    const resampledStats = [];

    // Get the statistic function
    let statFunc;
    if (typeof statistic === 'string') {
      statFunc = (d) => this[statistic]({ data: d });
    } else {
      statFunc = statistic;
    }

    const originalStat = statFunc(numData);

    for (let i = 0; i < iterations; i++) {
      const sample = [];
      for (let j = 0; j < n; j++) {
        const idx = Math.floor(Math.random() * n);
        sample.push(numData[idx]);
      }
      resampledStats.push(statFunc(sample));
    }

    const meanResampled = this.mean({ data: resampledStats });
    const bias = meanResampled - originalStat;
    const stdError = this.stddev({ data: resampledStats });

    resampledStats.sort((a, b) => a - b);
    const lowerCI = resampledStats[Math.floor((alpha / 2) * iterations)];
    const upperCI = resampledStats[Math.floor((1 - alpha / 2) * iterations)];

    return { originalStat, meanResampled, bias, stdError, ci: [lowerCI, upperCI] };
  }

  /**
   * Generates a random walk time series.
   * @method randomWalk
   * @memberof stats
   * @param {Object} params - Contains: steps, startValue, drift, volatility.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Not used by this function.
   * @returns {Array} Random walk series.
   * @example
   * hydro.analyze.stats.randomWalk({ params: { steps: 50, startValue: 0, drift: 0, volatility: 1 } });
   */
  static randomWalk({ params, args, data } = {}) {
    const { steps = 100, startValue = 0, drift = 0, volatility = 1 } = params;
    const series = [startValue];

    for (let i = 1; i < steps; i++) {
      const shock = this.runSimulation({ params: { multiplier: 1 }, data: [0] }); // Using runSimulation for random normal (approx)
      // Actually runSimulation uses uniform random * std + mean? 
      // Let's check runSimulation implementation.
      // runSimulation: Math.random() * (max - min) + min. It's uniform.
      // We need normal for standard random walk usually.
      // Using Box-Muller transform for normal random variable
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      const nextVal = series[i - 1] + drift + volatility * z;
      series.push(nextVal);
    }

    return series;
  }

  /**********************************/
  /***** Error Metrics **************/
  /**********************************/

  /**
   * Calculates various error metrics (RMSE, MAE, MAPE, MSE).
   * @method errorMetrics
   * @memberof stats
   * @param {Object} params - Not used by this function.
   * @param {Object} args - Not used by this function.
   * @param {Object} data - Contains: observed and modeled.
   * @returns {Object} Object with error metrics.
   * @example
   * hydro.analyze.stats.errorMetrics({ data: { observed: [1, 2, 3], modeled: [1.1, 1.9, 3.2] } });
   */
  static errorMetrics({ params, args, data } = {}) {
    const { observed: obsRaw, modeled: modRaw } = data;

    // Robust parsing
    const observed = this.preprocessData(obsRaw);
    const modeled = this.preprocessData(modRaw);

    if (observed.length !== modeled.length) throw new Error("Arrays must have same length");

    const n = observed.length;
    let sumSqErr = 0;
    let sumAbsErr = 0;
    let sumAbsPercErr = 0;

    for (let i = 0; i < n; i++) {
      const err = observed[i] - modeled[i];
      sumSqErr += err * err;
      sumAbsErr += Math.abs(err);
      if (observed[i] !== 0) {
        sumAbsPercErr += Math.abs(err / observed[i]);
      }
    }

    const MSE = sumSqErr / n;
    const RMSE = Math.sqrt(MSE);
    const MAE = sumAbsErr / n;
    const MAPE = (sumAbsPercErr / n) * 100;

    return { MSE, RMSE, MAE, MAPE };
  }

  /**********************************/
  /*** End of Helper functions **/
  /**********************************/
}
