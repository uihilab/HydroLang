import "../../../external/d3/d3.js";
import "../../../external/tensorflow/tensorflow.js";

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
   * Identifies gaps in data.
   * @method datagaps
   * @memberof stats
   * @param {Object} data - Contains: 1d-JS array with data as [data].
   * @returns {Number} Number of gaps in data.
   * @example
   * hydro.analyze.stats.gapid({data: [someData]})
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
    return d3.sum(data);
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
    return d3.mean(data);
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
    return d3.median(data);
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
    var mean = this.mean({ data: data }),
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
    return d3.variance(data);
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
    return d3.min(data);
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
    return d3.max(data);
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
   * Identify the outliers on a timeseries using interquartile range.
   * @method interouliers
   * @memberof stats
   * @param {Object} params - Contains: q1 (first quartile i.e. 0.25), q2 (second quartile i.e. 0.75)
   * @param {Object} data - Contains: 2d-JS array object with time series data as [[time], [data]].
   * @returns {Object[]} Array with outliers.
   * @example
   * hydro.analyze.stats.interoutliers({params: {q1: 'someNum', q2: 'someNum'}, data: [[time1, time2,...],[data1, data2,...]]})
   */

  static interoutliers({ params, args, data } = {}) {
    var q1 = params.q1,
      q2 = params.q2,
      or = this.copydata({ data: data }),
      time = [];

    if (!(q1 || q2)) {
      q1 = 0.25;
      q2 = 0.75;
    }

    switch (typeof data[0]) {
      case "object":
        time = this.copydata({ data: data[0] });
        or = this.copydata({ data: data[1] });
        break;
      default:
        break;
    }

    var Q_1 = this.quantile({ data: or, params: { q: q1 } }),
      Q_2 = this.quantile({ data: or, params: { q: q2 } }),
      IQR = Math.abs(Q_2 - Q_1),
      qd = Math.abs(Q_1 - 1.5 * IQR),
      qu = Math.abs(Q_2 + 1.5 * IQR),
      xa = (arra) => arra.filter((x) => x >= qd || x >= qu),
      re = xa(or);

    if (typeof data[0] != "object") {
      return re;
    } else {
      var t = [];
      for (var j = 0; j < or.length; j++) {
        if (or[j] >= qd || or[j] >= qu) {
          t.push(time[j]);
        }
      }
      return [t, re];
    }
  }

  /**
   * Identifies outliers in a timeseries dataset by normalizing the data given two thresholds.
   * If the thresholds are not included then a lower value of -0.5 and high value of 0.5 are used.
   * @method normoutliers
   * @memberof stats
   * @param {Object} params - Contains: low (threshold as number), high (threshold as number)
   * @param {Object} data - Contains: 2d-JS array with time series data as [[time],[data]].
   * @returns {Object[]} arr - array with outliers.
   * @example
   * hydro.analyze.stats.normoutliers({params: {high: 'someValue', low: 'someValue'}, data: [[time1, time2,...], [data1, data2,...]]})
   */

  static normoutliers({ params, args, data } = {}) {
    var high,
      low,
      or = this.copydata({ data: data }),
      time = [];
    if (!(params.low || params.high)) {
      low = -0.5;
      high = 0.5;
    }

    switch (typeof data[0]) {
      case "object":
        time = this.copydata({ data: data[0] });
        or = this.copydata({ data: data[1] });
        break;
      default:
        break;
    }

    var t1 = low,
      t2 = high;
    (out = []), (stnd = this.standardize({ data: or }));

    for (var i = 0; i < or.length; i++) {
      if (stnd[i] < t1 || stnd[i] > t2) {
        out.push(or[i]);
      }
    }

    if (typeof data[0] != "object") {
      return out;
    } else {
      var t = [];
      for (var j = 0; j < stnd.length; j++) {
        if (stnd[j] < t1 || stnd[j] > t2) {
          t.push(time[j]);
        }
      }
      return [t, out];
    }
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
   * @param {Object} data - Contains: 2d-JS array with datasets to be compared as [[dataSet1], [dataSet2]]
   * @returns {Number} Pearson coefficient.
   * @example
   * hydro.analyze.stats.correlation({data: [[dataSet1], [dataSet2]]})
   */

  static correlation({ params, args, data } = {}) {
    var q1 = data[0],
      q2 = data[1],
      n = q1.length + q2.length,
      q1q2 = [],
      sq1 = [],
      sq2 = [];

    for (var i = 0; i < q1.length; i++) {
      q1q2[i] = q1[i] * q2[i];
      sq1[i] = q1[i] * q1[i];
      sq2[i] = q2[i] * q2[i];
    }
    var r1 =
        n * this.sum({ data: q1q2 }) -
        this.sum({ data: q1 }) * this.sum({ data: q2 }),
      r2a = Math.sqrt(
        n * this.sum({ data: sq1 }) - Math.pow(this.sum({ data: q1 }), 2)
      ),
      r2b = Math.sqrt(
        n * this.sum({ data: sq2 }) - Math.pow(this.sum({ data: q2 }), 2)
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
   * @param {Object} params - Contains: type ('NSE','determination', 'agreement')
   * @param {Object} data - Contains: 2d-JS array with values arranged as [[observed], [model]]
   * @returns {Number} Calculated metric
   * @example
   * hydro.analyze.stats.efficiencies({params: {type: 'someType'}, data: [[observed], [model]]})
   */

  static efficiencies({ params, args, data } = {}) {
    var obs = data[0],
      model = data[1],
      meanobs = this.mean({ data: obs }),
      meanmodel = this.mean({ data: model }),
      diff1 = [],
      diff2 = [];

    //calculate nash sutcliffe efficiency
    if (params.type == "NSE") {
      for (var i = 0; i < obs.length; i++) {
        diff1[i] = Math.pow(model[i] - obs[i], 2);
        diff2[i] = Math.pow(obs[i] - meanobs, 2);
      }
      var NSE = 1 - this.sum({ data: diff1 }) / this.sum({ data: diff2 });
      return NSE;
    }

    //calculate coefficient of determination r2
    else if (params.type == "determination") {
      var diff3 = [];
      for (var i = 0; i < obs.length; i++) {
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
      var r = Math.pow(
        this.sum({ data: diff1 }) /
          (Math.sqrt(this.sum({ data: diff2 })) *
            Math.sqrt(this.sum({ data: diff3 }))),
        2
      );
      return r;
    }

    //calculate index of agreement d
    else if (params.type == "agreement") {
      for (var i = 0; i < obs.length; i++) {
        diff1[i] = Math.pow(obs[i] - model[i], 2);
        diff2[i] = Math.pow(
          Math.abs(model[i] - meanobs) + Math.abs(obs[i] - meanobs),
          2
        );
      }
      var d = 1 - this.sum({ data: diff1 }) / this.sum({ data: diff2 });
      return d;
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

  static fastfourier({ params, args, data } = {}) {
    tf.setBackend("webgl");
    for (var i = 0; i < data.length; i++) {
      data[i] = Math.round(data[i] + 5);
    }
    const _arr = data,
      results = _arr.map((n) => {
        for (let i = 0; i < 100; i++) {
          const real = tf.ones([10, n * 10]),
            imag = tf.ones([10, n * 10]),
            input = tf.complex(real, imag),
            res = tf.spectral.fft(input);
          res.dataSync();
        }
      });
    return results;
  }

  static skewness({params, arg, data} = {}) {
      const n = data.length;
      const mean = this.mean({data: data})
      const sum3 = data.reduce((acc, val) => acc + Math.pow(val - mean, 3), 0);
      const stdDev = Math.sqrt(data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n);
      return (n / ((n - 1) * (n - 2))) * (sum3 / Math.pow(stdDev, 3));
  }

  static kurtosis({params, args, data} ={}) {
    const n = data.length;
    const mean = this.mean({data: data})
    const sum4 = data.reduce((acc, val) => acc + Math.pow(val - mean, 4), 0);
    const stdDev = this.stddev({data: data})
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * (sum4 / Math.pow(stdDev, 4)) - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  static forwardFill({params, args, data } = {}) {
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
    typeof data[0] === 'object' ? (() => {data = data[1]; data.shift()})(): data
    data = data.map(val => JSON.parse(val))
    //if value is outside the values required from the api call
    data = data.map(val => {val > 99998 ? val = 0 : val; return val})
    var temp = [], values = [];
    //call the basic functions for analysis.
    values.push("Value")
    values.push(data.length);
    values.push(this.min({ data: data }));
    values.push(this.max({ data: data }));
    values.push(this.sum({ data: data }));
    values.push(this.mean({ data: data }));
    values.push(this.median({ data: data }));
    values.push(this.stddev({ data: data }));
    values.push(this.variance({ data: data }));
    values.push(this.skewness({data: data}));
    values.push(this.kurtosis({data: data}));

    temp.push(["Metric", "Number of values", "Minimum Value", "Maximum value", "Sum", "Mean", "Median", "Standard deviation", "Variance", "Skewness", "Kurtosis"])
    temp.push(values)
    return temp
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
    var X = data,
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
    return Prob;
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
    var samples_A = data[0],
      samples_B = data[1],
      maximumDifference = 0,
      N = 1e3;
    let minimum = d3.min(samples_A.concat(samples_B)),
      maximum = d3.max(samples_A.concat(samples_B)),
      N_A = samples_A.length,
      N_B = samples_B.length;

    for (var x of d3.range(minimum, maximum, (maximum - minimum) / N)) {
      var CDF_A = samples_A.filter((d) => d <= x).length / N_A,
        CDF_B = samples_B.filter((d) => d <= x).length / N_B,
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
      d = this.computeD({data: [samples_A, samples_B]}),
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
   * Returns the a normal distribution PDF
   * @method normalDistribution
   * @param {Object} params - contains {z: Number}
   * 
   */
  static normalDistribution({params, args, data}) {
    return Math.exp(-(Math.log(2 * Math.PI) + params.z * params.z) * 0.5)
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

  /**********************************/
  /*** End of Helper functions **/
  /**********************************/
}
