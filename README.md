<p align="center">
    <img width="550" src = https://github.com/uihilab/HydroLang/blob/master/hydrolang/images/logo_v1.1.0.png>
 </p>

## Table of Contents

[**Link to documentation**](https://uihilab.github.io/HydroLang/)

* [Introduction](https://github.com/uihilab/HydroLang#Introduction)
* [How to Use](https://github.com/uihilab/HydroLang#How-to-Use)
* [Expansions and Test Cases](https://github.com/uihilab/HydroLang#Expansions-and-Test-Cases)
* [Community](https://github.com/uihilab/HydroLang#Community)
* [Feedback](https://github.com/uihilab/HydroLang#Feedback)
* [Scalability and To Do's](https://github.com/uihilab/HydroLang#Scalability-and-To-Dos)
* [License](https://github.com/uihilab/HydroLang#License)
* [Acknowledgements](https://github.com/uihilab/HydroLang#Acknowledgements)
* [References](#references)

## Introduction
This project introduces HydroLang, a web-based framework for environmental and hydrological analyses. It contains 4 different modules, each with a specific purpose that can be used either in combination with other modules or separately. The modules are:
* **Data**: used for data retrieval, manipulation, download and upload.
* **Analyze**: contains three different components, each aiming towards a similar purpose:
    - *hydro*: functions for precipitation analysis and rainfall-runoff lumped models.
    - *stats*: functions for statistical characterization of data.
    - *NN*: functions for the creation of feed forward neural network models using [TensorFlow.js](https://www.tensorflow.org/js).
* **Visualization**: used for rendering different types of charts and tables on screen using [Google Charts](https://developers.google.com/chart).
* **Maps**: used for rendering of maps with option of adding/removing/downloading layers of different formats (geoJSON, KML) using two options on map engines [Google Maps](https://developers.google.com/maps/documentation) and [Leaflet](https://leafletjs.com/).

The current modular structure serves as a starting point for basic hydrologic and environmental analyses, with further development bringing along new functions and modules that work using the same ontological design.

## How to Use
Please download the library and run `index.html`. If a new html file should be created, the library must be onloaded onto the file as a script

```html
<script
 type = "module"
 src= "./hydrolang/hydro.js"
></script>
```

Once the library is loaded, a new intance of HydroLang is added to the body of the file as:
```javascript
var hydro1 = new Hydrolang();
```
Each of the modules is accessed through chainage using the `hydro` class instance. Functions on the third level chainage have been declared as static methods and thus, will not appear as quick access on the browser. Parameter destructuring has been added to most driving function within the framework to create an easier way to declare workflows. The destructuring is driven mainly in the following scope:

```javascript
hydro[module][function]({params:{}, args:{}, data: []})
```
`params:{}` represents an object with initial drivers for a specific function, `args:{}` is an object with additional parameters required for the function, and `data` is any data representation, usually an `n-D` array, for the function to run. For instance, in the data retrieval function:
```javascript
hydro.data.retrieve({params:{source: someSource, dataType: someType}, args:{specificArg: someArg}})
``` 
The function definition found in the documentation states which parameters are required.

Summary examples for each module:
* Function call for data module
```javascript 
var example: hydro1.data.function({params: {}, args:{}, data: []}) 
```
* Function call for any component on the analyze module
```javascript 
var example: hydro1.analyze.component.function({params: {}, args:{}, data: []}) 
```
* Function call for visualization module
```javascript 
var example: hydro1.visualize.function({params: {}, args:{}, data: []}) 
```
* Function call for maps module
```javascript 
var example: hydro1.map.function({params: {}, args:{}, data: []}) 
```

## Expansions and Test Cases

### Core library usage
The usage of the library through its core structure can be found within the following files or within each module folder:
* `test-analysis.html`
* `test-data.html`
* `test-maps.html`
* `test-visualization.html`

### Expansions
The current expansions of the framework are the following:
* [BMI specification](https://github.com/uihilab/HydroLang/tree/master/hydrolang/bmi-implementation): CSDMS basic modeling interface through steering files.
* [HL-ML](https://github.com/uihilab/HydroLang-ML): HTML driven web components for hydrology and environmental sciences.

## Community
It is possible for the library to expand by becoming a community-based framework with collaborations from research institutes or knowledgeable individuals thanks to the flexibility of employing a modular architecture, open-source libraries, and not requiring installation. Interested parties can adapt and expand HydroLang to fit their unique use cases, development environments, project requirements, and data resources. Everyone is encouraged to contribute to the growth of HydroLang by:
* filing an issue to request certain features, functionality, and data,
* implementing the desired capability on a fork, and submitting a pull request.
Please visit the [contributing](https://github.com/uihilab/HydroLang/blob/master/docs/CONTRIBUTING.md) guidelines for more details. 

Furthermore, for community building, we encourage users of HydroLang to share their models, codes, and case studies on [HydroLang-Models repository](https://github.com/uihilab/HydroLang-Models).

## Feedback
Please feel free to send feedback to us on any issues found by filing an [issue](https://github.com/uihilab/HydroLang/blob/master/.github/ISSUE_TEMPLATE/feature_request.md).

## Scalability and To-Do's
The framework is not limited to the functions and modules implemented, but rather provides a boilerplate for new features to be added. Nonetheless, the following should be considered:

* The hydro component contains only lumped models.
* The map module is fully available only on Leaflet engine.

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/uihilab/HydroLang/blob/master/LICENSE) file for details.

## Acknowledgements
This project is developed by the University of Iowa Hydroinformatics Lab (UIHI Lab):

https://hydroinformatics.uiowa.edu/.

And with the support of the Cosortium of Universities for the Advancement of Hydrological Science [CUAHSI](https://www.cuahsi.org/) through the [Hydroinformatics Innovation Fellowship](https://www.cuahsi.org/grant-opportunities/hydroinformatics-innovation-fellowship).

## References

* Erazo Ramirez, C., Sermet, Y., Molkenthin, F., & Demir, I. (2022). HydroLang: An open-source web-based programming framework for hydrological sciences. Environmental Modelling & Software, 157, 105525. [doi:10.1016/j.envsoft.2022.105525](https://www.sciencedirect.com/science/article/pii/S1364815222002250)
