import stats from "../analyze/components/stats.js";
import * as divisors from "./divisors.js";
import { googleCdn } from "../../external/googlecharts/googlecharts.js";

/**
 * Module for visualization of charts and tables.
 * @class visualize
 */

/**
 * Creates new charts depending on what the user requires. It can
 * generate scatter, histograms, columns, lines, timelines, etc.
 * It creates a new div space for each chart generated.
 * @function chart
 * @memberof visualize
 * @param {Object} params - Contains: charType, divID, drawing options (see google charts docs).
 * @param {Object} data - Contains: data as JS nd-array.
 * @returns {Element} Chart appended to new div in body.
 * @example
 * hydro.visualize.chart({params: {chartType: 'column', divID: 'divID', options: {'some options'}}, data: [data1, data2,...]});
 */

function chart({ params, args, data } = {}) {
  console.log(params, data);
  if (!divisors.isdivAdded({ params: { divID: "visualize" } })) {
    divisors.createDiv({ params: { id: "visualize", class: "visualize" } });
  }
  //Create a new div for the visualize options.
  //Google CDN stable library caller.
  var g = googleCdn();
  g[0].addEventListener("load", () => {
    google.charts
      .load("visualization", '1.1', {
        packages: ["corechart"],
      })
      .then(() => {
        divisors.createDiv({
          params: {
            id: params.divID,
            title: `Graph of ${params.divID}`,
            class: "charts",
            // maindiv: document.getElementById("visualize")[0],
            // .getElementsByClassName("visualize")[0],
          },
        });
        //Creating a container to append the chart to.
        var container,
          //Data read from the parameters passed by the user.
          char = params.chartType,
          //To avoid having to load the entire library, the optional JS evaluator is used
          //to read the requirements for drawing.
          ch = eval(g[1][char]),
          t1 = eval(g[2]["data"]),
          //Declaring a t1 option
          dat = new t1(),
          //Temporal variable holder
          temp = [],
          //rearrange data into nxm from mxn
          d = stats.arrchange({ data: data });

        if (divisors.isdivAdded({ params: { divID: params.divID } })) {
          container = document.getElementById(params.divID);
        }

        //Change the way of creating charts depending on the type of chart required.
        switch (char) {
          case "scatter":
            for (var k = 0; k < d[0].length; k++) {
              temp.push(`Value${k}`);
            }
            d.unshift(temp);
            dat = google.visualization.arrayToDataTable(d);
            break;

          case "column" || "combo":
            for (var k = 0; k < d[0].length; k++) {
              temp.push(`Value${k}`);
            }
            d.unshift(temp);

            dat = google.visualization.arrayToDataTable(d);
            break;

          case "histogram":
            for (var k = 0; k < d[0].length; k++) {
              temp.push(`Value${k}`);
            }
            d.unshift(temp);

            dat = google.visualization.arrayToDataTable(d);
            break;

          case "line" || "timeline":
            typeof d[0][0] === "string" ? temp.push({label: 'Date', type: 'date'}) : temp.push({label: 'Value', type: 'number'});
            d.shift();
            for (var k = 1; k < d[0].length; k++) {
              temp.push({label: `Value_item${k}`, type: 'number'});
            }

            for (var i =0; i < d.length; i++){
              d[i][0] = new Date(d[i][0]);
              d[i][1] > 99998 ? d[i][1] = 0 : d[i][1]
            }
            d.unshift(temp);
            dat = google.visualization.arrayToDataTable(d);

            break;

          default:
            break;
        }

        //Create figure in container.
        var fig = new ch(container);
        //Draw the chart.
        if (params.hasOwnProperty("options")) {
          var options = params.options;
          fig.draw(dat, options);
        } else {
          fig.draw(dat);
        }

        //Listener to add button for the chart to be downloaded once is ready.
        google.visualization.events.addListener(fig, "ready", function () {
          divisors.createDiv({
            params: {
              id: `${params.divID}_png`,
              maindiv: container,
            },
          });

          document.getElementById(
            `${params.divID}_png`
          ).outerHTML = `<a download="${
            params.divID
          }" href="${fig.getImageURI()}"><button>Download figure ${
            params.divID
          }</button></a>`;
        });
        //});
        return console.log(
          `Chart ${params.divID} is drawn based on given parameters`
        );
      });
  });
}

