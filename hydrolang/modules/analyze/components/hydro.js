import "../../../external/tensorflow/tensorflow.js";

/**
 * Main class used for hydrological analyses.
 * @class hydro
 */
export default class hydro {
  /**
   * Computation of aereal mean precipitation for a river basin given it has 2 or more different stations.
   * @method arithmetic
   * @memberof hydro
   * @param {Object} data - Contains: array object with precipitation with equal amounts of data from different rain gauges.
   * @returns {Object} Array with object with average precipitation for a specific time series.
   * @example
   * hydro.analyze.hydro.arithmetic({data: [[1, 2, 3, 4], [2, 3, 5, 2]]});
   */

  static arithmetic({ params, args, data } = {}) {
    var arr = data;
    var average = [];
    var final = [];
    var n = arr.length;
    for (var i = 0; i < arr.length; i++) {
      for (var j = 0; j < arr[0].length; j++) {
        average.push(arr[i][j]);
      }
    }
    for (var h = 0; h < average.length; h = +n) {
      var minarr = average.slice(h, h + n);
      final[h] = this.totalprec(minarr) / minarr.length;
      var filtered = final.filter(function (el) {
        return el != null;
      });
    }
    return filtered;
  }

  /**
   * Calculates average precipitation for a basin considering there is
   * one station per sub basin.
   * @method thiessen
   * @memberof hydro
   * @param {Object} params - Contains: rainfall(nD-JS array), areas (1d-JS array)
   * @returns {Object[]} Array with time series of average precipitation over a whole basin.
   * @example
   * hydro.analyze.hydro.thiessen({params: {rainfall:[[1,2,1,2,3], [1,2,34,1,2], [2,4,3,1,4]], areas: [30,40,30]}})
   */

  static thiessen({ params, args, data } = {}) {
    var precs = params.rainfall;
    var areas = params.areas;
    var totarea = this.totalprec({ data: areas });
    var res = this.matrix({
      params: { m: precs.length, n: areas.length, d: 0 },
    });
    var out = this.matrix({ params: { m: 1, n: precs[0].length, d: 0 } });

    for (var i = 0; i < precs.length; i++) {
      for (var j = 0; j < precs[0].length; j++) {
        res[i][j] = precs[i][j] * areas[i];
        out[j] = +res[i][j] / totarea;
      }
    }
    return out;
  }

  /**
   * Calculates parameters for the generation of a unit hydrograph
   * based on SCS method, Snyder Unit Hydrograph.
   * All times of concentrations and lags time are calculated in hours
   * @method syntheticalc
   * @memberof hydro
   * @param {Object} params - Contains: type (SCS, kerby-kirpich, kerby), unit (si, m)
   * @param {Object} args - Contains: l (length), slope (percentage), cn (curve number)
   * @returns {Object} Calculations depending on type.
   * @example
   * hydro.analyze.hydro.thiessen({params: {type: "SCS",unit: "si"}, args: {L: 4000,slope: 10, cn: 82}})
   */

