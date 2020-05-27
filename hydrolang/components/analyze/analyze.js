// Static functions are used after 3rd level of chaining.
// Add only static functions which does not rely on data
// stored on objects, i.e. only uses the data that is
// given to the function as a parameter 


class stats {

    /** copydata: makes a copy of original data.
     * @param {data} original data.
     * @returns {data} copy of original data.
     */
    static copydata(data){
        var arr = [];
        for (var i=0; i<data.length;i++){
            arr.push(data[i]);
        }
        return arr;
	}
	
    /** onearray: converts data object into 1d array.
     * @param {data} data object, either original or copy.
     * @returns {array}
     */
    static onearray(data){
        var arr = [];
        for (var i=0; i<data.length;i++){
            arr.push(data[0][i]);
        }
        return arr;
    }

    /** gapid: identify the gaps in data.
     * @param {array} array with data.
     * @returns {var} number of gaps found in the data.
     */
    static gapid(arr) {
        var or = arr.slice();
        var gap = 0;
        for (var i=0; i<or.length;i++){
            if (or[i]==undefined) {
                gap+=1;
            }
        }
        return gap;
    };

    /** gapremoval: remove gaps in data with an option to fill the .
     * @param {array} array with data.
     * @param {var} states if gaps should be removed (0) or filled with average value(1). 
     * @returns {var} number of gaps found in the data.
     */
    static gapremoval(arr,n) {
        var or = arr.slice();
        if (this.gapid(arr) >= 1){
            for (var i=0; i<or.length;i++){
                if (n = 0) {
                    if (or[i]==undefined) {
                        or.drop(i);
                    }
                }
                if (n=1) {
                    if (or[i]==undefined) {
                        or[i] = (or[i-1]+or[i+1])/2;
                    }
                }
            } return or;
        } else {
            console.log("No gaps found in the data");
        }
    };

    /** sum: sums all data in a series.
     * @param {array} data either original or copy from original.
     * @returns {var} sum of all data in an array.
     */
    static sum(array) {
        var sum = 0;
        var i = arr.length;
        while (--i >=0)
            sum += arr[i];
        return sum;
    };

    /** mean: calculates the mean of a 1d array.
     * @param {array} array with data.
     * @returns {var} mean of the data.
     */
    static mean(arr) {
        var total = 0;
        total = this.sum(arr)
        var m = 0;
        m = total / arr.length;
        return m;
    };

    /** stdev = calculates standard deviation of an array.
     * @param {array} array with data.
     * @returns {var} variable with standard deviation.
     */
    static stddev(arr) {
        var mean = this.mean(arr);
        var SD = 0;
        var nex =[];
        for(var i=0; i<arr.length;i+=1){
            nex.push((arr[i]-mean)*(arr[i]-mean));
        }
        return SD=Math.sqrt(this.sum(nex)/nex.length);
    };

    /** sumsqrd: calculates sum of squares for a dataset.
     * @param {array} array with data.
     * @returns {var} variable with sum of squares for data.
     */
    static sumsqrd(arr) {
        var sum = 0;
        var i = arr.length;
        while (--i >=0)
            sum+= arr[i];
        return sum;
    };

    /** min: minimum value of an array
     * @param {array} array with data.
     * @returns {var} variable with min value of dataset.
     */
    static min(arr) {
        var low = arr[0];
        var i=0;
        while (++i <arr.length)
            if (arr[i] <low)
                low = arr[i];
        return low;
    };

