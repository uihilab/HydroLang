import "../../../modules/d3/d3.js";
import "../../../modules/tensorflow/tensorflow.js";

/**
 * Main class used for statistical analyses and data cleaning.
 * @class stats
 */
export default class stats {
  /**
   * Makes a deep copy of original data for further manipulation.
   * @method copydata
   * @memberof stats
   * @param {Object}  data - original data.
   * @returns {Object} Deep copy of original data.
   * @example var copy = hydro1.analyze.stats.copydata(data)
   */

  static copydata(data) {
    var arr;
    var values;
    var keys;

    if (typeof data !== "object" || data === null) {
      return data;
    }

    arr = Array.isArray(data) ? [] : {};

    for (keys in data) {
      values = data[keys];

      arr[keys] = this.copydata(values);
    }

    return arr;
  };

  /**
   * Retrieves a 1D array with the data.
   * @method onearray
   * @memberof stats
   * @param {Object[]} data - array object.
   * @returns {Object[]} Array object.
   * @example var copy = hydro1.analyze.stats.onearray(data)
   */

  static onearray(data) {
    var arr = [];
    arr.push(data[1]);
    return arr;
  };

  /**
   * Identifies gaps in data.
   * @method datagaps
   * @memberof stats
   * @param {Object[]} arr - array object with data.
   * @returns {number} Number of gaps in data.
   * @example var gaps = hydro1.analyze.stats.gapid(arr)
   */

  static datagaps(arr) {
    var or;
    var gap = 0;

    if (typeof arr[0] != "object") {
      or = this.copydata(arr);
    } else {
      or = this.copydata(arr[1]);
    }
    for (var i = 0; i < or.length; i++) {
      if (or[i] === undefined || Number.isNaN(or[i]) || or[i] === false) {
        gap++;
      }
    }

    return console.log(`Total amount of gaps in data: ${gap}.`);
  };

  /**
   * Remove gaps in data with an option to fill the gap.
   * @method gapremoval
   * @memberof stats
   * @param {Object[]} arr - array object with data.
   * @returns {number} Number of gaps found in the data.
   * @example var freeofgaps = hydro1.analyze.stats.gapremoval(arr)
   */

  static gapremoval(arr) {
    var or = this.copydata(arr);
    var val;

    if (typeof or[0] != "object") {
      val = this.cleaner(or);
    } else {
      var time = or[0];
      var ds = or[1];
      for (var i = 0; i < ds.length; i++) {
        if (ds[i] === undefined || Number.isNaN(ds[i]) || ds[i] === false) {
          delete time[i];
        }
      }
      val = this.cleaner(ds);
      time = this.cleaner(time);
      return [time, val];
    }
  };

  /**
   * Identifies gaps in time. Used for filling gaps if required by the
   * user. Time in minutes and timestep must be divisible by the total time of the event.
   * @method timegaps
   * @memberof stats
   * @param {Object[]} arr - time array.
   * @param {number} timestep - timestep of the data.
   * @returns {Object[]} array with gaps.
   * @example var times = hydro1.analyze.stats.timegaps(arr, timestep)
   */

