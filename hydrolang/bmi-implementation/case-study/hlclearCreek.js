import HydroLangBMI from "./../hydroLangBMI.js";
import { Hydro } from "./../globalHydro.js";

const h = Hydro.ins();

/**
 * Data module implementation for the Clear Creek HLM case study model
 * Overrides some of the methods implemented in the BMI HydroLang implementation.
 * Extends the HydroLang functional space by inheritance.
 * The instance calls either a data request from EPA precipitation model API's or
 * calls data from an preestablished model for the HLM-C implementation.
 * Provides data from EPA using grided models on an hourly scale.
 * Connects with the USGS gauging station for comparision purposes.
 * @class
 * @name HLclearCreek
 * @extends HydroLangBMI
 * @param {String} configfile
 */

class HLclearCreek extends HydroLangBMI {
  constructor(configfile = undefined) {
    super(configfile);
    this.links = [];
    this.stgGauge = [];
  }

  /**
   * Run if EPA data is to be queried.
   * @method additionalData
   * @memberof HLclearCreek
   */
  additionalData() {
    if (this._params.source === "epa") {
      this._startTime = new Date(this._args["dateTimeSpan"]["startDate"]);
      this._startTime = this._startTime.getTime() / 1000;
      this._endTime = new Date(this._args["dateTimeSpan"]["endDate"]);
      this._endTime = this._endTime.getTime() / 1000;
      (() => {
        fetch("./data/grid_coord.json")
          .then((res) => res.json())
          .then((data) => {
            this.grid = data;
          });
      })();
      (() => {
        fetch("./data/links_grid.json")
          .then((res) => res.json())
          .then((data) => {
            this.gridLinks = data;
            this.links = Object.keys(data);
          });
      })();
    }
  }

  /**
   * Update the model until a required time,
   * Depending on the module and function required.
   * @method update
   * @param {void}
   * @memberof HLclearCreek
   */
  update() {
    this.update_until();
  }

  /**
   * Updates a model and function call depending on the requirements
   * of the function and module called.
   * @method update_until
   * @memberof HLclearCreek
   * @param {Number} time - default time to be updated depending on the model
   * @returns {void} updates the current variable to the required timestep.
   */
  update_until(time = this._now + this._defaultStep) {
    time = Math.min(this._defaultStep, this._endTime);
    //setting current time to
    this._now === 0
      ? (this._now = this._startTime)
      : (this._now = this._now + time);
  }

  /**
   * Returns the current state of the model. For HLclearCreek is the default time step.
   * @method get_time_step
   * @memberof HLclearCreek
   * @returns {Number} default time step
   */

  get_time_step() {
    return this._defaultStep;
  }

  /**
   * Obtains the rainfall values at a specific index in the results array, when an index array is passed.
   * @method get_value_at_indices
   * @param {String} var_name - name of the variable used for the calculations
   * @param {Object[]} dest - array destiny required for the results
   * @param {Object[]} indices - array with the values of the links
   * @returns {Object[]} rainfall values perr order of link given.
   * @memberof HLclearCreek
   */

  get_value_at_indices(var_name, dest, indices) {
    var current = this.get_current_time(),
      timeIndex = super.value_index(current, this.results["dates"]);
    console.log(timeIndex);
    indices.forEach((link) => {
      this._params.source === "epa"
        ? dest.push(this.results[this.gridLinks[link]][timeIndex])
        : dest.push(this.results[link][timeIndex]);
    });

    return dest;
  }

  /**********************************/
  /*** Helper functions **/
  /**********************************/

