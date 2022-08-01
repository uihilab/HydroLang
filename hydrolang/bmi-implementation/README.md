## Introduction
This work pesents the usage of HydroLang through the standards set by the Community Surface Dynamics Modeling System CSDMS's Basic Modeling Inteface (BMI). All the 

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
`params:{}` represents an object with initial drivers for a specific function, `args:{}` is an object with additional parameters required for the function, and `data` is any data representation, usually an `n-D` array, for the function to run. For instance, in the data retrieval funtion:
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


## Test Examples
Examples on how to use the library can be found within the following files or within each module folder:
* `test-analysis.html`
* `test-data.html`
* `test-maps.html`
* `test-visualization.html`

For argument examples for a specific function, please refer to the library's [documentation page](https://hydro-lang.herokuapp.com/index.html).

## Community
The flexibility of using a modular architecture, open-source libraries, and not requiring installation provides a unique opportunity for scalability and upgrades, thus, creating the potential for the library to grow by becoming a community-based framework with collaborations from research institutions or individuals with expertise. HydroLang can be customized and extended by interested parties to suit for specific use cases, development environments, project requirements, and data resources. We encourage everyone to help extend HydroLang by either:
* filing an issue to request certain features, functionality, and data,
* implementing the desired capability on a fork, and submitting a pull request.

Furthermore, for community building, we encourage users of HydroLang to share their models, codes, and case studies on [HydroLang-Models repository](https://github.com/uihilab/HydroLang-Models).

## Feedback
Please feel free to send feedback to us on any issues found by filing an issue.

## Scalability and To-Do's
The framework is not limited to the functions and modules implemented, but rather provides a boilerplate for new features to be added. Nonetheless, the following should be considered:

* The hydro component contains only lumped models.
* The map module is fully available only on Leaflet engine.

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/uihilab/HydroLang/blob/master/LICENSE) file for details.

## Acknowledgements
This project is developed by the University of Iowa Hydroinformatics Lab (UIHI Lab):
https://hydroinformatics.uiowa.edu/.
And through the Hydroinformatics Fellowship Award from the Cosortium of 

## References

* Ramirez, C.E., Sermet, Y., Molkenthin, F. and Demir, I., 2021. HydroLang: An Open-Source Web-Based Programming Framework for Hydrological Sciences. https://doi.org/10.31223/X5M31D
