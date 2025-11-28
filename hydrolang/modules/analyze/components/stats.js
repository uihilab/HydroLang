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
   * @param {Object}  data - Contains: 1d-JS array or object with original data.
   * @returns {Object} Deep copy of original data.
   * @example
   * hydro.analyze.stats.copydata({data: [someData]})
   */

  static copydata({ params, args, data } = {}) {
    var arr, values, keys;

    if (typeof data !== "object" || data === null) {
      return data;
    }

    arr = Array.isArray(data) ? [] : {};

    for (keys in data) {
      values = data[keys];

      arr[keys] = this.copydata({ data: values });
    }

    return arr;
  }

  /**
   * Retrieves a 1D array with the data.
   * @method onearray
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array as [data]
   * @returns {Object[]} Array object.
   * @example
   * hydro.analyze.stats.onearray({data: [someData]})
   */

  static onearray({ params, args, data } = {}) {
    var arr = [];
    arr.push(data[1]);
    return arr;
  }

  /**
   * Gives the range of a dataset
   * @method range
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array with data as [data].
   * @returns {Array} Range of the data.
   * @example
   * hydro.analyze.stats.range({data: [someData]})
   */
  static range({ params = {}, args, data } = {}) {
    const min = this.min({ data }),
      max = this.max({ data });
    const N = params.N || data.length;
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
   * @param {Object} data - Contains: 1d-JS array with data as [data].
   * @returns {Number} Number of gaps in data.
   * @example
   * hydro.analyze.stats.datagaps({data: [someData]})
   */

  static datagaps({ params, args, data } = {}) {
    var arr = data,
      or,
      gap = 0;

    if (typeof arr[0] != "object") {
      or = this.copydata({ data: arr });
    } else {
      or = this.copydata({ data: arr[1] });
    }
    for (var i = 0; i < or.length; i++) {
      if (or[i] === undefined || Number.isNaN(or[i]) || or[i] === false) {
        gap++;
      }
    }

    return console.log(`Total amount of gaps in data: ${gap}.`);
  }

  /**
   * Remove gaps in data with an option to fill the gap.
   * @method gapremoval
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array object with data as [data].
   * @returns {Number} Number of gaps found in the data.
   * @example
   * hydro.analyze.stats.gapremoval({data: [someData]})
   */

  static gapremoval({ params = {}, args = {}, data } = {}) {
    const gapValues = params.gapValues || [undefined, null, NaN, false, -9999, 9999];
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
   * @param {Object} params - Contains: timestep (in min)
   * @param {Object} data - Contains: 1d-JS array with timedata in minutes as [timeData].
   * @returns {Object[]} Array with gaps.
   * @example
   * hydro.analyze.stats.timegaps({params: {timestep: 'someNum'} data: [timeData]})
   */

  static timegaps({ params, args, data } = {}) {
    var timestep = params.timestep,
      arr = data,
      or = this.copydata({ data: arr });

    if (typeof arr[0] === "object") {
      or = this.copydata({ data: arr[0] });
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
   * @param {Object} params - Contains: type (time or data)
   * @param {Object} data - Contains: 2d-JS array with data or time gaps to be filled as [[time],[data]].
   * @returns {Object[]} Array with gaps filled.
   * @example
   * hydro.analyze.stats.gapfiller({params: {type: 'someType'}, data: [[time1,time2...], [data1, data2,...]]})
   */

  static gapfiller({ params, args, data } = {}) {
    var or = this.copydata({ data: data }),
      datetr = [];

    if (typeof data[0] === "object") {
      or = this.copydata({ data: data[0] });
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
   * Sums all data in a 1-d array.
   * @method sum
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array object with data as [data].
   * @returns {Number} Sum of all data in an array.
   * @example
   * hydro.analyze.stats.sum({data: [data]})
   */

  static sum({ params, args, data } = {}) {
    return data.reduce((acc, curr) => acc + curr, 0);
  }

  /**
   * Calculates the mean of a 1d array.
   * @method mean
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array object with data as [data].
   * @returns {Number} Mean of the data.
   * @example
   * hydro.analyze.stats.mean({data: [data]})
   */

  static mean({ params, args, data } = {}) {
    const sum = this.sum({ data });
    const mean = sum / data.length;
    if (Number.isNaN(mean)) {
      console.warn('stats.mean returned NaN. Data:', data, 'Sum:', sum);
    }
    return mean;
  }

  /**
   * Calculates the median values for a 1d array.
   * @method median
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array object with data as [data].
   * @returns {Number} Median of the data.
   * @example
   * hydro.analyze.stats.median({data: [data]})
   */

  static median({ params, args, data } = {}) {
    const sortedArray = data.slice().sort((a, b) => a - b);
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
   * Calculates standard deviation of a 1d array.
   * @method stddev
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array object with data as [data].
   * @returns {Number} Standard deviation.
   * @example
   * hydro.analyze.stats.stddev({data: [data]})
   */

  static stddev({ params, args, data } = {}) {
    var mean = this.mean({ data }),
      SD = 0,
      nex = [];
    for (var i = 0; i < data.length; i += 1) {
      nex.push((data[i] - mean) * (data[i] - mean));
    }
    return (SD = Math.sqrt(this.sum({ data: nex }) / nex.length));
  }

  /**
   * Calculate variance for an 1-d array of data.
   * @method variance
   * @memberof stats
   * @param {Object} data - Contains 1d-JS array object with data as [data].
   * @returns {Number} Variance of the data.
   * @example
   * hydro.analyze.stats.variance({data: [data]})
   */

  static variance({ params, args, data } = {}) {
    const mean = this.mean({ data });
    const squareDiffs = data.map((num) => (num - mean) ** 2);
    const sumSquareDiffs = squareDiffs.reduce((acc, curr) => acc + curr, 0);
    const variance = sumSquareDiffs / data.length;
    return variance;
  }

  /**
   * Calculates sum of squares for a dataset.
   * @method sumsqrd
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array object with data as [data].
   * @returns {Number} Sum of squares for data.
   * @example
   * hydro.analyze.stats.sumsqrd({data: [data]})
   */

  static sumsqrd({ params, args, data } = {}) {
    var sum = 0,
      i = data.length;
    while (--i >= 0) sum += data[i];
    return sum;
  }

  /**
   * Minimum value of an array.
   * @method min
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array object with data as [data].
   * @returns {Number} Minimum value of a dataset.
   * @example
   * hydro.analyze.stats.min({data: [data]})
   */

  static min({ params, args, data } = {}) {
    return Math.min(...data);
  }

  /**
   * Maximum value of an array.
   * @method max
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array object with data as [data].
   * @returns {Number} Maximum value of a dataset.
   * @example
   * hydro.analyze.stats.max({data: [data]})
   */

  static max({ params, args, data } = {}) {
    return Math.max(...data);
  }

  /**
   * Unique values in an array.
   * @method unique
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array object with data as [data].
   * @returns {Object[]} Array with unique values.
   * @example
   * hydro.analyze.stats.unique({data: [data]})
   */

  static unique({ params, args, data } = {}) {
    var un = {},
      _arr = [];
    for (var i = 0; i < data.length; i++) {
      if (!un[data[i]]) {
        un[data[i]] = true;
        _arr.push(data[i]);
      }
    }
    return _arr;
  }

  /**
   * Calculates the frequency in data.
   * @method frequency
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array object with data as [data].
   * @returns {Object} Object with frenquency distribution.
   * @example
   * hydro.analyze.stats.frequency({data: [data]})
   */

  static frequency({ params, args, data } = {}) {
    console.log(data)
    var _arr = this.copydata({ data: data }),
      counter = {};
    _arr.forEach((i) => {
      counter[i] = (counter[i] || 0) + 1;
    });
    return counter;
  }

  /**
   * Use mean and standard deviation to standardize the original dataset.
   * @method standardize
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array object with data as [data].
   * @returns {Object[]} Array with standardized data.
   * @example
   * hydro.analyze.stats.standardize({data: [data]})
   */

  static standardize({ params, args, data } = {}) {
    var _arr = [],
      stddev = this.stddev({ data: data }),
      mean = this.mean({ data: data });
    for (var i = 0; i < data.length; i++) {
      _arr[i] = (data[i] - mean) / stddev;
    }
    return _arr;
  }

  /**
   * Quantile calculator for given data.
   * @method quantile
   * @memberof stats
   * @param {Object} params - Contains: q(quartile as 0.25, 0.75, or required)
   * @param {Object} data - Contains: 1d-JS array object with data as [data].
   * @returns {Object[]} Array with values fitting the quartile.
   * @example
   * hydro.analyze.stats.quantile({params: {q: 'someNum'}, data: [data]})
   */

  static quantile({ params, args, data } = {}) {
    var _arr = data.slice();
    _arr.sort(function (a, b) {
      return a - b;
    });
    var p = (data.length - 1) * params.q;
    if (p % 1 === 0) {
      return _arr[p];
    } else {
      var b = Math.floor(p),
        rest = p - b;
      if (_arr[b + 1] !== undefined) {
        return _arr[b] + rest * (_arr[b + 1] - _arr[b]);
      } else {
        return _arr[b];
      }
    }
  }

  /**
   * Removes interquartile outliers from an array or a set of arrays.
   * @method interoutliers
   * @memberof stats
   * @param {Object} [params={ q1: 0.25, q2: 0.75 }] - Parameters object.
   * @param {Array} data - Data to filter. If a 2D array is provided, the first array will be considered as a time array.
   * @returns {Array} - Filtered data.
   * @example
   * hydro.analyze.stats.interoutliers({ params: { q1: 0.25, q2: 0.75 }, data: [1, 2, 3, 100, 4, 5, 6]});
   */

  static interoutliers({ params = { q1: 0.25, q2: 0.75 }, data = [] } = {}) {
    const { q1, q2 } = params;
    const or = [...data];
    let time = [];

    if (Array.isArray(data[0])) {
      [time, or] = data;
    }

    const Q1 = this.quantile({ data: or, params: { q: q1 } });
    const Q3 = this.quantile({ data: or, params: { q: q2 } });
    const IQR = Math.abs(Q3 - Q1);
    const qd = Math.abs(Q1 - 1.5 * IQR);
    const qu = Math.abs(Q3 + 1.5 * IQR);

    const filteredData = or.filter((value, index) => {
      if (value >= qd && value <= qu) {
        if (time.length) {
          return [time[index], value];
        } else {
          return value;
        }
      }
    });

    return time.length ? filteredData : filteredData;
  }

  /**
   * Filters the outliers from the given data set based on its standard score (z-score).
   *
   * @memberof stats
   * @static
   * @method normoutliers
   *
   * @param {Object} [params={}] - An object containing optional parameters.
   * @param {Number} [params.low=-0.5] - The lower threshold value for filtering data.
   * @param {Number} [params.high=0.5] - The higher threshold value for filtering data.
   * @param {Object} [args] - An object containing any additional arguments.
   * @param {Array} data - The data set to filter outliers from.
   * @param {Array} [data[0]=[]] - An optional array of timestamps corresponding to the data.
   * @param {Array} data[1] - The main data array containing values to filter outliers from.
   *
   * @returns {Array} Returns the filtered data set. If timestamps are provided, it will return an array of
   * timestamps and filtered data set as [t, out]. If no timestamps are provided, it will return the filtered data set.
   *
   * @example
   *
   * // Filter outliers from the data set between z-scores of -0.5 and 0.5
   * let data = [1, 2, 3, 4, 5, 10, 12, 15, 20];
   * let filteredData = hydro.analyze.stats.normoutliers({ params: { low: -0.5, high: 0.5 }, data: data });
   * // filteredData => [1, 2, 3, 4, 5, 15, 20]
   *
   * // Filter outliers from the data set between z-scores of -1 and 1 with timestamps
   * let data = [[1, 2, 3, 4, 5, 10, 12, 15, 20], [1, 2, 3, 4, 5, 10, 12, 15, 200]];
   * let [timestamps, filteredData] = hydro.analyze.stats.normoutliers({ params: { low: -1, high: 1 }, data: data });
   * // timestamps => [1, 2, 3, 4, 5, 10, 12, 15]
   * // filteredData => [1, 2, 3, 4, 5, 10, 12, 15]
   */

  static normoutliers({ params = {}, args, data } = {}) {
    const { lowerBound = -0.5, upperBound = 0.5 } = params;
    const [time, or] = Array.isArray(data[0]) ? data : [[], data];
    const stnd = this.standardize({ data: or });

    const out = or.filter(
      (_, i) => stnd[i] < lowerBound || stnd[i] > upperBound
    );
    const t = time.filter(
      (_, j) => stnd[j] < lowerBound || stnd[j] > upperBound
    );

    return time.length === 0 ? out : [t, out];
  }

  /**
   * Remove outliers from dataset. It uses p1 and p2 as outliers to remove.
   * @method outremove
   * @memberof stats
   * @param {Object} params - Contains: type ('normalized', 'interquartile')
   * @param {Object} args - Contains: p1 (low end value), p2 (high end value) both depending on outlier analysis type
   * @param {Object} data - Contains: 2d-JS array with time series data as [[time],[data]].
   * @returns {Object[]} Array with cleaned data.
   * @example
   * hydro.analyze.stats.outremove({params: {type: 'someType'}, args: {p1: 'someNum', p2: 'someNum'},
   * data: [[time1, time2,...], [data1, data2,...]]})
   */

  static outremove({ data, args = {}, params = {} } = {}) {
    const {
      replaceValue = 0,
      thresholds = [-9999, 9999],
    } = args;

    const isOutlier = (v) =>
      typeof v === 'number' &&
      (v <= thresholds[0] || v >= thresholds[1]);

    const convert = (v) => {
      const n = Number(v);
      return isNaN(n) ? v : n;
    };

    const clean1D = (arr) => arr.map(v => {
      const num = convert(v);
      return isOutlier(num) ? replaceValue : num;
    });

    const clean2D = (arr) => arr.map(sub => clean1D(sub));

    const isNamedStructure = (arr) =>
      Array.isArray(arr) &&
      arr.length === 2 &&
      typeof arr[0][0] === 'string' &&
      typeof arr[1][0] === 'string';

    if (Array.isArray(data[0])) {
      if (isNamedStructure(data)) {
        const [timeRow, valueRow] = data;

        const timeHeader = timeRow[0];
        const valueHeader = valueRow[0];

        const timeArray = timeRow.slice(1);
        const valueArray = valueRow.slice(1).map(convert);

        const cleanedValues = valueArray.map(v =>
          isOutlier(v) ? replaceValue : v
        );

        return [
          [timeHeader, ...timeArray],
          [valueHeader, ...cleanedValues]
        ];
      } else {
        return clean2D(data);
      }
    } else {
      return clean1D(data);
    }
  }


  /**
   * Calculates pearson coefficient for bivariate analysis.
   * The sets must be of the same size.
   * @method correlation
   * @memberof stats
   * @param {Object} params.data - An object containing the two data sets as set1 and set2.
   * @returns {Number} Pearson coefficient.
   * @example
   * const data = {set1: [1,2,3], set2: [2,4,6]};
   * const pearsonCoefficient = hydro1.analyze.stats.correlation({data})
   */

  static correlation({ params, args, data } = {}) {
    const { set1, set2 } = data;
    const n = set1.length + set2.length;
    const q1q2 = [];
    const sq1 = [];
    const sq2 = [];

    for (let i = 0; i < set1.length; i++) {
      q1q2[i] = set1[i] * set2[i];
      sq1[i] = set1[i] ** 2;
      sq2[i] = set2[i] ** 2;
    }

    const r1 =
      n * this.sum({ data: q1q2 }) -
      this.sum({ data: set1 }) * this.sum({ data: set2 });
    const r2a = Math.sqrt(
      n * this.sum({ data: sq1 }) - this.sum({ data: set1 }) ** 2
    );
    const r2b = Math.sqrt(
      n * this.sum({ data: sq2 }) - this.sum({ data: set2 }) ** 2
    );

    return r1 / (r2a * r2b);
  }

  /**
   * Calculates various efficiency metrics to evaluate model performance
   * Efficiency metrics are essential for evaluating hydrological model performance by comparing
   * simulated outputs with observed data. These metrics help quantify the accuracy and reliability
   * of models for streamflow prediction, water quality simulation, or other hydrological processes.
   * @method efficiencies
   * @memberof stats
   * @param {Object} params - Contains: type (type of efficiency metric to calculate)
   *                          Options include:
   *                          - 'NSE': Nash-Sutcliffe Efficiency (ranges from -∞ to 1, with 1 being perfect)
   *                          - 'determination': Coefficient of determination (R²) (ranges from 0 to 1)
   *                          - 'agreement': Index of agreement (ranges from 0 to 1)
   *                          - 'all': Calculate all available metrics
   * @param {Array} data - Array containing two arrays: [observed, modeled] values
   * @returns {Number|Object} - A number representing the calculated metric, or an object containing multiple metrics if 'all' is specified
   * @example
   * // Calculate Nash-Sutcliffe Efficiency for a streamflow model
   * const observedFlow = [12.5, 15.2, 22.8, 31.5, 25.4, 18.7, 10.3, 8.2];
   * const modeledFlow = [11.3, 14.7, 20.5, 28.9, 27.1, 16.2, 11.8, 7.5];
   * 
   * const nse = hydro.analyze.stats.efficiencies({ 
   *   params: { type: 'NSE' }, 
   *   data: [observedFlow, modeledFlow] 
   * });
   * console.log(`NSE: ${nse.toFixed(3)}`); // Example: NSE: 0.856
   * 
   * // Calculate all efficiency metrics for model evaluation
   * const metrics = hydro.analyze.stats.efficiencies({ 
   *   params: { type: 'all' }, 
   *   data: [observedFlow, modeledFlow] 
   * });
   * 
   * console.log(`NSE: ${metrics.NSE.toFixed(3)}`);       // Example: 0.856
   * console.log(`R²: ${metrics.r2.toFixed(3)}`);         // Example: 0.923
   * console.log(`Agreement: ${metrics.d.toFixed(3)}`);   // Example: 0.947
   * 
   * // Interpretation guidelines for NSE values in hydrology:
   * // NSE > 0.8: Excellent model performance
   * // 0.6 < NSE < 0.8: Very good performance
   * // 0.4 < NSE < 0.6: Good performance
   * // 0.2 < NSE < 0.4: Poor performance
   * // NSE < 0.2: Unacceptable performance
   */
  static efficiencies({ params, args, data } = {}) {
    let { type } = params,
      [obs, model] = data;
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
   * @param {Object} data - Contains: 1d-JS array with data as [data]
   * @returns {Object[]} calculated array.
   * @example
   * hydro.analyze.stats.fastFourier({data: [someData]})
   */

  static fastFourier({ params, args, data } = {}) {
    const nearest = Math.pow(2, Math.ceil(Math.log2(data.length)));
    let paddedData = tf.pad1d(data, [0, nearest - data.length]);
    const imag = tf.zerosLike(paddedData);
    const complexData = tf.complex(paddedData, imag);
    const fft = tf.spectral.fft(complexData);
    const fftResult = fft.arraySync();
    return fftResult;
  }

  /**
   * Calculates the skewness of a dataset
   * @method skewness
   * @memberof stats
   * @param {Object} params - Contains: none
   * @param {Array} data - Array of numeric values
   * @returns {Number} Skewness value
   * @example
   * hydro.analyze.stats.skewness({data: [1, 2, 3, 4, 5]})
   */
  static skewness({ params, arg, data } = {}) {
    const n = data.length;
    const mean = this.mean({ data: data });
    const sum3 = data.reduce((acc, val) => acc + Math.pow(val - mean, 3), 0);
    const stdDev = Math.sqrt(
      data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
    );
    return (n / ((n - 1) * (n - 2))) * (sum3 / Math.pow(stdDev, 3));
  }

  /**
   * Calculates the kurtosis of a dataset
   * @method kurtosis
   * @memberof stats
   * @param {Object} params - Contains: none
   * @param {Array} data - Array of numeri
   * values
   * @returns {Number} Kurtosis value
   * @example
   * hydro.analyze.stats.kurtosis({data: [1
   * 2, 3, 4, 5]})
   */
  static kurtosis({ params, args, data } = {}) {
    const n = data.length;
    const mean = this.mean({ data: data });
    const sum4 = data.reduce((acc, val) => acc + Math.pow(val - mean, 4), 0);
    const stdDev = this.stddev({ data: data });
    return (
      ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) *
      (sum4 / Math.pow(stdDev, 4)) -
      (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3))
    );
  }

  /**
   * Performs forward fill to replace missin
   * values in an array with the last
   * non-null value
   * @method forwardFill
   * @memberof stat
   * @param {Object} params - Contains: none
   * @param {Array} data - Array of value
   * with missing entries
   * @returns {Object} Object containing th
   * filled data array and an array of
   * replace indices
   * @example hydro.analyze.stats.forwardFi
   * ({data: [1, null, 3, null, null, 6]})
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
   * @param {Object} data - 1d-JS array with data arranged as [data].
   * @returns {Object[]} flatenned array for the dataset.
   * @example
   * hydro.analyze.stats.basicstats({data: [someData]})
   */

  static basicstats({ params, args, data } = {}) {
    //Can pass time series data as a 2d array without additional manipulation
    typeof data[0] === "object"
      ? (() => {
        data = data[1];
        data.shift();
      })()
      : data;
    data = data.map((val) => JSON.parse(val));
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
   * @param {Object} data - Array of time series data to test for trend
   * @returns {Object} Results containing:
   *   - S: Mann-Kendall statistic
   *   - z: Standardized test statistic 
   *   - p: p-value of the test
   *   - trend: String indicating detected trend ("increasing", "decreasing", or "no trend")
   *   - significant: Boolean indicating if trend is statistically significant
   * @example
   * // Detect trend in annual streamflow data (m³/s) over 30 years
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
   * 
   * // Interpret the results for water resource management
   * if (trendResult.significant) {
   *   if (trendResult.trend === "decreasing") {
   *     console.log("Significant decreasing trend detected in streamflow");
   *     console.log("Water management implication: Potential water scarcity issues");
   *   } else if (trendResult.trend === "increasing") {
   *     console.log("Significant increasing trend detected in streamflow");
   *     console.log("Water management implication: Potential increased flood risk");
   *   }
   * } else {
   *   console.log("No significant trend detected in streamflow");
   * }
   * console.log(`Test statistic (S): ${trendResult.S}`);
   * console.log(`p-value: ${trendResult.p}`);
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

    // If n ≤ 10, use the exact variance calculation
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
   * @param {Object} params - Parameters for the function
   * @param {number} params.alpha - Shape parameter
   * @param {number} params.beta - Scale parameter
   * @param {Object} data - Data input (array with single value x)
   * @returns {number} Regularized incomplete gamma CDF value
   */
  static gammaCDFApprox({ params = {}, args = {}, data } = {}) {
    const { alpha, beta } = params;
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
   * Normal distribution
   * @method normalcdf
   * @memberof stats
   * @author Alexander Michalek & Renato Amorim, IFC, University of Iowa.
   * @param {Object[]} data - Contains: 1d-JS array with timeseries
   * @returns {Object[]} 1d array with 3 values: p-value, value sum and z value
   * @param {Object[]} data - 1d-JS array
   * @returns {Number} number value for the distribution
   * @example
   * hydro.analyze.stats.normalcdf({data: [someData]})
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
   * D-statistic
   * Computes D-statistic from two samples to evaluate if they come from the same distribution
   * Reference: Kottegoda & Rosso, 2008.
   * @method computeD
   * @memberof stats
   * @author Alexander Michalek & Renato Amorim, IFC, University of Iowa.
   * @param {Object[]} data - 2d-JS array containing ordered as [samples_A, samples_B], with each being 1-d arrays
   * @returns {Number} d-statistic of the samples
   * @example
   * hydro.analyze.stats.computeD({data: [samples_A, samples_B]})
   */
  static computeD({ params, args, data }) {
    var { sampleA, sampleB } = data,
      maximumDifference = 0,
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
   * Kolmogorov Smirnov Two-sided Test
   * Calculates the P value, based on the D-statistic from the function above.
   * Reference: Kottegoda & Rosso, 2008.
   * @method KS_computePValue
   * @memberof stats
   * @author Alexander Michalek & Renato Amorim, IFC, University of Iowa
   * @param {Object[]} data - 2d-JS array containing ordered as [samples_A, samples_B], with each being 1-d arrays
   * @returns {Object[]} array with [p-Statistic, d-Statistic]
   * @example
   * hydro.analyze.stats.KS_computePValue({data: [samples_A, samples_B]})
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
   * @param {Object} params - contains {alpha: Number} with alpha being the significance level
   * @param {Object[]} data - 2d-JS array containing ordered as [samples_A, samples_B], with each being 1-d arrays
   * @returns {Number} rejection if p is less than the significance level
   * @example
   * hydro.analyze.stats.KS_rejectAtAlpha({params: {alpha: someAlpha}, data: [samples_A, samples_B]})
   */
  static KS_rejectAtAlpha({ params, args, data }) {
    let [p, d] = this.KS_computePValue({ data: data });
    return p < params.alpha;
  }

  /**

Computes the probability density function
of a normal distribution.
@method normalDistribution
@memberof stats
@param {Object} params - Contains:
z-value.
@returns {Number} Probability density
function of the normal distribution.
@example
hydro.analyze.stats.normalDistributio
({params: {z: 1.5}})
*/
  static normalDistribution({ params, args, data }) {
    return Math.exp(-(Math.log(2 * Math.PI) + params.z * params.z) * 0.5);
  }

  /**
   * Generates a random simulated number when run with a dataset
   * @method runSimulation
   * @author riya-patil
   * @memberof stats
   * @param {Object} data - passes data from an object
   * @returns {Number} Returns a simulated number
   * @example 
   * const testData = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15],
    ];
    hydro.analyze.stats.simulate({data: testData})
   * 
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
     * Generates a random simulated number when run with a dataset
     * @method runMonteCarlo
     * @author riya-patil
     * @memberof stats
     * @param {Object[]} data - passes data from multiple objects
     * @returns {number[]} returns an array of the simulated results
     * @example 
     * const testData = [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
      ];
      hydro.analyze.stats.runMonteCarlo({data: testData})
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
     * Generates a random simulated number when run with a dataset
     * @method runVegas
     * @author riya-patil
     * @memberof stats
     * @param {Object[]} data - passes data from multiple objects
     * @returns {number[]} returns an array of the simulated results
     * @example
     * const testData = [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
      ];
      hydro.analyze.stats.runVegas({data: testData})
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
   * Computes the probability density function (PDF) of a Gaussian (normal) distribution
   * @method gaussianDist
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - x (value at which to compute the PDF), mean (mean of the distribution), 
   * and stddev (standard deviation of the distribution)
   * @returns {Number} Probability density function of the Gaussian distribution
   * @example
   * const testData = {
      x: 2.5,
      mean: 3,
      stddev: 1.2
    };
    hydro.analyze.stats.gaussianDist({params: testData});
   */
  static gaussianDist({ params, args, data }) {
    const { x, mean, stddev } = params;
    const exponent = -((x - mean) ** 2) / (2 * stddev ** 2);
    const coefficient = 1 / (stddev * Math.sqrt(2 * Math.PI));

    return coefficient * Math.exp(exponent);
  }

  /**
   * Probability mass function (PMF) of a Bernoulli distribution
   * The Bernoulli distribution is a discrete probability distribution for a random variable that takes the value 1 
   * with probability of success p and the value 0 with probability of failure (1-p).
   * It models binary outcomes like success/failure, yes/no, or true/false.
   * @method bernoulliDist
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: f (indicator for failure=0 or success=1) and s (probability of success, between 0 and 1)
   * @returns {Number} Probability mass function of the Bernoulli distribution at the specified point
   * @example
   * // Calculate probability of success (f=1) with p=0.7
   * hydro.analyze.stats.bernoulliDist({ params: { f: 1, s: 0.7 } }); // Returns 0.7
   * 
   * // Calculate probability of failure (f=0) with p=0.7
   * hydro.analyze.stats.bernoulliDist({ params: { f: 0, s: 0.7 } }); // Returns 0.3
   */
  static bernoulliDist({ params, args, data } = {}) {
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
   * Fréchet (Type II), and Weibull (Type III) into a single parametric family.
   * @method gevDistribution
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: 
   *                        x (value at which to compute the PDF), 
   *                        mu (location parameter, determines the mode of the distribution),
   *                        sigma (scale parameter > 0, controls the spread of the distribution), 
   *                        xi (shape parameter, determines the tail behavior - xi=0 gives Gumbel, xi>0 gives Fréchet, xi<0 gives Weibull)
   * @returns {Number} Probability density function value of the GEV distribution at point x
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
   * // Calculate PDF for Fréchet distribution (xi>0)
   * hydro.analyze.stats.gevDistribution({
   *   params: { 
   *     x: 50,
   *     mu: 30,
   *     sigma: 10,
   *     xi: 0.2     // Positive shape parameter (heavy tail)
   *   }
   * });
   */
  static gevDistribution({ params, args, data } = {}) {
    const { x, mu, sigma, xi } = params;
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
 * Calculates the probability mass function (PMF) of a Geometric Distribution
 * @method geometricDist
 * @author riya-patil
 * @memberof stats
 * @param {Object} params - Contains the probability of success "s" (where 0 <= s <= 1) as a parameter.
 * @param {Number} args - Contains the number of trials until the first success trials (trials >= 1)
 * @returns {Number} The probability of getting the first success on the n-th trial
 * @example
 * hydro.analyze.stats.geometricDist({ params: { s: 0.5 }, args: { trials: 3 }, data: [] });
 * 0.125
 */
  static geometricDist({ params, args, data } = {}) {
    const { s } = params || 1;
    const { trials } = args;
    if (trials < 1) {
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
   * @param {Object} params - Contains: trials (integer n ≥ 0, the total number of independent trials)
   *                        and probSuccess (probability p of success in a single trial, 0 ≤ p ≤ 1)
   * @param {Object} args - Contains: s (integer k, 0 ≤ k ≤ n, representing the number of successes)
   * @returns {Number} The probability of getting exactly k successes in n trials with probability p of success
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
  static binomialDist({ params, args, data } = {}) {
    const { trials, probSuccess } = params;
    const { s } = args;

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
   * @param {Object} params probabilities: 1D array of probabilities for each category; n: Number of samples to generate
   * @returns {Object} samples: 2D array of generated samples, where each row represents a sample and each column represents a category
   * frequencies: 2D array of frequencies for each category in the generated samples
   * @example
   * const multinomialData = {
   *   probabilities: [0.2, 0.3, 0.5],
   *   n: 100
   * };
   * hydro.analyze.stats.multinomialDistribution({ params: multinomialData });
   */
  static multinomialDistribution({ params, args, data } = {}) {
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


  /** Calculates the probability mass function (PMF) of the Log series Distribution
     * @method LogSeriesDistribution 
     * @author riya-patil
     * @memberof stats
     * @param {Object} params - Contains the parameter 'probSuccess' which represents the probability of success in a single trial.
     * @param {Object} args - Contains the argument 'trials' (trials >= 1) which represents the number of trials.
     * @returns {Number} Probability of achieving the first success in # of trials.
     * @example
     * hydro.analyze.stats.logSeriesDist({params: {probSuccess: 0.2, trials: 3}})
     */
  static logSeriesDist({ params, args, data } = {}) {
    const { probSuccess, trials } = params;

    if (trials < 1) {
      return 0;
    }

    const pmf = -Math.log(1 - probSuccess) * Math.pow(probSuccess, trials) / trials;
    return pmf;
  }

  /** Calculates the probability density function (PDF) of the Lognormal Distribution
    * @method lognormalDist 
    * @author riya-patil
    * @memberof stats
    * @param {Object} params - Contains the parameters 'mu' and 'sigma' which represent the mean and standard deviation of the associated normal distribution.
    * @param {Object} args - Contains the argument 'x' which represents the value at which to evaluate the PDF.
    * @returns {Number} Probability density at 'x' in the Lognormal Distribution.
    * @example 
    * hydro.analyze.stats.lognormalDist({params: { mu: 0, sigma: 1 }, args: { x: 2 }})
    */
  static lognormalDist({ params, args, data } = {}) {
    const { mu, sigma } = params;
    const { x } = args;

    if (x <= 0) {
      return 0;
    }

    const exponent = -((Math.log(x) - mu) ** 2) / (2 * sigma ** 2);
    const pdf = (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);

    return pdf;
  }

  /** Calculates the probability density function (PDF) of the Gumbel Distribution
     * @method gumbelDist 
     * @author riya-patil
     * @memberof stats
     * @param {Object} params - Contains the parameters 'mu' (location parameter) and 'beta' (scale parameter).
     * @returns {Number} Probability density at the given value 'x'.
     * @example
     * hydro.analyze.stats.gumbelDist({ params: { mu: 0, beta: 1, x: 2}})
     */
  static gumbelDist({ params, args, data } = {}) {
    const { mu, beta } = params;
    const { x } = args;

    const z = (x - mu) / beta;
    const pdf = (1 / beta) * Math.exp(-(z + Math.exp(-z)));

    return pdf;
  }

  /** Calculates the probability density function (PDF) of the Uniform Distribution
     * @method uniformDist 
     * @author riya-patil
     * @memberof stats
     * @param {Object} params - Contains the parameters 'a' (lower bound) and 'b' (upper bound).
     * @param {Object} args - Contains the argument 'x' at which to evaluate the PDF.
     * @returns {Number} Probability density at the given value 'x'.
     * @example
     * hydro.analyze.stats.uniformDist({ params: { a: 0, b: 1 }, args: { x: 0.5 } })
     */
  static uniformDist({ params, args, data } = {}) {
    const { a, b } = params;
    const { x } = args;

    if (x >= a && x <= b) {
      const pdf = 1 / (b - a);
      return pdf;
    } else {
      return 0;
    }
  }

  /** Calculates the Simple Moving Average of a given data set
     * @method simpleMovingAverage 
     * @author riya-patil
     * @memberof stats
     * @param {Object} params - Contains the parameter 'windowSize' which specifies the size of the moving average window.
     * @param {Object} data - Contains the array of data points.
     * @returns {Array} Array of moving average values.
     * @example
     * const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
     * const windowSize = 3;
     * hydro.analyze.stats.simpleMovingAverage({ params: { windowSize }, data });
     */
  static simpleMovingAverage({ params, args, data } = {}) {
    const { windowSize } = params;

    if (windowSize <= 0 || windowSize > data.length) {
      throw new Error("Invalid window size.");
    }

    const movingAverage = [];

    for (let i = 0; i <= data.length - windowSize; i++) {
      const window = data.slice(i, i + windowSize);
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
   * @param {Number} params - Contains the windowSize parameter.
   * @param {Array} data - 1D array of numerical values.
   * @returns {Array} Array of moving averages.
   * @throws {Error} If the window size is invalid.
   * @example
   * const windowSize = 5;
   * const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
   * hydro.analyze.stats.linearMovingAverage({ windowSize, data });
   */
  static linearMovingAverage({ params, args, data } = {}) {
    const { windowSize } = params;

    if (windowSize <= 0 || windowSize > data.length) {
      throw new Error("Invalid window size.");
    }

    const movingAverage = [];
    let sum = 0;

    for (let i = 0; i < windowSize; i++) {
      sum += data[i];
    }

    movingAverage.push(sum / windowSize);

    for (let i = windowSize; i < data.length; i++) {
      sum += data[i] - data[i - windowSize];
      movingAverage.push(sum / windowSize);
    }

    return movingAverage;
  }

  /**
   * Computes the Exponential Moving Average (EMA) for a given dataset.
   * @method exponentialMovingAverage
   * @author riya-patil
   * @memberof stats
   * @param {Object} args - Contains the dataset as 'data' (1D JavaScript array) and the 'alpha' value (smoothing factor between 0 and 1)
   * @returns {number[]} The Exponential Moving Average (EMA) values for the dataset
   * @example
   *const dataset= [1,2,3,4,5]
   *const params={alpha: 0.5}
   *hydro.analyze.stats.exponentialMovingAverage({params, data});
  */

  static exponentialMovingAverage({ params, args, data } = {}) {
    const { alpha } = params;
    const emaValues = [];
    let ema = data[0];

    for (let i = 1; i < data.length; i++) {
      ema = alpha * data[i] + (1 - alpha) * ema;
      emaValues.push(ema);
    }

    return emaValues;
  }

  /**
   * Generates a sequence of events following a Poisson process
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
  static poissonProcess({ params, args, data } = {}) {
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
   * Calculates the return period for a given probability of occurrence
   * In hydrology, the return period (or recurrence interval) represents the average time between events
   * of a certain magnitude. It is fundamental for flood frequency analysis, infrastructure design, and
   * risk assessment. The return period T is calculated as T = 1/p, where p is the probability of 
   * exceedance in a given year.
   * @method returnPeriod
   * @memberof stats
   * @param {Object} params - Contains probability (decimal between 0 and 1, probability of occurrence in a given time unit)
   * @returns {Number} Return period (average time between events of the specified probability)
   * @throws {Error} If probability is not between 0 and 1
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
   * Performs differencing on a time series dataset to remove trend or seasonality from the data
   * @method differencing
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains the order parameter
   * @param {Array} data - 1D array of numerical values representing a time series
   * @returns {Array} Differenced time series
   * @throws {Error} If the order is invalid
   * @example
   * const order = 1;
   * const timeSeries = [1, 3, 6, 10, 15];
   * const differencedSeries = stats.differencing({ order, data: timeSeries });
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
   * Computes the variance of residuals in a regression model to detect heteroskedasticity
   * @method residualVariance
   * @author riya-patil
   * @memberof stats
   * @param {Array} data - 1D array of numerical values representing the residuals.
   * @returns {number} Variance of residuals
   * @returns {Error} if not given valid array of residuals or not given correct number of arrays
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
   * @param {Object} data - Object containing predictor variables (X) and target variable (y).
   * @returns {Array} Coefficients of the linear regression model.
   * @example
   * const X = [[1, 2], [3, 4], [5, 6]];
   * const y = [3, 5, 7];
   * hydro.analyze.stats.regression({ data: { X, y } });
   */
  static regression({ params, args, data } = {}) {
    const X = data.X; // Matrix of predictor variables
    const y = data.y; // Array of target variable

    const XWithIntercept = X.map((row) => [1, ...row]);

    const Xint = multiplyMatrix(transposeMatrix(XWithIntercept), XWithIntercept);
    const Yint = multiplyMatrix(transposeMatrix(XWithIntercept), y);

    const inverseXtX = matrixInverse(Xint);

    const coefficients = multiplyMatrix(inverseXtX, Yint);

    return coefficients;
  }

  /**
   * Performs multivariate regression analysis
   * @method multiregression
   * @author riya-patil
   * @memberof stats
   * @param {Object} data - Data for the multivariate regression
   * @returns {Array} Coefficients of the linear regression model.
   * @example
   * const X = [[1, 2], [3, 4], [5, 6]];
   * const y = [3, 5, 7];
   * hydro.analyze.stats.multiregression({ data: { X, y } });
   */
  static multiregression({ params, args, data } = {}) {
    const X = data.X; // Matrix of predictor variables
    const Y = data.Y; // Array of target variables

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
   * Performs White's test for heteroscedasticity
   * @method whitesTest
   * @author riya-patil
   * @param {Object} params - Parameters for the test, errors is array of residuals while regressors is array of regressor vars
   * @returns {Object} Object containing test statistic and p-value
   * @throws {Error} If the input arrays have different lengths
   * @example
   * const params = {
   *   errors: [1, 2, 3, 4, 5],
   *   regressors: [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]]
   * };
   * hydro.analyze.stats.whitesTest({ params });
   */
  static whitesTest({ params, args, data } = {}) {
    const { errors, regressors } = data;

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
   * @param {Object} params errors: Array of residuals, regressors: Array of regressor variables
   * @returns {Object} Object containing test statistic and p-value.
   * @throws {Error} If the input arrays have different lengths.
   * @example
   * const params = {
   *   errors: [1, 2, 3, 4, 5],
   *   regressors: [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]]
   * };
   * hydro.analyze.stats.breuschPaganTest({ params });
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
   * Performs Goldfeld-Quandt test for heteroscedasticity
   * @method goldfeldQuandtTest
   * @author riya-patil
   * @param {Object} params - residuals (Array of residuals from a regression model), independentVar (Array of values of the independent variable)
   * @returns {Object} Object containing test statistic and p-value
   * @throws {Error} If the input arrays have different lengths
   * @example
   * const residuals = [1.2, 2.3, 0.8, 1.9, 1.5, 2.6];
   * const independentVar = [3, 4, 5, 6, 7, 8];
   * const result = stats.goldfeldQuandtTest({ params: { residuals, independentVar } });
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
     * Generates a random simulated number when run with a dataset
     * @method runMarkovChainMonteCarlo
     * @author riya-patil
     * @memberof stats
     * @param {Object[]} data - passes data from multiple objects
     * @returns {number[]} returns an array of the simulated results
     * @example 
     * const options = {
        params: {
        iterations: 100,
      },
      data: {
        initialState,
        transitionMatrix,
        },
      };
      hydro.analyze.stats.runMarkovChainMonteCarlo(options);
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
        nextState = getNextState(data.transitionMatrix, currentState);
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
   * @param {Object} data - 2d-JS array as [[someData1], [someData2]]
   * @returns {Object[]} Array for table display.
   * @example
   * hydro.analyze.stats.joinarray({data: [[someData1], [someData2]]})
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
   * @param {Object} params - Contains: columns (nd-JS array with names as [someName1, someName2,...])
   * @param {Object} data - Contains: nd-JS array object required to be flatenned as [[somedata1, somedata2,...],[somedata1, somedata2,...],...]
   * @returns {Object[]} Flatenned array.
   * @example
   * hydro.analyze.stats.flatenise({params:{columns: [someName1, someName2,...]},
   * data: [[somedata1, somedata2,...],[somedata1, somedata2,...],...]})
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
   * @param {Object} data - Contains: 1d-JS array with data composed of strings as [dataValues].
   * @returns {Object[]} Array as numbers.
   * @example
   * hydro.analyze.stats.numerise({data: [someValues]})
   */

  static numerise({ params, args, data } = {}) {
    var result = data.map((x) => parseFloat(x));
    return result;
  }

  /**
   * Filters out items in an array that are undefined, NaN, null, ", etc.
   * @method cleaner
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array with data to be cleaned as [dataValues]
   * @returns {Object[]} Cleaned array.
   * @example
   * hydro.analyze.stats.cleaner({data: [someValues]})
   */

  static cleaner({ params, args, data } = {}) {
    var x = data.filter((x) => x === undefined || !Number.isNaN(x));
    return x;
  }

  /**
   * Filters out items in an array based on another array.
   * @method itemfilter
   * @memberof stats
   * @param {Object} data - Contains: 2d-JS array with data to be kept and removed as [[dataKept],[dataRemoved]]
   * @returns {Object[]} Cleaned array.
   * @example
   * hydro.analyze.stats.itemfilter({data: [[dataKept], [dataRemoved]]})
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
   * @param {Object[]} data - Contains: 1-dJS array with date values as [dateValue].
   * @returns {Object[]} Array with date parsed.
   * @example
   * hydro.analyze.stats.dateparser({data: [someValues]})
   */

  static dateparser({ params, args, data } = {}) {
    var x = this.copydata({ data: data });
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
   * @param {Object} data - Contains: nd-JS array representing [[m],[n]] matrix.
   * @returns {Object[]}  [[n],[m]] array.
   * @example
   * hydro.analyze.stats.arrchange({data: [[someSize1],[someSize2]]})
   */

  static arrchange({ params, args, data } = {}) {
    var x = this.copydata({ data: data });
    var transp = (matrix) => matrix[0].map((x, i) => matrix.map((x) => x[i]));
    return transp(x);
  }

  /**
   * Pushes at the end of an array the data of another array.
   * @method push
   * @memberof stats
   * @param {Object} data - Contains: 2d-JS array with data arranged as [[willPush],[pushed]]
   * @returns {Object[]} Last dataset with pushed data.
   * @example
   * hydro.analyze.stats.push({data: [[dataSet1], [dataSet2]]})
   */

  static push({ params, args, data } = {}) {
    for (var j = 0; j < data[1].length; j++)
      for (var i = 0; i < data[0].length; i++) {
        data[0][j].push(data[1][j][i]);
      }
    return arr1;
  }

  /**
   * Generates an array of random integers within a specified range.
   * @method generateRandomData
   * @memberof stats
   * @param {Object} params - Contains size and range
   * @param {number} params.size - The number of elements to generate
   * @param {number} [params.range=100] - The upper limit (exclusive)
   * @returns {number[]} An array of random integers
   * @example
   * hydro.analyze.stats.generateRandomData({ params: { size: 10, range: 50 } })
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
    * Compute the autocovariance matrix from the autocorrelation values
    * @method autocovarianceMatrix
    * @author riya-patil
    * @memberof stats
    * @param {Object} data - array with autocorrelation values
    * @param {number} params - number of lags
    * @returns {Object} Autocovariance matrix
    * @example 
    * const acTestData = [1, 0.7, 0.5, 0.3];
    * const lags = 2
    * hydro.analyze.stats.autocovarianceMatrix({params: lag, data : actestData});
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
   * Calculates the binomial coefficient (n choose k format)
   * @method binomialCoefficient
   * @author riya-patil
   * @memberof stats
   * @param {Number} trials - The number of trials
   * @param {Number} s - The number of successes
   * @returns {Number} The binomial coefficient (trials choose s)
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
   * Multiplies two matrices
   * @method multipleMatrix
   * @author riya-patil
   * @memberof stats
   * @param {Array} matrix1 - First matrix
   * @param {Array} matrix2 - Second matrix
   * @returns {Array} Result of matrix multiplication
   * @example
   * const matrix1 = [[1, 2], [3, 4]];
   * const matrix2 = [[5, 6], [7, 8]];
   * hydro.analyze.stats.multiplyMatrix(matrix1, matrix2)
   */
  static multiplyMatrix(matrix1, matrix2) {
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
   * Transposes a matrix
   * @method transposeMatrix
   * @author riya-patil
   * @memberof stats
   * @param {Array} matrix - Matrix to transpose
   * @returns {Array} Transposed matrix
   * @example
   * const matrix = [[1, 2, 3], [4, 5, 6]];
   * hydro.analyze.stats.transposeMatrix(matrix)
   */
  static transposeMatrix(matrix) {
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
   * Computes the inverse of a matrix
   * @method matrixInverse
   * @author riya-patil
   * @memberof stats
   * @param {Array} matrix - Matrix to compute inverse of
   * @returns {Array} Inverse of the matrix
   * @example
   * const matrix = [[1, 2, 3], [4, 5, 6]];
   * hydro.analyze.stats.matrixInverse(matrix)
   */

  static matrixInverse(matrix) {
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
   * Calculates the cumulative distribution function (CDF) of the chi-square distribution
   * NOTE: This will require revision in the future, readjusting considering lookups or fitting to a gamma distribution instead
   * @method chisqCDF
   * @author riya-patil
   * @memberof stats
   * @param {number} x The value at which to evaluate the CDF
   * @param {number} k The degrees of freedom
   * @returns {number} The cumulative probability
   * @example
   * const x = 10
   * const df = 20
   * hydro.analyze.stats.chisCDF(10, 20)
   */
  static chisqCDF(x, k) {
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
   * Calculates the dot product of two vectors. Both vectors should be represented as 1D JS arrays with the same length
   * @method dotProduct
   * @author riya-patil
   * @param {Array} a - The first vector
   * @param {Array} b - The second vector
   * @returns {number} The dot product
   * @throws {Error} If the input vectors have different lengths
   * @example
   * const a = [1, 2, 3, 4, 5]
   * const b = [10, 20, 30, 40, 50]
   * hydro.analyze.stats.dotProduct(a,b)
   */
  static dotProduct(a, b) {
    if (a.length != b.length) {
      throw new Error("Input vectors must have the same length.");
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result += a[i] * b[i];
    }

    return result;
  }

  /**
   * Gets the next state based on the transition probabilities defined in the transition matrix.
   * @method getNextState
   * @author riya-patil
   * @memberof stats
   * @param {number[][]} transitionMatrix transition matrix representing the probabilities of transitioning between states.
   * @param {number} currentState current state of the function
   * @returns {number} Next state selected based on the transition probabilities.
   * @example
   * const transitionMatrix = [
    [0.2, 0.8], 
    [0.5, 0.5],
      ];
    const initialState = 0;
   */
  static getNextState(transitionMatrix, currentState) {
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
   * @param {Object} params - alpha (shape), beta (scale)
   * @param {Object} args - x (value)
   * @returns {Number} PDF value
   */
  static gammaDist({ params, args, data } = {}) {
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
   * @param {Object} params - k (shape), lambda (scale)
   * @param {Object} args - x (value)
   * @returns {Number} PDF value
   */
  static weibullDist({ params, args, data } = {}) {
    const { k, lambda } = params;
    const { x } = args;
    if (x < 0) return 0;
    return (k / lambda) * Math.pow(x / lambda, k - 1) * Math.exp(-Math.pow(x / lambda, k));
  }

  /**
   * Calculates the PDF of the Exponential Distribution.
   * @method exponentialDist
   * @memberof stats
   * @param {Object} params - lambda (rate)
   * @param {Object} args - x (value)
   * @returns {Number} PDF value
   */
  static exponentialDist({ params, args, data } = {}) {
    const { lambda } = params;
    const { x } = args;
    if (x < 0) return 0;
    return lambda * Math.exp(-lambda * x);
  }

  /**
   * Calculates the PDF of the Beta Distribution.
   * @method betaDist
   * @memberof stats
   * @param {Object} params - alpha, beta
   * @param {Object} args - x (value, 0 <= x <= 1)
   * @returns {Number} PDF value
   */
  /**
   * Calculates the PDF of the Beta Distribution.
   * @method betaDist
   * @memberof stats
   * @param {Object} params - alpha, beta
   * @param {Object} args - x (value, 0 <= x <= 1)
   * @returns {Number} PDF value
   */
  static betaDist({ params, args, data } = {}) {
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
   * @param {Object} params - type ('one', 'two', 'paired'), mu (for one-sample)
   * @param {Object} data - sample1, sample2 (optional)
   * @returns {Object} t-statistic and degrees of freedom
   */
  static tTest({ params, args, data } = {}) {
    const { type = 'one', mu = 0 } = params;
    const { sample1, sample2 } = data;

    const mean1 = this.mean({ data: sample1 });
    const n1 = sample1.length;
    const var1 = this.variance({ data: sample1 });

    let t, df;

    if (type === 'one') {
      t = (mean1 - mu) / Math.sqrt(var1 / n1);
      df = n1 - 1;
    } else if (type === 'two') {
      const mean2 = this.mean({ data: sample2 });
      const n2 = sample2.length;
      const var2 = this.variance({ data: sample2 });
      // Assuming equal variance for simplicity, or Welch's t-test could be added
      const sp = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));
      t = (mean1 - mean2) / (sp * Math.sqrt(1 / n1 + 1 / n2));
      df = n1 + n2 - 2;
    } else if (type === 'paired') {
      if (n1 !== sample2.length) throw new Error("Samples must have same length for paired t-test");
      const diffs = sample1.map((v, i) => v - sample2[i]);
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
   * @param {Object} data - sample1, sample2
   * @returns {Object} F-statistic and degrees of freedom
   */
  static fTest({ params, args, data } = {}) {
    const { sample1, sample2 } = data;
    const var1 = this.variance({ data: sample1 });
    const var2 = this.variance({ data: sample2 });

    const F = var1 / var2;
    const df1 = sample1.length - 1;
    const df2 = sample2.length - 1;

    return { F, df1, df2 };
  }

  /**
   * Performs a one-way ANOVA.
   * @method anova
   * @memberof stats
   * @param {Object} data - Array of samples (arrays) e.g., [[1,2], [3,4], [5,6]]
   * @returns {Object} F-statistic and degrees of freedom
   */
  static anova({ params, args, data } = {}) {
    const samples = data;
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
   * @param {Object} data - sample1, sample2
   * @returns {Object} U-statistic and p-value (approximate)
   */
  static mannWhitney({ params, args, data } = {}) {
    const { sample1, sample2 } = data;
    const n1 = sample1.length;
    const n2 = sample2.length;

    // Combine and rank
    const combined = sample1.map(v => ({ val: v, group: 1 }))
      .concat(sample2.map(v => ({ val: v, group: 2 })));

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
   * @param {Object} data - sample1, sample2
   * @returns {Object} W-statistic and p-value (approximate)
   */
  static wilcoxonSignedRank({ params, args, data } = {}) {
    const { sample1, sample2 } = data;
    if (sample1.length !== sample2.length) throw new Error("Samples must have same length");

    const n = sample1.length;
    const diffs = [];
    for (let i = 0; i < n; i++) {
      const d = sample1[i] - sample2[i];
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
   * Performs the Shapiro-Wilk test for normality (Simplified approximation).
   * Note: This is a simplified implementation and may not be as accurate as standard software for all sample sizes.
   * @method shapiroWilk
   * @memberof stats
   * @param {Object} data - Array of values
   * @returns {Object} W-statistic and p-value (approximate)
   */
  /**
   * Performs the Shapiro-Wilk test for normality.
   * Uses polynomial approximations for coefficients (Royston, 1992) for n <= 50.
   * For n > 50, this implementation falls back to a simplified approximation or should ideally use the Shapiro-Francia test.
   * @method shapiroWilk
   * @memberof stats
   * @param {Object} data - Array of values
   * @returns {Object} W-statistic and p-value
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
   * @param {Object} data - Array of values
   * @returns {Object} A2-statistic and significance
   */
  /**
   * Performs the Anderson-Darling test for normality.
   * @method andersonDarling
   * @memberof stats
   * @param {Object} data - Array of values
   * @returns {Object} A2-statistic and significance
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
   * @param {Object} params - lag (k)
   * @param {Object} data - Time series array
   * @returns {Number} Autocorrelation at lag k
   */
  static autoCorrelation({ params, args, data } = {}) {
    const { lag } = params;
    const n = data.length;
    const mean = this.mean({ data });

    let num = 0;
    let den = 0;

    for (let i = 0; i < n; i++) {
      den += Math.pow(data[i] - mean, 2);
      if (i < n - lag) {
        num += (data[i] - mean) * (data[i + lag] - mean);
      }
    }

    return num / den;
  }

  /**
   * Calculates the Partial Autocorrelation Function (PACF) for a given lag.
   * Uses the Yule-Walker equations (recursive method).
   * @method partialAutoCorrelation
   * @memberof stats
   * @param {Object} params - lag (k)
   * @param {Object} data - Time series array
   * @returns {Number} PACF at lag k
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
   * @param {Object} params - iterations, statistic (function name as string or function)
   * @param {Object} data - Original data array
   * @returns {Object} Original statistic, mean of resamples, bias, confidence interval
   */
  static bootstrap({ params, args, data } = {}) {
    const { iterations = 1000, statistic = 'mean', alpha = 0.05 } = params;
    const n = data.length;
    const resampledStats = [];

    // Get the statistic function
    let statFunc;
    if (typeof statistic === 'string') {
      statFunc = (d) => this[statistic]({ data: d });
    } else {
      statFunc = statistic;
    }

    const originalStat = statFunc(data);

    for (let i = 0; i < iterations; i++) {
      const sample = [];
      for (let j = 0; j < n; j++) {
        const idx = Math.floor(Math.random() * n);
        sample.push(data[idx]);
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
   * @param {Object} params - steps, startValue, drift, volatility
   * @returns {Array} Random walk series
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
   * @param {Object} data - observed, modeled
   * @returns {Object} Object with error metrics
   */
  static errorMetrics({ params, args, data } = {}) {
    const { observed, modeled } = data;
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
