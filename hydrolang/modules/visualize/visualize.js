import stats from "../analyze/components/stats.js";
import * as divisors from "./divisors.js";
import { googleCdn } from "../../external/googlecharts/googlecharts.js";

window.loaded = false;
var g = googleCdn();

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
 * @param {Object} params - Contains: charType, id, drawing options (see google charts docs).
 * @param {Object} data - Contains: data as JS nd-array.
 * @returns {Element} Chart appended to new div in body.
 * @example
 * hydro.visualize.chart({params: {chartType: 'column', id: 'id', options: {'some options'}}, data: [data1, data2,...]});
 */

function chart({ params, args, data } = {}) {
  if (typeof data[0] === "number") {
    data = [Array.from(Array(data.length).keys()), data];
  }

  const id = params.id || "visualize";

  if (!divisors.isdivAdded({ params: { id } })) {
    divisors.createDiv({ params: { id: id, class: "visualize" } });
  }
  //Create a new div for the visualize options.
  //Google CDN stable library caller.
  // var g = googleCdn();

  const drawChart = () => {
    //Creating a container to append the chart to.
    var container,
      //Data read from the parameters passed by the user.
      chartType = params.chartType,
      options = params.options || {},
      names = params.names || [],
      //To avoid having to load the entire library, the optional JS evaluator is used
      //to read the requirements for drawing.
      ch = eval(g[1][chartType]),
      t1 = eval(g[2]["data"]),
      //Temporal variable holder
      columns = [],
      //rearrange data into nxm from mxn
      dataMatrix = stats.arrchange({ data });

    if (divisors.isdivAdded({ params: { id: params.id } })) {
      container = document.getElementById(params.id);
    }

    //Change the way of creating charts depending on the type of chart required.

    switch (chartType) {
      case "scatter":
      case "column":
      case "combo":
      case "histogram":
        for (let k = 0; k < dataMatrix[0].length; k++) {
          columns.push({ label: names[k] || `Value${k}`, type: "number" });
        }
        dataMatrix.unshift(columns);
        break;

      case "line":
      case "timeline":
        if (typeof dataMatrix[0][0] === "string") {
          columns.push({ label: "Date", type: "date" });
        } else {
          columns.push({ label: "Value", type: "number" });
        }
        dataMatrix.shift();
        for (let k = 1; k < dataMatrix[0].length; k++) {
          columns.push({
            label: names[k - 1] || `Value_item${k}`,
            type: "number",
          });
        }

        for (let i = 0; i < dataMatrix.length; i++) {
          dataMatrix[i][0] = new Date(dataMatrix[i][0]);
          if (dataMatrix[i][1] > 99998) {
            dataMatrix[i][1] = 0;
          }
        }
        dataMatrix.unshift(columns);
        break;

      default:
        break;
    }

    const dataTableObject = google.visualization.arrayToDataTable(dataMatrix);

    //Create figure in container.
    var chartObject = new ch(container);
    //Draw the chart.
    const drawFunction = () => {
      options
        ? chartObject.draw(dataTableObject, options)
        : chartObject.draw(dataTableObject);
    };

    drawFunction();

    var resizer;

    window.addEventListener("resize", () => {
      clearTimeout(resizer);
      resizer = setTimeout(() => {
        drawFunction();
        //Listener to add button for the chart to be downloaded once is ready.
        // google.visualization.events.addListener(fig, "ready", () => {

        //   if (divisors.isdivAdded({ params: { id: `${params.id}_png`} }) === false) {
        //     divisors.createDiv({ params: { id: `${params.id}_png`, maindiv: params.id } });
        //   } else {
        //     var parent = document.getElementById(`${params.id}_png`);
        //     parent.innerHTML = '';

        //     parent.innerHTML = `<a download="${
        //     params.id
        //   }" href="${fig.getImageURI()}"><button>${
        //     params.id
        //   }</button></a>`;
        // }
        // });
      }, 100);
    });
    //});
    return console.log(`Chart ${params.id} is drawn based on given parameters`);
  };
  drawChart();
}

/**
 * Generates a new table for the data given by the user.
 * @function table
 * @memberof visualize
 * @param {Object} params - contanis:  id, dataType and applicable options.
 * @param {Object} data - Contains: data
 * @returns {Element} Table appended to new div in body.
 * @example
 * hydro.visualize.table({params: {id: "new", dataType: ["string", "number"]}, data: [data1, data2...]});
 */
