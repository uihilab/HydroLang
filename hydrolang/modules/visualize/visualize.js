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
 * Creates interactive charts with Google Charts library for hydrological data visualization.
 * Supports multiple chart types including line, scatter, column, histogram, timeline, and more.
 * Handles large datasets with automatic pagination and provides extensive customization options.
 * 
 * @function chart
 * @memberof visualize
 * @param {Object} options - Configuration object for chart creation
 * @param {Object} options.params - Chart parameters and settings
 * @param {string} [options.params.chartType="line"] - Chart type: 'line', 'scatter', 'column', 'histogram', 'timeline', 'combo', 'area', 'pie', 'bar'
 * @param {string} [options.params.id="visualize"] - HTML element ID for chart container
 * @param {boolean} [options.params.partition=false] - Enable data pagination for large datasets
 * @param {number} [options.params.maxPoints=1000] - Maximum points per page when partition is enabled
 * @param {string[]|string} [options.params.names=[]] - Series names/labels (array or comma-separated string)
 * @param {Object} [options.params.options={}] - Google Charts options object
 * @param {Object} [options.args] - Additional arguments (currently unused)
 * @param {Array} options.data - Chart data in various supported formats
 * @returns {void} Creates and renders chart in specified container
 * 
 * @example
 * // Create a simple line chart for streamflow data
 * const timeData = [
 *   ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04'],
 *   [100.5, 95.2, 110.8, 88.3]
 * ];
 * 
 * hydro.visualize.chart({
 *   params: {
 *     chartType: 'line',
 *     id: 'streamflow-chart',
 *     names: ['Streamflow (cfs)']
 *   },
 *   data: timeData
 * });
 * 
 * @example
 * // Create multi-series line chart with custom styling
 * const multiSeriesData = [
 *   ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04'],
 *   [100.5, 95.2, 110.8, 88.3],  // Streamflow
 *   [2.1, 2.0, 2.3, 1.9],        // Stage height
 *   [0.2, 0.8, 0.0, 0.5]         // Precipitation
 * ];
 * 
 * hydro.visualize.chart({
 *   params: {
 *     chartType: 'line',
 *     id: 'multi-parameter-chart',
 *     names: ['Streamflow (cfs)', 'Stage Height (ft)', 'Precipitation (in)'],
 *     options: {
 *       title: 'Hydrological Parameters Over Time',
 *       width: 900,
 *       height: 500,
 *       vAxes: {
 *         0: { title: 'Flow & Stage' },
 *         1: { title: 'Precipitation' }
 *       },
 *       series: {
 *         0: { color: '#1f77b4', lineWidth: 3 },
 *         1: { color: '#ff7f0e', lineWidth: 2 },
 *         2: { color: '#2ca02c', targetAxisIndex: 1, type: 'columns' }
 *       }
 *     }
 *   },
 *   data: multiSeriesData
 * });
 * 
 * @example
 * // Create scatter plot for correlation analysis
 * const correlationData = [
 *   [1.2, 2.1, 3.5, 4.1, 5.8],  // Flow values
 *   [0.8, 1.5, 2.2, 2.9, 3.6]   // Stage values
 * ];
 * 
 * hydro.visualize.chart({
 *   params: {
 *     chartType: 'scatter',
 *     id: 'flow-stage-correlation',
 *     names: ['Flow vs Stage'],
 *     options: {
 *       title: 'Flow-Stage Relationship',
 *       hAxis: { title: 'Streamflow (cfs)' },
 *       vAxis: { title: 'Stage Height (ft)' },
 *       pointSize: 8,
 *       trendlines: { 0: { type: 'linear', showR2: true } }
 *     }
 *   },
 *   data: correlationData
 * });
 * 
 * @example
 * // Create column chart for monthly precipitation
 * const monthlyPrecip = [
 *   ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
 *   [2.1, 1.8, 3.2, 4.5, 5.1, 3.8]
 * ];
 * 
 * hydro.visualize.chart({
 *   params: {
 *     chartType: 'column',
 *     id: 'monthly-precip',
 *     names: ['Precipitation (inches)'],
 *     options: {
 *       title: 'Monthly Precipitation',
 *       colors: ['#2E7DD7'],
 *       bar: { groupWidth: '80%' }
 *     }
 *   },
 *   data: monthlyPrecip
 * });
 * 
 * @example
 * // Large dataset with pagination
 * const largeDataset = generateLargeTimeSeriesData(); // Assume 5000+ points
 * 
 * hydro.visualize.chart({
 *   params: {
 *     chartType: 'line',
 *     id: 'large-dataset-chart',
 *     partition: true,
 *     maxPoints: 500,
 *     names: ['Continuous Streamflow Data'],
 *     options: {
 *       title: 'Long-term Streamflow Record',
 *       explorer: { actions: ['dragToZoom', 'rightClickToReset'] }
 *     }
 *   },
 *   data: largeDataset
 * });
 * 
 * @example
 * // Nested time series data format
 * const nestedTimeSeriesData = [
 *   [['Time', '2023-01-01', '2023-01-02', '2023-01-03'], ['Flow', 100, 95, 110]],
 *   [['Time', '2023-01-01', '2023-01-02', '2023-01-03'], ['Stage', 2.1, 2.0, 2.3]]
 * ];
 * 
 * hydro.visualize.chart({
 *   params: {
 *     chartType: 'line',
 *     id: 'nested-series-chart',
 *     names: ['Flow', 'Stage']
 *   },
 *   data: nestedTimeSeriesData
 * });
 */

