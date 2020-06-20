import _ from '../../../modules/d3/d3.js'

export default class stats {

    /** copydata: makes a copy of original data.
     * @param {data} original data.
     * @returns {data} copy of original data.
     */
    static copydata(data) {
        var arr = [];
        for (var i = 0; i < data.length; i++) {
            arr.push(data[i]);
        }
        return arr;
    }

    /** onearray: retrieves a 1D array with the data
     * @param {data} data object, either original or copy.
     * @returns {array}
     */
    static onearray(data) {
        var arr = [];
        arr.push(data[1])
        return arr
    }

    /** gapid: identify the gaps in data.
     * @param {array} array with data.
     * @returns {var} number of gaps found in the data.
     */
    static gapid(arr) {
        var or = arr.slice();
        var gap = 0;
        for (var i = 0; i < or.length; i++) {
            if (or[i] == undefined) {
                gap += 1;
            }
        }
        return gap;
    };

    /** gapremoval: remove gaps in data with an option to fill the .
     * @param {array} array with data.
     * @param {var} states if gaps should be removed (0) or filled with average value(1). 
     * @returns {var} number of gaps found in the data.
     */
    static gapremoval(arr) {
        var or = arr.slice();
        if (this.gapid(arr) >= 1) {
            for (var i = 0; i < or.length; i++) {
                if (n = 0) {
                    if (or[i] == undefined) {
                        or.drop(i);
                    }
                }
                if (n = 1) {
                    if (or[i] == undefined) {
                        or[i] = (or[i - 1] + or[i + 1]) / 2;
                    }
                }
            }
            return or;
        } else {
            console.log("No gaps found in the data");
        }
    };

    /** sum: sums all data in a series.
     * @param {array} data either original or copy from original.
     * @returns {var} sum of all data in an array.
     */
    static sum(arr) {
        var sum = _.d3.sum(arr);
        return sum;
    };

    /** mean: calculates the mean of a 1d array.
     * @param {array} array with data.
     * @returns {var} mean of the data.
     */
    static mean(arr) {
        var m = _.d3.mean(arr)
        return m;
    };

    /** median: calculates the median values for a 1d array.
     * @param {array} array with data.
     * @returns {var} median of the data.
     */
    static median(arr) {
        var m = _.d3.median(arr)
        return m;
    };

    /** stdev = calculates standard deviation of an array.
     * @param {array} array with data.
     * @returns {var} variable with standard deviation.
     */
    static stddev(arr) {
        var mean = this.mean(arr);
        var SD = 0;
        var nex = [];
        for (var i = 0; i < arr.length; i += 1) {
            nex.push((arr[i] - mean) * (arr[i] - mean));
        }
        return SD = Math.sqrt(this.sum(nex) / nex.length);
    };

    /** variance = calculate variance for an array of data. 
     * @param {array} array with data.
     * @returns {var} varaince of the dataset. 
     */
    static variance(arr) {
        var vari = _.d3.variance(arr);
        return vari
    };

    /** sumsqrd: calculates sum of squares for a dataset.
     * @param {array} array with data.
     * @returns {var} variable with sum of squares for data.
     */
    static sumsqrd(arr) {
        var sum = 0;
        var i = arr.length;
        while (--i >= 0)
            sum += arr[i];
        return sum;
    };

    /** min: minimum value of an array
     * @param {array} array with data.
     * @returns {var} variable with min value of dataset.
     */
    static min(arr) {
        var low = _.d3.min(arr)
        return low;
    };

    /** max: maximum value of an array.
     * @param {array} array with data.
     * @returns {var} variable with max value of dataset.
     */
    static max(arr) {
        var high = arr[0];
        var i = 0;
        while (++i < arr.length)
            if (arr[i] > high)
                high = arr[i];
        return high
    };