    /** max: maximum value of an array.
     * @param {array} array with data.
     * @returns {var} variable with max value of dataset.
     */
    static max(arr) {
        var high=arr[0];
        var i=0;
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
        var un = {}, _arr = [];
        for(var i=0; i<arr.length; i++){
            if (!un[arr[i]]){
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
        for (var i=0; i<arr.length; i++) {
            _arr[i]=(arr[i]-mean)/stddev;
        }
        return _arr;
    };

    /** quantile: quantile calculator for given data and q written as (ie. 25, 75)
     * @param {array} array with data.
     * @param {var} number of quantile required.
     * @returns {array} array with values fitting the quartile.
     */
    static quantile(arr,q) {
        var _arr=arr.slice();
        _arr.sort(function(a,b){
            return a-b
        });
        var p = (arr.length - 1) * q;
        var b = Math.floor(p);
        var rest = p - b;
        if ((_arr[b+1]!==undefined)){
            return _arr[b] + rest * (_arr[b+1] - _arr[b]);
        } else {
            return _arr[b];
        }   
    };

    /** outliers: obtain outliers from dataset.
     * @param {array} array with data.
     * @returns {array} array with outlier data.
     */
    static outliers(arr) {
        var Q_25 = this.quantile(arr,0.25);
        var Q_75 = this.quantile(arr,0.75);
        var IQR = Q_75-Q_25;
        var out = [];
        for (var i=0; i <arr.length;i++){
            if (arr[i] < (1.5*IQR-Q_25) || arr[i] > (1.5*IQR+Q_75)) {
                out.push(arr[i]);
            } 
        }
        return out;
    };

    /** outremove: remove outliers from dataset.
     * @param {array} array with data.
     * @returns {array} array with cleaned data.
     */
    static outremove(arr) {
        var or = arr.slice();
        var out = this.outliers(or);
        for (var i=0; i<or.length;i++){
            if (or[i]===out[i]) {
                or.drop(i);
                i--;
            }
        }
        return out;
    };
}


class hydro {

    /**Total precipitation: arithmetic sum of the total amount of precipitation during an event.
     * It is also used as a helper function.
     * @param {arr} array with precipitation event.
     * @returns {var} total amount of precipitation during an event on a given station. 
     */

    static totalprec (arr) {
        var sum=0;
        var k = arr.length
        while (--k >=0) {
            sum+=minarr[k]
        };
        return sum;
    };

    /**Arithmetic mean: computation of aereal mean precipitation for a river basin given it has 2 or more different stations.
     * @param {array} object with precipitation with equal amounts of data from different rain gauges.
     * @returns {array} object with average precipitaiton for a specific time series.
     */

    static arithmetic (arr) {
        var average = [];
        var final = [];
        var n= arr.length;        
        for (var i=0; i < arr.length; i++){
            for (var j=0;j < arr[0].length;j++) {
                average.push(arr[i][j])
            };     
        };
        for (var h = 0; h<average.length;h+=n){
            var minarr = average.slice(h,h+n);
            final[h] = this.totalprec(minarr)/minarr.length;
            var filtered = final.filter(function (el) {return el != null});
        }; 
        return filtered;
    };
	 
    /**Thiessen polygon: calculates average precipitation for a basin considering there is
      * one station per sub basin.
      * @param {params} parameter object which has the time series data and area per subbasin.
      * @returns {array} time series of average precipitation over whole sub basin.
      */

     static thiessen (params) {
        var precs = params["rainfall"];
        var areas = params["areas"];
        var totarea = this.totalprec(areas);
        var res = Array(precs.length).fill(0).map(()=>Array(areas.length).fill(0));
        var out = Array(precs[0].length).fill(0);
        for (var i = 0; i<precs.length; i++){
            for(var j = 0; j < precs[0].length;j++) {
                res[i][j]= precs[i][j] * areas[i];
                out[j] += res[i][j] / totarea;
            };
        }; 
        return out;
    };

    /** bucketmodel: does simple rainfall-runoff analyses over a rainfall dataset given landuse, baseflow and infiltration capacity.
     * @param {param} parameter object landuse, rainfall, infiltration capacity and baseflow.
     * @returns {array} values for runoff as time series.
     */

    static bucketmodel (params) {

        //initial parameters
        let rainfall = params["rainfall"];
        let n = rainfall.length;
        let baseflow = params["baseflow"]/24;
        let evapodata = params["evaporation"]["data"];
        let landuse = [params["landuse"]["agriculture"], params["landuse"]["bare rock"], 
        params["landuse"]["grassland"],
        params["landuse"]["forest"],
        params["landuse"]["moorland"]];
        let infiltration = params["infiltration"];
        //infiltration capacities for agriculture, bare rock, grassland, forest and
        //moorland, respectively.
        let FieldCaps = [5,50,25,25,5];

        //arrays and variables
        var initial=Array(landuse.length).fill(0).map(()=>Array(n).fill(0));
        var interflow = Array(landuse.length).fill(0).map(()=>Array(n).fill(0));
        var overflow = Array(landuse.length).fill(0).map(()=>Array(n).fill(0));
        var totalflow = Array(landuse.length).fill(0).map(()=>Array(n).fill(0));
        var totalrunoff = Array(landuse.length).fill(0).map(()=>Array(n).fill(0));
        
        // initial moisture
        for (var i = 0; i < FieldCaps.length; i++){
            initial[i][0] =  FieldCaps[i]*landuse[i]+rainfall[0]-evapodata[0]
        };
        
        //initial soil moisture
        for (var k = 0;k<FieldCaps.length;k++) {
            if (initial[k][0] > FieldCaps[k]) {
                overflow[k][0] = initial[k][0]-FieldCaps[k];
                initial[k][0] = FieldCaps[k];
            } else {
                overflow[k][0] = 0;
            };
            if (initial[k][0] > 0) {
                interflow[k][0] = initial[k][0]*infiltration;
            } else {
                interflow[k][0] = 0;
            }
        };
        
        //calculating overland and interflow
        for (var m = 0; m <FieldCaps.length; m++){
            for (var p = 1; p < n; p++){
                initial[m][p] = initial[m][p-1]*(1-infiltration) + rainfall[p]-evapodata[p];
                if (initial[m][p] > FieldCaps[m]) {
                    overflow[m][p] = initial[m][p] - FieldCaps[m];
                    initial[m][p] = 0;
                } else {
                    overflow[m][p] = 0;
                }
                if (initial[m][p] > 0) {
                    interflow[m][p] = initial[m][p] * infiltration;
                } else {
                    interflow[m][p] = 0
                }
            }
        };
        
        //calculating the total amount of flow from overflow, baseflow and interflow
        for (var j = 0; j < FieldCaps.length; j++) {
            for (var h = 0; h < n;h++) {
                totalflow[j][h] = overflow[j][h]+interflow[j][h]+baseflow;
            }
        }
        //calculating total runoff
        for (var q =0; q<n;q++){
            totalrunoff[q] = totalflow[0][q] * landuse[0] + totalflow[1][q] * landuse[1]
            + totalflow[2][q] * landuse[2] + totalflow[3][q] * landuse[3]
            + totalflow[4][q] * landuse[4];
        }; 
        return totalrunoff;
    };
    
}


export{
	stats,
	hydro
}