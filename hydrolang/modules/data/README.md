# HydroLang Data Sources
The use of the data sources built into HydroLang is intended to give the user a more comprehensive understanding of the data that is available and may be retrieved for a given purpose. To that end, the framework's many data sources differ in terms of two distinct API protocols: [SOAP](https://www.ibm.com/docs/en/sc-and-ds/8.1.0?topic=stack-simple-object-access-protocol) and [REST](https://www.ibm.com/docs/en/dsm?topic=configuration-universal-cloud-rest-api-protocol)

The development of the module contains wrappers around SOAP requests to avoid the time-consuming effort of modifying requests in particular formats. This creates a single method of accessing the data sources without significantly altering the request structures.

The following structure is needed by the user before they may request data from any of the data sources: 

```javascript
var req = hydro.data.retrieve(
    {
        params: {param1: "someParam", param2: "someParam"},
        args: {arg1: "someArg", arg2: "someArg"}
    }
)
```

From that point on, based on the restrictions specified by each of the sources, each parameter or argument needed for the retrieval must be explicitly declared. Additionally, if a user has requests done through a local service, a proxy server might be required. For this, the user can pass into the `proxyServer` parameter a naming specified in the following list:
* local-proxy (available through a node.js environment, if available by the user).
* cors-anywhere
* all-origins

## Accessing REST APIs
All data sources included in HydroLang can be considered as REST. Specifically, the following are completely RESTful:
* [AEMET](https://opendata.aemet.es/centrodedescargas/inicio): Spanish meteorological service
* [EAUK](https://www.api.gov.uk/ea/#environment-agency): United Kingdom's Environmental Agency
* [FEMA](https://www.fema.gov/about/openfema/api): Federal Emergency Management Agency
* [EPA](https://www.epa.gov/enviro/web-services): US Environmental Protection Agency
* [MeteoIT](https://www.meteonetwork.it/): Italian meteorological stations.
* [IFIS](https://ifis.iowafloodcenter.org/ifis/ws/): Iowa Flood Information System
* [MeteoStat](https://meteostat.net/en/): Open source weather record keeper.
* [NOAA](https://www.ncdc.noaa.gov/cdo-web/webservices/v2): National Centers for Environmental Information
* [USGS](https://www.usgs.gov/products/web-tools/apis): United States Geological Survey
* [WorldBank](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation): World Bank worldwide data sources
* [HydroShare](https://help.hydroshare.org/introduction-to-hydroshare/getting-started/use-the-api/): Connection of HydroShare data services through HydroLang.

Each API has distinct instructions on how to submit a request; to customize your requests specifically, please review the documentation of the API you are interested in.

## Accessing SOAP APIs
The data sources that contain SOAP request ca be found in the `cuahsi.js` file and are the following:
* [WaterOneFlow](https://his.cuahsi.org/wofws.html): Allows for interaction and retrieval between all data sources included in HydroShare through specific methods included within.
* [hisCentral](https://hiscentral.cuahsi.org/): Allows for obtaining data sources, available variables, and other specificities of HydroShare data sources.

The wrapper to access SOAP requests A wrapper using a function found within called `soapEnv.js` file, which onloads an evelope for SOAP1.0 requests. Examples for requests are the following:

```javascript
//Retrieving all sites, available data types, and variables within a bounding box
params: {
    source: "waterOneFlow",
    datatype: "GetSitesByBoxObject", //Change the method to the type you require 
    proxyServer: "local-proxy" //or it can be any of the available proxies or user-tailored
    },
args: {
    sourceType: "MOPEX",
    west: "-104.59",
    south: "27.10",
    east: "-82.10",
    north: "44.57"
    }
```

```javascript
//Retrieve data for a specific site within the MOPEX data sources.
params: {
    source: "waterOneFlow",
    datatype: "GetValuesObject", //Change the method to the type you require 
    proxyServer: "local-proxy" //or it can be any of the available proxies or user-tailored
    },
args: {
    sourceType: "MOPEX",
    location: "05440000",
    variable: "MAP", //mean areal precipitation variable type
    startDate: "2003-01-01",
    endDate: "2003-11-30"
    }
```

The result of the request will be automatically converted into a JS Object that can be further manipulated through HydroLang's transformation function.