  static syntheticalc({ params, args, data } = {}) {
    //imports from parameters.
    var type = params.type;
    var lon = args.l;
    var sl = args.slope;
    var units = params.unit;

    //Varibles that are to be calculated as solutions.
    var tc, tp, lag;

    //Object containing the solutions for the request.
    var sol = new Object();

    if (type === "SCS") {
      var sc = 0;
      var CN = args.cn;

      switch (units) {
        //longitude in feet, tc in hours, sl in percentage, sc in inches.
        case "si":
          sc = 1000 / CN - 10;
          break;

        case "m":
          //longitude in meters, tc in hours, sl in percentage, sc in mm.
          sc = 25400 / CN - 254;
          break;

        default:
          alert("Please use a correct unit system!");
      }

      tc =
        (Math.pow(lon, 0.8) * Math.pow(sc + 1, 0.7)) /
        (1140 * Math.pow(sl, 0.5));
      tp = 0.7 * tc;
      lag =
        (Math.pow(lon, 0.8) * Math.pow(sc + 1, 0.7)) /
        (1900 * Math.pow(sl, 0.5));
      Object.assign(sol, {
        MaxRetention: sc,
        TimeConc: tc,
        TimePeak: tp,
        LagTime: lag,
      });
    } else if (type === "kerby-kirpich") {
      var K = 0;
      var M = 0;
      var N = args.N;
      var sch = args.sch;
      switch (units) {
        case "si":
          //longitude in feet and sl as number.
          K = 0.0078;
          M = 1.44;
          break;
        case "m":
          //longitude in meters and sl as number
          K = 0.0195;
          M = 0.828;
          break;
        default:
          alert("Please use a correct unit system!");
      }
      //calculating catchment time
      var tov = M * (Math.pow(lon * N), 0.467) * Math.pow(sl / 100, -0.235);

      //calculating main channel time
      var tch = (K * Math.pow(lon, 0.77) * Math.pow(sl / 100, -0.385)) / 60;

      //summing both up.
      tc = tov + tch;
      tp = 0.7 * tc;
      lag = 0.6 * tc;
      Object.assign(sol, {
        TimeConc: tc,
        TimePeak: tp,
        LagTime: lag,
      });
    } else if (type === "kerby") {
      var n = args.manning;

      switch (units) {
        // change calculations depending on units.
        case "si":
          tc = Math.pow((2.2 * n * lon) / Math.pow(sl / 100, 0.5), 0.324) / 60;
          break;
        case "m":
          tc =
            (1.4394 * Math.pow((n * lon) / Math.pow(sl / 100, 0.5), 0.467)) /
            60;
          break;
        default:
          alert("Please use a correct unit system!");
      }
      tp = 0.7 * tc;
      lag = 0.6 * tc;
      Object.assign(sol, {
        TimeConc: tc,
        LagTime: lag,
      });
    }
    return sol;
  }

  /**
   * Creates a dimensionless unit hydrograph using the gamma distribution for calculating Q/Qp.
   * For selection of the peak rate factor, consider that a PRF of 100 is for less flat areas
   * while a PRF of 600 is for very steep terrain.
   * Adapted from from (NEH, 2007).
   * @method dimunithydro
   * @memberof hydro
   * @param {Object} params - Contains: timestep, numhours,
   * @param {Object} args - Contains: type (gamma), prf (peak rate flow between 101 and 566)
   * @returns {Object[]} Array with dimensionless hydrograph.
   * @example
   * hydro.analyze.hydro.dimunithydro({params: {timestep: 0.2,numhours: 5}, args: {type: "gamma", PRF: 484}})
   */

  static dimunithydro({ params, args, data } = {}) {
    //populate
    var step = params.timestep;
    var hours = params.numhours;

    //calculate the number of steps in the hydrograph
    var numstep = Math.round(hours / step) + 1;

    //create new vectors
    var ttp = Array(numstep).fill(0);
    var qqp = Array(numstep).fill(0);
    var m = 0;

    if ((args.type = "gamma")) {
      //change gamma shape factor.
      switch (args.prf) {
        case 101:
          m = 0.26;
          break;
        case 238:
          m = 1;
          break;
        case 349:
          m = 2;
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
          break;
        default:
          alert("Please choose value between 101,238,349,433,484,504,566.");
      }

      //populating the array with t/tp relationship every 0.1t.
      //populating the array with q/qp using Gamma distribution with PRF value.
      for (var i = 1; i < ttp.length; i++) {
        ttp[i] = Number((ttp[i - 1] + step).toFixed(2));
        qqp[i] = Number(
          (Math.exp(m) * Math.pow(ttp[i], m) * Math.exp(-m * ttp[i])).toFixed(3)
        );
      }
      return [ttp, qqp];
    } else {
      alert("Please use available distributions!");
    }
  }

  /**
   * Hyetograph generator for a uniformly distributed rainfall event. NOT FINISHED YET!
   * Considered for long duration storms.
   * The timestep should be uniformly distributed
   * @method hyetogen
   * @memberof hydro
   * @param {Object} data - Contains: event (2D array with timeseries of a rainfall event)
   * @returns {Object[]} n-D array of pulses per hour
   * @example
   * hydro.analyze.hydro.hyetogen({data: {event: [[time1, time2, ...], [rainf1, rainf2, ...]]}})
   */

