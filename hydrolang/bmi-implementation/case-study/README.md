[![Basic Model Interface](https://img.shields.io/badge/CSDMS-Basic%20Model%20Interface-green.svg)](https://bmi.readthedocs.io/)

## Introduction
This case study represents the data model used for the implementation of hydrological modelling on
clientside technologies thrhough the usage of the BMI standard. There are two data models which are fed into the [HLM web](https://github.com/uihilab/HLM-Web) model,
outputting the hydrological response on the same event in the Clear Watershed in Eatern Iowa. The models are: [NLDAS](https://qed.epa.gov/hms/workflow/precip_data_extraction/) rainfall product from EPA from the [Hydrologic Micro Services](https://qed.epa.gov/hms/),
and preprocessed [stage IV](https://data.eol.ucar.edu/dataset/21.093) data used for the Iowa Flood Center [flooding models](https://www.sciencedirect.com/science/article/pii/S0022169420301463).

## Usage
Open the file `./index.html` on this directory.
### Stage IV data
Run
```javascript
var hlbm = new HLclearCreek('./configFiles/stageiv_clearcreek.json');
```
This will create an instance of the data model and automatically download the rainfall data for each link on the catchment, saving it on a JSON object. 
Run the following to obtain each link:
```javascript
hlbm.getLinks();
```
Run the spread results method to have links with data object
```javascript
hlbm.spreadResults();
```
The model needs to be updated once before running. After updating one timestep, the rainfall for each link at the specified timesteps in the configuration object will be saved in an array.
```javascript
hlbm.update();
var end = hlbm._endTime + hlbm._defaultStep,
container = [];
while (hlbm.get_current_time() < end) {
container.push(hlbm.get_value_at_indices('specified__name',[], hlbm.links))
hlbm.update()
}
```
The values are digested in the hydrological model according through each time step.
### NLDAS data
The configuration object is passed once again into the class instance.
```javascript
var hlbm = new HLclearCreek('./configFiles/nldas_clearcreek.json');
```
For the NLDAS data, a helper function is required to call each links found in the data folder. 
```javascript
hlb.additionalData();
```
To download data, gridded location-based approach was used to obtain the correct data, with 7 HTTPS requests in total run sequentially using
```javascript
hlbm.retrieveEpaData()
```
This call will download the data and append it into an array, usually taking up to 1 to 2 minutes. Afterwards, a similar process is done.
```javascript
hlbm.spreadResults();
hlbm.update();
var end = hlbm._endTime + hlbm._defaultStep,
container = [];
while (hlbm.get_current_time() < end) {
container.push(hlbm.get_value_at_indices('specified__name',[], hlbm.links))
hlbm.update()
}
```
### USGS Gauging Station
The comparison of the hydrological model is done using [USGS gauge 05454300](https://waterdata.usgs.gov/ia/nwis/uv/?site_no=05454300), with the data for the response downloaded using helper methods that leverage HydroLang's data services.
```javascript
hlbm.retrieveGauge();
```
Once again, the gauge data needs to be spread
```javascript
hlbm.spreadGauge();
```

## Data Visualization
To visualize the result data along with the gauging station, run
```javascript
hlbm.visualizer("chart_type", data)
```
Where chart_type is either "line" or "column", and data is a JS array containing `[date_range, simulation_results, observed_results]`