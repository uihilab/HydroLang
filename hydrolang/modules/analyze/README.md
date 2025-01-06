# Analyze Module

## Table of Contents

[**Link to documentation**](https://uihilab.github.io/HydroLang/)

* [Introduction](#Introduction)
* [Usage](#Usage)
* [Modules](#Modules)
  * [FloodDM](#FloodDM)
* [Test Cases](#Expansions%20and%20Test%20Cases)
* [Acknowledgements](#Acknowledgements)
* [References](#References)

## Introduction

The analyze module in HydroLang provides tools for analyzing hydrological data and scenarios. It consists of several components with functions for simulating hydrological processes, statistical analysis, machine learning, and flood damage estimation. Each component can be used individually or combined to create custom workflows.

## Usage

To use the analyze module, load the library and initialize required modules:

```html
<script type="module" src="./hydrolang/hydro.js"></script>
```
```javascript
var hydro = new Hydrolang();

const {hydro, stats, nn, floodDM} = hydrolang.analyze;
```

Access modules through the hydro instance:

```javascript
hydro.analyze.[component].[function]({ params: {}, args: {}, data: [] });
```
## Modules
### FloodDM

The FloodDM component enables modeling of various flood damage and mitigation scenarios. It provides methods to assess property losses, infrastructure damage, and potential mitigation measures.

Example Usage
```javascript
// Calculate property damage and mitigation cost/benefit for a property
const propertyDetails = await floodDM.buildPropertyDMScenario(
  params: {
    occupancy : "RES1", 
    structuralValue: 40000, 
    contentValue: 2000, 
    buildingArea: 2000
  }, 
  args: {
    floodDepth: 5, 
    mitigationMeasure : "Wet Floodproofing", 
    mitigationDepth: 5, 
    foundationType: "Crawlspace" 
  }
  data: {}
);
console.log(propertyDetails);

// Retrieve city flood damage for a specified depth
const cityDamage = await floodDM.getCityFloodDamage(
  { args: { depth: 30.5, city: "Cedar Rapids" } }
);
console.log(cityDamage);

// Get vehicle damage details based on flood depth
const vehicleDamage = await floodDM.getVehicleDamage(
  { args: { floodDepth: 5, vehicleType: 'Sedan', vehicleValue: 15000 } }
);
console.log(vehicleDamage);
```

### Documentation
For a complete list of available methods and detailed usage examples, please refer to the  [**HydroLang FloodDM Documentation**](https://uihilab.github.io/HydroLang/floodDM.html).

## Test Cases
HydroLang’s flexibility allows for various expansions:

* [**Cedar Falls flood damage estimation**](./../../../test-cases/Cedar%20Falls%20Damage%20Estimation.html): A damage estimation scenario for a 500-year or a 0.2% flood event in Cedar Falls to estimate property, vehicles, bridges and utilities damage.    
* [**Structural Elevation Cost Benefit Analysis**](./../../../test-cases/Structural%20Elevation%20Cost-Benefit%20Evaluation.html): An analysis of the cost and beneit of Structural Elevation as a mitigation measure in flood mitigation.    


## Acknowledgements
Developed by the University of Iowa Hydroinformatics Lab with support from CUAHSI.

## References
Erazo Ramirez, C., Sermet, Y., Molkenthin, F., & Demir, I. (2022). HydroLang: An open-source web-based programming framework for hydrological sciences. Environmental Modelling & Software, 157, 105525. (https://doi.org/10.1016/j.envsoft.2022.105525).