  static hyetogen({ params, args, data } = {}) {
    var event = data.event;
    var time = event[0];
    var rainf = event[1];

    //if timestep in JavaScript string
    if (typeof time[0] == "string") {
      for (var i = 0; i < time.length; i++) {
        time[i] = Date.parse(time[i]);
      }
    }

    //calculate the time step of the series.
    var timestep = Math.abs(time[1] - time[0]);

    var count;

    //to continue!
  }

  /**
   * Unit hydrograph constructor NRCS constructor depending on the
   * physical characteristics of a regularly shaped basin. Adapted from https://directives.sc.egov.usda.gov/OpenNonWebContent.aspx?content=17755.wba
   * @method unithydrocons
   * @memberof hydro
   * @param {Object} params - Contains: drainagearea (in sqmi or km2), type (dim, obs), units(si, m)
   * @param {Object} args - Contains: peak (hours), tconcentration (hours), baseflow (cfs or cumecs)
   * @param {Object} data - Contains: event either dimensionless or observed as 1d-JS array [[TSevent]]
   * @returns {Object[]} Array with time series array. If metric in m3/s, if SI in cfs.
   * @example
   * hydro.analyze.hydro.unithydrocons({params: {drainagearea: 'someNum', type: 'someNum', units: 'someUnit'}
   * args: {peak: 'someNum', tconcentration: 'someNum', baseflow: 'someNum'},
   * data: [[time1, time2, ...], [value1, value2,...]]});
   */

  static unithydrocons({ params, args, data } = {}) {
    //import parameters from user.
    var area = params.drainagearea;
    var duh = data;
    var unit = this.matrix({ params: { m: 2, n: duh[0].length, d: 0 } });

    //unit hydro from dimensionless hydrograph.
    if (params.type == "dim") {
      //peak rate factor chosen.
      var peak = args.peak;

      //calculate time step.
      var tconc = args.tconcentration;
      var deltat = Number((tconc * 0.133).toFixed(3));

      //calculate time to peak and construct result arrays.
      var tp = deltat / 2 + 0.6 * tconc;
      var qp = 0;

      //change peak discharge depending on the units.
      switch (params.units) {
        case "si":
          qp = (peak * area * 1) / tp;
          break;
        case "m":
          qp = (peak * area * 1) / tp;
          break;
        default:
          alert("Please input a valid unit system!");
      }

      //populate the hydrograph with time and discharge.
      for (var h = 0; h < unit[0].length; h++) {
        unit[0][h] = Number((duh[0][h] * tp).toFixed(3));
        unit[1][h] = Number((duh[1][h] * qp).toFixed(3));
      }
      return unit;
    }

    //unit hydro from observed hydrograph.
    else if (params.type == "obs") {
      var baseflow = args.baseflow;
      var drh = this.matrix({ params: { m: 1, n: duh[0].length, d: 0 } });
      unit[0] = duh[0];
      //timestep in hours
      var timestep = Math.abs(unit[0][1] - unit[0][0]) * 60 * 60;

      console.log(unit);

      for (var i = 0; i < unit[0].length; i++) {
        drh[i] = Math.abs(duh[1][i] - baseflow);
      }

      var sum = this.totalprec({ data: drh }) * timestep;
      var vol = 0;

      switch (params.units) {
        case "si":
          //calculated in inches
          vol = Math.round((sum / area) * 12);
          break;
        case "m":
          //calculated in cms
          vol = Math.round((sum / area) * 100);
      }

      for (var j = 0; j < unit[0].length; j++) {
        //unit hydrograph in cfs/inch or cumecs/cm
        unit[1][j] = Math.round(drh[j] / vol);
      }

      unit[1].reverse();

      return {
        unithydro: unit,
        totalvol: vol,
      };
    }
  }

