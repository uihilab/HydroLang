[![Basic Model Interface](https://img.shields.io/badge/CSDMS-Basic%20Model%20Interface-green.svg)](https://bmi.readthedocs.io/)

## Introduction
This work pesents the usage of HydroLang through the standards set by the Community Surface Dynamics Modeling System CSDMS's [Basic Modeling Inteface](https://csdms.colorado.edu/wiki/BMI) (BMI). The variable definition was taken from UIHI's lab [BMI.js](https://github.com/uihilab/BMI-JS) implementation.

## How to Use
As with any other instance of the HydroLang framework, the scripts must be onloaded into an HTML file and served through a local and proxy servers. Specifically for HydrolangBMI, the files required are:

```html
<script
 type = "module"
 src= "./hydrolang/hydroBMIInstance.js"
></script>
```
The HydroLang Instance class needs to instantiate the BMI class using:

```javascript
class hydroBMIInstance extends HydroLangBMI {
//your implementation here
}
```
The inherit object contains all the variable definitions from the BMI standard, as well as specifics methods for using the HydroLang framework. Any other methods required for running a specific model type need to be added into the class instance. An example on the implementation of HydroLangBMI can be found in the [case study](https://github.com/uihilab/HydroLang/tree/master/hydrolang/bmi-implementation/case-study) folder. Once defined and onloaded to the HTML page, the class element is instantiated through a variable, passing into the class a steering file (JSON format) that contains all the definitions required for the model. With this, both the HydroLangBMI and the framework itself are available for usage.

```javascript
var hydro = new hydroBMIInstance('link/to/config.js');
```
The definition of the configuration file must be tailored by the user, falling within the scope of the model. Multiple funcitons can be specified into the configuration file, which follow a generalizable structure:

```javascript
{
modelName: "some_model_name",
modelCode: "some_model_code",
moduleName: "HydroLang_module",
functionname: "module_function",
args:{
//arguments required by the function(s)
}
params:{
//parameters required by the function(s)
}
}
```
As a way of optimizing the time required for the generation of configuration files, the user can onload the `bmiConfig.js`, which accepts as parameter a JS Object with the configuration required, downloaded to the user's local storage.

```html
<script
 type = "module"
 src= "./hydrolang/bmiConfig.js"
></script>
```
## Feedback
Please feel free to send feedback to us on any issues found by filing an issue.

## Scalability and To-Do's
New updates into the HydroLang will be reflected in any subprojects which use the framework.

## Acknowledgements
This project is developed by the University of Iowa Hydroinformatics Lab (UIHI Lab):

https://hydroinformatics.uiowa.edu/.

And with the support of the Cosortium of Universities for the Advancement of Hydrological Science [CUAHSI](https://www.cuahsi.org/) through the [Hydroinformatics Innovation Fellowship](https://www.cuahsi.org/grant-opportunities/hydroinformatics-innovation-fellowship).

## References
Ewing G., Erazo Ramirez C., Vaidya W., & Demir I. 2022. Client-side Web-based Model Coupling using Basic Model Interface for Hydrology and Water Resources. EarthArxiv, 4547. https://doi.org/10.31223/X5XP93
