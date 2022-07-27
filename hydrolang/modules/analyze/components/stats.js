import "../../../external/d3/d3.js";
import "../../../external/tensorflow/tensorflow.js";

/**
 * Main class used for statistical analyses and data cleaning.
 * @class stats
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
    var arr;
    var values;
    var keys;

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
    var arr = data;
    var or;
    var gap = 0;

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
    var arr = data;
    var or = this.copydata({ data: arr });
    var val;

    if (typeof or[0] != "object") {
      val = this.cleaner({ data: or });
    } else {
      var time = or[0];
      var ds = or[1];
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
    var timestep = params.timestep;
    var arr = data;
    var or = this.copydata({ data: arr });

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

    var gaps = 0;
    var loc = [];

    //timestep and total duration in minutes.
    var time = timestep;
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
    var or = this.copydata({ data: data });

    if (typeof data[0] === "object") {
      or = this.copydata({ data: data[0] });
    }

    var datetr = [];

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
    var sum = d3.sum(data);
    return sum;
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
    var m = d3.mean(data);
    return m;
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
    var m = d3.median(data);
    return m;
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
    var mean = this.mean({ data: data });
    var SD = 0;
    var nex = [];
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
    var vari = d3.variance(data);
    return vari;
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
    var sum = 0;
    var i = data.length;
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
    var low = d3.min(data);
    return low;
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
    var _arr = this.copydata({ data: data });
    var counter = {};
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
    var _arr = [];
    var stddev = this.stddev({ data: data });
    var mean = this.mean({ data: data });
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
      var b = Math.floor(p);
      var rest = p - b;
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
    var q1 = params.q1;
    var q2 = params.q2;
    if (!(q1 || q2)) {
      q1 = 0.25;
      q2 = 0.75;
    }

    var or = this.copydata({ data: data });
    var time = [];

    switch (typeof data[0]) {
      case "object":
        time = this.copydata({ data: data[0] });
        or = this.copydata({ data: data[1] });
        break;
      default:
        break;
    }

    var Q_1 = this.quantile({ data: or, params: { q: q1 } });
    var Q_2 = this.quantile({ data: or, params: { q: q2 } });
    var IQR = Math.abs(Q_2 - Q_1);

    var qd = Math.abs(Q_1 - 1.5 * IQR);
    var qu = Math.abs(Q_2 + 1.5 * IQR);

    var xa = (arra) => arra.filter((x) => x >= qd || x >= qu);
    var re = xa(or);

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
    var high, low;
    if (!(params.low || params.high)) {
      low = -0.5;
      high = 0.5;
    }

    var or = this.copydata({ data: data });
    var time = [];

    switch (typeof data[0]) {
      case "object":
        time = this.copydata({ data: data[0] });
        or = this.copydata({ data: data[1] });
        break;
      default:
        break;
    }

    var t1 = low;
    var t2 = high;

    var out = [];
    var stnd = this.standardize({ data: or });

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
    var out;
    var p1 = args.p1;
    var p2 = args.p2;

    if (params.type === "normalized") {
      out = this.normoutliers({ params: { low: p1, high: p2 }, data: data });
    } else {
      out = this.interoutliers({ params: { q1: p1, q2: p2 }, data: data });
    }

    if (typeof data[0] != "object") {
      return this.itemfilter(arr, out);
    } else {
      var t = this.itemfilter(arr[0], out[0]);
      var or = this.itemfilter(arr[1], out[1]);

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
    var q1 = data[0];
    var q2 = data[1];
    var n = q1.length + q2.length;
    var q1q2 = [];
    var sq1 = [];
    var sq2 = [];
    for (var i = 0; i < q1.length; i++) {
      q1q2[i] = q1[i] * q2[i];
      sq1[i] = q1[i] * q1[i];
      sq2[i] = q2[i] * q2[i];
    }
    var r1 =
      n * this.sum({ data: q1q2 }) -
      this.sum({ data: q1 }) * this.sum({ data: q2 });
    var r2a = Math.sqrt(
      n * this.sum({ data: sq1 }) - Math.pow(this.sum({ data: q1 }), 2)
    );
    var r2b = Math.sqrt(
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
    var obs = data[0];
    var model = data[1];
    var meanobs = this.mean({ data: obs });
    var meanmodel = this.mean({ data: model });

    var diff1 = [];
    var diff2 = [];

    //calculate nash sutcliffe effiency
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
    const _arr = data;
    const results = _arr.map((n) => {
      const tensors = [];
      const start = performance.now();
      console.log(start);
      for (let i = 0; i < 100; i++) {
        const real = tf.ones([10, n * 10]);
        const imag = tf.ones([10, n * 10]);
        const input = tf.complex(real, imag);
        const res = tf.spectral.fft(input);
        res.dataSync();
      }
      return performance.now() - start;
    });
    return results;
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
    //call the basic functions for analysis.
    var count = data.length;
    var min = this.min({ data: data });
    var max = this.max({ data: data });
    var sum = this.sum({ data: data });
    var mean = this.mean({ data: data });
    var median = this.median({ data: data });
    var std = this.stddev({ data: data });
    var vari = this.variance({ data: data });

    var statparams = [
      ["Number of values", count],
      ["Minimum value", min],
      ["Maximum", max],
      ["Sum", sum],
      ["Mean", mean],
      ["Median", median],
      ["Standard deviation", std],
      ["Variance", vari],
    ];

    //flatenise the data for graphing.
    var statx = this.flatenise({
      params: { columns: ["Metric", "Value"] },
      data: statparams,
    });
    return statx;
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
