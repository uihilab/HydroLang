/**
 * Extends the data sources on the framework to the data module.
 * @module datasources
 * @extends usgs
 * @extends fema
 * @extends noaa
 * @extends worldbank
 * @extends meteostat
 * @extends aemet
 * @extends eauk
 * @extends meteoit
 */

import usgs from "./datasources/usgs.js";
import fema from "./datasources/fema.js";
import noaa from "./datasources/noaa.js";
import worldbank from "./datasources/worldbank.js";
import meteostat from "./datasources/meteostat.js";
import aemet from "./datasources/aemet.js";
import eauk from "./datasources/eauk.js";
import meteoit from "./datasources/meteoit.js";

export { usgs, fema, noaa, worldbank, meteostat, aemet, eauk, meteoit };
