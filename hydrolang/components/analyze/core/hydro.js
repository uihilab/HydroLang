export default class hydro {

    /**Total precipitation: arithmetic sum of the total amount of precipitation during an event.
     * It is also used as a helper function.
     * @param {arr} array with precipitation event.
     * @returns {var} total amount of precipitation during an event on a given station. 
     */

    static totalprec (arr) {
        var sum=0;
        var k = arr.length
        while (--k >=0) {
            sum+=arr[k]
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