/**
 * Generates a new table for the data given by the user.
 * @function table
 * @memberof visualize
 * @param {Object} params - contanis:  divID, dataType and applicable options.
 * @param {Object} data - Contains: data
 * @returns {Element} Table appended to new div in body.
 * @example
 * hydro.visualize.table({params: {divID: "new", dataType: ["string", "number"]}, data: [data1, data2...]});
 */
function table({ params, args, data } = {}) {
  console.log(params, data)
  //Verify if the visualize div has already been added into screen.
  if (!divisors.isdivAdded({ params: { divID: "visualize" } })) {
    divisors.createDiv({ params: { id: "visualize" } });
  }
  //Call the google charts CDN
  var g = googleCdn();
  g[0].addEventListener("load", () => {
    google.charts.load("visualization", '1.1' ,{ packages: ["table"] }).then(() => {
      divisors.createDiv({
        params: {
          id: params.divID,
          title: `Table of ${params.divID}`,
          class: "tables",
          // maindiv: document.getElementById("visualize")[0],
          // .getElementsByClassName("visualize")[0],
        },
      });

      //Create container for table.
      var container,
        //Call the data types required for table generation.
        t1 = eval(g[2]["data"]),
        t2 = eval(g[2]["view"]),
        t3 = eval(g[2]["table"]),
        //Assign data into new variables for manipulation.
        types = params.datatype,
        dat = new t1(),
        temp = [],
        tr = stats.arrchange({ data: data });

      if (divisors.isdivAdded({ params: { divID: params.divID } })) {
        container = document.getElementById(params.divID);
      }

      for (var k = 0; k < types.length; k++) {
        dat.addColumn(types[k]);
      }

      var tr = stats.arrchange({ data: data });
      for (var l = 1; l < tr.length; l++) {
        temp.push(tr[l]);
      }

      dat.addRows(temp);

      var view = new t2(dat),
        table = new t3(container);

      //Draw table.
      if (params.hasOwnProperty("options")) {
        var options = params.options;
        table.draw(view, options);
      } else {
        table.draw(view);
      }
      return console.log(
        `Table ${params.divID} drawn on the given parameters.`
      );
    });
  });
}

/**
 * Preset styles for both charts and tables. The user can access by
 * passing parameters of data, type(chart or table).
 * @function draw
 * @memberof visualize
 * @param {Object} params - Contains: type (chart, table, or json), name.
 * @param {Object} args - Contains: charttype (column, scatter, line, timeline) only use if drawing charts.
 * @param {Object} data - Contains: data as JS nd-array.
 * @returns {Element} Chart (graph, table, or json render) appended in body of HTML document.
 * @example
 * hydro.visualize.draw({params: {type: 'chart', name: 'someName'}, args: {charttype: 'column'}}, data: [data1, data2,...]});
 */