function chart({ params, args, data } = {}) {
  if (!Array.isArray(data)) return;

  let {
    chartType = "line",
    returnEle,
    partition = false,
    maxPoints = 1000,
    names = [],
    id = "visualize",
    options = {}
  } = params || {};

  if (typeof names === "string") {
    names = names.split(",").map(s => s.trim());
  }
  if (!Array.isArray(names)) {
    names = [];
  }

  let resizer;
  let currentChunkIndex = 0;
  let chunks = [];

  // Clear any existing chart state for this ID
  if (window._chartObjects && window._chartObjects[id]) {
    try {
      window._chartObjects[id].clearChart();
    } catch (e) {
      // Ignore clearChart errors
    }
    delete window._chartObjects[id];
  }

  function normalizeChartData(raw) {
    if (!Array.isArray(raw)) return [];

    // Check for deeply nested time series: [[["t", ...], ["v", ...]], ...]
    if (
      Array.isArray(raw[0]) &&
      Array.isArray(raw[0][0]) &&
      typeof raw[0][0][0] === "string"
    ) {
      const series = raw.map(entry => {
        const [timeArr, valArr] = entry;
        const x = timeArr.slice(1);
        const y = valArr.slice(1).map(Number);
        return x.map((t, i) => [t, y[i]]);
      });

      // Assume all series are aligned on same timestamps
      const timestamps = series[0].map(row => row[0]);
      const result = [timestamps];
      for (let s of series) {
        result.push(s.map(row => row[1]));
      }

      return result;
    }

    // Fallbacks for older formats
    if (raw.every(x => typeof x === "number")) {
      return [[...Array(raw.length).keys()], raw];
    }

    // Check if we have a simple List-of-Points format: [[x1, y1], [x2, y2], ...]
    if (
      raw.length > 2 &&
      Array.isArray(raw[0]) &&
      raw[0].length === 2 &&
      typeof raw[0][0] === "number" &&
      typeof raw[0][1] === "number"
    ) {
      // Convert Row-Major [[x,y]...] to Column-Major [[x...], [y...]]
      const x = raw.map(row => row[0]);
      const y = raw.map(row => row[1]);
      return [x, y];
    }

    // Check if we have a time series format: [["datetime", ...dates], ["value", ...values]]
    if (raw.length >= 2 &&
      Array.isArray(raw[0]) && Array.isArray(raw[1]) &&
      typeof raw[0][0] === 'string' && typeof raw[1][0] === 'string' &&
      raw[0].length > 1 && raw[1].length > 1) {

      // Check if first row contains date-like strings
      const firstDataRow = raw[0];
      const isDateTime = firstDataRow[0].toLowerCase().includes('date') ||
        firstDataRow[0].toLowerCase().includes('time') ||
        (firstDataRow.length > 1 && isDateString(firstDataRow[1]));

      if (isDateTime) {
        // Process as time series data
        const timeData = raw[0].slice(1); // Remove label, keep time values
        const result = [timeData]; // Time values as strings (Google Charts will parse them)

        // Process value series
        for (let i = 1; i < raw.length; i++) {
          const values = raw[i].slice(1).map(Number);
          result.push(values);
        }

        return result;
      }
    }

    let series = [], baseLength = 0;
    for (let entry of raw) {
      if (!Array.isArray(entry)) continue;

      if (Array.isArray(entry[0]) && typeof entry[0][0] === 'string') {
        let time = entry[0].slice(1);
        let values = entry[1].slice(1).map(Number);
        baseLength = Math.max(baseLength, time.length);
        series.push([time, values]);
      } else if (typeof entry[0] === 'string') {
        let values = entry.slice(1).map(Number);
        baseLength = Math.max(baseLength, values.length);
        series.push([null, values]);
      } else {
        baseLength = Math.max(baseLength, entry.length);
        series.push([null, entry.map(Number)]);
      }
    }

    let xBase = [...Array(baseLength).keys()];
    let result = [xBase];

    for (let [x, y] of series) {
      if (!x) x = xBase;
      x = x.concat(Array(baseLength - x.length).fill(null));
      y = y.concat(Array(baseLength - y.length).fill(null));
      result.push(y);
    }

    return result;
  }

  // Helper function to detect if a string is a date
  function isDateString(str) {
    if (typeof str !== 'string') return false;

    // Check for common date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
    ];

    return datePatterns.some(pattern => pattern.test(str)) || !isNaN(Date.parse(str));
  }

  function splitChunks(data, size) {
    const length = data[0].length;
    let result = [];
    size = Number(size); // Ensure size is a number

    for (let start = 0; start < length; start += size) {
      result.push(data.map(arr => arr.slice(start, start + size)));
    }

    return result;
  }

  // Create a unique ID for the inner chart container
  const chartContainerId = id + '-inner';

  const normalized = params.bypassNormalization ? data : normalizeChartData(data);
  // Get or create container
  let container = document.getElementById(id);
  if (!container) {
    const div = document.createElement("div");
    div.id = id;
    document.body.appendChild(div);
    container = div;
  }

  // Clear container content and reset any navigation state
  container.innerHTML = '';
  container._navCreated = false;

  // Ensure container is positioned relatively so absolute children are positioned correctly
  container.style.position = 'relative';

  // Create inner container for the chart canvas
  const innerDiv = document.createElement('div');
  innerDiv.id = chartContainerId;
  innerDiv.style.width = '100%';
  innerDiv.style.height = '100%';
  container.appendChild(innerDiv);

  function drawChart(subData) {
    // Use the inner container for the chart
    let targetContainer = document.getElementById(chartContainerId);

    // Fallback to main container if inner not found (shouldn't happen if setup correctly)
    if (!targetContainer) {
      targetContainer = document.getElementById(id);
    }

    const dataMatrix = [];

    const headers = ['X', ...subData.slice(1).map((_, i) => names[i] || 'Series ' + (i + 1))];
    dataMatrix.push(headers);

    // Check if first column contains date strings
    const isTimeSeriesData = subData[0].length > 0 &&
      typeof subData[0][0] === 'string' &&
      isDateString(subData[0][0]);

    for (let i = 0; i < subData[0].length; i++) {
      // Convert date strings to Date objects for proper time series rendering
      const xValue = isTimeSeriesData ? new Date(subData[0][i]) : subData[0][i];
      const row = [xValue];
      for (let j = 1; j < subData.length; j++) {
        row.push(subData[j][i]);
      }
      dataMatrix.push(row);
    }

    const chartData = google.visualization.arrayToDataTable(dataMatrix);

    const chartClassMap = {
      line: 'LineChart',
      column: 'ColumnChart',
      scatter: 'ScatterChart',
      timeline: 'Timeline',
      combo: 'ComboChart',
      histogram: 'Histogram',
      area: 'AreaChart',
      pie: 'PieChart',
      bar: 'BarChart'
    };

    if (!window._chartObjects) window._chartObjects = {};

    // Clear existing chart if it exists to prevent memory leaks and artifacts
    if (window._chartObjects[id]) {
      try {
        window._chartObjects[id].clearChart();
      } catch (e) {
        console.warn('Error clearing previous chart:', e);
      }
    }

    // Create new chart on the INNER container
    window._chartObjects[id] = new google.visualization[chartClassMap[chartType]](targetContainer);

    const chart = window._chartObjects[id];

    chart.draw(chartData, options);

    if (!window._resizeHandlers) window._resizeHandlers = {};
    if (!window._resizeHandlers[id]) {
      window._resizeHandlers[id] = true;
      window.addEventListener("resize", () => {
        clearTimeout(resizer);
        resizer = setTimeout(() => chart.draw(chartData, options), 100);
      });
    }
  }
  function createButtons(container) {
    if (container._navCreated) return;

    const nav = document.createElement("div");
    Object.assign(nav.style, {
      position: "absolute",
      bottom: "20px",
      right: "20px",
      zIndex: "1000",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: "6px 10px",
      borderRadius: "20px",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      backdropFilter: "blur(5px)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      cursor: "grab",
      userSelect: "none",
      transition: "box-shadow 0.2s ease"
    });

    // Drag functionality
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    nav.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);

    function dragStart(e) {
      if (e.target.tagName === "BUTTON") return; // Don't drag when clicking buttons
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      if (e.target === nav || nav.contains(e.target)) {
        isDragging = true;
        nav.style.cursor = "grabbing";
        nav.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
      }
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        setTranslate(currentX, currentY, nav);
      }
    }

    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      nav.style.cursor = "grab";
      nav.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
    }

    const createBtn = (icon, onClick) => {
      const btn = document.createElement("button");
      btn.innerHTML = icon;
      Object.assign(btn.style, {
        cursor: "pointer",
        width: "32px",
        height: "32px",
        border: "none",
        borderRadius: "50%",
        backgroundColor: "transparent",
        color: "#444",
        fontSize: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        outline: "none"
      });

      btn.onmouseenter = () => {
        if (!btn.disabled) {
          btn.style.backgroundColor = "rgba(0,0,0,0.05)";
          btn.style.color = "#000";
        }
      };
      btn.onmouseleave = () => {
        if (!btn.disabled) {
          btn.style.backgroundColor = "transparent";
          btn.style.color = "#444";
        }
      };
      btn.onmousedown = (e) => e.stopPropagation(); // Prevent drag start

      btn.onclick = (e) => {
        e.stopPropagation();
        onClick();
      };
      return btn;
    };

    const prevBtn = createBtn("&#10094;", () => {
      if (currentChunkIndex > 0) {
        currentChunkIndex--;
        drawChart(chunks[currentChunkIndex]);
        updateButtons();
      }
    });

    const nextBtn = createBtn("&#10095;", () => {
      if (currentChunkIndex < chunks.length - 1) {
        currentChunkIndex++;
        drawChart(chunks[currentChunkIndex]);
        updateButtons();
      }
    });

    const infoSpan = document.createElement("span");
    Object.assign(infoSpan.style, {
      margin: "0 4px",
      color: "#666",
      fontWeight: "500",
      minWidth: "40px",
      textAlign: "center",
      fontSize: "12px"
    });

    function updateButtons() {
      prevBtn.disabled = currentChunkIndex === 0;
      nextBtn.disabled = currentChunkIndex === chunks.length - 1;

      prevBtn.style.opacity = prevBtn.disabled ? "0.3" : "1";
      prevBtn.style.cursor = prevBtn.disabled ? "default" : "pointer";

      nextBtn.style.opacity = nextBtn.disabled ? "0.3" : "1";
      nextBtn.style.cursor = nextBtn.disabled ? "default" : "pointer";

      infoSpan.innerText = `${currentChunkIndex + 1} / ${chunks.length}`;
    }

    nav.appendChild(prevBtn);
    nav.appendChild(infoSpan);
    nav.appendChild(nextBtn);
    container.appendChild(nav);

    container._navCreated = true;
    updateButtons();
  }


  // Ensure maxPoints is a number
  maxPoints = Number(maxPoints);

  if (partition && normalized[0].length > maxPoints) {
    chunks = splitChunks(normalized, maxPoints);
    currentChunkIndex = 0; // Reset to first chunk
    drawChart(chunks[currentChunkIndex]);
    createButtons(container);
  } else {
    drawChart(normalized);
  }
}

