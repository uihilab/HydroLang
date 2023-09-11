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
  static range({ params, args, data } = {}) {
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

  static gapremoval({ params, args, data } = {}) {
    var arr = data,
      or = this.copydata({ data: arr }),
      val;

    if (typeof or[0] != "object") {
      val = this.cleaner({ data: or });
    } else {
      var time = or[0],
        ds = or[1];
      for (var i = 0; i < ds.length; i++) {
        if (ds[i] === undefined || Number.isNaN(ds[i]) || ds[i] === false) {
          delete time[i];
        }
      }
      val = this.cleaner({ data: ds });
      time = this.cleaner({ data: time });
      return [time, val];
    }
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
      var xo = [];
    }
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

  static outremove({ params, args, data } = {}) {
    var out,
      p1 = args.p1,
      p2 = args.p2;

    if (params.type === "normalized") {
      out = this.normoutliers({ params: { low: p1, high: p2 }, data: data });
    } else {
      out = this.interoutliers({ params: { q1: p1, q2: p2 }, data: data });
    }

    if (typeof data[0] != "object") {
      return this.itemfilter(arr, out);
    } else {
      var t = this.itemfilter(arr[0], out[0]),
        or = this.itemfilter(arr[1], out[1]);

      return [t, or];
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
   * Calculates different types of efficiencies for hydrological models: Nash-Sutcliffe, Coefficient of Determination and Index of Agreement.
   * Only accepts 1D array of observed and model data within the same time resolution.
   * Range of validity: Nash-Sutcliffe: between 0.6-0.7 is acceptable, over 0.7 is very good.
   * Determination coefficient: between 0 and 1, 1 being the highest with no dispersion between the data sets and 0 meaning there is no correlation.
   * Index of agrement: between 0 and 1, with more than 0.65 being considered good.
   * All efficiencies have limitations and showcase statistically the well performance of a model, but should not be considered as only variable for evaluation.
   * @method efficiencies
   * @memberof stats
   * @param {Object} options - The options object.
   * @param {Object} options.params - An object containing the type of efficiency to calculate ('NSE','determination', 'agreement', 'all').
   * @param {Object} options.data - A 2D array with values arranged as [[observed], [model]].
   * @param {Array} [options.args] - An optional array of additional arguments to pass to the function.
   * @returns {Number|Object} - A number representing the calculated metric, or an object containing multiple metrics if 'all' is specified.
   * @example
   * // Calculate Nash-Sutcliffe efficiency:
   * const obs = [1, 2, 3];
   * const model = [1.5, 2.5, 3.5];
   * const NSE = hydro.analyze.stats.efficiencies({ params: { type: 'NSE' }, data: [obs, model] });
   *
   * // Calculate all efficiencies:
   * const metrics = hydro.analyze.stats.efficiencies({ params: { type: 'all' }, data: [obs, model] });
   * // metrics = { NSE: 0.72, r2: 0.5, d: 0.62 }
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
   * hydro.analyze.stats.fastfourier({data: [someData]})
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
   * @method skewnes
   * @memberof stat
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
   * @method kurtosi
   * @memberof stat
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
   * @method forwardFil
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
   * Mann-Kendall trend test
   * Checks for mononicity of data throughout time.
   * Reference: Kottegoda & Rosso, 2008.
   * @method MK
   * @memberof stats
   * @author Alexander Michalek & Renato Amorim, IFC, University of Iowa.
   * @param {Object[]} data - Contains: 1d-JS array with timeseries
   * @returns {Object[]} 1d array with 3 values: p-value, value sum and z value
   * @example
   * hydro.analyze.stats.MK({data: [someData]})
   */

  static MK({ params, args, data }) {
    var flow = data,
      S_sum = 0,
      S = 0,
      sign = 0,
      z = 0,
      sigma = 0;

    for (var i = 0; i < flow.length - 1; i++) {
      for (var j = i + 1; j < flow.length; j++) {
        sign = flow[j] - flow[i];
        if (sign < 0) {
          S = -1;
        } else if (sign == 0) {
          S = 0;
        } else {
          S = 1;
        }
        S_sum = S_sum + S;
      }
    }
    sigma = (flow.length * (flow.length - 1) * (2 * flow.length + 5)) / 18;

    if (S_sum < 0) {
      z = (S_sum - 1) / Math.pow(sigma, 0.5);
    } else if (S_sum == 0) {
      z = 0;
    } else {
      z = (S_sum + 1) / Math.pow(sigma, 0.5);
    }
    var pvalue = 2 * (1 - this.normalcdf({ data: Math.abs(z) }));

    return [pvalue, S_sum, z];
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
   * @method bernoulliDist
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: x (value at which to compute the PMF) and p (probability of success)
   * @returns {Number} Probability mass function of the Bernoulli distribution
   * 
   */
  static bernoulliDist({params, args, data} = {}) {
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
   * Computes the probability density function (PDF) of the Generalized Extreme Value (GEV) distribution.
   * @method gevDistribution
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains: 
   * x (value at which to compute the PDF), mu (location parameter), 
   * sigma (scale parameter), xi (shape parameter).
   * @returns {Number} Probability density function of the GEV distribution.
   */
  static gevDistribution({params, args, data} = {}) {
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
static geometricDist({params, args, data} = {}) {
  const { s } = params || 1;
  const { trials } = args;
  if (trials < 1) {
    return 0;
  }
  return (1 - s) ** (trials - 1) * s;
}

/**
 * Calculates the probability mass function (PMF) of a Binomial Distribution.
 * @method binomialDist
 * @author riya-patil
 * @memberof stats
 * @param {Object} params - Contains the number of trials 'n' (n >= 0) and the probability of success 
 * @param {Object} args - Contains the number of successes 's'
 * @param {Array} data - Empty array as no data is needed for this calculation.
 * @returns {Number} The probability of getting exactly 's' successes in trials.
 * @example
 * hydro.analyze.stats.binomialDist({ params: { trials: 10, probSuccess: 0.5 }, args: { s: 3 });
 */
static binomialDist({params, args, data} = {}) {
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
static multinomialDistribution({params, args, data} = {}) {
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
    frequencies.push(this.frequency({data : sample}));
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
static logSeriesDist({params, args, data} = {}) {
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
 static lognormalDist({params, args, data} = {}) {
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
static gumbelDist({params, args, data} = {}) {
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
static uniformDist({params, args, data} = {}) {
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
static simpleMovingAverage({params, args, data} = {}) {
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
static linearMovingAverage({params, args, data} = {}) {
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

static exponentialMovingAverage({params, args, data} = {}) {
  const { alpha } = params;
  const { dataset } = data;
  const emaValues = [];
  let ema = dataset[0];

  for (let i = 1; i < dataset.length; i++) {
    ema = alpha * dataset[i] + (1 - alpha) * ema;
    emaValues.push(ema);
  }

  return emaValues;
}

/**
 * Generates a sequence of events representing a Poisson Process
 * @method poissonProcess
 * @author riya-patil
 * @memberof stats
 * @param {Object} params -  Contains the type of Poisson process ('homogeneous' or 'nonhomogeneous') and the time period 'T'.
 * @param {Object} args - Additional arguments depending on the type of Poisson process.
 * @returns {Array} Array of event times.
 * @example
 * hydro.analyze.stats.poissonProcess({ params: { type: 'homogeneous', T: 10 }, args: { lambda: 2 } });
 * hydro.analyze.stats.poissonProcess({ params: { type: 'nonhomogeneous', T: 10 }, args: { rateFunction: (t) => Math.sin(t) } });
 */
static poissonProcess({params, args, data} = {}) {
  const { type = 'homogeneous', T } = params;
  const { lambda, rateFunction } = args;

  const events = [];
  let t = 0;

  while (t < T) {
    const rand = Math.random();
    const interTime = (type === 'homogeneous' ? -1 / lambda : -1 / rateFunction(t)) * Math.log(1 - rand);
    t += interTime;

    if (t < T) {
      if (type === 'homogeneous' || Math.random() <= rateFunction(t) / rateFunction(T)) {
        events.push(t);
      }
    }
  }

  return events;
}

/**
   * Generates random numbers following a Log Pearson Type III distribution.
   * @method logPearsonTypeIII
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains the parameters 'mu' 'sigma' and 'gamma'.
   * @param {Number} size - Number of random numbers to generate.
   * @returns {Array} Array of random numbers following the Log Pearson Type III distribution.
   * @example
   * hydro.analyze.stats.logPearsonTypeIII({ params: { mu: 1, sigma: 2, gamma: 3 }, args: { size: 100 } })
   */
static logPearsonTypeIII({params, args, data} = {}) {
  const { mu, sigma, gamma } = params;
  const { size } = args || 10;
  const randomNumbers = [];

  for (let i = 0; i < size; i++) {
    const rand1 = Math.random();
    const rand2 = Math.random();
    const x = Math.sqrt(-2 * Math.log(rand1)) * Math.cos(2 * Math.PI * rand2);
    const y = mu + sigma * (x / Math.sqrt(gamma));
    const z = Math.exp(y);

    randomNumbers.push(z);
  }

  return randomNumbers;
}

 /**
   * Generates random numbers from within a Box Plot distribution.
   * @method boxPlotDistribution
   * @author riya-patil
   * @memberof stats
   * @param {Object} params - Contains the parameters 'min', 'q1', 'median', 'q3', 'max'.
   * @param {Object} args - Contains the argument 'size' for the number of random numbers to generate.
   * @returns {Array} Array of random numbers following the Box Plot Distribution.
   * @example
   * hydro.analyze.stats.boxPlotDistribution({ params: { min: 1, q1: 2, median: 3, q3: 4, max: 5 }, args: { size: 100 }})
   */
 static boxPlotDistribution({params, args, data} = {}) {
  const { min, q1, median, q3, max } = params;
  const { size } = args;
  const randomNumbers = [];

  for (let i = 0; i < size; i++) {
    const randNum = Math.random();
    let value;

    if (randNum < 0.25) {
      value = min - (q1 - min) * Math.random();
    } else if (randNum < 0.5) {
      value = q1 + (median - q1) * Math.random();
    } else if (randNum < 0.75) {
      value = median + (q3 - median) * Math.random();
    } else {
      value = q3 + (max - q3) * Math.random();
    }

    randomNumbers.push(value);
  }

  return randomNumbers;
}

/**
 * Mean Squared Error (MSE) Estimation - Computes the Mean Squared Error (MSE) between two datasets
 * @method meanSquaredError
 * @author riya-patil
 * @memberof stats
 * @param {Object} args - Contains the two datasets as 'data1' and 'data2' (1D JavaScript arrays)
 * @returns {number} The Mean Squared Error (MSE) between the two datasets
 * @example
 * const dataset1 = [1, 2, 3, 4, 5];
 * const dataset2 = [1.5, 2.8, 3.6, 4.2, 4.9];
 * hydro.analyze.stats.meanSquaredError({ data: { data1: dataset1, data2: dataset2 } });
 */

static meanSquaredError({params, args, data} = {}) {
  const { data1, data2 } = data;

  if (data1.length !== data2.length) {
    throw new Error('Datasets need to have same length');
  }

  const n = data1.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const diff = data1[i] - data2[i];
    sum += diff * diff;
  }

  const mse = sum / n;
  return mse;
}

/**
 * Return Period - Calculates the return period for a given probability of occurrence.
 * @method returnPeriod
 * @author riya-patil
 * @memberof stats
 * @param {Object} params - probability: Probability of occurrence (between 0 and 1)
 * @returns {Number} Return period corresponding to the given probability
 * @example
 * const returnPeriodData = {
 *   probability: 0.1
 * };
 * hydro.analyze.stats.returnPeriod({ params: returnPeriodData });
 */
static returnPeriod({params, args, data} = {}) {
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
static differencing({params, args, data} = {}) {
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
static residualVariance({params, args, data} = {}) {
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
static regression({params, args, data} = {}) {
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
static multiregression({params, args, data} = {}) {
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
static whitesTest({ params, args, data }) {
  const { errors, regressors } = params;

  if (errors.length !== regressors.length) {
    throw new Error("Input arrays must have the same length.");
  }

  const n = errors.length;
  const k = regressors[0].length;

  let XX = 0;
  let XE = 0;
  let EE = 0;

  for (let i = 0; i < n; i++) {
    const error = errors[i];
    const regressor = regressors[i];

    XX += dotProduct(regressor, regressor);
    XE += dotProduct(regressor, error);
    EE += error ** 2;
  }

  const testStatistic = n * (XE ** 2) / (XX * EE);
  const pValue = 1 - chisqCDF(testStatistic, k);

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
static breuschPaganTest({ params }) {
  const { errors, regressors } = params;

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

    const dotProduct = dotProduct(regressor, regressor);
    XX += dotProduct;
    XR += dotProduct * residualSquared;
    RR += residualSquared ** 2;
  }

  const testStatistic = (n / 2) * (Math.log(XR) - (1 / n) * Math.log(XX));
  const pValue = 1 - chisqCDF(testStatistic, k);

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
static goldfeldQuandtTest({ params, args, data }) {
  const { residuals, independentVar } = params;

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

  const pValue = 1 - chisqCDF(testStatistic, k - 1);

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
   * @param {number} size - The number of
   * elements in the array to be generated.
   * @param {number} [range=100] - The upper
   * limit (exclusive) of the range from which
   * the random integers will be generated.
   * @returns {number[]} An array of random
   * integers between 0 and range-1, of length
   * size.
   * @example
   * hydro.analyze.stats.generateRandomDat
   * (10, 50) // returns [23, 48, 15, 9, 36,
   * 28, 39, 18, 20, 22]
   */
  static generateRandomData(size, range = 100) {
    let data = [];
    for (let i = 0; i < size; i++) {
      data.push(Math.floor(Math.random() * range)); // generates a random integer between 0 and 99
    }
    return data;
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
 static autocorrelationAndCovarianceMatrix({ params, args, data } = {}) {
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
  const term = Math.exp(-x / 2);
  let sum = term;
  for (let i = 1; i < k; i++) {
    const prevTerm = term;
    term *= x / (2 * (i + 1));
    sum += term;
    if (term === prevTerm) break;
  }
  return 1 - sum;
}

/**
 * Calculates the dot product of two vectors
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
  if (a.length !== b.length) {
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

  /**********************************/
  /*** End of Helper functions **/
  /**********************************/
}
