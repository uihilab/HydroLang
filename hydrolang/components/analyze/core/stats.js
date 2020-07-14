import '../../../modules/d3/d3.js';
import '../../../modules/tensorflow/tensorflow.js';

export default class stats {

    /** 
     * Makes a copy of original data for further manipulation.
     * @param {Object []}  data - original data.
     * @returns {Object []} Copy of original data.
     */
    static copydata(data) {
        var arr = [];
        for (var i = 0; i < data.length; i++) {
            arr.push(data[i]);
        }
        return arr;
    }

    /** 
     * Retrieves a 1D array with the data.
     * @param {Object []} data - array object.
     * @returns {Object []} Array object.
     */
    static onearray(data) {
        var arr = [];
        arr.push(data[1])
        return arr
    }

    /** 
     * Identifies gaps in data.
     * @param {Object []} data - array object with data.
     * @returns {number} Number of gaps in data.
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

    /** 
     * Remove gaps in data with an option to fill the gap.
     * @param {Object []} data - array object with data.
     * @param {number} state - if gaps should be removed (0) or filled with average value(1). 
     * @returns {number} Number of gaps found in the data.
     */
    static gapremoval(arr, n) {
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

    /** 
     * Sums all data in a series.
     * @param {Object []} data - array object with data.
     * @returns {number} Sum of all data in an array.
     */
    static sum(arr) {
        var sum = d3.sum(arr);
        return sum;
    };

    /** 
     * Calculates the mean of a 1d array.
     * @param {Object []} data - array object with data.
     * @returns {number} Mean of the data.
     */
    static mean(arr) {
        var m = d3.mean(arr)
        return m;
    };

    /** 
     * Calculates the median values for a 1d array.
     * @param {Object []} data - array object with data.
     * @returns {number} Median of the data.
     */
    static median(arr) {
        var m = d3.median(arr)
        return m;
    };

    /** 
     * Calculates standard deviation of an array.
     * @param {Object []} data - array object with data.
     * @returns {number} Standard deviation.
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

    /** 
     * Calculate variance for an array of data. 
     * @param {Object []} data - array object with data.
     * @returns {number} Variance of the data. 
     */
    static variance(arr) {
        var vari = d3.variance(arr);
        return vari;
    };

    /** 
     * Calculates sum of squares for a dataset.
     * @param {Object []} data - array object with data.
     * @returns {number} Sum of squares for data.
     */
    static sumsqrd(arr) {
        var sum = 0;
        var i = arr.length;
        while (--i >= 0)
            sum += arr[i];
        return sum;
    };

    /** 
     * Minimum value of an array
     * @param {Object []} data - array object with data.
     * @returns {number} Minimum value of a dataset.
     */
    static min(arr) {
        var low = d3.min(arr)
        return low;
    };

    /** 
     * Maximum value of an array.
     * @param {Object []} data - array object with data.
     * @returns {number} Maximum value of a dataset.
     */
    static max(arr) {
        var high = arr[0];
        var i = 0;
        while (++i < arr.length)
            if (arr[i] > high)
                high = arr[i];
        return high
    };

    /** 
     * Unique values in an array.
     * @param {Object []} data - array object with data.
     * @returns {Object []} Array with unique values.
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

    /** 
     * Use mean and standard deviation to standardize the original dataset.
     * @param {Object []} data - array object with data.
     * @returns {Object []} Array with standardized data.
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

    /** 
     * Quantile calculator for given data.
     * @param {Object []} data - array object with data.
     * @param {number} quantile - percentage of quantile required (ie. 25, 75).
     * @returns {Object []} Array with values fitting the quartile.
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

    /** 
     * Identify the outliers on a dataset for quantiles 25 and 75.
     * @param {Object []} data - array object with data.
     * @returns {Object []} Array with outlier data.
     */
    static outliers(arr) {
        var Q_25 = this.quantile(arr, 0.25);
        var Q_75 = this.quantile(arr, 0.75);
        var IQR = Q_75 - Q_25;
        return arr.filter((x) => (x <= 1.5 * IQR - Q_25) || (x >= 1.5 * IQR + Q_75));
    };

    /** 
     * Remove outliers from dataset.
     * @param {Object []} data - array object with data.
     * @returns {Object []} Array with cleaned data.
     */
    static outremove(arr) {
        var or = arr.slice();
        var out = this.outliers(arr);
        return or.filter((el) => !out.includes(el));
    };

    /** 
     * Calculates pearson coefficient for bivariate analysis.
     * @param {Object} param - object containing the datasets to be compared.
     * @returns {number} Pearson coefficient.
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

    /**
     * using tensorflow, it creates a fast fourier analysis over
     * a dataset and see if there are any patterns within the data.
     */
    static fastfourier(arr){
        tf.setBackend('webgl');
        const _arr = arr;
        const results = _arr.map(n => {
            const tensors = [];
            const start = performance.now();
            for (let i =0; i < 100; i++) {
                const real = tf.ones([10, n * 10]);
                const imag = tf.ones([10, n * 10]);
                const input = tf.complex(real,imag);
                const res = tf.spectral.fft(input);
                res.dataSync();
            }
            return performance.now() - start;
        });
        return results
    }

    /***************************/
    /***** Helper functions ****/
    /***************************/

    /** 
     * Preprocessing tool for joining arrays for table display.
     * @param {Object []} data - array object to join.
     * @returns {Object []} Array for table display.
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

    /**
     * Helper function for preparing arrays for charts and tables for duration/discharge.
     * @param {Object []} data - array object required to be flatenned.
     * @returns {Object []} Flatenned array.
     */

    static flatenise(params) {
        var x = params.Columns
        var d = params.graphdata
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