/**
 * Creates interactive data tables using Google Charts Table visualization.
 * Displays hydrological data in a structured, sortable, and filterable table format.
 * Supports various data types and provides extensive formatting options.
 * 
 * @function table
 * @memberof visualize
 * @param {Object} options - Configuration object for table creation
 * @param {Object} options.params - Table parameters and settings
 * @param {string} options.params.id - HTML element ID for table container
 * @param {string[]} options.params.datatype - Array of column data types: 'string', 'number', 'date', 'boolean'
 * @param {Object} [options.params.options] - Google Charts Table options for styling and behavior
 * @param {Object} [options.args] - Additional arguments (currently unused)
 * @param {Array} options.data - Table data as nested array [headers, row1, row2, ...]
 * @returns {void} Creates and renders table in specified container
 * 
 * @example
 * // Create a simple streamflow data table
 * const streamflowData = [
 *   [['Date', 'Streamflow (cfs)', 'Stage (ft)', 'Quality Code']],
 *   [
 *     ['2023-01-01', 125.5, 2.1, 'A'],
 *     ['2023-01-02', 118.3, 2.0, 'A'],
 *     ['2023-01-03', 132.7, 2.3, 'A'],
 *     ['2023-01-04', 109.2, 1.9, 'E']
 *   ]
 * ];
 * 
 * hydro.visualize.table({
 *   params: {
 *     id: 'streamflow-table',
 *     datatype: ['string', 'number', 'number', 'string'],
 *     options: {
 *       title: 'Daily Streamflow Data',
 *       width: '100%',
 *       height: 400,
 *       alternatingRowStyle: true,
 *       sortColumn: 0,
 *       sortAscending: false
 *     }
 *   },
 *   data: streamflowData
 * });
 * 
 * @example
 * // Create water quality parameters table with custom formatting
 * const waterQualityData = [
 *   [['Station ID', 'Temperature (°C)', 'pH', 'Dissolved Oxygen (mg/L)', 'Turbidity (NTU)', 'Sample Date']],
 *   [
 *     ['USGS-01646500', 18.5, 7.2, 8.9, 12.3, new Date('2023-06-15')],
 *     ['USGS-01647000', 19.1, 7.4, 8.7, 15.1, new Date('2023-06-15')],
 *     ['USGS-01648000', 17.8, 6.9, 9.2, 8.7, new Date('2023-06-15')]
 *   ]
 * ];
 * 
 * hydro.visualize.table({
 *   params: {
 *     id: 'water-quality-table',
 *     datatype: ['string', 'number', 'number', 'number', 'number', 'date'],
 *     options: {
 *       title: 'Water Quality Monitoring Results',
 *       width: '100%',
 *       height: 300,
 *       allowHtml: true,
 *       cssClassNames: {
 *         'oddTableRow': 'odd-row',
 *         'evenTableRow': 'even-row',
 *         'headerRow': 'header-row'
 *       },
 *       numberFormat: '#,##0.0'
 *     }
 *   },
 *   data: waterQualityData
 * });
 * 
 * @example
 * // Create flood damage assessment table
 * const floodDamageData = [
 *   [['Property ID', 'Address', 'Flood Depth (ft)', 'Damage Estimate ($)', 'Building Type', 'Mitigation Recommended']],
 *   [
 *     ['P001', '123 River St', 2.5, 45000, 'Residential', true],
 *     ['P002', '456 Flood Ave', 1.8, 28000, 'Residential', false],
 *     ['P003', '789 Water Blvd', 4.2, 125000, 'Commercial', true],
 *     ['P004', '321 Stream Dr', 0.5, 8500, 'Residential', false]
 *   ]
 * ];
 * 
 * hydro.visualize.table({
 *   params: {
 *     id: 'flood-damage-table',
 *     datatype: ['string', 'string', 'number', 'number', 'string', 'boolean'],
 *     options: {
 *       title: 'Flood Damage Assessment Results',
 *       width: '100%',
 *       height: 350,
 *       sortColumn: 3,
 *       sortAscending: false,
 *       pageSize: 10,
 *       pagingButtons: 'auto'
 *     }
 *   },
 *   data: floodDamageData
 * });
 * 
 * @example
 * // Create precipitation summary table with conditional formatting
 * const precipitationData = [
 *   [['Month', 'Precipitation (in)', 'Days with Rain', 'Max Daily (in)', 'Departure from Normal (in)']],
 *   [
 *     ['January', 2.1, 8, 0.8, -0.3],
 *     ['February', 1.8, 6, 0.6, -0.5],
 *     ['March', 4.2, 12, 1.5, +1.2],
 *     ['April', 3.8, 10, 1.2, +0.8],
 *     ['May', 5.1, 14, 2.1, +1.5],
 *     ['June', 3.6, 9, 1.8, -0.2]
 *   ]
 * ];
 * 
 * hydro.visualize.table({
 *   params: {
 *     id: 'precipitation-summary',
 *     datatype: ['string', 'number', 'number', 'number', 'number'],
 *     options: {
 *       title: 'Monthly Precipitation Summary',
 *       width: '100%',
 *       height: 300,
 *       allowHtml: true,
 *       alternatingRowStyle: true
 *     }
 *   },
 *   data: precipitationData
 * });
 */