  /**
   * Flooding hydrograph generator using a unit hydrograph,
   * precipitation data and SCS metrics for runoff calculation.
   * If the observed hydrograph option is selected, the precipitation must be dividied in
   * blocks of rainfall in as a 2D array [[date, date, date], [rainf, rainf, rainf]]
   * @method floodhydro
   * @memberof hydro
   * @param {Object} params - Contains: baseflow
   * @param {Object} args - Contains: type (SCS, obs), CN (if SCS), stormduration (event duration in hours), timestep (in hours), units (si, m)
   * @param {Object[]} data - Contains: 2d-JS array with Timeseries Data [[TSrainfall], [TSunithydro]]
   * @returns {Object[]} Array with values for runoff as time series.
   * @example
   * var floodconfig = {rainfall: 2darray, unithydro: 2darray, type: "obs"};
   * hydro1.analyze.hydro.floodhydro({params: {baseflow: 'someNum'}, args: {type: 'someType', CN: 'someNum', stormduration: 'someNum', timestep: 'someNum'}
   * data: [[[1,2,3][0.1,0.2,0.4]], [[1,2,3],[0.3,0.1,0.2]]]})
   */

  static floodhydro({ params, args, data } = {}) {
    //import data from parameters.
    const rain = data[0];
    const unit = data[1];
    var baseflow = params.baseflow;

    if (!params.baseflow) {
      baseflow = 0;
    }

    if (args.type == "SCS") {
      const cn = args.cn;
      const stormdur = args.stormduration;
      const timestep = args.timestep;

      //transform the date into javascript format.

      //create arrays for calculation of runoff
      var numarray = Math.round(stormdur / timestep);
      var finalcount = numarray + unit[0].length;
      var sc = 0;
      var accumrainf = this.matrix({
        params: { m: 2, n: rain[1].length, d: 0 },
      });
      accumrainf[0] = rain[0];
      var accumrunff = this.matrix({
        params: { m: 2, n: rain[1].length, d: 0 },
      });
      accumrunff[0] = rain[0];
      var incrementrunff = this.matrix({
        params: { m: 2, n: rain[1].length, d: 0 },
      });
      incrementrunff[0] = rain[0];
      var hydros = this.matrix({
        params: { m: stormdur, n: finalcount, d: 0 },
      });
      var finalhydro = this.matrix({ params: { m: 2, n: finalcount, d: 0 } });

      // change calculations depending on units.
      switch (args.units) {
        case "si":
          sc = 1000 / cn - 10;
          break;
        case "m":
          sc = 25400 / cn - 254;
          break;
        default:
          alert("Please use a correct unit system!");
      }

      //add accumulative rainfall and calculate initial abstraction.
      var iniabs = 0.2 * sc;
      rain[1]
        .slice()
        .reduce((prev, curr, i) => (accumrainf[1][i] = prev + curr), 0);

      //add runoff calculations.
      for (var i = 0; i < numarray; i++) {
        if (accumrainf[1][i] > 0) {
          accumrunff[1][i] =
            Math.pow(accumrainf[1][i] - iniabs, 2) /
            (accumrainf[1][i] - iniabs + sc);
        } else {
          accumrunff[1][i] = 0;
        }
        incrementrunff[1][i] = Number(
          (Math.abs(accumrunff[1][i] - accumrunff[1][i - 1]) || 0).toFixed(3)
        );
      }

      //create composite hydrograph.
      for (var j = 0; j < hydros[0].length; j++) {
        hydros[0][j] = Number(
          (incrementrunff[1][j] * unit[1][j] || 0).toFixed(3)
        );
        finalhydro[0][j] = Number(finalhydro[0][j] + timestep);
      }

      //populate the moving hydrographs
      for (var h = 1; h < hydros.length; h++) {
        for (var k = 0; k < hydros[0].length; k++) {
          hydros[h][k + h] = Number(hydros[0][k].toFixed(3));
          finalhydro[1][k] = Number(hydros[h][k].toFixed(3)) + baseflow;
        }
      }

      //accumulate timespan for cumulative hydrograph.
      finalhydro[0]
        .slice()
        .reduce(
          (prev, curr, i) =>
            (finalhydro[0][i] = Number((prev + curr).toFixed(2), 0))
        );

      for (var p = 0; p < finalhydro[1].length; p++) {
        finalhydro[1][p] = finalhydro[1][p];
      }

      finalhydro[1].reverse();

      return finalhydro;
    } else if (args.type == "obs") {
      var hydros = [];
      var timestep = Math.abs(rain[0][1] - rain[0][0]);

      //calculate the runoff per pulse.
      for (var i = 0; i < rain[1].length; i++) {
        var neq = [];
        for (var j = 0; j < unit[1].length - 1; j++) {
          neq.push(unit[1][j] * rain[1][i]);
        }
        hydros.push(neq);
      }

      var final = this.matrix({
        params: { m: 2, n: unit[1].length + hydros.length, d: 0 },
      });

      //zeros up
      for (var k = 0; k < hydros.length; k++) {
        var zeros = new Array(timestep * hydros.indexOf(hydros[k])).fill(0);
        zeros.forEach((x) => hydros[k].unshift(x));
        hydros[k].shift();
      }

      //zeros down
      for (var l = 0; l < hydros.length; l++) {
        var finalarr = hydros[hydros.length - 1].length;
        var zeros = new Array(finalarr - hydros[l].length).fill(0);
        zeros.forEach((x) => hydros[l].push(x));
      }

      final[1] = hydros[0].map((x, i) =>
        hydros.reduce((sum, curr) => sum + curr[i], baseflow)
      );

      //time and discharge sum
      for (var p = 0; p < final[1].length; p++) {
        final[0][p] = p;
      }

      return final;
    }
  }