    /** unique: unique values in an array.
     * @param {array} array with data.
     * @returns {array} array with unique values.
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
    };

    /** standardize: use mean and standard deviation to standardize the original dataset.
     * @param {array} array with data.
     * @returns {array} array with standardized data.
     */
    static standardize(arr) {
        var _arr = [];
        var stddev = this.stddev(arr);
        var mean = this.mean(arr);
        for (var i = 0; i < arr.length; i++) {
            _arr[i] = (arr[i] - mean) / stddev;
        }
        return _arr;
    };

    /** quantile: quantile calculator for given data and q written as (ie. 25, 75)
     * @param {array} array with data.
     * @param {var} number of quantile required.
     * @returns {array} array with values fitting the quartile.
     */
    static quantile(arr, q) {
        var _arr = arr.slice();
        _arr.sort(function(a, b) {
            return a - b
        });
        var p = (arr.length - 1) * q;
        if (p % 1 === 0) {
            return _arr[p]
        } else {
            var b = Math.floor(p);
            var rest = p - b;
            if ((_arr[b + 1] !== undefined)) {
                return _arr[b] + rest * (_arr[b + 1] - _arr[b]);
            } else {
                return _arr[b];
            };
        };
    };

    /** outliers: identify the outliers from dataset.
     * @param {array} array with data.
     * @returns {array} array with outlier data.
     */
    static outliers(arr) {
        var Q_25 = this.quantile(arr, 0.25);
        var Q_75 = this.quantile(arr, 0.75);
        var IQR = Q_75 - Q_25;
        return arr.filter((x) => (x <= 1.5 * IQR - Q_25) || (x >= 1.5 * IQR + Q_75));
    };

    /** outremove: remove outliers from dataset.
     * @param {array} array with data.
     * @returns {array} array with cleaned data.
     */
    static outremove(arr) {
        var or = arr.slice();
        var out = this.outliers(arr);
        return or.filter((el) => !out.includes(el));
    };

    /** correlation: calculates pearson coefficient for bivariate analysis.
     * @param {params} param object with two datasets.
     * @returns {var} coefficient.
     */
    static correlation(params) {
        var q1 = params['Set1'];
        var q2 = params['Set2'];
        var n = q1.length + q2.length;
        var q1q2 = [];
        var sq1 = [];
        var sq2 = [];
        for (var i = 0; i < q1.length; i++) {
            q1q2[i] = q1[i] * q2[i];
            sq1[i] = q1[i] * q1[i];
            sq2[i] = q2[i] * q2[i];
        }
        var r1 = (n * this.sum(q1q2) - this.sum(q1) * this.sum(q2));
        var r2a = Math.sqrt(n * this.sum(sq1) - Math.pow(this.sum(q1), 2));
        var r2b = Math.sqrt(n * this.sum(sq2) - Math.pow(this.sum(q2), 2));
        return r1 / (r2a * r2b);
    }

    /***************************/
    /***** Helper functions ****/
    /***************************/

    /** joinarray: preprocessing tool for joining arrays for table display.
     * @param {arr} array to join.
     * @returns {arr} array ready for table display.
     */
    static joinarray(arr) {
        var temp = []
        for (var i = 1; i < arr[0].length; i++) {
            if (!temp[i]) {
                temp[i] = [];
            };
            temp[i] = [arr[0], arr[1]].reduce((a, b) => a.map((v, i) => v + b[i]));
        };
        return temp;
    }

    /**flatennise: helper function for preparing arrays for charts and tables for duration/discharge.
     * @param {arr} array required to flatenise.
     * @returns {arr} flatenned array.
     */

    static flatenise(params) {
        var x = params['Columns']
        var d = params['graphdata']
        var col = [];
        var data = [];
        for (var i = 0; i < x.length; i++) {
            col.push(x[i])
        }
        for (var j = 0; j < d.length; j++) {
            data.push(d[j].flat())
        }
        return [col, data];
    };

    /**********************************/
    /*** End of Helper functions **/
    /**********************************/


}