function table({ params, args, data } = {}) {
  //Verify if the visualize div has already been added into screen.
  if (!divisors.isdivAdded({ params: { id: "visualize" } })) {
    divisors.createDiv({ params: { id: "visualize" } });
  }
  const drawTable = () => {
    divisors.createDiv({
      params: {
        id: params.id,
        title: `Table of ${params.id}`,
        class: "tables",
        maindiv: "visualize",
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
      columns = [],
      tr = stats.arrchange({ data: data });

    if (divisors.isdivAdded({ params: { id: params.id } })) {
      container = document.getElementById(params.id);
    }

    for (var k = 0; k < types.length; k++) {
      dat.addColumn(types[k]);
    }

    var tr = stats.arrchange({ data: data });
    for (var l = 1; l < tr.length; l++) {
      columns.push(tr[l]);
    }

    dat.addRows(columns);

    var view = new t2(dat),
      table = new t3(container);

    //Draw table.
    if (params.hasOwnProperty("options")) {
      var options = params.options;
      table.draw(view, options);
    } else {
      table.draw(view);
    }
    ``;
    return console.log(`Table ${params.id} drawn on the given parameters.`);
  };
  drawTable();
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

function draw({ params = {}, args = {}, data = [] } = {}) {
  if (!window.loaded) {
    (() => {
      google.charts.load("current", {
        packages: ["corechart", "table", "line"],
      });
    })();
  }
  window.loaded = true;

  let {
    type,
    id = `chart-${Math.floor(Math.random() * 100)}-gen`,
    name,
  } = params;
  name === undefined ? (name = id) : name;

  var dat = data,
    pm;
  if (type !== "json") {
    //change the input in case its just a 1d array
    if (typeof dat[0] === "number") {
      let m = Array.from({ length: dat.length }, (_, i) => i);
      dat = [m, dat];
    } else {
      dat = dat;
    }
    dat[1] = dat[1].map(Number);
  }

  //defaults in case the user wants to generate a chart
  let { charttype = "line", names } = args;

  //Chart drawing options.
  if (type === "chart") {
    var pm = {
      chartType: charttype,
      id: name,
      options: {
        title: name,
        fontName: "monospace",
      },
      names: names,
    };

    switch (charttype) {
      case "column":
        Object.assign(pm.options, {
          titlePosition: "center",
          width: "100%",
          height: "100%",
          legend: {
            position: "top",
          },
          bar: {
            groupWidth: "95%",
          },
          explorer: {
            actions: ["dragToZoom", "rightClickToReset"],
          },
        });
        break;

      case "line":
        Object.assign(pm.options, {
          curveType: "function",
          lineWidth: 2,
          explorer: {
            actions: ["dragToZoom", "rightClickToReset"],
          },
          legend: {
            position: "bottom",
          },
          style: {
            height: "100%",
            width: "100%",
          },
        });
        break;

      case "scatter":
        Object.assign(pm.options, {
          legend: {
            position: "bottom",
          },
          crosshair: {
            trigger: "both",
            orientation: "both",
          },
        });
        break;

      case "timeline":
        Object.assign(pm, {
          fontName: "monospace",
          options: {
            dateFormat: "HH:mm MMMM dd, yyyy",
            thickness: 1,
          },
        });
        break;

      default:
        break;
    }

    setTimeout(() => chart({ params: pm, data: dat }), 200);
    return;
  }

  //Table options
  else if (type === "table") {
    var datatype = [];
    dat[1][0] = "Value";
    datatype.push("string");
    datatype.push("number");
    //Customizable chart for two columns. Will be expanded to n columns.
    pm = {
      id: id,
      datatype: datatype,
      options: {
        title: id,
        width: "100%",
        height: "80%",
      },
    };
    setTimeout(() => table({ params: pm, data: dat }), 200);
    return;
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
  if (!divisors.isdivAdded({ params: { id: "jsonrender" } })) {
    divisors.createDiv({
      params: {
        id: "jsonrender",
        class: "jsonrender",
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
    if (divisors.isdivAdded({ params: { id: "jsonrender" } })) {
      var name;
      if (data) {
        // Render the JSON object passed to the function
        name = document.createTextNode(params.title || "");
        document.getElementById("jsonrender").appendChild(name);
        document.getElementById("jsonrender").appendChild(renderjson(data));
      } else {
        // Render the objects saved in local storage
        if (window.localStorage.length === 0) {
          return alert("No items stored!");
        }
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
    }
  });
}

export { draw };