  /**
   * Simple rainfall-runoff analyses over a rainfall dataset given landuse, baseflow and infiltration capacity.It is mainly used for long-term hydrological analysis such as monthly changes.
   * All should be in mm. For more info, refer to https://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.544.5085&rep=rep1&type=pdf
   * @method bucketmodel
   * @memberof hydro
   * @param {Object} params - Contains: baseflow, infiltration (in same units)
   * @param {Object} args - Contains: landuse percentage (summing all to 1): agriculture, barerock, grassland, forest, urban
   * @param {Object[]} data - Contains: 2d-JS array in the following order: [[rainfall], [evaporation]]
   * @returns {Object[]} 1d-array with time series according to different time spans (5min, 15 min, 1 hour, 1 day...).
   * @example
   * hydro.analyze.hydro.bucketmode({params:{baseflow: 1, infiltration: 0.3},
   * args: {agriculture: 0.1, evaporation: 0.2, barerock: 0.5, grassland: 0.1, forest: 0.05, urban: 0.05},
   * data: [[1,2,3,4,5], [0.1,0.2,0.3,0.4,0.5]})
   */

  static bucketmodel({ params, args, data } = {}) {
    //initial parameters
    var rainfall = data[0];
    let n = rainfall.length;
    let baseflow = params.baseflow / 24;
    let evapodata = data[1];
    let landuse = [
      args.agriculture,
      args.barerock,
      args.grassland,
      args.forest,
      args.urban,
    ];
    let infiltration = params.infiltration;
    //infiltration capacities for agriculture, bare rock, grassland, forest and
    //urban, respectively in mm.
    let FieldCaps = [25, 5, 25, 50, 5];

    //arrays and variables
    var initial = this.matrix(landuse.length, n, 0);
    var interflow = this.matrix(landuse.length, n, 0);
    var overflow = this.matrix(landuse.length, n, 0);
    var totalflow = this.matrix(landuse.length, n, 0);
    var totalrunoff = this.matrix(landuse.length, n, 0);

    // initial moisture
    for (var i = 0; i < FieldCaps.length; i++) {
      initial[i][0] = FieldCaps[i] * landuse[i] + rainfall[0] - evapodata[0];
    }

    //initial soil moisture
    for (var k = 0; k < FieldCaps.length; k++) {
      if (initial[k][0] > FieldCaps[k]) {
        overflow[k][0] = initial[k][0] - FieldCaps[k];
        initial[k][0] = FieldCaps[k];
      } else {
        overflow[k][0] = 0;
      }
      if (initial[k][0] > 0) {
        interflow[k][0] = initial[k][0] * infiltration;
      } else {
        interflow[k][0] = 0;
      }
    }

    //calculating overland and interflow
    for (var m = 0; m < FieldCaps.length; m++) {
      for (var p = 1; p < n; p++) {
        initial[m][p] =
          initial[m][p - 1] * (1 - infiltration) + rainfall[p] - evapodata[p];
        if (initial[m][p] > FieldCaps[m]) {
          overflow[m][p] = initial[m][p] - FieldCaps[m];
          initial[m][p] = 0;
        } else {
          overflow[m][p] = 0;
        }
        if (initial[m][p] > 0) {
          interflow[m][p] = initial[m][p] * infiltration;
        } else {
          interflow[m][p] = 0;
        }
      }
    }

    //calculating the total amount of flow from overflow, baseflow and interflow
    for (var j = 0; j < FieldCaps.length; j++) {
      for (var h = 0; h < n; h++) {
        totalflow[j][h] = overflow[j][h] + interflow[j][h] + baseflow;
      }
    }
    //calculating total runoff
    for (var q = 0; q < n; q++) {
      totalrunoff[q] =
        totalflow[0][q] * landuse[0] +
        totalflow[1][q] * landuse[1] +
        totalflow[2][q] * landuse[2] +
        totalflow[3][q] * landuse[3] +
        totalflow[4][q] * landuse[4];
    }

    /*var finalvalues = this.matrix(2,n, 0)

    for (var w = 0; w < finalvalues[1].length; w++) {
      finalvalues[0][w] = w * 60;
      finalvalues[1][w] = totalrunoff[w];
    }

    var agg = this.rainaggr({"event": finalvalues, "agg": {"type": "aggr", "interval": 1440}})*/
    return totalrunoff;
  }