function table({ params, args, data } = {}) {
  // Use the robust drawHtmlTable for rendering
  drawHtmlTable({ params, data });
}

/**
 * Unified drawing function with preset configurations for charts, tables, and JSON visualization.
 * Provides an easy-to-use interface for creating visualizations with sensible defaults and
 * extensive customization options. Automatically handles Google Charts library loading.
 * 
 * @function draw
 * @memberof visualize
 * @param {Object} options - Configuration object for visualization
 * @param {Object} [options.params={}] - Drawing parameters and settings
 * @param {string} options.params.type - Visualization type: 'chart', 'table', or 'json'
 * @param {string} [options.params.id] - HTML element ID (auto-generated if not provided)
 * @param {string} [options.params.name] - Display name/title for the visualization
 * @param {boolean} [options.params.returnEle=false] - Whether to return the DOM element
 * @param {boolean} [options.params.partition=false] - Enable data pagination for large datasets
 * @param {number} [options.params.maxPoints=1000] - Maximum points per page when partition enabled
 * @param {Object} [options.args={}] - Visualization-specific arguments
 * @param {string} [options.args.charttype="line"] - Chart type for chart visualizations
 * @param {string[]|string} [options.args.names] - Series names/labels
 * @param {string} [options.args.font="monospace"] - Font family for text elements
 * @param {Object} [options.args.vAxes] - Vertical axes configuration
 * @param {Object} [options.args.series] - Series-specific styling
 * @param {Array} [options.data=[]] - Data to visualize in supported format
 * @returns {void|Element} Creates visualization or returns DOM element if returnEle is true
 * 
 * @example
 * // Create a simple line chart with default styling
 * const timeSeriesData = [
 *   [0, 1, 2, 3, 4, 5],
 *   [100.5, 95.2, 110.8, 88.3, 102.1, 97.6]
 * ];
 * 
 * hydro.visualize.draw({
 *   params: {
 *     type: 'chart',
 *     name: 'Daily Streamflow'
 *   },
 *   args: {
 *     charttype: 'line',
 *     names: ['Streamflow (cfs)']
 *   },
 *   data: timeSeriesData
 * });
 * 
 * @example
 * // Create a multi-series chart with custom styling
 * const multiParameterData = [
 *   ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04'],
 *   [125.5, 118.3, 132.7, 109.2],  // Streamflow
 *   [2.1, 2.0, 2.3, 1.9],          // Stage
 *   [0.0, 0.2, 0.8, 0.1]           // Precipitation
 * ];
 * 
 * hydro.visualize.draw({
 *   params: {
 *     type: 'chart',
 *     name: 'Hydrological Parameters',
 *     id: 'multi-param-chart'
 *   },
 *   args: {
 *     charttype: 'line',
 *     names: ['Streamflow (cfs)', 'Stage Height (ft)', 'Precipitation (in)'],
 *     font: 'Arial',
 *     backgroundColor: '#f8f9fa',
 *     titleColor: '#2c3e50',
 *     vAxes: {
 *       0: { 
 *         title: 'Flow & Stage',
 *         titleTextStyle: { color: '#1f77b4' }
 *       },
 *       1: { 
 *         title: 'Precipitation',
 *         titleTextStyle: { color: '#2ca02c' }
 *       }
 *     },
 *     series: {
 *       0: { color: '#1f77b4', lineWidth: 3 },
 *       1: { color: '#ff7f0e', lineWidth: 2 },
 *       2: { color: '#2ca02c', targetAxisIndex: 1, type: 'columns' }
 *     }
 *   },
 *   data: multiParameterData
 * });
 * 
 * @example
 * // Create a column chart for monthly data
 * const monthlyData = [
 *   ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
 *   [2.1, 1.8, 3.2, 4.5, 5.1, 3.8]
 * ];
 * 
 * hydro.visualize.draw({
 *   params: {
 *     type: 'chart',
 *     name: 'Monthly Precipitation',
 *     id: 'monthly-precip'
 *   },
 *   args: {
 *     charttype: 'column',
 *     names: ['Precipitation (inches)'],
 *     backgroundColor: '#ffffff',
 *     chartAreaWidth: '80%',
 *     chartAreaHeight: '70%',
 *     barWidth: '80%'
 *   },
 *   data: monthlyData
 * });
 * 
 * @example
 * // Create a data table
 * const tableData = [
 *   [['Date', 'Flow (cfs)', 'Stage (ft)']],
 *   [
 *     ['2023-01-01', 125.5, 2.1],
 *     ['2023-01-02', 118.3, 2.0],
 *     ['2023-01-03', 132.7, 2.3]
 *   ]
 * ];
 * 
 * hydro.visualize.draw({
 *   params: {
 *     type: 'table',
 *     name: 'Streamflow Data',
 *     id: 'data-table'
 *   },
 *   data: tableData
 * });
 * 
 * @example
 * // Render JSON data for inspection
 * const jsonData = {
 *   station: {
 *     id: 'USGS-01646500',
 *     name: 'Potomac River at Washington, DC',
 *     coordinates: { lat: 38.9495, lon: -77.0458 },
 *     parameters: ['streamflow', 'stage', 'temperature']
 *   },
 *   data: {
 *     recent: [125.5, 118.3, 132.7],
 *     quality: ['A', 'A', 'A']
 *   }
 * };
 * 
 * hydro.visualize.draw({
 *   params: {
 *     type: 'json',
 *     name: 'Station Metadata',
 *     id: 'station-info'
 *   },
 *   data: jsonData
 * });
 * 
 * @example
 * // Large dataset with pagination
 * const largeTimeSeries = generateLargeDataset(5000); // Assume 5000 data points
 * 
 * hydro.visualize.draw({
 *   params: {
 *     type: 'chart',
 *     name: 'Long-term Streamflow Record',
 *     partition: true,
 *     maxPoints: 500
 *   },
 *   args: {
 *     charttype: 'line',
 *     names: ['Historical Streamflow'],
 *     chartAreaHeight: '80%'
 *   },
 *   data: largeTimeSeries
 * });
 */