  /**
   * Method for downloading data from the provided calls for the EPA API.
   * Calls the
   * @method retrieveData
   * @memberof HLclearCreek
   * @param {Object[]} arrayCont - array with all the lat-lon coordinates for each link.
   */
  retrieveEpaData(arrayCont) {
    //Downloads the data from EPA
    if (this._params.source === "epa") {
      //Removes first item from uploaded array
      // arrayCont.forEach((arr) => {
      //   arr.shift();
      // });
      // this.upload = arrayCont
      // var fnSt = step;
      const start = performance.now(),
        linkCalls = (st) => {
          var stgFunc = [];
          for (let k = 0; k < st[0].length; k++) {
            this._params.link = st[0][k];
            this.links.push(st[0][k]);
            const fs = () =>
              new Promise((resolve) =>
                resolve(
                  (this._args.geometry.point.latitude = st[1][k]),
                  (this._args.geometry.point.longitude = st[2][k])
                )
              );
            stgFunc.push(fs);
          }
          return stgFunc;
        };

      //Creating collection of unique
      // this.grid = this.hlIns()["analyze"]["stats"]["unique"]({data: arrayCont[1]});
      // this.links = this.hlIns()["analyze"]["stats"]["unique"]({data: arrayCont[0]});

      //Create stage index that contains first instances of each grid id's to get lat-lon
      // var stgInd = [];
      // var indLatLon = [[],[]]
      // for(var i = 0; i < this.grid.length; i++){
      //   stgInd.push(arrayCont[1].indexOf(this.grid[i]))
      // };
      // for (var j =0 ; j < stgInd.length; j++){
      //   indLatLon[0].push(arrayCont[3][stgInd[j]]);
      //   indLatLon[1].push(arrayCont[2][stgInd[j]])
      // }

      const gridCalls = (st) => {
        var stgFunc = [];
        for (let k = 0; k < st[0].length; k++) {
          const fs = () =>
            new Promise((resolve) =>
              resolve(
                (this._args.geometry.point.latitude = st[0][k]),
                (this._args.geometry.point.longitude = st[1][k])
              )
            );
          stgFunc.push(fs);
        }
        return stgFunc;
      };

      //Separate each call into bactches of equal step
      //To avoid overclocking the API.
      // for (; fnSt <= arrayCont[0].length; fnSt += step) {
      //   stgArr.push(arrayCont.map((arr) => arr.slice(iniSt, fnSt)));
      //   iniSt += step;
      // }

      //Loop through each of the requests in each batch, awaiting
      //a specific timespan defined by the user, compliant with what
      //the API require.
      // for (let i = 0; i < stgArr.length; i++) {
      //   var j = i * 240000;
      //   setTimeout(() => {
      //     var res = linkCalls(stgArr[i]);
      //     for (let f = 0; f < res.length; f++) {
      //       var intStart = performance.now();
      //       var k = f * 20000;
      //       setTimeout(() => {
      //         res[f]().then(() => {
      //           super.handleConfig();
      //           console.log(
      //             `Request time for bulk ${i} location ${
      //               this._args.geometry.point.latitude
      //             }, ${this._args.geometry.point.longitude} is: ${
      //               (performance.now() - intStart) / 1000
      //             } s, bulk time: ${(performance.now() - start) / 1000} s`
      //           );
      //         });
      //       }, k);
      //     }
      //   }, j);
      // }

      var res = gridCalls(this.grid.slice(1, 3));
      for (let f = 0; f < res.length; f++) {
        var intStart = performance.now(),
          k = f * 10000;
        setTimeout(() => {
          res[f]().then(() => {
            super.handleConfig();
            console.log(
              `Total bulk size: ${f} items, location ${
                this._args.geometry.point.latitude
              }, ${this._args.geometry.point.longitude}, time sent: ${
                (performance.now() - intStart) / 1000
              } s, bulk time: ${(performance.now() - start) / 1000} s`
            );
          });
        }, k);
      }
    } else {
      return console.log("Method implemented only for EPA data sources.");
    }
  }

  /**
   * Downloads data from the USGS site
   * @method retrieveGauge
   * @memberof HLclearCreek
   *
   */