  /**
   * Solves 1d groundwater steady simulation using gaussian elimination.
   * Adapted from (Molkentin, 2019).
   * @method ground1d
   * @memberof hydro
   * @param {Object} params - Contains: length, k (discharge coeff), nodes
   * @param {Object} args - Contains: w0 and q0 (extraction, discharge at point 0), w1 and q1 (extraction, discharge point 1)
   * @return {Object[]} Matrix with solutions.
   * @example
   * hydro.analyze.hydro.groud1d({params: {length: 'someNum', k: 'someNum', nodes: 'someNodes'},
   * args: {w0: 'someNum', w1: 'someNum', q0: 'someNum', q1: 'someNum'}})
   */

  static ground1d({ params, args, data } = {}) {
    //pass data from params to variables.
    var length = params.length;
    var k = params.k;
    var nodes = params.nodes;
    var w0 = args.w0;
    var w1 = args.w1;

    var hL = args.hL;
    var q0 = args.q0;
    var qL = args.qL;

    var dx = length / (nodes - 1);

    //create a new equation system
    var matrix = this.matrix({ params: { m: nodes, n: nodes, d: 0 } });
    var vec_left = this.matrix({ params: { m: 1, n: nodes, d: 0 } });
    var vec_right = this.matrix({ params: { m: 1, n: nodes, d: 0 } });

    //equation system set up.
    var factor = k / dx;

    //initial boundary.
    matrix[0][0] = factor;
    matrix[0][1] = -factor;
    vec_right[0] = q0;

    //last boundary.
    var index = nodes - 1;
    matrix[index][index] = -factor;
    matrix[index][index - 1] = factor;
    vec_right[index] = qL;

    //calculate inner nodes using Runge-Kutta 1D.
    for (var i = 1; i < nodes - 1; i++) {
      var newfac = k / (dx * dx);
      matrix[i][i] = 2 * newfac;
      matrix[i][i - 1] = -1 * newfac;
      matrix[i][i + 1] = -1 * newfac;
      vec_right[i] = w0 + w1 * i * dx;
    }

    //solve equation system.
    this.equationsystemsolver({
      data: matrix,
      params: { left: vec_left, right: vec_right },
    });

    //calculate discharge in vec_right
    vec_right[0] = (-k * (vec_left[1] - vec_left[0])) / dx;

    for (var i = 1; i < nodes - 1; i++) {
      vec_right[i] = ((-k * (vec_left[i + 1] - vec_left[i - 1])) / dx) * 0.5;
    }

    vec_right[index] = (-k * (vec_left[index] - vec_left[index - 1])) / dx;

    return vec_left;
  }