function draw({ params = {}, args = {}, data = [] } = {}) {
  // Ensure Google Charts is loaded before proceeding
  if (!window.google || !window.google.charts) {
    console.warn('Google Charts not loaded, attempting to load...');
    google.charts.load("current", {
      packages: ["corechart", "table", "line", "timeline"],
      callback: () => {
        // Retry the draw after loading
        draw({ params, args, data });
      }
    });
    return;
  }

  if (!window.loaded) {
    google.charts.load("current", {
      packages: ["corechart", "table", "line", "timeline"],
    });
  }
  window.loaded = true;

  let {
    type,
    id = `chart-${Math.floor(Math.random() * 100)}-gen`,
    name,
    returnEle = false,
  } = params;
  name === undefined ? (name = id) : name;

  var dat = data,
    pm;
  if (type !== "json") {
    //change the input in case its just a 1d array
    if (Array.isArray(data) && typeof data[0] === "number") {
      // Single array of numbers, convert to [x, y]
      const x = Array.from({ length: data.length }, (_, i) => i);
      data = [x, data];
    }
  }

  let container = document.getElementById(id)

  // Get container dimensions if provided
  const containerWidth = container?.offsetWidth || '100%';
  const containerHeight = container?.offsetHeight || '100%';


  //Chart drawing options.
  // Chart drawing options
  if (type === "chart") {
    let { charttype = "line", names } = args;

    // Support for Combo Chart if charttype is an array
    if (Array.isArray(charttype)) {
      // 1. Ensure container exists (Auto-create if missing)
      if (container) {
        // If container exists, clear it to ensure we are rendering a fresh single chart
        container.innerHTML = '';
        container.style.display = 'block';
      } else {
        container = document.createElement("div");
        container.id = id;
        container.style.display = 'block';
        document.body.appendChild(container);
      }

      // Ensure container has dimensions, otherwise chart may be 0px height
      container.style.width = args.width || '100%';
      container.style.height = args.height || '400px';

      // 2. Prepare Data for Combo Chart
      let mergedData = data;
      let bypassNorm = false;
      let comboNames = names;

      // Helper to join multiple datasets.
      // Returns { columns: [x, y1, y2...], names: [s1, s2...] }
      const joinDatasets = (datasets) => {
        if (!datasets || datasets.length < 2) return { columns: [], names: [] };

        let xMap = new Map();
        let extractedNames = [];

        datasets.forEach((d, i) => {
          // Determine series name
          let seriesName = (names && names[i]) ? names[i] : (d[0][1] || `Series ${i + 1}`);
          if (Array.isArray(seriesName)) seriesName = seriesName[0];
          extractedNames.push(seriesName);

          // Process rows
          for (let r = 1; r < d.length; r++) {
            let row = d[r];
            let x = row[0];
            let y = row[1];
            let key = String(x);
            if (!xMap.has(key)) {
              xMap.set(key, { val: x, yObj: {} });
            }
            xMap.get(key).yObj[i] = y;
          }
        });

        let keys = Array.from(xMap.keys());
        // Sort based on value
        keys.sort((a, b) => {
          let va = xMap.get(a).val;
          let vb = xMap.get(b).val;
          if (va < vb) return -1;
          if (va > vb) return 1;
          return 0;
        });

        // Construct Column-Major Arrays
        let xCol = [];
        let yCols = Array(datasets.length).fill().map(() => []);

        keys.forEach(k => {
          let item = xMap.get(k);
          xCol.push(item.val);
          for (let i = 0; i < datasets.length; i++) {
            yCols[i].push(item.yObj[i] !== undefined ? item.yObj[i] : null);
          }
        });

        return {
          columns: [xCol, ...yCols],
          names: extractedNames
        };
      };

      if (Array.isArray(data) && data.length === charttype.length && Array.isArray(data[0]) && Array.isArray(data[0][0])) {
        const res = joinDatasets(data);
        mergedData = res.columns;
        comboNames = res.names;
        bypassNorm = true;
      }

      // 3. Configure Combo Chart Options
      const seriesConfig = {};
      charttype.forEach((type, i) => {
        // Google Charts ComboChart uses 'bars' for column series, not 'column'
        let mappedType = type;
        if (type === 'column') mappedType = 'bars';

        seriesConfig[i] = { type: mappedType };
      });

      const finalSeries = { ...seriesConfig, ...(args.series || {}) };

      const comboArgs = {
        ...args,
        charttype: 'combo',
        series: finalSeries
      };

      const comboParams = {
        ...params,
        type: 'chart',
        id: id,
        name: name,
        names: comboNames,
        bypassNormalization: bypassNorm
      };

      draw({ params: comboParams, args: comboArgs, data: mergedData });
      return;
    }




    // Base options
    const baseOptions = {
      width: containerWidth,
      height: containerHeight,
      title: name,
      fontName: args.font || "monospace",
      chartArea: {
        width: args.chartAreaWidth || '85%',
        height: args.chartAreaHeight || '75%',
        left: args.chartAreaLeft || '15%',
        top: args.chartAreaTop || '15%',
        right: args.chartAreaRight || '5%',
        bottom: args.chartAreaBottom || '20%'
      },
      backgroundColor: args.backgroundColor || '#fff',
      titleTextStyle: {
        color: args.titleColor || '#333',
        fontSize: args.titleFontSize || 16,
        bold: args.titleBold !== false
      },
      legend: {
        position: args.legendPosition || 'bottom',
        textStyle: {
          color: args.legendTextColor || '#666',
          fontSize: args.legendFontSize || 12
        }
      }
    };

    // Chart type specific options
    const chartSpecificOptions = {
      line: {
        curveType: args.curveType || 'function',
        lineWidth: args.lineWidth || 2,
        pointSize: args.pointSize || 5,
        explorer: {
          actions: ['dragToZoom', 'rightClickToReset']
        },
        vAxes: args.vAxes || {},
        series: args.series || {}
      },
      column: {
        bar: { groupWidth: args.barWidth || '75%' },
        isStacked: args.stacked || false,
        vAxes: args.vAxes || {},
        series: args.series || {}
      },
      scatter: {
        pointShape: args.pointShape || 'circle',
        pointSize: args.pointSize || 5,
        trendlines: args.trendlines || {},
        vAxes: args.vAxes || {},
        series: args.series || {}
      },
      pie: {
        pieHole: args.donut ? 0.4 : 0,
        pieSliceText: 'percentage'
      },
      combo: {
        seriesType: args.seriesType || 'line',
        series: args.series || {},
        vAxes: args.vAxes || {}
      }
    };

    var pm = {
      chartType: charttype,
      id,
      name,
      options: {
        ...baseOptions,
        ...(chartSpecificOptions[charttype] || {})
      },
      names: names,
      partition: params.partition || false,
      maxPoints: params.maxPoints || 1000
    };

    // Use google.charts.setOnLoadCallback for better timing
    if (window.google && window.google.charts) {
      google.charts.setOnLoadCallback(() => {
        try {
          chart({ params: pm, data: dat });
        } catch (error) {
          console.error('Error drawing chart:', error);
        }
      });
    } else {
      // Fallback to setTimeout if setOnLoadCallback is not available
      setTimeout(() => {
        try {
          chart({ params: pm, data: dat });
        } catch (error) {
          console.error('Error drawing chart:', error);
        }
      }, 300);
    }
    return;
  }

  //Table options
  else if (type === "table") {
    // var datatype = [];
    // //MOMENTARY CORRECTION
    // dat[0][1][0] = "Value";
    // datatype.push("string");
    // datatype.push("number");
    // //Customizable chart for two columns. Will be expanded to n columns.
    pm = {
      id: id,
      //datatype: datatype,
      options: {
        title: id,
        width: "100%",
        height: "80%",
      },
    };
    // setTimeout(() => table({ params: pm, data: dat }), 200);
    // return;
    drawHtmlTable({ params: pm, data: dat })
  }
  //JSON options.
  else if (type === "json") {
    return prettyPrint({ params: params, data: data });
  }
}

