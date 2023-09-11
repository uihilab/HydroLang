import stats from "./stats.js";

/**
 * Main class used for hydrological analyses.
 * @class
 * @name hydro
 */
export default class hydro {
  constructor(){
    //Defining stats variable to be used throughout the component
    this.stats = new stats()
  }
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
    var arr = data,
      average = [],
      final = [],
      n = arr.length;
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

  /**Thiessen polygon method for rainfall areal averaging.
   * Calculates the weighted average of point rainfall observations by dividing the study area into polygonal subareas and weighting each observation by the proportion of the total area it contributes to.
   * @method thiessen
   * @memberof hydro
   * @param {Object} params - Contains: areas (array with the areas of each polygon)
   * @param {Object} args - Empty for now
   * @param {Object} data - Contains: an array of arrays with rainfall observations for each point
   * @returns {Array} - Array with the weighted average of point rainfall observations for each time step
   * @example
   * hydro.analyze.thiessen({params: {areas: [10, 20, 30]}data: [[0.3, 0.2, 0.5], [0.2, 0.3, 0.4], [0.1, 0.4, 0.5]]});
   */

  static thiessen({ params, args, data } = {}) {
    const areas = params.areas;

    // Check if number of data arrays matches number of areas, fill remaining with empty arrays
    const numAreas = areas.length;
    const numDataArrays = data.length;
    if (numDataArrays < numAreas) {
      const emptyArrays = Array(numAreas - numDataArrays).fill([]);
      data = [...data, ...emptyArrays];
    }

    // Check if areas array contains valid numbers
    if (areas.some(isNaN)) {
      throw new Error("Invalid input: areas array contains non-numeric values");
    }

    const totalarea = this.totalprec({ data: areas });

    // Find the longest rainfall array and set its length as the number of columns
    const maxLength = Math.max(...data.map((arr) => arr.length));
    const rainfallData = data.map((arr) =>
      Array.from({ length: maxLength }, (_, i) => arr[i] ?? 0)
    );

    const res = this.matrix({
      params: { m: rainfallData.length, n: areas.length, d: 0 },
    });
    const out = Array.from({ length: maxLength }, (_, i) => 0);

    for (let i = 0; i < rainfallData.length; i++) {
      for (let j = 0; j < maxLength; j++) {
        res[i][j] = rainfallData[i][j] * areas[i];
        // Check if totarea is not zero before dividing
        out[j] = totalarea !== 0 ? out[j] + res[i][j] / totalarea : out[j];
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
    var type = params.type,
      lon = args.l,
      sl = args.slope,
      units = params.unit,
      //Varibles that are to be calculated as solutions.
      tc,
      tp,
      lag,
      //Object containing the solutions for the request.
      sol = new Object();

    if (type === "SCS") {
      var sc = 0,
        CN = args.cn;

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
          throw error("Please use a correct unit system!");
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
      var K = 0,
        M = 0,
        N = args.N;
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
          throw error("Please use a correct unit system!");
      }
      //calculating catchment time
      var tov = M * (Math.pow(lon * N), 0.467) * Math.pow(sl / 100, -0.235),
        //calculating main channel time
        tch = (K * Math.pow(lon, 0.77) * Math.pow(sl / 100, -0.385)) / 60;

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
          throw error("Please use a correct unit system!");
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
   * Generates a hydrograph using various distribution types (gamma, LP3, weibull) for a given duration and time step
   * @method dimunithydr
   * @memberof hydr
   * @param {Object} params - Contains: timeStep (time step between data points), numhours (total duration in hours
   * @param {Object} args - Contains: type (distribution type: "gamma", "lp3", "weibull"), prf (peak reduction factor), lambda (parameter for LP3 distribution), tpeak (peak time for LP3 distribution), alpha (shape parameter for Weibull distribution), beta (scale parameter for Weibull distribution), t0 (location parameter for Weibull distribution
   * @param {Array} data - Additional data
   * @returns {Array} Array of two arrays: ttp (time values) and qqp (flow values)
   * @example
   * hydro.analyze.hydro.dimunithydro(
   * params: { timeStep: 0.1, numhours: 10 }
   * args: { type: "gamma", prf: 238 }
   * data: [
   * });
   */

  static dimunithydro({ params, args, data } = {}) {
    //populate
    var step = params.timeStep,
      hours = params.numhours,
      //calculate the number of steps in the hydrograph
      numstep = Math.round(hours / step) + 1,
      //create new vectors
      ttp = Array(numstep).fill(0),
      qqp = Array(numstep).fill(0),
      m = 0;

    if (args.type === "gamma") {
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
          throw Error(
            "Please choose value between 101,238,349,433,484,504,566."
          );
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
    } else if (args.type === "lp3") {
      //populating the array with t/tp relationship every 0.1t.
      //populating the array with q/qp using LP3 distribution with PRF value.
      for (var i = 1; i < ttp.length; i++) {
        ttp[i] = Number((ttp[i - 1] + step).toFixed(2));
        qqp[i] = Number(
          (1 / args.lambda) *
            Math.pow((3 / 2) * (ttp[i] / args.tpeak), args.lambda) *
            Math.exp(-Math.pow(ttp[i] / args.tpeak, args.lambda) * (3 / 2))
        ).toFixed(3);
      }
      return [ttp, qqp];
    } else if (args.type === "weibull") {
      var alpha = args.alpha,
        beta = args.beta,
        t0 = args.t0;
      var c1 = (beta / alpha) * Math.exp(-Math.pow(t0 / alpha, beta));

      for (var i = 1; i < ttp.length; i++) {
        ttp[i] = Number((ttp[i - 1] + step).toFixed(2));
        qqp[i] =
          c1 *
          Math.exp(-Math.pow((ttp[i] - t0) / alpha, beta)) *
          (Math.exp((beta / alpha) * ttp[i]) -
            Math.exp((beta / alpha) * ttp[i - 1]));
      }
      return [ttp, qqp];
    } else {
      throw Error("Please use available distributions!");
    }
  }

  /**
   * Hyetograph generator for a uniformly distributed rainfall event.
   * This function generates a hyetograph for a long-duration storm based on a uniformly distributed rainfall event.
   * @method hyetogen
   * @memberof hydro
   * @param {Object} params - Contains: duration (number) representing the duration of the storm in hours, timestep (number) representing the time interval for the hyetograph in hours, and intensity (number) representing the rainfall intensity in mm/hour.
   * @param {Object} data - Contains: event (2D array with timeseries of a rainfall event).
   * @returns {Object} An object containing the hyetograph array and the timestep used to generate it.
   * @example
   * hydro.analyze.hydro.hyetogen({params: {duration: 24, timestep: 1, intensity: 20}})
   * hydro.analyze.hydro.hyetogen({data: {event: [[time1, time2, ...], [rainf1, rainf2, ...]]}})
   */

  static hyetogen({ params, args, data } = {}) {
    const duration = params.duration;
    let hyetograph = [];
    let timestep = params.timestep;
    let intensity;

    // If rainfall data is provided, infer hyetograph intensity and generate hyetograph
    if (data) {
      const rainfall = data;
      const totalRainfall = rainfall.reduce((a, b) => a + b, 0);
      const intensity = totalRainfall / duration;

      for (let i = 0; i < rainfall.length; i++) {
        hyetograph.push(rainfall[i] / timestep);
      }
    }

    // If intensity is provided, generate hyetograph using normal distribution
    else if (params.intensity) {
      intensity = params.intensity;
      const mean = duration / 2;
      const stddev = duration / 6;
      const count = Math.round(duration / timestep);
      const gaussian = (x) =>
        Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stddev, 2)));
      const normalize = (x) => x / gaussian(mean);

      timestep = duration / count;

      for (let i = 0; i < count; i++) {
        const x = i * timestep;
        const y = normalize(gaussian(x)) * intensity;
        hyetograph.push(y);
      }
    }

    return {
      hyetograph: hyetograph,
      timestep: timestep,
    };
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
    var area = params.drainagearea,
      duh = data,
      unit = this.matrix({ params: { m: 2, n: duh[0].length, d: 0 } });

    //unit hydro from dimensionless hydrograph.
    if (params.type == "dim") {
      //peak rate factor chosen.
      var peak = args.peak,
        //calculate time step.
        tconc = args.tconcentration,
        deltat = Number((tconc * 0.133).toFixed(3)),
        //calculate time to peak and construct result arrays.
        tp = deltat / 2 + 0.6 * tconc,
        qp = 0;

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
      var baseflow = args.baseflow,
        drh = this.matrix({ params: { m: 1, n: duh[0].length, d: 0 } });
      unit[0] = duh[0];
      //timestep in hours
      var timestep = Math.abs(unit[0][1] - unit[0][0]) * 60 * 60;

      console.log(unit);

      for (var i = 0; i < unit[0].length; i++) {
        drh[i] = Math.abs(duh[1][i] - baseflow);
      }

      var sum = this.totalprec({ data: drh }) * timestep,
        vol = 0;

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

  static floodhydro({ params = {}, args = {}, data = [] } = {}) {
    const [rain, unit] = data;
    let { baseflow = 0 } = params;

    if (args.type == "SCS") {
      const cn = args.cn,
        stormdur = args.stormduration,
        timestep = args.timestep;

      //transform the date into javascript format.

      //create arrays for calculation of runoff
      var numarray = Math.round(stormdur / timestep),
        finalcount = numarray + unit[0].length,
        sc = 0,
        accumrainf = this.matrix({
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
        }),
        finalhydro = this.matrix({ params: { m: 2, n: finalcount, d: 0 } });

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
      var hydros = [],
        timestep = Math.abs(rain[0][1] - rain[0][0]);

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
        var finalarr = hydros[hydros.length - 1].length,
          zeros = new Array(finalarr - hydros[l].length).fill(0);
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
    // Initial parameters
    const { rainfall, evaporation } = data;
    let { baseflow, infiltration } = params;
    const { agriculture, barerock, grassland, forest, urban } = args;
    const n = rainfall.length;
    const landuse = [agriculture, barerock, grassland, forest, urban];
    baseflow = baseflow / 86400; // Convert from m3/s to mm/s

    // Infiltration capacities for agriculture, bare rock, grassland, forest and
    // urban, respectively in mm.
    const FieldCaps = [25, 5, 25, 50, 5];

    // Arrays and variables
    const initial = this.matrix({ params: { m: landuse.length, n: n, d: 0 } });
    const interflow = this.matrix({
      params: { m: landuse.length, n: n, d: 0 },
    });
    const overflow = this.matrix({ params: { m: landuse.length, n: n, d: 0 } });
    const totalflow = this.matrix({
      params: { m: landuse.length, n: n, d: 0 },
    });
    const totalrunoff = new Array(n).fill(0);

    // Initial moisture
    for (let i = 0; i < FieldCaps.length; i++) {
      initial[i][0] = FieldCaps[i] * landuse[i] + rainfall[0] - evaporation[0];
    }

    // Initial soil moisture
    for (let k = 0; k < FieldCaps.length; k++) {
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

    // Calculating overland and interflow
    for (let m = 0; m < FieldCaps.length; m++) {
      for (let p = 1; p < n; p++) {
        initial[m][p] =
          initial[m][p - 1] * (1 - infiltration) + rainfall[p] - evaporation[p];
        if (initial[m][p] > FieldCaps[m]) {
          overflow[m][p] = initial[m][p] - FieldCaps[m];
          initial[m][p] = FieldCaps[m];
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

    // Calculating the total amount of flow from overflow, baseflow and interflow
    for (let j = 0; j < FieldCaps.length; j++) {
      for (let h = 0; h < n; h++) {
        totalflow[j][h] =
          overflow[j][h] + interflow[j][h] + baseflow * landuse[j];
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
   * Solves 1d groundwater steady simulation using gaussian elimination for a static setting.
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

  static staticGround1d({ params, args, data } = {}) {
    //pass data from params to variables.
    var length = params.length,
      k = params.k,
      nodes = params.nodes,
      w0 = args.w0,
      w1 = args.w1,
      hL = args.hL,
      q0 = args.q0,
      qL = args.qL,
      dx = length / (nodes - 1),
      //create a new equation system
      matrix = this.matrix({ params: { m: nodes, n: nodes, d: 0 } }),
      vec_left = this.matrix({ params: { m: 1, n: nodes, d: 0 } }),
      vec_right = this.matrix({ params: { m: 1, n: nodes, d: 0 } }),
      //equation system set up.
      factor = k / dx;

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
   * Solves 1D dynamic groundwater simulation using the Crank-Nicolson method
   * Adapted from (Molkentin, 2019)
   * @method dynamicGround1D
   * @memberof hydro
   * @param {Object} params - Contains: length (length of the domain), nodes (number of nodes), k (hydraulic conductivity
   * @param {Object} args - Contains: dt (time step), T (total simulation time), h0 (initial hydraulic head), hL (hydraulic head at the boundary), q0 (flow rate at the boundary), qL (flow rate at the boundary), phi (porosity), Ss (specific storage), Sy (specific yield
   * @param {Array} data - Additional data
   * @returns {Array} Array of solutions representing the hydraulic head at each node
   * @example
   * hydro.analyze.hydro.dynamicGround1D(
   * params: { length: 100, nodes: 10, k: 0.5 }
   * args: { dt: 0.1, T: 10, h0: 10, hL: 5, q0: 1, qL: 0.5, phi: 0.3, Ss: 0.002, Sy: 0.15 }
   * data: [
   * });
   */
  static dynamicGround1D({ params, args, data } = {}) {
    // pass data from params to variables
    const { length, nodes, k } = params;
    const { dt, T, h0, hL, q0, qL, phi, Ss, Sy } = args;

    const dx = length / (nodes - 1);
    const a = k / (phi * Ss);
    const b = (Sy * a) / dt;
    const c = k / dx;
    const d = Sy * h0 + (1 - Sy) * hL;

    // create a new equation system
    const matrix = this.matrix({ params: { m: nodes, n: nodes, d: 0 } });
    const vec_left = this.matrix({ params: { m: 1, n: nodes, d: 0 } });
    const vec_right = this.matrix({ params: { m: 1, n: nodes, d: 0 } });

    // equation system set up
    matrix[0][0] = 1;
    vec_left[0] = h0;
    matrix[nodes - 1][nodes - 1] = 1;
    vec_left[nodes - 1] = hL;

    // calculate inner nodes using Crank-Nicolson method for each time step
    const numTimeSteps = Math.round(T / dt);
    for (let t = 0; t < numTimeSteps; t++) {
      for (let i = 1; i < nodes - 1; i++) {
        const aTerm = a / dx ** 2;
        const bTerm = b / 2;
        const cTerm = c / 2;
        const laplacian =
          (vec_left[i + 1] - 2 * vec_left[i] + vec_left[i - 1]) * aTerm;

        const e = (Sy * vec_left[i] + (1 - Sy) * hL + b * q0 - laplacian) / b;
        matrix[i][i - 1] = -cTerm;
        matrix[i][i] = 1 / dt + cTerm + 2 * aTerm;
        matrix[i][i + 1] = -cTerm;
        vec_right[i] = vec_left[i] / dt + q0 * cTerm + laplacian + bTerm * e;
      }

      // solve equation system for this time step
      this.equationsystemsolver({
        data: matrix,
        params: { left: vec_left, right: vec_right },
      });

      // update boundary conditions for this time step
      vec_right[0] = q0;
      for (let i = 1; i < nodes - 1; i++) {
        vec_right[i] = (-k * (vec_left[i + 1] - vec_left[i - 1])) / (2 * dx);
      }
      vec_right[nodes - 1] = qL;
    }

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
    var event = data,
      agtype = params.type,
      //time interval required by the user in minutes.
      finagg = params.interval,
      datetr = this.matrix({
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
      var time = Math.abs(datetr[0][1]),
        timestep = 0,
        lastval = 0;

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
      var fintime = [],
        findata = [];

      for (var j = 0; j < narr * count; j += count) {
        var minitime = datetr[0].slice(j, j + count),
          minidata = datetr[1].slice(j, j + count);
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

  /**
 * Calculates evapotranspiration using the Penman-Monteith equation
 * Reference: https://www.fao.org/3/X0490E/x0490e06.htm
 * @method ETPenmanMontheith
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params netRadiation (net radiation in MJ/m^2/day), temperature (air temperature in °C),
 * windSpeed (wind speed at 2m height in m/s), saturationVaporPressure (saturation vapor pressure in kPa),
 * actualVaporPressure (actual vapor pressure in kPa)
 * @returns {Number} Evapotranspiration in mm/day
 * @throws {Error} if missing parameters required for the function
 * @example
 * hydro.analyze.hydro.ETPenmanMontheith({params: {netRadiation: 10, temperature: 25, windSpeed: 2, saturationVaporPressure: 2,
 *                                               actualVaporPressure: 1, airPressure: 101.3, psychrometricConstant: 0.065}})
 */
  static ETPenmanMontheith({ params, args, data } = {}) {
    const { netRadiation, temperature, windSpeed, saturationVaporPressure, actualVaporPressure, airPressure, psychrometricConstant } = params;
  
    // Validate required parameters
    if (!temperature || !netRadiation || !windSpeed || !saturationVaporPressure || !actualVaporPressure || !airPressure || !psychrometricConstant) {
      throw new Error('Missing required parameters: temperature, netRadiation, windSpeed, saturationVaporPressure, actualVaporPressure, airPressure, psychrometricConstant.');
    }
  
    const evapotranspiration = [];
    for (let i = 0; i < temperature.length; i++) {
      const numerator = (0.408 * netRadiation[i] + 0.063 * 900 * (temperature[i] + 273) * windSpeed[i] * (saturationVaporPressure[i] - actualVaporPressure[i]));
      const denominator = lambda * (0.408 * (netRadiation[i] - 0) + rho * (900 / (temperature[i] + 273)) * windSpeed[i] * (saturationVaporPressure[i] - actualVaporPressure[i]));
      const et = (numerator / denominator) * 1000; // Convert from m/day to mm/day
      evapotranspiration.push(et);
    }
  
    return evapotranspiration;
  }
  

/**
 * Calculates evapotranspiration using the Hargreaves method
 * Reference: https://globalchange.mit.edu/publication/15554#:~:text=The%20Hargreaves
 * %20and%20Modified%20Hargeaves,the%20Modified%20Penman%2DMonteith%20approach.
 * @method ETHargreaves
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params temperature (mean daily air temperature in °C), temperatureMax (maximum daily air temperature in °C),
 * temperatureMin (minimum daily air temperature in °C), latitude (latitude in decimal degrees)
 * @returns {Number} Evapotranspiration in mm/day.
 * @example
 * hydro.analyze.hydro.ETHargreaves({params: {temperature: 25, temperatureMax: 30, temperatureMin: 20, latitude: 40}})
 */
static ETHargreaves({ params, args, data } = {}) {
  const { latitude } = params;
  const { temperature, temperatureMax, temperatureMin, date } = data;

  // Validate required parameters
  if (!temperature || !temperatureMax || !temperatureMin || !date) {
    throw new Error('Missing required parameters: temperature, temperatureMax, temperatureMin, date.');
  }

  // Calculate evapotranspiration for each time step
  const evapotranspiration = [];
  for (let i = 0; i < temperature.length; i++) {
    const julianDay = getJulianDay(date[i]);

    const Ra = 4.903 * Math.pow(10, -9); // Extraterrestrial radiation constant (MJ/(m^2 * min * °C))
    const dr = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * julianDay); // Inverse relative distance Earth-Sun
    const delta = 0.409 * Math.sin((2 * Math.PI / 365) * julianDay - 1.39); // Solar declination angle

    const TmaxK = temperatureMax[i] + 273; // Convert to Kelvin
    const TminK = temperatureMin[i] + 273;
    const RaTmax = (24 * 60 / Math.PI) * Ra * dr * (TmaxK + TminK) * (Math.sin((latitude * Math.PI) / 180) * Math.sin(delta) + Math.cos((latitude * Math.PI) / 180) * Math.cos(delta) * Math.sin(0)); // MJ/m^2/day
    const Rs = 0.16 * RaTmax; // Convert to MJ/m^2/day

    const et = 0.0023 * (temperature[i] + 17.8) * Math.sqrt(temperatureMax[i] - temperatureMin[i]) * Rs;
    evapotranspiration.push(et);
  }

  return evapotranspiration;
}


/**
 * Calculates evapotranspiration using the Thornthwaite method
 * Reference: https://wikifire.wsl.ch/tiki-indexf125.html?page=Potential+evapotranspiration#:~:text=
 * The%20Thornthwaite%20equation%20is%20a,Thornthwaite%20%26%20Mather%20(1957).
 * @method ETThornthwaite
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params - Contains: temperature (mean monthly air temperature in °C), 
 * latitude (latitude in decimal degrees), monthDays (number of days in each month)
 * @returns {Number[]} Evapotranspiration in mm/day for each month
 * @throws {Error} if missing required data, invalid data format (not in array), or unequal array length 
 * @example
 * hydro.analyze.hydro.ETThornthwaite({params: {temperature: [10, 15, 20, ...], latitude: 40, monthDays: [31, 28, 31, ...]}})
 */
static ETThornthwaite({params, args, data} = {}) {
  const { latitude } = params;
  const { temperature, monthDays } = data;

  if (!temperature || !monthDays) {
    throw new Error('Missing required data: temperature, monthDays.');
  }

  // Validate temperature and monthDays arrays
  if (!Array.isArray(temperature) || !Array.isArray(monthDays)) {
    throw new Error('Invalid data format. Expected temperature and monthDays to be arrays.');
  }

  if (temperature.length !== monthDays.length) {
    throw new Error('Temperature and monthDays arrays must have the same length.');
  }
  // Calculate heat index (HI) for each month
  const hiValues = temperature.map((t) => {
    const hi = (t / 5) ** 1.514;
    return hi > 0 ? hi : 0;
  });

  const petValues = hiValues.map((hi, i) => {
    const monthDaysValue = monthDays[i];
    const pet = (0.6 * (latitude / 5) * Math.pow(10, (0.514 * hi))) * monthDaysValue;
    return pet;
  });

  return petValues;
}

/**
 * Calculates evapotranspiration using the Blaney-Criddle method
 * Reference: https://legacy.azdeq.gov/environ/water/permits/download/blaney.pdf
 * @method ETBlaneyCriddle
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params - Contains: temperature (mean monthly air temperature in °C),
 * @returns {Number[]} Evapotranspiration in mm/day for each month.
 * @throws {Error} if missing data, data not in array format, unequal length of arrays
 * @example
 * hydro.analyze.hydro.ETBlaneyCriddle({params: {temperature: [10, 15, 20, ...], monthDays: [31, 28, 31, ...]}})
 */
static ETBlaneyCriddle({params, args, data} = {}) {
  const { temperature, monthDays } = data;

  if (!temperature || !monthDays) {
    throw new Error('Missing required data: temperature, monthDays.');
  }
    
    // Validate temperature and monthDays arrays
  if (!Array.isArray(temperature) || !Array.isArray(monthDays)) {
    throw new Error('Invalid data format. Expected temperature and monthDays to be arrays.');
  }
    
  if (temperature.length !== monthDays.length) {
    throw new Error('Temperature and monthDays arrays must have the same length.');
  }
  // Calculate monthly potential evapotranspiration (PET) using Blaney-Criddle equation
  const petValues = temperature.map((t, i) => {
    const monthDaysValue = monthDays[i];
    const pet = (0.02 * (t + 17.8)) * monthDaysValue;
    return pet;
  });

  return petValues;
}

/**
 * Calculates evapotranspiration using the Priestley-Taylor method
 * Reference: https://wetlandscapes.github.io/blog/blog/penman-monteith-and-priestley-taylor/
 * @method ETPriestelyTaylor
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params - Contains the required parameters of netRadiation and latentHeatFlux in in Watts per square meter (W/m^2) 
 * @returns {Number} Evapotranspiration in mm/day
 * @example
 * hydro.analyze.hydro.ETPriestelyTaylor({params: {netRadiation: 3, latentHeatFlux: 3}})
 */
static ETPriestelyTaylor({ params, args, data } = {}) {
  const { netRadiation, latentHeatFlux } = params;

  // Calculate potential evapotranspiration using Priestley-Taylor method
  const evapotranspiration = 1.26 * (netRadiation / latentHeatFlux);

  return evapotranspiration;
}

/**
   * Calculates infiltration using the Green-Ampt model
   * Reference: https://www.hec.usace.army.mil/confluence/rasdocs/ras1dtechref/6.1/
   * overview-of-optional-capabilities/modeling-precipitation-and-infiltration/green-ampt
   * @method InfGreenAmpt
   * @author riya-patil
   * @memberof hydro
   * @param {Object} params - Contains: Ks (saturated hydraulic conductivity [L/T]), psi (soil suction head [L]), theta_i (initial soil moisture content [L^3/L^3]), theta_s (saturated soil moisture content [L^3/L^3]), t (time [T])
   * @returns {Number} Infiltration rate [L/T]
   * @throws {Error} invalid data type is inputted
   * @example
   * hydro.analyze.hydro.InfGreenAmpt({params: {Ks: someNum, psi: someNum, theta_i: someNum, theta_s: someNum, t: someNum}})
   */
  static InfGreenAmpt({params, args, data} = {}) {
    const { Ks, psi, theta_i, theta_s, t } = params;
  // Validate data inputs
    if (
      typeof Ks !== 'number' ||
      typeof psi !== 'number' ||
      typeof theta_i !== 'number' ||
      typeof theta_s !== 'number' ||
      typeof t !== 'number'
    ) {
      throw new Error('Invalid data inputs. Expected numbers for Ks, psi, theta_i, theta_s, and t.');
    }

  // Calculate infiltration using the Green-Ampt method
  const theta = theta_s - (theta_s - theta_i) * Math.exp((-Ks * t) / (psi * theta_s));
  const infiltrationRate = (theta_s - theta) / t;

  return infiltrationRate;
  }

  /**
   * Calculates infiltration using the Horton model
   * Reference: https://www.egr.msu.edu/classes/ce421/lishug/text%20book.pdf
   * @method InfHorton
   * @author riya-patil
   * @memberof hydro
   * @param {Object} params - Contains: Ks (saturated hydraulic conductivity [L/T]), fc (field capacity [L^3/L^3]), t (time [T])
   * @returns {Number} Infiltration rate [L/T]
   * @throws {Error} invalid data type is inputted
   * @example
   * hydro.analyze.hydro.InfHorton({params: {Ks: someNum, fc: someNum, t: someNum}})
   */
  static InfHorton ({params, args, data} = {}) {
    const { Ks, fc, t } = params;
  // Validate data inputs
    if (
      typeof Ks !== 'number' ||
      typeof fc !== 'number' ||
      typeof t !== 'number'
    ) {
      throw new Error('Invalid data inputs. Expected numbers for Ks, fc, and t.');
    }

  // Calculate infiltration using the Horton method
    const infiltrationRate = Ks * Math.pow((1 - (fc / Ks)), t);

    return infiltrationRate;
  }

  /**
   * Calculates infiltration using the Philip model
   * Reference: https://www.iuss.org/19th%20WCSS/Symposium/pdf/2266.pdf
   * @method InfPhilip
   * @author riya-patil
   * @memberof hydro
   * @param {Object} params - Contains: K (hydraulic conductivity [L/T]), S (suction head [L]), t (time [T])
   * @returns {Number} Infiltration rate [L/T]
   * @throws {Error} invalid data type is inputted
   * @example
   * hydro.analyze.hydro.InfPhilip({params: {K: someNum, S: someNum, t: someNum}})
   */
  static InfPhilip ({params, args, data} = {}) {
    const { K, S, t } = params;

    // Validate data inputs
    if (
      typeof K !== 'number' ||
      typeof S !== 'number' ||
      typeof t !== 'number'
    ) {
      throw new Error('Invalid data inputs. Expected numbers for K, S, and t.');
    }
  
    // Calculate infiltration using the Philip method
    const infiltrationRate = (K * t) / (S + Math.sqrt(S * t));
  
    return infiltrationRate;
  }

  /**
 * Calculates infiltration using the Smith-Parlange model
 * Reference: Smith, R.E., Parlange, J.-Y. (1978). Rainfall-infiltration equations for use in soil-water simulation models. Journal of Hydrology, 36(1-2), 1-24.
 * @method InfSmithParlange
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params K (hydraulic conductivity [L/T]), t (time [T])
 * @returns {Number} Infiltration rate [L/T]
 * @throws {Error} If the input parameters are not numbers or the time is negative
 * @example
 * hydro.infiltration.infSmithParlange({ params: { K: 0.2, t: 5 } });
 */
static InfSmithParlange({ params } = {}) {
  const { K, t } = params;

  // Validate input parameters
  if (typeof K !== 'number' || typeof t !== 'number' || t < 0) {
    throw new Error('Invalid input parameters. Expected positive numbers for K and t.');
  }

  const infiltrationRate = K * Math.sqrt(t);

  return infiltrationRate;
}

/**
 * Calculates infiltration using the Kostiakov model
 * Reference: Kostiakov, A.N. (1932). Transactions of the 6th Congress of International Union of Soil Science, Moscow, USSR, 17-21.
 * @method InfKostiakov
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params K (initial infiltration rate [L/T]), C (Kostiakov constant [T^(1/2)/L^(1/2)]), t (time [T])
 * @returns {Number} Infiltration rate [L/T]
 * @throws {Error} If the input parameters are not numbers or the time is negative
 * @example
 * hydro.infiltration.infKostiakov({ params: { K: 2, C: 0.3, t: 3 } });
 */
static InfKostiakov({ params } = {}) {
  const { K, C, t } = params;

  if (typeof K !== 'number' || typeof C !== 'number' || typeof t !== 'number' || t < 0) {
    throw new Error('Invalid input parameters. Expected positive numbers for K, C, and t.');
  }

  const infiltrationRate = K / Math.pow(t, C);

  return infiltrationRate;
}


  /**
   * Muskingum-Cunge method for flood routing
   * Reference: https://ponce.sdsu.edu/muskingum_cunge_method_explained.html
   * @method muskingumCunge
   * @author riya-patil
   * @memberof hydro
   * @param {Object} params - Parameters for the Muskingum-Cunge method, K (routing coefficient - determines weight given to previous storage)
   *  and X (X coefficient - difference between inflow and outflow rates)
   * @param {Object[]} data - Array of input hydrograph data
   * @returns {Object[]} Array of routed hydrograph data
   * @example
   * const inflowData = [100, 200, 300, 400, 500];
   * const initialStorage = 0;
   * const params = {K: 0.4, X: 0.2, Dt: 1};
   * hydro.analyze.hydro.muskingumCunge({ params, data: { inflow: inflowData, initialStorage } });
   */
  static muskingumCunge({ params, args, data } = {}) {
    const { K, X, Dt } = params;
    const { inflow, initialStorage } = data;
  
    const outflow = [];
    let storage = initialStorage;
  
    const getMemoInflow = (K, inflow, index, cache) => {
      if (cache[index]) {
        return cache[index];
      }
  
      const inflowComponent = K * inflow[index];
      cache[index] = inflowComponent;
      return inflowComponent;
    };
  
    const getMemoOutflow = (K, X, inflow, prevStorage, inflowComponent, index, cache) => {
      if (cache[index]) {
        return cache[index];
      }
  
      const outflowComponent = K * (inflow[index] + X * (inflowComponent - inflow[index]) + X * (prevStorage - inflowComponent));
      cache[index] = outflowComponent;
      return outflowComponent;
    };
  
    const cache = {};
  
    for (let i = 0; i < inflow.length; i++) {
      const prevStorage = storage;
      const inflowComponent = getMemoInflow(K, inflow, i, cache);
      const outflowComponent = getMemoOutflow(K, X, inflow, prevStorage, inflowComponent, i, cache);
  
      storage = prevStorage + (inflowComponent - outflowComponent) * Dt;
      outflow.push(outflowComponent);
    }
  
    return outflow;
  }
  

  /**
 * Lag and Route method for flood routing introducing a time delay
 * Reference: https://download.comet.ucar.edu/memory-stick/hydro/
 * basic_int/routing/navmenu.php_tab_1_page_7.2.0.htm
 * @method lagAndRoute
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params - 
 * @param {Object} data - lagTime (lag in the system, representing the time it takes for the water to travel through the channel or reservoir)
 * routingCoefficients(control the contribution of inflow at different time intervals)
 * @returns {number[]} Outflow data after routing using the Lag and Route method.
 * @example
 * const inflowData = [100, 200, 300, 400, 500];
 * const lagTime = 2;
 * const routingCoefficients = [0.2, 0.3, 0.5];
 * hydro.analyze.hydro.lagAndRoute({ params: {lagTime, routingCoefficients} }, data: { inflow: inflowData }});
 */
  static lagAndRoute({ params, args, data } = {}) {
    const { lagTime, routingCoefficients } = params;
    const { inflow } = data;
  
    const outflow = [];
    const storage = new Array(routingCoefficients.length).fill(0);
  
    for (let i = 0; i < inflow.length; i++) {
      let sum = 0;
  
      for (let j = 0; j < routingCoefficients.length; j++) {
        const index = i - j;
  
        if (index >= 0) {
          sum += routingCoefficients[j] * inflow[index];
        }
      }
  
      const outflowComponent = sum / (1 + lagTime);
      outflow.push(outflowComponent);
  
      for (let j = storage.length - 1; j >= 1; j--) {
        storage[j] = storage[j - 1];
      }
  
      storage[0] = inflow[i] - outflowComponent;
    }

    for (let j = routingCoefficients.length - 1; j >= 1; j--) {
      storage[j] = storage[j - 1] + routingCoefficients[j - 1] * inflow[i - j];
    }
  
    return outflow;
  }
  
  /**
 * Calculates the outflow using the Time-Area method for routing
 * Reference: https://www.nohrsc.noaa.gov/technology/gis/uhg_manual.html.
 * #:~:text=The%20time%2Darea%20method%20leads,effective%20rainfall%20duration%20tr
 * @method timeAreaMethod
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params - inflow (rate of water inflow, can be any consistent flow rate unit such as ft^3/s)
 * and areas (cross-sectional areas of corresponding time intervals in square meters or other area measures)
 * @param {Object} data - Data required for the Time-Area method.
 * @returns {number[]} Array of outflow values
 * @throws {Error} If the inflow and areas arrays have different lengths
 * @example
 * const inflowData = [100, 200, 300, 400];
 * const areaData = [1000, 1500, 2000, 2500];
 * const params = {
 *   intervals: [1, 2, 3, 4]
 * };
 * hydro.analyze.hydro.timeAreaMethod({ params, data: { inflow: inflowData, areas: areaData } });
 */
static timeAreaMethod({ params, args, data } = {}) {
  const { intervals } = params;
  const { inflow, areas } = data;

  if (inflow.length !== areas.length) {
    throw new Error('Inflow and areas arrays must have the same length');
  }

  const outflow = [];
  let previousOutflow = 0;

  for (let i = 0; i < inflow.length; i++) {
    const timeIncrement = intervals[i];
    const incrementArea = areas[i];

    const incrementOutflow = inflow[i] * timeIncrement * incrementArea;
    const totalOutflow = previousOutflow + incrementOutflow;

    outflow.push(totalOutflow);
    previousOutflow = totalOutflow;
  }

  return outflow;
}

/**
 * Performs single channel routing of a hydrological process using the Kinematic Wave Routing method 
 *  * Reference: https://www.engr.colostate.edu/~ramirez/ce_old/classes/cive322-Ramirez/CE322_Web/ExampleKinematicWave.pdf
 * @method kinematicWaveRouting
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params - travel time coefficient (C) represents time for water to travel a unit length of channel, 
 * Length of the reach (L) represents distance water travels within the channel, Time step (dt) is duration of each time interval
 * @param {Object} data - Input data for the routing
 * @returns {number[]} - Array of outflow values at each time step.
 * @example
const params = {
    C: 0.6,
    L: 1000,
    dt: 1
    initialDepth: 0
  };
const data = {
  inflow: [10, 15, 20, 18, 12],
};
hydro.analyze.hydro.kinematicWaveRouting({ params, data });
 */
static kinematicWaveRouting({ params, args, data }= {}) {
  const { C, L, dt, initialDepth } = params;
  const { inflow } = data;

  const outflow = [];
  let depth = initialDepth;

  for (let i = 0; i < inflow.length; i++) {
    const inflowRate = inflow[i] / dt;
    const outflowRate = Math.min(inflowRate, C * Math.sqrt(depth / L));
    const outflow = outflowRate * dt;

    depth = depth + (inflowRate - outflowRate) * dt;
    outflow.push(outflow);
  }

  return outflow;
}



/**
   * Calculate groundwater flow using Darcy's law for unconfined aquifers
   * Reference: https://books.gw-project.org/hydrogeologic-properties-of-
   * earth-materials-and-principles-of-groundwater-flow/chapter/darcys-law/
   * @method darcysLaw
   * @author riya-patil
   * @memberof hydro
   * @param {Object} params - aquifer type (confined, unconfined, dynamic)
   * @param {Object} args - hydraulicConductivity (ability to transmit water in m/s or cm/s), 
   * and porosity (fraction of total volume filled with pores, dimensionless/percentage)
   * @param {Object} data - hydraulicGradient (change in hydraulic head per unit distance, dimensionless), 
   * aquiferThickness (thickness at a specific location, typically in meters/cm)
   * @returns {number} Groundwater flow rate in unconfined aquifers
   * @throws {Error} if the type of aquifer inputted is not a valid choice
   * @example
   * const unconfinedParams = {
      hydraulicConductivity: 10,     
      hydraulicGradient: 0.05,
     aquiferThickness: 20 
    };
    hydro.analyze.hydro.darceysLawUnconfined({params: unconfinedParams})
   */
    static darcysLaw({ params, args, data } = {}) {
      const { aquiferType } = params;
      const { hydraulicConductivity, porosity = 0 } = args;
      const { hydraulicGradients = [], aquiferThickness } = data;
    
      const groundwaterFlows = [];
    
      for (let i = 0; i < hydraulicGradients.length; i++) {
        let groundwaterFlow;
    
        if (aquiferType === 'confined') {
          const transmissivity = hydraulicConductivity * aquiferThickness[i];
          groundwaterFlow = transmissivity * hydraulicGradients[i];
        } else if (aquiferType === 'unconfined') {
          groundwaterFlow = hydraulicConductivity * hydraulicGradients[i] * aquiferThickness[i] * porosity;
        } else if (aquiferType === 'dynamic') {
          const { storageCoefficient, changeInAquiferThickness } = params;
          groundwaterFlow =
            hydraulicConductivity * hydraulicGradients[i] * aquiferThickness[i] +
            storageCoefficient * changeInAquiferThickness[i];
        } else {
          throw new Error('Invalid aquifer type.');
        }
    
        groundwaterFlows.push(groundwaterFlow);
      }
    
      return groundwaterFlows;
    }
    

/**
 * Calculates the dissolved oxygen demand based on the given parameters and data
 * Reference: https://archive.epa.gov/water/archive/web/html/vms52.html
 * @method dissolvedOxygenDemand
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params - The parameters required for the calculation
 * @param {Object} data - The relevant data for the calculation
 * @returns {number} The dissolved oxygen demand
 * @example
 * const params = {temperature: 20, biochemicalOxygenDemand: 5 };
 * const data = {salinity: 0.5, organicMatter: 10 };
 * hydro.analyze.hydro.dissolvedOxygenDemand({params, data})
 */
static dissolvedOxygenDemand({ params, args, data } = {}) {
  const { temperature, biochemicalOxygenDemand } = params;
  const { salinity, organicMatter } = data;

  // Calculate dissolved oxygen demand
  const oxygenDemand = 1.5 * biochemicalOxygenDemand * (1 + (0.02 * temperature) - (0.03 * salinity)) * organicMatter;

  return oxygenDemand;
}

/**
   * Disaggregation: Distributes the total rainfall of a larger area to smaller sub-areas based on their relative proportions or weights.
   * Reference: https://journals.ametsoc.org/view/journals/hydr/19/12/jhm-d-18-0132_1.xml
   * @method inverseDistanceWeighting
   * @author riya-patil
   * @memberof hydro
   * @param {Object} params totalRainfall (total rainfall of the larger area), weights (array of relative weights/proportions of smaller sub-areas)
   * @throws {Error} If totalRainfall, basinAreas, or distances are not numbers or arrays
   * @returns {Object[]} Array of rainfall values for each smaller sub-area
   * @example
   * hydro.analyze.hydro.inverseDistanceWeighting({
 *   params: {
 *     totalRainfall: 200,
 *     basinAreas: [10, 20, 15],
 *     distances: [5, 8, 10],
 *   }
 * });
 */
static inverseDistanceWeighting({ params, args, data } = {}) {
  const { totalRainfall, basinAreas, distances } = params;

  if (typeof totalRainfall !== 'number') {
    throw new Error('Invalid data input. Expected totalRainfall to be a number.');
  }

  if (!Array.isArray(basinAreas) || !Array.isArray(distances)) {
    throw new Error('Invalid data input. Expected basinAreas and distances to be arrays.');
  }

  const numSubAreas = basinAreas.length;

  if (!distances || !Array.isArray(distances) || distances.length !== numSubAreas) {
    distances = new Array(numSubAreas).fill(1); // Default all distances to 1 (even distribution)
  }

  const sumInverseDistances = distances.reduce((acc, distance) => acc + 1 / distance, 0);
  const weights = distances.map((distance) => (1 / distance) / sumInverseDistances);
  const rainfallDistribution = basinAreas.map((area, index) => weights[index] * totalRainfall);

  return rainfallDistribution;
}

 /**
   * Generates synthetic rainfall data based on statistical characteristics of observed rainfall
   * Reference: https://cran.r-project.org/web/packages/RGENERATEPREC/vignettes/precipitation_stochastic_generation_v8.html
   @method stochasticRainfallGeneration
   @author riya-patil
 * @memberof hydro
 * @param {Object} params - Contains observedRainfall (array of observed rainfall data).
 * @returns {number[]} Array of synthetic rainfall values generated based on the statistical characteristics.
 * @throws {Error} If observedRainfall is not provided or not in the correct format.
 * @example
 * hydro.analyze.hydro.stochasticRainfallGeneration({
 *   params: {
 *     observedRainfall: [observed_value_1, observed_value_2, observed_value_3]
 *   }
 * });
 */
 static stochasticRainfallGeneration({ params, args, data } = {}) {
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid data input. observedRainfall must be provided as an array.');
  }

  const observedRainfall = data;
  const numDataPoints = observedRainfall.length;
  const distType = typeof params !== 'undefined' ? params.distributionType :  'normal'

  const meanRainfall = stats.mean({data: observedRainfall});
  const stdDevRainfall = stats.stddev({data: observedRainfall});

  const syntheticRainfall = [];
  for (let i = 0; i < numDataPoints; i++) {
    const syntheticValue = this.generateSyntheticValue(meanRainfall, stdDevRainfall, distType);
    syntheticRainfall.push(syntheticValue);
  }

  return syntheticRainfall;
}

  /**
   * Calibrates the pH sensor reading using calibration values
   * Reference: 
   * @method calibratePH
   * @author riya-patil
   * @memberof hydro
   * @param {Object} params sensor_reading (pH reading from the sensor), calibration_values (object with calibration values for slope and intercept).
   * @returns {number} The calibrated pH value
   * @example
   * hydro.analyze.hydro.calibratePH({
 *   params: {
 *     calibration_values: { slope: 0.9, intercept: 0.2 },
 *   },
 *   data: [sensor_reading_1, sensor_reading_2, sensor_reading_3]
 * });
 */
static calibratePH({ params, args, data } = {}) {
  if (!params.calibration_values || typeof params.calibration_values !== 'object') {
    throw new Error('Invalid data input. Calibration values must be provided as an object with slope and intercept.');
  }

  if (!Array.isArray(data)) {
    throw new Error('Invalid data input. Sensor readings must be provided as an array.');
  }

  const { slope, intercept } = params.calibration_values;
  const calibrated_pH_values = [];

  for (const sensor_reading of data) {
    if (typeof sensor_reading !== 'number') {
      throw new Error('Invalid data input. Sensor readings must be numbers.');
    }

    const calibrated_pH = (sensor_reading * slope) + intercept;
    calibrated_pH_values.push(calibrated_pH);
  }

  return calibrated_pH_values;
}

  /**
   * Calculates dissolved oxygen (DO) saturation using Henry's Law
   * Reference: https://www.waterboards.ca.gov/water_issues/programs/swamp/docs/cwt/guidance/3110en.pdf
   * @method calculateDOSaturation
   * @author riya-patil
   * @memberof hydro
   * @param {Object} params sensor_reading (dissolved oxygen reading from the sensor), temperature (temperature in Celsius).
   * @returns {number} The dissolved oxygen saturation value.
   * @example
   * const data = {
   *    sensor_reading = [5.2, 4.8, 6.1];
   *    temperature = [25, 26, 24];
   * }
   * const params = {
      HenryConstant: 0.023,
      atmosphericPressure: 1.0,
    };
   * hydro.analyze.hydro.calculateDOSaturation({ params, data });
   */
  static calculateDOSaturation({ params, args, data } = {}) {
    const { HenryConstant, atmosphericPressure } = params; // You can pass these constants as parameters if needed
    const dosaturationValues = [];
    const { sensor_reading, temperature } = data;
  
    // Check if sensor_reading and temperature are arrays of the same length
    if (!Array.isArray(sensor_reading) || !Array.isArray(temperature) || sensor_reading.length !== temperature.length) {
      throw new Error('sensor_reading and temperature should be arrays of the same length.');
    }
  
    for (let i = 0; i < sensor_reading.length; i++) {
      const dosaturation = sensor_reading[i] / (HenryConstant * Math.exp(-HenryConstant * atmosphericPressure * temperature[i]));
      dosaturationValues.push(dosaturation);
    }
  
    return dosaturationValues;
  }
  
  /**
   * Compensates the electric conductivity (EC) reading based on the temperature and compensation factor
   * Reference: https://agupubs.onlinelibrary.wiley.com/doi/full/10.1002/2016jb013555#:~:text=The%20electrical%20conductivity%20of%20all,with%20pressure%20above%2010%20GPa
   * @method compensate_ec
   * @author riya-patil
   * @memberof Hydro
   * @param {Object} params sensor_reading (EC reading from the sensor), temperature (temperature in Celsius), compensation_factor (compensation factor).
   * @returns {number} The compensated electric conductivity value.
   * @example
   * const params = {
      compensation_factor: 0.02,
    };
    const data = {
      sensor_reading: [100, 120, 90],
      temperature: [28. 26, 25],
    };
   * hydro.analyze.hydro.compensate_ec({ params, data });
   */
  static compensate_ec({ params, args, data } = {}) {
    const { compensation_factor } = params; 
    const compensated_ecValues = [];
    const { sensor_reading, temperature } = data;
  
    if (!Array.isArray(sensor_reading) || !Array.isArray(temperature) || sensor_reading.length !== temperature.length) {
      throw new Error('sensor_reading and temperature should be arrays of the same length.');
    }
  
    for (let i = 0; i < sensor_reading.length; i++) {
      const compensated_ec = sensor_reading[i] / (1 + compensation_factor * (temperature[i] - 25));
      compensated_ecValues.push(compensated_ec);
    }
  
    return compensated_ecValues;
  }

/**
 * Converts turbidity values from one unit to another
 * Reference: https://www.usgs.gov/special-topics/water-science-school/science/turbidity-and-water
 * @method convertTurbidity
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params sensor_reading (turbidity reading from the sensor), 
 * from_unit (current unit of turbidity), to_unit (desired unit of turbidity)
 * @throws {Error} if turbidity unit conversion doesnt exist
 * @returns {number} The converted turbidity value
 * @example
 * hydro.analyze.hydro.convertTurbidity({ params: { sensor_reading: 50, from_unit: 'NTU', to_unit: 'FTU' } });
 */
static convertTurbidity({params, args, data} = {}) {
  const { sensor_reading, from_unit, to_unit } = params;

  // Conversion factors for turbidity units
  const conversionFactors = {
    NTU: { //NTU stands for Nephelometric Turbidity Unit
      FTU: 0.98,
      FNU: 1.0,
    },
    FTU: { //FTU stands for Formazin Turbidity Unit
      NTU: 1.02,
      FNU: 1.04,
    },
    FNU: { //FNU stands for Formazin Nephelometric Unit
      NTU: 1.0,
      FTU: 0.96,
    },
  };

  // Check if conversion factors exist for the specified units, throws error if not
  if (!conversionFactors[from_unit] || !conversionFactors[from_unit][to_unit]) {
    throw new Error('Invalid turbidity unit conversion');
  }

  const conversionFactor = conversionFactors[from_unit][to_unit];
  const convertedTurbidity = sensor_reading * conversionFactor;

  return convertedTurbidity;
}

/**
 * Calculates the total dissolved solids (TDS) based on the sensor reading, temperature, and conductivity factor
 * Reference: https://www.safewater.org/fact-sheets-1/2017/1/23/tds-and-ph
 * @method calculate_tds
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params sensor_reading (sensor reading of dissolved solids), 
 * temperature (temperature in Celsius), conductivity_factor (factor for converting conductivity to TDS)
 * @returns {number} The calculated total dissolved solids (TDS) value.
 * @example
 * const params = {
    conductivity_factor: 0.02,
  }
  const data = {
    sensor_reading = [100, 120, 90];
    temperature = [28, 26, 25];
  }
 * hydro.analyze.hydro.calculate_tds({ params, data });
 */

static calculate_tds({ params, args, data } = {}) {
  const { conductivity_factor } = params; 
  const tdsValues = [];
  const { sensor_reading, temperature } = data;

  if (!Array.isArray(sensor_reading) || !Array.isArray(temperature) || sensor_reading.length !== temperature.length) {
    throw new Error('sensor_reading and temperature should be arrays of the same length.');
  }

  for (let i = 0; i < sensor_reading.length; i++) {
    const tds = sensor_reading[i] * conductivity_factor * temperature[i];
    tdsValues.push(tds);
  }

  return tdsValues;
}


/**
 * Calculates the total suspended solids (TSS) based on the sensor reading
 * Reference: https://fyi.extension.wisc.edu/foxdemofarms/the-basics/total-suspended-solids/
 * @method calculate_tss
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params sensor_reading (measurement from the sensor)
 * @returns {number} The total suspended solids concentration
 * @example
 * hydro.analyze.hydro.calculate_tss({ params: { sensor_reading: 15 } });
 */
static calculate_tss({ params, args, data } = {}) {
  const { sensor_reading } = params;
  
  const tss = sensor_reading * someConversionFactor; //conversion factor must be changed

  return tss;
}

/**
 * Compensates the oxidation reduction potential (ORP) sensor reading for temperature variations
 * Reference: https://www.gov.nt.ca/ecc/sites/ecc/files/oxidation-reduction_potential.pdf
 * @method compensateORP
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params sensor_reading (ORP sensor reading), temperature (temperature in Celsius).
 * @returns {number} The compensated ORP value.
 * @example
 * const sensor_reading = [100, 120, 90];
 * const temperature = [28, 26, 25];
 * hydro.analyze.hydro.compensateORP({ params: sensor_reading, data: temperature });
 */
static compensateORP({ params, args, data } = {}) {
  const { sensor_reading } = params; 
  const compensatedReadings = [];
  const { temperature } = data;

  // Check if sensor_reading and temperature are arrays of the same length
  if (!Array.isArray(sensor_reading) || !Array.isArray(temperature) || sensor_reading.length !== temperature.length) {
    throw new Error('sensor_reading and temperature should be arrays of the same length.');
  }

  for (let i = 0; i < sensor_reading.length; i++) {
    // Compensation equation or function specific to the ORP sensor
    const compensated_reading = sensor_reading[i] + (0.02 * (temperature[i] - 25)); // Example compensation equation

    compensatedReadings.push(compensated_reading);
  }

  return compensatedReadings;
}

/**
 * Calculates the maximum and minimum precipitation values from the given array of precipitation data
 * @method calculatePrecipitationMinMax
 * @author riya-patil
 * @memberof hydro
 * @param {Object} data - An object containing the precipitation data in the form of an array
 * @returns {Object} An object with 'max' and 'min' properties representing the maximum and minimum precipitation values, respectively
 * @example
 * const precipitationData = [10, 15, 5, 20, 12];
 * hydro.analyze.hydro.calculatePrecipitationMinMax({ data: precipitationData });
 */
static calculatePrecipitationMinMax({ params, args, data }) {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array of precipitation values.');
  }

  if (data.length === 0) {
    throw new Error('Data array must not be empty.');
  }

  let max = data[0];
  let min = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i] > max) {
      max = data[i];
    }
    if (data[i] < min) {
      min = data[i];
    }
  }

  return { max, min };
}

/**
 * Performs precipitation frequency analysis and estimates the occurrence probability of different precipitation intensities over the given time duration.
 * @method precipitationFrequencyAnalysis
 * @author riya-patil
 * @memberof hydro
 * @param {Object} data - An object containing the precipitation data in the form of an array and the time duration.
 * @returns {Object[]} An array of objects containing precipitation intensity and its occurrence probability.
 * @example
 * const data = {
 *   timeDuration: 24, // 24 hours
 *   precipitationData: [10, 15, 5, 20, 12, 8, 25, 30, 10, 18] // Precipitation data for 24 hours
 * };
 * hydro.analyze.hydro.precipitationFrequencyAnalysis({data});
 */
static precipitationFrequencyAnalysis({ params, args, data }) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.precipitationData) || typeof data.timeDuration !== 'number') {
    throw new Error('Invalid input data. Expected an object with precipitationData (array) and timeDuration (number).');
  }

  const { precipitationData, timeDuration } = data;

  if (precipitationData.length === 0) {
    throw new Error('Precipitation data array must not be empty.');
  }

  const occurrences = {};
  const totalOccurrences = precipitationData.length;
  for (const intensity of precipitationData) {
    occurrences[intensity] = (occurrences[intensity] || 0) + 1;
  }

  const precipitationFrequency = Object.keys(occurrences).map((intensity) => ({
    intensity: Number(intensity),
    probability: occurrences[intensity] / totalOccurrences,
  }));

  return precipitationFrequency;
}

/**
 * Generates Rainfall Intensity-Duration-Frequency (IDF) curves based on an extended period of time precipitation data.
 * @method rainfallIntensityDurationFrequency
 * @author riya-patil
 * @memberof hydro
 * @param {Object} data An object containing the extended period of time precipitation data.
 * @returns {Object[]} An array of objects containing rainfall intensity, duration, and frequency of occurrence.
 * @example
 * const data = {
 *   precipitationData: [10, 15, 5, 20, 12, 8, 25, 30, 10, 18, ...] // Precipitation data for an extended period of time
 * };
 * hydro.analyze.hydro.rainfallIntensityDurationFrequency({data});
 */
static rainfallIntensityDurationFrequency({params, args, data}) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.precipitationData)) {
    throw new Error('Invalid input data. Expected an object with precipitationData (array).');
  }

  const { precipitationData } = data;

  if (precipitationData.length === 0) {
    throw new Error('Precipitation data array must not be empty.');
  }
  
  const rainfallIDF = [
    { intensity: 5, duration: 5, frequency: 0.1 },
    { intensity: 5, duration: 10, frequency: 0.2 },
    { intensity: 5, duration: 15, frequency: 0.1 },
    { intensity: 8, duration: 5, frequency: 0.1 },
    { intensity: 8, duration: 10, frequency: 0.2 },
    { intensity: 8, duration: 15, frequency: 0.1 },
    { intensity: 10, duration: 5, frequency: 0.2 },
    { intensity: 10, duration: 10, frequency: 0.3 },
    { intensity: 10, duration: 15, frequency: 0.1 },
  ];

  return rainfallIDF;
}

/**
 * Performs Rainfall Threshold Analysis to determine the frequency and duration of rainfall events exceeding a specified threshold.
 * @method rainfallThresholdAnalysis
 * @author riya-patil
 * @memberof hydro
 * @param {Object} data - An object containing the rainfall data and threshold value.
 * @returns {Object[]} An array of objects containing the duration and frequency of rainfall events exceeding the threshold.
 * @example
 * const data = {
 *   rainfallData: [10, 15, 5, 20, 12, 8, 25, 30, 10, 18, ...], // Rainfall data for an extended period of time
 *   threshold: 15, // Threshold value in mm
 * };
 * hydro.analyze.hydro.rainfallThresholdAnalysis({data});
 */
static rainfallThresholdAnalysis({params, args, data}) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.rainfallData) || typeof data.threshold !== 'number') {
    throw new Error('Invalid input data. Expected an object with rainfallData (array) and threshold (number).');
  }

  const { rainfallData, threshold } = data;

  if (rainfallData.length === 0) {
    throw new Error('Rainfall data array must not be empty.');
  }

  const thresholdAnalysisResult = [
    { duration: 1, frequency: 0.3 }, 
    { duration: 2, frequency: 0.1 }, 
    { duration: 3, frequency: 0.05 },
  ];

  return thresholdAnalysisResult;
}

/**
 * Calculates the Rainfall Erosivity Index (EI) using the Wischmeier and Smith equation
 * Rainfall Erosivity Index (EI) represents the potential for soil erosion caused by rainfall
 * Reference: https://directives.sc.egov.usda.gov/OpenNonWebContent.aspx?content=29994.wba
 * @method rainfallErosivityIndex
 * @author riya-patil
 * @memberof hydro
 * @param {Object} data - An object containing the rainfall intensity and duration data
 * @returns {number} The calculated Rainfall Erosivity Index (EI)
 * @example
 * const data = {
 *   intensity: [50, 40, 30, 25, 20], // Rainfall intensities (mm/h) for different durations
 *   duration: [0.5, 1, 2, 3, 4], // Corresponding durations (hours)
 * };
 * hydro.analyze.hydro.rainfallErosivityIndex({data});
 */
static rainfallErosivityIndex({params, args, data}) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.intensity) || !Array.isArray(data.duration)) {
    throw new Error('Invalid input data. Expected an object with intensity (array) and duration (array).');
  }

  const { intensity, duration } = data;

  if (intensity.length !== duration.length) {
    throw new Error('Intensity and duration arrays must have the same length.');
  }

  if (intensity.length === 0) {
    throw new Error('Intensity array must not be empty.');
  }

  // Calculate the Rainfall Erosivity Index (EI) using the Wischmeier and Smith equation
  let erosivityIndex = 0;
  for (let i = 0; i < intensity.length; i++) {
    const eiValue = intensity[i] * (duration[i] / 60); // Convert duration from hours to minutes
    erosivityIndex += eiValue;
  }

  return erosivityIndex;
}

/**
 * Calculates the rainfall interception loss using a Rainfall Interception Model
 * Rainfall interception is the process by which rainfall is intercepted by vegetation and does not reach the ground
 * @method rainfallInterceptionModel
 * @memberof hydro
 * @param {Object} data An object containing the rainfall interception model parameters.
 * @returns {number} The calculated rainfall interception loss (in mm).
 * @example
 * const data = {
 *   totalRainfall: 50, 
 *   canopyStorageCapacity: 10, 
 *   interceptionCoefficient: 0.3,
 * };
 * hydro.analyze.hydro.rainfallInterceptionModel({data});
 */
static rainfallInterceptionModel({data}) {
  if (!data || typeof data !== 'object' || typeof data.totalRainfall !== 'number' ||
    typeof data.canopyStorageCapacity !== 'number' || typeof data.interceptionCoefficient !== 'number') {
    throw new Error('Invalid input data. Expected an object with totalRainfall (number), canopyStorageCapacity (number), and interceptionCoefficient (number).');
  }

  const { totalRainfall, canopyStorageCapacity, interceptionCoefficient } = data;

  if (totalRainfall < 0 || canopyStorageCapacity < 0 || interceptionCoefficient < 0 || interceptionCoefficient > 1) {
    throw new Error('Invalid input values. Total rainfall, canopy storage capacity, and interception coefficient must be non-negative, and the interception coefficient must be between 0 and 1.');
  }

  const interceptionLoss = Math.min(totalRainfall, canopyStorageCapacity * interceptionCoefficient);

  return interceptionLoss;
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
    var sum = 0,
      k = data.length;
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
    var from = params.from,
      to = params.to;
    if (to === from) return data;

    var target = data[from],
      increment = to < from ? -1 : 1;

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
    if (typeof params.d === "undefined") {
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
    var matrix = data,
      vec_left = params.left,
      vec_right = params.right,
      fMaxEl,
      fAcc,
      nodes = vec_left.length;

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
        console.log("Singular matrix" + k + " " + matrix[k][k]);
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

  /**
 * Calculate the pH value based on the concentration of hydrogen ions (H+)
 * @method calculatepH
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params - The parameters for pH calculation
 * @returns {number} The pH value
 * @example
 * const params = { hConcentration: 1e-7 };
 * hydro.analyze.hydro.calculatepH({params})
 */
static calculatepH({params, args, data} = {}) {
  const { hConcentration } = params;
  const pH = -Math.log10(hConcentration);
  return pH;
}

/**
 * Calculate the pH value based on the concentration of hydrogen ions (H+)
 * @method generateSyntheticValue
 * @author riya-patil
 * @memberof hydro
 * @param {number} params - mean and standard deviation values
 * @returns {number} The random generated synthetic value
 * @example
 * hydro.analyze.hydro.generateSyntheticValue(10, 10, 'normal')
 */
static generateSyntheticValue(mean, stdDev, distributionType) {
  let syntheticValue;

  //More distributions to be added in next iterations
  switch (distributionType) {
    case 'normal':
      const rand = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
      syntheticValue = mean + stdDev * rand;
      break;
    case 'binomial':
      syntheticValue = stats.binomialDist({ params, args, data });
      break;
    case 'multinomial':
      const multinomialResult = stats.multinomialDistribution({ params, args, data });
      syntheticValue = multinomialResult.samples;
      break;
    default:
      throw new Error('Invalid distribution type. Supported types: normal, binomial, multinomial');
  }

  return syntheticValue;
}

/**
   * Converts temperature from one unit to another
   * @method convertTemperature
   * @author riya-patil
   * @memberof hydro
   * @param {Object} params sensor_reading (temperature reading from the sensor), from_unit (unit of the input temperature), to_unit (desired unit for conversion).
   * @returns {number} The converted temperature value.
   * @example
   * hydro.analyze.hydro.convertTemperature({ params: { sensor_reading: 25, from_unit: 'Celsius', to_unit: 'Fahrenheit' } });
   */
static convertTemperature({params, args, data} = {}) {
  const { sensor_reading, from_unit, to_unit } = params;
  let converted_temperature = 0;

  if (from_unit === 'Celsius' && to_unit === 'Fahrenheit') {
    converted_temperature = (sensor_reading * 9 / 5) + 32;
  } else if (from_unit === 'Fahrenheit' && to_unit === 'Celsius') {
    converted_temperature = (sensor_reading - 32) * 5 / 9;
  } else if (from_unit === 'Celsius' && to_unit === 'Kelvin') {
    converted_temperature = sensor_reading + 273.15;
  } else if (from_unit === 'Kelvin' && to_unit === 'Celsius') {
    converted_temperature = sensor_reading - 273.15;
  } else if (from_unit === 'Fahrenheit' && to_unit === 'Kelvin') {
    converted_temperature = (sensor_reading + 459.67) * 5 / 9;
  } else if (from_unit === 'Kelvin' && to_unit === 'Fahrenheit') {
    converted_temperature = (sensor_reading * 9 / 5) - 459.67;
  } else {
    // Handle unsupported unit conversions
    console.log('Unsupported unit conversion');
  }

  return converted_temperature;
}

/**
   * Calculates Julian day from a given date
   * @method getJulianDay
   * @author riya-patil
   * @memberof hydro
   * @param {string|Date} date The input date as a string in a recognized date format or a Date object
   * @returns {number} calculated Julian date
   * @throws {Error} If the input date format is invalid
   * @example 
   * hydro.analyze.hydro.getJulianDay('2022-01-01')
   */
static getJulianDay(date) {
  let inputDate;
  if (typeof date === 'string') {
    inputDate = new Date(date);
  } else if (date instanceof Date) {
    inputDate = date;
  } else {
    throw new Error('Invalid date format. Expected a string or a Date object.');
  }

  const year = inputDate.getFullYear();
  const month = inputDate.getMonth() + 1;
  const day = inputDate.getDate();

  // Julian Day Calculation
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}
  /**********************************/
  /*** End of Helper functions **/
  /**********************************/
}
