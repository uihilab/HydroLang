import * as divisors from "../../modules/visualize/divisors.js";
/**
 * Imports external library Google Charts.
 * @external GoogleCharts
 */

/**
 * Appends the google charts library to header for usage on charts and tables.
 * CDN currently stable but needs to be verified and updated if required.
 * @method googlecdn
 * @memberof GoogleCharts
 * @param {void} - no parameters required.
 * @returns {Element} - Google object loaded to header
 * @example
 * hydro.visualize.googleCdn()
 */

function googleCdn({ params, args, data } = {}) {
  var g = divisors.createScript({
    params: {
      src: "https://www.gstatic.com/charts/loader.js",
      name: "googleloader",
    },
  });
  //Charts loaded from the Google Charts API
  var chartMap = {
    bar: "google.visualization.BarChart",
    pie: "google.visualization.PieChart",
    line: "google.visualization.LineChart",
    scatter: "google.visualization.ScatterChart",
    histogram: "google.visualization.Histogram",
    timeline: "google.visualization.AnnotatedTimeLine",
    column: "google.visualization.ColumnChart",
    combo: "google.visualization.ComboChart",
  };
  //Table element loaded from the Google Charts API
  var tableData = {
    data: "google.visualization.DataTable",
    view: "google.visualization.DataView",
    table: "google.visualization.Table",
  };
  //Returning the elements as accessible array with [0] - google element, [1] - chart loader [2] - table loader
  return [g, chartMap, tableData];
}

export { googleCdn};