/**
 * Creates an interactive JSON viewer for exploring complex JavaScript objects and data structures.
 * Uses the renderjson library to provide collapsible, hierarchical display of JSON data with
 * syntax highlighting and navigation controls. Ideal for data inspection and debugging.
 * 
 * @function prettyPrint
 * @memberof visualize
 * @param {Object} options - Configuration object for JSON rendering
 * @param {Object} [options.params] - Rendering parameters and settings
 * @param {string} [options.params.id="jsonrender"] - HTML element ID for JSON container
 * @param {string} [options.params.title] - Title to display above the JSON viewer
 * @param {string} [options.params.input] - Input mode: 'all' to display localStorage items, or omit for data parameter
 * @param {string} [options.params.type="JSON"] - Data type (currently only JSON supported)
 * @param {Object} [options.args] - Additional arguments (currently unused)
 * @param {Object|Array} [options.data] - JavaScript object or array to render as JSON
 * @returns {void} Creates and displays interactive JSON viewer in specified container
 * 
 * @example
 * // Display API response data for inspection
 * const apiResponse = {
 *   station: {
 *     id: 'USGS-01646500',
 *     name: 'Potomac River at Washington, DC',
 *     coordinates: { latitude: 38.9495, longitude: -77.0458 },
 *     drainage_area: 11570.0,
 *     status: 'active'
 *   },
 *   timeSeries: [
 *     {
 *       variable: { code: '00060', name: 'Streamflow', unit: 'ft3/s' },
 *       values: [
 *         { dateTime: '2023-01-01T12:00:00Z', value: 2850, qualifiers: ['A'] },
 *         { dateTime: '2023-01-01T12:15:00Z', value: 2840, qualifiers: ['A'] }
 *       ]
 *     }
 *   ]
 * };
 * 
 * hydro.visualize.prettyPrint({
 *   params: {
 *     id: 'api-response-viewer',
 *     title: 'USGS API Response Data'
 *   },
 *   data: apiResponse
 * });
 * 
 * @example
 * // Display flood modeling results
 * const floodModelResults = {
 *   scenario: {
 *     return_period: '100-year',
 *     peak_discharge: 15000,
 *     flood_stage: 18.5,
 *     duration_hours: 72
 *   },
 *   affected_areas: [
 *     {
 *       name: 'Downtown District',
 *       area_sq_km: 2.3,
 *       max_depth_ft: 4.2,
 *       buildings_affected: 245,
 *       estimated_damage: 8500000
 *     },
 *     {
 *       name: 'Residential Zone A',
 *       area_sq_km: 5.1,
 *       max_depth_ft: 2.8,
 *       buildings_affected: 189,
 *       estimated_damage: 3200000
 *     }
 *   ],
 *   mitigation_measures: {
 *     levees: { effectiveness: 0.85, cost: 12000000 },
 *     flood_walls: { effectiveness: 0.75, cost: 8500000 },
 *     early_warning: { effectiveness: 0.60, cost: 500000 }
 *   }
 * };
 * 
 * hydro.visualize.prettyPrint({
 *   params: {
 *     id: 'flood-results-viewer',
 *     title: 'Flood Model Results - 100 Year Event'
 *   },
 *   data: floodModelResults
 * });
 * 
 * @example
 * // Display water quality monitoring metadata
 * const waterQualityMeta = {
 *   monitoring_program: {
 *     name: 'Chesapeake Bay Water Quality Monitoring',
 *     agency: 'EPA',
 *     start_date: '1985-01-01',
 *     frequency: 'monthly'
 *   },
 *   parameters: [
 *     { code: 'TEMP', name: 'Temperature', unit: 'degrees Celsius', precision: 0.1 },
 *     { code: 'DO', name: 'Dissolved Oxygen', unit: 'mg/L', precision: 0.01 },
 *     { code: 'PH', name: 'pH', unit: 'standard units', precision: 0.01 },
 *     { code: 'TURB', name: 'Turbidity', unit: 'NTU', precision: 0.1 }
 *   ],
 *   quality_codes: {
 *     'A': 'Approved for publication',
 *     'P': 'Provisional data',
 *     'E': 'Estimated',
 *     'R': 'Revised'
 *   },
 *   stations: {
 *     total: 156,
 *     active: 142,
 *     discontinued: 14
 *   }
 * };
 * 
 * hydro.visualize.prettyPrint({
 *   params: {
 *     id: 'wq-metadata-viewer',
 *     title: 'Water Quality Program Metadata'
 *   },
 *   data: waterQualityMeta
 * });
 * 
 * @example
 * // Display all objects stored in localStorage
 * hydro.visualize.prettyPrint({
 *   params: {
 *     input: 'all',
 *     id: 'localStorage-viewer',
 *     title: 'Stored Data Objects'
 *   }
 * });
 * 
 * @example
 * // Display complex nested analysis results
 * const analysisResults = {
 *   analysis_type: 'flow_duration_curve',
 *   station_info: {
 *     usgs_id: '01646500',
 *     period_of_record: { start: '1930-10-01', end: '2023-09-30' },
 *     years_of_data: 93
 *   },
 *   statistics: {
 *     percentiles: {
 *       p05: 8420, p10: 5280, p25: 2650, p50: 1580,
 *       p75: 980, p90: 640, p95: 480
 *     },
 *     annual_stats: {
 *       mean: 2180, median: 1580, std_dev: 3420,
 *       min: 112, max: 32600, skewness: 4.2
 *     }
 *   },
 *   data_quality: {
 *     percent_complete: 98.7,
 *     missing_days: 425,
 *     estimated_values: 1250,
 *     quality_flags: { good: 95.2, estimated: 3.8, poor: 1.0 }
 *   }
 * };
 * 
 * hydro.visualize.prettyPrint({
 *   params: {
 *     id: 'analysis-results-viewer',
 *     title: 'Flow Duration Analysis Results'
 *   },
 *   data: analysisResults
 * });
 */