  /**
   * Aggregates or dissaggregates rainfall data depending on what
   * the user requires. The date type must be a Javascript string or number and in minutes or hours, but both
   * the aggregation interval require and the data interval should be the same.
   * For aggregation, the interval for aggregation must be larger than the time step. For example,
   * 15 min or 30 min data to be aggregatted every 60 minutes. Intervals must be multiples of the final aggregaiton (2, 4, etc)
   * @method rainaggr
   * @memberof hydro
   * @param {Object} params - Contains: type (aggr, disagg), interval (in minutes for both cases)
   * @param {Object[]} data - Contains: data as 2D array in
   * @returns {Object[]} Array with aggregated/disaggregated data.
   * @example
   * hydro1.analyze.hydro.rainaggr({params: {type: 'aggr', interval: 240}, data: [[rainTS]]})
   */

  static rainaggr({ params, args, data } = {}) {
    var event = data;
    var agtype = params.type;
    //time interval required by the user in minutes.
    var finagg = params.interval;

    var datetr = this.matrix({
      params: { m: event.length, n: event[1].length, d: 0 },
    });

    for (var i = 0; i < event[0].length; i++) {
      if (typeof event[0][0] == "string") {
        datetr[0][i] = Date.parse(event[0][i]);
      } else {
        datetr[0][i] = event[0][i];
      }
    }

    for (var j = 1; j < event.length; j++) {
      datetr[j] = event[j];
    }

    //change the datatypes of date.
    if (agtype == "aggr") {
      //timestep and total duration in minutes.
      var time = Math.abs(datetr[0][1]);
      var timestep = 0;
      var lastval = 0;

      if (typeof event[0][0] == "string") {
        time = Math.abs(datetr[0][0]);
        timestep = Math.abs((datetr[0][0] - datetr[0][1]) / (60 * 1000));
        lastval = Math.abs(
          (datetr[0][0] - datetr[0][datetr[0].length - 1]) / (60 * 1000)
        );
      } else {
        time = Math.abs(datetr[0][0]);
        timestep = Math.abs(datetr[0][0] - datetr[0][1]);
        lastval = Math.abs(datetr[0][datetr[0].length - 1]);
      }

      //amount of steps required and length of each step.
      var count = Math.round(finagg / timestep);
      console.log(`Amount of steps: ${count}`);
      var narr = Math.round(lastval / finagg);
      console.log(`Final aggregation number: ${narr}`);

      //initialize time and data variables to be handled separately.
      var fintime = [];
      var findata = [];

      for (var j = 0; j < narr * count; j += count) {
        var minitime = datetr[0].slice(j, j + count);
        var minidata = datetr[1].slice(j, j + count);
        if (typeof event[0][0] == "string") {
          fintime.push(
            new Date(
              this.totalprec({ data: minitime }) - time
            ).toLocaleTimeString()
          );
        } else {
          fintime.push(j);
        }
        findata.push(this.totalprec({ data: minidata }));
      }
      return [fintime, findata];
    } else if (agtype == "disagg") {
      var finagg = params.interval;
      //Unfinished, still need to link more implementation.
    }
  }

  /***************************/
  /***** Helper functions ****/
  /***************************/

  /**
   * Arithmetic sum of the values inside an array.
   * @method totalprec
   * @memberof hydro
   * @param {Object[]} data - 1darray with precipitation event.
   * @returns {Number} Total amount of precipitation during an event on a given station.
   * @example
   * hydro.analyze.hydro.totalprec({data: [some1dArray]})
   */

