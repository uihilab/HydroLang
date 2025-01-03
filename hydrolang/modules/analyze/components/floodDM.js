import proxies from "./../../data/datasources/proxy.js";
import { retrieve } from "./../../data/data.js";
import { createDiv } from "../../visualize/divisors.js";
import {
  Layers,
  renderMap,
  recenter,
  addCustomLegend,
} from "./../../map/map.js";

/**
 * This class contains methods which can be used to model various flood damage and mitigation scenarios for hydrological analyses.
 * @class
 * @name floodDM
 */
export default class floodDM {
  city = "";
  depth = 0;
  mapRendered = false;
  selectedfeature = null;

  // Static variable to cache fetched data to improve page performance
  static damageDataCache = {};
  static mitigationDataCache = null;

  /**
   * Initialize the damage scenario for a particular city, 100 or 500 year flood scenario and render based on google or leaflet
   * @method initDamageScenario
   * @memberof floodDM
   * @instance
   * @async
   * @param {Object} params - Parameters to define map data to initialize
   * @param {String} params.maptype - Type of map to initialize as a String, currently supported values are google or leaflet
   * @param {String} params.key - Required if maptype is google, pass in the API key for google maps
   * @param {Object} args - Arguments to initialize flood damage scenario being intialized
   * @param {String} args.city - City name as a String, currently supported cities include Bettendorf, Cedar Falls, Cedar Rapids, Davenport, Iowa City, Waterloo and Waverly
   * @param {number} args.depth - Number value indicating flood depth
   * @returns {Promise<Object>} A Promise that resolves with an object containing the scenario results, and damage values for the scenario
   * @example
   * scenario = new floodDM()
   * scenario.initDamageScenario({params:{maptype:'leaflet'},args:{city:"Cedar Falls", depth:18, scenario:'500-year'}})
   */
  async initDamageScenario({ params, args, data } = {}) {
    // Destructure the arguments passed to the function
    let { city, depth, scenario } = args;
    this.city = city;
    this.depth = depth;
    this.minimizedDivs = [];

    // Set default map type as leaflet
    if (params === undefined) {
      this.maptype = "leaflet";
      params = {};
    } else if (params.maptype === undefined) {
      this.maptype = "leaflet";
    } else {
      this.maptype = params.maptype;
    }

    // Check if key is present if google map is rendered
    if (this.maptype === "google") {
      if (params.key === undefined) {
        console.log("param.key value is required to render a google map");
        return;
      }
    }

    // Normalize the scenario argument to a specific format
    if (scenario === "100-year") scenario = "x100_year";
    else if (scenario === "500-year") scenario = "x500_year";
    else {
      console.log(
        "Pass 100-year or 500-year flood scenario in the args.scenario"
      );
      return;
    }

    // Set class member as 100 or 500 year scenario
    this.scenario = scenario;

    // Retrieve the flood layer based on the selected scenario
    let flood_layer = await retrieve({
      params: {
        source: "flooddamage_dt",
        datatype: scenario,
      },
      args: { sourceType: this.city },
    });
    // Convert data from the format 'varname={\n"key1": "val1", ....' to a javascript object
    flood_layer =JSON.parse(flood_layer.slice(flood_layer.indexOf('=') + 1));


    // Retrieve the utilities layer based on the selected scenario
    let utilities_layer;
    // Utilities Layer data source is avilable for Cedar Falls only
    if (this.city === "Cedar Falls") {
      utilities_layer = await retrieve({
        params: {
          source: "flooddamage_dt",
          datatype: "utilities",
        },
        args: { sourceType: this.city },
      });
      // Convert data from the format 'varname={\n"key1": "val1", ....' to a javascript object
      utilities_layer =JSON.parse(utilities_layer.slice(utilities_layer.indexOf('=') + 1).replace(/,\s?(\w*)\s?:/g, ',"$1":'));
    }

    // Retrieve the vehicles layer based on the selected scenario
    let vehicles_layer = await retrieve({
      params: {
        source: "flooddamage_dt",
        datatype: "vehicles",
      },
      args: { sourceType: this.city },
    });
    // Convert data from the format 'varname={\n"key1": "val1", ....' to a javascript object
    vehicles_layer =JSON.parse(vehicles_layer.slice(vehicles_layer.indexOf('=') + 1));

    // Retrieve the buildings layer based on the selected scenario
    let buildings_layer = await retrieve({
      params: {
        source: "flooddamage_dt",
        datatype: "buildings",
      },
      args: { sourceType: this.city },
    });
    // Convert data from the format 'varname={\n"key1": "val1", ....' to a javascript object
    buildings_layer =JSON.parse(buildings_layer.slice(buildings_layer.indexOf('=') + 1));

    // Retrieve the bridge layer based on the selected scenario
    let bridges_layer;
    // Bridge Layer data source only exists for Cedar Falls, Cedar Rapids, Davenport, Waverly
    if (
      this.city === "Cedar Falls" ||
      this.city === "Cedar Rapids" ||
      this.city === "Davenport" ||
      this.city === "Waverly"
    )
      bridges_layer = await retrieve({
        params: {
          source: "flooddamage_dt",
          datatype: "bridges",
        },
        args: { sourceType: this.city },
      });
      // Convert data from the format 'varname={\n"key1": "val1", ....' to a javascript object
      bridges_layer =JSON.parse(bridges_layer.slice(bridges_layer.indexOf('=') + 1));

    // Calculate the centroid of the buildings layer so render map center
    let centroid = floodDM.featureCollectionCentroid(buildings_layer);

    // Render the map if it hasn't been rendered before
    if (!this.mapRendered) {
      await renderMap({
        params: { maptype: this.maptype, lat: centroid[1], lon: centroid[0] },
        args: { key: params.key },
      });
      this.mapRendered = true;
    }

    // Add CSS Style classes for use in overlay divs and map legends
    floodDM.addFontStyle();

    // Variable to store and render scenario rendering results
    let scenario_results = {
      Buildings: {
        Structure: 0,
        Content: 0,
        Income: 0,
        Wage: 0,
        "Relocation Expenses": 0,
        "Rental Income": 0,
        "Loss of Life (Day)": 0,
        "Loss of Life (Night)": 0,
        Debris: 0,
      },
      Vehicles: {
        Day: 0,
        Night: 0,
      },
      Bridges: {
        Damage: 0,
      },
      Utilities: {
        Damage: 0,
      },
    };

    /*
     *
     * Begin Rendering Vehicles Layer
     *
     */

    // Variable to store vehicle layer calculations
    let vehicleFeatureCalculations = {};

    // Retrieve the vehicle damage function data from damage datasource
    let vehicleDamFun = await floodDM.getVehicleDamageFunction();

    // Render the vehicle damage layer
    await Layers({
      args: {
        type: "geojson",
        name: "Vehicles Layer",

        // Set feature style using feature properties
        styleFunction: (feature) => {
          // Destructure properties according to features based on maptype
          let properties;
          if (this.maptype === "google") {
            properties = {};
            feature.forEachProperty(function (value, property) {
              properties[property] = value;
            });
          } else if (this.maptype === "leaflet") {
            properties = feature.properties;
          }

          // Calculate vehicle damage based on flood depth and area
          let depth100yr = properties.flood100_avg;
          let depth500yr = properties.flood500_avg;
          let areaPrc100yr = properties.area_fe_100yr;
          let areaPrc500yr = properties.area_fe_500yr;
          let car = "PassengerCar";
          let light = "LightTruck";
          let heavy = "HeavyTruck";

          let inundationDepth,
            areaPrc,
            vehDamPrcntCar,
            vehDamPrcntLight,
            vehDamPrcntHeavy;

          // Get flood depth and inundation area for the scenario
          if (this.scenario === "x100_year") {
            inundationDepth = depth100yr;
            areaPrc = areaPrc100yr;
          } else if (this.scenario === "x500_year") {
            inundationDepth = depth500yr;
            areaPrc = areaPrc500yr;
          }

          // Get Vehicle damage percentage using the depth-damage function and inundation depth
          for (let i in vehicleDamFun[car]) {
            if (vehicleDamFun[car][i]["floodDepth"] == inundationDepth) {
              vehDamPrcntCar = vehicleDamFun[car][i]["damage"];
            }
          }
          for (let i in vehicleDamFun[light]) {
            if (vehicleDamFun[light][i]["floodDepth"] == inundationDepth) {
              vehDamPrcntLight = vehicleDamFun[light][i]["damage"];
            }
          }
          for (let i in vehicleDamFun[heavy]) {
            if (vehicleDamFun[heavy][i]["floodDepth"] == inundationDepth) {
              vehDamPrcntHeavy = vehicleDamFun[heavy][i]["damage"];
            }
          }

          // Calculate vehicle damage by vehicle type at day and night using area, damage percent and count
          let carDamageD = parseInt(
            (vehDamPrcntCar / 100) * areaPrc * properties.car_val_day
          ).toLocaleString();
          let lightDamageD = parseInt(
            (vehDamPrcntLight / 100) * areaPrc * properties.light_val_day
          ).toLocaleString();
          let heavyDamageD = parseInt(
            (vehDamPrcntHeavy / 100) * areaPrc * properties.heavy_val_day
          ).toLocaleString();
          let carDamageN = parseInt(
            (vehDamPrcntCar / 100) * areaPrc * properties.car_val_night
          ).toLocaleString();
          let lightDamageN = parseInt(
            (vehDamPrcntLight / 100) * areaPrc * properties.light_val_night
          ).toLocaleString();
          let heavyDamageN = parseInt(
            (vehDamPrcntHeavy / 100) * areaPrc * properties.heavy_val_night
          ).toLocaleString();
          let carDamageDC =
            (vehDamPrcntCar / 100) * areaPrc * properties.car_val_day;
          let lightDamageDC =
            (vehDamPrcntLight / 100) * areaPrc * properties.light_val_day;
          let heavyDamageDC =
            (vehDamPrcntHeavy / 100) * areaPrc * properties.heavy_val_day;
          let carDamageNC =
            (vehDamPrcntCar / 100) * areaPrc * properties.car_val_night;
          let lightDamageNC =
            (vehDamPrcntLight / 100) * areaPrc * properties.light_val_night;
          let heavyDamageNC =
            (vehDamPrcntHeavy / 100) * areaPrc * properties.heavy_val_night;
          let totalDamageD = carDamageDC + lightDamageDC + heavyDamageDC;
          let totalDamageN = carDamageNC + lightDamageNC + heavyDamageNC;

          // Update scenario variable
          if (!isNaN(totalDamageD))
            scenario_results["Vehicles"]["Day"] += totalDamageD;
          if (!isNaN(totalDamageN))
            scenario_results["Vehicles"]["Night"] += totalDamageN;

          // Update vehicle damage calculations for each feature
          vehicleFeatureCalculations[properties.CensusBloc] = {
            "Block Information": properties.CensusBloc,
            "Flood Scenario:": this.scenario,
            "Avg. Flood Depth:": inundationDepth,
            "Car Count (Day):": properties.cars_day,
            "Car Count (Night):": properties.cars_night,
            "Light Truck Count (Day)": properties.light_day,
            "Light Truck Count (Night)": properties.light_night,
            "Heavy Truck Count (Day)": properties.heavy_day,
            "Heavy Truck Count (Night)": properties.heavy_night,
            "Cars Damage (Day)": carDamageD,
            "Cars Damage (Night)": carDamageN,
            "Light Trucks (Day)": lightDamageD,
            "Light Trucks (Night)": lightDamageN,
            "Heavy Trucks (Day)": heavyDamageD,
            "Heavy Truck (Night)": heavyDamageN,
          };

          // return style values for the feature
          return {
            fillColor:
              totalDamageD > 1000000
                ? "#323232"
                : totalDamageD > 100000
                ? "#7E7E7E"
                : "#BFBFBF",
            weight: 2,
            opacity: 1,
            color: "black",
            dashArray: "3",
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: "black",
          };
        },

        // Set popup values based on feature properties
        popUpFunction: (feature) => {
          // Destructure properties according to features based on maptype
          let properties;
          if (this.maptype === "google") {
            properties = {};
            feature.forEachProperty(function (value, property) {
              properties[property] = value;
            });
          } else if (this.maptype === "leaflet") {
            properties = feature.properties;
          }

          let formattedAttributes = {};

          for (let prop in vehicleFeatureCalculations[properties.CensusBloc]) {
            if (
              prop == "Block Information" ||
              prop == "Flood Scenario:" ||
              prop == "Avg. Flood Depth:"
            )
              formattedAttributes[prop] =
                vehicleFeatureCalculations[properties.CensusBloc][prop];
            else if (
              prop == "Cars Damage (Day)" ||
              prop == "Cars Damage (Night)" ||
              prop == "Light Trucks (Day)" ||
              prop == "Light Trucks (Night)" ||
              prop == "Heavy Trucks (Day)" ||
              prop == "Heavy Truck (Night)"
            ) {
              formattedAttributes[prop] = floodDM.formatNumber(
                vehicleFeatureCalculations[properties.CensusBloc][prop],
                true
              );
            } else {
              formattedAttributes[prop] = floodDM.formatNumber(
                vehicleFeatureCalculations[properties.CensusBloc][prop],
                false
              );
            }
          }

          // Format and return popup values
          return this.popUpFormatter(
            "Vehicle Census Block",
            formattedAttributes
          );
        },
      },
      data: vehicles_layer,
    });

    /*
     *
     * Begin Rendering Flood Inundation Layer
     *
     */

    // Render flood inundation layer
    await Layers({
      args: {
        type: "geojson",
        name: "Flood Inundation Layer",

        // Set style based on feature properties
        styleFunction: (feature) => {
          // Return style options for this feature
          return {
            color: "blue",
            weight: 1,
            opacity: 1,
            fillColor: "blue",
            fillOpacity: 0.5,
            strokeWeight: 0.5,
            strokeColor: "dark blue",
          };
        },
      },
      data: flood_layer,
    });

    /*
     *
     * Begin Rendering Buildings Layer
     *
     */

    // Variable to store building layer calculations
    let buildingFeatureCalculations = [];

    // Get building, life and debris weight functions
    let buildingDamage = await floodDM.getPropertyDamageFunction();
    let lifeLoss = await floodDM.getLifeLossFunction();
    let debrisLoss = await floodDM.getDebrisWeightFunction();

    // Render Building Layer Calculations
    await Layers({
      args: {
        type: "geojson",
        name: "Properties Layer",

        // Set style based on feature properties
        styleFunction: (feature) => {
          // Destructure properties according to features based on maptype
          let properties;
          if (this.maptype === "google") {
            properties = {};
            feature.forEachProperty(function (value, property) {
              properties[property] = value;
            });
          } else if (this.maptype === "leaflet") {
            properties = feature.properties;
          }

          // Get property inundation based on scenario
          let occupancy = properties.occupancy;
          let inundationDepth =
            scenario === "x100_year"
              ? properties.depth100
              : properties.depth500;

          // Depth damage function for specific flood depth
          let propertyInputs = buildingDamage[occupancy].find(
            (item) => item.floodDepth === inundationDepth
          );

          // Get GeoJSON properties
          let structureDamPercent = propertyInputs["structure"];
          let contentDamPercent = propertyInputs["content"];
          let incomeRecaptureFactor = propertyInputs["recapturFactor"];
          let incomePerDay = propertyInputs["incomePerSqftPerDay"];
          let lossFunction = propertyInputs["maxTime"];
          let wageRecaptureFactor = propertyInputs["recapturFactor"];
          let wagePerDay = propertyInputs["wagePerSqftPerDay"];
          let percentOwnerOccupied = propertyInputs["percentOwnerOccupied"];
          let rentalCostPerSqftPerDay =
            propertyInputs["rentalCostPerSqftPerDay"];
          let disruptionCostPerSqft = propertyInputs["disruptionCostPerSqft"];

          // Calculate relocation cost and rental income per sqfoot
          let relocation, rentalIncome;
          if (propertyInputs["structure"] > 10) {
            relocation = [
              (1 - percentOwnerOccupied / 100) * disruptionCostPerSqft +
                (percentOwnerOccupied / 100) *
                  (disruptionCostPerSqft +
                    rentalCostPerSqftPerDay * lossFunction * 30),
            ];
            rentalIncome =
              (1 - percentOwnerOccupied / 100) *
              rentalCostPerSqftPerDay *
              lossFunction *
              30;
          } else {
            relocation = 0;
            rentalIncome = 0;
          }

          // Calculate structural, content, income and wage, relocation, rental income and total loss
          let strDamage = (properties.val_struct * structureDamPercent) / 100;
          let contDamage = (properties.val_cont * contentDamPercent) / 100;
          let incomeLoss =
            (1 - incomeRecaptureFactor) *
            properties.sqfoot *
            incomePerDay *
            lossFunction *
            30;
          let wageLoss =
            (1 - wageRecaptureFactor) *
            properties.sqfoot *
            wagePerDay *
            lossFunction *
            30;
          let relocationExpenses = properties.sqfoot * relocation;
          let rentalIncomeLoss = properties.sqfoot * rentalIncome;

          let totalDamageBuild =
            strDamage +
            contDamage +
            incomeLoss +
            wageLoss +
            relocationExpenses +
            rentalIncomeLoss;

          // Update scenario variable with building damage
          if (!isNaN(strDamage))
            scenario_results.Buildings.Structure += strDamage;
          if (!isNaN(contDamage))
            scenario_results.Buildings.Content += contDamage;
          if (!isNaN(incomeLoss))
            scenario_results.Buildings.Income += incomeLoss;
          if (!isNaN(wageLoss)) scenario_results.Buildings.Wage += wageLoss;
          if (!isNaN(relocationExpenses))
            scenario_results.Buildings["Relocation Expenses"] +=
              relocationExpenses;
          if (!isNaN(rentalIncomeLoss))
            scenario_results.Buildings["Rental Income"] += rentalIncomeLoss;

          // Calculate metrics for life damage
          // Filter life function data using inputs
          let lifeInputsOver65 = lifeLoss[occupancy].find((item) => {
            return (
              item.floodDepth === inundationDepth && item.age === "over 65"
            );
          });
          let lifeInputsUnder65 = lifeLoss[occupancy].find((item) => {
            return (
              item.floodDepth === inundationDepth && item.age === "under 65"
            );
          });

          let lifeLossDay =
            lifeInputsOver65["zone"] * properties.POP_O65DAY +
            lifeInputsUnder65["zone"] * properties.POP_U65DAY;
          let lifeLossNight =
            lifeInputsOver65["zone"] * properties.POP_O65NGT +
            lifeInputsUnder65["zone"] * properties.POP_U65NGT;

          // Update scenario variable with life damage
          if (!isNaN(lifeLossDay))
            scenario_results.Buildings["Loss of Life (Day)"] += lifeLossDay;
          if (!isNaN(lifeLossNight))
            scenario_results.Buildings["Loss of Life (Night)"] += lifeLossNight;

          // Calculate metrics for debris damage
          // Filter debris function data using inputs
          let debrisValue = debrisLoss[occupancy].find((item) => {
            return (
              item["floodDepth"] == inundationDepth &&
              item["foundationType"] == "footing"
            );
          });

          let finishes = debrisValue["finishes"];
          let structure = debrisValue["structure"];
          let foundation = debrisValue["foundation"];
          let debrisWeight = finishes + structure + foundation;

          let debrisAmount = (properties.sqfoot * debrisWeight) / 1000;

          // Update scenario variable with debris damage
          if (!isNaN(debrisAmount))
            scenario_results.Buildings.Debris += debrisAmount;

          // Store building feature calculations for reuse in popup function
          buildingFeatureCalculations.push({
            occupancy,
            gid: properties.gid,
            totalDamageBuild,
            strDamage,
            contDamage,
            incomeLoss,
            wageLoss,
            relocationExpenses,
            rentalIncomeLoss,
            debrisAmount,
            lifeLossDay,
            lifeLossNight,
            inundationDepth,
          });

          // Hide building marker if it is not inundated under the current scenario
          if (scenario === "x100_year") {
            if (properties.depth100 < 1)
              return { display: "none", color: "none", fillColor: "none" };
          } else {
            if (properties.depth500 < 1)
              return { display: "none", color: "none", fillColor: "none" };
          }

          // Return styling of the building marker later
          return {
            fillColor:
              totalDamageBuild > 1000000
                ? "red"
                : totalDamageBuild > 100000
                ? "yellow"
                : "green",
            weight: 2,
            opacity: 1,
            color: "black",
            fillOpacity: 1,
            radius: 4,
            scale: 3,
            strokeWeight: 0.7,
          };
        },

        // Return the popup value based on feature properties
        popUpFunction: (feature) => {
          // Destructure properties according to features based on maptype
          let properties;
          if (this.maptype === "google") {
            properties = {};
            feature.forEachProperty(function (value, property) {
              properties[property] = value;
            });
          } else if (this.maptype === "leaflet") {
            properties = feature.properties;
          }

          let features = buildingFeatureCalculations.find(
            (item) => item.gid === properties.gid
          );

          let formattedAttributes = {};

          for (let prop in features) {
            if (
              prop == "gid" ||
              prop == "inundationDepth" ||
              prop == "occupancy"
            )
              formattedAttributes[prop] = features[prop];
            else if (
              prop == "totalDamageBuild" ||
              prop == "strDamage" ||
              prop == "contDamage" ||
              prop == "incomeLoss" ||
              prop == "wageLoss" ||
              prop == "relocationExpenses" ||
              prop == "rentalIncomeLoss"
            ) {
              formattedAttributes[prop] = floodDM.formatNumber(
                features[prop],
                true
              );
            } else {
              formattedAttributes[prop] = floodDM.formatNumber(
                features[prop],
                false
              );
            }
          }

          // Return value to rendered in the popup of the building
          let val = this.popUpFormatter(
            "Building Information",
            formattedAttributes
          );

          return val;
        },
      },
      data: buildings_layer,
    });

    /*
     *
     * Begin Rendering Bridges Layer
     *
     */

    // Bridges Layer only exists for Cedar Falls, Cedar Rapids, Davenport and Waverly
    if (
      this.city === "Cedar Falls" ||
      this.city === "Cedar Rapids" ||
      this.city === "Davenport" ||
      this.city === "Waverly"
    ) {
      // Get bridge damage functions data
      let bridgeDamFun = await floodDM.getBridgeDamageFunction();

      await Layers({
        args: {
          type: "geojson",
          name: "Bridge Layer",

          // Set bridge style function
          styleFunction: (feature) => {
            // Destructure properties according to features based on maptype
            let properties;
            if (this.maptype === "google") {
              properties = {};
              feature.forEachProperty(function (value, property) {
                properties[property] = value;
              });
            } else if (this.maptype === "leaflet") {
              properties = feature.properties;
            }

            // Calculate bridge damage
            let floodScenario, bridgDam, inundationDepth, bridgeDamPrcnt;
            let bridgeT = properties.bridgeT;
            let scour = String(properties.ScourIndex);
            let bridgeCost = properties.Cost;
            let depth100 = properties.flood100;
            let depth500 = properties.flood500;
            let depth100yr = "100 yr";
            let depth500yr = "500 yr";

            if (scenario === "x100_year") {
              floodScenario = "100-year";
            } else {
              floodScenario = "500-year";
            }

            if (floodScenario === "100-yr" && depth100 === "yes") {
              inundationDepth = depth100yr;
            } else if (floodScenario === "500-yr" && depth500 === "yes") {
              inundationDepth = depth500yr;
            } else {
              bridgDam = 0;
            }

            for (let i in bridgeDamFun[bridgeT]) {
              if (
                bridgeDamFun[bridgeT][i]["ScourPotential"] == scour &&
                bridgeDamFun[bridgeT][i]["Flood Scenario"] == inundationDepth
              ) {
                bridgeDamPrcnt = bridgeDamFun[bridgeT][i]["damage prcnt"];
              }
            }
            bridgDam = bridgeDamPrcnt * bridgeCost * 1000;

            // Update scenario variable
            if (!isNaN(bridgDam))
              scenario_results["Bridges"]["Damage"] += bridgDam;

            // Return styling
            return {
              scale: 5,
              radius: 2,
              weight: 10,
              fillColor: "black",
              color: "black",
              fillOpacity: 1,
              strokeWeight: 0.7,
            };
          },

          popUpFunction: (feature) => {
            let properties;

            if (this.maptype === "google") {
              properties = {};
              feature.forEachProperty(function (value, property) {
                properties[property] = value;
              });
            } else if (this.maptype === "leaflet") {
              properties = feature.properties;
            }
            console.log(feature);

            let totalBridgDam = 0,
              floodScenario,
              bridgDam,
              inundationDepth,
              bridgeDamPrcnt,
              bridgeFunction;
            let bridgeT = properties.bridgeT;
            let scour = String(properties.ScourIndex);
            let bridgeCost = properties.Cost;
            let depth100 = properties.flood100;
            let depth500 = properties.flood500;
            let depth100yr = "100 yr";
            let depth500yr = "500 yr";

            if (scenario === "x100_year") {
              floodScenario = "100-year";
            } else {
              floodScenario = "500-year";
            }

            if (floodScenario === "100-yr" && depth100 === "yes") {
              inundationDepth = depth100yr;
            } else if (floodScenario === "500-yr" && depth500 === "yes") {
              inundationDepth = depth500yr;
            } else {
              bridgDam = 0;
            }

            for (let i in bridgeDamFun[bridgeT]) {
              if (
                bridgeDamFun[bridgeT][i]["ScourPotential"] == scour &&
                bridgeDamFun[bridgeT][i]["Flood Scenario"] == inundationDepth
              ) {
                bridgeDamPrcnt = bridgeDamFun[bridgeT][i]["damage prcnt"];
                bridgeFunction = bridgeDamFun[bridgeT][i]["functional"];
              }
            }
            bridgDam = bridgeDamPrcnt * bridgeCost * 1000;

            let val = {
              Bridge_ID: properties.HighwayBri,
              Bridge_Type: bridgeT,
              Scour_Index: scour,
              Flood_Scenario: inundationDepth,
              Damage_Percentage: bridgeDamPrcnt * 100,
              Damage: parseInt(bridgDam).toLocaleString(),
              Functional_Percent: parseInt(bridgeFunction * 100),
            };

            let formattedAttributes = {};

            for (let prop in val) {
              if (
                prop == "Bridge_ID" ||
                prop == "Bridge_Type" ||
                prop == "Scour_Index" ||
                prop == "Flood_Scenario"
              )
                formattedAttributes[prop] = val[prop];
              else if (prop == "Damage") {
                formattedAttributes[prop] = floodDM.formatNumber(val[prop], true);
              } else {
                formattedAttributes[prop] = floodDM.formatNumber(val[prop], false);
              }
            }

            // Return value to rendered in the popup of the building
            val = this.popUpFormatter(
              "Bridge Information",
              formattedAttributes
            );

            return val;
          },
        },
        data: bridges_layer,
      });
    }

    /*
     * Begin Rendering Utilities Layer
     */

    // Utility data exists for Cedar Falls only
    if (this.city === "Cedar Falls") {
      // Get utilities damage functions data
      let utilityDamFun = await floodDM.getUtilityDamageFunction();

      await Layers({
        args: {
          type: "geojson",
          name: "Utilities Layer",

          // Function to set style
          styleFunction: (feature) => {
            // Destructure properties according to features based on maptype
            let properties;
            if (this.maptype === "google") {
              properties = {};
              feature.forEachProperty(function (value, property) {
                properties[property] = value;
              });
            } else if (this.maptype === "leaflet") {
              properties = feature.properties;
            }

            let utilityDam = 0,
              inundationDepth,
              utilityType,
              utilityDamPrcnt;
            let depth100 = properties.depth100;
            let depth500 = properties.depth500;
            let utilitySystem = properties.UtilFcltyC;
            let utilityCost = properties.Cost;
            let floodScenario = this.scenario;
            if (floodScenario === "x100_year") {
              inundationDepth = depth100;
            } else if (floodScenario === "x500_year") {
              inundationDepth = depth500;
            }
            for (let i in utilityDamFun[utilitySystem]) {
              if (
                utilityDamFun[utilitySystem][i]["floodDepth"] ===
                inundationDepth
              ) {
                utilityDamPrcnt = utilityDamFun[utilitySystem][i]["damage"];
                utilityType = utilityDamFun[utilitySystem][i]["utilitySystem"];
              }
            }
            utilityDam = (utilityDamPrcnt / 100) * utilityCost * 1000;

            //Update scenario variable
            if (!isNaN(utilityDam))
              scenario_results["Utilities"]["Damage"] += utilityDam;

            return {
              scale: 5,
              radius: 2,
              weight: 10,
              fillColor: "#F2B679",
              color: "#F2B679",
              fillOpacity: 0.5,
              strokeWeight: 0.7,
            };
          },

          // Set popup properties based on feature properties
          popUpFunction: (feature) => {
            // Destructure properties according to features based on maptype
            let properties;
            if (this.maptype === "google") {
              properties = {};
              feature.forEachProperty(function (value, property) {
                properties[property] = value;
              });
            } else if (this.maptype === "leaflet") {
              properties = feature.properties;
            }

            // Calculate utilities values
            let utilityDam = 0,
              inundationDepth,
              utilityType,
              utilityDamPrcnt;
            let depth100 = properties.depth100;
            let depth500 = properties.depth500;
            let utilitySystem = properties.UtilFcltyC;
            let utilityCost = properties.Cost;
            let floodScenario = this.scenario;
            if (floodScenario === "x100_year") {
              inundationDepth = depth100;
            } else if (floodScenario === "x500_year") {
              inundationDepth = depth500;
            }
            for (let i in utilityDamFun[utilitySystem]) {
              if (
                utilityDamFun[utilitySystem][i]["floodDepth"] ===
                inundationDepth
              ) {
                utilityDamPrcnt = utilityDamFun[utilitySystem][i]["damage"];
                utilityType = utilityDamFun[utilitySystem][i]["utilitySystem"];
              }
            }
            utilityDam = (utilityDamPrcnt / 100) * utilityCost * 1000;

            let utility = {
              "Utility ID": properties.WasteWater,
              "Utility Type": utilityType,
              "Flood depth": inundationDepth,
              Damage: parseInt(utilityDam),
            };

            let formattedAttributes = {};

            for (let prop in utility) {
              if (
                prop == "Utility ID" ||
                prop == "Utility Type" ||
                prop == "Flood depth"
              )
                formattedAttributes[prop] = utility[prop];
              else if (prop == "Damage") {
                formattedAttributes[prop] = floodDM.formatNumber(
                  utility[prop],
                  true
                );
              } else {
                formattedAttributes[prop] = floodDM.formatNumber(
                  utility[prop],
                  false
                );
              }
            }

            // Return value to rendered in the popup of the building
            let val = this.popUpFormatter(
              "Utility Information",
              formattedAttributes
            );

            // Set popup values
            return val;
          },
        },
        data: utilities_layer,
      });
    }

    /*
     * Create and display a legend on the map
     */

    // Create legend div for the map
    const legendHTML = `
    <div id="legend" class="content" style="display: block; background: rgba(255, 255, 255, 1); padding: 5px; border-style: solid !important;">

    <div style="margin: 0px 5px 5px 5px;" class="style_text_small_bold">Legend</div>
    
    <ul style="
 list-style-type:none; padding-left: 5px; margin: 5px 5px 0px 0px">
        <li><span class="style_text_small">&#9679;</span><span class="style_text_small"> Bridge</span></li>
    	<li><span style="color: orange;">&#9679;</span><span  class="style_text_small"> Utility</span></li>
        <li><span style="background-color: blue; color: blue;">&#9679;</span><span  class="style_text_small"> Flood extent</span></li>
    </ul>
    
    <ul style="
 list-style-type:none; padding-left: 5px;  margin: 5px 5px 0px 0px" class="style_text_small_bold"> Building Damage ($)
        <li><span style="color: green;">&#9679;</span><span class="style_text_small"> 0 - 100k</span></li>
        <li><span style="color: yellow;">&#9679;</span><span class="style_text_small"> 100k - 1M</span></li>
        <li><span style="color: red;">&#9679;</span><span class="style_text_small"> 1M+</span></li>
    </ul>
    
    <ul style="
 list-style-type:none; padding-left: 5px;  margin: 5px 5px 0px 0px" class="style_text_small_bold">Vehicle Damage ($)
        <li><span style="background-color: #BFBFBF; color: #BFBFBF;">&#9679;</span><span class="style_text_small"> 0 - 100k</span></li>
        <li><span style="background-color: #7E7E7E; color: #7E7E7E;">&#9679;</span><span class="style_text_small"> 100k - 1M</span></li>
        <li><span style="background-color: #323232; color: #323232;">&#9679;</span><span class="style_text_small"> 1M+</span></li>
    </ul>
  </div>`;

    // Call the addCustomLegend function for Maps
    const legendDiv = document.createElement("div");
    legendDiv.innerHTML = legendHTML;
    await addCustomLegend({
      params: {
        position: this.maptype === "google" ? "left bottom" : "bottom left",
      },
      args: {
        div: legendDiv,
      },
    });

    /*
     * 
     * Create and display a overlay to display scenario summary on the map
     * 
     */

    let cloned_scenario_results = JSON.parse(JSON.stringify(scenario_results));

    // Format results before printing
    cloned_scenario_results["Vehicles"]["Day"] = floodDM.formatNumber(
      cloned_scenario_results["Vehicles"]["Day"],
      true
    );
    cloned_scenario_results["Vehicles"]["Night"] = floodDM.formatNumber(
      cloned_scenario_results["Vehicles"]["Night"],
      true
    );
    cloned_scenario_results["Buildings"]["Structure"] = floodDM.formatNumber(
      cloned_scenario_results["Buildings"]["Structure"],
      true
    );
    cloned_scenario_results["Buildings"]["Content"] = floodDM.formatNumber(
      cloned_scenario_results["Buildings"]["Content"],
      true
    );
    cloned_scenario_results["Buildings"]["Income"] = floodDM.formatNumber(
      cloned_scenario_results["Buildings"]["Income"],
      true
    );
    cloned_scenario_results["Buildings"]["Wage"] = floodDM.formatNumber(
      cloned_scenario_results["Buildings"]["Wage"],
      true
    );
    cloned_scenario_results["Buildings"]["Relocation Expenses"] =
      floodDM.formatNumber(
        cloned_scenario_results["Buildings"]["Relocation Expenses"],
        true
      );
    cloned_scenario_results["Buildings"]["Rental Income"] = floodDM.formatNumber(
      cloned_scenario_results["Buildings"]["Rental Income"],
      true
    );
    cloned_scenario_results["Utilities"]["Damage"] = floodDM.formatNumber(
      cloned_scenario_results["Utilities"]["Damage"],
      true
    );
    cloned_scenario_results["Buildings"]["Loss of Life (Day)"] =
      floodDM.formatNumber(
        cloned_scenario_results["Buildings"]["Loss of Life (Day)"],
        false
      );
    cloned_scenario_results["Buildings"]["Loss of Life (Night)"] =
      floodDM.formatNumber(
        cloned_scenario_results["Buildings"]["Loss of Life (Day)"],
        false
      );
    cloned_scenario_results["Buildings"]["Debris"] = floodDM.formatNumber(
      cloned_scenario_results["Buildings"]["Debris"],
      false
    );

    // Create HTML table using the scenario summary
    let city_damage_table = floodDM.createTableFromObject({
      args: {
        obj: cloned_scenario_results,
        tableHeaderText: "Community Total Damage",
      },
    });

    // Create enclosing div for the scenario summary
    createDiv({
      params: {
        id: "flood-damage-scenario-total",
        style:
          `position: fixed !important;  top: ${document.getElementById('map').offsetTop+150}px; left: ${document.getElementById('map').offsetLeft+400}px; display: block;`,
        //maindiv: "map"
      },
    });

    // Add the table to the HTML page
    let city_damage_div = document.getElementById(
      "flood-damage-scenario-total"
    );
    city_damage_div.appendChild(city_damage_table);
    city_damage_div.position = 'fixed';

    floodDM.appendCloseButton(city_damage_div);
    floodDM.dragElement(city_damage_div);

    // return scenario summary
    return scenario_results;
  }