  static timegaps(arr, timestep) {
    var or = this.copydata(arr);

    if (typeof arr[0] === "object") {
      or = this.copydata(arr[0]);
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
  };

  /**
   * Fills data gaps (either time missig or data missing). Unfinished.
   * @method gapfiller
   * @memberof stats
   * @param {Object[]} arr - data with gaps to be filled.
   * @param {string} type - 'time' or 'data'.
   * @returns {Object[]} array with gaps filled.
   * @example var fills = hydro1.analyze.stats.gapfiller(arr, "time")
   */

  static gapfiller(arr, type) {
    var or = this.copydata(arr);

    if (typeof arr[0] === "object") {
      or = this.copydata(arr[0]);
    }

    var datetr = [];

    for (var i = 0; i < or.length; i++) {
      if (typeof or[0] == "string") {
        datetr.push(Math.abs(Date.parse(or[i]) / (60 * 1000)));
      } else {
        datetr.push(or[i]);
      }
    }

    if (type === "time") {
      var xo = [];
    }
  };

  /**
   * Sums all data in a series using D3.
   * @method sum
   * @memberof stats
   * @param {Object[]} data - array object with data.
   * @returns {number} Sum of all data in an array.
   * @example var sum = hydro1.analyze.stats.sum(arr)
   */

  static sum(arr) {
    var sum = d3.sum(arr);
    return sum;
  };

  /**
   * Calculates the mean of a 1d array using D3.
   * @method mean
   * @memberof stats
   * @param {Object[]} data - array object with data.
   * @returns {number} Mean of the data.
   * @example var mean = hydro1.analyze.stats.mean(arr)
   */

  static mean(arr) {
    var m = d3.mean(arr);
    return m;
  };

  /**
   * Calculates the median values for a 1d array using D3.
   * @method median
   * @memberof stats
   * @param {Object[]} data - array object with data.
   * @returns {number} Median of the data.
   * @example var med = hydro1.analyze.stats.median(arr)
   */

  static median(arr) {
    var m = d3.median(arr);
    return m;
  };

  /**
   * Calculates standard deviation of an array using D3.
   * @method stddev
   * @memberof stats
   * @param {Object[]} data - array object with data.
   * @returns {number} Standard deviation.
   */

  static stddev(arr) {
    var mean = this.mean(arr);
    var SD = 0;
    var nex = [];
    for (var i = 0; i < arr.length; i += 1) {
      nex.push((arr[i] - mean) * (arr[i] - mean));
    }
    return (SD = Math.sqrt(this.sum(nex) / nex.length));
  };

  /**
   * Calculate variance for an array of data using D3.
   * @method variance
   * @memberof stats
   * @param {Object[]} data - array object with data.
   * @returns {number} Variance of the data.
   * @example var var = hydro1.analyze.stats.variance(arr)
   */

  static variance(arr) {
    var vari = d3.variance(arr);
    return vari;
  };

  /**
   * Calculates sum of squares for a dataset.
   * @method sumsqrd
   * @memberof stats
   * @param {Object[]} data - array object with data.
   * @returns {number} Sum of squares for data.
   * @example var sqr = hydro1.analyze.stats.sumsqrd(arr)
   */

  static sumsqrd(arr) {
    var sum = 0;
    var i = arr.length;
    while (--i >= 0) sum += arr[i];
    return sum;
  };

  /**
   * Minimum value of an array using D3.
   * @method min
   * @memberof stats
   * @param {Object[]} data - array object with data.
   * @returns {number} Minimum value of a dataset.
   * @example var min = hydro1.analyze.stats.min(arr)
   */

  static min(arr) {
    var low = d3.min(arr);
    return low;
  }

  /**
   * Maximum value of an array using D3.
   * @method max
   * @memberof stats
   * @param {Object[]} data - array object with data.
   * @returns {number} Maximum value of a dataset.
   * @example var max = hydro1.analyze.stats.max(arr)
   */

  static max(arr) {
    return d3.max(arr);
  }

  /**
   * Unique values in an array.
   * @method unique
   * @memberof stats
   * @param {Object[]} data - array object with data.
   * @returns {Object[]} Array with unique values.
   * @example var un = hydro1.analyze.stats.unique(arr)
   */

  static unique(arr) {
    var un = {},
      _arr = [];
    for (var i = 0; i < arr.length; i++) {
      if (!un[arr[i]]) {
        un[arr[i]] = true;
        _arr.push(arr[i]);
      }
    }
    return _arr;
  }

  /**
   * Calculates the frequency in data.
   * @method frequency
   * @memberof stats
   * @param {Object[]} arr - data to be analyzed.
   * @returns {Object} Object with frenquency distribution.
   * @example var ob = hydro1.analyze.stats.frequency(arr)
   */

  static frequency(arr) {
    var _arr = this.copydata(arr);
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
   * @param {Object[]} data - array object with data.
   * @returns {Object[]} Array with standardized data.
   * @example var st = hydro1.analyze.stats.standardize(arr)
   */

  static standardize(arr) {
    var _arr = [];
    var stddev = this.stddev(arr);
    var mean = this.mean(arr);
    for (var i = 0; i < arr.length; i++) {
      _arr[i] = (arr[i] - mean) / stddev;
    }
    return _arr;
  }

  /**
   * Quantile calculator for given data.
   * @method quantile
   * @memberof stats
   * @param {Object[]} data - array object with data.
   * @param {number} q - percentage of quantile required (ie. 0.25, 0.75).
   * @returns {Object[]} Array with values fitting the quartile.
   * @example var q25 = hydro1.analyze.stats.quantile(arr, 0.25)
   */

  static quantile(arr, q) {
    var _arr = arr.slice();
    _arr.sort(function (a, b) {
      return a - b;
    });
    var p = (arr.length - 1) * q;
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
   * Identify the outliers on a dataset of 2 arrays using interquartile range.
   * @method interouliers
   * @memberof stats
   * @param {Object[]} data - array object with data.
   * @param {number} q1 - first quartile. If not given as parameter, q1 = 0.25.
   * @param {number} q2 - second quartile. If not given as parameter, q2 = 0.75.
   * @returns {Object[]} Array with outliers.
   * @example var interq = hydro1.analyze.stats.interoutliers(arr, 0.25, 0.75)
   */

  static interoutliers(arr, q1, q2) {
    if (!(q1 || q2)) {
      q1 = 0.25;
      q2 = 0.75;
    }

    var or = this.copydata(arr);
    var time = [];

    switch (typeof arr[0]) {
      case "object":
        time = this.copydata(arr[0]);
        or = this.copydata(arr[1]);
        break;
      default:
        break;
    }

    var Q_1 = this.quantile(or, q1);
    var Q_2 = this.quantile(or, q2);
    var IQR = Math.abs(Q_2 - Q_1);

    var qd = Math.abs(Q_1 - 1.5 * IQR);
    var qu = Math.abs(Q_2 + 1.5 * IQR);

    var xa = (arra) => arra.filter((x) => x >= qd || x >= qu);
    var re = xa(or);

    if (typeof arr[0] != "object") {
      return re;
    } else {
      var t = [];
      for (var j = 0; j < or.length; j++) {
        if (or[j] >= qd || or[j] >= qu) {
          t.push(time[j]);
        }
      }
      console.timeEnd("intout")
      return [t, re];
    }
  }

  /**
   * Identifies outliers in dataset of 2 arrays by normalizing the data given two thresholds.
   * @method normoutliers
   * @memberof stats
   * @param {Object[]} arr - array with data.
   * @param {number} low - lowest value range to consider. If not included as parameter, low = -0.5.
   * @param {number} high - ighest value range to consider. If not included as parameter, high = 0.5
   * @returns {Object[]} arr - array with outliers.
   * @example var normo = hydro1.analyze.stats.normoutliers(arr, -0.5, 0.5)
   */

  static normoutliers(arr, low, high) {
    if (!(low || high)) {
      low = -0.5;
      high = 0.5;
    }

    var or = this.copydata(arr);
    var time = [];

    switch (typeof arr[0]) {
      case "object":
        time = this.copydata(arr[0]);
        or = this.copydata(arr[1]);
        break;
      default:
        break;
    }

    var t1 = low;
    var t2 = high;

    var out = [];
    var stnd = this.standardize(or);

    for (var i = 0; i < or.length; i++) {
      if (stnd[i] < t1 || stnd[i] > t2) {
        out.push(or[i]);
      }
    }

    if (typeof arr[0] != "object") {
      return out;
    } else {
      var t = [];
      for (var j = 0; j < stnd.length; j++) {
        if (stnd[j] < t1 || stnd[j] > t2) {
          t.push(time[j]);
        }
      }
      console.timeEnd("normout")
      return [t, out];
    }
  }

  /**
   * Remove outliers from dataset.
   * @method outremove
   * @memberof stats
   * @param {Object[]} data - array object with data.
   * @param {string} type - outlier type: 'normalized' or 'interquartile'.
   * @param {number} p1 - low end parameter, depending on outlier analysis type.
   * @param {number} p2 - high end parameter, depending on outlier analysis type.
   * @returns {Object[]} Array with cleaned data.
   * @example var c = hydro1.analyze.stats.outremove(arr, 'interquartile')
   */

  static outremove(arr, type, p1, p2) {
    var out;

    if (type === "normalized") {
      out = this.normoutliers(arr, p1, p2);
    } else {
      out = this.interoutliers(arr, p1, p2);
    }

    if (typeof arr[0] != "object") {
      return this.itemfilter(arr, out);
    } else {
      var t = this.itemfilter(arr[0], out[0]);
      var or = this.itemfilter(arr[1], out[1]);

      console.timeEnd("outremove")
      return [t, or];
    }
  }

  /**
   * Calculates pearson coefficient for bivariate analysis.
   * @method correlation
   * @memberof stats
   * @param {Object} param - object containing the datasets to be compared.
   * @returns {number} Pearson coefficient.
   * @example var arr1 = [1,2,3,4,5], var arr2 = [5,4,3,2,1]
   * var params = {Set1: arr1, Set2: arr2}
   * var corr = hydro1.analyze.stats.correlation(params)
   */

  static correlation(params) {
    var q1 = params["Set1"];
    var q2 = params["Set2"];
    var n = q1.length + q2.length;
    var q1q2 = [];
    var sq1 = [];
    var sq2 = [];
    for (var i = 0; i < q1.length; i++) {
      q1q2[i] = q1[i] * q2[i];
      sq1[i] = q1[i] * q1[i];
      sq2[i] = q2[i] * q2[i];
    }
    var r1 = n * this.sum(q1q2) - this.sum(q1) * this.sum(q2);
    var r2a = Math.sqrt(n * this.sum(sq1) - Math.pow(this.sum(q1), 2));
    var r2b = Math.sqrt(n * this.sum(sq2) - Math.pow(this.sum(q2), 2));
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
   * @param {Object} params - 1D array with observed data and model data. 
   * @returns {Number} calculated NSE
   * @example 
   * var params = {observed: 1DArray, model: 1DArray, type: "NSE"}
   * var ns = hydro1.analyze.stats.nashsutcliffe(params)
   */

  static efficiencies(params) {
    var obs = params.observed;
    var model = params.model;
    var meanobs = this.mean(obs);
    var meanmodel = this.mean(model);

    var diff1 = [];
    var diff2 = [];

    //calculate nash sutcliffe effiency
    if (params.type == "NSE") {
      for (var i = 0; i < obs.length; i++) {
        diff1[i] = Math.pow(model[i] - obs[i], 2);
        diff2[i] = Math.pow(obs[i] - meanobs, 2);
      };
      var NSE = 1 - this.sum(diff1) / this.sum(diff2);
      console.timeEnd("NSE")
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
      console.log(`The values are - Upper: ${this.sum(diff1)}, Lower: ${this.sum(diff2)} and ${this.sum(diff3)}`);
      var r = Math.pow(this.sum(diff1) / (Math.sqrt(this.sum(diff2)) * Math.sqrt(this.sum(diff3))), 2);
      console.timeEnd("determ")
      return r;
    }

    //calculate index of agreement d
    else if (params.type == "agreement") {
      for (var i = 0; i < obs.length; i++) {
        diff1[i] = Math.pow(obs[i] - model[i], 2);
        diff2[i] = Math.pow(Math.abs(model[i] - meanobs) + Math.abs(obs[i] - meanobs), 2);
      };
      var d = 1 - this.sum(diff1) / this.sum(diff2);
      console.timeEnd("agree")
      return d;
    }
  }

  /**
   * Using tensorflow, it creates a fast fourier analysis over
   * a dataset and see if there are any patterns within the data. Should be considered to be used
   * for small data sets.
   * @method fastfourier
   * @memberof stats
   * @param {Object[]} arr - array with data.
   * @returns {Object[]} calculated array.
   * @example var st = hydro1.analyze.stats.fastfourier(arr)
   */

  static fastfourier(arr) {
    tf.setBackend("webgl");
    for (var i = 0; i < arr.length; i++) {
      arr[i] = Math.round(arr[i] + 5)
    };
    const _arr = arr;
    const results = _arr.map((n) => {
      const tensors = [];
      const start = performance.now();
      console.log(start)
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
   * Returns an array that contains the basic statistics
   * of a dataset. It is used afterwards to be prompted
   * using google graphing tools.
   * @method basicstats
   * @memberof stats
   * @param {Object[]} array - array with data.
   * @returns {Object[]} flatenned array for the dataset.
   * @example var bs = hydro1.analyze.stats.basicstats(arr)
   */

  static basicstats(arr) {
    //call the basic functions for analysis.
    var count = arr.length;
    var min = this.min(arr);
    var max = this.max(arr);
    var sum = this.sum(arr);
    var mean = this.mean(arr);
    var median = this.median(arr);
    var std = this.stddev(arr);
    var vari = this.variance(arr);

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

    var ex1 = {
      graphdata: statparams,
      Columns: ["Metric", "Value"],
    };

    //flatenise the data for graphing.
    var statx = this.flatenise(ex1);

    console.timeEnd("basicstats")
    return statx;
  }

  /***************************/
  /***** Helper functions ****/
  /***************************/

  /**
   * Preprocessing tool for joining arrays for table display.
   * @method joinarray
   * @memberof stats
   * @param {Object[]} data - array object to join.
   * @returns {Object[]} Array for table display.
   * @example var ja = hydro1.analyze.stats.joinarray(arr)
   */

  static joinarray(arr) {
    var temp = [];
    for (var i = 1; i < arr[0].length; i++) {
      if (!temp[i]) {
        temp[i] = [];
      }
      temp[i] = [arr[0], arr[1]].reduce((a, b) => a.map((v, i) => v + b[i]));
    }
    return temp;
  }

  /**
   * Helper function for preparing arrays for charts and tables for duration/discharge.
   * @method flatenise
   * @memberof stats
   * @param {Object[]} data - array object required to be flatenned.
   * @returns {Object[]} Flatenned array.
   * @example var params = {Columns: arr, graphdata: arr}
   * var flat = hydro1.analyze.stats.flatenise(params)
   */

  static flatenise(params) {
    var x = params.Columns;
    var d = params.graphdata;
    var col = [];
    var data = [];
    for (var i = 0; i < x.length; i++) {
      col.push(x[i]);
    }
    for (var j = 0; j < d.length; j++) {
      data.push(d[j].flat());
    }
    return [col, data];
  }

  /**
   * Turns data from numbers to strings. Usable when
   * retrieving data or uploading data.
   * @method numerise
   * @memberof stats
   * @param {Object[]} array - data composed of strings.
   * @returns {Object[]} array as numbers.
   * @example var c = hydro1.analyze.stats.numerise(arr)
   */

  static numerise(arr) {
    var result = arr.map((x) => parseFloat(x));
    return result;
  }

  /**
   * Filters out items in an array that are undefined, NaN, null, ", etc.
   * @method cleaner
   * @memberof stats
   * @param {Object[]} array - data to be cleaned.
   * @returns {Object[]} cleaned array.
   * @example var c = hydro1.analyze.stats.cleaner(arr)
   */

  static cleaner(arr) {
    var x = arr.filter((x) => x === undefined || !Number.isNaN(x));
    return x;
  }

  /**
   * Filters out items in an array based on another array.
   * @method itemfilter
   * @memberof stats
   * @param {Object[]} arr1 - array with data to be kept.
   * @param {Object[]} arr2 - array with data to be removed.
   * @returns {Object[]} cleaned array.
   * @example var its = hydro1.analyze.stats.itemfilter(arr1, arr2)
   */

  static itemfilter(arr1, arr2) {
    var x = arr1.filter((el) => !arr2.includes(el));
    return x;
  }

  /**
   * Changes a date array into local strings. Used mainly
   * for changing displaying into google charts.
   * @method dateparser
   * @memberof stats
   * @param {Object[]} array - data.
   * @returns {Object[]} array with date parsed.
   * @example var c = hydro1.analyze.stats.dateparser(arr)
   */

  static dateparser(arr) {
    var x = this.copydata(arr);
    var xo = [];
    for (var j = 0; j < arr.length; j++) {
      xo.push(new Date(arr[j]).toLocaleString());
    }
    return xo;
  }

  /**
   * Changes a m x n matrix into a n x m matrix (transpose).
   * Mainly used for creating google charts. M =! N.
   * @method arrchange
   * @memberof stats
   * @param {Object[]} array - m x n matrix.
   * @returns {Object[]} array - n x m matrix.
   * @example var c = hydro1.analyze.stats.arrchange(arr)
   */

  static arrchange(arr) {
    var x = this.copydata(arr);
    var transp = (matrix) => matrix[0].map((x, i) => matrix.map((x) => x[i]));
    return transp(x);
  }

  /**
   * Pushes at the end of an array the data of another array.
   * @method push
   * @memberof stats
   * @param {Object[]} arr1 - array to which the data will be pushed.
   * @param {Object[]} arr2 - array pushed.
   * @returns {Object[]} arr1 with pushed data.
   */

  static push(arr1, arr2) {
    for (var j = 0; j < arr2.length; j++)
      for (var i = 0; i < arr2[0].length; i++) {
        arr1[j].push(arr2[j][i])
      }
    return arr1
  }

  /**********************************/
  /*** End of Helper functions **/
  /**********************************/
}