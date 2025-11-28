/**
 * Extends the data sources on the framework to the data module.
 * @namespace datasources
 */

import usgs from "./datasources/usgs.js";
import fema from "./datasources/fema.js";
import noaa from "./datasources/noaa.js";
import worldbank from "./datasources/worldbank.js";
import meteostat from "./datasources/meteostat.js";
import aemet from "./datasources/aemet.js";
import eauk from "./datasources/eauk.js";
import meteoit from "./datasources/meteoit.js";
import ifis from "./datasources/ifis.js";
import clearcreek from "./datasources/clearcreek.js";
import epa from "./datasources/epa.js";
import { waterOneFlow, hydroShare, hisCentral } from "./datasources/cuahsi.js";
import proxies from "./datasources/proxy.js";
import envelope from "./datasources/soapEnv.js";
import nws from "./datasources/nws.js"
import nws_prediction from "./datasources/nwps.js"
import wqp from "./datasources/wqp.js"
import mitigation_dt from "./datasources/mitigation_dt.js"
import flooddamage_dt from "./datasources/flooddamage_dt.js"
import ECMWF from "./datasources/ecmwf.js"
import hrrr from "./datasources/hrrr.js"
import drought from "./datasources/drought.js"
import nasapower from "./datasources/nasapower.js"
import nldi from "./datasources/nldi.js"
import nldas from "./datasources/nldas.js"
import aorc from "./datasources/aorc.js"
import nwm from "./datasources/nwm.js"
import nhdplus from "./datasources/nhdplus.js";
import mrms from "./datasources/mrms.js"
import threedep from "./datasources/threedep.js"
import prism from "./datasources/prism.js"
import bmkg from "./datasources/bmkg.js"
import cma from "./datasources/cma.js"
import dwd from "./datasources/dwd.js"
import imd from "./datasources/imd.js"
import jma from "./datasources/jma.js"
import kma from "./datasources/kma.js"
import knmi from "./datasources/knmi.js"
import meteofrance from "./datasources/meteofrance.js"
import metno from "./datasources/metno.js"
import smhi from "./datasources/smhi.js"
import tmd from "./datasources/tmd.js"
import wbd from "./datasources/wbd.js"






export {
  usgs,
  fema,
  noaa,
  worldbank,
  meteostat,
  aemet,
  eauk,
  meteoit,
  ifis,
  clearcreek,
  epa,
  waterOneFlow,
  hydroShare,
  hisCentral,
  proxies,
  envelope,
  nws,
  wqp,
  mitigation_dt,
  flooddamage_dt,
  nws_prediction,
  ECMWF,
  hrrr,
  drought,
  nasapower,
  nldi,
  nldas,
  nwm,
  mrms,
  aorc,
  threedep,
  prism,
  nhdplus,
  bmkg,
  cma,
  dwd,
  imd,
  jma,
  kma,
  knmi,
  meteofrance,
  metno,
  smhi,
  tmd,
  wbd,
};