/**
 * Renders a simple HTML table from 2D array data.
 */
function drawHtmlTable({ params, data } = {}) {
  const containerId = params.id || "visualize";
  const container = document.getElementById(containerId);

  if (!container || !Array.isArray(data) || data.length < 1) {
    console.error("Invalid container or data structure for table.");
    return;
  }

  // Handle data = data[0] legacy bug: if strictly 1D array of arrays, it's fine.
  // But if passed as [ [[...]] ], unwrap it.
  if (data.length === 1 && Array.isArray(data[0]) && Array.isArray(data[0][0])) {
    data = data[0];
  }

  container.innerHTML = ""; // Clear previous content

  const style = document.createElement("style");
  style.textContent = `
    #${containerId} table {
      width: 100%;
      border-collapse: collapse;
      font-family: sans-serif;
      font-size: 14px;
      color: #333;
    }

    #${containerId} th,
    #${containerId} td {
      padding: 8px 12px;
      border: 1px solid #ddd;
    }

    #${containerId} th {
      text-align: left;
      font-weight: 600;
      background-color: #f4f4f4;
    }

    #${containerId} tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    #${containerId} tr:hover {
      background-color: #f1f1f1;
    }
  `;
  // Only append style if not already processed for this ID (optional optimization, skipping for simplicity)
  container.appendChild(style);

  const table = document.createElement("table");

  // Headers (first row)
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  if (data.length > 0) {
    data[0].forEach(cell => {
      const th = document.createElement("th");
      th.textContent = cell;
      headerRow.appendChild(th);
    });
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement("tbody");
  for (let i = 1; i < data.length; i++) {
    const row = document.createElement("tr");
    data[i].forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      row.appendChild(td);
    });
    tbody.appendChild(row);
  }
  table.appendChild(tbody);

  container.appendChild(table);
}

/**
 * Creates comprehensive HTML reports with interactive JSON exploration capabilities.
 * Generates structured reports with summary statistics, data previews, and export functionality.
 * Ideal for data analysis documentation and sharing results with stakeholders.
 * 
 * @function generateReport
 * @memberof visualize
 * @param {Object} options - Configuration object for report generation
 * @param {Object} [options.params] - Report parameters and settings
 * @param {string} [options.params.id="report-container"] - HTML element ID for report container
 * @param {string} [options.params.title] - Title for the report
 * @param {Object} [options.args] - Additional arguments (currently unused)
 * @param {Object|Array} options.data - Data object to include in the report
 * @returns {void} Creates and displays interactive report in specified container
 * 
 * @example
 * // Generate report for streamflow analysis results
 * const streamflowAnalysis = {
 *   metadata: {
 *     station_id: 'USGS-01646500',
 *     analysis_period: '2020-2023',
 *     record_length: '4 years',
 *     data_completeness: '99.2%'
 *   },
 *   statistics: {
 *     mean_flow: 2180.5,
 *     median_flow: 1820.0,
 *     max_flow: 18500.0,
 *     min_flow: 245.0,
 *     flow_percentiles: {
 *       p10: 680, p25: 1120, p75: 2890, p90: 4560
 *     }
 *   },
 *   seasonal_patterns: {
 *     spring_avg: 3450, summer_avg: 1820,
 *     fall_avg: 1680, winter_avg: 2280
 *   }
 * };
 * 
 * hydro.visualize.generateReport({
 *   params: {
 *     id: 'streamflow-report',
 *     title: 'Potomac River Streamflow Analysis Report'
 *   },
 *   data: streamflowAnalysis
 * });
 * 
 * @example
 * // Generate flood risk assessment report
 * const floodRiskData = {
 *   assessment_info: {
 *     study_area: 'Cedar Rapids, IA',
 *     flood_scenarios: ['10-yr', '25-yr', '50-yr', '100-yr', '500-yr'],
 *     assessment_date: '2023-08-15',
 *     methodology: 'HEC-RAS 2D modeling'
 *   },
 *   risk_summary: {
 *     total_structures: 2847,
 *     at_risk_100yr: 456,
 *     estimated_damages_100yr: 125000000,
 *     population_at_risk: 1230
 *   },
 *   mitigation_options: [
 *     { type: 'Levee System', cost: 45000000, benefit_cost_ratio: 2.8 },
 *     { type: 'Floodwall', cost: 28000000, benefit_cost_ratio: 2.1 },
 *     { type: 'Property Buyouts', cost: 15000000, benefit_cost_ratio: 3.2 }
 *   ]
 * };
 * 
 * hydro.visualize.generateReport({
 *   params: {
 *     id: 'flood-risk-report',
 *     title: 'Cedar Rapids Flood Risk Assessment'
 *   },
 *   data: floodRiskData
 * });
 */
