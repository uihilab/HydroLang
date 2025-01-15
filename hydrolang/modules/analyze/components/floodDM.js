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
  static curvesDataCache = null;


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
    flood_layer = JSON.parse(flood_layer);


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
      utilities_layer = JSON.parse(utilities_layer);
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
    vehicles_layer = JSON.parse(vehicles_layer);

    // Retrieve the buildings layer based on the selected scenario
    let buildings_layer = await retrieve({
      params: {
        source: "flooddamage_dt",
        datatype: "buildings",
      },
      args: { sourceType: this.city },
    });
    // Convert data from the format 'varname={\n"key1": "val1", ....' to a javascript object
    buildings_layer = JSON.parse(buildings_layer);

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
    bridges_layer = JSON.parse(bridges_layer);

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
          // Get properties based on map type
          const properties = this.maptype === "google"
            ? (() => {
              const props = {};
              feature.forEachProperty((value, property) => props[property] = value);
              return props;
            })()
            : feature.properties;

          // Get scenario-specific depth and area
          const { flood100_avg, flood500_avg, area_fe_100yr, area_fe_500yr } = properties;
          const inundationDepth = this.scenario === "x100_year" ? flood100_avg : flood500_avg;
          const areaPrc = this.scenario === "x100_year" ? area_fe_100yr : area_fe_500yr;

          // Get damage percentages for each vehicle type
          const getVehicleDamage = (vehicleType) => {
            const entry = vehicleDamFun[vehicleType].find(
              item => item.floodDepth === inundationDepth
            );
            return entry?.damage || 0;
          };

          const damagePercentages = {
            car: getVehicleDamage("PassengerCar"),
            light: getVehicleDamage("LightTruck"),
            heavy: getVehicleDamage("HeavyTruck")
          };

          // Calculate damages for day and night
          const calculateDamage = (time) => {
            const damages = {
              car: (damagePercentages.car / 100) * areaPrc * properties[`car_val_${time}`],
              light: (damagePercentages.light / 100) * areaPrc * properties[`light_val_${time}`],
              heavy: (damagePercentages.heavy / 100) * areaPrc * properties[`heavy_val_${time}`]
            };

            return {
              formatted: {
                car: parseInt(damages.car).toLocaleString(),
                light: parseInt(damages.light).toLocaleString(),
                heavy: parseInt(damages.heavy).toLocaleString()
              },
              total: Object.values(damages).reduce((sum, val) => sum + val, 0)
            };
          };

          const dayDamage = calculateDamage('day');
          const nightDamage = calculateDamage('night');

          // Update scenario results
          if (!isNaN(dayDamage.total)) {
            scenario_results.Vehicles.Day += dayDamage.total;
          }
          if (!isNaN(nightDamage.total)) {
            scenario_results.Vehicles.Night += nightDamage.total;
          }

          // Store calculations for feature popup
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
            "Cars Damage (Day)": dayDamage.formatted.car,
            "Cars Damage (Night)": nightDamage.formatted.car,
            "Light Trucks (Day)": dayDamage.formatted.light,
            "Light Trucks (Night)": nightDamage.formatted.light,
            "Heavy Trucks (Day)": dayDamage.formatted.heavy,
            "Heavy Truck (Night)": nightDamage.formatted.heavy
          };

          // Return style based on total damage
          return {
            fillColor: dayDamage.total > 1000000 ? "#323232"
              : dayDamage.total > 100000 ? "#7E7E7E"
                : "#BFBFBF",
            weight: 2,
            opacity: 1,
            color: "black",
            dashArray: "3",
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: "black"
          };
        },

        // Set popup values based on feature properties
        popUpFunction: (feature) => {
          // Get properties based on map type
          const properties = this.maptype === "google"
            ? (() => {
              const props = {};
              feature.forEachProperty((value, property) => props[property] = value);
              return props;
            })()
            : feature.properties;

          const blockData = vehicleFeatureCalculations[properties.CensusBloc];
          const formattedAttributes = Object.entries(blockData).reduce((acc, [prop, value]) => {
            const isCurrencyField = [
              "Cars Damage (Day)", "Cars Damage (Night)",
              "Light Trucks (Day)", "Light Trucks (Night)",
              "Heavy Trucks (Day)", "Heavy Truck (Night)"
            ].includes(prop);

            const isBasicField = [
              "Block Information", "Flood Scenario:", "Avg. Flood Depth:"
            ].includes(prop);

            acc[prop] = isBasicField ? value
              : floodDM.formatNumber(value, isCurrencyField);
            return acc;
          }, {});

          return this.popUpFormatter("Vehicle Census Block", formattedAttributes);
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

    console.log('lifeLoss', lifeLoss)

    // Render Building Layer Calculations
    await Layers({
      args: {
        type: "geojson",
        name: "Properties Layer",

        // Set style based on feature properties
        styleFunction: (feature) => {
          // Get properties based on map type
          const properties = this.maptype === "google"
            ? (() => {
              const props = {};
              feature.forEachProperty((value, property) => props[property] = value);
              return props;
            })()
            : feature.properties;

          const { occupancy } = properties;
          const inundationDepth = scenario === "x100_year" ? properties.depth100 : properties.depth500;

          // Get property damage inputs
          const propertyInputs = buildingDamage[occupancy].find(
            item => item.floodDepth === inundationDepth
          );

          // Calculate all damages
          const damages = {
            structure: (properties.val_struct * propertyInputs.structure) / 100,
            content: (properties.val_cont * propertyInputs.content) / 100,
            income: (1 - propertyInputs.recapturFactor) * properties.sqfoot *
              propertyInputs.incomePerSqftPerDay * propertyInputs.maxTime * 30,
            wage: (1 - propertyInputs.recapturFactor) * properties.sqfoot *
              propertyInputs.wagePerSqftPerDay * propertyInputs.maxTime * 30
          };

          // Calculate relocation and rental costs
          const { relocation, rental } = (() => {
            if (propertyInputs.structure <= 10) return { relocation: 0, rental: 0 };

            const pctOwner = propertyInputs.percentOwnerOccupied / 100;
            const relocationCost = (1 - pctOwner) * propertyInputs.disruptionCostPerSqft +
              pctOwner * (propertyInputs.disruptionCostPerSqft +
                propertyInputs.rentalCostPerSqftPerDay * propertyInputs.maxTime * 30);

            const rentalCost = (1 - pctOwner) * propertyInputs.rentalCostPerSqftPerDay *
              propertyInputs.maxTime * 30;

            return {
              relocation: properties.sqfoot * relocationCost,
              rental: properties.sqfoot * rentalCost
            };
          })();

          damages.relocation = relocation;
          damages.rental = rental;

          const totalDamageBuild = Object.values(damages).reduce((sum, val) => sum + val, 0);

          // Update scenario results
          Object.entries({
            Structure: damages.structure,
            Content: damages.content,
            Income: damages.income,
            Wage: damages.wage,
            "Relocation Expenses": damages.relocation,
            "Rental Income": damages.rental
          }).forEach(([key, value]) => {
            if (!isNaN(value)) scenario_results.Buildings[key] += value;
          });

          // Calculate life loss
          const calculateLifeLoss = (age) => {
            const lifeInputs = lifeLoss[occupancy].find(item =>
              item.floodDepth === inundationDepth && item.age === age
            );
            return {
              day: lifeInputs.zone * properties[`POP_${age === "over 65" ? "O65DAY" : "U65DAY"}`],
              night: lifeInputs.zone * properties[`POP_${age === "over 65" ? "O65NGT" : "U65NGT"}`]
            };
          };

          const lifeLossOver65 = calculateLifeLoss("over 65");
          const lifeLossUnder65 = calculateLifeLoss("under 65");

          console.log('lifeLossOver65', lifeLossOver65)
          console.log('lifeLossUnder65', lifeLossUnder65)

          const lifeLoss = {
            day: lifeLossOver65.day + lifeLossUnder65.day,
            night: lifeLossOver65.night + lifeLossUnder65.night
          };

          // Update life loss in scenario results
          ["Day", "Night"].forEach(time => {
            if (!isNaN(lifeLoss[time.toLowerCase()])) {
              scenario_results.Buildings[`Loss of Life (${time})`] += lifeLoss[time.toLowerCase()];
            }
          });

          // Calculate debris damage
          const debrisValue = debrisLoss[occupancy].find(item =>
            item.floodDepth === inundationDepth && item.foundationType === "footing"
          );

          const debrisAmount = properties.sqfoot *
            (debrisValue.finishes + debrisValue.structure + debrisValue.foundation) / 1000;

          if (!isNaN(debrisAmount)) scenario_results.Buildings.Debris += debrisAmount;

          // Store calculations for popup
          buildingFeatureCalculations.push({
            occupancy,
            gid: properties.gid,
            totalDamageBuild,
            ...damages,
            debrisAmount,
            ...lifeLoss,
            inundationDepth
          });

          // Hide building if not inundated
          if ((scenario === "x100_year" && properties.depth100 < 1) ||
            (scenario === "x500_year" && properties.depth500 < 1)) {
            return { display: "none", color: "none", fillColor: "none" };
          }

          // Return style
          return {
            fillColor: totalDamageBuild > 1000000 ? "red"
              : totalDamageBuild > 100000 ? "yellow"
                : "green",
            weight: 2,
            opacity: 1,
            color: "black",
            fillOpacity: 1,
            radius: 4,
            scale: 3,
            strokeWeight: 0.7
          };
        },

        // Return the popup value based on feature properties
        popUpFunction: (feature) => {
          // Get properties based on map type
          const properties = this.maptype === "google"
            ? (() => {
              const props = {};
              feature.forEachProperty((value, property) => props[property] = value);
              return props;
            })()
            : feature.properties;

          const featureData = buildingFeatureCalculations.find(
            item => item.gid === properties.gid
          );

          const formattedAttributes = Object.entries(featureData).reduce((acc, [prop, value]) => {
            const isBasicField = ["gid", "inundationDepth", "occupancy"].includes(prop);
            const isCurrencyField = [
              "totalDamageBuild", "structure", "content", "income",
              "wage", "relocation", "rental"
            ].includes(prop);

            acc[prop] = isBasicField ? value
              : floodDM.formatNumber(value, isCurrencyField);
            return acc;
          }, {});

          return this.popUpFormatter("Building Information", formattedAttributes);
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
            // Get properties based on map type
            const properties = this.maptype === "google"
              ? (() => {
                const props = {};
                feature.forEachProperty((value, property) => props[property] = value);
                return props;
              })()
              : feature.properties;

            // Get bridge parameters
            const { bridgeT: bridgeType, ScourIndex: scour, Cost: bridgeCost, flood100, flood500 } = properties;
            const floodScenario = scenario === "x100_year" ? "100-year" : "500-year";

            // Determine inundation depth
            const inundationDepth = (() => {
              if (floodScenario === "100-yr" && flood100 === "yes") return "100 yr";
              if (floodScenario === "500-yr" && flood500 === "yes") return "500 yr";
              return null;
            })();

            // Calculate bridge damage
            const bridgeDamage = (() => {
              if (!inundationDepth) return 0;

              const damageEntry = bridgeDamFun[bridgeType].find(item =>
                item.ScourPotential === scour &&
                item["Flood Scenario"] === inundationDepth
              );

              return damageEntry ? damageEntry["damage prcnt"] * bridgeCost * 1000 : 0;
            })();

            // Update scenario results
            if (!isNaN(bridgeDamage)) {
              scenario_results.Bridges.Damage += bridgeDamage;
            }

            // Return bridge style
            return {
              scale: 5,
              radius: 2,
              weight: 10,
              fillColor: "black",
              color: "black",
              fillOpacity: 1,
              strokeWeight: 0.7
            };
          },

          // Bridge popup function
          popUpFunction: (feature) => {
            // Get properties based on map type
            const properties = this.maptype === "google"
              ? (() => {
                const props = {};
                feature.forEachProperty((value, property) => props[property] = value);
                return props;
              })()
              : feature.properties;

            // Get bridge parameters
            const {
              bridgeT: bridgeType,
              ScourIndex: scour,
              Cost: bridgeCost,
              flood100,
              flood500,
              HighwayBri: bridgeId
            } = properties;

            const floodScenario = scenario === "x100_year" ? "100-year" : "500-year";

            // Determine inundation depth
            const inundationDepth = (() => {
              if (floodScenario === "100-yr" && flood100 === "yes") return "100 yr";
              if (floodScenario === "500-yr" && flood500 === "yes") return "500 yr";
              return null;
            })();

            // Calculate bridge damage and get functional percentage
            const { damagePercent, bridgeDamage, functionalPercent } = (() => {
              if (!inundationDepth) return { damagePercent: 0, bridgeDamage: 0, functionalPercent: 0 };

              const damageEntry = bridgeDamFun[bridgeType].find(item =>
                item.ScourPotential === scour &&
                item["Flood Scenario"] === inundationDepth
              );

              return {
                damagePercent: damageEntry?.["damage prcnt"] || 0,
                bridgeDamage: (damageEntry?.["damage prcnt"] || 0) * bridgeCost * 1000,
                functionalPercent: damageEntry?.functional || 0
              };
            })();

            // Format attributes for popup
            const attributes = {
              Bridge_ID: bridgeId,
              Bridge_Type: bridgeType,
              Scour_Index: scour,
              Flood_Scenario: inundationDepth,
              Damage_Percentage: damagePercent * 100,
              Damage: parseInt(bridgeDamage).toLocaleString(),
              Functional_Percent: parseInt(functionalPercent * 100)
            };

            const formattedAttributes = Object.entries(attributes).reduce((acc, [prop, value]) => {
              const isBasicField = ["Bridge_ID", "Bridge_Type", "Scour_Index", "Flood_Scenario"].includes(prop);
              const isCurrencyField = prop === "Damage";

              acc[prop] = isBasicField ? value
                : floodDM.formatNumber(value, isCurrencyField);
              return acc;
            }, {});

            return this.popUpFormatter("Bridge Information", formattedAttributes);
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

          // Utilities style function
          styleFunction: (feature) => {
            // Get properties based on map type
            const properties = this.maptype === "google"
              ? (() => {
                const props = {};
                feature.forEachProperty((value, property) => props[property] = value);
                return props;
              })()
              : feature.properties;

            // Get utility parameters
            const {
              depth100,
              depth500,
              UtilFcltyC: utilitySystem,
              Cost: utilityCost
            } = properties;

            const inundationDepth = this.scenario === "x100_year" ? depth100 : depth500;

            // Calculate utility damage
            const { damagePercent, utilityType } = (() => {
              const damageEntry = utilityDamFun[utilitySystem].find(
                item => item.floodDepth === inundationDepth
              );

              return {
                damagePercent: damageEntry?.damage || 0,
                utilityType: damageEntry?.utilitySystem || ''
              };
            })();

            const utilityDamage = (damagePercent / 100) * utilityCost * 1000;

            // Update scenario results
            if (!isNaN(utilityDamage)) {
              scenario_results.Utilities.Damage += utilityDamage;
            }

            // Return utility style
            return {
              scale: 5,
              radius: 2,
              weight: 10,
              fillColor: "#ffa500",
              color: "#ffa500",
              fillOpacity: 0.8,
              strokeWeight: 0.7
            };
          },

          // Utilities popup function
          popUpFunction: (feature) => {
            // Get properties based on map type
            const properties = this.maptype === "google"
              ? (() => {
                const props = {};
                feature.forEachProperty((value, property) => props[property] = value);
                return props;
              })()
              : feature.properties;

            // Get utility parameters
            const {
              depth100,
              depth500,
              UtilFcltyC: utilitySystem,
              Cost: utilityCost,
              WasteWater: utilityId
            } = properties;

            const inundationDepth = this.scenario === "x100_year" ? depth100 : depth500;

            // Calculate utility damage
            const { damagePercent, utilityType } = (() => {
              const damageEntry = utilityDamFun[utilitySystem].find(
                item => item.floodDepth === inundationDepth
              );

              return {
                damagePercent: damageEntry?.damage || 0,
                utilityType: damageEntry?.utilitySystem || ''
              };
            })();

            const utilityDamage = (damagePercent / 100) * utilityCost * 1000;

            // Format attributes for popup
            const attributes = {
              "Utility ID": utilityId,
              "Utility Type": utilityType,
              "Flood depth": inundationDepth,
              "Damage": parseInt(utilityDamage)
            };

            const formattedAttributes = Object.entries(attributes).reduce((acc, [prop, value]) => {
              const isBasicField = ["Utility ID", "Utility Type", "Flood depth"].includes(prop);
              acc[prop] = isBasicField ? value
                : floodDM.formatNumber(value, true);
              return acc;
            }, {});

            return this.popUpFormatter("Utility Information", formattedAttributes);
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
          `position: fixed !important;  top: ${document.getElementById('map').offsetTop + 150}px; left: ${document.getElementById('map').offsetLeft + 400}px; display: block;`,
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
    city_damage_div.style.cssText = `position: fixed; width: fit-content; z-index:2000; top: ${document.getElementById("map").offsetTop + 150}px; left: ${document.getElementById("map").offsetLeft + 400}px; display: block;`

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
      top: "15px",
      right: "15px",
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
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
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

      // Get the initial position of the element
      const rect = elmnt.getBoundingClientRect();

      console.log('rect', rect)

      // Calculate the offset between mouse position and element position
      pos3 = e.clientX - rect.left;
      pos4 = e.clientY - rect.top;

      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();

      // Calculate new position while maintaining offset
      const newLeft = e.clientX - pos3;
      const newTop = e.clientY - pos4;

      // Set the element's new position
      elmnt.style.left = newLeft + 'px';
      elmnt.style.top = newTop + 'px';
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
      window.location.origin + "/hydrolang/modules/data/dm_datasources/flooddamage_dt/functions/business_str_cnt_inputs.json";
    const proxyUrl = `${corsProxyUrl}${propertyLossesUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let propertyLosses = await response.text();
      return JSON.parse(propertyLosses);
    } catch (error) {
      console.error("Error fetching property losses data:", error);
      return null;
    }
  }

  // Helper function for initDamageScenario for life loss by depth
  static async getLifeLossFunction({ params, args, data } = {}) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const lifeLossesUrl =
      window.location.origin + "/hydrolang/modules/data/dm_datasources/flooddamage_dt/functions/life_inputs.json";
    const proxyUrl = `${corsProxyUrl}${lifeLossesUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let life = await response.text();
      return JSON.parse(life);
    } catch (error) {
      console.error("Error fetching life losses data:", error);
      return null;
    }
  }

  //  Helper function for initDamageScenario for debris loss by depth and property type
  static async getDebrisWeightFunction({ params, args, data } = {}) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const debrisUrl =
      window.location.origin + "/hydrolang/modules/data/dm_datasources/flooddamage_dt/functions/debris_weight.json";
    const proxyUrl = `${corsProxyUrl}${debrisUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let debris = await response.text();
      return JSON.parse(debris);
    } catch (error) {
      console.error("Error fetching debris weight data:", error);
      return null;
    }
  }

  //  Helper function for initDamageScenario for bridge loss by depth
  static async getBridgeDamageFunction({ params, args, data } = {}) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const debrisUrl =
      window.location.origin + "/hydrolang/modules/data/dm_datasources/flooddamage_dt/functions/bridge_function.json";
    const proxyUrl = `${corsProxyUrl}${debrisUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let bridgeDamFun = await response.text();
      return JSON.parse(bridgeDamFun);
    } catch (error) {
      console.error("Error fetching debris weight data:", error);
      return null;
    }
  }

  //  Helper function for initDamageScenario for vehicle loss by depth
  static async getVehicleDamageFunction({ params, args, data } = {}) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const debrisUrl =
      window.location.origin + "/hydrolang/modules/data/dm_datasources/flooddamage_dt/functions/vehicle_function.json";
    const proxyUrl = `${corsProxyUrl}${debrisUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let vehicleDamFun = await response.text();
      return JSON.parse(vehicleDamFun);
    } catch (error) {
      console.error("Error fetching debris weight data:", error);
      return null;
    }
  }

  //  Helper function for initDamageScenario for utility loss by depth
  static async getUtilityDamageFunction({ params, args, data } = {}) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const debrisUrl =
      window.location.origin + "/hydrolang/modules/data/dm_datasources/flooddamage_dt/functions/utility_function.json";
    const proxyUrl = `${corsProxyUrl}${debrisUrl}`;

    try {
      const response = await fetch(proxyUrl);
      let utilityDamFun = await response.text();

      return JSON.parse(utilityDamFun);
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
    city_damage_div.style.cssText('position: absolute;')

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
      },
    });

    let city_damage_div2 = document.getElementById(
      "property-mitigation-scenario"
    );

    city_damage_div2.appendChild(city_damage_table);
    floodDM.appendCloseButton(city_damage_div2);
    floodDM.dragElement(city_damage_div2);
    document.body.appendChild(city_damage_div2);
    city_damage_div2.style.cssText = `
          position: absolute; float: left; top: 200px; left: 50px; display: block;`

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

    const debrisUrl = window.location.origin + `/hydrolang/modules/data/dm_datasources/mitigation_dt/${cityname}.json`;
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

    // Enhanced base table styling
    table.style.cssText = `
      border-collapse: collapse;
      background-color: white;
      border-spacing: 0;
      border: none;
      border-radius: 6px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      width: auto;
      margin: 8px;
      overflow: hidden;
      table-layout: fixed;
      font-size: 11px;
      zIndex: 200;
      line-height: 1;
    `;
    table.classList.add("style_text_large_bold");

    // Add table header row if tableHeaderText is provided
    if (tableHeaderText !== null && depth === 0) {
      const headerRow = table.insertRow();
      const headerCell = headerRow.insertCell();
      headerCell.textContent = tableHeaderText;
      headerCell.colSpan = 2;
      headerCell.classList.add("style_text_large_bold", "header-row");

      // Enhanced header styling
      headerCell.style.cssText = `
        background-color: #2c3e50;
        color: white;
        padding: 6px 10px;
        text-align: center;
        font-size: 13px;
        cursor: move;
        border-bottom: 2px solid #34495e;
        user-select: none;
        line-height: 1.2;
      `;
    }

    // Loop through the object keys
    for (const key in obj) {
      const row = table.insertRow();

      // Zebra striping for rows
      if (depth === 0) {
        row.style.backgroundColor = table.rows.length % 2 === 0 ? '#f8f9fa' : 'white';
      }

      // Insert and style key cell
      const keyCell = row.insertCell();
      keyCell.textContent = key;
      keyCell.classList.add("style_text_small_bold");
      keyCell.style.cssText = `
        padding: 4px 10px;
        min-width: 100px;
        color: #2c3e50;
        font-weight: 500;
        border-bottom: 1px solid #eee;
        line-height: 1.1;
      `;

      // Insert and style value cell
      const valueCell = row.insertCell();
      valueCell.classList.add("style_text_small");

      // Handle nested objects
      if (typeof obj[key] === "object" && obj[key] !== null) {
        valueCell.style.padding = "0";
        const nestedTable = floodDM.createTableFromObject({
          args: {
            obj: obj[key],
            depth: depth + 1,
            showHeader: true
          }
        });

        // Style nested tables
        nestedTable.style.cssText = `
          margin: 0;
          width: 100%;
          box-shadow: none;
          border-radius: 0;
          background-color: ${depth === 0 ? '#f8f9fa' : 'white'};
        `;

        valueCell.appendChild(nestedTable);
      } else {
        valueCell.textContent = obj[key];
        valueCell.style.cssText = `
          padding: 4px 10px;
          color: #505050;
          border-bottom: 1px solid #eee;
          text-align: right;
          line-height: 1.1;
        `;
      }

      // Add hover effect for rows
      row.addEventListener('mouseover', () => {
        if (depth === 0) {
          row.style.backgroundColor = '#f0f2f5';
        }
      });
      row.addEventListener('mouseout', () => {
        if (depth === 0) {
          row.style.backgroundColor = table.rows.length % 2 === 0 ? '#f8f9fa' : 'white';
        }
      });
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
  static async buildPropertyDMScenario({ params, args } = {}) {
    // Get required parameters
    const { occupancy, structuralValue, contentValue, buildingArea } = params;
    const { floodDepth, mitigationMeasure, mitigationDepth, foundationType } = args;

    // Initialize result with base properties
    const result = {
      occupancy,
      structuralValue,
      contentValue,
      buildingArea
    };

    // Return early if floodDepth is not a number
    if (typeof floodDepth !== "number") {
      return floodDM.formatResultValues(result);
    }

    // Calculate damage
    const damageData = await floodDM.fetchCurvesData(occupancy, floodDepth);
    const losses = floodDM.calculateLosses(structuralValue, contentValue, damageData);

    // Add flood data to result
    Object.assign(result, {
      floodDepth,
      structuralLoss: losses.structuralLoss,
      contentLoss: losses.contentLoss
    });

    // Add mitigation options if requested
    if (mitigationDepth && mitigationMeasure) {
      result.mitigationOptions = await floodDM.getMitigationOptions(
        foundationType,
        mitigationMeasure,
        mitigationDepth,
        buildingArea,
        result
      );
    }

    return floodDM.formatResultValues(result);
  }

  // Helper function to format result values
  static formatResultValues(result) {
    const formattedResult = { ...result };

    // Format monetary values
    ['structuralValue', 'contentValue', 'structuralLoss', 'contentLoss'].forEach(key => {
      if (key in formattedResult) {
        formattedResult[key] = floodDM.formatNumber(formattedResult[key], true);
      }
    });

    // Format area
    if ('buildingArea' in formattedResult) {
      formattedResult.buildingArea = floodDM.formatNumber(formattedResult.buildingArea);
    }

    // Format mitigation options if present
    if (formattedResult.mitigationOptions) {
      formattedResult.mitigationOptions = {
        ...formattedResult.mitigationOptions,
        cost: floodDM.formatNumber(formattedResult.mitigationOptions.cost, true),
        benefit: floodDM.formatNumber(formattedResult.mitigationOptions.benefit, true)
      };
    }

    return formattedResult;
  }

  static async getMitigationOptions(foundationType, mitigationMeasure, mitigationDepth, buildingArea, result) {
    // Get mitigation data from cache or fetch new
    const mitigationData = floodDM.mitigationDataCache || await retrieve({
      params: {
        source: "mitigation_dt",
        datatype: 'property_mitigation_cost',
      },
      args: { sourceType: 'property_mitigation_cost' },
    });

    // Cache the data for future use
    if (!floodDM.mitigationDataCache) {
      floodDM.mitigationDataCache = mitigationData;
    }

    // Return early if no data available
    if (!mitigationData) {
      return { error: "Failed to fetch mitigation data" };
    }

    // Find matching mitigation option
    const option = mitigationData.mitigation_options.find(opt => {
      if (mitigationMeasure === "Wet Floodproofing") {
        return mitigationDepth === opt.design;
      }
      return mitigationMeasure === opt.measure &&
        (foundationType === opt.foundation_type || mitigationDepth === opt.design);
    });

    if (!option) return null;

    // Calculate costs and benefits with raw numbers
    const { cost, benefit } = floodDM.calculateMitigationValues(
      option,
      buildingArea,
      result.floodDepth,
      mitigationDepth,
      result.structuralLoss,
      result.contentLoss,
      mitigationMeasure
    );

    // Return raw values - formatting will be done later
    return {
      measure: mitigationMeasure,
      foundationType,
      cost,
      benefit
    };
  }

  static async fetchCurvesData(occupancy, floodDepth) {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const curvesUrl = window.location.origin + "/hydrolang/modules/data/dm_datasources/mitigation_dt/curves.json";

    let data, response;
    if (!floodDM.curvesDataCache) {
      response = await fetch(`${corsProxyUrl}${curvesUrl}`);
      data = await response.json();
      floodDM.curvesDataCache = data
    } else {
      data = floodDM.curvesDataCache
    }

    // Find matching occupancy data
    const occupancyData = data.curves.filter(curve =>
      curve.occupancy === occupancy &&
      curve.depth === floodDepth.toString()
    );

    // Return closest depth match
    return occupancyData.reduce((prev, curr) =>
      Math.abs(curr.depth - floodDepth) < Math.abs(prev.depth - floodDepth)
        ? curr
        : prev
    );
  }

  static calculateLosses(structuralValue, contentValue, damageData) {
    const calculateDamage = (value, damagePercent) =>
      Math.round((value * damagePercent / 100) / 1000) * 1000;

    return {
      structuralLoss: calculateDamage(structuralValue, damageData.struct_dam_per),
      contentLoss: calculateDamage(contentValue, damageData.cont_dam_per)
    };
  }

  static async fetchMitigationData() {
    const corsProxyUrl = proxies["local-proxy"]["endpoint"];
    const mitigationUrl = window.location.origin + "/hydrolang/modules/data/dm_datasources/mitigation_dt/mitigations.json";

    try {
      const response = await fetch(`${corsProxyUrl}${mitigationUrl}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching mitigation data:", error);
      return null;
    }
  }

  // Helper function to calculate mitigation costs and benefits
  static calculateMitigationValues(option, area, floodDepth, mitigationDepth, structuralLoss, contentLoss, measure) {
    const isLinearApplication = option.app_type === "linear";
    const perimeter = Math.sqrt(area);

    // Calculate base cost
    const cost = Math.round(
      (isLinearApplication ? 4 * perimeter : area) *
      option.cost / 1000
    ) * 1000;

    // Calculate benefit based on mitigation effectiveness
    let benefit;
    if (mitigationDepth < floodDepth) {
      benefit = -cost - structuralLoss - contentLoss;
    } else {
      benefit = measure === "Wet Floodproofing"
        ? structuralLoss - cost
        : structuralLoss + contentLoss - cost;
    }

    return {
      cost,
      benefit: Math.round(benefit / 1000) * 1000
    };
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
      window.location.origin + "/hydrolang/modules/data/dm_datasources/flooddamage_dt/functions/bridge_function.json";
    const proxyUrl = `${corsProxyUrl}${bridgeDamageUrl}`;

    try {
      // Fetch the data from the proxy URL
      const response = await fetch(proxyUrl);
      const data = await response.text();

      // Extract the bridgeDamFun object from the fetched data
      let bridgeDamFun = JSON.parse(data);

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
        const functionalCost = replacement_value * (1 - matchingEntry["functional"]);

        return {
          damagePercent: matchingEntry["damage prcnt"],
          damageCost: Math.round(damageCost),
          functionalPercent: matchingEntry["functional"],
          functionalValue: Math.round(functionalCost)
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
      window.location.origin + "/hydrolang/modules/data/dm_datasources/flooddamage_dt/functions/utility_function.json"
    const proxyUrl = `${corsProxyUrl}${utilityDamageUrl}`;

    try {
      // Fetch the data from the proxy URL
      const response = await fetch(proxyUrl);
      const data = await response.text();

      // Extract the utilityDamFun object from the fetched data
      let utilityDamFun = JSON.parse(data);

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

    let propertyLossesUrl =
      window.location.origin + "/hydrolang/modules/data/dm_datasources/flooddamage_dt/functions/business_str_cnt_inputs.json";
    let debrisUrl =
      window.location.origin + "/hydrolang/modules/data/dm_datasources/flooddamage_dt/functions/debris_weight.json";

    let [propertyLossesData, debrisData] = await Promise.all([
      fetch(`${corsProxyUrl}${propertyLossesUrl}`).then((response) =>
        response.text()
      ),
      fetch(`${corsProxyUrl}${debrisUrl}`).then((response) => response.text()),
    ]);

    propertyLossesData = JSON.parse(propertyLossesData)
    debrisData = JSON.parse(debrisData)

    const propertyLossEntry = propertyLossesData[occupancy].find(
      (entry) => entry.floodDepth === depth
    );
    const debrisEntry = debrisData[occupancy].find(
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
      window.location.origin + "/hydrolang/modules/data/dm_datasources/flooddamage_dt/functions/life_inputs.json";
    const proxyUrl = `${corsProxyUrl}${lifeLossUrl}`;

    try {
      // Fetch the data from the proxy URL
      const response = await fetch(proxyUrl);
      const data = await response.text();

      // Extract the utilityDamFun object from the fetched data
      let life = JSON.parse(data);

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
    const vehicleDamageUrl = window.location.origin + "/hydrolang/modules/data/dm_datasources/flooddamage_dt/functions/vehicle_function.json";

    const proxyUrl = `${corsProxyUrl}${vehicleDamageUrl}`;

    try {
      // Fetch the vehicle damage data using the proxy URL
      const response = await fetch(proxyUrl);
      const data = await response.text();

      // Parse the vehicle damage function data
      let vehicleDamFun = JSON.parse(data);

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
    if (!document.querySelector("#fontStyles")) {
      let style = document.createElement("style");
      style.id = "fontStyles";

      let css = `
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;0,700;0,900&display=swap');

        .style_text_small_bold {
          font-family: "Roboto", sans-serif;
          font-size: 11px;
          color: #2c3e50;
          font-weight: 500;
          letter-spacing: 0.2px;
          line-height: 1.1;
        }
        
        .style_text_small {
          font-family: "Roboto", sans-serif;
          font-size: 11px;
          color: #505050;
          font-weight: 400;
          line-height: 1.1;
        }
        
        .style_text_large_bold {
          font-family: "Roboto", sans-serif;
          font-size: 13px;
          color: #2c3e50;
          font-weight: 500;
          letter-spacing: 0.3px;
          line-height: 1.2;
        }
        
        .style_text_large {
          font-family: "Roboto", sans-serif;
          font-size: 13px;
          color: #505050;
          font-weight: 400;
          line-height: 1.2;
        }

        /* Animation for hover effects */
        @keyframes fadeIn {
          from { background-color: transparent; }
          to { background-color: #f0f2f5; }
        }
      `;

      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);
    }
  }

  // Helper Function to be used in maps to format how the pop up looks like
  popUpFormatter(objectName, objectData) {
    return [
      `<span class="style_text_small_bold">${objectName}</span><br>`,
      ...Object.entries(objectData).map(([key, value]) =>
        `<span class="style_text_small">${key} :</span> <span class="style_text_small">${value}</span><br>`
      )
    ].join('');
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