  static totalprec({ params, args, data } = {}) {
    var sum = 0;
    var k = data.length;
    while (--k >= 0) {
      sum += data[k];
    }
    return sum;
  }

  /**
   * Moving arrays from one location to another given an index.
   * @method move
   * @memberof hydro
   * @param {Object[]} data - Contains: array that is to be pushed in subtitute array.
   * @param {Object} params - Contains: from (index in original array), to (index in substitute array)
   * @returns {Object[]} Array with transposed columns
   * @example
   * hydro.analyze.hydro.move({params: {to: 'someNum', from: 'someNum'}, data: [somenD-Array]})
   */

  static move({ params, args, data } = {}) {
    var from = params.from;
    var to = params.to;
    if (to === from) return data;

    var target = data[from];
    var increment = to < from ? -1 : 1;

    for (var k = from; k != to; k += increment) {
      data[k] = data[k + increment];
    }
    data[to] = target;
    return data;
  }

  /**
   * Creates a matrix of m x n dimensions filled with whatever
   * the user requires. For numerical calculations, fill it with 0s.
   * @method matrix
   * @memberof hydro
   * @param {Object} params - Contains: m(num columns), n (num rows), d (filler)
   * @returns {Object[]} Matrix - m x n array.
   * @example
   * hydro.analyze.hydro.matrix({params: {m: someNum, n: someNum, d: someNum}})
   */

  static matrix({ params, args, data } = {}) {
    var mat;
    if (typeof params.d == undefined) {
      mat = Array(params.m).map(() => Array(params.n));
    } else {
      mat = Array(params.m)
        .fill(params.d)
        .map(() => Array(params.n).fill(params.d));
    }
    return mat;
  }

  /**
   * Solves linear equations in the form Ax = b.
   * @method equationsystemsolver
   * @memberof hydro
   * @param {Object} params - Contains: right (right hand side 1D JS array), left (left hand side 1D JS array)
   * @param {Object[]} data - Contains: matrix to be filled.
   * @returns {Object[]} Left vector solution.
   * @example
   * hydro.analyze.hydro.equationsystemsolver({params: {left: [data1, data2,...], right: [data1, data2,...]}, data: [[someMatrix]]})
   */

  static equationsystemsolver({ params, args, data } = {}) {
    var matrix = data;
    var vec_left = params.left;
    var vec_right = params.right;
    var fMaxEl;
    var fAcc;
    var nodes = vec_left.length;

    for (k = 0; k < nodes; k++) {
      //search line with largest element.
      fMaxEl = Math.abs(matrix[k][k]);
      var m = k;

      for (var i = k + 1; i < nodes; i++) {
        if (Math.abs(fMaxEl) < Math.abs(matrix[i][k])) {
          fMaxEl = matrix[i][k];
          m = i;
        }
      }
      // permutation of base line (index k) and max element line (index m)
      if (m != k) {
        for (var i = k; i < nodes; i++) {
          fAcc = matrix[k][i];
          matrix[k][i] = matrix[m][i];
          matrix[m][i] = fAcc;
        }
        fAcc = vec_right[k];
        vec_right[k] = vec_right[m];
        vec_right[m] = fAcc;
      }
      if (Math.abs(matrix[k][k]) < 1e-10) {
        alert("Singular matrix" + k + " " + matrix[k][k]);
      }
      for (var j = k + 1; j < nodes; j++) {
        fAcc = -matrix[j][k] / matrix[k][k];
        for (var i = k; i < nodes; i++) {
          matrix[j][i] = matrix[j][i] + fAcc * matrix[k][i];
        }
        vec_right[j] = vec_right[j] + fAcc * vec_right[k];
      }
    }
    for (var k = nodes - 1; k >= 0; k--) {
      vec_left[k] = vec_right[k];

      for (var i = k + 1; i < nodes; i++) {
        vec_left[k] -= matrix[k][i] * vec_left[i];
      }
      vec_left[k] = vec_left[k] / matrix[k][k];
    }
  }

  /**********************************/
  /*** End of Helper functions **/
  /**********************************/
}