  // Helper function to attach close button on div
  static appendCloseButton(div) {
    const cross = document.createElement("span");
    cross.classList.add("close-btn");
    cross.onclick = function () {
      this.parentNode.remove();
      return false;
    };

    // Set CSS styles
    const styles = {
      position: "absolute",
      top: "10px",
      right: "10px",
      width: "20px",
      height: "20px",
      cursor: "pointer",
    };

    Object.assign(cross.style, styles);

    // Create pseudo-elements for the cross
    const beforeAfterStyles = `
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 2px;
      background-color: #777;
      transform: translate(-50%, -50%) rotate(45deg);
    `;

    const hoverStyles = `
      background-color: #000000;
    `;

    cross.appendChild(document.createElement("style")).textContent = `
      .close-btn::before,
      .close-btn::after {
        ${beforeAfterStyles}
      }
      .close-btn::after {
        transform: translate(-50%, -50%) rotate(-45deg);
      }
      .close-btn:hover::before,
      .close-btn:hover::after {
        ${hoverStyles}
      }
    `;

    // Make sure the parent div has a relative position
    div.style.position = "relative";

    // Append the close button to the div
    div.appendChild(cross);
  }

  // Helper function to drag div
  static dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0, offsetX =0, offsetY = 0;
    if (elmnt.querySelectorAll(".header_row")[0]) {
      // if present, the header is where you move the DIV from:
      elmnt.querySelectorAll(".header_row")[0].onmousedown = dragMouseDown;
    } else {
      // otherwise, move the DIV from anywhere inside the DIV:
      elmnt.onmousedown = dragMouseDown;
    }
  
    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      console.log("mouse drag start")
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
      console.log("mouse drag end")

    }
  
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
  
      // Calculate the new cursor position
      pos1 = e.clientX - pos3;
      pos2 = e.clientY - pos4;
      pos3 = e.clientX;
      pos4 = e.clientY;
  
      // Set the element's new position
      // TODO: Fix Bug in drag and drop code. Current code shifts cursor to corner
      //elmnt.style.top = e.clientY + "px";
      //elmnt.style.left = e.clientX + "px";
      elmnt.style.top = e.clientY + "px";
      elmnt.style.left = e.clientX + "px";
  }
  
  
  
    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
  

  // Helper function for initDamageScenario to get property loss data by depth and type
  static async getPropertyDamageFunction({ params, args, data } = {}) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const propertyLossesUrl =
      "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions/business_str_cnt_inputs.js";
    const proxyUrl = `${corsProxyUrl}${propertyLossesUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let propertyLosses = await response.text();
      eval(propertyLosses);
      return propertyLosses;
    } catch (error) {
      console.error("Error fetching property losses data:", error);
      return null;
    }
  }

  // Helper function for initDamageScenario for life loss by depth
  static async getLifeLossFunction({ params, args, data } = {}) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const lifeLossesUrl =
      "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions/life_inputs.js";
    const proxyUrl = `${corsProxyUrl}${lifeLossesUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let life = await response.text();
      eval(life);
      return life;
    } catch (error) {
      console.error("Error fetching life losses data:", error);
      return null;
    }
  }

  //  Helper function for initDamageScenario for debris loss by depth and property type
  static async getDebrisWeightFunction({ params, args, data } = {}) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const debrisUrl =
      "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions/debris_weight.js";
    const proxyUrl = `${corsProxyUrl}${debrisUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let debris = await response.text();
      eval(debris);
      return debris;
    } catch (error) {
      console.error("Error fetching debris weight data:", error);
      return null;
    }
  }

  //  Helper function for initDamageScenario for bridge loss by depth
  static async getBridgeDamageFunction({ params, args, data } = {}) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const debrisUrl =
      "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions/bridge_function.js";
    const proxyUrl = `${corsProxyUrl}${debrisUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let bridgeDamFun = await response.text();
      eval(bridgeDamFun);
      return bridgeDamFun;
    } catch (error) {
      console.error("Error fetching debris weight data:", error);
      return null;
    }
  }

  //  Helper function for initDamageScenario for vehicle loss by depth
  static async getVehicleDamageFunction({ params, args, data } = {}) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const debrisUrl =
      "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions/vehicle_function.js";
    const proxyUrl = `${corsProxyUrl}${debrisUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let vehicleDamFun = await response.text();
      eval(vehicleDamFun);
      return vehicleDamFun;
    } catch (error) {
      console.error("Error fetching debris weight data:", error);
      return null;
    }
  }

  //  Helper function for initDamageScenario for utility loss by depth
  static async getUtilityDamageFunction({ params, args, data } = {}) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const debrisUrl =
      "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions/utility_function.js";
    const proxyUrl = `${corsProxyUrl}${debrisUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let utilityDamFun = await response.text();

      eval(utilityDamFun);
      return utilityDamFun;
    } catch (error) {
      console.error("Error fetching debris weight data:", error);
      return null;
    }
  }

  /**
   * Initialize flood mitigation scenario
   * @method initMitigationScenario
   * @memberof floodDM
   * @instance
   * @async
   * @param {String} args.city - City name for which mitigation scenario needs to be built. Allowed cities are Waterloo, Cedar Rapids or Cedar Falls
   * @param {number} args.depth - The flood depth for which to retrieve damage data.
   * @example
   * hydro.analyze.hydro.initMitigationScenario({
   *   args: { city : "Waterloo", depth: 30.5 }
   * });
   */
  async initMitigationScenario({ params, args, data } = {}) {
    // Set class members of city and depth
    let { city, depth } = args;
    this.city = city;
    this.depth = depth;

    // Check params for maptype
    if (params === undefined) {
      this.maptype = "leaflet";
      params = {};
    } else if (params.maptype === undefined) this.maptype = "leaflet";
    else this.maptype = params.maptype;

    if (this.maptype === "google") {
      if (params.key === undefined) {
        this.maptype = "leaflet";
      }
    }

    // Get building features for mitigation features
    let city_features = await retrieve({
      params: {
        source: "mitigation_dt",
        datatype: "community_flood_inundation",
      },
      args: { sourceType: this.city },
    });

    // Calculate centroid using the building features
    let centroid = await floodDM.featureCollectionCentroid(city_features);

    // Filter the city features retrived to get features applicable at the particular flood depth
    city_features = await floodDM.getFloodInundation({
      args: { depth: this.depth },
      data: city_features,
    });

    // Render the map based on parameters
    if (!this.mapRendered) {
      await renderMap({
        params: { maptype: this.maptype, lat: centroid[1], lon: centroid[0] },
        args: { key: params.key },
      });
      this.mapRendered = true;
    }
    floodDM.addFontStyle()

    // If any building features exist
    if (city_features.features.length > 0) {
      // Define style function for the features
      let styleFunction = (feature) => {
        let color = "gray",
          depth_style,
          radius;

        // Define current scenario
        let current_scenario = "depth" + String(Math.floor(this.depth * 10));

        // Get properties specific map type
        if (this.maptype === "google") {
          depth_style = feature.getProperty(current_scenario);
          radius = 1;
        } else if (this.maptype === "leaflet") {
          depth_style = feature.properties[current_scenario];
          radius = 4;
        }

        // Set marker color based on depth of the building
        if (5 < depth_style && depth_style <= 10) color = "purple";
        else if (2 < depth_style && depth_style <= 5) color = "red";
        else if (0 < depth_style && depth_style <= 2) color = "yellow";

        // Return style based on feature properties
        return {
          scale: 5,
          radius: radius,
          fillColor: color,
          color: "black",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
          strokeWeight: 0.7,
        };
      };

      // Define popup function for the features
      let popUpFunction = (feature) => {
        let current_scenario = "depth" + String(Math.floor(this.depth * 10));

        // Destructure the properties based on maptype
        let properties;
        if (this.maptype === "google") {
          properties = {};
          feature.forEachProperty(function (value, property) {
            properties[property] = value;
          });
        } else if (this.maptype === "leaflet") {
          properties = feature.properties;
        }

        return `<div class="style_text_small_bold">Building Damage Information</div>
          <div class="style_text_small">
          Building ID: ${String(properties.gid)}<br>
          Occupancy Type: ${String(properties.occupancy2)}<br>
          Flood Depth: ${properties[current_scenario]} ft</div>`;
      };

      // Define click function for the features
      let onClickFunction = async (event) => {
        if (this.maptype === "google") {
          this.selectedfeature = event.feature;
        } else if (this.maptype === "leaflet") {
          this.selectedfeature = event.target.feature;
        }
        console.log(this.selectedfeature);
      };

      // Render Layer for building features
      await Layers({
        args: {
          type: "geojson",
          name: "Buildings Layer",
          styleFunction,
          popUpFunction,
          onClickFunction,
        },
        data: city_features,
      });
    }

    // Get city and depth specific property damage values
    let city_damage = await floodDM.getCityFloodDamage({
      args: { depth: this.depth, city: this.city },
    });

    // Hard code emissions data for various cities as these values were hardcoded in original MiDAS system
    city_damage["low_emission"] = {};
    city_damage["high_emission"] = [];
    if (city === "Cedar Rapids") {
      city_damage["low_emission"] = "$ 295.3 M";
      city_damage["high_emission"] = "$ 635.8 M";
    } else if (city === "Cedar Falls") {
      city_damage["low_emission"] = "$ 175.5 M";
      city_damage["high_emission"] = "$ 332.9 M";
    } else if (city === "Waterloo") {
      city_damage["low_emission"] = "$ 269.2 M";
      city_damage["high_emission"] = "$ 785.6 M";
    }

    // Create an HTML table for overlay of mitigation summary
    let city_damage_table = floodDM.createTableFromObject({
      args: { obj: city_damage, tableHeaderText: this.city },
    });

    createDiv({
      params: {
        id: "community-mitigation-scenario-total",
        style:
          "position: absolute; float: left; top: 50px; left: 50px; display: block;",
      },
    });

    // Add the table to the HTML page
    let city_damage_div = document.getElementById(
      "community-mitigation-scenario-total"
    );
    city_damage_div.appendChild(city_damage_table);
    floodDM.appendCloseButton(city_damage_div);
    floodDM.dragElement(city_damage_div);
    document.body.appendChild(city_damage_div);

    // Create a HTML div
    const legendHTML = `
    <div id="legend" class="content" style="display: block; background: rgba(255, 255, 255, 1); padding: 5px; border-style: solid !important; margin:5px;">

    <div style="margin: 0px 5px 5px 5px;" class="style_text_small_bold">Legend</div>

    <ul style="
 list-style-type:none; padding-left: 5px; margin: 5px 5px 0px 0px" class="style_text_small_bold">Depth
        <li><span style="color: purple;">&#9632;</span><span class="style_text_small"> &gt; 5 - 10 ft</span></li>
    	<li><span style="color: red;">&#9632;</span><span  class="style_text_small"> 2 - 5 ft</span></li>
        <li><span style="color: yellow;">&#9632;</span><span  class="style_text_small"> &lt; 2 ft</span></li>
    </ul>
  </div>
`;
    const legendDiv = document.createElement("div");
    legendDiv.innerHTML = legendHTML;

    // Call the addCustomLegend function for Maps
    await addCustomLegend({
      params: {
        position: this.maptype === "google" ? "right bottom" : "bottom right",
      },
      args: {
        div: legendDiv,
      },
    });

    // Return summary of city damage
    return city_damage;
  }

  // Helper function to calculate centroid for Point feature collections.
  // Pass an array of features
  static featureCollectionCentroid(featureCollection) {
    let numFeatures = featureCollection.features.length;

    let coordSum = featureCollection.features.reduce(
      (runningSum, currentFeature) => {
        return [
          currentFeature.geometry.coordinates[0] + runningSum[0],
          currentFeature.geometry.coordinates[1] + runningSum[1],
        ];
      },
      [0, 0]
    );

    return [coordSum[0] / numFeatures, coordSum[1] / numFeatures];
  }

  /**
   * Run the damage and mitigation scenario of the selected property based on flood depth and mitigation parameters
   *
   * @method runMitigationScenario
   * @memberof floodDM
   * @instance
   * @async
   * @param {String} args.city - City name for which mitigation scenario needs to be built. Allowed cities are Waterloo, Cedar Rapids or Cedar Falls
   * @param {number} args.depth - The flood depth for which to retrieve damage data.
   * @example
   * hydro.analyze.hydro.initMitigationScenario({
   *   args: { city : "Waterloo", depth: 30.5 }
   * });
   */
  async runMitigationScenario({ params, args, data } = {}) {
    let { mitigationMeasure, mitigationDepth, foundationType } = args;
    let props;

    //Check if a building feature has been selected
    if (this.selectedfeature === null) {
      console.log(
        "Click on a property marker and then run mitigation scenario"
      );
      return;
    }

    // Destructure feature prooperties based on map
    // The properties are retrieved from the property selected by click on the map
    if (this.maptype === "google") {
      props = {};
      this.selectedfeature.forEachProperty(function (value, property) {
        props[property] = value;
      });
    } else if (this.maptype === "leaflet") {
      props = this.selectedfeature.properties;
    }

    // Set params based on properties of the selected feature
    params = {
      occupancy: props.occupancy2,
      structuralValue: props.val_struct,
      contentValue: props.val_cont,
      buildingArea: props.sqfoot,
    };

    // Set args based on properties of the selected feature
    args = {
      floodDepth: props["depth" + (this.depth * 10).toString()],
      mitigationMeasure: mitigationMeasure,
      mitigationDepth: mitigationDepth,
      foundationType: foundationType,
    };

    // Build flood damage and mitigation scenario based on provided parameters
    let mitigationResult = await floodDM.buildPropertyDMScenario({
      params,
      args,
      data,
    });

    let mitigation_result_copy = JSON.parse(JSON.stringify(mitigationResult));

    // Create HTML table using the damage and mitigation metrics of the buildings
    let city_damage_table = floodDM.createTableFromObject({
      args: {
        obj: mitigation_result_copy,
        tableHeaderText: "Damage and Mitigation Summary",
      },
    });

    // Add the table to the HTML page
    createDiv({
      params: {
        id: "property-mitigation-scenario",
        style:
          "position: absolute; float: left; top: 200px; left: 50px; display: block;",
      },
    });

    let city_damage_div2 = document.getElementById(
      "property-mitigation-scenario"
    );
    city_damage_div2.appendChild(city_damage_table);
    floodDM.appendCloseButton(city_damage_div2);
    floodDM.dragElement(city_damage_div2);
    document.body.appendChild(city_damage_div2);

    // Return summary
    return city_damage_table;
  }

  /**
   * Retrieves flood damage data for a given flood depth.
   *
   * @method getCityFloodDamage
   * @memberof floodDM
   * @async
   * @param {String} args.city - An array of objects containing flood damage data for each flood level.
   * @param {number} args.depth - The flood depth for which to retrieve damage data.
   * @returns {Object} An object containing the number of buildings affected, the structural loss, and the content loss for the closest matching flood level.
   * @example
   * hydro.analyze.hydro.getCityFloodDamage({
   *   args: { depth: 30.5, city: "Cedar Rapids" }
   * });
   */
  static async getCityFloodDamage({ params, args, data } = {}) {
    // Validate input data
    if (!args.city || !args.depth) {
      return "City or depth not found";
    }

    const corsProxyUrl = proxies["local-proxy"]["endpoint"];

    let cityname;
    if (args.city === "Cedar Falls") {
      cityname = "cedar_falls";
    } else if (args.city === "Cedar Rapids") {
      cityname = "cedar_rapids";
    } else if (args.city === "Waterloo") {
      cityname = "waterloo";
    }

    const debrisUrl = `https://hydroinformatics.uiowa.edu/lab/midas/communities/${cityname}.json`;
    const proxyUrl = `${corsProxyUrl}${debrisUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let cityDamage = await response.json();

      let damage = cityDamage["city"].filter(
        (item) => item["flood_level"] === args.depth.toString()
      )[0];

      return damage;
    } catch (error) {
      console.error("Error fetching debris weight data:", error);
      return null;
    }
  }

  /**
   *
   * Helper function to create an HTML table element from a JavaScript object.
   * @method createTableFromObject
   * @memberof floodDM
   * @private
   * @param {Object} args - An object containing the arguments for the function.
   * @param {Object} args.obj - The JavaScript object to convert to an HTML table.
   * @param {number} args.depth=0 - The depth level of the current object (used for indentation).
   * @param {boolean} args.showHeader=true - Whether to display the object keys as table headers (bold text).
   * @param {string|null} args.tableHeaderText=null - The text to display in the table header row (if provided).
   * @returns {HTMLTableElement} The HTML table element created from the object.
   */
  static createTableFromObject({ params, args, data } = {}) {
    if (args.obj === undefined) args.obj = "";

    let { obj, depth = 0, showHeader = true, tableHeaderText = null } = args;
    // Create the table element
    const table = document.createElement("table");

    table.style.borderCollapse = "collapse";
    table.style.backgroundColor = "white";
    table.style.borderSpacing = "0px";
    table.style.border = "1px solid #A9A9A9";
    table.style.tableLayout = "fixed";
    table.style.textAlign = "center";
    table.classList.add("style_text_large_bold");

    // Add table header row if tableHeaderText is provided
    if (tableHeaderText !== null && depth === 0) {
      const headerCell = table.insertRow().insertCell();
      headerCell.textContent = tableHeaderText;
      headerCell.colSpan = 2;
      headerCell.style.border = "1px solid #A9A9A9";
      headerCell.style.cursor = "move";
      headerCell.style.lineHeight = "40px";
      headerCell.style.minWidth = "120px";
      headerCell.classList.add("style_text_large_bold");
      headerCell.classList.add("header-row");
    }

    // Loop through the object keys
    for (const key in obj) {
      // Create a new row
      const row = table.insertRow();

      // Insert a cell for the key
      const keyCell = row.insertCell();
      keyCell.textContent = key;
      keyCell.style.minWidth = "120px";
      keyCell.style.borderLeft = "1px solid #A9A9A9";
      keyCell.classList.add("style_text_small_bold");

      // Insert a cell for the value
      const valueCell = row.insertCell();

      // If the value is an object, create a nested table
      if (typeof obj[key] === "object" && obj[key] !== null) {
        //valueCell.style.borderBottom = "1px solid #fff"; // Add bottom border to value cell
        //valueCell.style.backgroundColor = "#A9A9A9";
        valueCell.style.padding = "0px";
        valueCell.appendChild(
          floodDM.createTableFromObject({
            args: { obj: obj[key], depth: depth + 1, showHeader: true },
          })
        );
      } else {
        valueCell.textContent = obj[key];
        valueCell.style.borderLeft = "2px solid #A9A9A9";
        valueCell.style.minWidth = "120px";
        valueCell.classList.add("style_text_small");
      }
    }

    return table;
  }

  /**
   * Returns an array of GeoJSON point features of Buildings from midas data source and community_flood_inundation datatype
   * based on flood depth
   *
   * @method getFloodInundation
   * @memberof floodDM
   * @param {Object[]} data - An array of objects containing flood damage data for each flood level.
   * @param {number} args.depth - The flood depth for which to retrieve inundation data.
   * @returns {Object} An object containing the number of buildings affected for the closest matching flood level.
   * @example
   * hydro.analyze.hydro.getFloodInundation({ args:{depth: 20 }, data: {
   * "type": "FeatureCollection",
   * "name": "waterloo",
   * "crs": {
   *   "type": "name",
   *    "properties": {
   *       "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
   *     }
   *   },
   *   "features": [
   *     {
   *       "type": "Feature",
   *       "properties": {
   *         ...
   *      },
   *       "geometry": {
   *         "type": "Point",
   *         "coordinates": [
   *           -92.39561119522634,
   *           42.47028021204937
   *         ]
   *       }
   *     },...
   */
  static getFloodInundation({ params, args, data } = {}) {
    // Validate input data
    if (!data.features || !Array.isArray(data.features)) {
      return { error: "Invalid data format" };
    }

    if (!args || typeof args.depth !== "number") {
      return { error: "Invalid args format" };
    }

    const floodDepth = args.depth;

    let dataClone = structuredClone(data);
    dataClone.features = dataClone.features.filter((item) => {
      return (
        item.properties["depth" + String(Math.floor(floodDepth * 10))] >= 1
      );
    });

    return dataClone;
  }

  /**
   * Calculates the property details and optionally retrieves flood damage and mitigation options.
   *
   * @method buildPropertyDMScenario
   * @memberof floodDM
   * @async
   * @param {Object} params - An object containing additional parameters (currently unused).
   * @param {Object} args - An object containing the property details and optional flood depth and mitigation depth.
   * @param {string} params.occupancy - The occupancy type (e.g., 'RES1', 'COM1', 'IND1', 'GOV1', 'AGR1').
   * @param {number} params.structuralValue - The structural value of the property.
   * @param {number} params.contentValue - The content value of the property.
   * @param {number} params.buildingArea - The building area of the property.
   * @param {number} [args.floodDepth] - The flood depth for which to calculate the damage (optional).
   * @param {number} [args.mitigationDepth] - The desired mitigation measure (optional).
   * @param {number} [args.mitigationDepth] - The desired mitigation depth (optional).
   * @param {Object} data - Additional data (currently unused).
   * @returns {Promise<Object>} A Promise that resolves with an object containing the property details, and optionally the flood depth, calculated losses, and mitigation options.
   * @example
   * const propertyDetails = await floodDM.buildPropertyDMScenario({}, { occupancy: 'RES1', structuralValue: 200000, contentValue: 100000, buildingArea: 2000 }, {});
   * console.log(propertyDetails);
   *
   * const propertyDamage = await floodDM.buildPropertyDMScenario({}, { occupancy: 'RES1', structuralValue: 200000, contentValue: 100000, buildingArea: 2000, floodDepth: 3 }, {});
   * console.log(propertyDamage);
   *
   * const propertyDamageAndMitigation = await floodDM.buildPropertyDMScenario({}, { occupancy: 'RES1', structuralValue: 200000, contentValue: 100000, buildingArea: 2000, floodDepth: 3, mitigationDepth: 2 }, {});
   * console.log(propertyDamageAndMitigation);
   */
  static async buildPropertyDMScenario({ params, args, data } = {}) {
    // Destructure the required parameters and arguments
    const { occupancy, structuralValue, contentValue, buildingArea } = params;
    const { floodDepth, mitigationMeasure, mitigationDepth, foundationType } =
      args;

    // Create an object to store the result
    const result = {
      occupancy,
      structuralValue,
      contentValue,
      buildingArea,
    };

    // Check if floodDepth is a number
    if (typeof floodDepth === "number") {
      // Fetch the damage data based on occupancy and flood depth
      const damageData = await floodDM.fetchCurvesData(occupancy, floodDepth);

      // Calculate structural and content losses based on the damage data
      const losses = floodDM.calculateLosses(
        structuralValue,
        contentValue,
        damageData
      );

      // Add flood depth, structural loss, and content loss to the result object
      result.floodDepth = floodDepth;
      result.structuralLoss = losses.structuralLoss;
      result.contentLoss = losses.contentLoss;
      let finalSqft = result.buildingArea;

      // Check if mitigation measure and depth are provided
      if (mitigationDepth && mitigationMeasure) {
        // Get mitigation options based on foundation type, mitigation measure, mitigation depth, and building area
        const mitigationOptions = await floodDM.getMitigationOptions(
          foundationType,
          mitigationMeasure,
          mitigationDepth,
          finalSqft,
          result
        );

        // Add mitigation options to the result object
        result.mitigationOptions = mitigationOptions;
      }

      // Formatting loss values as US Dollar values
      result.structuralLoss = floodDM.formatNumber(result.structuralLoss, true);
      result.contentLoss = floodDM.formatNumber(result.contentLoss, true);
      result.structuralValue = floodDM.formatNumber(result.structuralValue, true);
      result.buildingArea = floodDM.formatNumber(result.buildingArea);
      result.contentValue = floodDM.formatNumber(result.contentValue, true);
    }

    // Return the result object
    return result;
  }

  // Helper function for buildPropertyDMScenario to retrieve curves.json
  // which contains property and depth specific damage per unit area data
  static async fetchCurvesData(occupancy, floodDepth) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const curvesUrl =
      "https://hydroinformatics.uiowa.edu/lab/midas/jsons/curves.json";
    const proxyUrl = `${corsProxyUrl}${curvesUrl}`;

    let response = await fetch(proxyUrl);
    response = await response.json();

    const occupancyData = response.curves.filter(
      (curve) =>
        curve.occupancy === occupancy && curve.depth === floodDepth.toString()
    );
    const closestDepth = occupancyData.reduce((prev, curr) =>
      Math.abs(curr.depth - floodDepth) < Math.abs(prev.depth - floodDepth)
        ? curr
        : prev
    );

    return closestDepth;
  }

  //  Helper function for buildPropertyDMScenario to
  // calculate the structural and content loss given curves data and property value
  static calculateLosses(structuralValue, contentValue, damageData) {
    const structuralLoss = (structuralValue * damageData.struct_dam_per) / 100;
    const contentLoss = (contentValue * damageData.cont_dam_per) / 100;

    return {
      structuralLoss: Math.round(structuralLoss / 1000) * 1000,
      contentLoss: Math.round(contentLoss / 1000) * 1000,
    };
  }

  //  Helper function for buildPropertyDMScenario to
  // build mitigation scenario for selected property
  static async getMitigationOptions(
    foundationType,
    mitigationMeasure,
    mitigationDepth,
    finalSqft,
    result
  ) {
    // Fetch mitigation data
    let mitigationData;// = await this.fetchMitigationData();
    // Check if mitigation data is already cached
    if (floodDM.mitigationDataCache) {
      // Use cached mitigation data
      mitigationData = floodDM.mitigationDataCache;
    } else {
      // Fetch mitigation data and cache it
      mitigationData = await retrieve({
        params: {
          source: "mitigation_dt",
          datatype: 'property_mitigation_cost',
        },
        args: { sourceType: 'property_mitigation_cost' },
      });

      // Store the fetched data in the cache
      floodDM.mitigationDataCache = mitigationData;
    }

    let final_mitigation_cost, final_mitigation_benefit;

    // Check if mitigation data is available
    if (!mitigationData) {
      return { error: "Failed to fetch mitigation data" };
    }

    const mitigationOptions = mitigationData.mitigation_options;

    // Get structural loss, content loss, and final depth from the result object
    let structuralLoss = result.structuralLoss;
    let contentLoss = result.contentLoss;
    let finalDepth = result.floodDepth;

    // Iterate over each mitigation option
    for (let option of mitigationOptions) {
      // Check if the mitigation measure matches the option and the foundation type matches
      if (
        mitigationMeasure == option.measure &&
        option.foundation_type === foundationType
      ) {
        // Calculate mitigation cost and benefit for this option
        final_mitigation_cost = finalSqft * option.cost;
        final_mitigation_cost = Math.round(final_mitigation_cost / 1000) * 1000;

        final_mitigation_benefit =
          structuralLoss + contentLoss - final_mitigation_cost;
        final_mitigation_benefit =
          Math.round(final_mitigation_benefit / 1000) * 1000;
      }
      // Check if the mitigation measure is "Wet Floodproofing" and the mitigation depth matches the option design
      else if (
        mitigationMeasure == "Wet Floodproofing" &&
        mitigationDepth == option.design
      ) {
        // Calculate mitigation cost and benefit for this option
        var perimeter = Math.sqrt(finalSqft);
        final_mitigation_cost = 4 * perimeter * option.cost;
        final_mitigation_cost = Math.round(final_mitigation_cost / 1000) * 1000;

        if (mitigationDepth < finalDepth) {
          final_mitigation_benefit =
            -final_mitigation_cost - structuralLoss - contentLoss;
          final_mitigation_benefit =
            Math.round(final_mitigation_benefit / 1000) * 1000;
        } else if (mitigationDepth >= finalDepth) {
          final_mitigation_benefit =
            structuralLoss + contentLoss - final_mitigation_cost - contentLoss;
          final_mitigation_benefit =
            Math.round(final_mitigation_benefit / 1000) * 1000;
        }
      } else {
        // Check if the mitigation measure and mitigation depth match the option
        if (
          mitigationMeasure == option.measure &&
          mitigationDepth == option.design
        ) {
          // Calculate mitigation cost and benefit based on the application type
          if (option.app_type == "linear") {
            var perimeter = Math.sqrt(finalSqft);
            final_mitigation_cost = 4 * perimeter * option.cost;
            final_mitigation_cost =
              Math.round(final_mitigation_cost / 1000) * 1000;

            if (mitigationDepth < finalDepth) {
              final_mitigation_benefit =
                -final_mitigation_cost - structuralLoss - contentLoss;
              final_mitigation_benefit =
                Math.round(final_mitigation_benefit / 1000) * 1000;
            } else if (mitigationDepth >= finalDepth) {
              final_mitigation_benefit =
                structuralLoss + contentLoss - final_mitigation_cost;
              final_mitigation_benefit =
                Math.round(final_mitigation_benefit / 1000) * 1000;
            }
          } else if (option.app_type == "area") {
            final_mitigation_cost = finalSqft * option.cost;
            final_mitigation_cost =
              Math.round(final_mitigation_cost / 1000) * 1000;
            if (mitigationDepth < finalDepth) {
              final_mitigation_benefit =
                -final_mitigation_cost - structuralLoss - contentLoss;
              final_mitigation_benefit =
                Math.round(final_mitigation_benefit / 1000) * 1000;
            } else if (mitigationDepth >= finalDepth) {
              final_mitigation_benefit =
                structuralLoss + contentLoss - final_mitigation_cost;
              final_mitigation_benefit =
                Math.round(final_mitigation_benefit / 1000) * 1000;
            }
          }
        }
      }
    }

    // Create a return object with mitigation measure, foundation type, cost, and benefit
    let returnVal = {
      measure: mitigationMeasure,
      foundationType: foundationType,
      cost: floodDM.formatNumber(final_mitigation_cost, true),
      benefit: floodDM.formatNumber(final_mitigation_benefit, true),
    };

    return returnVal;
  }

  //  Helper function for getPropertyDmMt
  static async fetchMitigationData() {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const mitigationUrl =
      "https://hydroinformatics.uiowa.edu/lab/midas/jsons/mitigations.json";
    const proxyUrl = `${corsProxyUrl}${mitigationUrl}`;

    try {
      const response = await fetch(proxyUrl);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching mitigation data:", error);
      return null;
    }
  }

  /**
   * Retrieves bridge damage data based on the provided arguments.
   *
   * @method getBridgeDamage
   * @memberof floodDM
   * @async
   * @param {Object} params - An object containing additional parameters (currently unused).
   * @param {Object} args - An object containing the required arguments.
   * @param {string} args.bridge_type - The type of the bridge, either "Single Span" or "Continuous Span".
   * @param {string} args.scour_index - The scour index, which can be "Unknown", "1", "2", or "3".
   * @param {string} args.flood_scenario - The flood scenario, from "25 yr" to "500 yr" in 25-year intervals.
   * @param {number} args.replacement_value - The replacement value of the bridge.
   * @param {Object} data - Additional data (currently unused).
   * @returns {Promise<Object|null>} A Promise that resolves with an object containing the bridge damage data, or null if no matching data is found or an error occurs.
   */
  static async getBridgeDamage({ params, args, data } = {}) {
    // Destructure the required arguments from the args object
    const { bridge_type, scour_index, flood_scenario, replacement_value } =
      args;

    // Define the URL for fetching bridge damage data and construct the proxy URL
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const bridgeDamageUrl =
      "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions/bridge_function.js";
    const proxyUrl = `${corsProxyUrl}${bridgeDamageUrl}`;

    try {
      // Fetch the data from the proxy URL
      const response = await fetch(proxyUrl);
      const data = await response.text();

      // Extract the bridgeDamFun object from the fetched data
      let bridgeDamFun;
      eval(data);

      // Find the matching entry based on bridge_type, scour_index, and flood_scenario
      const matchingEntry = bridgeDamFun[bridge_type].find(
        (entry) =>
          entry["ScourPotential"] === scour_index &&
          entry["Flood Scenario"] === flood_scenario
      );

      if (matchingEntry) {
        // If a matching entry is found, calculate and return the bridge damage data
        const damagePercent = matchingEntry["damage prcnt"];
        const damageCost = replacement_value * damagePercent;
        const functionalCost = replacement_value * (1 - functionalPercent);

        return {
          damagePercent,
          damageCost: Math.round(damageCost),
          damage: damage,
        };
      } else {
        // If no matching entry is found, log a warning and return null
        console.warn(
          `No matching entry found for bridge_type: ${bridge_type}, scour_index: ${scour_index}, and flood_scenario: ${flood_scenario}`
        );
        return null;
      }
    } catch (error) {
      // If an error occurs during the data fetch, log the error and return null
      console.error("Error fetching bridge damage data:", error);
      return null;
    }
  }

  /**
   * Retrieves utility damage data based on the provided arguments.
   *
   * @method getUtilityDamage
   * @memberof floodDM
   * @async
   * @param {Object} params - An object containing additional parameters (currently unused).
   * @param {Object} args - An object containing the required arguments.
   * @param {string} args.utility - The utility system (e.g., "PDFLT", "PPPL", "WWTL", etc.).
   * @param {number} args.depth - The flood depth in feet.
   * @param {number} args.utilityValue - The replacement value of the utility.
   * @param {Object} data - Additional data (currently unused).
   * @returns {Promise<Object|null>} A Promise that resolves with an object containing the utility damage data, or null if no matching data is found or an error occurs.
   */
  static async getUtilityDamage({ params, args, data } = {}) {
    // Destructure the required arguments from the args object
    const { utility, depth, utilityValue } = args;

    // Define the URL for fetching utility damage data and construct the proxy URL
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const utilityDamageUrl =
      "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions/utility_function.js";
    const proxyUrl = `${corsProxyUrl}${utilityDamageUrl}`;

    try {
      // Fetch the data from the proxy URL
      const response = await fetch(proxyUrl);
      const data = await response.text();

      // Extract the utilityDamFun object from the fetched data
      let utilityDamFun;
      eval(data);

      // Find the matching entry based on utility and depth
      const matchingEntry = utilityDamFun[utility].find(
        (entry) => entry.floodDepth === depth
      );

      if (matchingEntry) {
        // If a matching entry is found, calculate and return the utility damage data
        const damagePercent = matchingEntry.damage;
        const damageCost = utilityValue * (damagePercent / 100);

        return {
          damagePercent,
          damageCost: Math.round(damageCost),
        };
      } else {
        // If no matching entry is found, log a warning and return null
        console.warn(
          `No matching entry found for utility: ${utility} and depth: ${depth}`
        );
        return null;
      }
    } catch (error) {
      // If an error occurs during the data fetch, log the error and return null
      console.error("Error fetching utility damage data:", error);
      return null;
    }
  }

  /**
   * Retrieves property loss data, including structure and content damage, business interruption losses,
   * and debris amount based on the provided arguments.
   *
   * @method getPropertyLoss
   * @memberof floodDM
   * @async
   * @param {Object} params - An object containing additional parameters (currently unused).
   * @param {Object} args - An object containing the required arguments.
   * @param {string} args.occupancy - The occupancy type (e.g., 'RES1-1SNB', 'COM1', 'IND1', etc.).
   * @param {number} args.depth - The flood depth in feet.
   * @param {string} args.foundationType - The foundation type ('footing' or 'slab on grade').
   * @param {number} args.structureValue - The structure value of the property.
   * @param {number} args.contentValue - The content value of the property.
   * @param {number} args.area - The area of the property in square feet.
   * @param {Object} data - Additional data (currently unused).
   * @returns {Promise<Object>} A Promise that resolves with an object containing the property loss, business interruption, and debris amount data.
   */
  static async getPropertyLoss({ params, args, data } = {}) {
    const {
      occupancy,
      depth,
      foundationType,
      structureValue,
      contentValue,
      area,
    } = args;

    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    let propertyLosses, debris;

    const propertyLossesUrl =
      "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions/business_str_cnt_inputs.js";
    const debrisUrl =
      "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions/debris_weight.js";

    const [propertyLossesData, debrisData] = await Promise.all([
      fetch(`${corsProxyUrl}${propertyLossesUrl}`).then((response) =>
        response.text()
      ),
      fetch(`${corsProxyUrl}${debrisUrl}`).then((response) => response.text()),
    ]);

    eval(propertyLossesData);
    eval(debrisData);

    const propertyLossEntry = propertyLosses[occupancy].find(
      (entry) => entry.floodDepth === depth
    );
    const debrisEntry = debris[occupancy].find(
      (entry) =>
        entry.floodDepth === depth && entry.foundationType === foundationType
    );

    if (propertyLossEntry && debrisEntry) {
      const structureDamPercent = propertyLossEntry.structure;
      const contentDamPercent = propertyLossEntry.content;
      const structureLoss = (structureValue * structureDamPercent) / 100;
      const contentLoss = (contentValue * contentDamPercent) / 100;

      const incomePerDay = propertyLossEntry.incomePerSqftPerDay * area;
      const wagePerDay = propertyLossEntry.wagePerSqftPerDay * area;
      const rentalIncome =
        ((1 - propertyLossEntry.percentOwnerOccupied / 100) *
          area *
          propertyLossEntry.rentalCostPerSqftPerDay *
          propertyLossEntry.maxTime *
          30) /
        1000;
      const relocation =
        (area *
          ((1 - propertyLossEntry.percentOwnerOccupied / 100) *
            propertyLossEntry.disruptionCostPerSqft +
            (propertyLossEntry.percentOwnerOccupied / 100) *
              (propertyLossEntry.disruptionCostPerSqft +
                propertyLossEntry.rentalCostPerSqftPerDay *
                  propertyLossEntry.maxTime *
                  30))) /
        1000;

      const finishesDebris = (area * debrisEntry.finishes) / 1000;
      const structureDebris = (area * debrisEntry.structure) / 1000;
      const foundationDebris = (area * debrisEntry.foundation) / 1000;
      const totalDebris = finishesDebris + structureDebris + foundationDebris;

      return {
        propertyLoss: {
          structureLoss: Math.round(structureLoss),
          contentLoss: Math.round(contentLoss),
          structureDamPercent,
          contentDamPercent,
        },
        businessInterruption: {
          incomeLoss:
            Math.round(
              (1 - propertyLossEntry.recapturFactor) * incomePerDay * 30
            ) * propertyLossEntry.maxTime,
          wageLoss:
            Math.round(
              (1 - propertyLossEntry.recapturFactor) * wagePerDay * 30
            ) * propertyLossEntry.maxTime,
          rentalIncome: Math.round(rentalIncome),
          relocation: Math.round(relocation),
        },
        debrisAmount: {
          finishesDebris: Math.round(finishesDebris),
          structureDebris: Math.round(structureDebris),
          foundationDebris: Math.round(foundationDebris),
          totalDebris: Math.round(totalDebris),
        },
      };
    } else {
      console.warn(
        `No matching entry found for occupancy: ${occupancy}, depth: ${depth}, and foundationType: ${foundationType}`
      );
      return null;
    }
  }

  /**
   * Retrieves loss of life data based on the provided arguments.
   *
   * @method getLifeLoss
   * @memberof floodDM
   * @param {Object} params - An object containing additional parameters (currently unused).
   * @param {Object} args - An object containing the required arguments.
   * @param {string} args.occupancy - The occupancy type (e.g., 'RES1-1SNB', 'COM1', 'IND1', etc.).
   * @param {number} args.depth - The flood depth in feet.
   * @param {number} args.peopleOver65 - The number of people living in this dwelling over 65.
   * @param {number} args.peopleUnder65 - he number of people living in this dwelling under 65.
   * @param {Object} data - Additional data (currently unused).
   * @returns {Promise<Object|null>} A Promise that resolves with an object containing the utility damage data, or null if no matching data is found or an error occurs.
   */
  static async getLifeLoss({ params, args, data } = {}) {
    // Destructure the required arguments from the args object
    const { occupancy, depth, peopleOver65, peopleUnder65 } = args;

    // Define the URL for fetching utility damage data and construct the proxy URL
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const lifeLossUrl =
      "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions/life_inputs.js";
    const proxyUrl = `${corsProxyUrl}${lifeLossUrl}`;

    try {
      // Fetch the data from the proxy URL
      const response = await fetch(proxyUrl);
      const data = await response.text();

      // Extract the utilityDamFun object from the fetched data
      let life;
      eval(data);

      // Find the matching entries for over and under 65 based on occupancy and depth
      const matchingEntryOver65 = life[occupancy].find(
        (entry) => entry.floodDepth === depth && entry.age === "over 65"
      );

      const matchingEntryUnder65 = life[occupancy].find(
        (entry) => entry.floodDepth === depth && entry.age === "under 65"
      );

      if (matchingEntryOver65 || matchingEntryUnder65) {
        return {
          lifeLossOver65: parseInt(matchingEntryOver65.zone * peopleOver65),
          lifeLossUnder65: parseInt(matchingEntryUnder65.zone * peopleUnder65),
        };
      }
    } catch (error) {
      // If an error occurs during the data fetch, log the error and return null
      console.error("Error fetching utility damage data:", error);
      return null;
    }
  }

  /**
   * Fetches vehicle damage information based on flood depth and vehicle type.
   *
   * @method getVehicleDamage
   * @memberof floodDM
   * @async
   * @param {object} options - Options object containing parameters, arguments, and data.
   * @param {object} options.params - Parameters object (not used in this method).
   * @param {object} options.args - Arguments object containing floodDepth, vehicleType, vehicleCount, and vehicleValue.
   * @param {object} options.data - Additional data (not used in this method).
   * @returns {Promise<object|null>} A Promise resolving to an object containing damage and damage percentage, or null if an error occurs.
   */
  static async getVehicleDamage({ params, args, data } = {}) {
    const { floodDepth, vehicleType, vehicleCount, vehicleValue } = args;

    // Construct the URL for fetching vehicle damage data using the proxy
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const vehicleDamageUrl =
      "https://hydroinformatics.uiowa.edu/lab/fidas/data/functions/vehicle_function.js";
    const proxyUrl = `${corsProxyUrl}${vehicleDamageUrl}`;

    try {
      // Fetch the vehicle damage data using the proxy URL
      const response = await fetch(proxyUrl);
      const data = await response.text();

      // Parse the vehicle damage function data
      let vehicleDamFun;
      eval(data);

      // Find the matching entry based on flood depth and vehicle type
      const matchingEntry = vehicleDamFun[vehicleType].find(
        (entry) => entry.floodDepth === floodDepth
      );

      if (matchingEntry) {
        // If a matching entry is found, calculate damage and damage percentage
        const damagePercent = matchingEntry.damage;
        const damage = vehicleValue * (damagePercent / 100) * vehicleCount;

        return {
          damagePercent,
          damage: Math.round(damage),
        };
      } else {
        // If no matching entry is found, log a warning and return null
        console.warn(
          `No matching entry found for vehicleType: ${vehicleType} and floodDepth: ${floodDepth}`
        );
        return null;
      }
    } catch (error) {
      // If an error occurs during the data fetch, log the error and return null
      console.error("Error fetching vehicle damage data:", error);
      return null;
    }
  }

  // Helper function to add font style css classes to the page header
  static addFontStyle() {
    // Check if the style is already added
    if (!document.querySelector("#fontStyles")) {
      // Create a <style> element
      let style = document.createElement("style");
      style.id = "fontStyles"; // Assign an ID to identify the style element later

      // Add CSS rules to the <style> element
      let css = `
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap');

        .style_text_small_bold {
          font-family: "Roboto", "Arial", sans-serif;
          font-size: 12px;
          color: black;
          font-weight: 500;
        }
        .style_text_small {
          font-family: "Roboto", "Arial", sans-serif;
          font-size: 12px;
          color: rgb(86,86,86);
        }
        .style_text_large_bold {
          font-family: "Roboto", "Arial", sans-serif;
          font-size: 18px;
          color: black;
          font-weight: 500;
        }
        .style_text_large {
          font-family: "Roboto", "Arial", sans-serif;
          font-size: 18px;
          color: rgb(86,86,86);
        }`;

      style.appendChild(document.createTextNode(css));

      // Append the <style> element to the <head> of the document
      document.head.appendChild(style);
    }
  }

  // Helper Function to be used in maps to format how the pop up looks like
  popUpFormatter(objectName, objectData) {
    // Start with the object name, wrapped in the bold class
    let formattedOutput = `<span class="style_text_small_bold">${objectName}</span><br>`;

    // Iterate over the object's keys and values
    for (const [key, value] of Object.entries(objectData)) {
      // Append each key-value pair to the output, wrapped in the appropriate classes
      formattedOutput += `<span class="style_text_small">${key} :</span> <span class="style_text_small">${value}</span><br>`;
    }

    return formattedOutput;
  }

  // Helper function to format a number
  static formatNumber(number, isCurrency = false) {
    // If passed number is a string then convert it to a number type or to 0
    if (typeof number === "string") {
      number = parseFloat(number.replaceAll(",", ""));
    }
    if (isNaN(number)) {
      number = 0;
    }

    let number_absolute = Math.abs(number) 

    // Handle numbers less than 0.01
    if (number_absolute < 0.01) {
      number = 0;
    }

    // Define the suffixes for thousands and millions
    const suffixes = ["", "K", "M"];

    let suffixIndex = 0;
    let formattedNumber;
    // Handle numbers greater than or equal to 1,000,000 (use 'M' suffix)
    if (number_absolute >= 1_000_000) {
      suffixIndex = 2;
      number /= 1_000_000;
      formattedNumber = Number(number).toFixed(1);
    }
    // Handle numbers between 10,000 and 1,000,000 (use 'K' suffix)
    else if (number_absolute >= 10_000) {
      suffixIndex = 1;
      number /= 1_000;
      formattedNumber = Number(number).toFixed(1);
    } else {
      formattedNumber = Number(number).toPrecision(3);
      formattedNumber =
        Number(number) % 1 === 0
          ? Number(number).toFixed(0)
          : Number(number).toFixed(2);
    }

    // Format the number to two decimal places if needed
    /*if (isCurrency) {
      formattedNumber = Number(number).toFixed(2);
    } else if (suffixIndex > 0) {
      formattedNumber = Number(number).toPrecision(3);
    } else {
      formattedNumber =
        Number(number) % 1 === 0
          ? Number(number).toFixed(0)
          : Number(number).toFixed(2);
    }*/

    if (isNaN(formattedNumber)) {
      throw new Error("Assertion failed");
    }

    // Add comma as thousands separator if no suffix or isCurrency
    if (suffixIndex === 0) {
      formattedNumber = Number(formattedNumber).toLocaleString();
    }

    // Prepend the dollar sign for currency
    if (isCurrency) {
      formattedNumber = `$ ${formattedNumber}`;
    }

    // Append the appropriate suffix if needed
    formattedNumber += suffixes[suffixIndex];

    return formattedNumber;
  }
}
