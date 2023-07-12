/**
 * Main class used for hydrological analyses.
 * @class
 * @name hydro
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
 * Calculates evapotranspiration using the Penman-Monteith equation.
 * @method penmanMonteith
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params netRadiation (net radiation in MJ/m^2/day), temperature (air temperature in °C),
 * windSpeed (wind speed at 2m height in m/s), saturationVaporPressure (saturation vapor pressure in kPa),
 * actualVaporPressure (actual vapor pressure in kPa)
 * @returns {Number} Evapotranspiration in mm/day
 * @example
 * hydro.analyze.hydro.penmanMonteith({params: {netRadiation: 10, temperature: 25, windSpeed: 2, saturationVaporPressure: 2,
 *                                               actualVaporPressure: 1, airPressure: 101.3, psychrometricConstant: 0.065}})
 */
static penmanMonteith({ params, args, data }) {
  const { netRadiation, temperature, windSpeed, saturationVaporPressure, actualVaporPressure, airPressure, psychrometricConstant } = params;

  const lambda = 2.45; // heat of vaporization (MJ/kg)
  const rho = 0.065; // Psychrometric constant (kPa/°C)

  const numerator = (0.408 * netRadiation + 0.063 * 900 * (temperature + 273) * windSpeed * (saturationVaporPressure - actualVaporPressure));
  const denominator = lambda * (0.408 * (netRadiation - 0) + rho * (900 / (temperature + 273)) * windSpeed * (saturationVaporPressure - actualVaporPressure));
  const evapotranspiration = (numerator / denominator) * 1000; // Convert from m/day to mm/day

  return evapotranspiration;
}

/**
 * Calculates evapotranspiration using the Hargreaves method.
 * @method hargreaves
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params - Contains: temperature (mean daily air temperature in °C), temperatureMax (maximum daily air temperature in °C),
 * temperatureMin (minimum daily air temperature in °C), latitude (latitude in decimal degrees)
 * @returns {Number} Evapotranspiration in mm/day.
 * @example
 * hydro.analyze.hydro.hargreaves({params: {temperature: 25, temperatureMax: 30, temperatureMin: 20, latitude: 40}})
 */
static hargreaves({ params, args, data }) {
  const { temperature, temperatureMax, temperatureMin, latitude } = params;

  const Ra = 4.903 * Math.pow(10, -9); // Extraterrestrial radiation constant (MJ/(m^2 * min * °C))
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * julianDay); // Inverse relative distance Earth-Sun
  const delta = 0.409 * Math.sin((2 * Math.PI / 365) * julianDay - 1.39); // Solar declination angle

  const TmaxK = temperatureMax + 273; // Convert to Kelvin
  const TminK = temperatureMin + 273;
  const RaTmax = (24 * 60 / Math.PI) * Ra * dr * (TmaxK + TminK) * (Math.sin((latitude * Math.PI) / 180) * Math.sin(delta) + Math.cos((latitude * Math.PI) / 180) * Math.cos(delta) * Math.sin(0)); // MJ/m^2/day
  const Rs = 0.16 * RaTmax; // Convert to MJ/m^2/day

  const evapotranspiration = 0.0023 * (temperature + 17.8) * Math.sqrt(temperatureMax - temperatureMin) * Rs;

  return evapotranspiration;
}

/**
 * Calculates evapotranspiration using the Thornthwaite method
 * @method thornthwaite
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params - Contains: temperature (mean monthly air temperature in °C), 
 * latitude (latitude in decimal degrees), monthDays (number of days in each month)
 * @returns {Number[]} Evapotranspiration in mm/day for each month
 * @example
 * hydro.analyze.hydro.thornthwaite({params: {temperature: [10, 15, 20, ...], latitude: 40, monthDays: [31, 28, 31, ...]}})
 */
static thornthwaite({ params, args, data }) {
  const { temperature, latitude, monthDays } = params;

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
 * Calculates evapotranspiration using the Blaney-Criddle method.
 * @method blaneyCriddle
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params - Contains: temperature (mean monthly air temperature in °C),
 * @returns {Number[]} Evapotranspiration in mm/day for each month.
 * @example
 * hydro.analyze.hydro.blaneyCriddle({params: {temperature: [10, 15, 20, ...], monthDays: [31, 28, 31, ...]}})
 */
static blaneyCriddle({ params, args, data }) {
  const { temperature, monthDays } = params;

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
 * @method priestleyTaylor
 * @author riya-patil
 * @memberof hydro
 * @param {Object} params - Contains the required parameters
 * @returns {Number} Evapotranspiration in mm/day
 * @example
 * hydro.analyze.hydro.evapotranspirationPriestleyTaylor({params: {netRadiation: someNum, latentHeatFlux: someNum}})
 */
static evapotranspirationPriestleyTaylor({ params, args, data } = {}) {
  const { netRadiation, latentHeatFlux } = params;

  // Calculate potential evapotranspiration using Priestley-Taylor method
  const evapotranspiration = 1.26 * (netRadiation / latentHeatFlux);

  return evapotranspiration;
}

/**
   * Calculates infiltration using the Green-Ampt model
   * @method greenAmpt
   * @author riya-patil
   * @memberof hydro
   * @param {Object} params - Contains: Ks (saturated hydraulic conductivity [L/T]), psi (soil suction head [L]), theta_i (initial soil moisture content [L^3/L^3]), theta_s (saturated soil moisture content [L^3/L^3]), t (time [T])
   * @returns {Number} Infiltration rate [L/T]
   * @example
   * hydro.analyze.hydro.greenAmpt({params: {Ks: someNum, psi: someNum, theta_i: someNum, theta_s: someNum, t: someNum}})
   */
  static greenAmpt({ params, args, data }) {
    var Ks = params.Ks,
      psi = params.psi,
      theta_i = params.theta_i,
      theta_s = params.theta_s,
      t = params.t;

    var theta = theta_s - (theta_s - theta_i) * Math.exp((-Ks * t) / (psi * theta_s));

    return (theta_s - theta) / t;
  }

  /**
   * Calculates infiltration using the Horton model.
   * @method horton
   * @author riya-patil
   * @memberof hydro
   * @param {Object} params - Contains: Ks (saturated hydraulic conductivity [L/T]), fc (field capacity [L^3/L^3]), t (time [T])
   * @returns {Number} Infiltration rate [L/T]
   * @example
   * hydro.analyze.infiltration.horton({params: {Ks: someNum, fc: someNum, t: someNum}})
   */
  static horton ({ params }) {
    var Ks = params.Ks,
      fc = params.fc,
      t = params.t;

    return Ks * Math.pow((1 - (fc / Ks)), t);
  }

  /**
   * Calculates infiltration using the Philip model.
   * @method philip
   * @author riya-patil
   * @memberof hydro
   * @param {Object} params - Contains: K (hydraulic conductivity [L/T]), S (suction head [L]), t (time [T])
   * @returns {Number} Infiltration rate [L/T]
   * @example
   * hydro.analyze.infiltration.philip({params: {K: someNum, S: someNum, t: someNum}})
   */
  static philip ({ params }) {
    var K = params.K,
      S = params.S,
      t = params.t;

    return (K * t) / (S + Math.sqrt(S * t));
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

  /**********************************/
  /*** End of Helper functions **/
  /**********************************/
}