  async retrieveGauge(startDate, endDate) {
    //Downloads the data for the gauging station.

    var gaugeData = {
      params: {
        source: "usgs",
        datatype: "instant-values",
        proxyurl:
          this._params.proxyServer === undefined
            ? "https://cors-anywhere.herokuapp.com/"
            : this._params.proxyServer,
      },
      args: {
        site: "USGS:05454300",
        format: "json",
        startDt:
          this._params.source === "epa"
            ? this._args.dateTimeSpan.startDate.slice(0, -9)
            : this._args.startDate.slice(0, -6),
        endDt:
          this._params.source === "epa"
            ? this._args.dateTimeSpan.endDate.slice(0, -9)
            : this._args.endDate.slice(0, -6),
      },
    };

    this.stgGauge.push(
      await h[this._moduleName][this._functionName]({
        args: gaugeData.args,
        params: gaugeData.params,
        data: this._inputVars,
      })
    );
  }

  /**
   * Grabs the downloaded object to create the links object and parse the dates
   * for each link so they can be in unixtime.
   * Overrides the values of the time used depending on the type of unit used
   * @method spreadResults
   * @memberof HLclearCreek
   * @returns {Void} sets the results to be access later by HLM
   */

  spreadResults() {
    //For the clear creek and EPA data
    var stgDate = [],
      stgRes = {};
    //Manipulating the results coming from the Clear Creek API
    if (this._params.source === "clearcreek") {
      (() => (this.results = this.results[0][0]))();
      //Just using the first element to get the dates in unix epoch
      this.links.slice(0, 1).forEach((link) => {
        this.results[link]["dates"].forEach((date) => {
          var parsedDate = new Date(date),
            stgUnix = parsedDate.getTime() / 1000;
          this._timeUnit == "hr" ? stgUnix / 3600 : stgUnix;
          stgDate.push(stgUnix);
        });
        this.results["dates"] = stgDate;
      });
      this.links.forEach((link) => {
        stgRes[link] = this.results[link]["values"];
      });
      stgRes["dates"] = [...stgDate];
      this.results = stgRes;

      //Gets missing index of
      const indLoc = (arr, step) => {
        //Adding the 0s and corresponding times to the indexes
        var indexes = [[], []];
        for (i = 0; i + 1 < arr.length; i++) {
          var div = (arr[i + 1] - arr[i]) / step;
          if (div !== 1) {
            indexes[0].push(arr.indexOf(arr[i]));
            indexes[1].push(div - 1);
          }
        }
        return indexes;
      };

      var indexes = indLoc(stgDate, 3600),
        stgDateVals = [],
        stgArrays = [];
      for (var k = 0; k < indexes[0].length; k++) {
        var l = indexes[1][k],
          h = stgDate[indexes[0][k]],
          sg = Array(l).fill(0);
        stgArrays.push(sg);
        sg = sg.map((val, c) => {
          return (val = h + 3600 * (c + 1));
        });
        stgDateVals.push(sg);
      }

      var stgStg = [...stgDate];
      for (var n = 0; n < stgDateVals.length; n++) {
        var accum = indexes[1].slice(0, n).reduce((a, b) => a + b, 0);
        stgStg.splice(
          n === 0
            ? indexes[0][n] + 1
            : // : indexes[0][n] + (stgStg.length - this.results['dates'].length),
              indexes[0][n] + accum + 1,
          0,
          ...stgDateVals[n]
        );
        this.links.forEach((link) => {
          this.results[link].splice(
            n === 0
              ? indexes[0][n] + 1
              : // : indexes[0][n] + (stgStg.length - this.results['dates'].length),
                indexes[0][n] + accum + 1,
            0,
            ...stgArrays[n]
          );
        });
      }

      this.results["dates"] = stgStg;

      //Memory cleanup
      stgStg = [];
      stgDateVals = [];
      stgArrays = [];
      stgRes = [];
      stgDate = [];
      //Manipulating the results coming from the EPA API's
    } else {
      stgDate = Object.keys(this.results[0][0].data).map((date) => {
        var stg = new Date(date);
        return stg.getTime() / 1000;
      });
      for (var i = 0; i < this.results.length; i++) {
        var stgVal = [];
        this.results[i] = this.results[i][0].data;

        stgVal = Object.values(this.results[i]).map((val) => {
          return JSON.parse(val);
        });

        stgRes[this.grid[0][i]] = stgVal;
      }
      stgRes["dates"] = stgDate;
      this.results = stgRes;
      stgRes = [];
      stgDate = [];

      //Reassigning the values of each of the grids to the corresponding links
      // var position = {}; this.upload[1].forEach((val, pos) => {position[val] = position[val] || []; position[val].push(pos)});
      // var links = {}; Object.keys(position).forEach(key => {var stgLinks = position[key].map(val => this.upload[0][val]); links[key] = stgLinks});
      // var finalLinks = {}; Object.keys(links).forEach(key => {links[key].forEach(val => {(val in finalLinks) ? null : finalLinks[val] = this.results[key]})});
      // finalLinks["dates"] = this.results.dates
      // this.results = finalLinks;

      // //Data cleanup
      // position = {}
      // this.upload = [];
      // links = {}
      // finalLinks = {}
    }
  }