function draw({ params, args, data } = {}) {
  var dat = data,
    pm,
    type = params.type;
    params.name === undefined ? params.name = params.divID : params.name
  if (type !== "json") {
    dat[1] = dat[1].map(Number);
  }

  //Chart drawing options.
  if (type === "chart") {
    var charts = args.charttype;
    switch (charts) {
      case "column":
        pm = {
          chartType: charts,
          divID: params.name,
          options: {
            title: params.name,
            titlePosition: "center",
            width: "100%",
            height: "100%",
            fontName: "monospace",
            legend: {
              position: "top",
            },
            bar: {
              groupWidth: "95%",
            },
            explorer: {
              actions: ["dragToZoom", "rightClickToReset"],
            },
          },
        };
        break;

      case "line":
        pm = {
          chartType: charts,
          divID: params.name,
          options: {
            title: params.name,
            fontName: "monospace",
            curveType: "function",
            lineWidth: 2,
            explorer: {
              actions: ["dragToZoom", "rightClickToReset"],
            },
            legend: {
              position: "bottom",
            },
            style: {
              height: 500,
              width: 900,
            },
          },
        };
        break;

      case "scatter":
        pm = {
          chartType: charts,
          divID: params.name,
          options: {
            title: params.name,
            fontName: "monospace",
            legend: {
              position: "bottom",
            },
            crosshair: {
              tigger: "both",
              orientation: "both",
            },
            trendlines: {
              0: {
                type: "polynomial",
                degree: 3,
                visibleInLegend: true,
              },
            },
          },
        };
        break;

      case "timeline":
        pm = {
          chartType: charts,
          divID: params.name,
          fontName: "monospace",
          options: {
            dateFormat: "HH:mm MMMM dd, yyyy",
            thickness: 1,
          },
        };
        break;

      default:
        break;
    }
    return chart({ params: pm, data: dat });
  }
  //Table options
  else if (type === "table") {
    var datatype = [];
    dat[1][0] = "Value";
    datatype.push("string");
    datatype.push("number");
    //Customizable chart for two columns. Will be expanded to n columns.
    pm = {
      divID: params.divID,
      datatype: datatype,
      options: {
        title: params.divID,
        width: "120%",
        height: "80%",
      },
    };
    return table({ params: pm, data: dat });
  }
  //JSON options.
  else if (type === "json") {
    return prettyPrint({ params: params, data: data });
  }
}

/**
 * Returns a space in screen to visualize JSON formart objects saved in the local storage.
 * Will be expanded to visualize other types of data.
 * @function prettyPrint
 * @memberof visualize
 * @param {Object} params - Contains: input (single or all objects), type (currently only JSON)
 * @param {Object} data - Contains: data as JS Objects.
 * @returns {Element} Renders to screen the json object to render.
 * @example
 * hydro.visualize.prettyPrint({params: {input: 'all', type: 'JSON'} data: {Objects}})
 */

function prettyPrint({ params, args, data } = {}) {
  //Add div for rendering JSON
  if (!divisors.isdivAdded({ params: { divID: "jsonrender" } })) {
    divisors.createDiv({
      params: {
        id: "jsonrender",
        class: "jsonrender",
        maindiv: document
          .getElementById("hydrolang")
          .getElementsByClassName("visualize")[0],
      },
    });
  }

  //Using external library to render json on screen. Could be any type of json file.
  //Documentation + library found at: https://github.com/caldwell/renderjson
  var src = "https://cdn.rawgit.com/caldwell/renderjson/master/renderjson.js";

  var sc = divisors.createScript({ params: { src: src, name: "jsonrender" } });
  sc.addEventListener("load", () => {
    //Change
    renderjson.set_icons("+", "-");
    renderjson.set_show_to_level(1);
    if (divisors.isdivAdded({ params: { divID: "jsonrender" } })) {
      var name;
      if (window.localStorage.length === 0) {
        return alert("No items stored!");
      }
      if (params.input === "all") {
        for (var i = 0; i < Object.keys(window.localStorage).length; i++) {
          name = document.createTextNode(Object.keys(window.localStorage)[i]);
          document.getElementById("jsonrender").appendChild(name);
          document
            .getElementById("jsonrender")
            .appendChild(
              renderjson(
                JSON.parse(
                  window.localStorage[Object.keys(window.localStorage)[i]]
                )
              )
            );
        }
      }
      if (!(params.input === "all")) {
        name = document.createTextNode(params.input);
        document.getElementById("jsonrender").appendChild(name);
        document.getElementById("jsonrender").appendChild(renderjson(data));
      }
    }
  });
}
export { draw };