function generateReport({ params, args, data } = {}) {
  const containerId = params.id || "report-container";
  let container = document.getElementById(containerId);

  if (!container) {
    const reportContent = document.querySelector('.report-content');
    if (reportContent) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = 'report-container';
      reportContent.appendChild(container);
    } else {
      console.error('Report content area not found');
      return;
    }
  }

  container.innerHTML = '';

  const reportHeader = document.createElement('div');
  reportHeader.className = 'report-header';
  reportHeader.textContent = params.title || 'JSON Report';
  container.appendChild(reportHeader);

  const reportBody = document.createElement('div');
  reportBody.className = 'report-body';

  const summarySection = document.createElement('div');
  summarySection.className = 'report-section';
  summarySection.innerHTML = `
    <h4>Summary</h4>
    <p>Type: ${typeof data}</p>
    <p>Keys: ${Object.keys(data).length}</p>
  `;
  reportBody.appendChild(summarySection);

  const previewSection = document.createElement('div');
  previewSection.className = 'report-section';
  previewSection.innerHTML = `
    <h4>JSON Preview</h4>
    <div class="json-preview"></div>
  `;
  const jsonPreview = previewSection.querySelector('.json-preview');
  reportBody.appendChild(previewSection);

  function renderJson(obj, parent, maxInitialKeys = 50, loadBatchSize = 50) {
    const ul = document.createElement('ul');
    ul.className = 'json-list';

    const entries = Object.entries(obj);
    let shownCount = 0;

    const renderChunk = (start, end) => {
      for (let i = start; i < end && i < entries.length; i++) {
        const [key, value] = entries[i];
        const li = document.createElement('li');
        li.className = 'json-item';

        const keySpan = document.createElement('span');
        keySpan.className = 'json-key';
        keySpan.textContent = key + ': ';
        li.appendChild(keySpan);

        if (typeof value === 'object' && value !== null) {
          const toggle = document.createElement('span');
          toggle.className = 'json-toggle';
          toggle.textContent = '[+]';
          let ulChild;

          toggle.addEventListener('click', () => {
            if (!ulChild) {
              ulChild = document.createElement('ul');
              ulChild.className = 'json-list';
              renderJson(value, ulChild, maxInitialKeys, loadBatchSize);
              li.appendChild(ulChild);
            }
            const isHidden = ulChild.style.display === 'none';
            ulChild.style.display = isHidden ? 'block' : 'none';
            toggle.textContent = isHidden ? '[-]' : '[+]';
          });

          li.appendChild(toggle);
        } else {
          const valueSpan = document.createElement('span');
          valueSpan.className = 'json-value';
          valueSpan.textContent = JSON.stringify(value);
          li.appendChild(valueSpan);
        }

        ul.appendChild(li);
      }
    };

    renderChunk(0, maxInitialKeys);
    shownCount = maxInitialKeys;

    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.textContent = `Load more (${entries.length - shownCount} remaining)`;
    loadMoreBtn.className = 'json-load-more';
    loadMoreBtn.style.marginTop = '5px';
    loadMoreBtn.onclick = () => {
      renderChunk(shownCount, shownCount + loadBatchSize);
      shownCount += loadBatchSize;
      if (shownCount >= entries.length) {
        loadMoreBtn.remove();
      } else {
        loadMoreBtn.textContent = `Load more (${entries.length - shownCount} remaining)`;
        ul.appendChild(loadMoreBtn); // Append again at the end
      }
    };

    if (entries.length > maxInitialKeys) {
      ul.appendChild(loadMoreBtn);
    }

    parent.appendChild(ul);
  }

  const jsonContainer = document.createElement('div');
  jsonContainer.className = 'json-container';
  renderJson(data, jsonContainer);
  jsonPreview.appendChild(jsonContainer);

  const downloadSection = document.createElement('div');
  downloadSection.className = 'report-section';
  downloadSection.innerHTML = `
    <h4>Export JSON</h4>
    <button class="download-button">Download as JSON</button>
  `;
  const downloadButton = downloadSection.querySelector('.download-button');
  downloadButton.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${params.title || 'data'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  reportBody.appendChild(downloadSection);

  container.appendChild(reportBody);
}

/**
 * Creates clean, responsive HTML tables with built-in styling for displaying key-value pairs.
 * Generates lightweight tables without external dependencies, ideal for summary data display
 * and quick data presentation in reports or dashboards.
 * 
 * @function drawHtmlTable
 * @memberof visualize
 * @param {Object} options - Configuration object for HTML table creation
 * @param {Object} [options.params] - Table parameters and settings
 * @param {string} [options.params.id="visualize"] - HTML element ID for table container
 * @param {Array} options.data - Data array containing [labels, values] pairs
 * @returns {void} Creates and displays HTML table in specified container
 * 
 * @example
 * // Create station summary table
 * const stationSummary = [
 *   ['Station ID', 'Station Name', 'Latitude', 'Longitude', 'Drainage Area', 'Record Start'],
 *   ['USGS-01646500', 'Potomac River at Washington, DC', '38.9495°N', '77.0458°W', '11,570 sq mi', '1930-10-01']
 * ];
 * 
 * hydro.visualize.drawHtmlTable({
 *   params: { id: 'station-info-table' },
 *   data: stationSummary
 * });
 * 
 * @example
 * // Create current conditions table
 * const currentConditions = [
 *   ['Parameter', 'Current Reading', 'Date/Time', 'Quality', 'Units'],
 *   [
 *     'Streamflow', '2,450', '2023-08-15 14:30', 'Approved', 'ft³/s',
 *     'Stage Height', '8.25', '2023-08-15 14:30', 'Approved', 'ft',
 *     'Water Temperature', '22.8', '2023-08-15 14:30', 'Provisional', '°C'
 *   ]
 * ];
 * 
 * hydro.visualize.drawHtmlTable({
 *   params: { id: 'current-conditions' },
 *   data: currentConditions
 * });
 * 
 * @example
 * // Create flood damage summary table
 * const floodSummary = [
 *   ['Flood Scenario', 'Peak Discharge', 'Affected Properties', 'Estimated Damage', 'Population at Risk'],
 *   [
 *     '25-year', '8,500 ft³/s', '125', '$2.8M', '340',
 *     '100-year', '12,800 ft³/s', '456', '$8.5M', '980', 
 *     '500-year', '18,200 ft³/s', '1,250', '$25.2M', '2,400'
 *   ]
 * ];
 * 
 * hydro.visualize.drawHtmlTable({
 *   params: { id: 'flood-damage-summary' },
 *   data: floodSummary
 * });
 * 
 * @example
 * // Create water quality results table
 * const waterQualityResults = [
 *   ['Test Parameter', 'Result', 'EPA Standard', 'Status', 'Collection Date'],
 *   [
 *     'pH', '7.2', '6.5 - 8.5', 'Within Range', '2023-08-10',
 *     'Dissolved Oxygen', '8.9 mg/L', '>5.0 mg/L', 'Good', '2023-08-10',
 *     'Turbidity', '3.2 NTU', '<4.0 NTU', 'Acceptable', '2023-08-10',
 *     'E. coli', '45 CFU/100mL', '<126 CFU/100mL', 'Safe', '2023-08-10'
 *   ]
 * ];
 * 
 * hydro.visualize.drawHtmlTable({
 *   params: { id: 'water-quality-results' },
 *   data: waterQualityResults
 * });
 * 
 * @example
 * // Create simple key-value pairs table
 * const metadata = [
 *   ['Data Source', 'Analysis Period', 'Total Records', 'Missing Data', 'Quality Score'],
 *   ['USGS NWIS', '2020-2023', '1,461 days', '12 days (0.8%)', '99.2%']
 * ];
 * 
 * hydro.visualize.drawHtmlTable({
 *   params: { id: 'dataset-metadata' },
 *   data: metadata
 * });
 */

// Removed older drawHtmlTable implementation to avoid duplication/confusion


export { draw, generateReport };
export default { draw, generateReport };