  /**
   * Spreads the results downloaded from the USGS service to a global variable
   * called gauge
   * @method spreadGauge
   * @memberof HLclearCreek
   */
  spreadGauge() {
    //For the gauging statation data
    //Stremflow data
    var r = h[this._moduleName]["transform"]({
        params: { save: "value" },
        args: { type: "ARR", keep: '["datetime", "value"]' },
        data: this.stgGauge[0],
      }),
      //Gauge height
      r1 = h[this._moduleName]["transform"]({
        params: { save: "value" },
        args: { type: "ARR", keep: '["value"]' },
        data: this.stgGauge[0][0]["value"]["timeseries"][1],
      });

    //Having all the data into a single array
    r.push(r1[0]);
    //Converting the data types
    r.forEach((arr) => arr.shift());

    //Converting to unixtime
    r[0] = r[0].map((val) => {
      var stgDate = new Date(val);
      return stgDate.getTime() / 1000;
    });
    //Converting to numbers
    r[1] = r[1].map(Number);
    r[2] = r[2].map(Number);

    //Defining the gauging variable
    this.gauge = r;
    r = [];
  }

  /**
   * @method getLinks
   * @memberof HLclearCreek
   * Searches and seeks for the name of the links for the analysis.
   * @returns {Object[]} array with names of the links
   */

  getLinks() {
    this.links = Object.keys(this.results[0][0]);
  }

  /**
   * Checks for storm events given dates.
   * @memberof HLclearCreek
   * @todo finish implementation.
   * @returns {Number} identification of storm event
   */
  rainID() {
    var ev = this.results.dates,
      events = {};
    for (var i = 0; i < ev.length; i++) {
      var stgDates = [];
      if (this.dataStep(ev[i], ev[i + 1]) === super.get_time_step()) {
        stgDates.push(ev[i]);
      }
      Object.assign(events, {
        [`Start ${stgDates[0]}`]: [stgDates[0], stgDates[stgDates.length]],
      });
      stgDates = [];
    }
    return events;
  }

  /**
   * Steps through an event given step size.
   * @method dataStep
   * @memberof HLclearCreek
   * @param {Number} i - initial value
   * @param {Number} j - i + 1 value
   * @returns {Number} difference between the two
   */

  dataStep(i, j) {
    try {
      j - i !== super.get_time_step()
        ? (() => {
            return j - i;
          })()
        : null;
    } catch (undefined) {
      return {};
    }
  }

  /**********************************/
  /*** End of Helper functions **/
  /**********************************/
}

typeof window !== "undefined" ? (window.HLclearCreek = HLclearCreek) : null;
export default HLclearCreek;