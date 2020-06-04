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

    /**move: helper function for moving arrays in unit hydographs.
     * @param {*} array that is to be pushed in subtitute array.
     * @param {*} from index in original array. 
     * @param {*} to index in substitute array.
     */

    static move(array, from, to) {
        if ( to === from) return array;

        var target = array[from];
        var increment = to < from ? -1 : 1;

        for (var k = from;k != to; k+= increment) {
          array[k] = array[k + increment];
        };
        array[to] = target;
        return array;
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

    /**dimunithydro: creates a dimensionless unit hydrograph using a preset distribution.
     * Calculated frombased on (NEH, 2007).
     * @param {param} object that specifies the type of distribution required as well as the 
     * time step to compute the hydrograph.
     * @returns {array} dimensionless hydrograph.
     */

    static dimunithydro(params) {
        //populate
        var step = params["timestep"];
        var hours = params["numhours"];

        //calculate the number of steps in the hydrograph
        var numstep = Math.round(hours/step);

        //create new array
        var ttp = Array(numstep+1).fill(0);
        var qqp = Array(numstep+1).fill(0);
        
        if (params["distribution"]["type"] = "gamma") {
        //change gamma shape factor.
            switch(params["distribution"]["PRF"]){
                case 101:
                    m = 0.26;
                    break;
                case 238:
                    m = 1;
                    break;
                case 349:
                    m = 433;
                    break;
                case 433:
                    m = 3;
                    break;
                case 484:
                    m = 3.7;
                    break;
                case 504:
                    m = 4;
                    break;
                case 566:
                    m = 5;
                default:
                    throw new Error("Please choose value between 101,238,349,433,484,504,566.")
                };
            
            //populating the array with t/tp relationship every 0.1t.
            //populating the array with q/qp using Gamma distribution with PRF = 484.
            for (var i = 1;i<ttp.length;i++){
                ttp[i] = Number((ttp[i-1]+step).toFixed(2));
                qqp[i] = Number((Math.exp(m)*Math.pow(ttp[i],m)*Math.exp(-m*ttp[i])).toFixed(3));
            };
        return [ttp,qqp];
        } else {
            throw new Error("Please use available distributions!");
        }; 
     };

    /**unithydrocons = Unit hydrograph NRCS constructor depending on the 
     * physical characteristics of a regularly shaped basin. Calculated from (NEH, 2007)
     * @param {param} object that specifies the physical characteristics and the type of
     * distribution required as well as the time step to compute the hydrograph.
     * @returns {array} time series array. If metric in m3/s, if SI in cfs.
     */
    
    static unithydrocons(params) {
        //import parameters from user.
        var area = params["drainagearea"];
        var tconc = params["tconcentration"];
        var duh = params["unithydro"];

        //calculate time step.
        var deltat = Number((tconc * 0.133).toFixed(3));

        //calculate time to peak and construct result arrays.
        var tp = deltat / 2  + (0.6*tconc);
        var unit = Array(2).fill(0).map(()=>Array(duh[0].length).fill(0));
        var qp = 0;
        
        //change peak discharge depending on the units.
        switch(params["units"]) {
            case "si":
                qp = 484*area*1/tp;
                break;
            case "m":
                qp = 0.208*area*1/tp;
                break;
            default:
                throw new Error("Please input a valid unit system!");
        };

        //populate the hydrograph with time and discharge.
        for (var h = 0;h<unit[0].length;h++) {
            unit[0][h] = Number((duh[0][h] * tp).toFixed(3));
            unit[1][h] = Number((duh[1][h] * qp).toFixed(3)); 
        };
        return unit;
    };

    /** floodhydro: Flooding hydrograph generator using a Dimensionless Unit Hydrograph,
     * precipitation data and SCS metrics for runoff calculation.
     * @param {param} parameter object landuse, rainfall, infiltration capacity and baseflow.
     * @returns {array} values for runoff as time series.
     */

    static floodhydro (params) {
        //import data from parameters.
         const rain = params["rainfall"];
         const unit = params["unithydro"];
         const cn = params["cn"];
         const stormdur = params["stormduration"];
         const timestep = params["timestep"];

         //create arrays for calculation of runoff
         var numarray = Math.round(stormdur/timestep);
         var finalcount = numarray + unit[0].length;
         var sc = 0;
         var accumrainf  = Array(2).fill(0).map(() => Array(rain[1].length).fill(0));
         accumrainf[0] = rain[0];
         var accumrunff = Array(2).fill(0).map(() => Array(rain[1].length).fill(0));
         accumrunff[0] = rain[0];
         var incrementrunff = Array(2).fill(0).map(() => Array(rain[1].length).fill(0));
         incrementrunff[0] = rain[0];
         const hydros = Array(stormdur).fill(0).map(() => Array(finalcount).fill(0));
         var finalhydro = Array(2).fill(0).map(() => Array(finalcount).fill(0));
        
         // change calculations depending on units.
         switch (params["units"]){
            case "si":
                 sc = 1000/cn - 10;
                 break;
            case "m":
                 sc = 25400/cn - 254;
                 break;
            default:
                 throw new Error("Please use a correct unit system!")   
        };

        //add accumulative rainfall amd calculate initial abstraction.
        var iniabs = 0.20*sc;
        rain[1].slice().reduce((prev,curr,i) => accumrainf[1][i] = prev + curr, 0);
       
       //add runoff calculations.
        for (var i = 0; i < numarray; i++) {
            if (accumrainf[1][i] > 0) {
                accumrunff[1][i] = Math.pow((accumrainf[1][i]-iniabs),2) / (accumrainf[1][i]-iniabs+sc);;
            } else {
                accumrunff[1][i] = 0;
            };
            incrementrunff[1][i] = Number((Math.abs(accumrunff[1][i] - accumrunff[1][i-1]) || 0).toFixed(3));
         };

        //create composite hydrograph.
        for (var j = 0; j < hydros[0].length; j++) {
          hydros[0][j] = Number((incrementrunff[1][j] * unit[1][j] || 0).toFixed(3));
          finalhydro[0][j] = Number(finalhydro[0][j]+timestep);
        };

        //populate the moving hydrographs
        for (var h = 1; h < hydros.length; h++) {
          for (var k = 0; k < hydros[0].length;k++){
            hydros[h][k+h] = Number((hydros[0][k]).toFixed(3));
            finalhydro[1][k] += Number((hydros[h][k]).toFixed(3));
          };
        };
        
        //accumulate timespan for cumulative hydrograph.
        finalhydro[0].slice().reduce((prev,curr,i) => finalhydro[0][i] = Number((prev + curr).toFixed(2), 0));
        return finalhydro;
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