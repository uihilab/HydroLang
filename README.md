<p align="center">
    <img width="550" src = https://github.com/uihilab/HydroLang/blob/master/hydrolang/images/logo_v1.1.0.png>
 </p>

## Table of Contents

[**Link to documentation**](https://uihilab.github.io/HydroLang/)

* [Introduction](#introduction)
* [Modules](#modules)
    * [Data](#data)
    * [Analyze](#analyze)
    * [Visualization](#visualization)
    * [Maps](#maps)
* [How to Use](#how-to-use)
* [Examples](#examples)
* [Community](#community)
* [Feedback](#feedback)
* [License](#license)
* [Acknowledgements](#acknowledgements)
* [References](#references)

## Introduction
HydroLang is an open-source, web-based framework designed for comprehensive environmental and hydrological analysis. Built with modularity and extensibility in mind, it empowers researchers and developers to perform complex data retrieval, analysis, modeling, and visualization directly within the browser.

By leveraging modern web technologies including **GDAL via WebAssembly for raster processing** and **TensorFlow.js for client-side machine learning**, HydroLang enables high-performance computing without the need for backend infrastructure.

## Modules

HydroLang consists of four core modules, each designed to handle specific aspects of the hydrological workflow. These modules can be used independently or chained together for seamless end-to-end analysis.

### Data
The **Data** module facilitates the retrieval, manipulation, and management of hydrological and environmental data. It supports connection to various public APIs and data sources, harmonizing diverse data formats into a unified structure for analysis.

### Analyze
The **Analyze** module is the computational core of HydroLang, subdivided into three specialized components:
*   **Hydro & Stats**: Provides essential hydrological functions (e.g., rainfall-runoff lumped models) and robust statistical characterization tools for time-series data.
*   **Geoprocessor**: A powerful client-side raster analysis engine powered by **GDAL (WASM)**. It enables advanced geospatial operations such as slope and aspect calculation, hillshading, reclassification, and terrain analysis directly in the browser.
*   **NN (Neural Networks)**: A comprehensive machine learning component built on **TensorFlow.js**. It runs in a dedicated Web Worker to ensure UI responsiveness and supports various architectures including:
    *   **Dense (Feed Forward)**: For general regression and classification.
    *   **LSTM (Long Short-Term Memory)**: Optimized for time-series forecasting.
    *   **CNN (Convolutional Neural Networks)**: For spatial pattern recognition.

### Visualization
The **Visualization** module enables the creation of interactive and publication-quality charts and tables. Built on top of **Google Charts**, it offers a wide range of visualization types (Line, Scatter, Bar, Histogram, etc.) and includes utilities for generating comprehensive HTML reports (`generateReport`) to summarize analytical results.

### Maps
The **Maps** module handles geospatial visualization, supporting both **Leaflet** and **Google Maps** engines. It provides tools for:
*   Rendering vector data (GeoJSON, KML).
*   Visualizing raster data (GeoTIFF) using the `addGeoRasterLayer` function.
*   Interactive drawing and spatial querying with the built-in `draw` capabilities.

## How to Use
To use HydroLang, simply include the `hydro.js` module in your HTML file. No installation or build process is required.

```html
<script type="module" src="./hydrolang/hydro.js"></script>
```

Initialize the library:

```javascript
import Hydrolang from './hydrolang/hydro.js';
const hydro = new Hydrolang();
```

HydroLang uses a consistent "params-args-data" pattern for most of its functions, utilizing object destructuring for clarity and flexibility:

```javascript
hydro[module][component][function]({
    params: { /* Configuration parameters (e.g., model type, chart options) */ },
    args:   { /* Execution arguments (e.g., specific flags, keys) */ },
    data:   [ /* Input data (arrays, typed arrays, or data objects) */ ]
})
```

### Quick Examples

**1. Data Retrieval**
```javascript
hydro.data.retrieve({
    params: { source: 'USGS', dataType: 'streamflow' },
    args:   { site: '05454500', period: 'P7D' }
})
.then(data => console.log(data));
```

**2. Neural Network Prediction**
```javascript
// Create and train an LSTM model
const model = await hydro.analyze.nn.createModel({
    params: { type: 'lstm', units: 50, shape: [7, 1] } // 7-day lookback
});

await model.train({
    params: { epochs: 50 },
    data: { inputs: xTrain, outputs: yTrain }
});
```

**3. Geoprocessing**
```javascript
// Calculate slope from a DEM
const slopeData = await hydro.analyze.geoprocessor.execute({
    params: { action: 'slope' },
    data: [{ buffer: demArrayBuffer }]
});
```

## Examples
The `examples/` directory contains a comprehensive set of demos illustrating real-world use cases. These are categorized to help you get started quickly:

*   **Data Sources**:
    *   `usgs_streamflow.html`: Fetching and visualizing real-time streamflow data.
    *   `3dep_dem_retrieval.html`: Retrieving elevation data for terrain analysis.
*   **Geoprocessing**:
    *   `terrain_analysis.html`: Performing client-side terrain analysis (Slope, Aspect, Hillshade).
    *   `watershed_delineation.html`: Delineating watersheds and stream networks.
*   **Machine Learning**:
    *   `lstm_streamflow_forecast.html`: Forecasting streamflow using Deep Learning (LSTM).
*   **Statistical Analysis**:
    *   `correlation_analysis.html`: analyzing relationships between hydrological variables.

## Community
HydroLang is a community-driven project. We welcome contributions from researchers, developers, and hydrologists. You can contribute by:
*   Filing issues for bugs or feature requests.
*   Submitting Pull Requests with new modules, data sources, or improvements.
*   Sharing your models and case studies on the [HydroLang-Models repository](https://github.com/uihilab/HydroLang-Models).

Please refer to the [Contributing Guidelines](https://github.com/uihilab/HydroLang/blob/master/docs/CONTRIBUTING.md) for more details.

## Feedback
We value your feedback. Please report any issues or suggestions via our [GitHub Issues](https://github.com/uihilab/HydroLang/issues) page.

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/uihilab/HydroLang/blob/master/LICENSE) file for details.

## Acknowledgements
Developed by the **University of Iowa Hydroinformatics Lab (UIHI Lab)**:
https://hydroinformatics.uiowa.edu/

Supported by the **Consortium of Universities for the Advancement of Hydrological Science (CUAHSI)** through the Hydroinformatics Innovation Fellowship.

## References
*   Erazo Ramirez, C., Sermet, Y., Molkenthin, F., & Demir, I. (2022). HydroLang: An open-source web-based programming framework for hydrological sciences. *Environmental Modelling & Software*, 157, 105525. [doi:10.1016/j.envsoft.2022.105525](https://www.sciencedirect.com/science/article/pii/S1364815222002250)
