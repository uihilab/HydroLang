#  Data Sources Description

### [Mitigation_dt](https://hydroinformatics.uiowa.edu/lab/midas/)

Data sources for flood damage and mitigation cost and benefit analysis for properties in Iowa.

- Community Flood Damage: Contains depth-damage functions for Waterloo, Cedar Rapids, and Cedar Falls, including data for various flood depths and loss values according to FEMA and USACE guidelines including structural and content damage, and inundated property counts in JSON format. 

```javscript
let params = {
    source : "mitigation_dt",
    datatype : "community_flood_damage"
}
let args = {sourceType : "Waterloo"} // Add supported community names

city_damage = await hydrolang.data.retrieve({params, args})
```

 - Community Flood Inundation: GeoJSON data representing properties as 'Point' features with attributes like inundation depths, property type, occupancy, and value for specific cities. 

```javascript
let params = {
    source : "mitigation_dt",
    datatype : "community_flood_inundation"
}
let args = {sourceType : "Waterloo"} // Add supported community names

city_damage = await hydrolang.data.retrieve({params, args})
```

 - Property Mitigation Cost: JSON data of various flood mitigation measures including costs, benefits, and effectiveness at different inundation levels. 

 ```javascript
 let params = {
    source : "mitigation_dt",
    datatype : "property_mitigation_cost"
}
let args: { sourceType: 'property_mitigation_cost' }

let measures = await hydrolang.data.retrieve({params, args})
```


### [Flooddamage_dt](https://hydroinformatics.uiowa.edu/lab/fidas/)

Geopsatial and damage data for infrastructure in Iowa communities.